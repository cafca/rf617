import p5 from 'p5';

export interface DistortionConfig {
  intensity: number;
  scale: number;
  type: DistortionType;
}

export enum DistortionType {
  PERLIN_NOISE,
  WAVE_DISTORTION,
  PIXEL_DISPLACEMENT,
}

export class DistortionEffects {
  apply(p: p5, config: DistortionConfig): void {
    switch (config.type) {
      case DistortionType.PERLIN_NOISE:
        this.applyPerlinNoise(p, config);
        break;
      case DistortionType.WAVE_DISTORTION:
        this.applyWaveDistortion(p, config);
        break;
      case DistortionType.PIXEL_DISPLACEMENT:
        this.applyPixelDisplacement(p, config);
        break;
    }
  }

  createRandomConfig(): DistortionConfig {
    const types = Object.values(DistortionType).filter(
      (value) => typeof value === 'number'
    ) as DistortionType[];

    return {
      intensity: 5 + Math.random() * 20,
      scale: 0.005 + Math.random() * 0.01,
      type: types[Math.floor(Math.random() * types.length)],
    };
  }

  private applyPerlinNoise(p: p5, config: DistortionConfig): void {
    p.loadPixels();
    const pixels = p.pixels;
    const width = p.width;
    const height = p.height;

    const tempPixels = new Uint8ClampedArray(pixels);

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const noiseX = p.noise(x * config.scale, y * config.scale);
        const noiseY = p.noise(
          (x + 1000) * config.scale,
          (y + 1000) * config.scale
        );

        const displaceX = Math.round((noiseX - 0.5) * config.intensity);
        const displaceY = Math.round((noiseY - 0.5) * config.intensity);

        const sourceX = x + displaceX;
        const sourceY = y + displaceY;

        if (
          sourceX >= 0 &&
          sourceX < width &&
          sourceY >= 0 &&
          sourceY < height
        ) {
          const targetIndex = (y * width + x) * 4;
          const sourceIndex = (sourceY * width + sourceX) * 4;

          pixels[targetIndex] = tempPixels[sourceIndex];
          pixels[targetIndex + 1] = tempPixels[sourceIndex + 1];
          pixels[targetIndex + 2] = tempPixels[sourceIndex + 2];
          pixels[targetIndex + 3] = tempPixels[sourceIndex + 3];
        }
      }
    }

    p.updatePixels();
  }

  private applyWaveDistortion(p: p5, config: DistortionConfig): void {
    p.loadPixels();
    const pixels = p.pixels;
    const width = p.width;
    const height = p.height;

    const tempPixels = new Uint8ClampedArray(pixels);

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const waveX = Math.sin(y * config.scale * 100) * config.intensity;
        const waveY = Math.cos(x * config.scale * 100) * config.intensity;

        const sourceX = Math.round(x + waveX);
        const sourceY = Math.round(y + waveY);

        if (
          sourceX >= 0 &&
          sourceX < width &&
          sourceY >= 0 &&
          sourceY < height
        ) {
          const targetIndex = (y * width + x) * 4;
          const sourceIndex = (sourceY * width + sourceX) * 4;

          pixels[targetIndex] = tempPixels[sourceIndex];
          pixels[targetIndex + 1] = tempPixels[sourceIndex + 1];
          pixels[targetIndex + 2] = tempPixels[sourceIndex + 2];
          pixels[targetIndex + 3] = tempPixels[sourceIndex + 3];
        }
      }
    }

    p.updatePixels();
  }

  private applyPixelDisplacement(p: p5, config: DistortionConfig): void {
    p.loadPixels();
    const pixels = p.pixels;
    const width = p.width;
    const height = p.height;

    const tempPixels = new Uint8ClampedArray(pixels);

    for (let x = 0; x < width; x += 2) {
      for (let y = 0; y < height; y += 2) {
        if (Math.random() < 0.1) {
          const displaceX = Math.round(
            (Math.random() - 0.5) * config.intensity * 2
          );
          const displaceY = Math.round(
            (Math.random() - 0.5) * config.intensity * 2
          );

          const sourceX = Math.max(0, Math.min(width - 1, x + displaceX));
          const sourceY = Math.max(0, Math.min(height - 1, y + displaceY));

          for (let dx = 0; dx < 2 && x + dx < width; dx++) {
            for (let dy = 0; dy < 2 && y + dy < height; dy++) {
              const targetIndex = ((y + dy) * width + (x + dx)) * 4;
              const sourceIndex = (sourceY * width + sourceX) * 4;

              pixels[targetIndex] = tempPixels[sourceIndex];
              pixels[targetIndex + 1] = tempPixels[sourceIndex + 1];
              pixels[targetIndex + 2] = tempPixels[sourceIndex + 2];
              pixels[targetIndex + 3] = tempPixels[sourceIndex + 3];
            }
          }
        }
      }
    }

    p.updatePixels();
  }
}
