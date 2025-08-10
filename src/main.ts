import p5 from 'p5';
import { ColorPalette, Color, PalettePattern } from './utils/colorPalette';
import { BackgroundGenerator } from './generators/backgroundGenerator';
import { ShapeGenerator } from './generators/shapeGenerator';
import { GenerationPipeline } from './core/generationPipeline';

// Render at half resolution for performance
const CANVAS_WIDTH = 200;
const CANVAS_HEIGHT = 250;

let pipeline: GenerationPipeline;
let currentPaletteSize = 7;
let currentElementCount = 3;
let currentPalettePattern = PalettePattern.ANALOGOUS;
let paletteCanvas: p5;

const sketch = (p: p5) => {
  p.setup = () => {
    // Force pixel density to 1 for consistent rendering
    p.pixelDensity(1);
    const canvas = p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    const canvasWrapper = document.getElementById('canvas-wrapper');
    if (canvasWrapper) {
      canvas.parent(canvasWrapper);
    }

    // Scale up the canvas with CSS for display
    const canvasElement = canvas.elt as HTMLCanvasElement;
    canvasElement.style.width = '400px';
    canvasElement.style.height = '500px';
    canvasElement.style.imageRendering = 'auto'; // Better scaling

    const colorPalette = new ColorPalette();
    const backgroundGenerator = new BackgroundGenerator();
    const shapeGenerator = new ShapeGenerator();

    pipeline = new GenerationPipeline(
      p,
      colorPalette,
      backgroundGenerator,
      shapeGenerator
    );

    generateArt();
    setupEventListeners();
    setupPaletteCanvas();
  };
};

function generateArt() {
  pipeline.generate(
    currentPaletteSize as 5 | 7 | 9,
    currentElementCount,
    currentPalettePattern
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
      const elements = parseInt(target.dataset.elements || '3');

      // Update active state and button text
      elementOptions.forEach((opt) => {
        opt.classList.remove('active');
        const optElements = parseInt(opt.getAttribute('data-elements') || '3');
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

    if (patternLabel) {
      patternLabel.textContent = currentPalettePattern;
    }
    if (colorLabel) {
      colorLabel.textContent = `${currentPaletteSize} colors`;
    }
    if (elementLabel) {
      elementLabel.textContent = `${currentElementCount} elements`;
    }
  }
}

function setupPaletteCanvas() {
  const paletteSketch = (p: p5) => {
    p.setup = () => {
      p.pixelDensity(1);
      const canvas = p.createCanvas(90, 12);
      const wrapper = document.getElementById('palette-canvas-wrapper');
      if (wrapper) {
        canvas.parent(wrapper);
      }
      p.noLoop(); // Static canvas, will redraw manually
    };
  };

  paletteCanvas = new p5(paletteSketch);
}

function drawPalette(colors: Color[]) {
  if (!paletteCanvas || !colors.length) return;

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

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
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
