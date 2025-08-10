export interface Color {
  r: number;
  g: number;
  b: number;
  hex: string;
}

export class ColorPalette {
  private colors: Color[] = [];

  generate(count: 5 | 7 | 9): Color[] {
    this.colors = [];

    const baseHue = Math.random() * 360;
    const saturationBase = 60 + Math.random() * 30;

    for (let i = 0; i < count; i++) {
      let hue, saturation, lightness;

      if (i === 0) {
        hue = baseHue;
        saturation = saturationBase;
        lightness = 15 + Math.random() * 15;
      } else if (i === 1) {
        hue = (baseHue + 180) % 360;
        saturation = saturationBase + 20;
        lightness = 85 + Math.random() * 10;
      } else {
        const offset = (360 / (count - 2)) * (i - 2);
        hue = (baseHue + offset + (Math.random() - 0.5) * 30) % 360;
        saturation = saturationBase + (Math.random() - 0.5) * 40;
        lightness = 30 + Math.random() * 50;
      }

      saturation = Math.max(0, Math.min(100, saturation));
      lightness = Math.max(0, Math.min(100, lightness));

      const color = this.hslToRgb(hue / 360, saturation / 100, lightness / 100);
      this.colors.push(color);
    }

    return this.colors;
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
