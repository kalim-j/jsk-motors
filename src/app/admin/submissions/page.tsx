"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  MessageSquare,
  Phone,
  MapPin,
  Car,
  X,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";
import { db } from "@/lib/firebase";
import {
  collection,
  updateDoc,
  doc,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import Link from "next/link";
import Image from "next/image";

interface CarSubmission {
  id?: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  // from /sell form fields
  title?: string;
  brand?: string;
  carBrand?: string;
  model?: string;
  carModel?: string;
  year?: number;
  carYear?: number;
  price?: number;
  expectedPrice?: number;
  condition?: string;
  mileage?: number;
  fuelType?: string;
  transmission?: string;
  city?: string;
  state?: string;
  phone?: string;
  description?: string;
  damageDescription?: string;
  damageLevel?: string;
  images?: string[];
  status: "pending" | "approved" | "rejected" | "under_review";
  adminNotes?: string;
  offeredPrice?: number;
  createdAt?: any;
  updatedAt?: any;
  [key: string]: any;
}

type FilterKey = "all" | "pending" | "approved" | "rejected" | "under_review";

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<CarSubmission[]>([]);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [selected, setSelected] = useState<CarSubmission | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [offeredPrice, setOfferedPrice] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    // Listen to both collections: submissions (from /sell) and car_submissions (legacy)
    const unsubSubs = onSnapshot(collection(db, "submissions"), (snap) => {
      const fromSubs = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        _collection: "submissions",
      })) as unknown as CarSubmission[];
      setSubmissions((prev) => {
        const legacy = prev.filter((s) => (s as any)._collection !== "submissions");
        return [...fromSubs, ...legacy];
      });
    });

    const unsubCarSubs = onSnapshot(collection(db, "car_submissions"), (snap) => {
      const fromCarSubs = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        _collection: "car_submissions",
      })) as unknown as CarSubmission[];
      setSubmissions((prev) => {
        const fromSell = prev.filter((s) => (s as any)._collection !== "car_submissions");
        return [...fromSell, ...fromCarSubs];
      });
    });

    return () => {
      unsubSubs();
      unsubCarSubs();
    };
  }, []);

  // Helper: get display values from either schema
  const getBrand = (s: CarSubmission) => s.brand || s.carBrand || "Unknown";
  const getModel = (s: CarSubmission) => s.model || s.carModel || "";
  const getYear = (s: CarSubmission) => s.year || s.carYear || "";
  const getPrice = (s: CarSubmission) => s.price || s.expectedPrice || 0;
  const getTitle = (s: CarSubmission) =>
    s.title || `${getYear(s)} ${getBrand(s)} ${getModel(s)}`.trim();
  const getColName = (s: CarSubmission) =>
    (s as any)._collection || "car_submissions";

  const filtered = submissions.filter((s) => {
    if (filter === "all") return true;
    return s.status === filter;
  });

  const statusCount = (st: string) =>
    submissions.filter((s) => s.status === st).length;

  const handleApprove = async (sub: CarSubmission) => {
    if (!sub.id) return;
    setActionLoading(sub.id);
    const toastId = toast.loading("Approving car submission...");
    try {
      const colName = getColName(sub);

      // 1. Copy to cars collection
      await addDoc(collection(db, "cars"), {
        title: getTitle(sub),
        brand: getBrand(sub),
        model: getModel(sub),
        year: Number(getYear(sub)) || new Date().getFullYear(),
        price: Number(getPrice(sub)) || 0,
        condition: sub.condition || sub.damageLevel || "Good",
        mileage: Number(sub.mileage) || 0,
        fuelType: sub.fuelType || sub.fuel || "Petrol",
        transmission: sub.transmission || "Manual",
        city: sub.city || "Unknown",
        state: sub.state || "",
        images: sub.images || [],
        description: sub.description || sub.damageDescription || "",
        status: "available",
        featured: false,
        submittedBy: sub.userId || sub.userEmail || "",
        approvedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        source: "user_submission",
        submissionId: sub.id,
      });

      // 2. Update submission status
      await updateDoc(doc(db, colName, sub.id), {
        status: "approved",
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success("Car approved and listed on Buy Cars page! ✅", { id: toastId });
      setSelected(null);
    } catch (error) {
      console.error("Approval error:", error);
      toast.error("Failed to approve. Check console.", { id: toastId });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (sub: CarSubmission, note?: string) => {
    if (!sub.id) return;
    if (!confirm("Reject this submission?")) return;
    setActionLoading(sub.id);
    try {
      const colName = getColName(sub);
      await updateDoc(doc(db, colName, sub.id), {
        status: "rejected",
        adminNotes: note || "",
        updatedAt: serverTimestamp(),
      });
      toast.success("Submission rejected");
      setSelected(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to reject submission");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReviewSave = async (status: "approved" | "rejected" | "under_review") => {
    if (!selected?.id) return;
    if (status === "approved") {
      await handleApprove(selected);
    } else if (status === "rejected") {
      const colName = getColName(selected);
      setActionLoading(selected.id);
      try {
        await updateDoc(doc(db, colName, selected.id), {
          status: "rejected",
          adminNotes: adminNote,
          updatedAt: serverTimestamp(),
        });
        toast.success("Submission rejected");
        setSelected(null);
      } catch (err) {
        console.error(err);
        toast.error("Failed to update status");
      } finally {
        setActionLoading(null);
      }
    } else {
      const colName = getColName(selected);
      setActionLoading(selected.id);
      try {
        await updateDoc(doc(db, colName, selected.id), {
          status: "under_review",
          adminNotes: adminNote,
          offeredPrice: offeredPrice ? Number(offeredPrice) : null,
          updatedAt: serverTimestamp(),
        });
        toast.success("Moved to Under Review");
        setSelected(null);
      } catch (err) {
        console.error(err);
        toast.error("Failed to update status");
      } finally {
        setActionLoading(null);
      }
    }
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/15 border border-yellow-500/40 text-yellow-300",
    approved: "bg-green-500/15 border border-green-500/40 text-green-300",
    rejected: "bg-red-500/15 border border-red-500/40 text-red-300",
    under_review: "bg-blue-500/15 border border-blue-500/40 text-blue-300",
  };

  const filterTabs: { key: FilterKey; label: string; color: string }[] = [
    { key: "all", label: `All (${submissions.length})`, color: "text-gray-300" },
    { key: "pending", label: `Pending (${statusCount("pending")})`, color: "text-yellow-400" },
    { key: "under_review", label: `Under Review (${statusCount("under_review")})`, color: "text-blue-400" },
    { key: "approved", label: `Approved (${statusCount("approved")})`, color: "text-green-400" },
    { key: "rejected", label: `Rejected (${statusCount("rejected")})`, color: "text-red-400" },
  ];

  return (
    <div className="min-h-screen bg-black pt-20">
      <div className="container-custom py-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/admin"
            className="p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-display text-3xl font-bold text-white flex items-center gap-2">
              <Car className="text-[#D4AF37]" size={28} />
              Car <span className="text-[#D4AF37]">Submissions</span>
            </h1>
            <p className="text-charcoal-400 text-sm mt-1">
              Review and approve user-submitted cars — approved cars appear on
              the Buy page
            </p>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 overflow-x-auto pb-1">
          {filterTabs.map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                filter === key
                  ? "bg-[#D4AF37] text-black font-bold"
                  : `glass border border-white/10 hover:border-[#D4AF37]/30 ${color}`
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="py-24 text-center">
            <CheckCircle size={56} className="text-charcoal-700 mx-auto mb-4" />
            <p className="text-charcoal-400 text-lg">No submissions in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <AnimatePresence>
              {filtered.map((sub, i) => (
                <motion.div
                  key={`${getColName(sub)}_${sub.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.06 }}
                  className="glass-dark rounded-2xl p-6 border border-white/5 hover:border-[#D4AF37]/15 transition-all"
                >
                  {/* Car images strip */}
                  {sub.images && sub.images.length > 0 && (
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                      {sub.images.slice(0, 4).map((img, idx) => (
                        <div
                          key={idx}
                          className="w-20 h-14 rounded-lg overflow-hidden relative flex-shrink-0 border border-white/10"
                        >
                          <Image
                            src={img}
                            alt="Car"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Top */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-white font-bold text-base">
                        {getTitle(sub)}
                      </div>
                      <div className="text-charcoal-400 text-sm mt-0.5">
                        {sub.userName || "Unknown"} ·{" "}
                        {sub.userEmail || "No email"}
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full capitalize ${
                        statusColors[sub.status] || "glass"
                      }`}
                    >
                      {sub.status?.replace("_", " ")}
                    </span>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                    {sub.city && (
                      <div className="flex items-center gap-1.5 text-charcoal-300">
                        <MapPin size={11} className="text-[#D4AF37]" />
                        {sub.city}, {sub.state}
                      </div>
                    )}
                    {sub.phone && (
                      <div className="flex items-center gap-1.5 text-charcoal-300">
                        <Phone size={11} className="text-[#D4AF37]" />
                        {sub.phone}
                      </div>
                    )}
                    {(sub.damageLevel || sub.condition) && (
                      <div className="flex items-center gap-1.5 text-charcoal-300">
                        <Car size={11} className="text-[#D4AF37]" />
                        {sub.damageLevel || sub.condition}
                      </div>
                    )}
                    <div className="text-[#D4AF37] font-semibold">
                      Asking:{" "}
                      {formatPrice(getPrice(sub))}
                    </div>
                  </div>

                  {(sub.description || sub.damageDescription) && (
                    <p className="text-charcoal-400 text-xs leading-relaxed mb-4 line-clamp-2">
                      {sub.description || sub.damageDescription}
                    </p>
                  )}

                  {sub.adminNotes && (
                    <div className="flex items-start gap-2 mb-4 bg-blue-500/10 rounded-xl px-3 py-2 border border-blue-500/20">
                      <MessageSquare
                        size={12}
                        className="text-blue-400 flex-shrink-0 mt-0.5"
                      />
                      <p className="text-blue-300 text-xs">{sub.adminNotes}</p>
                    </div>
                  )}

                  {sub.offeredPrice && (
                    <div className="mb-4 text-sm">
                      <span className="text-charcoal-400">Our Offer: </span>
                      <span className="text-green-400 font-bold">
                        {formatPrice(sub.offeredPrice)}
                      </span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {sub.status === "pending" || sub.status === "under_review" ? (
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          setSelected(sub);
                          setAdminNote(sub.adminNotes || "");
                          setOfferedPrice(
                            sub.offeredPrice ? String(sub.offeredPrice) : ""
                          );
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 glass text-charcoal-300 hover:text-white rounded-xl text-sm border border-white/10 hover:border-[#D4AF37]/30 transition-all"
                      >
                        <Eye size={14} /> View Details
                      </button>
                      <button
                        onClick={() => handleApprove(sub)}
                        disabled={actionLoading === sub.id}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-500/15 text-green-400 hover:bg-green-500/25 rounded-xl text-sm border border-green-500/30 transition-all disabled:opacity-50"
                      >
                        {actionLoading === sub.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <CheckCircle size={14} />
                        )}{" "}
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(sub)}
                        disabled={actionLoading === sub.id}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl text-sm border border-red-500/30 transition-all disabled:opacity-50"
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-charcoal-500 text-xs">
                      {sub.status === "approved" ? (
                        <CheckCircle size={14} className="text-green-400" />
                      ) : sub.status === "rejected" ? (
                        <XCircle size={14} className="text-red-400" />
                      ) : (
                        <Clock size={14} className="text-blue-400" />
                      )}
                      <span>
                        {sub.status === "approved"
                          ? "Approved — Listed on Buy Cars page"
                          : sub.status === "rejected"
                          ? "Rejected — User has been notified"
                          : "Under review"}
                      </span>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Review Modal */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="glass-dark rounded-3xl p-8 w-full max-w-lg border border-[#D4AF37]/20 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-xl font-bold text-white">
                    Review Submission
                  </h2>
                  <button
                    onClick={() => setSelected(null)}
                    className="p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Full details */}
                <div className="bg-black/30 rounded-xl p-4 mb-6 space-y-2 text-sm">
                  <div className="text-[#D4AF37] font-bold text-base mb-3">
                    {getTitle(selected)}
                  </div>
                  {[
                    ["Seller", selected.userName || "N/A"],
                    ["Email", selected.userEmail || "N/A"],
                    ["Phone", selected.phone || "N/A"],
                    ["Location", `${selected.city || ""}, ${selected.state || ""}`],
                    ["Asking Price", formatPrice(getPrice(selected))],
                    ["Condition", selected.condition || selected.damageLevel || "N/A"],
                    ["Mileage", selected.mileage ? `${selected.mileage} km` : "N/A"],
                    ["Fuel Type", selected.fuelType || selected.fuel || "N/A"],
                    ["Transmission", selected.transmission || "N/A"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex gap-2">
                      <span className="text-charcoal-400 w-28 flex-shrink-0">{label}:</span>
                      <span className="text-white">{value}</span>
                    </div>
                  ))}
                  {(selected.description || selected.damageDescription) && (
                    <div className="mt-2 pt-2 border-t border-white/5">
                      <span className="text-charcoal-400 block mb-1">Description:</span>
                      <span className="text-white text-xs leading-relaxed">
                        {selected.description || selected.damageDescription}
                      </span>
                    </div>
                  )}
                  {selected.aiScore && selected.aiScore.summary && (
                    <div className="mt-2 pt-2 border-t border-gold-500/20">
                      <span className="text-gold-400 block mb-1 font-bold">✨ AI Evaluation:</span>
                      <div className="flex gap-4 mb-2">
                        <div className="bg-gold-500/10 px-3 py-1 rounded-lg border border-gold-500/20">
                          <span className="text-charcoal-400 text-xs mr-2">Price Score:</span>
                          <span className="text-gold-400 font-bold">{selected.aiScore.priceScore}/10</span>
                        </div>
                        <div className="bg-gold-500/10 px-3 py-1 rounded-lg border border-gold-500/20">
                          <span className="text-charcoal-400 text-xs mr-2">Condition:</span>
                          <span className="text-gold-400 font-bold">{selected.aiScore.conditionScore}/10</span>
                        </div>
                      </div>
                      <span className="text-white text-xs leading-relaxed italic">
                        "{selected.aiScore.summary}"
                      </span>
                    </div>
                  )}
                </div>

                {/* Car images in modal */}
                {selected.images && selected.images.length > 0 && (
                  <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                    {selected.images.map((img, idx) => (
                      <div
                        key={idx}
                        className="w-24 h-16 rounded-lg overflow-hidden relative flex-shrink-0 border border-white/10"
                      >
                        <Image
                          src={img}
                          alt="Car"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-charcoal-300 text-xs font-medium block mb-2">
                      Admin Notes (visible to team)
                    </label>
                    <textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      rows={3}
                      placeholder="Notes for team or user..."
                      className="input-dark w-full px-4 py-3 rounded-xl text-sm resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-charcoal-300 text-xs font-medium block mb-2">
                      Our Offer Price (₹) — optional
                    </label>
                    <input
                      type="number"
                      value={offeredPrice}
                      onChange={(e) => setOfferedPrice(e.target.value)}
                      placeholder="e.g., 320000"
                      className="input-dark w-full px-4 py-3 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleReviewSave("approved")}
                    disabled={!!actionLoading}
                    className="flex-1 py-3 bg-green-500/15 text-green-400 border border-green-500/30 rounded-xl text-sm font-semibold hover:bg-green-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <CheckCircle size={15} />
                    )}
                    Approve & List
                  </button>
                  <button
                    onClick={() => handleReviewSave("under_review")}
                    disabled={!!actionLoading}
                    className="flex-1 py-3 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-xl text-sm font-semibold hover:bg-blue-500/20 transition-all disabled:opacity-50"
                  >
                    👁 Under Review
                  </button>
                  <button
                    onClick={() => handleReviewSave("rejected")}
                    disabled={!!actionLoading}
                    className="flex-1 py-3 bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl text-sm font-semibold hover:bg-red-500/20 transition-all disabled:opacity-50"
                  >
                    <XCircle size={15} className="inline mr-1" />
                    Reject
                  </button>
                </div>

                <button
                  onClick={() => setSelected(null)}
                  className="mt-3 w-full py-2 glass text-charcoal-400 hover:text-white rounded-xl text-sm border border-white/10 transition-all"
                >
                  Cancel
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
