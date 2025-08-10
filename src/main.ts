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
let currentElementCount = 3;

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
  pipeline.generate(currentPaletteSize as 5 | 7 | 9, currentElementCount);
}

function setupEventListeners() {
  const generateBtn = document.getElementById('generate-btn');
  const exportBtn = document.getElementById('export-btn');
  const colorSliderOptions = document.querySelectorAll('.color-slider .slider-option');
  const elementsSliderOptions = document.querySelectorAll('.elements-slider .slider-option');
  const currentOptionsDisplay = document.getElementById('current-options');

  generateBtn?.addEventListener('click', generateArt);

  exportBtn?.addEventListener('click', () => {
    pipeline.exportImage();
  });

  // Color slider event listeners
  colorSliderOptions.forEach((option) => {
    option.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const size = parseInt(target.dataset.size || '7');
      
      // Update active state for color slider
      colorSliderOptions.forEach(opt => opt.classList.remove('active'));
      target.classList.add('active');
      
      // Update current palette size
      currentPaletteSize = size;
      updateOptionsDisplay();
      
      // Auto-regenerate
      generateArt();
    });
  });

  // Elements slider event listeners
  elementsSliderOptions.forEach((option) => {
    option.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const elements = parseInt(target.dataset.elements || '3');
      
      // Update active state for elements slider
      elementsSliderOptions.forEach(opt => opt.classList.remove('active'));
      target.classList.add('active');
      
      // Update current element count
      currentElementCount = elements;
      updateOptionsDisplay();
      
      // Auto-regenerate
      generateArt();
    });
  });

  function updateOptionsDisplay() {
    if (currentOptionsDisplay) {
      currentOptionsDisplay.textContent = `${currentPaletteSize} colors, ${currentElementCount} elements`;
    }
  }
}

new p5(sketch);
