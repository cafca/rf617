import p5 from 'p5';
import { ColorPalette, Color } from '../utils/colorPalette';
import { BackgroundGenerator } from '../generators/backgroundGenerator';
import { ShapeGenerator, ShapeConfig } from '../generators/shapeGenerator';
import {
  DistortionEffects,
  DistortionConfig,
} from '../effects/distortionEffects';

export interface GenerationState {
  colors: Color[];
  shapes: ShapeConfig[];
  distortionConfig: DistortionConfig;
  isGenerating: boolean;
}

export class GenerationPipeline {
  private state: GenerationState;

  constructor(
    private p: p5,
    private colorPalette: ColorPalette,
    private backgroundGenerator: BackgroundGenerator,
    private shapeGenerator: ShapeGenerator,
    private distortionEffects: DistortionEffects
  ) {
    this.state = {
      colors: [],
      shapes: [],
      distortionConfig: this.distortionEffects.createRandomConfig(),
      isGenerating: false,
    };
  }

  async generate(paletteSize: 5 | 7 | 9): Promise<void> {
    if (this.state.isGenerating) return;

    this.state.isGenerating = true;

    try {
      await this.executeStages(paletteSize);
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      this.state.isGenerating = false;
    }
  }

  private async executeStages(paletteSize: 5 | 7 | 9): Promise<void> {
    this.p.clear();

    this.state.colors = this.colorPalette.generate(paletteSize);

    await this.stageDelay(100);
    this.backgroundGenerator.generate(
      this.p,
      this.state.colors,
      this.p.width,
      this.p.height
    );

    await this.stageDelay(200);
    this.state.shapes = this.shapeGenerator.generate(
      this.p,
      this.state.colors,
      this.p.width,
      this.p.height,
      12 + Math.floor(Math.random() * 8)
    );

    this.shapeGenerator.drawShapes(this.p, this.state.shapes);

    await this.stageDelay(300);
    this.state.distortionConfig = this.distortionEffects.createRandomConfig();
    this.distortionEffects.apply(this.p, this.state.distortionConfig);
  }

  private async stageDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
