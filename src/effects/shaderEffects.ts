import p5 from 'p5';

export enum EffectType {
  OFF = 'off',
  BLUR = 'blur',
  DISPLACEMENT = 'displacement',
}

export interface EffectConfig {
  type: EffectType;
  intensity?: number;
}

export class ShaderEffects {
  private displacementShader: p5.Shader | null = null;

  apply(p: p5, config: EffectConfig): void {
    switch (config.type) {
      case EffectType.OFF:
        // No effect applied
        break;
      case EffectType.BLUR:
        this.applyBlur(p, config.intensity || 1);
        break;
      case EffectType.DISPLACEMENT:
        this.applyDisplacement(p, config.intensity || 1);
        break;
    }
  }

  private applyBlur(p: p5, intensity: number): void {
    // Simple blur effect using p5.js filter
    p.filter(p.BLUR, intensity);
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

      this.displacementShader = p.createShader(vertSource, fragSource);
    }

    if (!this.displacementShader) return;

    // Create a copy of the current canvas as a texture using get()
    const canvasTexture = p.get();

    // Clear the canvas and apply the wave distortion shader
    p.clear();
    p.shader(this.displacementShader);
    this.displacementShader
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
}
