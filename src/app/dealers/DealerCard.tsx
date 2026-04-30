import { Dealer } from "@/types/dealer";
import { Search, MapPin, Star, Phone, ShieldCheck } from "lucide-react";
import Image from "next/image";

interface DealerCardProps {
  dealer: Dealer;
  onContact: (dealer: Dealer) => void;
}

const cleanPhone = (phone: string) => phone.replace(/[\s\-\+]/g, "").replace(/^91/, "").replace(/^0/, "");

export default function DealerCard({ dealer, onContact }: DealerCardProps) {
  return (
    <div className="bg-charcoal-950 border border-white/5 rounded-2xl overflow-hidden hover:border-gold-500/30 transition-all group flex flex-col h-full shadow-lg">
      <div className="h-40 bg-charcoal-900 relative flex items-center justify-center p-4">
        {dealer.images && dealer.images.length > 0 ? (
          <Image
            src={dealer.images[0]}
            alt={dealer.name}
            fill
            className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-charcoal-800 to-black/50" />
        )}
        <div className="absolute top-4 left-4 flex gap-2">
          {dealer.is_verified && (
            <div className="bg-green-500/20 text-green-400 backdrop-blur-md px-2 py-1 rounded text-xs font-bold flex items-center gap-1 border border-green-500/30">
              <ShieldCheck size={12} /> VERIFIED
            </div>
          )}
        </div>
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-2 py-1 rounded border border-white/10 flex items-center gap-1">
          <Star size={12} className="text-gold-500 fill-gold-500" />
          <span className="text-gold-400 text-xs font-bold">{dealer.average_rating.toFixed(1)}</span>
          <span className="text-charcoal-400 text-[10px]">({dealer.total_reviews})</span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="mb-4">
          <h3 className="text-xl font-display font-bold text-white group-hover:text-gold-400 transition-colors line-clamp-1">
            {dealer.name}
          </h3>
          <p className="text-charcoal-400 text-sm flex items-start gap-1 mt-1">
            <MapPin size={14} className="shrink-0 mt-0.5 text-gold-500" />
            <span className="line-clamp-2">{dealer.address}, {dealer.city}, {dealer.state}</span>
          </p>
        </div>

        {dealer.ai_score > 0 && (
          <div className="mb-4 bg-gold-500/10 border border-gold-500/20 rounded-lg p-3 group/tooltip relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gold-400">AI Trust Score</span>
              <span className="text-sm font-bold text-white">{dealer.ai_score}/100</span>
            </div>
            <p className="text-[11px] text-charcoal-300 mt-1 line-clamp-2">
              {dealer.ai_recommendation_reason}
            </p>
          </div>
        )}

        <div className="mb-4 space-y-3 flex-1">
          <div>
            <p className="text-[10px] text-charcoal-500 uppercase font-semibold tracking-wider mb-1.5">Dealer Type</p>
            <div className="flex flex-wrap gap-1">
              {dealer.dealer_type.map((type) => (
                <span key={type} className="text-xs text-charcoal-300 bg-white/5 px-2 py-1 rounded border border-white/10">
                  {type.replace('_', ' ').toUpperCase()}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] text-charcoal-500 uppercase font-semibold tracking-wider mb-1.5">Specializations</p>
            <div className="flex flex-wrap gap-1">
              {dealer.specializations.map((spec) => (
                <span key={spec} className="text-xs text-charcoal-300 bg-white/5 px-2 py-1 rounded border border-white/10">
                  {spec.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-4 border-t border-white/5 mt-auto">
          {dealer.phone && (
            <>
              <a href={`tel:${dealer.phone}`} className="flex items-center justify-center gap-1 bg-gray-800 hover:bg-gray-700 text-white text-xs px-3 py-2.5 rounded-lg transition-colors">
                📞 Call
              </a>
              <a href={`https://wa.me/91${cleanPhone(dealer.phone)}?text=Hi, I found your dealership on JSK CAR BODY SHOP. I am interested.`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1 bg-green-700 hover:bg-green-600 text-white text-xs px-3 py-2.5 rounded-lg transition-colors">
                💬 WhatsApp
              </a>
            </>
          )}
          <a href={dealer.latitude && dealer.longitude ? `https://www.google.com/maps?q=${dealer.latitude},${dealer.longitude}` : `https://www.google.com/maps/search/${encodeURIComponent(dealer.name + " " + dealer.city + " India")}`} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-center gap-1 bg-blue-700 hover:bg-blue-600 text-white text-xs px-3 py-2.5 rounded-lg transition-colors ${!dealer.phone ? 'col-span-1' : ''}`}>
            🗺️ Maps
          </a>
          <a href={`https://wa.me/?text=Join JSK CAR BODY SHOP dealer network free: https://jsk-car-body-shop.vercel.app/dealers/register`} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-center gap-1 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold px-3 py-2.5 rounded-lg transition-colors ${!dealer.phone ? 'col-span-1' : ''}`}>
            ➕ Invite
          </a>
        </div>
      </div>
    </div>
  );
}
