import p5 from 'p5';
import { ColorPalette } from './utils/colorPalette';
import { BackgroundGenerator } from './generators/backgroundGenerator';
import { ShapeGenerator } from './generators/shapeGenerator';
import { GenerationPipeline } from './core/generationPipeline';

// Render at half resolution for performance
const CANVAS_WIDTH = 200;
const CANVAS_HEIGHT = 250;

let pipeline: GenerationPipeline;
let currentPaletteSize = 7;

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
  };
};

function generateArt() {
  pipeline.generate(currentPaletteSize as 5 | 7 | 9);
}

function setupEventListeners() {
  const generateBtn = document.getElementById('generate-btn');
  const exportBtn = document.getElementById('export-btn');
  const paletteSizeSelect = document.getElementById(
    'palette-size'
  ) as HTMLSelectElement;

  generateBtn?.addEventListener('click', generateArt);

  exportBtn?.addEventListener('click', () => {
    pipeline.exportImage();
  });

  paletteSizeSelect?.addEventListener('change', (e) => {
    const target = e.target as HTMLSelectElement;
    currentPaletteSize = parseInt(target.value);
  });
}

new p5(sketch);
