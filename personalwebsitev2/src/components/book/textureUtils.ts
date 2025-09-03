// Create a simple paper texture programmatically
export const createPaperTexture = () => {
  if (typeof document === 'undefined') {
    console.warn('Document not available for texture creation');
    return null;
  }
  
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    console.warn('Canvas context not available');
    return null;
  }
  
  // Create a paper-like gradient
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#fefefe');
  gradient.addColorStop(0.5, '#f8f8f8');
  gradient.addColorStop(1, '#f0f0f0');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add some subtle noise for texture
  for (let i = 0; i < 1000; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const opacity = Math.random() * 0.1;
    ctx.fillStyle = `rgba(200, 200, 200, ${opacity})`;
    ctx.fillRect(x, y, 1, 1);
  }
  
  return canvas.toDataURL();
};

export const createBookCoverTexture = () => {
  if (typeof document === 'undefined') {
    console.warn('Document not available for cover texture creation');
    return null;
  }
  
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    console.warn('Canvas context not available for cover');
    return null;
  }
  
  // Create a magical purple gradient for the cover
  const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
  gradient.addColorStop(0, '#8b5a96');
  gradient.addColorStop(0.5, '#4a0e4e');
  gradient.addColorStop(1, '#2d0a30');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add title text
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 48px serif';
  ctx.textAlign = 'center';
  ctx.fillText("Alyssa's", 256, 200);
  ctx.fillText("Fairy Tale", 256, 260);
  
  ctx.font = '24px serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText("A Magical Story from Jakarta", 256, 320);
  
  return canvas.toDataURL();
};