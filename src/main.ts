import p5 from 'p5';
import { ColorPalette } from './utils/colorPalette';
import { BackgroundGenerator } from './generators/backgroundGenerator';
import { ShapeGenerator } from './generators/shapeGenerator';
import { DistortionEffects } from './effects/distortionEffects';
import { GenerationPipeline } from './core/generationPipeline';

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 500;

let pipeline: GenerationPipeline;
let currentPaletteSize = 7;

const sketch = (p: p5) => {
  p.setup = () => {
    const canvas = p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    const canvasWrapper = document.getElementById('canvas-wrapper');
    if (canvasWrapper) {
      canvas.parent(canvasWrapper);
    }

    const colorPalette = new ColorPalette();
    const backgroundGenerator = new BackgroundGenerator();
    const shapeGenerator = new ShapeGenerator();
    const distortionEffects = new DistortionEffects();

    pipeline = new GenerationPipeline(
      p,
      colorPalette,
      backgroundGenerator,
      shapeGenerator,
      distortionEffects
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
