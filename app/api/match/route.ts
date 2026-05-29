import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  const { cvText, jobTitle, jobDescription, mustHaves } = await req.json();

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { score: null, reason: "No AI key configured. Using keyword matching instead." },
      { status: 200 }
    );
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const prompt = `You are a recruiter evaluating a candidate CV against a job opening.

JOB TITLE: ${jobTitle}
MUST-HAVES: ${mustHaves}
JOB DESCRIPTION: ${jobDescription}

CANDIDATE CV:
${String(cvText || "").slice(0, 3000)}

Score this candidate from 0 to 100 based on how well they match the role.
Return ONLY a JSON object like this, with no markdown and no extra text:
{"score": 74, "reason": "Strong React and accessibility background, but lacks design system experience mentioned in must-haves."}`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 120,
      temperature: 0.2
    });

    const text = response.choices[0]?.message?.content?.trim() ?? "";
    const parsed = JSON.parse(text);
    return NextResponse.json({ score: parsed.score, reason: parsed.reason });
  } catch {
    return NextResponse.json(
      { score: null, reason: "AI scoring unavailable. Using keyword matching instead." },
      { status: 200 }
    );
  }
}
