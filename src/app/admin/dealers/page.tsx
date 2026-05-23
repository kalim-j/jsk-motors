"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Dealer } from "@/types/dealer";
import {
  Users,
  Plus,
  Star,
  MessageSquare,
  BrainCircuit,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

type TabId = "all" | "add" | "reviews" | "inquiries" | "ai";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "all", label: "All Dealers", icon: Users },
  { id: "add", label: "Add New", icon: Plus },
  { id: "reviews", label: "Pending Reviews", icon: Star },
  { id: "inquiries", label: "Inquiries", icon: MessageSquare },
  { id: "ai", label: "AI Scores", icon: BrainCircuit },
];

export default function AdminDealersPage() {
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    inquiries: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: dData } = await supabase
        .from("dealers")
        .select("*")
        .order("created_at", { ascending: false });

      if (dData) {
        setDealers(dData as Dealer[]);
        setStats((prev) => ({
          ...prev,
          total: dData.length,
          verified: dData.filter((d) => d.is_verified).length,
        }));
      }

      const { count: pendingCount } = await supabase
        .from("dealer_reviews")
        .select("*", { count: "exact", head: true });
      const { count: inquiryCount } = await supabase
        .from("dealer_inquiries")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      setStats((prev) => ({
        ...prev,
        pending: pendingCount || 0,
        inquiries: inquiryCount || 0,
      }));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load dealer data");
    } finally {
      setLoading(false);
    }
  };

  const toggleDealerStatus = async (
    id: string,
    currentStatus: boolean,
    field: "is_active" | "is_verified"
  ) => {
    const { error } = await supabase
      .from("dealers")
      .update({ [field]: !currentStatus })
      .eq("id", id);
    if (!error) {
      setDealers(
        dealers.map((d) =>
          d.id === id ? { ...d, [field]: !currentStatus } : d
        )
      );
      toast.success(`Dealer ${field === "is_active" ? "status" : "verification"} updated`);
    } else {
      toast.error("Failed to update dealer");
    }
  };

  const handleDeleteAllFakeDealers = async () => {
    if (
      !confirm(
        "Are you sure you want to delete ALL dealers? This cannot be undone."
      )
    )
      return;
    setLoading(true);
    const { error } = await supabase
      .from("dealers")
      .delete()
      .not("id", "is", null);
    if (!error) {
      toast.success("All dealers deleted");
      setDealers([]);
      setStats((prev) => ({ ...prev, total: 0, verified: 0 }));
    } else {
      toast.error("Failed to delete dealers");
    }
    setLoading(false);
  };

  const statCards = [
    {
      label: "Total Dealers",
      value: stats.total,
      color: "text-[#D4AF37]",
      bg: "bg-[#D4AF37]/10",
      border: "border-[#D4AF37]/20",
      icon: "🤝",
    },
    {
      label: "Verified",
      value: stats.verified,
      color: "text-green-400",
      bg: "bg-green-500/10",
      border: "border-green-500/20",
      icon: "✅",
    },
    {
      label: "Pending Reviews",
      value: stats.pending,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/20",
      icon: "⏳",
    },
    {
      label: "Inquiries",
      value: stats.inquiries,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      icon: "💬",
    },
  ];

  return (
    <div className="min-h-screen bg-black pt-20">
      <div className="container-custom py-10">

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4"
        >
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-medium mb-2">
                Admin Panel
              </div>
              <h1 className="font-display text-3xl font-bold text-white flex items-center gap-2">
                <Users className="text-[#D4AF37]" size={28} />
                Dealer <span className="text-[#D4AF37]">Network</span>
              </h1>
              <p className="text-charcoal-400 text-sm mt-1">
                Manage your dealer network and AI features
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              className="p-2.5 bg-white/5 text-gray-400 hover:text-white rounded-xl transition-colors border border-white/10"
              title="Refresh"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
            <Link
              href="/admin/dealers/import"
              className="flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all text-sm border border-white/10"
            >
              <Upload size={16} />
              Import SQL
            </Link>
            <button
              onClick={() => setActiveTab("add")}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#D4AF37] text-black font-bold rounded-xl hover:bg-yellow-500 transition-all text-sm"
            >
              <Plus size={16} />
              Add Dealer
            </button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -3 }}
              className={`glass-dark rounded-2xl p-5 border ${card.border} flex items-center gap-4`}
            >
              <div
                className={`w-11 h-11 rounded-xl ${card.bg} flex items-center justify-center text-xl flex-shrink-0`}
              >
                {card.icon}
              </div>
              <div>
                <div className={`text-2xl font-bold ${card.color}`}>
                  {card.value}
                </div>
                <div className="text-charcoal-400 text-xs">{card.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Horizontal Tab Bar */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border ${
                activeTab === id
                  ? "bg-[#D4AF37] text-black border-[#D4AF37]"
                  : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={36} className="animate-spin text-[#D4AF37]" />
          </div>
        ) : (
          <>
            {/* ── All Dealers ── */}
            {activeTab === "all" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden"
              >
                {/* Table Header */}
                <div className="p-5 border-b border-white/5 flex items-center justify-between bg-black/40">
                  <h2 className="text-white font-bold text-base">
                    Database Records
                    <span className="ml-2 text-xs text-gray-500 font-normal">
                      ({dealers.length} dealers)
                    </span>
                  </h2>
                  <button
                    onClick={handleDeleteAllFakeDealers}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-bold transition-colors"
                  >
                    <Trash2 size={14} />
                    Delete All Fake Dealers
                  </button>
                </div>

                {dealers.length === 0 ? (
                  <div className="py-20 text-center text-gray-500">
                    No dealers found. Add your first dealer above.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="bg-black/50 border-b border-white/5">
                          <th className="px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Dealer Name
                          </th>
                          <th className="px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Location
                          </th>
                          <th className="px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            AI Score
                          </th>
                          <th className="px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {dealers.map((dealer) => (
                          <tr
                            key={dealer.id}
                            className="hover:bg-white/[0.02] transition-colors"
                          >
                            <td className="px-5 py-4">
                              <div className="font-semibold text-white">
                                {dealer.name}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {(dealer.dealer_type || []).join(", ") ||
                                  dealer.type ||
                                  "Unknown"}
                              </div>
                            </td>
                            <td className="px-5 py-4 text-gray-300 text-sm">
                              {dealer.city}, {dealer.state}
                            </td>
                            <td className="px-5 py-4">
                              <span className="bg-[#D4AF37]/20 text-[#D4AF37] px-2.5 py-1 rounded-lg text-xs font-bold">
                                {dealer.ai_score}/100
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  onClick={() =>
                                    toggleDealerStatus(
                                      dealer.id,
                                      dealer.is_active || false,
                                      "is_active"
                                    )
                                  }
                                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                    dealer.is_active
                                      ? "bg-green-500/15 text-green-400 border border-green-500/30 hover:bg-green-500/25"
                                      : "bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25"
                                  }`}
                                >
                                  {dealer.is_active ? (
                                    <CheckCircle size={11} />
                                  ) : (
                                    <XCircle size={11} />
                                  )}
                                  {dealer.is_active ? "ACTIVE" : "INACTIVE"}
                                </button>
                                <button
                                  onClick={() =>
                                    toggleDealerStatus(
                                      dealer.id,
                                      dealer.is_verified || false,
                                      "is_verified"
                                    )
                                  }
                                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                    dealer.is_verified
                                      ? "bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25"
                                      : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
                                  }`}
                                >
                                  {dealer.is_verified ? "VERIFIED" : "UNVERIFIED"}
                                </button>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-3">
                                <button className="text-[#D4AF37] hover:text-yellow-300 text-xs font-semibold transition-colors">
                                  Edit
                                </button>
                                <button className="text-red-400 hover:text-red-300 text-xs font-semibold transition-colors">
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Add New Dealer ── */}
            {activeTab === "add" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-2xl glass-dark rounded-2xl p-8 border border-white/5"
              >
                <h2 className="text-xl font-bold text-white mb-2">
                  Add New Dealer
                </h2>
                <p className="text-charcoal-400 text-sm mb-6">
                  The auto-geocoding feature is currently integrated via API.
                  Form submission will be implemented shortly.
                </p>
                <button className="btn-gold px-6 py-2.5 rounded-xl font-bold">
                  Save Dealer
                </button>
              </motion.div>
            )}

            {/* ── AI Scores ── */}
            {activeTab === "ai" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-3xl"
              >
                <div className="glass-dark border border-[#D4AF37]/20 rounded-2xl p-10 text-center">
                  <BrainCircuit
                    size={52}
                    className="mx-auto text-[#D4AF37] mb-5"
                  />
                  <h3 className="text-2xl font-bold text-white mb-2">
                    AI Score Recalculation
                  </h3>
                  <p className="text-charcoal-300 mb-8 max-w-md mx-auto text-sm leading-relaxed">
                    Run Claude 3.5 Sonnet across all dealers to analyze reviews,
                    ratings, and experience to generate an updated 0–100 trust
                    score.
                  </p>
                  <button className="btn-gold px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 mx-auto">
                    <BrainCircuit size={18} />
                    Recalculate All AI Scores
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Reviews / Inquiries ── */}
            {(activeTab === "reviews" || activeTab === "inquiries") && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-24 text-center"
              >
                <div className="text-5xl mb-4">
                  {activeTab === "reviews" ? "⭐" : "💬"}
                </div>
                <p className="text-charcoal-400 text-lg font-medium">
                  {activeTab === "reviews"
                    ? "Pending Reviews"
                    : "Inquiries"}{" "}
                  module is under development.
                </p>
                <p className="text-charcoal-600 text-sm mt-2">
                  UI components will be finalized in the next phase.
                </p>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
