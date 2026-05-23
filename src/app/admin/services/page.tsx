"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
} from "firebase/firestore";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Clock,
  ArrowLeft,
  Loader2,
  Wrench,
  Calendar,
  Phone,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface ServiceRequest {
  id: string;
  name: string;
  phone: string;
  email?: string;
  service: string;
  preferredDate?: string;
  message?: string;
  status: string;
  createdAt: any;
}

export default function AdminServicesPage() {
  const { isAdmin } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;

    const q = query(collection(db, "service_requests"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setRequests(
        snap.docs.map((d) => ({ id: d.id, ...d.data() } as ServiceRequest))
      );
    });

    return () => unsub();
  }, [isAdmin]);

  const handleUpdateStatus = async (id: string, status: string) => {
    setActionLoading(id);
    try {
      await updateDoc(doc(db, "service_requests", id), { status });
      toast.success(`Request marked as ${status}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    } finally {
      setActionLoading(null);
    }
  };

  if (!isAdmin) return <div className="min-h-screen bg-[#050505]" />;

  const pendingCount = requests.filter(r => r.status === "pending").length;

  return (
    <div className="min-h-screen bg-[#050505] pt-24 pb-16 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                <Wrench className="text-[#D4AF37]" size={28} />
                Service <span className="text-[#D4AF37]">Requests</span>
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Manage appointment requests and inquiries
              </p>
            </div>
          </div>
          {pendingCount > 0 && (
            <span className="px-4 py-2 bg-[#D4AF37] text-black font-bold rounded-xl text-sm">
              {pendingCount} Pending
            </span>
          )}
        </div>

        <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
          {requests.length === 0 ? (
            <div className="p-12 text-center">
              <Clock size={40} className="text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500">No service requests yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-black/60 border-b border-white/5">
                    <th className="px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Customer</th>
                    <th className="px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Service</th>
                    <th className="px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Message</th>
                    <th className="px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {requests.map((req) => (
                    <motion.tr
                      key={req.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-5 py-4 text-gray-400 whitespace-nowrap">
                        {req.createdAt?.toDate().toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-white">{req.name}</div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Phone size={10} /> {req.phone}
                        </div>
                        {req.email && (
                          <div className="text-xs text-gray-500 mt-1 truncate max-w-[150px]">
                            {req.email}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2 py-1 rounded bg-white/5 text-gold-400 text-xs font-medium">
                          {req.service}
                        </span>
                        {req.preferredDate && (
                          <div className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                            <Calendar size={10} /> {req.preferredDate}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-gray-300 max-w-xs">
                        <div className="line-clamp-2 text-xs leading-relaxed">
                          {req.message || "No message provided."}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            req.status === "completed"
                              ? "bg-green-500/10 text-green-400 border border-green-500/20"
                              : req.status === "contacted"
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                          }`}
                        >
                          {req.status || "pending"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {actionLoading === req.id ? (
                          <Loader2 size={16} className="animate-spin text-gray-500 ml-auto" />
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={`https://wa.me/91${req.phone.replace(/\D/g, '')}?text=Hello ${req.name}, regarding your service request for ${req.service} at JSK CAR BODY SHOP...`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 transition-all"
                              title="WhatsApp"
                            >
                              <MessageCircle size={14} />
                            </a>
                            {req.status !== "contacted" && req.status !== "completed" && (
                              <button
                                onClick={() => handleUpdateStatus(req.id, "contacted")}
                                className="px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-xs font-semibold transition-all"
                              >
                                Mark Contacted
                              </button>
                            )}
                            {req.status !== "completed" && (
                              <button
                                onClick={() => handleUpdateStatus(req.id, "completed")}
                                className="px-3 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 text-xs font-semibold transition-all flex items-center gap-1"
                              >
                                <CheckCircle size={12} /> Done
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
