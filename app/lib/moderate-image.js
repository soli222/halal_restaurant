/**
 * Resizes an image file to at most maxWidth px wide, encodes it as base64 JPEG,
 * then calls /api/moderate-image. PDFs and non-image files are skipped (safe).
 *
 * Returns { safe: boolean, reason: string | null }
 */
export async function moderateImage(file, token) {
  if (!file || !file.type.startsWith('image/')) return { safe: true, reason: null };

  try {
    const { base64, mediaType } = await resizeToBase64(file);

    const res = await fetch('/api/moderate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ imageData: base64, mediaType }),
    });

    if (!res.ok) return { safe: true, reason: null }; // fail open on HTTP error
    return await res.json();
  } catch {
    return { safe: true, reason: null }; // fail open on network error
  }
}

/** Resize to max 1024 px wide at 85 % JPEG quality and return base64 string. */
function resizeToBase64(file, maxWidth = 1024) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      const base64 = dataUrl.split(',')[1];
      resolve({ base64, mediaType: 'image/jpeg' });
    };

    img.onerror = reject;
    img.src = url;
  });
}
