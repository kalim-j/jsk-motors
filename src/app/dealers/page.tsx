"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Dealer } from "@/types/dealer";
import DealerCard from "./DealerCard";
import FilterBar, { DealerFilters } from "./FilterBar";
import DealerMap from "@/components/dealers/DealerMap";
import AISearchBar from "./AISearchBar";
import InquiryModal from "./InquiryModal";
import { CarFront, Users, Map as MapIcon, Grid } from "lucide-react";

export default function DealersPage() {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCount, setActiveCount] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null);

  const [filters, setFilters] = useState<DealerFilters>({
    search: "",
    state: "All",
    type: "All",
    minRating: 0,
    verifiedOnly: false,
  });

  useEffect(() => {
    async function fetchDealers() {
      setLoading(true);
      const { data, error } = await supabase
        .from('dealers')
        .select('*')
        .eq('is_active', true)
        .order('ai_score', { ascending: false });

      if (error) {
        console.error("Error fetching dealers:", error);
      } else {
        setDealers(data as Dealer[]);
        setActiveCount(data.length);
      }
      setLoading(false);
    }

    fetchDealers();
  }, []);

  const states = useMemo(() => {
    const s = new Set(dealers.map(d => d.state).filter(Boolean) as string[]);
    return Array.from(s).sort();
  }, [dealers]);

  const filteredDealers = useMemo(() => {
    return dealers.filter(dealer => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matchName = dealer.name.toLowerCase().includes(q);
        const matchCity = dealer.city?.toLowerCase().includes(q);
        const matchSpec = dealer.specializations.some(s => s.toLowerCase().includes(q));
        if (!matchName && !matchCity && !matchSpec) return false;
      }
      if (filters.state !== "All" && dealer.state !== filters.state) return false;
      if (filters.type !== "All" && !dealer.dealer_type.includes(filters.type) && !dealer.dealer_type.includes("both")) return false;
      if (dealer.average_rating < filters.minRating) return false;
      if (filters.verifiedOnly && !dealer.is_verified) return false;
      return true;
    });
  }, [dealers, filters]);

  const handleContact = (dealer: Dealer) => {
    setSelectedDealer(dealer);
  };

  return (
    <div className="min-h-screen bg-black font-sans text-white pt-20 pb-20">
      <div className="relative border-b border-white/10 overflow-hidden bg-gradient-to-b from-[#111] to-black py-16 mb-10">
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(212, 175, 55, 0.15) 0%, transparent 70%)' }}></div>
        
        <div className="container-custom relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-4 tracking-tight">
            India&apos;s Trusted <span className="gold-text">Auto Dealer Network</span>
          </h1>
          <p className="text-charcoal-300 text-lg md:text-xl max-w-2xl mx-auto mb-8">
            Find verified car dealers & spare parts suppliers near you — powered by AI
          </p>
          
          <div className="inline-flex items-center gap-6 glass border border-white/10 rounded-full px-6 py-3 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm font-semibold text-white">{activeCount} Active Dealers</span>
            </div>
            <div className="w-px h-4 bg-white/10"></div>
            <div className="flex items-center gap-2 text-sm text-charcoal-400">
              <CarFront size={16} /> Pan India
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom">
        {/* Step 5: AI Search Bar */}
        <AISearchBar allDealers={dealers} onContact={handleContact} />

        {/* Step 3: Smart Filter Bar */}
        <FilterBar onFilterChange={setFilters} states={states} />

        {/* Results Info & View Toggle */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-xl font-display font-bold text-white">
            Search Results <span className="text-gold-500">({filteredDealers.length})</span>
          </h2>
          
          <div className="flex bg-charcoal-950 border border-white/10 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                viewMode === "grid" ? "bg-white/10 text-white" : "text-charcoal-400 hover:text-white"
              }`}
            >
              <Grid size={16} /> Grid
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                viewMode === "map" ? "bg-white/10 text-white" : "text-charcoal-400 hover:text-white"
              }`}
            >
              <MapIcon size={16} /> Map
            </button>
          </div>
        </div>

        {/* Dealer Grid or Map */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-96 rounded-2xl glass border border-white/5 skeleton"></div>
            ))}
          </div>
        ) : filteredDealers.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
              {filteredDealers.map(dealer => (
                <DealerCard key={dealer.id} dealer={dealer} onContact={handleContact} />
              ))}
            </div>
          ) : (
            <div className="animate-fade-in">
              <div className="mb-4 text-charcoal-300 font-medium text-sm">
                📍 Showing {filteredDealers.filter(d => d.latitude && d.longitude).length} dealers with location data on the map
              </div>
              <DealerMap dealers={filteredDealers as any} />
            </div>
          )
        ) : (
          <div className="text-center py-20 glass-dark border border-white/5 rounded-2xl">
            <Users size={48} className="mx-auto mb-4 text-charcoal-600" />
            <h3 className="text-xl font-bold text-white mb-2">No Dealers Found</h3>
            <p className="text-charcoal-400">Try adjusting your filters or search query.</p>
          </div>
        )}
      </div>

      {selectedDealer && (
        <InquiryModal 
          dealer={selectedDealer} 
          onClose={() => setSelectedDealer(null)} 
        />
      )}
    </div>
  );
}
