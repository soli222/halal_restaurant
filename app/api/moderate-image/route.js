import { verifyToken } from '../../lib/auth-helpers';

const ALLOWED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
// ~2 MB base64 limit (base64 overhead ≈ 4/3, so 2 MB raw ≈ 2.7 MB base64)
const MAX_BASE64_LENGTH = 2_800_000;

export async function POST(request) {
  const { uid } = await verifyToken(request);
  if (!uid) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  let imageData, mediaType;
  try {
    ({ imageData, mediaType } = await request.json());
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!imageData || !mediaType) {
    return Response.json({ error: 'Missing imageData or mediaType' }, { status: 400 });
  }

  if (typeof imageData !== 'string' || imageData.length > MAX_BASE64_LENGTH) {
    return Response.json({ error: 'Image too large' }, { status: 413 });
  }

  // PDFs and non-image files pass through — only inspect images
  if (!ALLOWED_MEDIA_TYPES.includes(mediaType)) {
    return Response.json({ safe: true });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 120,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mediaType, data: imageData },
              },
              {
                type: 'text',
                text: `You are a content moderator for HalalSpot, a halal restaurant review platform. Analyse this image strictly.

REJECT (respond UNSAFE) if the image contains ANY of:
- Nudity, sexual content, or suggestive imagery
- Drug use, drug paraphernalia, or illegal substances
- Graphic violence, gore, or self-harm
- Hate symbols, offensive gestures, or extremist content
- Alcohol or alcoholic beverages being consumed or promoted

ACCEPT (respond SAFE) if the image shows:
- Food, beverages (non-alcoholic), or restaurant dishes
- Restaurant interiors, exteriors, menus, or decor
- Business documents, certificates, or licences
- People dining in appropriate attire

Respond with exactly one line:
SAFE
or
UNSAFE: [one short reason, max 8 words]`,
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    const result = data.content?.[0]?.text?.trim() ?? 'SAFE';
    const safe = result.toUpperCase().startsWith('SAFE');
    const reason = safe ? null : result.replace(/^UNSAFE:\s*/i, '').trim();

    return Response.json({ safe, reason });
  } catch (err) {
    console.error('moderate-image error:', err);
    // Fail open — don't block legitimate uploads if the AI service is unavailable
    return Response.json({ safe: true });
  }
}
