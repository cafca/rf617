import p5 from 'p5';
import { Color } from '../utils/colorPalette';

export enum GradientType {
  LINEAR_VERTICAL,
  LINEAR_HORIZONTAL,
  LINEAR_DIAGONAL,
  RADIAL_CENTER,
  RADIAL_CORNER,
  NOISE_FIELD,
}

export class BackgroundGenerator {
  generate(p: p5, colors: Color[], width: number, height: number): void {
    const gradientType = this.getRandomGradientType();

    switch (gradientType) {
      case GradientType.LINEAR_VERTICAL:
        this.generateLinearVertical(p, colors, width, height);
        break;
      case GradientType.LINEAR_HORIZONTAL:
        this.generateLinearHorizontal(p, colors, width, height);
        break;
      case GradientType.LINEAR_DIAGONAL:
        this.generateLinearDiagonal(p, colors, width, height);
        break;
      case GradientType.RADIAL_CENTER:
        this.generateRadialCenter(p, colors, width, height);
        break;
      case GradientType.RADIAL_CORNER:
        this.generateRadialCorner(p, colors, width, height);
        break;
      case GradientType.NOISE_FIELD:
        this.generateNoiseField(p, colors, width, height);
        break;
    }
  }

  private getRandomGradientType(): GradientType {
    const types = Object.values(GradientType).filter(
      (value) => typeof value === 'number'
    ) as GradientType[];
    return types[Math.floor(Math.random() * types.length)];
  }

  private generateLinearVertical(
    p: p5,
    colors: Color[],
    width: number,
    height: number
  ): void {
    const color1 = colors[Math.floor(Math.random() * colors.length)];
    const color2 = colors[Math.floor(Math.random() * colors.length)];

    for (let y = 0; y <= height; y++) {
      const inter = p.map(y, 0, height, 0, 1);
      const c = p.lerpColor(
        p.color(color1.r, color1.g, color1.b),
        p.color(color2.r, color2.g, color2.b),
        inter
      );
      p.stroke(c);
      p.line(0, y, width, y);
    }
  }

  private generateLinearHorizontal(
    p: p5,
    colors: Color[],
    width: number,
    height: number
  ): void {
    const color1 = colors[Math.floor(Math.random() * colors.length)];
    const color2 = colors[Math.floor(Math.random() * colors.length)];

    for (let x = 0; x <= width; x++) {
      const inter = p.map(x, 0, width, 0, 1);
      const c = p.lerpColor(
        p.color(color1.r, color1.g, color1.b),
        p.color(color2.r, color2.g, color2.b),
        inter
      );
      p.stroke(c);
      p.line(x, 0, x, height);
    }
  }

  private generateLinearDiagonal(
    p: p5,
    colors: Color[],
    width: number,
    height: number
  ): void {
    const color1 = colors[Math.floor(Math.random() * colors.length)];
    const color2 = colors[Math.floor(Math.random() * colors.length)];

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const distance = Math.sqrt((x - 0) ** 2 + (y - 0) ** 2);
        const maxDistance = Math.sqrt(width ** 2 + height ** 2);
        const inter = distance / maxDistance;

        const c = p.lerpColor(
          p.color(color1.r, color1.g, color1.b),
          p.color(color2.r, color2.g, color2.b),
          inter
        );
        p.stroke(c);
        p.point(x, y);
      }
    }
  }

  private generateRadialCenter(
    p: p5,
    colors: Color[],
    width: number,
    height: number
  ): void {
    const color1 = colors[Math.floor(Math.random() * colors.length)];
    const color2 = colors[Math.floor(Math.random() * colors.length)];
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.sqrt((width / 2) ** 2 + (height / 2) ** 2);

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        const inter = distance / maxRadius;

        const c = p.lerpColor(
          p.color(color1.r, color1.g, color1.b),
          p.color(color2.r, color2.g, color2.b),
          inter
        );
        p.stroke(c);
        p.point(x, y);
      }
    }
  }

  private generateRadialCorner(
    p: p5,
    colors: Color[],
    width: number,
    height: number
  ): void {
    const color1 = colors[Math.floor(Math.random() * colors.length)];
    const color2 = colors[Math.floor(Math.random() * colors.length)];
    const maxRadius = Math.sqrt(width ** 2 + height ** 2);

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const distance = Math.sqrt(x ** 2 + y ** 2);
        const inter = distance / maxRadius;

        const c = p.lerpColor(
          p.color(color1.r, color1.g, color1.b),
          p.color(color2.r, color2.g, color2.b),
          inter
        );
        p.stroke(c);
        p.point(x, y);
      }
    }
  }

  private generateNoiseField(
    p: p5,
    colors: Color[],
    width: number,
    height: number
  ): void {
    const color1 = colors[Math.floor(Math.random() * colors.length)];
    const color2 = colors[Math.floor(Math.random() * colors.length)];
    const color3 = colors[Math.floor(Math.random() * colors.length)];

    for (let x = 0; x < width; x += 2) {
      for (let y = 0; y < height; y += 2) {
        const noiseValue = p.noise(x * 0.01, y * 0.01);
        let c;

        if (noiseValue < 0.33) {
          c = p.color(color1.r, color1.g, color1.b);
        } else if (noiseValue < 0.66) {
          c = p.color(color2.r, color2.g, color2.b);
        } else {
          c = p.color(color3.r, color3.g, color3.b);
        }

        p.fill(c);
        p.noStroke();
        p.rect(x, y, 2, 2);
      }
    }
  }
}
