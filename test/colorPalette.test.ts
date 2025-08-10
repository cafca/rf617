import { describe, it, expect } from 'vitest';
import { ColorPalette } from '../src/utils/colorPalette';

describe('ColorPalette', () => {
  let palette: ColorPalette;

  beforeEach(() => {
    palette = new ColorPalette();
  });

  describe('generate', () => {
    it('should generate exactly 5 colors when count is 5', () => {
      const colors = palette.generate(5);
      expect(colors).toHaveLength(5);
    });

    it('should generate exactly 7 colors when count is 7', () => {
      const colors = palette.generate(7);
      expect(colors).toHaveLength(7);
    });

    it('should generate exactly 9 colors when count is 9', () => {
      const colors = palette.generate(9);
      expect(colors).toHaveLength(9);
    });

    it('should generate colors with valid RGB values', () => {
      const colors = palette.generate(7);
      colors.forEach((color) => {
        expect(color.r).toBeGreaterThanOrEqual(0);
        expect(color.r).toBeLessThanOrEqual(255);
        expect(color.g).toBeGreaterThanOrEqual(0);
        expect(color.g).toBeLessThanOrEqual(255);
        expect(color.b).toBeGreaterThanOrEqual(0);
        expect(color.b).toBeLessThanOrEqual(255);
      });
    });

    it('should generate colors with valid hex values', () => {
      const colors = palette.generate(7);
      colors.forEach((color) => {
        expect(color.hex).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });

    it('should include at least one very dark and one very bright color', () => {
      // Try multiple times since this is based on random generation
      let foundValidPalette = false;

      for (let attempt = 0; attempt < 10; attempt++) {
        const colors = palette.generate(7);
        const brightness = colors.map(
          (color) => (color.r * 299 + color.g * 587 + color.b * 114) / 1000
        );

        const hasDark = brightness.some((b) => b < 70);
        const hasBright = brightness.some((b) => b > 180);

        if (hasDark && hasBright) {
          foundValidPalette = true;
          break;
        }
      }

      expect(foundValidPalette).toBe(true);
    });
  });

  describe('getColors', () => {
    it('should return the generated colors', () => {
      const generatedColors = palette.generate(5);
      const retrievedColors = palette.getColors();
      expect(retrievedColors).toEqual(generatedColors);
    });

    it('should return empty array if no colors generated', () => {
      const colors = palette.getColors();
      expect(colors).toEqual([]);
    });
  });

  describe('getRandomColor', () => {
    it('should return a color from the generated palette', () => {
      const generatedColors = palette.generate(7);
      const randomColor = palette.getRandomColor();
      expect(generatedColors).toContainEqual(randomColor);
    });
  });
});
