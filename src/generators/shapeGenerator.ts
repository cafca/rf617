import p5 from 'p5';
import { Color } from '../utils/colorPalette';

export enum ShapeType {
  CIRCLE,
  ELLIPSE,
  TRIANGLE,
  LINE,
}

export interface ShapeConfig {
  type: ShapeType;
  x: number;
  y: number;
  color: Color;
  opacity: number;
  size: number;
  rotation?: number;
  strokeWeight?: number;
}

export class ShapeGenerator {
  generate(
    _p: p5,
    colors: Color[],
    width: number,
    height: number,
    count: number = 15
  ): ShapeConfig[] {
    const shapes: ShapeConfig[] = [];

    for (let i = 0; i < count; i++) {
      const shape = this.createRandomShape(colors, width, height);
      shapes.push(shape);
    }

    return shapes;
  }

  drawShapes(p: p5, shapes: ShapeConfig[]): void {
    shapes.forEach((shape) => {
      this.drawShape(p, shape);
    });
  }

  private createRandomShape(
    colors: Color[],
    width: number,
    height: number
  ): ShapeConfig {
    const types = Object.values(ShapeType).filter(
      (value) => typeof value === 'number'
    ) as ShapeType[];

    const type = types[Math.floor(Math.random() * types.length)];
    const color = colors[Math.floor(Math.random() * colors.length)];

    return {
      type,
      x: Math.random() * width,
      y: Math.random() * height,
      color,
      opacity: 0.3 + Math.random() * 0.5,
      size: 10 + Math.random() * 80,
      rotation: Math.random() * Math.PI * 2,
      strokeWeight: 1 + Math.random() * 4,
    };
  }

  private drawShape(p: p5, shape: ShapeConfig): void {
    p.push();
    p.translate(shape.x, shape.y);

    if (shape.rotation) {
      p.rotate(shape.rotation);
    }

    const colorWithAlpha = p.color(
      shape.color.r,
      shape.color.g,
      shape.color.b,
      shape.opacity * 255
    );

    switch (shape.type) {
      case ShapeType.CIRCLE:
        this.drawCircle(p, shape, colorWithAlpha);
        break;
      case ShapeType.ELLIPSE:
        this.drawEllipse(p, shape, colorWithAlpha);
        break;
      case ShapeType.TRIANGLE:
        this.drawTriangle(p, shape, colorWithAlpha);
        break;
      case ShapeType.LINE:
        this.drawLine(p, shape, colorWithAlpha);
        break;
    }

    p.pop();
  }

  private drawCircle(p: p5, shape: ShapeConfig, color: p5.Color): void {
    const shouldFill = Math.random() > 0.5;

    if (shouldFill) {
      p.fill(color);
      p.noStroke();
    } else {
      p.noFill();
      p.stroke(color);
      p.strokeWeight(shape.strokeWeight || 2);
    }

    p.ellipse(0, 0, shape.size, shape.size);
  }

  private drawEllipse(p: p5, shape: ShapeConfig, color: p5.Color): void {
    const shouldFill = Math.random() > 0.5;
    const aspectRatio = 0.5 + Math.random() * 1.5;

    if (shouldFill) {
      p.fill(color);
      p.noStroke();
    } else {
      p.noFill();
      p.stroke(color);
      p.strokeWeight(shape.strokeWeight || 2);
    }

    p.ellipse(0, 0, shape.size, shape.size * aspectRatio);
  }

  private drawTriangle(p: p5, shape: ShapeConfig, color: p5.Color): void {
    const shouldFill = Math.random() > 0.5;
    const halfSize = shape.size / 2;

    if (shouldFill) {
      p.fill(color);
      p.noStroke();
    } else {
      p.noFill();
      p.stroke(color);
      p.strokeWeight(shape.strokeWeight || 2);
    }

    const x1 = 0;
    const y1 = -halfSize;
    const x2 = -halfSize * 0.866;
    const y2 = halfSize * 0.5;
    const x3 = halfSize * 0.866;
    const y3 = halfSize * 0.5;

    p.triangle(x1, y1, x2, y2, x3, y3);
  }

  private drawLine(p: p5, shape: ShapeConfig, color: p5.Color): void {
    p.stroke(color);
    p.strokeWeight(shape.strokeWeight || 2);

    const length = shape.size;
    const startX = -length / 2;
    const endX = length / 2;

    const curviness = Math.random();
    if (curviness > 0.7) {
      const controlX1 = startX + length * 0.25;
      const controlY1 = (Math.random() - 0.5) * length * 0.5;
      const controlX2 = startX + length * 0.75;
      const controlY2 = (Math.random() - 0.5) * length * 0.5;

      p.noFill();
      p.bezier(startX, 0, controlX1, controlY1, controlX2, controlY2, endX, 0);
    } else {
      p.line(startX, 0, endX, 0);
    }
  }
}
