import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GenerationPipeline } from '../src/core/generationPipeline';
import { ColorPalette, PalettePattern } from '../src/utils/colorPalette';
import { BackgroundGenerator } from '../src/generators/backgroundGenerator';
import { ShapeGenerator } from '../src/generators/shapeGenerator';
import { EffectType } from '../src/effects/shaderEffects';

// Mock p5.js with memory leak detection capabilities
const mockGraphicsObjects: any[] = [];
let webglContextCount = 0;

// Mock texture object
const mockTexture = {
  width: 800,
  height: 600,
};

const mockP5 = {
  createCanvas: vi.fn(),
  createGraphics: vi.fn((width: number, height: number, renderer?: string) => {
    if (renderer === 'WEBGL' || renderer === 'webgl') {
      webglContextCount++;
    }
    const graphics = {
      width,
      height,
      clear: vi.fn(),
      background: vi.fn(),
      fill: vi.fn(),
      noFill: vi.fn(),
      stroke: vi.fn(),
      noStroke: vi.fn(),
      strokeWeight: vi.fn(),
      circle: vi.fn(),
      rect: vi.fn(),
      triangle: vi.fn(),
      push: vi.fn(),
      pop: vi.fn(),
      translate: vi.fn(),
      image: vi.fn(),
      get: vi.fn(() => ({ width, height })),
      pixelDensity: vi.fn(),
      loadPixels: vi.fn(),
      updatePixels: vi.fn(),
      pixels: new Uint8ClampedArray(width * height * 4),
      dispose: vi.fn(() => {
        webglContextCount = Math.max(0, webglContextCount - 1);
      }),
    };
    mockGraphicsObjects.push(graphics);
    return graphics;
  }),
  width: 800,
  height: 600,
  WEBGL: 'webgl',
  clear: vi.fn(),
  background: vi.fn(),
  fill: vi.fn(),
  noFill: vi.fn(),
  stroke: vi.fn(),
  noStroke: vi.fn(),
  strokeWeight: vi.fn(),
  circle: vi.fn(),
  rect: vi.fn(),
  triangle: vi.fn(),
  random: vi.fn(() => Math.random()),
  push: vi.fn(),
  pop: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  scale: vi.fn(),
  image: vi.fn(),
  get: vi.fn(() => mockTexture),
  createShader: vi.fn(() => ({
    setUniform: vi.fn().mockReturnThis(),
  })),
  shader: vi.fn(),
  resetShader: vi.fn(),
  plane: vi.fn(),
  filter: vi.fn(),
  BLUR: 'blur',
  millis: vi.fn(() => Date.now()),
  loadShader: vi.fn(() =>
    Promise.resolve({
      setUniform: vi.fn().mockReturnThis(),
    })
  ),
  // Additional methods needed by generators
  beginShape: vi.fn(),
  endShape: vi.fn(),
  vertex: vi.fn(),
  map: vi.fn(
    (value, start1, stop1, start2, stop2) =>
      start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1))
  ),
  lerpColor: vi.fn((_c1, _c2, _amt) => ({ r: 128, g: 128, b: 128 })),
  color: vi.fn((r, g, b) => ({ r, g, b })),
  red: vi.fn(() => 128),
  green: vi.fn(() => 128),
  blue: vi.fn(() => 128),
  noise: vi.fn(() => 0.5),
  CLOSE: 'close' as any,
  ellipse: vi.fn(),
  line: vi.fn(),
  bezier: vi.fn(),
} as any;

describe('Memory Leak Tests', () => {
  let pipeline: GenerationPipeline;
  let colorPalette: ColorPalette;
  let backgroundGenerator: BackgroundGenerator;
  let shapeGenerator: ShapeGenerator;

  beforeEach(() => {
    // Reset counters
    mockGraphicsObjects.length = 0;
    webglContextCount = 0;
    vi.clearAllMocks();

    // Create dependencies
    colorPalette = new ColorPalette();
    backgroundGenerator = new BackgroundGenerator();
    shapeGenerator = new ShapeGenerator();

    // Create fresh instances
    pipeline = new GenerationPipeline(
      mockP5,
      colorPalette,
      backgroundGenerator,
      shapeGenerator
    );
  });

  it('should not create excessive WebGL contexts during animation cycles', () => {
    // Generate initial content
    pipeline.generate(
      5,
      10,
      PalettePattern.TRIADIC,
      EffectType.WAVES,
      EffectType.DISPLACEMENT
    );
    const afterGenerateCount = webglContextCount;

    // Simulate animation cycles
    for (let i = 0; i < 50; i++) {
      pipeline.updateAnimatedEffects(EffectType.WAVES, EffectType.DISPLACEMENT);
    }

    const afterAnimationCount = webglContextCount;

    // We expect some context creation during generation, but not during animation
    expect(afterAnimationCount - afterGenerateCount).toBeLessThan(5);
    expect(afterAnimationCount).toBeLessThan(20); // Reasonable upper bound
  });

  it('should reuse cached graphics objects', () => {
    // Generate content multiple times
    for (let i = 0; i < 10; i++) {
      pipeline.generate(
        5,
        10,
        PalettePattern.TRIADIC,
        EffectType.WAVES,
        EffectType.DISPLACEMENT
      );
    }

    const graphicsObjectsCount = mockGraphicsObjects.length;

    // Should not create a new graphics object for each generation
    expect(graphicsObjectsCount).toBeLessThan(30); // Reasonable upper bound
  });

  it('should not accumulate memory during repeated effect applications', () => {
    // Generate initial content
    pipeline.generate(
      5,
      10,
      PalettePattern.TRIADIC,
      EffectType.OFF,
      EffectType.OFF
    );

    const initialObjectCount = mockGraphicsObjects.length;

    // Apply effects repeatedly
    for (let i = 0; i < 100; i++) {
      pipeline.updateAnimatedEffects(
        i % 2 === 0 ? EffectType.WAVES : EffectType.DISPLACEMENT,
        i % 3 === 0 ? EffectType.BLUR : EffectType.OFF
      );
    }

    const finalObjectCount = mockGraphicsObjects.length;

    // Should not create many new objects during effect application
    expect(finalObjectCount - initialObjectCount).toBeLessThan(10);
  });

  it('should handle rapid effect switching without memory leaks', () => {
    // Generate initial content
    pipeline.generate(
      5,
      10,
      PalettePattern.TRIADIC,
      EffectType.OFF,
      EffectType.OFF
    );

    const effects = [
      EffectType.OFF,
      EffectType.WAVES,
      EffectType.DISPLACEMENT,
      EffectType.BLUR,
    ];
    const initialContextCount = webglContextCount;

    // Rapidly switch between effects
    for (let i = 0; i < 200; i++) {
      const bgEffect = effects[i % effects.length];
      const fgEffect = effects[(i + 1) % effects.length];

      pipeline.updateAnimatedEffects(bgEffect, fgEffect);
    }

    const finalContextCount = webglContextCount;

    // Should not create excessive contexts during switching
    expect(finalContextCount - initialContextCount).toBeLessThan(15);
  });

  it('should properly dispose of resources when effects change', () => {
    // Test that cached textures are properly managed
    pipeline.generate(
      5,
      10,
      PalettePattern.TRIADIC,
      EffectType.WAVES,
      EffectType.OFF
    );

    const state = (pipeline as any).state;
    expect(state.backgroundTexture).toBeDefined();
    expect(state.foregroundTexture).toBeDefined();

    // Switch to different effects
    pipeline.updateAnimatedEffects(EffectType.BLUR, EffectType.DISPLACEMENT);

    // State should still have textures (they're reused)
    expect(state.backgroundTexture).toBeDefined();
    expect(state.foregroundTexture).toBeDefined();
  });

  it('should not leak shader uniforms during animation', () => {
    const shader = mockP5.createShader();
    const setUniformSpy = vi.spyOn(shader, 'setUniform');

    // Mock shader creation
    vi.spyOn(mockP5, 'createShader').mockReturnValue(shader);

    // Generate content with shader effects
    pipeline.generate(
      5,
      10,
      PalettePattern.TRIADIC,
      EffectType.WAVES,
      EffectType.DISPLACEMENT
    );

    const initialCallCount = setUniformSpy.mock.calls.length;

    // Run animation cycles
    for (let i = 0; i < 20; i++) {
      pipeline.updateAnimatedEffects(EffectType.WAVES, EffectType.DISPLACEMENT);
    }

    const finalCallCount = setUniformSpy.mock.calls.length;

    // Expect uniform calls but not excessive accumulation
    expect(finalCallCount - initialCallCount).toBeGreaterThan(0);
    expect(finalCallCount).toBeLessThan(1000); // Reasonable upper bound
  });

  it('should handle memory pressure gracefully', () => {
    // Simulate memory pressure by creating many pipelines
    const pipelines: GenerationPipeline[] = [];

    try {
      for (let i = 0; i < 10; i++) {
        const cp = new ColorPalette();
        const bg = new BackgroundGenerator();
        const sg = new ShapeGenerator();
        const p = new GenerationPipeline(mockP5, cp, bg, sg);
        p.generate(
          7,
          15,
          PalettePattern.COMPLEMENTARY,
          EffectType.WAVES,
          EffectType.BLUR
        );
        pipelines.push(p);
      }

      // Should not throw or create excessive contexts
      expect(webglContextCount).toBeLessThan(50);
    } catch (error) {
      // If we do hit memory limits, it should be a controlled failure
      expect((error as Error).message).toMatch(/context|memory|resource/i);
    }
  });

  it('should properly dispose of resources when explicitly cleaned up', () => {
    // Generate content to create resources
    pipeline.generate(
      5,
      10,
      PalettePattern.TRIADIC,
      EffectType.WAVES,
      EffectType.DISPLACEMENT
    );

    // Verify resources are created
    const memoryBefore = pipeline.getMemoryInfo();
    expect(memoryBefore.texturesInState.background).toBe(true);
    expect(memoryBefore.texturesInState.foreground).toBe(true);

    // Dispose resources
    pipeline.dispose();

    // Verify resources are cleared
    const memoryAfter = pipeline.getMemoryInfo();
    expect(memoryAfter.texturesInState.background).toBe(false);
    expect(memoryAfter.texturesInState.foreground).toBe(false);
    expect(memoryAfter.texturesInState.processedBackground).toBe(false);
    expect(memoryAfter.texturesInState.processedForeground).toBe(false);
  });

  it('should track resource usage over long animation sessions', () => {
    // Generate initial content
    pipeline.generate(
      5,
      10,
      PalettePattern.TRIADIC,
      EffectType.WAVES,
      EffectType.DISPLACEMENT
    );

    const initialGraphicsCount = mockGraphicsObjects.length;
    const initialContextCount = webglContextCount;

    // Simulate a long animation session with various effects
    const effects = [
      EffectType.OFF,
      EffectType.WAVES,
      EffectType.DISPLACEMENT,
      EffectType.BLUR,
    ];

    for (let cycle = 0; cycle < 100; cycle++) {
      // Vary effects randomly
      const bgEffect = effects[cycle % effects.length];
      const fgEffect = effects[(cycle + 2) % effects.length];

      pipeline.updateAnimatedEffects(bgEffect, fgEffect);

      // Occasionally regenerate content (user clicking "generate")
      if (cycle % 25 === 0) {
        pipeline.generate(5, 8, PalettePattern.TRIADIC, bgEffect, fgEffect);
      }

      // Monitor resource growth
      const currentGraphicsCount = mockGraphicsObjects.length;
      const currentContextCount = webglContextCount;

      // Resources shouldn't grow linearly with iterations (allow some growth but not unbounded)
      if (cycle > 0) {
        expect(currentGraphicsCount - initialGraphicsCount).toBeLessThan(
          Math.max(cycle * 0.2, 5)
        );
        expect(currentContextCount - initialContextCount).toBeLessThan(10);
      }
    }

    // After long session, resources should still be reasonable
    const finalGraphicsCount = mockGraphicsObjects.length;
    const finalContextCount = webglContextCount;

    expect(finalGraphicsCount).toBeLessThan(100);
    expect(finalContextCount).toBeLessThan(30);
  });

  it('should handle rapid effect switching without exponential resource growth', () => {
    // Generate initial content
    pipeline.generate(
      5,
      10,
      PalettePattern.COMPLEMENTARY,
      EffectType.OFF,
      EffectType.OFF
    );

    const baselineGraphicsCount = mockGraphicsObjects.length;
    const baselineContextCount = webglContextCount;

    // Rapidly switch effects (simulating user quickly changing settings)
    for (let i = 0; i < 500; i++) {
      const effects = [
        EffectType.WAVES,
        EffectType.DISPLACEMENT,
        EffectType.BLUR,
      ];
      const randomBg = effects[i % effects.length];
      const randomFg = effects[(i + 1) % effects.length];

      pipeline.updateAnimatedEffects(randomBg, randomFg);
    }

    const finalGraphicsCount = mockGraphicsObjects.length;
    const finalContextCount = webglContextCount;

    // Resource growth should be sub-linear
    expect(finalGraphicsCount - baselineGraphicsCount).toBeLessThan(50);
    expect(finalContextCount - baselineContextCount).toBeLessThan(15);
  });
});
