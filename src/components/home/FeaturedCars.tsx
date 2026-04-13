"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import Link from "next/link";
import Image from "next/image";
import { Fuel, Gauge, Settings, MapPin, ArrowRight, Star } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { CarGridSkeleton } from "@/components/ui/Skeleton";
import { sampleCars } from "@/lib/sampleData";
import type { Car } from "@/lib/firestore";

export default function FeaturedCars() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.05 });

  useEffect(() => {
    // Load sample data — replace with Firestore in production
    const timer = setTimeout(() => {
      setCars(sampleCars.filter((c) => c.featured).slice(0, 6) as Car[]);
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="section-padding bg-charcoal-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(212,175,55,0.05),transparent_60%)] pointer-events-none" />

      <div className="container-custom relative z-10">
        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-12"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold-500/30 text-gold-400 text-sm font-medium mb-4">
              Premium Inventory
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-white">
              Featured{" "}
              <span className="gold-text">Cars for Sale</span>
            </h2>
          </div>
          <Link
            href="/buy"
            className="btn-outline-gold px-6 py-3 rounded-full text-sm font-semibold flex items-center gap-2 group whitespace-nowrap"
          >
            View All
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {/* Cars Grid */}
        {loading ? (
          <CarGridSkeleton count={6} />
        ) : (
          <motion.div
            initial="hidden"
            animate={inView ? "show" : "hidden"}
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.15 } },
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {cars.map((car) => (
              <CarCard key={car.id || car.name} car={car} />
            ))}
          </motion.div>
        )}

        {/* CTA Banner */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-16 glass-gold rounded-3xl p-8 lg:p-12 text-center border border-gold-500/20 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.12),transparent_70%)] pointer-events-none" />
          <div className="relative z-10">
            <h3 className="font-display text-3xl font-bold text-white mb-4">
              Can&apos;t Find What You&apos;re Looking For?
            </h3>
            <p className="text-charcoal-300 mb-8 max-w-lg mx-auto">
              Tell us your requirements and we&apos;ll find the perfect restored car for
              you. <span className="text-gold-400">No commission, no hidden fees.</span>
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/contact" className="btn-gold px-8 py-3 rounded-full font-bold">
                Request a Car
              </Link>
              <a href="tel:9092704777" className="text-charcoal-300 hover:text-gold-400 transition-colors text-sm">
                Or call: 9092704777
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function CarCard({ car }: { car: Car }) {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeInOut" } },
      }}
      whileHover={{ y: -6, scale: 1.02 }}
      className="glass rounded-2xl overflow-hidden border border-white/5 hover:border-gold-500/25 transition-all duration-300 group"
      style={{ willChange: "transform, opacity" }}
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
            <span className="text-charcoal-500 text-sm">Image unavailable</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
          {car.featured && (
            <span className="flex items-center gap-1 bg-gold-500/90 text-black text-xs font-bold px-2.5 py-1 rounded-full">
              <Star size={10} className="fill-black" />
              Featured
            </span>
          )}
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              car.status === "available"
                ? "badge-available"
                : car.status === "sold"
                ? "badge-sold"
                : "badge-reserved"
            }`}
          >
            {car.status?.charAt(0).toUpperCase() + car.status?.slice(1) || "Available"}
          </span>
        </div>

        <div className="absolute bottom-3 right-3">
          <span className="price-badge text-sm !text-sm !py-1">
            {formatPrice(car.price)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-white font-bold text-base mb-1 group-hover:text-gold-400 transition-colors truncate">
          {car.name}
        </h3>
        <div className="flex items-center gap-1 text-charcoal-400 text-xs mb-4">
          <MapPin size={10} />
          <span>{car.city}, {car.state}</span>
        </div>

        {/* Specs */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-1.5 text-charcoal-300 text-xs">
            <Fuel size={12} className="text-gold-500" />
            {car.fuel}
          </div>
          <div className="flex items-center gap-1.5 text-charcoal-300 text-xs">
            <Gauge size={12} className="text-gold-500" />
            {car.mileage?.toLocaleString("en-IN")} km
          </div>
          <div className="flex items-center gap-1.5 text-charcoal-300 text-xs">
            <Settings size={12} className="text-gold-500" />
            {car.transmission}
          </div>
        </div>

        {car.originalPrice && car.originalPrice > car.price && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-charcoal-500 text-xs line-through">
              {formatPrice(car.originalPrice)}
            </span>
            <span className="text-green-400 text-xs font-semibold">
              Save {Math.round(((car.originalPrice - car.price) / car.originalPrice) * 100)}%
            </span>
          </div>
        )}

        <Link
          href={`/cars/${car.id || "1"}`}
          className="btn-outline-gold w-full py-2.5 rounded-full text-sm font-semibold text-center block group-hover:bg-gold-500 group-hover:text-black transition-all duration-300"
        >
          View Details
        </Link>
      </div>
    </motion.div>
  );
}
