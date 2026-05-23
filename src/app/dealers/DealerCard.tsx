"use client";

import { MapPin, Star, ShieldCheck, Clock, Phone, Globe } from "lucide-react";

interface DealerCardProps {
  dealer: any;
  onContact?: (dealer: any) => void;
}

export default function DealerCard({ dealer, onContact }: DealerCardProps) {
  const rating = dealer.average_rating || dealer.rating || 0;
  const totalReviews = dealer.total_reviews || dealer.totalReviews || 0;
  const isVerified = dealer.is_verified || false;
  const isOSM = dealer.source === 'openstreetmap';

  return (
    <div className="bg-charcoal-950 border border-white/5 rounded-2xl overflow-hidden hover:border-gold-500/30 transition-all group flex flex-col h-full shadow-lg">
      {/* Header / Photo area */}
      <div className="h-32 bg-charcoal-900 relative flex items-center justify-center">
        {(dealer.image_url || dealer.photo) ? (
          <img src={dealer.image_url || dealer.photo} alt={dealer.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity absolute inset-0" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-charcoal-800 to-black/60 flex items-center justify-center">
            <span className="text-4xl opacity-20">🚗</span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {isVerified && (
            <div className="bg-green-500/20 text-green-400 backdrop-blur-md px-2 py-1 rounded text-xs font-bold flex items-center gap-1 border border-green-500/30">
              <ShieldCheck size={11} /> VERIFIED
            </div>
          )}
          {dealer.openNow !== null && dealer.openNow !== undefined && (
            <span className={`text-xs px-2 py-1 rounded border backdrop-blur-md flex items-center gap-1 ${dealer.openNow ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
              <Clock size={10} /> {dealer.openNow ? 'Open' : 'Closed'}
            </span>
          )}
        </div>

        {/* Rating badge */}
        {rating > 0 && (
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded border border-white/10 flex items-center gap-1">
            <Star size={11} className="text-gold-500 fill-gold-500" />
            <span className="text-gold-400 text-xs font-bold">{Number(rating).toFixed(1)}</span>
            {totalReviews > 0 && <span className="text-charcoal-400 text-[10px]">({totalReviews})</span>}
          </div>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col">
        {/* Name & Address */}
        <div className="mb-3">
          <h3 className="text-base font-display font-bold text-white group-hover:text-gold-400 transition-colors line-clamp-1">
            {dealer.name}
          </h3>
          <p className="text-charcoal-400 text-xs flex items-start gap-1 mt-1">
            <MapPin size={12} className="shrink-0 mt-0.5 text-gold-500" />
            <span className="line-clamp-2">{dealer.address || `${dealer.city}, ${dealer.state}`}</span>
          </p>
          {dealer.working_hours && (
            <p className="text-charcoal-500 text-xs flex items-center gap-1 mt-1">
              <Clock size={11} /> {dealer.working_hours}
            </p>
          )}
        </div>

        {/* Type tags */}
        {(dealer.category || (dealer.dealer_type && dealer.dealer_type.length > 0)) && (
          <div className="flex flex-wrap gap-1 mb-3">
            {dealer.category ? (
              <span className="text-[10px] text-charcoal-400 bg-white/5 px-2 py-0.5 rounded border border-white/10 capitalize">
                {dealer.category}
              </span>
            ) : (
              dealer.dealer_type.map((t: string) => (
                <span key={t} className="text-[10px] text-charcoal-400 bg-white/5 px-2 py-0.5 rounded border border-white/10 capitalize">
                  {t.replace('_', ' ')}
                </span>
              ))
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-2 mt-auto pt-3 border-t border-white/5">
          {/* Row 1: Phone + WhatsApp */}
          <div className="flex gap-2">
            {dealer.phone ? (
              <a href={`tel:${dealer.phone}`} className="flex-1 flex items-center justify-center gap-1 bg-charcoal-800 hover:bg-charcoal-700 border border-white/5 text-white text-xs py-2 rounded-lg transition-colors font-medium">
                <Phone size={13} /> {dealer.phone}
              </a>
            ) : (
              <div className="flex-1 flex items-center justify-center gap-1 bg-charcoal-900 border border-white/5 text-charcoal-600 text-xs py-2 rounded-lg">
                <Phone size={13} /> No phone listed
              </div>
            )}
          </div>

          {/* Row 2: WhatsApp + Maps */}
          <div className="flex gap-2">
            {(dealer.whatsapp || dealer.whatsapp_url || dealer.whatsappLink) ? (
              <a href={dealer.whatsapp?.startsWith('http') ? dealer.whatsapp : `https://wa.me/91${(dealer.whatsapp || '').replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1 bg-green-700/80 hover:bg-green-600 border border-green-500/20 text-white text-xs py-2 rounded-lg transition-colors font-medium">
                💬 WhatsApp
              </a>
            ) : (
              <div className="flex-1 flex items-center justify-center gap-1 bg-charcoal-900 border border-white/5 text-charcoal-600 text-xs py-2 rounded-lg">
                📵 No WhatsApp
              </div>
            )}

            <a
              href={dealer.google_maps_url || dealer.mapsLink || `https://www.google.com/maps/search/${encodeURIComponent(dealer.name + ' ' + dealer.city + ' India')}`}
              target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1 bg-blue-700/80 hover:bg-blue-600 border border-blue-500/20 text-white text-xs py-2 rounded-lg transition-colors font-medium"
            >
              📍 Maps
            </a>
          </div>

          {/* Row 3: Website + Inquiry */}
          <div className="flex gap-2">
            {dealer.website ? (
              <a href={dealer.website} target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1 bg-charcoal-800 hover:bg-charcoal-700 border border-white/5 text-charcoal-300 text-xs py-2 rounded-lg transition-colors">
                <Globe size={12} /> Website
              </a>
            ) : null}
            {onContact && (
              <button onClick={() => onContact(dealer)} className={`flex-1 flex items-center justify-center gap-1 btn-gold text-black text-xs font-bold py-2 rounded-lg ${!dealer.website ? 'col-span-2' : ''}`}>
                ✉️ Inquiry
              </button>
            )}
          </div>
        </div>

        {/* Source badge */}
        <div className="mt-3 text-[10px] text-charcoal-600 flex items-center gap-1">
          {isOSM ? '🗺️ OpenStreetMap' : dealer.source === 'foursquare' ? '📍 Foursquare' : dealer.source ? `🏢 ${dealer.source}` : '✅ Verified'}
        </div>
      </div>
    </div>
  );
}
