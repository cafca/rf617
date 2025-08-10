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
  COLOR_SHIFT,
}

export class DistortionEffects {
  apply(p: p5, config: DistortionConfig): void {
    console.log(`🎨 Distortion Effect: ${DistortionType[config.type]}`);
    console.log(
      `📐 Canvas dimensions: ${p.width}x${p.height} (${p.width * p.height} pixels)`
    );

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
      case DistortionType.COLOR_SHIFT:
        this.applyColorShift(p, config);
        break;
    }
  }

  createRandomConfig(): DistortionConfig {
    const types = Object.values(DistortionType).filter(
      (value) => typeof value === 'number'
    ) as DistortionType[];

    return {
      intensity: 15 + Math.random() * 20,
      scale: 0.005 + Math.random() * 0.01,
      type: types[Math.floor(Math.random() * types.length)],
    };
  }

  private applyPerlinNoise(p: p5, config: DistortionConfig): void {
    p.loadPixels();
    const pixels = p.pixels;
    const width = p.width;
    const height = p.height;

    let minX = width,
      maxX = 0,
      minY = height,
      maxY = 0;
    let processedPixels = 0;

    const tempPixels = new Uint8ClampedArray(pixels.length);
    for (let i = 0; i < pixels.length; i++) {
      tempPixels[i] = pixels[i];
    }

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
        processedPixels++;
        const noiseX = p.noise(x * config.scale, y * config.scale);
        const noiseY = p.noise(
          (x + 1000) * config.scale,
          (y + 1000) * config.scale
        );

        const displaceX = Math.round((noiseX - 0.5) * config.intensity);
        const displaceY = Math.round((noiseY - 0.5) * config.intensity);

        const sourceX = Math.max(0, Math.min(width - 1, x + displaceX));
        const sourceY = Math.max(0, Math.min(height - 1, y + displaceY));

        const targetIndex = (y * width + x) * 4;
        const sourceIndex = (sourceY * width + sourceX) * 4;

        pixels[targetIndex] = tempPixels[sourceIndex];
        pixels[targetIndex + 1] = tempPixels[sourceIndex + 1];
        pixels[targetIndex + 2] = tempPixels[sourceIndex + 2];
        pixels[targetIndex + 3] = tempPixels[sourceIndex + 3];
      }
    }

    console.log(`📊 Perlin Noise processed: ${processedPixels} pixels`);
    console.log(`📍 Coordinate range: X(${minX}-${maxX}) Y(${minY}-${maxY})`);

    p.updatePixels();
  }

  private applyWaveDistortion(p: p5, config: DistortionConfig): void {
    p.loadPixels();
    const pixels = p.pixels;
    const width = p.width;
    const height = p.height;

    let minX = width,
      maxX = 0,
      minY = height,
      maxY = 0;
    let processedPixels = 0;

    const tempPixels = new Uint8ClampedArray(pixels);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
        processedPixels++;
        const waveX = Math.sin(y * config.scale * 100) * config.intensity;
        const waveY = Math.cos(x * config.scale * 100) * config.intensity;

        const sourceX = Math.max(0, Math.min(width - 1, Math.round(x + waveX)));
        const sourceY = Math.max(
          0,
          Math.min(height - 1, Math.round(y + waveY))
        );

        const targetIndex = (y * width + x) * 4;
        const sourceIndex = (sourceY * width + sourceX) * 4;

        pixels[targetIndex] = tempPixels[sourceIndex];
        pixels[targetIndex + 1] = tempPixels[sourceIndex + 1];
        pixels[targetIndex + 2] = tempPixels[sourceIndex + 2];
        pixels[targetIndex + 3] = tempPixels[sourceIndex + 3];
      }
    }

    console.log(`📊 Wave Distortion processed: ${processedPixels} pixels`);
    console.log(`📍 Coordinate range: X(${minX}-${maxX}) Y(${minY}-${maxY})`);

    p.updatePixels();
  }

  private applyPixelDisplacement(p: p5, config: DistortionConfig): void {
    p.loadPixels();
    const pixels = p.pixels;
    const width = p.width;
    const height = p.height;

    const tempPixels = new Uint8ClampedArray(pixels);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (Math.random() < 0.05) {
          const blockSize = 2 + Math.floor(Math.random() * 4);
          const displaceX = Math.round(
            (Math.random() - 0.5) * config.intensity * 3
          );
          const displaceY = Math.round(
            (Math.random() - 0.5) * config.intensity * 3
          );

          for (let dx = 0; dx < blockSize && x + dx < width; dx++) {
            for (let dy = 0; dy < blockSize && y + dy < height; dy++) {
              const targetX = x + dx;
              const targetY = y + dy;
              const sourceX = Math.max(
                0,
                Math.min(width - 1, targetX + displaceX)
              );
              const sourceY = Math.max(
                0,
                Math.min(height - 1, targetY + displaceY)
              );

              const targetIndex = (targetY * width + targetX) * 4;
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

  private applyColorShift(p: p5, config: DistortionConfig): void {
    p.loadPixels();
    const pixels = p.pixels;
    const width = p.width;
    const height = p.height;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;

        // Create wave-based shifts that vary across the canvas
        const waveX = Math.sin(
          (x / width) * Math.PI * 4 + config.intensity * 0.1
        );
        const waveY = Math.cos(
          (y / height) * Math.PI * 3 + config.intensity * 0.1
        );

        // Shift colors based on position and intensity
        const r = pixels[index];
        const g = pixels[index + 1];
        const b = pixels[index + 2];

        // Apply color channel shifts
        pixels[index] = Math.max(
          0,
          Math.min(255, r + waveX * config.intensity * 0.5)
        );
        pixels[index + 1] = Math.max(
          0,
          Math.min(255, g + waveY * config.intensity * 0.5)
        );
        pixels[index + 2] = Math.max(
          0,
          Math.min(255, b + (waveX + waveY) * config.intensity * 0.25)
        );
        // Alpha channel stays the same
      }
    }

    p.updatePixels();
  }
}
