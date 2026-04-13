"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Car,
  Eye,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { Car as CarType } from "@/lib/firestore";
import toast from "react-hot-toast";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from "firebase/firestore";

export default function AdminCarsPage() {
  const [cars, setCars] = useState<CarType[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const q = query(collection(db, "cars"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveCars = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CarType[];
      setCars(liveCars);
    });
    return () => unsubscribe();
  }, []);

  const filtered = cars.filter((c) => {
    const matchSearch =
      !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.brand.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all" ||
      (filter === "available" && c.status === "available") ||
      (filter === "sold" && c.status === "sold") ||
      (filter === "featured" && c.featured);
    return matchSearch && matchFilter;
  });

  const handleDelete = async (id: string) => {
    if (!id) return;
    if (confirm("Are you sure you want to delete this car?")) {
      try {
        await deleteDoc(doc(db, "cars", id));
        toast.success("Car deleted successfully ✅");
      } catch (error) {
        console.error("Delete error:", error);
        toast.error("Failed to delete car");
      }
    }
  };

  return (
    <div className="min-h-screen bg-black pt-20">
      <div className="container-custom py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">
              Manage Cars
            </h1>
            <p className="text-charcoal-400 text-sm mt-1">
              {cars.length} total cars in inventory
            </p>
          </div>
          <Link
            href="/admin/cars/add"
            className="btn-gold px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2"
          >
            <Plus size={16} />
            Add New Car
          </Link>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cars..."
              className="input-dark w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
            />
          </div>
          <div className="flex gap-2">
            {["all", "available", "sold", "featured"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                  filter === f
                    ? "btn-gold"
                    : "glass text-charcoal-300 border border-white/10 hover:border-gold-500/30"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Cars Table */}
        <div className="glass-dark rounded-2xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-5 text-charcoal-400 text-xs font-semibold uppercase tracking-wider">
                    Car
                  </th>
                  <th className="text-left py-4 px-4 text-charcoal-400 text-xs font-semibold uppercase tracking-wider hidden md:table-cell">
                    Price
                  </th>
                  <th className="text-left py-4 px-4 text-charcoal-400 text-xs font-semibold uppercase tracking-wider hidden lg:table-cell">
                    City
                  </th>
                  <th className="text-left py-4 px-4 text-charcoal-400 text-xs font-semibold uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right py-4 px-5 text-charcoal-400 text-xs font-semibold uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((car, i) => (
                  <motion.tr
                    key={car.id || i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-white/5 hover:bg-white/2 transition-colors"
                  >
                    {/* Car Info */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="relative w-14 h-10 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={car.images?.[0] || "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=100"}
                            alt={car.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <div className="text-white text-sm font-medium line-clamp-1">
                            {car.title}
                          </div>
                          <div className="text-charcoal-500 text-xs">
                            {car.year} • {car.fuelType}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 hidden md:table-cell">
                      <span className="text-gold-400 font-semibold text-sm">
                        {formatPrice(car.price)}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-charcoal-300 text-sm hidden lg:table-cell">
                      {car.city}
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full ${
                          car.status === "available"
                            ? "badge-available"
                            : car.status === "sold"
                            ? "badge-sold"
                            : "badge-reserved"
                        }`}
                      >
                        {car.status}
                      </span>
                    </td>

                    <td className="py-4 px-5">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/cars/${car.id}`}
                          className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors text-charcoal-300 hover:text-white"
                          title="View Detail"
                          target="_blank"
                        >
                          <Eye size={14} />
                        </Link>
                        <Link
                          href={`/admin/edit-car/${car.id}`}
                          className="w-8 h-8 rounded-lg bg-gold-500/10 flex items-center justify-center hover:bg-gold-500/20 transition-colors text-gold-400"
                          title="Edit Car"
                        >
                          <Edit size={14} />
                        </Link>
                        <button
                          onClick={() => handleDelete(car.id || "")}
                          className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors text-red-400"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="py-16 text-center">
                <Car size={40} className="text-charcoal-700 mx-auto mb-3" />
                <p className="text-charcoal-400">No cars found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
