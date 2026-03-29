/**
 * K-means clustering for color quantization
 * @param {Array<{r: number, g: number, b: number}>} pixels - Array of rgb objects
 * @param {number} k - Number of clusters (max colors)
 * @returns {Array<{r: number, g: number, b: number}>} Array of centroids
 */
function kMeans(pixels, k) {
  if (pixels.length === 0) {
    return [{ r: 128, g: 128, b: 128 }];
  }

  if (pixels.length <= k) {
    return pixels;
  }

  // Initialize centroids randomly from pixels
  let centroids = [];
  for (let i = 0; i < k; i++) {
    const randomPixel = pixels[Math.floor(Math.random() * pixels.length)];
    centroids.push({ r: randomPixel.r, g: randomPixel.g, b: randomPixel.b });
  }

  // Iterate until convergence or max iterations
  for (let iteration = 0; iteration < 20; iteration++) {
    // Assign pixels to nearest centroid
    const clusters = Array(k).fill(null).map(() => []);

    for (const pixel of pixels) {
      let minDist = Infinity;
      let closestCentroid = 0;

      for (let i = 0; i < centroids.length; i++) {
        const centroid = centroids[i];
        const dist = Math.sqrt(
          Math.pow(pixel.r - centroid.r, 2) +
          Math.pow(pixel.g - centroid.g, 2) +
          Math.pow(pixel.b - centroid.b, 2)
        );

        if (dist < minDist) {
          minDist = dist;
          closestCentroid = i;
        }
      }

      clusters[closestCentroid].push(pixel);
    }

    // Update centroids
    let changed = false;
    for (let i = 0; i < clusters.length; i++) {
      const cluster = clusters[i];
      if (cluster.length === 0) continue;

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
    }

    if (!changed) break;
  }

  return centroids;
}

/**
 * Calculate distance between two colors
 * @param {{r: number, g: number, b: number}} c1
 * @param {{r: number, g: number, b: number}} c2
 * @returns {number} Euclidean distance
 */
function colorDistance(c1, c2) {
  return Math.sqrt(
    Math.pow(c1.r - c2.r, 2) +
    Math.pow(c1.g - c2.g, 2) +
    Math.pow(c1.b - c2.b, 2)
  );
}

/**
 * Find the index of the closest color in palette
 * @param {{r: number, g: number, b: number}} pixel
 * @param {Array<{r: number, g: number, b: number}>} palette
 * @returns {number} Index in palette (0-based)
 */
function findClosestColor(pixel, palette) {
  let minDist = Infinity;
  let closestIndex = 0;

  for (let i = 0; i < palette.length; i++) {
    const dist = colorDistance(pixel, palette[i]);
    if (dist < minDist) {
      minDist = dist;
      closestIndex = i;
    }
  }

  return closestIndex;
}

/**
 * Convert RGB object to hex string
 * @param {{r: number, g: number, b: number}} color
 * @returns {string} Hex color string
 */
function rgbToHex(color) {
  return '#' + [color.r, color.g, color.b]
    .map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    })
    .join('');
}

module.exports = {
  kMeans,
  colorDistance,
  findClosestColor,
  rgbToHex
};
