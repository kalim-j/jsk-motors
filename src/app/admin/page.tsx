"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { CheckCircle, Clock, Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { sampleCars } from "@/lib/sampleData";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  setDoc,
  getDoc,
  getDocs,
} from "firebase/firestore";
import toast from "react-hot-toast";

const tabs = [
  { label: "Dashboard", icon: "📊", href: "/admin" },
  { label: "Manage Cars", icon: "🚗", href: "/admin/cars" },
  { label: "Submissions", icon: "📋", href: "/admin/submissions" },
  { label: "Marketplace", icon: "🛒", href: "/admin/products" },
  { label: "Services", icon: "🔧", href: "/admin/services" },
  { label: "Dealer Network", icon: "🤝", href: "/admin/dealers" },
  { label: "Repair Showcase", icon: "🔨", href: "/admin/repairs" },
  { label: "Orders", icon: "📦", href: "/admin/orders" },
  { label: "Analytics", icon: "📈", href: "/admin/analytics" },
];

const quickActions = [
  { label: "Add New Car", icon: "🚗", href: "/admin/cars/add" },
  { label: "View Submissions", icon: "📋", href: "/admin/submissions" },
  { label: "Manage Marketplace", icon: "🛒", href: "/admin/products" },
  { label: "Add Product", icon: "➕", href: "/admin/products/add" },
  { label: "Manage Dealers", icon: "🤝", href: "/admin/dealers" },
  { label: "View Orders", icon: "📦", href: "/admin/orders" },
  { label: "View Live Site", icon: "🌐", href: "/" },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [counts, setCounts] = useState({
    totalCars: 0,
    availableCars: 0,
    pendingSubmissions: 0,
    activeDealers: 0,
    marketplaceItems: 0,
    pendingSubs: 0,
  });

  useEffect(() => {
    // Cars count from Firestore
    const unsubCars = onSnapshot(collection(db, "cars"), (snap) => {
      setCounts((prev) => ({
        ...prev,
        totalCars: snap.docs.length,
        availableCars: snap.docs.filter(
          (d) => d.data().status === "available"
        ).length,
      }));
    });

    // Pending car_submissions
    const qPendingCars = query(
      collection(db, "car_submissions"),
      where("status", "in", ["pending", "under_review"])
    );
    const unsubPendingCars = onSnapshot(qPendingCars, (snap) => {
      setCounts((prev) => ({ ...prev, pendingSubmissions: snap.docs.length }));
    });

    // Active dealers
    const qDealers = query(
      collection(db, "dealers"),
      where("status", "==", "active")
    );
    const unsubDealers = onSnapshot(qDealers, (snap) => {
      setCounts((prev) => ({ ...prev, activeDealers: snap.docs.length }));
    });

    // Marketplace products
    const unsubProducts = onSnapshot(collection(db, "products"), (snap) => {
      setCounts((prev) => ({ ...prev, marketplaceItems: snap.docs.length }));
    });

    // Pending product_submissions
    const qPendingProds = query(
      collection(db, "product_submissions"),
      where("status", "==", "pending")
    );
    const unsubPendingProds = onSnapshot(qPendingProds, (snap) => {
      setCounts((prev) => ({ ...prev, pendingSubs: snap.docs.length }));
    });

    // Fallback: also count from sampleCars if Firestore cars is empty
    getDocs(collection(db, "cars")).then((snap) => {
      if (snap.docs.length === 0) {
        setCounts((prev) => ({
          ...prev,
          totalCars: sampleCars.length,
          availableCars: sampleCars.filter(
            (c) => (c.status as string) === "available"
          ).length,
        }));
      }
    });

    return () => {
      unsubCars();
      unsubPendingCars();
      unsubDealers();
      unsubProducts();
      unsubPendingProds();
    };
  }, []);

  const statCards = [
    {
      label: "Total Cars",
      value: counts.totalCars,
      icon: "🚗",
      color: "text-[#D4AF37]",
      bg: "bg-[#D4AF37]/10",
      border: "border-[#D4AF37]/20",
      href: "/admin/cars",
    },
    {
      label: "Available",
      value: counts.availableCars,
      icon: "✅",
      color: "text-green-400",
      bg: "bg-green-500/10",
      border: "border-green-500/20",
      href: "/admin/cars",
    },
    {
      label: "Pending Reviews",
      value: counts.pendingSubmissions,
      icon: "⏳",
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/20",
      href: "/admin/submissions",
    },
    {
      label: "Active Dealers",
      value: counts.activeDealers,
      icon: "🤝",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      href: "/admin/dealers",
    },
    {
      label: "Marketplace Items",
      value: counts.marketplaceItems,
      icon: "🛒",
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      href: "/admin/products",
    },
    {
      label: "Pending Submissions",
      value: counts.pendingSubs,
      icon: "📋",
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/20",
      href: "/admin/submissions",
    },
  ];

  return (
    <div className="min-h-screen bg-black pt-20">
      <div className="container-custom py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-medium mb-3">
              Admin Panel
            </div>
            <h1 className="font-display text-3xl font-bold text-white">
              Welcome, {user?.displayName || user?.email?.split("@")[0]}
            </h1>
            <p className="text-charcoal-400 text-sm mt-1">
              Manage JSK CAR BODY SHOP inventory, submissions, and dealer network
            </p>
          </div>
          <Link
            href="/admin/cars/add"
            className="btn-gold px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2"
          >
            <Plus size={16} />
            Add New Car
          </Link>
        </motion.div>

        {/* Tabs Row — horizontal scrollable */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 hover:border-[#D4AF37] hover:text-[#D4AF37] text-gray-300 text-sm whitespace-nowrap transition-all"
            >
              {tab.icon} {tab.label}
            </Link>
          ))}
        </div>

        {/* Stats Grid — 6 cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-10">
          {statCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4 }}
            >
              <Link
                href={card.href}
                className={`glass-dark rounded-2xl p-5 border ${card.border} hover:border-[#D4AF37]/40 transition-all duration-300 flex flex-col gap-3 group block`}
              >
                <div
                  className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center text-xl group-hover:scale-110 transition-transform`}
                >
                  {card.icon}
                </div>
                <div>
                  <div className={`text-2xl font-bold ${card.color}`}>
                    {card.value}
                  </div>
                  <div className="text-charcoal-400 text-xs mt-0.5">
                    {card.label}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions + Recent */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="glass-dark rounded-2xl p-6 border border-white/5">
            <h2 className="text-white font-bold text-lg mb-5">Quick Actions</h2>
            <div className="space-y-2">
              {quickActions.map(({ label, icon, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group border border-transparent hover:border-[#D4AF37]/20"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center text-lg group-hover:bg-[#D4AF37]/20 transition-colors">
                    {icon}
                  </div>
                  <span className="text-charcoal-300 text-sm group-hover:text-white transition-colors">
                    {label}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Cars */}
          <div className="lg:col-span-2 glass-dark rounded-2xl p-6 border border-white/5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-lg">Recent Cars</h2>
              <Link
                href="/admin/cars"
                className="text-[#D4AF37] text-xs hover:text-yellow-300 transition-colors"
              >
                View all →
              </Link>
            </div>
            <div className="space-y-3">
              {sampleCars.slice(0, 5).map((car, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-3 border-b border-white/5 last:border-0"
                >
                  <div>
                    <div className="text-white text-sm font-medium">
                      {car.title}
                    </div>
                    <div className="text-charcoal-500 text-xs">
                      {car.city}, {car.state}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#D4AF37] text-sm font-semibold">
                      ₹{(car.price / 100000).toFixed(1)}L
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        car.status === "available"
                          ? "badge-available"
                          : car.status === "sold"
                          ? "badge-sold"
                          : "badge-reserved"
                      }`}
                    >
                      {car.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pending Submissions Alert */}
        {counts.pendingSubmissions > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 glass-gold rounded-2xl p-5 border border-[#D4AF37]/30 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Clock size={20} className="text-[#D4AF37]" />
              <div>
                <p className="text-white font-semibold text-sm">
                  {counts.pendingSubmissions} car submission
                  {counts.pendingSubmissions !== 1 ? "s" : ""} pending review
                </p>
                <p className="text-charcoal-400 text-xs">
                  Users are waiting for your response
                </p>
              </div>
            </div>
            <Link
              href="/admin/submissions"
              className="btn-gold px-4 py-2 rounded-full text-xs font-bold"
            >
              Review Now
            </Link>
          </motion.div>
        )}

        {/* Site Settings */}
        <SiteSettingsSection />
      </div>
    </div>
  );
}

function SiteSettingsSection() {
  const [stats, setStats] = useState({
    carsRestored: "500+",
    yearsExperience: "14+",
    customerRating: "4.9",
    satisfaction: "100%",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const docRef = doc(db, "site_settings", "stats");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setStats({
            carsRestored: data.carsRestored || "500+",
            yearsExperience: data.yearsExperience || "14+",
            customerRating: data.customerRating || "4.9",
            satisfaction: data.satisfaction || "100%",
          });
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };
    fetchStats();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await setDoc(doc(db, "site_settings", "stats"), stats);
      toast.success("Stats updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update stats.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-10 glass-dark rounded-2xl p-6 border border-white/5">
      <h2 className="text-white font-bold text-lg mb-5">Site Settings</h2>
      <form
        onSubmit={handleSave}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          { key: "carsRestored", label: "Cars Restored" },
          { key: "yearsExperience", label: "Years Experience" },
          { key: "customerRating", label: "Customer Rating" },
          { key: "satisfaction", label: "Satisfaction" },
        ].map(({ key, label }) => (
          <div key={key}>
            <label className="block text-charcoal-400 text-xs mb-1">
              {label}
            </label>
            <input
              type="text"
              required
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#D4AF37]"
              value={stats[key as keyof typeof stats]}
              onChange={(e) => setStats({ ...stats, [key]: e.target.value })}
            />
          </div>
        ))}
        <div className="sm:col-span-2 lg:col-span-4 flex justify-end mt-2">
          <button
            type="submit"
            disabled={loading}
            className="btn-gold px-6 py-2.5 rounded-xl font-bold disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
