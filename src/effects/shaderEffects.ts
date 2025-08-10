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
        varying vec2 vTexCoord;
        
        void main() {
          vTexCoord = aTexCoord;
          vec4 positionVec4 = vec4(aPosition, 1.0);
          gl_Position = positionVec4;
        }
      `;

      const fragSource = `
        precision highp float;

        uniform sampler2D tex0;
        uniform float intensity;
        varying vec2 vTexCoord;

        void main() {
          // Offset the input coordinate with wave distortion
          vec2 warpedCoord = vTexCoord;
          warpedCoord.x += intensity * 0.05 * sin(vTexCoord.y * 10.0);
          warpedCoord.y += intensity * 0.05 * sin(vTexCoord.x * 10.0);

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
    this.displacementShader.setUniform('tex0', canvasTexture);
    this.displacementShader.setUniform('intensity', intensity);

    // Draw fullscreen quad with explicit texture coordinates
    p.push();
    p.noStroke();
    p.fill(255);

    // Draw fullscreen plane at native resolution
    p.plane(p.width, p.height);

    p.pop();

    // Reset shader
    p.resetShader();
  }
}
