"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Dealer } from "@/types/dealer";
import { LayoutDashboard, Users, Plus, Star, MessageSquare, BrainCircuit, LogOut, CheckCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("all");
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Stats
  const [stats, setStats] = useState({ total: 0, verified: 0, pending: 0, inquiries: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: dData, error } = await supabase.from('dealers').select('*').order('created_at', { ascending: false });
    
    if (dData) {
      setDealers(dData as Dealer[]);
      setStats(prev => ({
        ...prev,
        total: dData.length,
        verified: dData.filter(d => d.is_verified).length
      }));
    }

    const { count: pendingCount } = await supabase.from('dealer_reviews').select('*', { count: 'exact', head: true });
    const { count: inquiryCount } = await supabase.from('dealer_inquiries').select('*', { count: 'exact', head: true }).eq('status', 'pending');

    setStats(prev => ({
      ...prev,
      pending: pendingCount || 0,
      inquiries: inquiryCount || 0
    }));

    setLoading(false);
  };

  const handleLogout = () => {
    document.cookie = "sb-admin-session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.push("/admin/login");
  };

  const toggleDealerStatus = async (id: string, currentStatus: boolean, field: 'is_active' | 'is_verified') => {
    const { error } = await supabase.from('dealers').update({ [field]: !currentStatus }).eq('id', id);
    if (!error) {
      setDealers(dealers.map(d => d.id === id ? { ...d, [field]: !currentStatus } : d));
    }
  };

  const handleDeleteAllFakeDealers = async () => {
    if (confirm("Are you sure you want to delete ALL dealers? This cannot be undone.")) {
      setLoading(true);
      const { error } = await supabase.from('dealers').delete().not('id', 'is', null);
      if (!error) {
        alert("All fake dealers deleted");
        setDealers([]);
        setStats(prev => ({ ...prev, total: 0, verified: 0 }));
      } else {
        console.error(error);
        alert("Failed to delete dealers");
      }
      setLoading(false);
    }
  };

  const TABS = [
    { id: "all", label: "All Dealers", icon: Users },
    { id: "add", label: "Add New", icon: Plus },
    { id: "reviews", label: "Pending Reviews", icon: Star },
    { id: "inquiries", label: "Inquiries", icon: MessageSquare },
    { id: "ai", label: "AI Scores", icon: BrainCircuit },
  ];

  return (
    <div className="min-h-screen bg-black font-sans text-white flex">
      {/* Sidebar */}
      <div className="w-64 bg-charcoal-950 border-r border-white/10 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-display font-bold text-gold-500 flex items-center gap-2">
            <LayoutDashboard size={20} /> Admin Panel
          </h2>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeTab === tab.id ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20' : 'text-charcoal-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header Stats */}
        <div className="bg-charcoal-950 border-b border-white/10 p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{TABS.find(t => t.id === activeTab)?.label}</h1>
            <p className="text-charcoal-400 text-sm mt-1">Manage your dealer network and AI features.</p>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-black border border-white/10 rounded-lg p-3 text-center min-w-[100px]">
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-[10px] text-charcoal-500 uppercase tracking-wider">Total</div>
            </div>
            <div className="bg-black border border-white/10 rounded-lg p-3 text-center min-w-[100px]">
              <div className="text-2xl font-bold text-green-400">{stats.verified}</div>
              <div className="text-[10px] text-charcoal-500 uppercase tracking-wider">Verified</div>
            </div>
            <div className="bg-black border border-white/10 rounded-lg p-3 text-center min-w-[100px]">
              <div className="text-2xl font-bold text-gold-400">{stats.inquiries}</div>
              <div className="text-[10px] text-charcoal-500 uppercase tracking-wider">Inquiries</div>
            </div>
          </div>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-auto p-6 bg-[#0a0a0a]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
            </div>
          ) : (
            <>
              {activeTab === "all" && (
                <div className="bg-charcoal-950 border border-white/10 rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/50">
                    <h3 className="font-bold">Database Records</h3>
                    <button 
                      onClick={handleDeleteAllFakeDealers}
                      className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
                    >
                      <XCircle size={16} /> Delete All Fake Dealers
                    </button>
                  </div>
                  <table className="w-full text-left text-sm">
                    <thead className="bg-black border-b border-white/10 text-charcoal-400 uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="p-4">Dealer Name</th>
                        <th className="p-4">Location</th>
                        <th className="p-4">AI Score</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {dealers.map(dealer => (
                        <tr key={dealer.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4">
                            <div className="font-bold text-white">{dealer.name}</div>
                            <div className="text-xs text-charcoal-500">{(dealer.dealer_type || []).join(", ") || dealer.type || "Unknown"}</div>
                          </td>
                          <td className="p-4 text-charcoal-300">{dealer.city}, {dealer.state}</td>
                          <td className="p-4">
                            <span className="bg-gold-500/20 text-gold-400 px-2 py-1 rounded text-xs font-bold">{dealer.ai_score}/100</span>
                          </td>
                          <td className="p-4 flex gap-2">
                            <button 
                              onClick={() => toggleDealerStatus(dealer.id, dealer.is_active || false, 'is_active')}
                              className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 ${dealer.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
                            >
                              {dealer.is_active ? <CheckCircle size={12}/> : <XCircle size={12}/>} 
                              {dealer.is_active ? 'ACTIVE' : 'INACTIVE'}
                            </button>
                            <button 
                              onClick={() => toggleDealerStatus(dealer.id, dealer.is_verified || false, 'is_verified')}
                              className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 ${dealer.is_verified ? 'bg-blue-500/20 text-blue-400' : 'bg-charcoal-800 text-charcoal-400'}`}
                            >
                              {dealer.is_verified ? 'VERIFIED' : 'UNVERIFIED'}
                            </button>
                          </td>
                          <td className="p-4">
                            <button className="text-gold-400 hover:text-gold-300 text-xs font-semibold mr-3">Edit</button>
                            <button className="text-red-400 hover:text-red-300 text-xs font-semibold">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "add" && (
                <div className="max-w-2xl bg-charcoal-950 border border-white/10 rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-6">Add New Dealer</h3>
                  <p className="text-charcoal-400 text-sm mb-6">The auto-geocoding feature is currently integrated via API. Form submission will be implemented shortly.</p>
                  {/* Form fields would go here */}
                  <button className="btn-gold px-6 py-2 rounded-lg font-bold">Save Dealer</button>
                </div>
              )}

              {activeTab === "ai" && (
                <div className="max-w-4xl">
                  <div className="bg-gradient-to-r from-gold-900/40 to-charcoal-900 border border-gold-500/20 rounded-xl p-8 mb-8 text-center">
                    <BrainCircuit size={48} className="mx-auto text-gold-500 mb-4" />
                    <h3 className="text-2xl font-bold mb-2">AI Score Recalculation</h3>
                    <p className="text-charcoal-300 mb-6 max-w-lg mx-auto">
                      Run Claude 3.5 Sonnet across all dealers to analyze reviews, ratings, and experience to generate an updated 0-100 trust score.
                    </p>
                    <button className="btn-gold px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 mx-auto">
                      <BrainCircuit size={18} /> Recalculate All AI Scores
                    </button>
                  </div>
                </div>
              )}

              {(activeTab === "reviews" || activeTab === "inquiries") && (
                <div className="text-center py-20">
                  <p className="text-charcoal-400">This module is under development. UI components will be finalized in the next phase.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
