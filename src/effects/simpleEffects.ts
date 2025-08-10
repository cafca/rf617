import p5 from 'p5';

export enum EffectType {
  OFF = 'off',
  BLUR = 'blur',
}

export interface EffectConfig {
  type: EffectType;
  intensity?: number;
}

export class SimpleEffects {
  apply(p: p5, config: EffectConfig): void {
    switch (config.type) {
      case EffectType.OFF:
        // No effect applied
        break;
      case EffectType.BLUR:
        this.applyBlur(p, config.intensity || 1);
        break;
    }
  }

  private applyBlur(p: p5, intensity: number): void {
    // Simple blur effect using p5.js filter
    p.filter(p.BLUR, intensity);
  }
}
