"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Car,
  Users,
  ClipboardList,
  CheckCircle,
  Clock,
  TrendingUp,
  Plus,
  Eye,
  Database,
  Wrench,
  ShoppingBag,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { sampleCars, sampleDealers } from "@/lib/sampleData";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";

const adminNavLinks = [
  { href: "/admin", label: "Dashboard", icon: TrendingUp },
  { href: "/admin/products", label: "Marketplace", icon: ShoppingBag },
  { href: "/admin/cars", label: "Manage Cars", icon: Car },
  { href: "/admin/submissions", label: "Submissions", icon: ClipboardList },
  { href: "/admin/dealers", label: "Dealer Network", icon: Users },
  { href: "/admin/repairs", label: "Repair Showcase", icon: Wrench },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalCars: 0,
    availableCars: 0,
    soldCars: 0,
    pendingSubmissions: 0,
    totalDealers: 0,
    activeDealers: 0,
  });

  useEffect(() => {
    // Load stats from sample data for cars and dealers
    setStats(prev => ({
      ...prev,
      totalCars: sampleCars.length,
      availableCars: sampleCars.filter((c) => (c.status as string) === "available").length,
      soldCars: sampleCars.filter((c) => (c.status as string) === "sold").length,
      totalDealers: sampleDealers.length,
      activeDealers: sampleDealers.filter((d) => d.status === "active").length,
    }));

    // Fetch real pending submissions from Firestore
    const q = query(collection(db, "car_submissions"), where("status", "in", ["pending", "under_review"]));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStats(prev => ({
        ...prev,
        pendingSubmissions: snapshot.docs.length
      }));
    });

    return () => unsubscribe();
  }, []);

  const statCards = [
    {
      label: "Total Cars",
      value: stats.totalCars,
      icon: Car,
      color: "text-gold-400",
      bg: "bg-gold-500/10",
      href: "/admin/cars",
    },
    {
      label: "Available",
      value: stats.availableCars,
      icon: CheckCircle,
      color: "text-green-400",
      bg: "bg-green-500/10",
      href: "/admin/cars",
    },
    {
      label: "Pending Reviews",
      value: stats.pendingSubmissions,
      icon: Clock,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
      href: "/admin/submissions",
    },
    {
      label: "Active Dealers",
      value: stats.activeDealers,
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      href: "/admin/dealers",
    },
  ];

  return (
    <div className="min-h-screen bg-black pt-20">
      <div className="container-custom py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs font-medium mb-3">
              Admin Panel
            </div>
            <h1 className="font-display text-3xl font-bold text-white">
              Welcome, {user?.displayName || user?.email?.split("@")[0]}
            </h1>
            <p className="text-charcoal-400 text-sm mt-1">
              Manage JSK Motors inventory, submissions, and dealer network
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

        {/* Admin Nav */}
        <div className="flex flex-wrap gap-3 mb-10">
          {adminNavLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="glass border border-white/10 hover:border-gold-500/30 hover:text-gold-400 text-charcoal-300 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all duration-300"
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {statCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <Link
                href={card.href}
                className="glass-dark rounded-2xl p-6 border border-white/5 hover:border-gold-500/20 transition-all duration-300 flex items-center gap-4 group block"
              >
                <div
                  className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}
                >
                  <card.icon size={22} className={card.color} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{card.value}</div>
                  <div className="text-charcoal-400 text-xs mt-0.5">{card.label}</div>
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
            <div className="space-y-3">
              {[
                { label: "Add New Car", href: "/admin/cars/add", icon: Plus, color: "text-gold-400" },
                { label: "View Submissions", href: "/admin/submissions", icon: ClipboardList, color: "text-yellow-400" },
                { label: "Manage Dealers", href: "/admin/dealers", icon: Database, color: "text-blue-400" },
                { label: "View Live Site", href: "/", icon: Eye, color: "text-green-400" },
              ].map(({ label, href, icon: Icon, color }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                    <Icon size={15} className={color} />
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
              <Link href="/admin/cars" className="text-gold-400 text-xs hover:text-gold-300 transition-colors">
                View all →
              </Link>
            </div>
            <div className="space-y-3">
              {sampleCars.slice(0, 4).map((car, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-3 border-b border-white/5 last:border-0"
                >
                  <div>
                    <div className="text-white text-sm font-medium">{car.title}</div>
                    <div className="text-charcoal-500 text-xs">{car.city}, {car.state}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gold-400 text-sm font-semibold">
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
        {stats.pendingSubmissions > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 glass-gold rounded-2xl p-5 border border-gold-500/30 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Clock size={20} className="text-gold-400" />
              <div>
                <p className="text-white font-semibold text-sm">
                  {stats.pendingSubmissions} car submissions pending review
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
      </div>
    </div>
  );
}
