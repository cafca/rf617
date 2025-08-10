import { describe, it, expect } from 'vitest';
import {
  DistortionEffects,
  DistortionType,
} from '../src/effects/distortionEffects';

describe('DistortionEffects', () => {
  let effects: DistortionEffects;

  beforeEach(() => {
    effects = new DistortionEffects();
  });

  describe('createRandomConfig', () => {
    it('should create a config with valid intensity range', () => {
      const config = effects.createRandomConfig();
      expect(config.intensity).toBeGreaterThanOrEqual(15);
      expect(config.intensity).toBeLessThanOrEqual(35);
    });

    it('should create a config with valid scale range', () => {
      const config = effects.createRandomConfig();
      expect(config.scale).toBeGreaterThanOrEqual(0.005);
      expect(config.scale).toBeLessThanOrEqual(0.015);
    });

    it('should create a config with valid distortion type', () => {
      const config = effects.createRandomConfig();
      expect(Object.values(DistortionType)).toContain(config.type);
    });

    it('should create different configs on multiple calls', () => {
      const config1 = effects.createRandomConfig();
      const config2 = effects.createRandomConfig();
      const config3 = effects.createRandomConfig();

      const configs = [config1, config2, config3];
      const uniqueIntensities = [...new Set(configs.map((c) => c.intensity))];
      const uniqueScales = [...new Set(configs.map((c) => c.scale))];

      expect(uniqueIntensities.length + uniqueScales.length).toBeGreaterThan(2);
    });
  });
});
