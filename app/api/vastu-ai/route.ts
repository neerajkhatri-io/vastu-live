import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { direction, answers, scoreResult } = await request.json();

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      console.error('GOOGLE_AI_API_KEY is not set');
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const situationLines = [
      `Beam or heavy structure above entrance: ${answers.beam ? 'Yes' : 'No'}`,
      `Main door opens inward (into home): ${answers.opens_inward ? 'Yes' : 'No'}`,
      `Entrance area well-lit at night: ${answers.lighting ? 'Yes' : 'No'}`,
      `Toilet or bathroom above or near entrance: ${answers.toilet ? 'Yes' : 'No'}`,
    ];

    const prompt = `You are a warm, knowledgeable Vastu Shastra advisor — like a trusted friend who knows this subject deeply. Speak in plain English, always give actionable advice first.

A homeowner has completed a Vastu check. Here is their exact situation:

GATE DIRECTION: ${direction.name} (${direction.shortCode})
Vastu status: ${direction.status}
Associated deity: ${direction.deity}, Element: ${direction.element}
Standard meaning: ${direction.reason}

THEIR HOME'S SPECIFIC FACTORS:
${situationLines.join('\n')}

OVERALL SCORE: ${scoreResult.label} (${scoreResult.score} out of 7)

Based on this SPECIFIC combination, provide:
1. A "reading" — 2 to 3 warm, personal sentences referencing their actual answers. Mention both positives and concerns. Never be alarmist.
2. Three "tips" — concrete, immediately actionable remedies for their exact situation. If they have a beam, address it. If lighting is missing, make that a tip. First tip must be doable today. Do NOT say "consult a Vastu expert" as the first tip.

Respond ONLY with valid JSON, no markdown formatting:
{"reading": "...", "tips": ["...", "...", "..."]}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    console.log('Gemini raw response:', text.substring(0, 200));

    // Strip markdown code fences if model wraps in them
    const clean = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    const data = JSON.parse(clean);

    if (!data.reading || !Array.isArray(data.tips)) {
      throw new Error('Unexpected response shape from Gemini');
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('Vastu AI error:', err);
    return NextResponse.json({ error: 'AI unavailable' }, { status: 500 });
  }
}
