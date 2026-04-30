"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import DealerCard from "./DealerCard";
import DealerMap from "@/components/dealers/DealerMap";
import AISearchBar from "./AISearchBar";
import InquiryModal from "./InquiryModal";
import { CarFront, Map as MapIcon, Grid, Search, Database, Radio } from "lucide-react";
import CustomSelect from "@/components/ui/CustomSelect";

const INDIAN_STATES = [
  "Tamil Nadu", "Delhi", "Maharashtra", "Karnataka", "Gujarat", "Rajasthan",
  "Uttar Pradesh", "West Bengal", "Telangana", "Andhra Pradesh", "Kerala",
  "Madhya Pradesh", "Punjab", "Haryana", "Bihar", "Odisha", "Jharkhand",
  "Assam", "Chhattisgarh", "Uttarakhand", "Himachal Pradesh", "Goa",
  "Tripura", "Meghalaya", "Manipur", "Nagaland", "Arunachal Pradesh",
  "Mizoram", "Sikkim", "Jammu and Kashmir", "Ladakh", "Puducherry", "Chandigarh"
];

const SEARCH_TYPES = [
  "all", "car_dealer", "spare_parts", "car_repair"
];

const TYPE_LABELS: Record<string, string> = {
  all: "All Types",
  car_dealer: "Car Dealer",
  spare_parts: "Spare Parts",
  car_repair: "Body Shop / Repair"
};

const STATE_OPTIONS = INDIAN_STATES.map(s => ({ value: s, label: s }));
const TYPE_OPTIONS = SEARCH_TYPES.map(t => ({ value: t, label: TYPE_LABELS[t] }));

export default function DealersPage() {
  const [dealers, setDealers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [selectedDealer, setSelectedDealer] = useState<any>(null);
  const [dataSource, setDataSource] = useState<string>("");
  const [isLiveSearching, setIsLiveSearching] = useState(false);

  const [selectedCity, setSelectedCity] = useState("");
  const [selectedState, setSelectedState] = useState("Tamil Nadu");
  const [selectedType, setSelectedType] = useState("all");

  const fetchDealers = async (city: string, state: string, type: string) => {
    setLoading(true);
    setIsLiveSearching(false);
    try {
      // Step 1: Try Supabase first (fast, cached)
      let query = supabase
        .from('dealers')
        .select('*')
        .eq('is_active', true)
        .order('average_rating', { ascending: false, nullsFirst: false })
        .limit(50);

      if (city.trim()) {
        query = query.ilike('city', `%${city.trim()}%`);
      } else {
        query = query.ilike('state', `%${state}%`);
      }

      if (type !== 'all') {
        query = query.contains('dealer_type', [type]);
      }

      const { data: supabaseDealers } = await query;

      if (supabaseDealers && supabaseDealers.length > 0) {
        setDealers(supabaseDealers);
        setDataSource('✅ Verified Database');
        setLoading(false);
        return;
      }

      // Step 2: No cached data → fall back to live OSM API
      setIsLiveSearching(true);
      const params = new URLSearchParams({ state, type });
      if (city.trim()) params.set('city', city.trim());

      const res = await fetch(`/api/dealers/osm?${params.toString()}`);
      const data = await res.json();

      if (data.dealers && data.dealers.length > 0) {
        setDealers(data.dealers);
        setDataSource('🗺️ Live from OpenStreetMap');
      } else {
        setDealers([]);
        setDataSource('');
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setDealers([]);
    } finally {
      setLoading(false);
      setIsLiveSearching(false);
    }
  };

  // Auto-load Tamil Nadu dealers on mount
  useEffect(() => {
    fetchDealers("", "Tamil Nadu", "all");
  }, []);

  const handleContact = (dealer: any) => {
    setSelectedDealer(dealer);
  };

  return (
    <div className="min-h-screen bg-black font-sans text-white pt-20 pb-20">
      {/* Hero Banner */}
      <div className="relative border-b border-white/10 overflow-hidden bg-gradient-to-b from-[#111] to-black py-16 mb-10">
        <div className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 50% 50%, rgba(212, 175, 55, 0.15) 0%, transparent 70%)" }}
        />
        <div className="container-custom relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-4 tracking-tight">
            India&apos;s Trusted <span className="gold-text">Auto Dealer Network</span>
          </h1>
          <p className="text-charcoal-300 text-lg md:text-xl max-w-2xl mx-auto mb-8">
            Real car dealers &amp; spare parts suppliers — real phone numbers, real locations
          </p>
          <div className="inline-flex items-center gap-6 glass border border-white/10 rounded-full px-6 py-3 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-semibold text-white">{dealers.length} Dealers Found</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2 text-sm text-charcoal-400">
              <CarFront size={16} /> Pan India
            </div>
            {dataSource && (
              <>
                <div className="w-px h-4 bg-white/10" />
                <span className="text-xs text-charcoal-400 flex items-center gap-1">
                  {isLiveSearching ? <Radio size={12} className="text-green-400 animate-pulse" /> : <Database size={12} />}
                  {dataSource}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="container-custom">
        {/* AI Search Bar */}
        <AISearchBar allDealers={dealers} onContact={handleContact} />

        {/* Location Search */}
        <div className="flex flex-col md:flex-row gap-3 p-4 bg-charcoal-950 rounded-xl border border-white/10 mb-8">
          <input
            value={selectedCity}
            onChange={e => setSelectedCity(e.target.value)}
            onKeyDown={e => e.key === "Enter" && fetchDealers(selectedCity, selectedState, selectedType)}
            placeholder="City (e.g. Chennai, Coimbatore, Delhi, Mumbai...)"
            className="flex-1 bg-black border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-charcoal-600 focus:border-gold-500 focus:outline-none text-sm"
          />
          <CustomSelect
            value={selectedState}
            onChange={setSelectedState}
            options={STATE_OPTIONS}
            className="min-w-[170px]"
          />
          <CustomSelect
            value={selectedType}
            onChange={setSelectedType}
            options={TYPE_OPTIONS}
            className="min-w-[180px]"
          />
          <button
            onClick={() => fetchDealers(selectedCity, selectedState, selectedType)}
            disabled={loading}
            className="btn-gold px-8 py-3 rounded-lg font-bold whitespace-nowrap flex items-center gap-2 justify-center disabled:opacity-60"
          >
            <Search size={16} /> {loading ? "Searching..." : "Search"}
          </button>
        </div>

        {/* Results Header & View Toggle */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-xl font-display font-bold text-white">
            {isLiveSearching ? (
              <span className="flex items-center gap-2">
                <Radio size={18} className="text-green-400 animate-pulse" /> Fetching live data...
              </span>
            ) : (
              <>Results <span className="text-gold-500">({dealers.length})</span></>
            )}
          </h2>
          <div className="flex bg-charcoal-950 border border-white/10 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${viewMode === "grid" ? "bg-white/10 text-white" : "text-charcoal-400 hover:text-white"}`}
            >
              <Grid size={16} /> Grid
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${viewMode === "map" ? "bg-white/10 text-white" : "text-charcoal-400 hover:text-white"}`}
            >
              <MapIcon size={16} /> Map
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-charcoal-900 rounded-xl h-64 animate-pulse border border-white/5" />
            ))}
          </div>
        ) : dealers.length === 0 ? (
          <div className="text-center py-20 glass-dark border border-white/5 rounded-2xl">
            <p className="text-5xl mb-4">🔍</p>
            <h3 className="text-xl font-bold text-white mb-2">No Dealers Found</h3>
            <p className="text-charcoal-400 mb-4">Try searching a different city or change the type filter</p>
            <button
              onClick={() => fetchDealers("", "Tamil Nadu", "all")}
              className="btn-gold px-6 py-2 rounded-lg font-bold"
            >
              Show Tamil Nadu Dealers
            </button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {dealers.map((dealer, idx) => (
              <DealerCard key={dealer.id || dealer.osm_id || idx} dealer={dealer} onContact={handleContact} />
            ))}
          </div>
        ) : (
          <div className="animate-fade-in">
            <div className="mb-4 text-charcoal-300 font-medium text-sm">
              📍 Showing {dealers.filter(d => d.latitude && d.longitude).length} dealers with GPS coordinates on map
            </div>
            <DealerMap dealers={dealers as any} />
          </div>
        )}

        {/* Attribution */}
        {!loading && dealers.length > 0 && (
          <div className="mt-10 text-center text-charcoal-600 text-xs flex items-center justify-center gap-2">
            <span>🗺️ Location data from</span>
            <a href="https://www.openstreetmap.org" target="_blank" rel="noopener noreferrer" className="text-gold-600 hover:text-gold-400 underline transition-colors">
              OpenStreetMap
            </a>
            <span>— Free &amp; Open Data</span>
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
