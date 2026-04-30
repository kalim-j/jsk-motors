"use client";

import { Suspense, useState, useEffect, memo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  Fuel,
  Gauge,
  Settings,
  MapPin,
  X,
  ChevronDown,
  SlidersHorizontal,
  ChevronRight,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { CarGridSkeleton } from "@/components/ui/Skeleton";
import { useDebouncedValue } from "@/hooks/useDebounce";
import type { Car } from "@/lib/firestore";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import CustomSelect from "@/components/ui/CustomSelect";

const PAGE_SIZE = 12;

const fuelTypes = ["All", "Petrol", "Diesel", "Electric", "Hybrid", "CNG"];
const transmissions = ["All", "Manual", "Automatic"];
const conditions = ["All", "Excellent", "Good", "Fair", "Restoration"];

export default function BuyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black pt-32 text-center text-charcoal-500">Loading cars...</div>}>
      <BuyPageContent />
    </Suspense>
  );
}

function BuyPageContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [cars, setCars] = useState<Car[]>([]);
  const [filtered, setFiltered] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [rawSearch, setRawSearch] = useState(initialSearch);
  const searchQuery = useDebouncedValue(rawSearch, 280);
  const [fuelFilter, setFuelFilter] = useState("All");
  const [transmissionFilter, setTransmissionFilter] = useState("All");
  const [conditionFilter, setConditionFilter] = useState("All");
  const [priceRange, setPriceRange] = useState([0, 3000000]);
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    const q = query(collection(db, "cars"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveCars = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Car[];
      
      setCars(liveCars);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let result = [...cars];

    if (searchQuery) {
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.city.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (fuelFilter !== "All") result = result.filter((c) => c.fuel === fuelFilter);
    if (transmissionFilter !== "All") result = result.filter((c) => c.transmission === transmissionFilter);
    if (conditionFilter !== "All") result = result.filter((c) => c.condition === conditionFilter);

    result = result.filter(
      (c) => c.price >= priceRange[0] && c.price <= priceRange[1]
    );

    if (sortBy === "price-low") result.sort((a, b) => a.price - b.price);
    else if (sortBy === "price-high") result.sort((a, b) => b.price - a.price);
    else if (sortBy === "year-new") result.sort((a, b) => b.year - a.year);
    else if (sortBy === "mileage-low") result.sort((a, b) => a.mileage - b.mileage);

    setFiltered(result);
    setVisibleCount(PAGE_SIZE); // reset pagination on filter change
  }, [cars, searchQuery, fuelFilter, transmissionFilter, conditionFilter, priceRange, sortBy]);

  const clearFilters = useCallback(() => {
    setRawSearch("");
    setFuelFilter("All");
    setTransmissionFilter("All");
    setConditionFilter("All");
    setPriceRange([0, 3000000]);
    setSortBy("newest");
  }, []);

  const activeFiltersCount = [
    fuelFilter !== "All",
    transmissionFilter !== "All",
    conditionFilter !== "All",
    priceRange[0] > 0 || priceRange[1] < 3000000,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-black pt-20">
      {/* Page Header */}
      <div className="bg-charcoal-950 border-b border-white/5 py-16">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold-500/30 text-gold-400 text-sm font-medium mb-6">
              Premium Inventory
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">
              Buy <span className="gold-text">Restored Cars</span>
            </h1>
            <p className="text-charcoal-400 max-w-xl mx-auto">
              Professionally restored accident cars at 40-60% below market price.
              All vehicles are road-tested and document-clear.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container-custom py-10">
        {/* Search + Controls Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-400" />
            <input
              type="text"
              placeholder="Search by brand, model, city…"
              value={rawSearch}
              onChange={(e) => setRawSearch(e.target.value)}
              className="input-dark w-full pl-11 pr-10 py-3 rounded-xl text-sm"
            />
            {rawSearch && (
              <button
                onClick={() => setRawSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-500 hover:text-white transition-colors"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="relative min-w-[180px]">
            <CustomSelect
              value={sortBy}
              onChange={setSortBy}
              options={[
                { value: "newest", label: "Newest First" },
                { value: "price-low", label: "Price: Low to High" },
                { value: "price-high", label: "Price: High to Low" },
                { value: "year-new", label: "Year: Newest" },
                { value: "mileage-low", label: "Mileage: Lowest" },
              ]}
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
              showFilters || activeFiltersCount > 0
                ? "btn-gold"
                : "glass border border-white/10 text-white hover:border-gold-500/30"
            }`}
          >
            <SlidersHorizontal size={16} />
            Filters
            {activeFiltersCount > 0 && (
              <span className="ml-1 bg-black/30 text-current text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="glass-dark rounded-2xl p-6 mb-8 border border-white/5 overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Fuel Type */}
                <div>
                  <label className="text-charcoal-300 text-xs font-semibold uppercase tracking-wider block mb-3">
                    Fuel Type
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {fuelTypes.map((fuel) => (
                      <button
                        key={fuel}
                        onClick={() => setFuelFilter(fuel)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          fuelFilter === fuel
                            ? "btn-gold"
                            : "glass text-charcoal-300 border border-white/10 hover:border-gold-500/30"
                        }`}
                      >
                        {fuel}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transmission */}
                <div>
                  <label className="text-charcoal-300 text-xs font-semibold uppercase tracking-wider block mb-3">
                    Transmission
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {transmissions.map((t) => (
                      <button
                        key={t}
                        onClick={() => setTransmissionFilter(t)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          transmissionFilter === t
                            ? "btn-gold"
                            : "glass text-charcoal-300 border border-white/10 hover:border-gold-500/30"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Condition */}
                <div>
                  <label className="text-charcoal-300 text-xs font-semibold uppercase tracking-wider block mb-3">
                    Condition
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {conditions.map((c) => (
                      <button
                        key={c}
                        onClick={() => setConditionFilter(c)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          conditionFilter === c
                            ? "btn-gold"
                            : "glass text-charcoal-300 border border-white/10 hover:border-gold-500/30"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <label className="text-charcoal-300 text-xs font-semibold uppercase tracking-wider block mb-3">
                    Max Price: {formatPrice(priceRange[1])}
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={3000000}
                    step={50000}
                    value={priceRange[1]}
                    onChange={(e) =>
                      setPriceRange([priceRange[0], Number(e.target.value)])
                    }
                    className="w-full accent-yellow-500"
                  />
                  <div className="flex justify-between text-xs text-charcoal-500 mt-1">
                    <span>₹0</span>
                    <span>₹30L</span>
                  </div>
                </div>
              </div>

              {activeFiltersCount > 0 && (
                <div className="flex justify-end mt-4">
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 text-charcoal-400 hover:text-red-400 text-sm transition-colors"
                  >
                    <X size={14} />
                    Clear all filters
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-charcoal-400 text-sm">
            <span className="text-white font-semibold">{filtered.length}</span> cars found
            {searchQuery && (
              <span>
                {" "}for &ldquo;
                <span className="text-gold-400">{searchQuery}</span>&rdquo;
              </span>
            )}
          </p>
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-xs text-charcoal-400 hover:text-red-400 flex items-center gap-1 transition-colors"
            >
              <X size={12} /> Clear filters
            </button>
          )}
        </div>

        {/* Cars Grid */}
        {loading ? (
          <CarGridSkeleton count={6} />
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Filter size={48} className="text-charcoal-700 mx-auto mb-4" />
            <h3 className="text-white font-semibold text-xl mb-2">No cars found</h3>
            <p className="text-charcoal-400 mb-6">
              Try adjusting your filters or search query
            </p>
            <button onClick={clearFilters} className="btn-outline-gold px-6 py-2 rounded-full text-sm">
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filtered.slice(0, visibleCount).map((car, i) => (
                <BuyCarCard key={car.id || i} car={car} index={i} />
              ))}
            </motion.div>

            {/* Load More */}
            {visibleCount < filtered.length && (
              <div className="flex flex-col items-center gap-2 mt-10">
                <p className="text-charcoal-500 text-sm">
                  Showing {visibleCount} of {filtered.length} cars
                </p>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                  className="btn-outline-gold px-8 py-3 rounded-full text-sm font-semibold flex items-center gap-2"
                >
                  Load More <ChevronRight size={15} />
                </motion.button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const BuyCarCard = memo(function BuyCarCard({ car, index }: { car: Car; index: number }) {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -6 }}
      className="glass rounded-2xl overflow-hidden border border-white/5 hover:border-gold-500/25 transition-all duration-300 group"
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        {!imgError ? (
          <Image
            src={car.images?.[0] || "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=600"}
            alt={car.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            onError={() => setImgError(true)}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 bg-charcoal-800 flex items-center justify-center">
            <span className="text-charcoal-500 text-sm">No image</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        <div className="absolute top-3 left-3">
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              car.status === "available"
                ? "badge-available"
                : car.status === "sold"
                ? "badge-sold"
                : "badge-reserved"
            }`}
          >
            {car.status?.charAt(0).toUpperCase() + car.status?.slice(1)}
          </span>
        </div>

        <div className="absolute bottom-3 right-3">
          <span className="price-badge text-sm">
            {formatPrice(car.price)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-white font-bold text-base group-hover:text-gold-400 transition-colors leading-tight">
            {car.name}
          </h3>
        </div>
        <div className="flex items-center gap-1 text-charcoal-400 text-xs mb-3">
          <MapPin size={10} />
          <span>{car.city}, {car.state}</span>
        </div>

        <div className="flex flex-wrap gap-3 mb-4 text-xs text-charcoal-300">
          <span className="flex items-center gap-1">
            <Fuel size={11} className="text-gold-500" />
            {car.fuel}
          </span>
          <span className="flex items-center gap-1">
            <Gauge size={11} className="text-gold-500" />
            {car.mileage?.toLocaleString("en-IN")} km
          </span>
          <span className="flex items-center gap-1">
            <Settings size={11} className="text-gold-500" />
            {car.transmission}
          </span>
          <span className="text-charcoal-500">{car.year}</span>
        </div>

        {car.originalPrice && car.originalPrice > car.price && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-charcoal-500 text-xs line-through">
              {formatPrice(car.originalPrice)}
            </span>
            <span className="text-green-400 text-xs font-semibold bg-green-500/10 px-2 py-0.5 rounded-full">
              Save {Math.round(((car.originalPrice - car.price) / car.originalPrice) * 100)}%
            </span>
          </div>
        )}

        <div className="flex gap-2">
          <Link
            href={`/cars/${car.id || "preview"}`}
            className="flex-1 py-2.5 btn-outline-gold rounded-xl text-sm font-semibold text-center group-hover:bg-gold-500 group-hover:text-black transition-all duration-300"
          >
            View Details
          </Link>
          <a
            href={`https://wa.me/917010587940?text=I'm interested in ${car.name}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2.5 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl text-sm hover:bg-green-500 hover:text-white transition-all duration-300"
          >
            💬
          </a>
        </div>
      </div>
    </motion.div>
  );
});
