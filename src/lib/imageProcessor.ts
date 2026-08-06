export async function compressImage(dataUrl: string, maxWidth = 1200, quality = 0.7): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      resolve(dataUrl); // fallback to original if load fails
    };
    img.src = dataUrl;
  });
}
