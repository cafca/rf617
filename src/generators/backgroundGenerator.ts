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

    // Use beginShape/endShape for WebGL compatibility
    for (let y = 0; y <= height; y += 2) {
      const inter = p.map(y, 0, height, 0, 1);
      const c = p.lerpColor(
        p.color(color1.r, color1.g, color1.b),
        p.color(color2.r, color2.g, color2.b),
        inter
      );
      p.fill(c);
      p.noStroke();
      p.rect(-width / 2, -height / 2 + y, width, 2);
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

    for (let x = 0; x <= width; x += 2) {
      const inter = p.map(x, 0, width, 0, 1);
      const c = p.lerpColor(
        p.color(color1.r, color1.g, color1.b),
        p.color(color2.r, color2.g, color2.b),
        inter
      );
      p.fill(c);
      p.noStroke();
      p.rect(-width / 2 + x, -height / 2, 2, height);
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

    // Create diagonal gradient using WebGL vertex color interpolation
    p.noStroke();

    // Create a quad with vertex colors that interpolate diagonally
    p.beginShape();

    // Top-left corner - color1
    p.fill(color1.r, color1.g, color1.b);
    p.vertex(-width / 2, -height / 2);

    // Top-right corner - interpolated
    const topRightLerp = p.lerpColor(
      p.color(color1.r, color1.g, color1.b),
      p.color(color2.r, color2.g, color2.b),
      0.5
    );
    p.fill(p.red(topRightLerp), p.green(topRightLerp), p.blue(topRightLerp));
    p.vertex(width / 2, -height / 2);

    // Bottom-right corner - color2
    p.fill(color2.r, color2.g, color2.b);
    p.vertex(width / 2, height / 2);

    // Bottom-left corner - interpolated
    const bottomLeftLerp = p.lerpColor(
      p.color(color1.r, color1.g, color1.b),
      p.color(color2.r, color2.g, color2.b),
      0.5
    );
    p.fill(
      p.red(bottomLeftLerp),
      p.green(bottomLeftLerp),
      p.blue(bottomLeftLerp)
    );
    p.vertex(-width / 2, height / 2);

    p.endShape(p.CLOSE);
  }

  private generateRadialCenter(
    p: p5,
    colors: Color[],
    width: number,
    height: number
  ): void {
    const color1 = colors[Math.floor(Math.random() * colors.length)];
    const color2 = colors[Math.floor(Math.random() * colors.length)];

    // Create radial gradient using concentric triangles
    p.noStroke();

    const segments = 32; // Number of triangular segments
    const rings = 50; // Reduced rings for better performance

    // Calculate radius to cover entire frame (diagonal distance to corners)
    const maxRadius = Math.sqrt((width / 2) ** 2 + (height / 2) ** 2);

    for (let ring = 0; ring < rings; ring++) {
      const innerRadius = (ring / rings) * maxRadius;
      const outerRadius = ((ring + 1) / rings) * maxRadius;

      // Interpolate color based on ring distance from center
      const ringProgress = ring / (rings - 1);
      const ringColor = p.lerpColor(
        p.color(color1.r, color1.g, color1.b),
        p.color(color2.r, color2.g, color2.b),
        ringProgress
      );

      p.fill(p.red(ringColor), p.green(ringColor), p.blue(ringColor));

      // Draw triangular segments for this ring
      for (let i = 0; i < segments; i++) {
        const angle1 = (i / segments) * Math.PI * 2;
        const angle2 = ((i + 1) / segments) * Math.PI * 2;

        p.beginShape();
        // Inner ring vertices
        p.vertex(
          Math.cos(angle1) * innerRadius,
          Math.sin(angle1) * innerRadius
        );
        p.vertex(
          Math.cos(angle2) * innerRadius,
          Math.sin(angle2) * innerRadius
        );
        // Outer ring vertices
        p.vertex(
          Math.cos(angle2) * outerRadius,
          Math.sin(angle2) * outerRadius
        );
        p.vertex(
          Math.cos(angle1) * outerRadius,
          Math.sin(angle1) * outerRadius
        );
        p.endShape(p.CLOSE);
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

    // Create corner radial gradient using triangular fan from corner
    p.noStroke();

    const cornerX = -width / 2; // Top-left corner
    const cornerY = -height / 2;
    const maxRadius = Math.sqrt(width ** 2 + height ** 2);
    const rings = 50; // Reduced rings for better performance
    const segments = 32; // More segments for smoother curves

    for (let ring = 0; ring < rings; ring++) {
      const innerRadius = (ring / rings) * maxRadius;
      const outerRadius = ((ring + 1) / rings) * maxRadius;

      // Interpolate color based on distance from corner
      const ringProgress = ring / (rings - 1);
      const ringColor = p.lerpColor(
        p.color(color1.r, color1.g, color1.b),
        p.color(color2.r, color2.g, color2.b),
        ringProgress
      );

      p.fill(p.red(ringColor), p.green(ringColor), p.blue(ringColor));

      // Draw quarter-circle segments radiating from corner
      for (let i = 0; i < segments; i++) {
        const angle1 = ((i / segments) * Math.PI) / 2; // 0 to π/2 (90 degrees)
        const angle2 = (((i + 1) / segments) * Math.PI) / 2;

        p.beginShape();
        // Inner arc vertices
        p.vertex(
          cornerX + Math.cos(angle1) * innerRadius,
          cornerY + Math.sin(angle1) * innerRadius
        );
        p.vertex(
          cornerX + Math.cos(angle2) * innerRadius,
          cornerY + Math.sin(angle2) * innerRadius
        );
        // Outer arc vertices
        p.vertex(
          cornerX + Math.cos(angle2) * outerRadius,
          cornerY + Math.sin(angle2) * outerRadius
        );
        p.vertex(
          cornerX + Math.cos(angle1) * outerRadius,
          cornerY + Math.sin(angle1) * outerRadius
        );
        p.endShape(p.CLOSE);
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
        // Adjust coordinates for WebGL centered origin
        p.rect(-width / 2 + x, -height / 2 + y, 2, 2);
      }
    }
  }
}
