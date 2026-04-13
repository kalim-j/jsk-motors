"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  MessageSquare,
  Phone,
  MapPin,
  Car,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";
import type { CarSubmission } from "@/lib/firestore";
import { db } from "@/lib/firebase";
import { collection, updateDoc, doc, onSnapshot, addDoc } from "firebase/firestore";



export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<CarSubmission[]>([]);
  const [selected, setSelected] = useState<CarSubmission | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [offeredPrice, setOfferedPrice] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "car_submissions"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as CarSubmission[];
      setSubmissions(data);
    });

    return () => unsubscribe();
  }, []);

  const filtered = submissions.filter((s) => {
    if (filter === "all") return true;
    return s.status === filter;
  });

  const handleStatusUpdate = async (id: string, status: CarSubmission["status"], note?: string, price?: number) => {
    try {
      console.log("APPROVE ACTION TRIGGERED:", { id, status });

      const sub = submissions.find(s => s.id === id);
      if (!sub) {
        console.error("COULD NOT FIND SUBMISSION IN STATE:", id);
        return;
      }

      console.log("SUBMISSION DATA FOUND:", sub);

      let finalStatus = status;
      const subDamage = (sub.damageLevel || "Minor").toLowerCase();
      
      if (status === "approved" && subDamage === "severe") {
        finalStatus = "under_review";
        console.log("SEVERE DAMAGE DETECTED - FORCING UNDER_REVIEW");
        toast.loading("Severe damage detected: Moving to under_review", { duration: 3000 });
      }

      const updateData: Record<string, any> = {
        status: finalStatus,
        updatedAt: new Date()
      };
      if (note) updateData.adminNotes = note;
      if (price) updateData.offeredPrice = price;

      console.log("UPDATING SUBMISSION STATUS IN FIRESTORE...");
      await updateDoc(doc(db, "car_submissions", id), updateData);
      console.log("SUBMISSION STATUS UPDATED ✅");

      const isManageable = subDamage !== "severe" && subDamage !== "total loss";
      
      if (finalStatus === "approved" && isManageable) {
        console.log("PREPARING TO ADD TO CARS COLLECTION...");
        
        await addDoc(collection(db, "cars"), {
          title: `${sub.carYear || ""} ${sub.carBrand || ""} ${sub.carModel || ""}`.trim() || "Managed Listing",
          brand: sub.carBrand || "Unknown",
          model: sub.carModel || "Unknown",
          year: sub.carYear || new Date().getFullYear(),
          price: price || sub.expectedPrice || 0,
          originalPrice: sub.expectedPrice || 0,
          images: sub.images || [],
          city: sub.city || "Unknown",
          state: sub.state || "",
          fuelType: "Petrol",
          transmission: "Manual",
          mileage: 0, 
          condition: sub.damageLevel === "Minor" ? "Good" : "Fair",
          status: "available",
          featured: false,
          description: sub.damageDescription || "No description provided.",
          source: "user_submission",
          submissionId: id,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        console.log("SUCCESSFULLY ADDED TO CARS COLLECTION! 🚀");
        toast.success("Car approved and moved to active Inventory! ✅");
      } else if (finalStatus === "approved") {
        console.log("CAR APPROVED BUT TOO DAMAGED FOR DIRECT LISTING (SEVERE/TOTAL LOSS)");
        toast.success("Car approved, but too damaged for direct inventory.");
      } else {
        toast.success(`Submission status updated to ${finalStatus}`);
      }

      setSelected(null);
    } catch (error) {
      console.error("🔴 CRITICAL ERROR IN APPROVAL FLOW:", error);
      toast.error("Failed to update status. Check console for details.");
    }
  };

  const statusColors: Record<string, string> = {
    pending: "badge-reserved",
    approved: "badge-available",
    rejected: "badge-sold",
    under_review: "bg-blue-500/15 border border-blue-500/40 text-blue-300",
  };

  const statusCount = (s: string) => submissions.filter((sub) => sub.status === s).length;

  return (
    <div className="min-h-screen bg-black pt-20">
      <div className="container-custom py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-white">
            Car Submissions
          </h1>
          <p className="text-charcoal-400 text-sm mt-1">
            Review and manage user-submitted cars for purchase
          </p>
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap gap-3 mb-8">
          {[
            { key: "all", label: `All (${submissions.length})` },
            { key: "pending", label: `Pending (${statusCount("pending")})`, color: "text-yellow-400" },
            { key: "under_review", label: `Under Review (${statusCount("under_review")})`, color: "text-blue-400" },
            { key: "approved", label: `Approved (${statusCount("approved")})`, color: "text-green-400" },
            { key: "rejected", label: `Rejected (${statusCount("rejected")})`, color: "text-red-400" },
          ].map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter === key
                  ? "btn-gold"
                  : `glass border border-white/10 hover:border-gold-500/30 ${color || "text-charcoal-300"}`
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Submissions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filtered.map((sub, i) => (
            <motion.div
              key={sub.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass-dark rounded-2xl p-6 border border-white/5 hover:border-gold-500/15 transition-all"
            >
              {/* Top */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-white font-bold text-base">
                    {sub.carYear} {sub.carBrand} {sub.carModel}
                  </div>
                  <div className="text-charcoal-400 text-sm mt-0.5">{sub.userName} · {sub.userEmail}</div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full capitalize ${statusColors[sub.status] || "glass"}`}>
                  {sub.status.replace("_", " ")}
                </span>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                <div className="flex items-center gap-1.5 text-charcoal-300">
                  <MapPin size={11} className="text-gold-500" />
                  {sub.city}, {sub.state}
                </div>
                <div className="flex items-center gap-1.5 text-charcoal-300">
                  <Phone size={11} className="text-gold-500" />
                  {sub.phone}
                </div>
                <div className="flex items-center gap-1.5 text-charcoal-300">
                  <Car size={11} className="text-gold-500" />
                  Damage: {sub.damageLevel}
                </div>
                <div className="text-gold-400 font-semibold">
                  Asking: {formatPrice(sub.expectedPrice)}
                </div>
              </div>

              <p className="text-charcoal-400 text-xs leading-relaxed mb-4 line-clamp-2">
                {sub.damageDescription}
              </p>

              {sub.adminNotes && (
                <div className="flex items-start gap-2 mb-4 bg-blue-500/10 rounded-xl px-3 py-2 border border-blue-500/20">
                  <MessageSquare size={12} className="text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-blue-300 text-xs">{sub.adminNotes}</p>
                </div>
              )}

              {sub.offeredPrice && (
                <div className="mb-4 text-sm">
                  <span className="text-charcoal-400">Our Offer: </span>
                  <span className="text-green-400 font-bold">{formatPrice(sub.offeredPrice)}</span>
                </div>
              )}

              {/* Action Buttons */}
              {sub.status === "pending" || sub.status === "under_review" ? (
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => { setSelected(sub); setAdminNote(sub.adminNotes || ""); setOfferedPrice(String(sub.offeredPrice || "")); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 glass text-charcoal-300 hover:text-white rounded-xl text-sm border border-white/10 hover:border-gold-500/30 transition-all"
                  >
                    <Eye size={14} /> Review
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(sub.id!, "approved")}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-500/15 text-green-400 hover:bg-green-500/25 rounded-xl text-sm border border-green-500/30 transition-all"
                  >
                    <CheckCircle size={14} /> Approve
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(sub.id!, "rejected")}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl text-sm border border-red-500/30 transition-all"
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
                      ? "Approved — Ready to list as inventory"
                      : sub.status === "rejected"
                      ? "Rejected — User has been notified"
                      : "Under review"}
                  </span>
                </div>
              )}
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-2 py-16 text-center">
              <CheckCircle size={48} className="text-charcoal-700 mx-auto mb-3" />
              <p className="text-charcoal-400">No submissions in this category</p>
            </div>
          )}
        </div>

        {/* Review Modal */}
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="glass-dark rounded-3xl p-8 w-full max-w-md border border-gold-500/20"
            >
              <h2 className="font-display text-xl font-bold text-white mb-6">
                Review: {selected.carYear} {selected.carBrand} {selected.carModel}
              </h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-charcoal-300 text-xs font-medium block mb-2">
                    Admin Notes
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
                  onClick={() => handleStatusUpdate(selected.id!, "approved", adminNote, offeredPrice ? Number(offeredPrice) : undefined)}
                  className="flex-1 py-3 bg-green-500/15 text-green-400 border border-green-500/30 rounded-xl text-sm font-semibold hover:bg-green-500/25 transition-all"
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => handleStatusUpdate(selected.id!, "under_review", adminNote)}
                  className="flex-1 py-3 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-xl text-sm font-semibold hover:bg-blue-500/20 transition-all"
                >
                  👁 Under Review
                </button>
                <button
                  onClick={() => handleStatusUpdate(selected.id!, "rejected", adminNote)}
                  className="flex-1 py-3 bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl text-sm font-semibold hover:bg-red-500/20 transition-all"
                >
                  ✗ Reject
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
      </div>
    </div>
  );
}
