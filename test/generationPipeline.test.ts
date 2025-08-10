import { describe, it, expect, vi } from 'vitest';
import { GenerationPipeline } from '../src/core/generationPipeline';
import { ColorPalette } from '../src/utils/colorPalette';
import { BackgroundGenerator } from '../src/generators/backgroundGenerator';
import { ShapeGenerator } from '../src/generators/shapeGenerator';

const mockP5 = {
  width: 400,
  height: 500,
  clear: vi.fn(),
  save: vi.fn(),
} as any;

describe('GenerationPipeline', () => {
  let pipeline: GenerationPipeline;
  let colorPalette: ColorPalette;
  let backgroundGenerator: BackgroundGenerator;
  let shapeGenerator: ShapeGenerator;

  beforeEach(() => {
    colorPalette = new ColorPalette();
    backgroundGenerator = new BackgroundGenerator();
    shapeGenerator = new ShapeGenerator();

    vi.spyOn(backgroundGenerator, 'generate');
    vi.spyOn(shapeGenerator, 'generate');
    vi.spyOn(shapeGenerator, 'drawShapes');

    pipeline = new GenerationPipeline(
      mockP5,
      colorPalette,
      backgroundGenerator,
      shapeGenerator
    );
  });

  describe('generate', () => {
    it('should execute all generation stages in order', () => {
      pipeline.generate(7);

      expect(backgroundGenerator.generate).toHaveBeenCalledWith(
        mockP5,
        expect.any(Array),
        400,
        500
      );
      expect(shapeGenerator.generate).toHaveBeenCalledWith(
        mockP5,
        expect.any(Array),
        400,
        500,
        expect.any(Number)
      );
      expect(shapeGenerator.drawShapes).toHaveBeenCalledWith(
        mockP5,
        expect.any(Array)
      );
    });

    it('should update state with generated colors and shapes', () => {
      pipeline.generate(5);
      const state = pipeline.getState();

      expect(state.colors).toHaveLength(5);
      expect(state.shapes.length).toBeGreaterThan(0);
      expect(state.isGenerating).toBe(false);
    });

    it('should not start new generation if already generating', () => {
      pipeline.generate(7);
      pipeline.generate(7);

      expect(backgroundGenerator.generate).toHaveBeenCalledTimes(1);
    });
  });

  describe('exportImage', () => {
    it('should call p5 save with timestamp filename', () => {
      pipeline.exportImage();

      expect(mockP5.save).toHaveBeenCalledWith(
        expect.stringMatching(/^rf617-art-\d{4}-\d{2}-\d{2}T.*\.png$/)
      );
    });
  });

  describe('getState', () => {
    it('should return current state', () => {
      const state = pipeline.getState();

      expect(state).toHaveProperty('colors');
      expect(state).toHaveProperty('shapes');
      expect(state).toHaveProperty('isGenerating');
    });
  });

  describe('getCurrentColors', () => {
    it('should return current colors array', () => {
      pipeline.generate(7);
      const colors = pipeline.getCurrentColors();

      expect(colors).toHaveLength(7);
      expect(colors[0]).toHaveProperty('r');
      expect(colors[0]).toHaveProperty('g');
      expect(colors[0]).toHaveProperty('b');
      expect(colors[0]).toHaveProperty('hex');
    });
  });
});
