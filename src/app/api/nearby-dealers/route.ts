import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const state = searchParams.get("state") || "Tamil Nadu";
  const city = searchParams.get("city") || "";

  const searchTerm = city || state;
  const locationQuery = encodeURIComponent(`${searchTerm}, India`);

  if (!process.env.FOURSQUARE_API_KEY) {
    return NextResponse.json({ dealers: [], total: 0, error: "FOURSQUARE_API_KEY is missing." }, { status: 500 });
  }

  try {
    // Foursquare Categories:
    // 11005: Car Dealership
    // 11002: Auto Garage / Repair
    // 11006: Auto Parts and Accessories
    const categoryIds = "11005,11002,11006";
    const fields = "fsq_id,name,location,geocodes,categories,tel,website,rating,hours,social_media,description";
    const fsqUrl = `https://api.foursquare.com/v3/places/search?near=${locationQuery}&categories=${categoryIds}&fields=${fields}&limit=50`;

    const res = await fetch(fsqUrl, {
      headers: {
        Authorization: process.env.FOURSQUARE_API_KEY,
        Accept: "application/json"
      }
    });

    if (!res.ok) {
      console.error("Foursquare API error:", await res.text());
      throw new Error(`Foursquare API error: ${res.status}`);
    }

    const data = await res.json();

    const dealers = data.results.map((place: any) => ({
      id: place.fsq_id,
      name: place.name,
      phone: place.tel || null,
      website: place.website || null,
      address: place.location?.formatted_address || null,
      city: place.location?.locality || city || state,
      state: place.location?.region || state,
      type: place.categories && place.categories.length > 0 ? place.categories[0].name.toLowerCase() : "car_dealer",
      lat: place.geocodes?.main?.latitude || null,
      lon: place.geocodes?.main?.longitude || null,
      openingHours: place.hours?.display || null,
      facebook: place.social_media?.facebook_id ? `https://facebook.com/${place.social_media.facebook_id}` : null,
      instagram: place.social_media?.instagram ? `https://instagram.com/${place.social_media.instagram}` : null,
      description: place.description || null,
    }));

    return NextResponse.json({
      dealers,
      total: dealers.length,
      location: { name: searchTerm }
    });

  } catch (error) {
    console.error("Dealer search error:", error);
    return NextResponse.json({ dealers: [], total: 0, error: "Search failed" });
  }
}
