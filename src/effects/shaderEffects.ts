import p5 from 'p5';

export enum EffectType {
  OFF = 'off',
  BLUR = 'blur',
  WAVES = 'waves',
  DISPLACEMENT = 'displacement',
  DEBUG_NORMAL = 'debug_normal',
}

export enum LayerType {
  BACKGROUND = 'background',
  FOREGROUND = 'foreground',
}

export interface EffectConfig {
  type: EffectType;
  layer?: LayerType;
  intensity?: number;
}

export class ShaderEffects {
  private wavesShader: p5.Shader | null = null;
  private displacementShader: p5.Shader | null = null;
  private normalMapGraphics: p5.Graphics | null = null;

  apply(p: p5, config: EffectConfig): void {
    switch (config.type) {
      case EffectType.OFF:
        // No effect applied
        break;
      case EffectType.BLUR:
        this.applyBlur(p, config.intensity || 1);
        break;
      case EffectType.WAVES:
        this.applyWaves(p, config.intensity || 1);
        break;
      case EffectType.DISPLACEMENT:
        this.applyDisplacement(p, config.intensity || 1);
        break;
      case EffectType.DEBUG_NORMAL:
        this.showNormalMap(p);
        break;
    }
  }

  private applyBlur(p: p5, intensity: number): void {
    // Simple blur effect using p5.js filter
    p.filter(p.BLUR, intensity);
  }

  private applyWaves(p: p5, intensity: number): void {
    // Create shader if it doesn't exist
    if (!this.wavesShader) {
      const vertSource = `
        attribute vec3 aPosition;
        attribute vec2 aTexCoord;
        uniform mat4 uProjectionMatrix;
        uniform mat4 uModelViewMatrix;
        varying vec2 vTexCoord;
        
        void main() {
          vTexCoord = aTexCoord;
          vec4 positionVec4 = vec4(aPosition, 1.0);
          
          // Use p5.js transformation matrices to properly convert from p5.js coordinate space
          // (center-origin: -width/2 to width/2) to WebGL clip space (-1 to 1).
          // Without these matrices, the shader would bypass p5.js coordinate system entirely,
          // causing texture mapping and viewport issues.
          gl_Position = uProjectionMatrix * uModelViewMatrix * positionVec4;
        }
      `;

      const fragSource = `
        precision highp float;

        uniform sampler2D tex0;
        uniform float intensity;
        uniform float time;
        varying vec2 vTexCoord;

        void main() {
          // Flip the y coordinate to correct upside-down rendering
          vec2 flippedCoord = vec2(vTexCoord.x, 1.0 - vTexCoord.y);

          // Animated wave distortion with time-varying frequency and phase
          vec2 warpedCoord = flippedCoord;
          float timeOffset = time * 2.0;
          float freq1 = 8.0 + 4.0 * sin(time * 0.8);
          float freq2 = 12.0 + 3.0 * cos(time * 1.2);
          
          warpedCoord.x += intensity * 0.04 * sin(flippedCoord.y * freq1 + timeOffset);
          warpedCoord.y += intensity * 0.04 * sin(flippedCoord.x * freq2 + timeOffset * 0.7);
          
          // Add secondary wave for more complex motion
          warpedCoord.x += intensity * 0.02 * cos(flippedCoord.y * freq2 * 0.5 - timeOffset);
          warpedCoord.y += intensity * 0.02 * cos(flippedCoord.x * freq1 * 0.5 - timeOffset * 0.5);

          // Set the new color by looking up the warped coordinate
          gl_FragColor = texture2D(tex0, warpedCoord);
        }
      `;

      this.wavesShader = p.createShader(vertSource, fragSource);

      // Check for shader compilation errors
      if (!this.wavesShader) {
        console.error('Failed to create waves shader');
        return;
      }
    }

    if (!this.wavesShader) return;

    // Create a copy of the current canvas as a texture
    const canvasTexture = p.get();

    // Clear the canvas and apply the wave distortion shader
    p.clear();
    p.shader(this.wavesShader);
    this.wavesShader.setUniform('tex0', canvasTexture);
    this.wavesShader.setUniform('intensity', intensity);
    this.wavesShader.setUniform('time', p.millis() * 0.001);

    // Draw fullscreen quad that covers the entire canvas
    p.push();
    p.noStroke();
    p.fill(255);

    // Use p.plane() which creates a proper fullscreen quad with correct texture coordinates
    p.plane(p.width, p.height);

    p.pop();

    // Reset shader
    p.resetShader();
  }

  private applyDisplacement(p: p5, intensity: number): void {
    // Create shader if it doesn't exist
    if (!this.displacementShader) {
      const vertSource = `
        attribute vec3 aPosition;
        attribute vec2 aTexCoord;
        uniform mat4 uProjectionMatrix;
        uniform mat4 uModelViewMatrix;
        varying vec2 vTexCoord;
        
        void main() {
          vTexCoord = aTexCoord;
          vec4 positionVec4 = vec4(aPosition, 1.0);
          
          // Use p5.js transformation matrices to properly convert from p5.js coordinate space
          // (center-origin: -width/2 to width/2) to WebGL clip space (-1 to 1).
          gl_Position = uProjectionMatrix * uModelViewMatrix * positionVec4;
        }
      `;

      const fragSource = `
        precision highp float;

        uniform sampler2D tex0;
        uniform sampler2D normalMap;
        uniform float intensity;
        varying vec2 vTexCoord;

        void main() {
          vec2 uv = vTexCoord;
          
          // Flip the y coordinate to correct upside-down rendering
          vec2 flippedCoord = vec2(uv.x, 1.0 - uv.y);
          
          // Sample the normal map
          vec3 normal = texture2D(normalMap, flippedCoord).rgb;
          
          // Convert normal from [0,1] to [-1,1] range
          normal = normal * 2.0 - 1.0;
          
          // Use normal to offset texture coordinates
          vec2 offset = normal.xy * intensity * 0.05;
          
          // Sample the original texture with offset coordinates
          vec2 displacedUV = flippedCoord + offset;
          
          // Ensure UV coordinates stay within bounds
          displacedUV = clamp(displacedUV, 0.0, 1.0);
          
          vec4 color = texture2D(tex0, displacedUV);
          gl_FragColor = color;
        }
      `;

      this.displacementShader = p.createShader(vertSource, fragSource);

      // Check for shader compilation errors
      if (!this.displacementShader) {
        console.error('Failed to create displacement shader');
        return;
      }
    }

    if (!this.displacementShader) return;

    // Generate normal map BEFORE activating shader
    const normalMap = this.generateStaticNormalMap(p);

    // Create a copy of the current canvas as a texture
    const canvasTexture = p.get();

    // Clear the canvas and apply the displacement shader
    p.clear();
    p.shader(this.displacementShader);
    this.displacementShader.setUniform('tex0', canvasTexture);
    this.displacementShader.setUniform('normalMap', normalMap);
    this.displacementShader.setUniform('intensity', intensity);

    // Draw fullscreen quad that covers the entire canvas
    p.push();
    p.noStroke();
    p.fill(255);

    // Use p.plane() which creates a proper fullscreen quad with correct texture coordinates
    p.plane(p.width, p.height);

    p.pop();

    // Reset shader
    p.resetShader();
  }

  private showNormalMap(p: p5): void {
    // Generate the checker normal map
    const normalMap = this.generateStaticNormalMap(p);

    // Clear canvas and display the normal map directly
    p.clear();
    p.push();
    p.translate(-p.width / 2, -p.height / 2);
    p.image(normalMap, 0, 0, p.width, p.height);
    p.pop();
  }

  private generateStaticNormalMap(p: p5): p5.Graphics {
    // Create an animated checker pattern for displacement
    const mapWidth = 64;
    const mapHeight = 80;

    // Create graphics object only once and reuse it
    if (!this.normalMapGraphics) {
      this.normalMapGraphics = p.createGraphics(mapWidth, mapHeight);
      this.normalMapGraphics.pixelDensity(1);
    }

    this.normalMapGraphics.loadPixels();

    // Animate the checker pattern with rotation and scale
    const time = p.millis() * 0.001;
    const rotation = time * 0.3; // Slow rotation
    const scale = 8 + 2 * Math.sin(time * 0.5); // Breathing scale effect

    const centerX = mapWidth * 0.5;
    const centerY = mapHeight * 0.5;
    const cosR = Math.cos(rotation);
    const sinR = Math.sin(rotation);

    for (let x = 0; x < mapWidth; x++) {
      for (let y = 0; y < mapHeight; y++) {
        // Apply rotation around center
        const dx = x - centerX;
        const dy = y - centerY;
        const rotX = dx * cosR - dy * sinR + centerX;
        const rotY = dx * sinR + dy * cosR + centerY;

        // Create animated checkerboard pattern
        const checkerX = Math.floor(rotX / scale);
        const checkerY = Math.floor(rotY / scale);
        const isCheckered = (checkerX + checkerY) % 2 === 0;

        let normalX = 128; // Neutral
        let normalY = 128; // Neutral
        const normalZ = 255; // Always pointing up

        if (isCheckered) {
          // Animate the normal direction based on time
          const intensity = 0.3 + 0.2 * Math.sin(time * 1.5);
          normalX = 128 - intensity * 56; // Push normals left
          normalY = 128 - intensity * 56; // Push normals down
        } else {
          // Counter-animate for opposite squares
          const intensity = 0.3 + 0.2 * Math.cos(time * 1.5);
          normalX = 128 + intensity * 56; // Push normals right
          normalY = 128 + intensity * 56; // Push normals up
        }

        const index = (y * mapWidth + x) * 4;
        this.normalMapGraphics.pixels[index] = Math.round(normalX);
        this.normalMapGraphics.pixels[index + 1] = Math.round(normalY);
        this.normalMapGraphics.pixels[index + 2] = normalZ;
        this.normalMapGraphics.pixels[index + 3] = 255;
      }
    }

    this.normalMapGraphics.updatePixels();
    return this.normalMapGraphics;
  }

  // Cleanup method to dispose of WebGL resources
  dispose(): void {
    if (this.normalMapGraphics) {
      // Note: p5.js doesn't provide a direct dispose method for graphics
      // but we can at least clear our reference
      this.normalMapGraphics = null;
    }
  }
}
