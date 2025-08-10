import { describe, it, expect } from 'vitest';
import { ShapeGenerator, ShapeType } from '../src/generators/shapeGenerator';
import { ColorPalette } from '../src/utils/colorPalette';

describe('ShapeGenerator', () => {
  let generator: ShapeGenerator;
  let colors: ReturnType<ColorPalette['generate']>;

  beforeEach(() => {
    generator = new ShapeGenerator();
    const palette = new ColorPalette();
    colors = palette.generate(7);
  });

  describe('generate', () => {
    it('should generate the specified number of shapes', () => {
      const shapes = generator.generate(null as any, colors, 400, 500, 10);
      expect(shapes).toHaveLength(10);
    });

    it('should generate default number of shapes when count not specified', () => {
      const shapes = generator.generate(null as any, colors, 400, 500);
      expect(shapes).toHaveLength(15);
    });

    it('should generate shapes with valid properties', () => {
      const shapes = generator.generate(null as any, colors, 400, 500, 5);

      shapes.forEach((shape) => {
        expect(shape.x).toBeGreaterThanOrEqual(0);
        expect(shape.x).toBeLessThanOrEqual(400);
        expect(shape.y).toBeGreaterThanOrEqual(0);
        expect(shape.y).toBeLessThanOrEqual(500);
        expect(shape.opacity).toBeGreaterThanOrEqual(0.3);
        expect(shape.opacity).toBeLessThanOrEqual(0.8);
        expect(shape.size).toBeGreaterThanOrEqual(10);
        expect(shape.size).toBeLessThanOrEqual(90);
        expect(Object.values(ShapeType)).toContain(shape.type);
        expect(colors).toContainEqual(shape.color);
      });
    });

    it('should generate shapes with different types', () => {
      const shapes = generator.generate(null as any, colors, 400, 500, 20);
      const types = [...new Set(shapes.map((s) => s.type))];
      expect(types.length).toBeGreaterThan(1);
    });
  });
});
