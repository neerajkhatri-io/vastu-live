import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are a warm, knowledgeable Vastu Shastra advisor — like a trusted friend who happens to know this subject deeply. Your tone is calm, compassionate, and never alarmist. You speak plain English, explain any Vastu term you use, and always give actionable advice first before suggesting any professional consultation.`;

export async function POST(request: Request) {
  try {
    const { direction, answers, scoreResult } = await request.json();

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: SYSTEM_PROMPT,
    });

    const situationLines = [
      `Beam or heavy structure above entrance: ${answers.beam ? 'Yes' : 'No'}`,
      `Main door opens inward (into home): ${answers.opens_inward ? 'Yes' : 'No'}`,
      `Entrance area well-lit at night: ${answers.lighting ? 'Yes' : 'No'}`,
      `Toilet or bathroom above or very close to entrance: ${answers.toilet ? 'Yes' : 'No'}`,
    ];

    const prompt = `A homeowner has completed a Vastu check of their main entrance. Here is their exact situation:

GATE DIRECTION
Direction: ${direction.name} (${direction.shortCode})
Vastu status: ${direction.status}
Associated deity: ${direction.deity}
Element: ${direction.element}
Standard meaning: ${direction.reason}

THEIR HOME'S SPECIFIC FACTORS
${situationLines.join('\n')}

OVERALL SCORE
${scoreResult.label} (${scoreResult.score} out of 7)

Based on this specific combination of factors, provide:
1. A "reading" — 2 to 3 warm, personal sentences that acknowledge their actual situation. Reference their specific answers (e.g. if they have a beam AND a toilet near entrance, acknowledge both). Mention something positive even if the score is low.
2. Three "tips" — concrete, immediately actionable remedies tailored to their exact combination. If they have a beam, address it. If lighting is missing, make that a tip. If the direction is inauspicious, give direction-specific remedies. The first tip must be something they can do today. Never start with "consult a Vastu expert".

Respond ONLY with valid JSON, no markdown, no explanation outside JSON:
{"reading": "...", "tips": ["...", "...", "..."]}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Strip markdown code fences if model wraps in them
    const clean = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    const data = JSON.parse(clean);

    return NextResponse.json(data);
  } catch (err) {
    console.error('Vastu AI error:', err);
    return NextResponse.json({ error: 'AI unavailable' }, { status: 500 });
  }
}
