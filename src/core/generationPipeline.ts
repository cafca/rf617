import p5 from 'p5';
import { ColorPalette, Color, PalettePattern } from '../utils/colorPalette';
import { BackgroundGenerator } from '../generators/backgroundGenerator';
import { ShapeGenerator, ShapeConfig } from '../generators/shapeGenerator';
import {
  ShaderEffects,
  EffectType,
  EffectConfig,
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
    effect: EffectType = EffectType.OFF,
    normalType: 'checker' | 'perlin' = 'checker'
  ): void {
    if (this.state.isGenerating) return;

    this.state.isGenerating = true;

    try {
      this.executeStages(
        paletteSize,
        elementCount,
        pattern,
        effect,
        normalType
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
    effect: EffectType,
    normalType: 'checker' | 'perlin' = 'checker'
  ): void {
    this.p.clear();

    this.state.colors = this.colorPalette.generate(paletteSize, pattern);

    this.backgroundGenerator.generate(
      this.p,
      this.state.colors,
      this.p.width,
      this.p.height
    );

    this.state.shapes = this.shapeGenerator.generate(
      this.p,
      this.state.colors,
      this.p.width,
      this.p.height,
      elementCount
    );

    this.shapeGenerator.drawShapes(this.p, this.state.shapes);

    // Apply effects stage
    if (effect !== EffectType.OFF) {
      const effectConfig: EffectConfig = {
        type: effect,
        intensity: 1,
        normalType: normalType,
      };
      this.effects.apply(this.p, effectConfig);
    }
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
