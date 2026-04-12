"use client";

import { useEffect, useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Fuel, Gauge, Settings, MapPin, Calendar, Shield, Phone, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { sampleCars } from "@/lib/sampleData";
import type { Car } from "@/lib/firestore";

export default function CarDetailPage({ params }: { params: { id: string } }) {
  const [car, setCar] = useState<Car | null>(null);
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    // Try to find from sample data
    const found = sampleCars.find((c, i) => String(i) === params.id || c.id === params.id);
    if (found) {
      setCar(found as Car);
    } else {
      // Default to first car for preview
      setCar(sampleCars[0] as Car);
    }
  }, [params.id]);

  if (!car) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-charcoal-400">Loading...</div>
      </div>
    );
  }

  const images = car.images?.length ? car.images : ["https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800"];

  return (
    <div className="min-h-screen bg-black pt-20">
      <div className="container-custom py-10">
        {/* Back */}
        <Link
          href="/buy"
          className="flex items-center gap-2 text-charcoal-400 hover:text-gold-400 transition-colors mb-8 text-sm"
        >
          <ArrowLeft size={16} />
          Back to listing
        </Link>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Images */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative h-80 sm:h-[420px] rounded-2xl overflow-hidden">
              <Image
                src={images[currentImage]}
                alt={car.title}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImage((p) => Math.max(0, p - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 glass rounded-full flex items-center justify-center border border-white/20 hover:border-gold-500/40 transition-all"
                  >
                    <ChevronLeft size={18} className="text-white" />
                  </button>
                  <button
                    onClick={() => setCurrentImage((p) => Math.min(images.length - 1, p + 1))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 glass rounded-full flex items-center justify-center border border-white/20 hover:border-gold-500/40 transition-all"
                  >
                    <ChevronRight size={18} className="text-white" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImage(i)}
                    className={`relative w-20 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      i === currentImage ? "border-gold-500" : "border-transparent"
                    }`}
                  >
                    <Image src={img} alt={`View ${i + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Description */}
            <div className="glass-dark rounded-2xl p-6 border border-white/5">
              <h2 className="text-white font-bold text-lg mb-4">About This Car</h2>
              <p className="text-charcoal-300 text-sm leading-relaxed">{car.description}</p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                {[
                  { label: "Brand", value: car.brand },
                  { label: "Model", value: car.model },
                  { label: "Year", value: car.year },
                  { label: "Condition", value: car.condition },
                ].map(({ label, value }) => (
                  <div key={label} className="glass rounded-xl p-3 text-center border border-white/5">
                    <div className="text-charcoal-400 text-xs mb-1">{label}</div>
                    <div className="text-white font-semibold text-sm">{String(value)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Info Panel */}
          <div className="space-y-5">
            <div className="glass-dark rounded-2xl p-6 border border-gold-500/15">
              <div className="mb-4">
                <h1 className="font-display text-2xl font-bold text-white mb-2">{car.title}</h1>
                <div className="flex items-center gap-2 text-charcoal-400 text-sm">
                  <MapPin size={14} />
                  {car.city}, {car.state}
                </div>
              </div>

              <div className="mb-5">
                <div className="price-badge text-xl mb-1">{formatPrice(car.price)}</div>
                {car.originalPrice && car.originalPrice > car.price && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-charcoal-500 text-sm line-through">{formatPrice(car.originalPrice)}</span>
                    <span className="text-green-400 text-xs font-semibold bg-green-500/10 px-2 py-0.5 rounded-full">
                      Save {Math.round(((car.originalPrice - car.price) / car.originalPrice) * 100)}%
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="text-center p-3 glass rounded-xl border border-white/5">
                  <Fuel size={16} className="text-gold-500 mx-auto mb-1" />
                  <div className="text-white text-xs font-medium">{car.fuelType}</div>
                </div>
                <div className="text-center p-3 glass rounded-xl border border-white/5">
                  <Gauge size={16} className="text-gold-500 mx-auto mb-1" />
                  <div className="text-white text-xs font-medium">{car.mileage?.toLocaleString("en-IN")} km</div>
                </div>
                <div className="text-center p-3 glass rounded-xl border border-white/5">
                  <Settings size={16} className="text-gold-500 mx-auto mb-1" />
                  <div className="text-white text-xs font-medium">{car.transmission}</div>
                </div>
              </div>

              {car.damageType && (
                <div className="border-t border-white/5 pt-4 mb-5">
                  <div className="flex justify-between text-sm py-2">
                    <span className="text-charcoal-400">Original Damage</span>
                    <span className="text-white">{car.damageType}</span>
                  </div>
                  <div className="flex justify-between text-sm py-2">
                    <span className="text-charcoal-400">Restoration</span>
                    <span className="text-green-400 font-semibold">{car.restorationStatus}</span>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <a
                  href="tel:7010587940"
                  className="btn-gold w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                >
                  <Phone size={16} />
                  Call to Enquire
                </a>
                <a
                  href={`https://wa.me/917010587940?text=I'm interested in ${car.title}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-green-500/15 border border-green-500/30 text-green-400 hover:bg-green-500/25 transition-all"
                >
                  <MessageCircle size={16} />
                  WhatsApp Enquiry
                </a>
                <Link
                  href="/contact"
                  className="btn-outline-gold w-full py-3.5 rounded-xl text-sm font-semibold text-center block"
                >
                  Schedule Viewing
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
