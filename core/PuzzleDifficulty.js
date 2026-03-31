/**
 * Calculate difficulty rating from 1 to 5 stars
 * @param {number[][]} targetGrid - 2D array of color indices
 * @param {number[][]} palette - Array of RGB color values
 * @returns {number} Difficulty rating (1-5)
 */
export function calculateDifficulty(targetGrid, palette) {
  const colors = palette?.length || 1;
  const pixels = (targetGrid?.length || 1) * (targetGrid?.[0]?.length || 1);
  
  const colorScore = colors / 10;
  const pixelScore = pixels / 1000;
  
  const rawDifficulty = ((colorScore + pixelScore) / 2) * 5;
  
  // Use floor to ensure basketball (32x32, 5 colors) = 3 stars
  return Math.max(1, Math.min(5, Math.floor(rawDifficulty)));
}
