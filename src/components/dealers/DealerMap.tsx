"use client";
import { useEffect, useState } from "react";

interface Dealer {
  id: string;
  name: string;
  lat?: number;
  lon?: number;
  latitude?: number;
  longitude?: number;
  phone?: string | null;
  city?: string | null;
  type?: string | null;
}

export default function DealerMap({ dealers }: { dealers: Dealer[] }) {
  const [MapComponent, setMapComponent] = useState<any>(null);

  useEffect(() => {
    // Dynamic import to avoid SSR issues
    import("react-leaflet").then((rl) => {
      import("leaflet").then((L) => {
        // Fix leaflet marker icons
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });
        setMapComponent({ rl, L });
      });
    });
  }, []);

  const validDealers = dealers.filter(d => (d.lat && d.lon) || (d.latitude && d.longitude));
  const center = validDealers.length > 0
    ? [validDealers[0].lat || validDealers[0].latitude, validDealers[0].lon || validDealers[0].longitude]
    : [20.5937, 78.9629]; // India center

  if (!MapComponent) return (
    <div className="h-[600px] bg-charcoal-900 rounded-xl flex items-center justify-center text-charcoal-400 border border-white/10">
      Loading interactive map...
    </div>
  );

  const { MapContainer, TileLayer, Marker, Popup } = MapComponent.rl;

  return (
    <div className="h-[600px] rounded-xl overflow-hidden border border-white/10 shadow-lg z-0 relative">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <MapContainer center={center as [number, number]} zoom={validDealers.length > 0 ? 10 : 5} style={{ height: "100%", width: "100%", zIndex: 1 }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        {validDealers.map(dealer => {
          const lat = dealer.lat || dealer.latitude;
          const lon = dealer.lon || dealer.longitude;
          return (
            <Marker key={dealer.id} position={[lat as number, lon as number]}>
              <Popup>
                <div style={{ minWidth: "150px" }} className="text-black font-sans">
                  <strong className="text-base">{dealer.name}</strong><br />
                  {dealer.city}<br />
                  {dealer.phone && <a href={`tel:${dealer.phone}`} className="text-blue-600 font-medium block mt-1">📞 {dealer.phone}</a>}
                  <a href={`https://www.google.com/maps?q=${lat},${lon}`} target="_blank" rel="noopener noreferrer" className="block mt-2 text-xs bg-gray-100 p-1 rounded text-center">
                    🗺️ Open in Google Maps
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
