import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const state = searchParams.get("state") || "Tamil Nadu";
  const city = searchParams.get("city") || "";

  // Use direct bbox search instead of area search - more reliable
  const searchTerm = city || state;

  // First get coordinates for the location using Nominatim (free)
  const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchTerm + ", India")}&format=json&limit=1`;

  try {
    const geoRes = await fetch(nominatimUrl, {
      headers: { "User-Agent": "JSKCarBodyShop/1.0" }
    });
    const geoData = await geoRes.json();

    if (!geoData || geoData.length === 0) {
      return NextResponse.json({ dealers: [], total: 0 });
    }

    const { lat, lon, boundingbox } = geoData[0];
    const [minLat, maxLat, minLon, maxLon] = boundingbox;

    // Search for car-related businesses in the bounding box
    const overpassQuery = `
      [out:json][timeout:30];
      (
        node["shop"="car"](${minLat},${minLon},${maxLat},${maxLon});
        node["shop"="car_parts"](${minLat},${minLon},${maxLat},${maxLon});
        node["shop"="car_repair"](${minLat},${minLon},${maxLat},${maxLon});
        node["amenity"="car_rental"](${minLat},${minLon},${maxLat},${maxLon});
        node["shop"="tyres"](${minLat},${minLon},${maxLat},${maxLon});
        node["shop"="automotive"](${minLat},${minLon},${maxLat},${maxLon});
        way["shop"="car"](${minLat},${minLon},${maxLat},${maxLon});
        way["shop"="car_repair"](${minLat},${minLon},${maxLat},${maxLon});
        way["shop"="car_parts"](${minLat},${minLon},${maxLat},${maxLon});
      );
      out body;
      >;
      out skel qt;
    `;

    const overpassRes = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: overpassQuery,
      headers: { "Content-Type": "text/plain" }
    });

    const overpassData = await overpassRes.json();

    const dealers = overpassData.elements
      .filter((el: any) => el.tags?.name)
      .slice(0, 50) // limit to 50 results
      .map((el: any) => ({
        id: el.id.toString(),
        name: el.tags.name,
        phone: el.tags.phone || el.tags["contact:phone"] || el.tags["phone:mobile"] || null,
        website: el.tags.website || el.tags["contact:website"] || null,
        address: [
          el.tags["addr:housenumber"],
          el.tags["addr:street"],
          el.tags["addr:suburb"]
        ].filter(Boolean).join(", ") || null,
        city: el.tags["addr:city"] || city || state,
        state: el.tags["addr:state"] || state,
        type: el.tags.shop || el.tags.amenity || "car_dealer",
        lat: el.lat || null,
        lon: el.lon || null,
        openingHours: el.tags["opening_hours"] || null,
      }));

    return NextResponse.json({
      dealers,
      total: dealers.length,
      location: { lat, lon, name: searchTerm }
    });

  } catch (error) {
    console.error("Dealer search error:", error);
    return NextResponse.json({ dealers: [], total: 0, error: "Search failed" });
  }
}
