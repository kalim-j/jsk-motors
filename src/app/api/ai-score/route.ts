import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        score: null,
        message: "AI scoring not configured."
      });
    }

    const prompt = `You are an expert car evaluator for JSK CAR BODY SHOP India.
Analyze the following car details and provide a JSON response with an estimated score.

Car Details:
- Brand: ${data.carBrand}
- Model: ${data.carModel}
- Year: ${data.carYear}
- Expected Price: ₹${data.expectedPrice}
- Damage Level: ${data.damageLevel}
- Damage Description: ${data.damageDescription}
- Location: ${data.city}, ${data.state}

Provide a score out of 10 for the price reasonableness (10 being an excellent deal for the buyer) and a score out of 10 for the car condition (based on the damage level and description).
Return ONLY valid JSON in this exact format:
{
  "priceScore": 8,
  "conditionScore": 5,
  "summary": "Short 1 sentence summary of the evaluation"
}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error("Failed to fetch from Anthropic API");
    }

    const resData = await response.json();
    const text = resData.content[0].text;
    const clean = text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);

    return NextResponse.json(result);
  } catch (error) {
    console.error("AI scoring error:", error);
    return NextResponse.json({
      priceScore: null,
      conditionScore: null,
      summary: "AI scoring unavailable.",
    }, { status: 500 });
  }
}
