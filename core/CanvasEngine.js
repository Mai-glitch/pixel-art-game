export class CanvasEngine {
  constructor(canvas, width = 32, height = 32) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.baseSize = 512;
    this.gridWidth = width;
    this.gridHeight = height;
    
    // Calculate pixelSize based on max dimension to maintain square pixels
    const maxDimension = Math.max(this.gridWidth, this.gridHeight);
    this.pixelSize = this.baseSize / maxDimension;
    
    // Calculate actual canvas dimensions
    this.canvasWidth = this.pixelSize * this.gridWidth;
    this.canvasHeight = this.pixelSize * this.gridHeight;

    this.transform = {
      scale: 1.0,
      offsetX: 0,
      offsetY: 0,
      minScale: 0.25,
      maxScale: 5.0
    };

    this.setupCanvas();
  }

  setupCanvas() {
    this.canvas.width = this.canvasWidth;
    this.canvas.height = this.canvasHeight;
    this.canvas.style.width = '100%';
    this.canvas.style.height = 'auto';
    this.canvas.style.maxWidth = `${this.canvasWidth}px`;
  }

  resize(newSize, newWidth = null, newHeight = null) {
    if (newWidth !== null) this.gridWidth = newWidth;
    if (newHeight !== null) this.gridHeight = newHeight;
    
    const maxDimension = Math.max(this.gridWidth, this.gridHeight);
    this.pixelSize = newSize / maxDimension;
    
    this.canvasWidth = this.pixelSize * this.gridWidth;
    this.canvasHeight = this.pixelSize * this.gridHeight;
    
    this.canvas.width = this.canvasWidth;
    this.canvas.height = this.canvasHeight;
    this.canvas.style.maxWidth = `${this.canvasWidth}px`;
  }

  centerCanvas() {
    this.transform.offsetX = 0;
    this.transform.offsetY = 0;
    this.constrainPan();
  }

  zoom(delta, centerX, centerY) {
    const newScale = Math.max(
      this.transform.minScale,
      Math.min(this.transform.maxScale, this.transform.scale + delta)
    );

    if (newScale !== this.transform.scale) {
      const scaleRatio = newScale / this.transform.scale;
      
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
    const scaledWidth = this.canvasWidth * this.transform.scale;
    const scaledHeight = this.canvasHeight * this.transform.scale;
    const rect = this.canvas.getBoundingClientRect();

    if (scaledWidth <= rect.width) {
      // CENTER horizontally when canvas fits
      this.transform.offsetX = (rect.width - scaledWidth) / 2;
    } else {
      this.transform.offsetX = Math.max(
        rect.width - scaledWidth,
        Math.min(0, this.transform.offsetX)
      );
    }

    if (scaledHeight <= rect.height) {
      // CENTER vertically when canvas fits
      this.transform.offsetY = (rect.height - scaledHeight) / 2;
    } else {
      this.transform.offsetY = Math.max(
        rect.height - scaledHeight,
        Math.min(0, this.transform.offsetY)
      );
    }
  }

  screenToGrid(screenX, screenY) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

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
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
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
    if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) return false;
    if (targetGrid[y]?.[x] !== colorIndex) return false;
    return true;
  }

  createThumbnail(targetGrid, palette) {
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = 64;
    thumbCanvas.height = 64;
    const thumbCtx = thumbCanvas.getContext('2d');

    // For thumbnails, use a fixed size and adapt the image
    const maxGridDimension = Math.max(this.gridWidth, this.gridHeight);
    const thumbPixelSize = 64 / maxGridDimension;

    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
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
