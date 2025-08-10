export interface Color {
  r: number;
  g: number;
  b: number;
  hex: string;
}

export enum PalettePattern {
  COMPLEMENTARY = 'complementary',
  ANALOGOUS = 'analogous',
  TRIADIC = 'triadic'
}

export class ColorPalette {
  private colors: Color[] = [];

  generate(count: 5 | 7 | 9, pattern: PalettePattern = PalettePattern.COMPLEMENTARY): Color[] {
    this.colors = [];

    switch (pattern) {
      case PalettePattern.COMPLEMENTARY:
        this.generateComplementary(count);
        break;
      case PalettePattern.ANALOGOUS:
        this.generateAnalogous(count);
        break;
      case PalettePattern.TRIADIC:
        this.generateTriadic(count);
        break;
    }

    return this.colors;
  }

  private generateComplementary(count: number): void {
    const baseHue = Math.random() * 360;
    const complementHue = (baseHue + 180) % 360;
    const saturationBase = 65 + Math.random() * 20; // More constrained saturation
    
    for (let i = 0; i < count; i++) {
      let hue, saturation, lightness;

      if (i === 0) {
        // Dark color
        hue = baseHue + (Math.random() - 0.5) * 15; // Small hue variation
        saturation = saturationBase + Math.random() * 15;
        lightness = 10 + Math.random() * 20; // Dark (10-30%)
      } else if (i === 1) {
        // Bright color
        hue = complementHue + (Math.random() - 0.5) * 15;
        saturation = saturationBase + Math.random() * 15;
        lightness = 75 + Math.random() * 20; // Bright (75-95%)
      } else {
        // Constrained middle colors
        const useBase = Math.random() > 0.5;
        hue = (useBase ? baseHue : complementHue) + (Math.random() - 0.5) * 20;
        saturation = saturationBase + (Math.random() - 0.5) * 25;
        lightness = 35 + Math.random() * 30; // Mid-range (35-65%)
      }

      saturation = Math.max(40, Math.min(100, saturation));
      lightness = Math.max(5, Math.min(95, lightness));

      const color = this.hslToRgb((hue + 360) % 360 / 360, saturation / 100, lightness / 100);
      this.colors.push(color);
    }
  }

  private generateAnalogous(count: number): void {
    const baseHue = Math.random() * 360;
    const saturationBase = 65 + Math.random() * 20; // More constrained saturation
    const hueRange = 40; // Tighter analogous range for cohesion

    for (let i = 0; i < count; i++) {
      let hue, saturation, lightness;
      
      const hueOffset = (hueRange / (count - 1)) * i - hueRange / 2;
      hue = (baseHue + hueOffset + 360) % 360;
      
      if (i === 0) {
        // Dark color
        saturation = saturationBase + Math.random() * 15;
        lightness = 10 + Math.random() * 20; // Dark (10-30%)
      } else if (i === 1) {
        // Bright color
        saturation = saturationBase + Math.random() * 15;
        lightness = 75 + Math.random() * 20; // Bright (75-95%)
      } else {
        // Constrained middle colors
        saturation = saturationBase + (Math.random() - 0.5) * 25;
        lightness = 35 + Math.random() * 30; // Mid-range (35-65%)
      }
      
      saturation = Math.max(40, Math.min(100, saturation));
      lightness = Math.max(5, Math.min(95, lightness));

      const color = this.hslToRgb(hue / 360, saturation / 100, lightness / 100);
      this.colors.push(color);
    }
  }

  private generateTriadic(count: number): void {
    const baseHue = Math.random() * 360;
    const saturationBase = 65 + Math.random() * 20; // More constrained saturation
    const triadicHues = [baseHue, (baseHue + 120) % 360, (baseHue + 240) % 360];

    for (let i = 0; i < count; i++) {
      let hue, saturation, lightness;
      
      const baseTriadIndex = i % 3;
      hue = triadicHues[baseTriadIndex] + (Math.random() - 0.5) * 15; // Smaller variation for cohesion
      
      if (i === 0) {
        // Dark color
        saturation = saturationBase + Math.random() * 15;
        lightness = 10 + Math.random() * 20; // Dark (10-30%)
      } else if (i === 1) {
        // Bright color
        saturation = saturationBase + Math.random() * 15;
        lightness = 75 + Math.random() * 20; // Bright (75-95%)
      } else {
        // Constrained middle colors
        saturation = saturationBase + (Math.random() - 0.5) * 25;
        lightness = 35 + Math.random() * 30; // Mid-range (35-65%)
      }
      
      saturation = Math.max(40, Math.min(100, saturation));
      lightness = Math.max(5, Math.min(95, lightness));

      const color = this.hslToRgb((hue + 360) % 360 / 360, saturation / 100, lightness / 100);
      this.colors.push(color);
    }
  }

  getColors(): Color[] {
    return this.colors;
  }

  getRandomColor(): Color {
    return this.colors[Math.floor(Math.random() * this.colors.length)];
  }

  private hslToRgb(h: number, s: number, l: number): Color {
    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    const rValue = Math.round(r * 255);
    const gValue = Math.round(g * 255);
    const bValue = Math.round(b * 255);

    return {
      r: rValue,
      g: gValue,
      b: bValue,
      hex: `#${rValue.toString(16).padStart(2, '0')}${gValue.toString(16).padStart(2, '0')}${bValue.toString(16).padStart(2, '0')}`,
    };
  }
}
