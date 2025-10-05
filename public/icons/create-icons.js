import fs from 'fs';
import { createCanvas } from 'canvas';

function createIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = '#3b82f6';
  ctx.fillRect(0, 0, size, size);
  
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size * 0.5}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SR', size / 2, size / 2);
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`icon${size}.png`, buffer);
}

[16, 48, 128].forEach(size => createIcon(size));
console.log('Icons created successfully');
