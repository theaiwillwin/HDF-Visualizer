
import React, { useRef, useEffect } from 'react';

interface SimulationCanvasProps {
  psi: number[][];
}

const SimulationCanvas: React.FC<SimulationCanvasProps> = ({ psi }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const gridSize = psi.length;
    const cellSize = width / gridSize;

    ctx.clearRect(0, 0, width, height);

    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const value = Math.max(-2, Math.min(2, psi[i][j])); // Clamp value
        
        // Map value from [-2, 2] to a color
        // Blue for negative, Black for zero, Red for positive
        const normalized = (value + 2) / 4; // Normalize to [0, 1]
        
        let r, g, b;
        if (normalized < 0.5) { // Blue side
            r = 0;
            g = 0;
            b = 255 * (1 - normalized * 2);
        } else { // Red side
            r = 255 * ((normalized - 0.5) * 2);
            g = 0;
            b = 0;
        }
        
        const xStart = Math.floor(j * cellSize);
        const yStart = Math.floor(i * cellSize);
        const xEnd = Math.floor((j + 1) * cellSize);
        const yEnd = Math.floor((i + 1) * cellSize);

        for (let y = yStart; y < yEnd; y++) {
            for (let x = xStart; x < xEnd; x++) {
                const index = (y * width + x) * 4;
                data[index] = r;
                data[index + 1] = g;
                data[index + 2] = b;
                data[index + 3] = 255; // Alpha
            }
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);

  }, [psi]);

  return <canvas ref={canvasRef} width="512" height="512" className="border border-gray-600 rounded-lg shadow-lg" />;
};

export default SimulationCanvas;
