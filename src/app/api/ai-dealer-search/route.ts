import { NextResponse } from "next/server";

interface DealerInput {
  id?: string;
  name?: string;
  city?: string;
  state?: string;
  address?: string;
  phone?: string;
  email?: string;
  specializations?: string[];
  dealer_type?: string[];
  source?: string;
  average_rating?: number;
  ai_score?: number;
  is_verified?: boolean;
  [key: string]: any;
}

/**
 * Smart keyword-based dealer search that works without any API key.
 * Parses the user's natural language query to extract city, state, type,
 * and brand keywords, then scores dealers by relevance.
 */
function smartSearch(query: string, dealers: DealerInput[]) {
  const q = query.toLowerCase().trim();
  const words = q.split(/[\s,]+/).filter(w => w.length > 2);

  // Known keyword lists for matching
  const cityKeywords = [
    "chennai", "mumbai", "delhi", "bangalore", "bengaluru", "hyderabad",
    "pune", "kolkata", "ahmedabad", "jaipur", "lucknow", "surat",
    "coimbatore", "kochi", "indore", "nagpur", "bhopal", "patna",
    "krishnagiri", "salem", "madurai", "trichy", "tirunelveli",
    "erode", "vellore", "hosur", "dharmapuri", "theni", "dindigul",
    "thiruvananthapuram", "visakhapatnam", "vijayawada", "chandigarh",
    "gurgaon", "noida", "faridabad", "ghaziabad", "thane", "navi mumbai",
  ];

  const stateKeywords = [
    "tamil nadu", "maharashtra", "karnataka", "telangana", "andhra pradesh",
    "kerala", "gujarat", "rajasthan", "uttar pradesh", "west bengal",
    "delhi", "punjab", "haryana", "bihar", "odisha", "madhya pradesh",
    "jharkhand", "assam", "chhattisgarh", "uttarakhand", "goa",
  ];

  const typeKeywords: Record<string, string[]> = {
    "spare parts": ["spare", "parts", "spares", "accessories", "component"],
    "car repair": ["repair", "body", "shop", "bodyshop", "dent", "paint", "restoration", "service", "mechanic", "garage", "workshop"],
    "car dealer": ["dealer", "showroom", "buy", "sell", "dealership", "motors", "automobiles"],
    "insurance": ["insurance", "claim", "policy", "insurer"],
  };

  const brandKeywords = [
    "honda", "toyota", "hyundai", "maruti", "suzuki", "tata", "mahindra",
    "kia", "ford", "chevrolet", "nissan", "volkswagen", "bmw", "audi",
    "mercedes", "skoda", "renault", "mg", "jeep", "citroen", "isuzu",
  ];

  // Extract city from query
  const matchedCities: string[] = [];
  for (const city of cityKeywords) {
    if (q.includes(city)) matchedCities.push(city);
  }

  // Extract state from query
  const matchedStates: string[] = [];
  for (const state of stateKeywords) {
    if (q.includes(state)) matchedStates.push(state);
  }

  // Extract type from query
  const matchedTypes: string[] = [];
  for (const [typeName, keywords] of Object.entries(typeKeywords)) {
    if (keywords.some(kw => q.includes(kw))) matchedTypes.push(typeName);
  }

  // Extract brand from query
  const matchedBrands: string[] = [];
  for (const brand of brandKeywords) {
    if (q.includes(brand)) matchedBrands.push(brand);
  }

  // Score each dealer
  const scored = dealers.map(dealer => {
    let score = 0;
    const d = {
      name: (dealer.name || "").toLowerCase(),
      city: (dealer.city || "").toLowerCase(),
      state: (dealer.state || "").toLowerCase(),
      address: (dealer.address || "").toLowerCase(),
      source: (dealer.source || "").toLowerCase(),
      types: (dealer.dealer_type || dealer.specializations || []).map((t: string) => t.toLowerCase()),
      email: (dealer.email || "").toLowerCase(),
    };

    // City match (high weight)
    if (matchedCities.length > 0) {
      for (const city of matchedCities) {
        if (d.city.includes(city) || d.address.includes(city)) {
          score += 50;
        }
      }
    }

    // State match
    if (matchedStates.length > 0) {
      for (const state of matchedStates) {
        if (d.state.includes(state)) {
          score += 20;
        }
      }
    }

    // Type match
    if (matchedTypes.length > 0) {
      for (const typeName of matchedTypes) {
        const keywords = typeKeywords[typeName];
        if (keywords.some(kw => d.name.includes(kw) || d.types.some(t => t.includes(kw)) || d.source.includes(kw))) {
          score += 30;
        }
      }
    }

    // Brand match
    if (matchedBrands.length > 0) {
      for (const brand of matchedBrands) {
        if (d.name.includes(brand) || d.types.some(t => t.includes(brand))) {
          score += 40;
        }
      }
    }

    // General keyword match (for words not caught above)
    for (const word of words) {
      if (d.name.includes(word)) score += 10;
      if (d.address.includes(word)) score += 5;
      if (d.source.includes(word)) score += 5;
      if (d.types.some(t => t.includes(word))) score += 8;
    }

    // Bonus for verified dealers
    if (dealer.is_verified) score += 5;
    // Bonus for high AI score
    if (dealer.ai_score && dealer.ai_score > 70) score += 3;
    // Bonus for high rating
    if (dealer.average_rating && dealer.average_rating >= 4) score += 2;

    return { dealer, score };
  });

  // Sort by score descending, filter out zero-score results
  const results = scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(s => s.dealer);

  // Build a helpful message
  const parts: string[] = [];
  if (matchedCities.length > 0) parts.push(`city: ${matchedCities.join(", ")}`);
  if (matchedStates.length > 0) parts.push(`state: ${matchedStates.join(", ")}`);
  if (matchedTypes.length > 0) parts.push(`type: ${matchedTypes.join(", ")}`);
  if (matchedBrands.length > 0) parts.push(`brand: ${matchedBrands.join(", ")}`);

  const message = results.length > 0
    ? `Found ${results.length} dealer${results.length > 1 ? "s" : ""} matching: ${parts.length > 0 ? parts.join(" • ") : `"${query}"`}`
    : `No dealers found matching "${query}". Try broadening your search or checking the spelling.`;

  // Suggest nearby cities if no results in the searched city
  const suggestedCities = results.length === 0 && matchedCities.length > 0
    ? ["Chennai", "Bangalore", "Mumbai", "Krishnagiri", "Coimbatore"].filter(
        c => !matchedCities.includes(c.toLowerCase())
      ).slice(0, 3)
    : [];

  return {
    results: results.slice(0, 20),
    message,
    suggestedCities,
    suggestedTypes: matchedTypes.length === 0 ? ["Car Dealer", "Spare Parts", "Body Shop"] : [],
  };
}

export async function POST(req: Request) {
  const { query, dealers } = await req.json();

  if (!query || !dealers) {
    return NextResponse.json({
      results: [],
      message: "Please enter a search query.",
      suggestedCities: [],
      suggestedTypes: [],
    });
  }

  // Use smart keyword search (works without any API key)
  const result = smartSearch(query, dealers || []);
  return NextResponse.json(result);
}
