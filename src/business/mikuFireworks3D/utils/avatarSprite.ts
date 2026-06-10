export async function sampleAvatarPoints(
  avatarUrl: string,
  sampleStep = 4,
  maxPoints = 500
): Promise<Array<{ x: number; y: number; brightness: number }>> {
  const image = await loadImage(avatarUrl);
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return [];
  }

  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(image, 0, 0, size, size);

  const { data } = ctx.getImageData(0, 0, size, size);
  const points: Array<{ x: number; y: number; brightness: number }> = [];

  for (let y = 0; y < size; y += sampleStep) {
    for (let x = 0; x < size; x += sampleStep) {
      const index = (y * size + x) * 4;
      const alpha = data[index + 3] ?? 0;
      if (alpha < 24) {
        continue;
      }
      const r = data[index] ?? 0;
      const g = data[index + 1] ?? 0;
      const b = data[index + 2] ?? 0;
      const brightness = (r + g + b) / (3 * 255);
      points.push({ x: x - size / 2, y: size / 2 - y, brightness });
      if (points.length >= maxPoints) {
        return points;
      }
    }
  }

  return points;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load avatar image.'));
    image.src = url;
  });
}
