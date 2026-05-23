"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import AISearchBar from "../dealers/AISearchBar";
import InquiryModal from "../dealers/InquiryModal";

export default function AISearchPage() {
  const [dealers, setDealers] = useState<any[]>([]);
  const [selectedDealer, setSelectedDealer] = useState<any>(null);

  useEffect(() => {
    async function loadDealers() {
      const { data } = await supabase.from("dealers").select("*").limit(2000);
      if (data) setDealers(data);
    }
    loadDealers();
  }, []);

  return (
    <div className="min-h-screen bg-black font-sans text-white pt-32 pb-20">
      <div className="container-custom max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-4 tracking-tight">
            <span className="gold-text">AI Powered</span> Dealer Match
          </h1>
          <p className="text-charcoal-300 text-lg md:text-xl max-w-2xl mx-auto">
            Describe what you need in plain English, and our AI will find the perfect dealer for you.
          </p>
        </div>
        <AISearchBar allDealers={dealers} onContact={setSelectedDealer} />
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
