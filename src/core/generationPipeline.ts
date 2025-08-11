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
  backgroundTexture?: p5.Image;
  foregroundTexture?: p5.Image;
  hasStaticContent: boolean;
  processedBackgroundTexture?: p5.Image;
  processedForegroundTexture?: p5.Image;
  lastBackgroundEffect?: EffectType;
  lastForegroundEffect?: EffectType;
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
      hasStaticContent: false,
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
      this.state.hasStaticContent = true;
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      this.state.isGenerating = false;
    }
  }

  updateAnimatedEffects(
    backgroundEffect: EffectType = EffectType.OFF,
    foregroundEffect: EffectType = EffectType.OFF,
    debugMode: boolean = false
  ): void {
    if (!this.state.hasStaticContent || this.state.isGenerating) return;

    try {
      this.applyEffectsToStaticContent(
        backgroundEffect,
        foregroundEffect,
        debugMode
      );
    } catch (error) {
      console.error('Animation update failed:', error);
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
    // Generate static content (colors, shapes, positions)
    this.generateStaticContent(paletteSize, elementCount, pattern);

    // Apply effects to the static content
    this.applyEffectsToStaticContent(
      backgroundEffect,
      foregroundEffect,
      debugMode
    );
  }

  private generateStaticContent(
    paletteSize: 5 | 7 | 9,
    elementCount: number,
    pattern: PalettePattern
  ): void {
    this.p.clear();

    // Generate colors (static)
    this.state.colors = this.colorPalette.generate(paletteSize, pattern);

    // Generate background (static)
    this.backgroundGenerator.generate(
      this.p,
      this.state.colors,
      this.p.width,
      this.p.height
    );
    this.state.backgroundTexture = this.p.get();

    // Generate shapes (static positions and properties)
    this.state.shapes = this.shapeGenerator.generate(
      this.p,
      this.state.colors,
      this.p.width,
      this.p.height,
      elementCount
    );

    // Draw shapes on clean canvas
    this.p.clear();
    this.shapeGenerator.drawShapes(this.p, this.state.shapes);
    this.state.foregroundTexture = this.p.get();
  }

  private applyEffectsToStaticContent(
    backgroundEffect: EffectType,
    foregroundEffect: EffectType,
    debugMode: boolean
  ): void {
    // Handle global debug mode first
    if (debugMode) {
      const debugConfig: EffectConfig = {
        type: EffectType.DEBUG_NORMAL,
        intensity: 1,
      };
      this.p.clear();
      this.effects.apply(this.p, debugConfig);
      return;
    }

    // Process background first
    let processedBackground = this.state.backgroundTexture;
    if (backgroundEffect !== EffectType.OFF && this.state.backgroundTexture) {
      this.p.clear();
      this.p.image(
        this.state.backgroundTexture,
        -this.p.width / 2,
        -this.p.height / 2
      );

      const bgEffectConfig: EffectConfig = {
        type: backgroundEffect,
        layer: LayerType.BACKGROUND,
        intensity: 1,
      };
      this.effects.apply(this.p, bgEffectConfig);

      // Get the processed background
      processedBackground = this.p.get();
    }

    // Process foreground
    let processedForeground = this.state.foregroundTexture;
    if (foregroundEffect !== EffectType.OFF && this.state.foregroundTexture) {
      this.p.clear();
      this.p.image(
        this.state.foregroundTexture,
        -this.p.width / 2,
        -this.p.height / 2
      );

      const fgEffectConfig: EffectConfig = {
        type: foregroundEffect,
        layer: LayerType.FOREGROUND,
        intensity: 1,
      };
      this.effects.apply(this.p, fgEffectConfig);

      // Get the processed foreground
      processedForeground = this.p.get();
    }

    // Update last effect states
    this.state.lastBackgroundEffect = backgroundEffect;
    this.state.lastForegroundEffect = foregroundEffect;

    // Composite final image
    this.p.clear();
    this.p.push();
    this.p.translate(-this.p.width / 2, -this.p.height / 2);

    // Draw background first
    if (processedBackground) {
      this.p.image(processedBackground, 0, 0);
    }

    // Draw foreground on top
    if (processedForeground) {
      this.p.image(processedForeground, 0, 0);
    }

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
