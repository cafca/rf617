import p5 from 'p5';
import { ColorPalette, Color, PalettePattern } from './utils/colorPalette';
import { BackgroundGenerator } from './generators/backgroundGenerator';
import { ShapeGenerator } from './generators/shapeGenerator';
import { GenerationPipeline } from './core/generationPipeline';
import { EffectType } from './effects/shaderEffects';

// Render at full display resolution for proper HiDPI
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 500;

let pipeline: GenerationPipeline;
let currentPaletteSize = 7;
let currentElementCount = 1;
let currentPalettePattern = PalettePattern.COMPLEMENTARY;
let currentEffect = EffectType.DISPLACEMENT;
let paletteCanvas: p5;

const sketch = (p: p5) => {
  p.setup = () => {
    // Force pixel density to 1 for consistent rendering
    p.pixelDensity(1);
    const canvas = p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT, p.WEBGL);
    const canvasWrapper = document.getElementById('canvas-wrapper');
    if (canvasWrapper) {
      canvas.parent(canvasWrapper);
    }

    // Canvas is now at native display resolution - no CSS scaling needed
    const canvasElement = canvas.elt as HTMLCanvasElement;
    canvasElement.style.width = '400px';
    canvasElement.style.height = '500px';
    canvasElement.style.imageRendering = 'pixelated'; // Crisp pixel-perfect rendering

    const colorPalette = new ColorPalette();
    const backgroundGenerator = new BackgroundGenerator();
    const shapeGenerator = new ShapeGenerator();

    pipeline = new GenerationPipeline(
      p,
      colorPalette,
      backgroundGenerator,
      shapeGenerator
    );

    setupPaletteCanvas().then(() => {
      setupEventListeners();
      updateLabels();
      generateArt();
    });
  };
};

function generateArt() {
  pipeline.generate(
    currentPaletteSize as 5 | 7 | 9,
    currentElementCount,
    currentPalettePattern,
    currentEffect
  );
  updatePaletteDisplay();
}

function updatePaletteDisplay() {
  if (paletteCanvas && pipeline) {
    const colors = pipeline.getCurrentColors();
    drawPalette(colors);
  }
}

function setupEventListeners() {
  const generateBtn = document.getElementById('generate-btn');
  const exportBtn = document.getElementById('export-btn');
  const patternOptions = document.querySelectorAll('[data-pattern]');
  const colorOptions = document.querySelectorAll('[data-size]');
  const elementOptions = document.querySelectorAll('[data-elements]');
  const effectOptions = document.querySelectorAll('[data-effect]');

  generateBtn?.addEventListener('click', generateArt);

  exportBtn?.addEventListener('click', () => {
    pipeline.exportImage();
  });

  // Pattern option event listeners
  patternOptions.forEach((option) => {
    option.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const pattern = target.dataset.pattern as PalettePattern;

      // Update active state and button text
      patternOptions.forEach((opt) => {
        opt.classList.remove('active');
        const optPattern = opt.getAttribute('data-pattern');
        const shortName = optPattern?.substring(0, 3) || 'com';
        (opt as HTMLElement).textContent = shortName;
      });
      target.classList.add('active');
      const shortName = pattern.substring(0, 3);
      target.textContent = `[${shortName}]`;

      // Update current pattern and label
      currentPalettePattern = pattern;
      updateLabels();

      // Auto-regenerate
      generateArt();
    });
  });

  // Color option event listeners
  colorOptions.forEach((option) => {
    option.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const size = parseInt(target.dataset.size || '7');

      // Update active state and button text
      colorOptions.forEach((opt) => {
        opt.classList.remove('active');
        const optSize = parseInt(opt.getAttribute('data-size') || '7');
        (opt as HTMLElement).textContent = `${optSize}`;
      });
      target.classList.add('active');
      target.textContent = `[${size}]`;

      // Update current palette size and label
      currentPaletteSize = size;
      updateLabels();

      // Auto-regenerate
      generateArt();
    });
  });

  // Element option event listeners
  elementOptions.forEach((option) => {
    option.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const elements = parseInt(target.dataset.elements || '1');

      // Update active state and button text
      elementOptions.forEach((opt) => {
        opt.classList.remove('active');
        const optElements = parseInt(opt.getAttribute('data-elements') || '1');
        (opt as HTMLElement).textContent = `${optElements}`;
      });
      target.classList.add('active');
      target.textContent = `[${elements}]`;

      // Update current element count and label
      currentElementCount = elements;
      updateLabels();

      // Auto-regenerate
      generateArt();
    });
  });

  // Effect option event listeners
  effectOptions.forEach((option) => {
    option.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const effect = target.dataset.effect as EffectType;

      // Update active state and button text
      effectOptions.forEach((opt) => {
        opt.classList.remove('active');
        const optEffect = opt.getAttribute('data-effect');
        (opt as HTMLElement).textContent = optEffect || 'off';
      });
      target.classList.add('active');
      target.textContent = `[${effect}]`;

      // Update current effect and label
      currentEffect = effect;
      updateLabels();

      // Auto-regenerate
      generateArt();
    });
  });
}

function updateLabels() {
  const patternLabel = document.querySelector(
    '.options-section:first-of-type .option-label'
  );
  const colorLabel = document.querySelector(
    '.options-section:nth-of-type(2) .option-label'
  );
  const elementLabel = document.querySelector(
    '.options-section:nth-of-type(3) .option-label'
  );
  const effectLabel = document.querySelector(
    '.options-section:nth-of-type(4) .option-label'
  );

  if (patternLabel) {
    patternLabel.textContent = currentPalettePattern;
  }
  if (colorLabel) {
    colorLabel.textContent = `${currentPaletteSize} colors`;
  }
  if (elementLabel) {
    elementLabel.textContent = `${currentElementCount} element${currentElementCount > 1 ? 's' : ''}`;
  }
  if (effectLabel) {
    effectLabel.textContent = currentEffect;
  }
}

function setupPaletteCanvas() {
  return new Promise<void>((resolve) => {
    const paletteSketch = (p: p5) => {
      p.setup = () => {
        p.pixelDensity(1);
        const canvas = p.createCanvas(90, 12);
        const wrapper = document.getElementById('palette-canvas-wrapper');
        if (wrapper) {
          canvas.parent(wrapper);
        }
        p.noLoop(); // Static canvas, will redraw manually
        resolve(); // Signal that setup is complete
      };
    };

    paletteCanvas = new p5(paletteSketch);
  });
}

function drawPalette(colors: Color[]) {
  if (!paletteCanvas || !colors.length) {
    return;
  }

  // Check if the canvas is ready
  if (
    !('_renderer' in paletteCanvas) ||
    !(paletteCanvas as { _renderer: unknown })._renderer
  ) {
    return;
  }

  paletteCanvas.clear();
  const squareWidth = paletteCanvas.width / colors.length;

  // Sort colors by HSL hue for better visual organization
  const sortedColors = [...colors].sort((a, b) => {
    // Convert RGB to HSL to sort by hue
    const hslA = rgbToHsl(a.r, a.g, a.b);
    const hslB = rgbToHsl(b.r, b.g, b.b);
    return hslA.h - hslB.h;
  });

  sortedColors.forEach((color, index) => {
    paletteCanvas.fill(color.r, color.g, color.b);
    paletteCanvas.noStroke();
    paletteCanvas.rect(
      index * squareWidth,
      0,
      squareWidth,
      paletteCanvas.height
    );
  });
}

function rgbToHsl(
  r: number,
  g: number,
  b: number
): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const maxVal = Math.max(r, g, b);
  const minVal = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (maxVal + minVal) / 2;

  if (maxVal !== minVal) {
    const d = maxVal - minVal;
    s = l > 0.5 ? d / (2 - maxVal - minVal) : d / (maxVal + minVal);

    switch (maxVal) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

new p5(sketch);
