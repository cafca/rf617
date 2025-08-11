import p5 from 'p5';
import { ColorPalette, Color, PalettePattern } from '../utils/colorPalette';
import { BackgroundGenerator } from '../generators/backgroundGenerator';
import { ShapeGenerator, ShapeConfig } from '../generators/shapeGenerator';
import {
  ShaderEffects,
  EffectType,
  EffectConfig,
  LayerType,
} from '../effects/shaderEffects';

export interface GenerationState {
  colors: Color[];
  shapes: ShapeConfig[];
  isGenerating: boolean;
}

export class GenerationPipeline {
  private state: GenerationState;
  private effects: ShaderEffects;

  constructor(
    private p: p5,
    private colorPalette: ColorPalette,
    private backgroundGenerator: BackgroundGenerator,
    private shapeGenerator: ShapeGenerator
  ) {
    this.effects = new ShaderEffects();
    this.state = {
      colors: [],
      shapes: [],
      isGenerating: false,
    };
  }

  generate(
    paletteSize: 5 | 7 | 9,
    elementCount: number = 15,
    pattern: PalettePattern = PalettePattern.COMPLEMENTARY,
    backgroundEffect: EffectType = EffectType.OFF,
    foregroundEffect: EffectType = EffectType.OFF,
    debugMode: boolean = false
  ): void {
    if (this.state.isGenerating) return;

    this.state.isGenerating = true;

    try {
      this.executeStages(
        paletteSize,
        elementCount,
        pattern,
        backgroundEffect,
        foregroundEffect,
        debugMode
      );
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      this.state.isGenerating = false;
    }
  }

  private executeStages(
    paletteSize: 5 | 7 | 9,
    elementCount: number,
    pattern: PalettePattern,
    backgroundEffect: EffectType,
    foregroundEffect: EffectType,
    debugMode: boolean
  ): void {
    this.p.clear();

    this.state.colors = this.colorPalette.generate(paletteSize, pattern);

    // Handle global debug mode first
    if (debugMode) {
      const debugConfig: EffectConfig = {
        type: EffectType.DEBUG_NORMAL,
        intensity: 1,
      };
      this.effects.apply(this.p, debugConfig);
      return;
    }

    // Generate background
    this.backgroundGenerator.generate(
      this.p,
      this.state.colors,
      this.p.width,
      this.p.height
    );

    // Capture background texture before applying effects
    let backgroundTexture = this.p.get();

    // Apply background effects to isolated background
    if (backgroundEffect !== EffectType.OFF) {
      this.p.clear();
      this.p.image(backgroundTexture, -this.p.width / 2, -this.p.height / 2);

      const bgEffectConfig: EffectConfig = {
        type: backgroundEffect,
        layer: LayerType.BACKGROUND,
        intensity: 1,
      };
      this.effects.apply(this.p, bgEffectConfig);

      // Save processed background
      backgroundTexture = this.p.get();
    }

    // Generate shapes for foreground layer
    this.state.shapes = this.shapeGenerator.generate(
      this.p,
      this.state.colors,
      this.p.width,
      this.p.height,
      elementCount
    );

    // Draw shapes on clean canvas to isolate foreground
    this.p.clear();
    this.shapeGenerator.drawShapes(this.p, this.state.shapes);

    // Capture foreground shapes texture
    let foregroundTexture = this.p.get();

    // Apply foreground effects to isolated shapes
    if (foregroundEffect !== EffectType.OFF) {
      const fgEffectConfig: EffectConfig = {
        type: foregroundEffect,
        layer: LayerType.FOREGROUND,
        intensity: 1,
      };
      this.effects.apply(this.p, fgEffectConfig);

      // Save processed foreground
      foregroundTexture = this.p.get();
    }

    // Composite final image: background + foreground
    this.p.clear();
    this.p.push();
    this.p.translate(-this.p.width / 2, -this.p.height / 2);
    this.p.image(backgroundTexture, 0, 0);
    this.p.image(foregroundTexture, 0, 0);
    this.p.pop();
  }

  exportImage(): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `rf617-art-${timestamp}.png`;
    this.p.save(filename);
  }

  getState(): GenerationState {
    return { ...this.state };
  }

  isGenerating(): boolean {
    return this.state.isGenerating;
  }

  getCurrentColors(): Color[] {
    return [...this.state.colors];
  }
}
