export async function POST(request) {
  const { reviews, restaurant, isPro } = await request.json();

  const prompt = isPro
    ? `You are a restaurant analytics expert. Analyze the following customer reviews for "${restaurant}" and provide a structured analysis with exactly these four sections:

1. Overall sentiment score: X/10
2. Top 3 praised items/aspects (bullet points)
3. Top 3 complaints/criticisms (bullet points)
4. One actionable recommendation for the owner (1-2 sentences)

Be specific and data-driven. Use the ratings ([good]/[average]/[bad]) to inform your scoring.

Reviews:
${reviews}`
    : `You are a helpful assistant. Summarize the following customer reviews for "${restaurant}" in 2-3 sentences. Mention what customers liked, disliked, and the overall sentiment. Be concise and helpful.\n\nReviews:\n${reviews}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: isPro ? 600 : 300,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  const data = await response.json();
  const summary = data.content?.[0]?.text || 'Could not generate summary.';

  return Response.json({ summary });
}
