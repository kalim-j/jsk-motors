import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { query, dealers } = await req.json();

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
      results: dealers,
      message: "AI search not configured. Showing all dealers.",
      suggestedCities: [],
      suggestedTypes: []
    });
  }

  const prompt = `You are a dealer search assistant for JSK CAR BODY SHOP India.

User is searching for: "${query}"

Available dealers database:
${JSON.stringify(dealers.slice(0, 20), null, 2)}

Return a JSON object:
{
  "results": [array of matching dealer objects from the database, sorted by relevance],
  "message": "brief explanation of what you found",
  "suggestedCities": ["city1", "city2"],
  "suggestedTypes": ["type1", "type2"]
}

Match dealers based on: name, city, state, specialization, type, car types.
If no exact match, return closest matches.
Return ONLY valid JSON, no markdown.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();
    const text = data.content[0].text;
    const clean = text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);
    return NextResponse.json(result);
  } catch (error) {
    console.error("AI search error:", error);
    return NextResponse.json({
      results: [],
      message: "AI search unavailable. Please use standard filters.",
      suggestedCities: [],
      suggestedTypes: []
    });
  }
}
