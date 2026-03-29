export class CanvasEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.baseSize = 512;
    this.gridSize = 32;
    this.pixelSize = this.baseSize / this.gridSize;

    this.transform = {
      scale: 1.0,
      offsetX: 0,
      offsetY: 0,
      minScale: 1.0,
      maxScale: 5.0
    };

    this.setupCanvas();
  }

  setupCanvas() {
    this.canvas.width = this.baseSize;
    this.canvas.height = this.baseSize;
    this.canvas.style.width = '100%';
    this.canvas.style.height = 'auto';
    this.canvas.style.maxWidth = '512px';
  }

  resetView() {
    this.transform.scale = 1.0;
    this.transform.offsetX = 0;
    this.transform.offsetY = 0;
  }

  zoom(delta, centerX, centerY) {
    const newScale = Math.max(
      this.transform.minScale,
      Math.min(this.transform.maxScale, this.transform.scale + delta)
    );

    if (newScale !== this.transform.scale) {
      const scaleRatio = newScale / this.transform.scale;
      const rect = this.canvas.getBoundingClientRect();

      this.transform.offsetX = centerX - (centerX - this.transform.offsetX) * scaleRatio;
      this.transform.offsetY = centerY - (centerY - this.transform.offsetY) * scaleRatio;
      this.transform.scale = newScale;

      this.constrainPan();
    }
  }

  pan(deltaX, deltaY) {
    this.transform.offsetX += deltaX;
    this.transform.offsetY += deltaY;
    this.constrainPan();
  }

  constrainPan() {
    const scaledSize = this.baseSize * this.transform.scale;
    const maxOffsetX = Math.max(0, (scaledSize - this.canvas.width) / 2);
    const maxOffsetY = Math.max(0, (scaledSize - this.canvas.height) / 2);

    this.transform.offsetX = Math.max(-maxOffsetX, Math.min(maxOffsetX, this.transform.offsetX));
    this.transform.offsetY = Math.max(-maxOffsetY, Math.min(maxOffsetY, this.transform.offsetY));
  }

  screenToGrid(screenX, screenY) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    // screenX and screenY are already relative to the canvas (local coordinates)
    // Convert to canvas pixels then to grid coordinates
    const x = screenX * scaleX;
    const y = screenY * scaleY;

    const gridX = Math.floor((x - this.transform.offsetX) / (this.pixelSize * this.transform.scale));
    const gridY = Math.floor((y - this.transform.offsetY) / (this.pixelSize * this.transform.scale));

    return { x: gridX, y: gridY };
  }

  desaturateColor(hex, opacity = 0.3) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    return `rgba(${gray}, ${gray}, ${gray}, ${opacity})`;
  }

  applyColorOpacity(hex, opacity = 0.4) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  render(targetGrid, paintedGrid, palette, renderMode = 'editor') {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    this.ctx.translate(this.transform.offsetX, this.transform.offsetY);
    this.ctx.scale(this.transform.scale, this.transform.scale);

    this.drawGrid(targetGrid, paintedGrid, palette, renderMode);

    this.ctx.restore();
  }

  drawGrid(targetGrid, paintedGrid, palette, renderMode = 'editor') {
    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        const targetColor = targetGrid[y]?.[x] || 0;
        const isPainted = paintedGrid[y]?.[x] === 1;

        const pixelX = x * this.pixelSize;
        const pixelY = y * this.pixelSize;

        if (targetColor > 0) {
          if (isPainted) {
            this.ctx.fillStyle = palette[targetColor - 1];
            this.ctx.fillRect(pixelX, pixelY, this.pixelSize, this.pixelSize);
          } else {
            if (renderMode === 'homepage') {
              const fadedColor = this.applyColorOpacity(palette[targetColor - 1]);
              this.ctx.fillStyle = fadedColor;
              this.ctx.fillRect(pixelX, pixelY, this.pixelSize, this.pixelSize);
            } else {
              const desaturated = this.desaturateColor(palette[targetColor - 1]);
              this.ctx.fillStyle = desaturated;
              this.ctx.fillRect(pixelX, pixelY, this.pixelSize, this.pixelSize);

              this.ctx.fillStyle = '#ffffff';
              this.ctx.font = `bold ${this.pixelSize * 0.5}px sans-serif`;
              this.ctx.textAlign = 'center';
              this.ctx.textBaseline = 'middle';
              this.ctx.fillText(
                targetColor.toString(),
                pixelX + this.pixelSize / 2,
                pixelY + this.pixelSize / 2
              );
            }
          }
        }

        this.ctx.strokeStyle = '#4a1c4a';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(pixelX, pixelY, this.pixelSize, this.pixelSize);
      }
    }
  }

  paintPixel(x, y, colorIndex, targetGrid) {
    if (x < 0 || x >= this.gridSize || y < 0 || y >= this.gridSize) return false;
    if (targetGrid[y]?.[x] !== colorIndex) return false;
    return true;
  }

  createThumbnail(targetGrid, palette) {
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = 64;
    thumbCanvas.height = 64;
    const thumbCtx = thumbCanvas.getContext('2d');

    const thumbPixelSize = 64 / this.gridSize;

    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        const colorIndex = targetGrid[y]?.[x] || 0;
        if (colorIndex > 0) {
          thumbCtx.fillStyle = palette[colorIndex - 1];
          thumbCtx.fillRect(x * thumbPixelSize, y * thumbPixelSize, thumbPixelSize, thumbPixelSize);
        }
      }
    }

    return thumbCanvas.toDataURL();
  }
}
