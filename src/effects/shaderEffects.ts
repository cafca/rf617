import p5 from 'p5';

export enum EffectType {
  OFF = 'off',
  BLUR = 'blur',
  WAVES = 'waves',
  DISPLACEMENT = 'displacement',
  DEBUG_NORMAL = 'debug_normal',
}

export interface EffectConfig {
  type: EffectType;
  intensity?: number;
  normalType?: 'checker' | 'perlin';
}

export class ShaderEffects {
  private wavesShader: p5.Shader | null = null;
  private displacementShader: p5.Shader | null = null;

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
        this.applyDisplacement(
          p,
          config.intensity || 1,
          config.normalType || 'checker'
        );
        break;
      case EffectType.DEBUG_NORMAL:
        this.showNormalMap(p, config.normalType || 'checker');
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
        varying vec2 vTexCoord;

        void main() {
          // Flip the y coordinate to correct upside-down rendering
          vec2 flippedCoord = vec2(vTexCoord.x, 1.0 - vTexCoord.y);

          // Offset the input coordinate with wave distortion
          vec2 warpedCoord = flippedCoord;
          warpedCoord.x += intensity * 0.05 * sin(flippedCoord.y * 10.0);
          warpedCoord.y += intensity * 0.05 * sin(flippedCoord.x * 10.0);

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

    // Create a copy of the current canvas as a texture using get()
    const canvasTexture = p.get();

    // Clear the canvas and apply the wave distortion shader
    p.clear();
    p.shader(this.wavesShader);
    this.wavesShader
      .setUniform('tex0', canvasTexture)
      .setUniform('intensity', intensity);

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

  private applyDisplacement(
    p: p5,
    intensity: number,
    normalType: 'checker' | 'perlin' = 'checker'
  ): void {
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

    // Create a copy of the current canvas as a texture using get()
    const canvasTexture = p.get();

    // Generate normal map based on type
    const normalMap =
      normalType === 'perlin'
        ? this.generateNormalMap(p)
        : this.generateStaticNormalMap(p);

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

  private generateNormalMap(p: p5): p5.Graphics {
    // Use much smaller resolution for performance - will be upscaled by GPU
    const mapWidth = 64;
    const mapHeight = 80; // Maintain 4:5 aspect ratio

    const normalMapGraphics = p.createGraphics(mapWidth, mapHeight);
    normalMapGraphics.pixelDensity(1);
    normalMapGraphics.loadPixels();

    const scale = 0.1;
    const time = p.millis() * 0.001;

    for (let x = 0; x < mapWidth; x++) {
      for (let y = 0; y < mapHeight; y++) {
        // Generate height values using Perlin noise with transformations
        const height = p.noise(x * scale + time, y * scale, time * 0.5);
        const heightX = p.noise((x + 1) * scale + time, y * scale, time * 0.5);
        const heightY = p.noise(x * scale + time, (y + 1) * scale, time * 0.5);

        // Calculate normal from height differences
        const normalX = (height - heightX) * 255 + 128;
        const normalY = (height - heightY) * 255 + 128;
        const normalZ = 255; // Always pointing up

        const index = (y * mapWidth + x) * 4;
        normalMapGraphics.pixels[index] = normalX;
        normalMapGraphics.pixels[index + 1] = normalY;
        normalMapGraphics.pixels[index + 2] = normalZ;
        normalMapGraphics.pixels[index + 3] = 255;
      }
    }

    normalMapGraphics.updatePixels();
    return normalMapGraphics;
  }

  private showNormalMap(
    p: p5,
    normalType: 'checker' | 'perlin' = 'checker'
  ): void {
    // Generate the normal map based on type
    const normalMap =
      normalType === 'perlin'
        ? this.generateNormalMap(p)
        : this.generateStaticNormalMap(p);

    // Clear canvas and display the normal map directly
    p.clear();
    p.push();
    p.translate(-p.width / 2, -p.height / 2);
    p.image(normalMap, 0, 0, p.width, p.height);
    p.pop();
  }

  private generateStaticNormalMap(p: p5): p5.Graphics {
    // Create a simple static test pattern for debugging
    const mapWidth = 64;
    const mapHeight = 80;

    const normalMapGraphics = p.createGraphics(mapWidth, mapHeight);
    normalMapGraphics.pixelDensity(1);
    normalMapGraphics.loadPixels();

    for (let x = 0; x < mapWidth; x++) {
      for (let y = 0; y < mapHeight; y++) {
        // Create a simple checkerboard pattern with different normal directions
        const isCheckered = (Math.floor(x / 8) + Math.floor(y / 8)) % 2 === 0;

        let normalX = 128; // Neutral
        let normalY = 128; // Neutral
        const normalZ = 255; // Always pointing up

        if (isCheckered) {
          // Push normals left and down
          normalX = 100;
          normalY = 100;
        } else {
          // Push normals right and up
          normalX = 156;
          normalY = 156;
        }

        const index = (y * mapWidth + x) * 4;
        normalMapGraphics.pixels[index] = normalX;
        normalMapGraphics.pixels[index + 1] = normalY;
        normalMapGraphics.pixels[index + 2] = normalZ;
        normalMapGraphics.pixels[index + 3] = 255;
      }
    }

    normalMapGraphics.updatePixels();
    return normalMapGraphics;
  }
}
