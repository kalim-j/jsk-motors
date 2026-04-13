"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ArrowLeft, 
  Fuel, 
  Gauge, 
  Settings, 
  MapPin, 
  Phone, 
  MessageCircle, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  Calendar,
  Share2
} from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import type { Car } from "@/lib/firestore";
import toast from "react-hot-toast";

export default function PublicCarDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    async function fetchCar() {
      try {
        const docRef = doc(db, "cars", unwrappedParams.id);
        const snap = await getDoc(docRef);
        
        if (snap.exists()) {
          setCar({ id: snap.id, ...snap.data() } as Car);
        } else {
          toast.error("Car not found in our inventory");
        }
      } catch (error) {
        console.error("Error fetching car:", error);
        toast.error("Failed to load car details");
      } finally {
        setLoading(false);
      }
    }

    fetchCar();
  }, [unwrappedParams.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gold-500/20 border-t-gold-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <h2 className="text-white text-2xl font-bold mb-4">Car Not Found</h2>
        <Link href="/buy" className="btn-gold px-8 py-3 rounded-full">
          Back to Inventory
        </Link>
      </div>
    );
  }

  const images = Array.isArray(car.images) && car.images.length > 0 
    ? car.images 
    : typeof car.images === "string" && car.images 
      ? [car.images] 
      : ["https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800"];

  return (
    <div className="min-h-screen bg-black pt-28 pb-20">
      <div className="container-custom">
        {/* Breadcrumbs / Back */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/buy"
            className="flex items-center gap-2 text-charcoal-400 hover:text-gold-400 transition-all font-medium group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            Back to Inventory
          </Link>
          <button className="text-charcoal-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-semibold">
            <Share2 size={16} /> Share
          </button>
        </div>

        <div className="grid lg:grid-cols-12 gap-10">
          {/* Left Column: Images & Analysis */}
          <div className="lg:col-span-8 space-y-8">
            {/* Main Image Slider */}
            <div className="relative aspect-video sm:h-[500px] w-full rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5">
              <Image
                src={images[currentImage]}
                alt={car.name}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

              {images.length > 1 && (
                <div className="absolute inset-0 flex items-center justify-between p-4 sm:p-6 opacity-0 hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setCurrentImage((p) => (p === 0 ? images.length - 1 : p - 1))}
                    className="w-12 h-12 glass shadow-2xl rounded-2xl flex items-center justify-center border border-white/20 hover:border-gold-500/50 hover:bg-gold-500 hover:text-black transition-all"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={() => setCurrentImage((p) => (p === images.length - 1 ? 0 : p + 1))}
                    className="w-12 h-12 glass shadow-2xl rounded-2xl flex items-center justify-center border border-white/20 hover:border-gold-500/50 hover:bg-gold-500 hover:text-black transition-all"
                  >
                    <ChevronRight size={24} />
                  </button>
                </div>
              )}
              
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImage(i)}
                    className={`h-1.5 transition-all rounded-full ${i === currentImage ? "w-6 bg-gold-500" : "w-1.5 bg-white/40"}`}
                  />
                ))}
              </div>
            </div>

            {/* Thumbnail Grid */}
            {images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImage(i)}
                    className={`relative w-28 h-20 flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
                      i === currentImage ? "border-gold-500 scale-95 shadow-lg shadow-gold/20" : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Image src={img} alt={`Preview ${i + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Technical Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="glass-dark rounded-[2rem] p-8 border border-white/5 group hover:border-gold-500/20 transition-all">
                <h3 className="text-white font-bold text-xl mb-6 flex items-center gap-3">
                  <ShieldCheck size={24} className="text-gold-500" /> Professional Inspection
                </h3>
                <div className="space-y-4">
                  {[
                    { label: "Engine & Performance", value: "Verified / Road Tested" },
                    { label: "Structure & Frame", value: car.condition === "Excellent" ? "Certified Perfect" : "Restored to OEM Specs" },
                    { label: "Documentation", value: "Clean / Clearance Verified" },
                    { label: "Warranty", value: "6 Months Service Warranty" },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
                      <span className="text-charcoal-400 text-sm font-medium">{item.label}</span>
                      <span className="text-green-400 text-sm font-bold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-dark rounded-[2rem] p-8 border border-white/5 group hover:border-gold-500/20 transition-all">
                <h3 className="text-white font-bold text-xl mb-6 flex items-center gap-3">
                  <Gauge size={24} className="text-gold-500" /> Performance Tech
                </h3>
                <div className="space-y-4">
                  {[
                    { label: "Drive Type", value: "Front Wheel Drive" },
                    { label: "Safety Rating", value: "5-Star Global NCAP" },
                    { label: "Features", value: "Touchscreen, Alloy Wheels" },
                    { label: "Service History", value: "Fully Documented" },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
                      <span className="text-charcoal-400 text-sm font-medium">{item.label}</span>
                      <span className="text-white text-sm font-bold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Detailed Info */}
            <div className="glass-dark rounded-[2.5rem] p-10 border border-white/5 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/2 blur-[100px] -mr-32 -mt-32" />
               <h2 className="text-white text-2xl font-bold mb-6 font-display uppercase tracking-widest text-gold-500/50">Car Description</h2>
               <p className="text-charcoal-300 text-lg leading-relaxed font-medium">
                 {car.description || "This vehicle has been professionally restored and maintained by JSK Motors. All documentation is clear and the car is ready for immediate transfer. Road tested extensively for over 500km."}
               </p>
            </div>
          </div>

          {/* Right Column: Key Info & CTA */}
          <div className="lg:col-span-4 lg:sticky lg:top-28 h-fit space-y-6">
            <div className="glass-dark rounded-[2.5rem] p-8 border border-gold-500/20 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-2 bg-gold-gradient" />
              
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                   <span className="px-3 py-1 bg-gold-500/10 border border-gold-500/30 text-gold-500 text-[10px] uppercase font-black tracking-widest rounded-lg">
                     Verified Stock
                   </span>
                   <span className="px-3 py-1 bg-green-500/10 border border-green-500/30 text-green-500 text-[10px] uppercase font-black tracking-widest rounded-lg">
                     {car.status?.toUpperCase() || "AVAILABLE"}
                   </span>
                </div>
                <h1 className="font-display text-4xl font-black text-white mb-2 leading-tight group-hover:text-gold-400 transition-colors uppercase">
                  {car.name}
                </h1>
                <div className="flex items-center gap-2 text-charcoal-400 font-bold text-sm">
                  <MapPin size={16} className="text-gold-500" />
                  {car.city}, {car.state}
                </div>
              </div>

              <div className="mb-8 p-6 rounded-[1.5rem] bg-white/2 border border-white/5">
                <div className="text-gold-400 text-4xl font-black font-display mb-1">{formatPrice(car.price)}</div>
                <div className="text-charcoal-500 text-[10px] uppercase font-black tracking-[0.2em] mb-4">Starting At Price</div>
                {car.originalPrice && car.originalPrice > car.price && (
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-green-500/5 border border-green-500/10">
                    <span className="text-charcoal-500 text-sm line-through font-bold">{formatPrice(car.originalPrice)}</span>
                    <span className="text-green-400 text-sm font-black uppercase tracking-tighter">
                      Save {Math.round(((car.originalPrice - car.price) / car.originalPrice) * 100)}% Today
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { icon: Fuel, value: car.fuel, label: "Fuel" },
                  { icon: Gauge, value: `${car.mileage?.toLocaleString("en-IN")} km`, label: "Mileage" },
                  { icon: Settings, value: car.transmission, label: "Shift" }
                ].map((item, i) => (
                  <div key={i} className="text-center p-4 glass rounded-[1.5rem] border border-white/5 hover:border-gold-500/30 transition-all">
                    <item.icon size={20} className="text-gold-500 mx-auto mb-2" />
                    <div className="text-white text-[10px] font-black uppercase truncate mb-0.5">{item.value}</div>
                    <div className="text-charcoal-500 text-[8px] uppercase font-black tracking-widest">{item.label}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <a
                  href={`tel:7010587940`}
                  className="w-full py-5 rounded-2xl bg-gold-gradient text-black font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 shadow-gold hover:shadow-gold-lg hover:-translate-y-1 transition-all"
                >
                  <Phone size={18} /> Call Specialist
                </a>
                <a
                  href={`https://wa.me/917010587940?text=I'm interested in viewing the ${car.name} available in ${car.city}.`}
                  target="_blank"
                  className="w-full py-5 rounded-2xl bg-green-500/10 border border-green-500/30 text-green-400 font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:bg-green-500 hover:text-white transition-all"
                >
                  <MessageCircle size={18} /> WhatsApp Enquiry
                </a>
              </div>
            </div>

            <div className="glass-dark rounded-[2.5rem] p-6 border border-white/5 flex items-center gap-4 group cursor-pointer hover:border-gold-500/20 transition-all">
               <div className="w-12 h-12 rounded-2xl bg-gold-500/10 flex items-center justify-center text-gold-500 group-hover:bg-gold-500 group-hover:text-black transition-all">
                  <Calendar size={20} />
               </div>
               <div>
                  <h4 className="text-white text-sm font-bold">Listed Recently</h4>
                  <p className="text-charcoal-400 text-xs">{formatDate(car.createdAt || new Date())}</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
