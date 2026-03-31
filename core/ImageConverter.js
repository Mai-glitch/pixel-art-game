export class ImageConverter {
  constructor(width = 32, height = 32) {
    this.maxColors = 8;
    this.gridWidth = width;
    this.gridHeight = height;
  }

  async convertImage(file, name) {
    const image = await this.loadImage(file);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = this.gridWidth;
    canvas.height = this.gridHeight;
    
    // Resize image preserving aspect ratio
    const imageRatio = image.width / image.height;
    const targetRatio = this.gridWidth / this.gridHeight;
    
    let drawWidth, drawHeight, offsetX, offsetY;
    
    if (imageRatio > targetRatio) {
      // Image wider than target
      drawWidth = this.gridHeight * imageRatio;
      drawHeight = this.gridHeight;
      offsetX = (this.gridWidth - drawWidth) / 2;
      offsetY = 0;
    } else {
      // Image taller than target
      drawWidth = this.gridWidth;
      drawHeight = this.gridWidth / imageRatio;
      offsetX = 0;
      offsetY = (this.gridHeight - drawHeight) / 2;
    }
    
    // Center and draw image
    ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
    
    const imageData = ctx.getImageData(0, 0, this.gridWidth, this.gridHeight);
    const pixels = this.extractPixels(imageData);
    
    const colors = this.extractColors(pixels, this.maxColors);
    const { palette, grid } = this.mapToGrid(pixels, colors);
    
    return {
      id: this.generateId(),
      name: name || 'Untitled',
      targetGrid: grid,
      paintedGrid: Array(this.gridHeight).fill(null).map(() => Array(this.gridWidth).fill(0)),
      palette: palette.slice(0, Math.max(3, palette.length)),
      completedPercent: 0,
      lastPlayed: null
    };
  }

  loadImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      
      reader.onload = (e) => {
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = e.target.result;
      };
      
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  extractPixels(imageData) {
    const pixels = [];
    for (let i = 0; i < imageData.data.length; i += 4) {
      pixels.push({
        r: imageData.data[i],
        g: imageData.data[i + 1],
        b: imageData.data[i + 2],
        a: imageData.data[i + 3]
      });
    }
    return pixels;
  }

  extractColors(pixels, maxColors) {
    const opaquePixels = pixels.filter(p => p.a > 128);
    if (opaquePixels.length === 0) return [{ r: 128, g: 128, b: 128 }];
    
    if (opaquePixels.length <= maxColors) {
      return opaquePixels.map(p => ({ r: p.r, g: p.g, b: p.b }));
    }
    
    return this.kMeans(opaquePixels, maxColors);
  }

  kMeans(pixels, k) {
    let centroids = [];
    for (let i = 0; i < k; i++) {
      const randomPixel = pixels[Math.floor(Math.random() * pixels.length)];
      centroids.push({ r: randomPixel.r, g: randomPixel.g, b: randomPixel.b });
    }
    
    for (let iteration = 0; iteration < 20; iteration++) {
      const clusters = Array(k).fill(null).map(() => []);
      
      pixels.forEach(pixel => {
        let minDist = Infinity;
        let closestCentroid = 0;
        
        centroids.forEach((centroid, i) => {
          const dist = Math.sqrt(
            Math.pow(pixel.r - centroid.r, 2) +
            Math.pow(pixel.g - centroid.g, 2) +
            Math.pow(pixel.b - centroid.b, 2)
          );
          
          if (dist < minDist) {
            minDist = dist;
            closestCentroid = i;
          }
        });
        
        clusters[closestCentroid].push(pixel);
      });
      
      let changed = false;
      clusters.forEach((cluster, i) => {
        if (cluster.length === 0) return;
        
        const newCentroid = {
          r: Math.round(cluster.reduce((sum, p) => sum + p.r, 0) / cluster.length),
          g: Math.round(cluster.reduce((sum, p) => sum + p.g, 0) / cluster.length),
          b: Math.round(cluster.reduce((sum, p) => sum + p.b, 0) / cluster.length)
        };
        
        if (newCentroid.r !== centroids[i].r ||
            newCentroid.g !== centroids[i].g ||
            newCentroid.b !== centroids[i].b) {
          changed = true;
          centroids[i] = newCentroid;
        }
      });
      
      if (!changed) break;
    }
    
    return centroids;
  }

  mapToGrid(pixels, colors) {
    const palette = colors.map(c => this.rgbToHex(c.r, c.g, c.b));
    const grid = [];
    
    for (let y = 0; y < this.gridHeight; y++) {
      const row = [];
      for (let x = 0; x < this.gridWidth; x++) {
        const pixel = pixels[y * this.gridWidth + x];
        if (pixel.a < 128) {
          row.push(0);
        } else {
          let minDist = Infinity;
          let closestColor = 0;
          
          colors.forEach((color, i) => {
            const dist = Math.sqrt(
              Math.pow(pixel.r - color.r, 2) +
              Math.pow(pixel.g - color.g, 2) +
              Math.pow(pixel.b - color.b, 2)
            );
            
            if (dist < minDist) {
              minDist = dist;
              closestColor = i + 1;
            }
          });
          
          row.push(closestColor);
        }
      }
      grid.push(row);
    }
    
    return { palette, grid };
  }

  rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  generateId() {
    return 'puzzle-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }
}
