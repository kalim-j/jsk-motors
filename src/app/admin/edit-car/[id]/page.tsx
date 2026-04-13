"use client";

import { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { CAR_BRANDS, formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";

export default function EditCarPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    title: "",
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    price: "",
    originalPrice: "",
    condition: "Good" as CarType["condition"],
    mileage: "",
    fuelType: "Petrol" as CarType["fuelType"],
    transmission: "Manual" as CarType["transmission"],
    city: "",
    state: "Tamil Nadu",
    description: "",
    featured: false,
    status: "available" as CarType["status"],
    damageType: "",
    restorationStatus: "",
    images: [] as string[],
  });

  useEffect(() => {
    async function fetchCar() {
      try {
        const docRef = doc(db, "cars", unwrappedParams.id);
        const snap = await getDoc(docRef);
        
        if (snap.exists()) {
          const data = snap.data();
          setFormData({
            title: data.title || "",
            brand: data.brand || "",
            model: data.model || "",
            year: data.year || new Date().getFullYear(),
            price: String(data.price || ""),
            originalPrice: String(data.originalPrice || ""),
            condition: data.condition || "Good",
            mileage: String(data.mileage || ""),
            fuelType: data.fuelType || "Petrol",
            transmission: data.transmission || "Manual",
            city: data.city || "",
            state: data.state || "Tamil Nadu",
            description: data.description || "",
            featured: data.featured || false,
            status: data.status || "available",
            damageType: data.damageType || "",
            restorationStatus: data.restorationStatus || "",
            images: data.images || [],
          });
          setImagePreviews(data.images || []);
        } else {
          toast.error("Car not found");
          router.push("/admin/cars");
        }
      } catch (error) {
        console.error("Error fetching car:", error);
        toast.error("Failed to load car details");
      } finally {
        setLoading(false);
      }
    }

    fetchCar();
  }, [unwrappedParams.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.brand || !formData.price) {
      toast.error("Fill all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const docRef = doc(db, "cars", unwrappedParams.id);
      await updateDoc(docRef, {
        title: formData.title,
        brand: formData.brand,
        model: formData.model,
        year: Number(formData.year),
        price: Number(formData.price),
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : null,
        condition: formData.condition,
        mileage: Number(formData.mileage),
        fuelType: formData.fuelType,
        transmission: formData.transmission,
        city: formData.city,
        state: formData.state,
        description: formData.description,
        featured: formData.featured,
        status: formData.status,
        damageType: formData.damageType,
        restorationStatus: formData.restorationStatus,
        updatedAt: new Date()
      });

      toast.success("Car updated successfully! ✅");
      router.push("/admin/cars");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update car");
    } finally {
      setSubmitting(false);
    }
  };

  const update = (field: keyof typeof formData, value: string | number | boolean) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-gold-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-20">
      <div className="container-custom py-10">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/admin/cars"
            className="w-10 h-10 glass shadow-2xl rounded-2xl flex items-center justify-center hover:border-gold-500/50 border border-white/10 transition-all group"
          >
            <ArrowLeft size={20} className="text-charcoal-300 group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
            <h1 className="font-display text-3xl font-black text-white uppercase tracking-wider">
              Edit Car <span className="text-gold-500">Record</span>
            </h1>
            <p className="text-charcoal-400 text-sm font-medium">Original ID: #{unwrappedParams.id.slice(-6)}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-4xl space-y-8">
          {/* Main Controls Grid */}
          <div className="grid xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-8">
               <div className="glass-dark rounded-[2.5rem] p-10 border border-white/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gold-500/5 blur-[80px] -mr-20 -mt-20 group-hover:bg-gold-500/10 transition-all" />
                  <h2 className="text-white font-black text-xl mb-8 uppercase tracking-widest flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-gold-500 flex items-center justify-center text-black text-sm">01</span>
                    Basic Information
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                       <label className="text-charcoal-500 text-[10px] font-black uppercase tracking-[0.2em] block mb-3 pl-1">Listing Title *</label>
                       <input
                         value={formData.title}
                         onChange={(e) => update("title", e.target.value)}
                         className="input-dark w-full px-6 py-4 rounded-2xl text-sm border-white/5 focus:border-gold-500/50 transition-all font-medium"
                         required
                       />
                    </div>

                    <div>
                       <label className="text-charcoal-500 text-[10px] font-black uppercase tracking-[0.2em] block mb-3 pl-1">Brand *</label>
                       <select
                         value={formData.brand}
                         onChange={(e) => update("brand", e.target.value)}
                         className="input-dark w-full px-6 py-4 rounded-2xl text-sm border-white/5 focus:border-gold-500/50 transition-all font-medium"
                         required
                       >
                         {CAR_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                       </select>
                    </div>

                    <div>
                       <label className="text-charcoal-500 text-[10px] font-black uppercase tracking-[0.2em] block mb-3 pl-1">Model *</label>
                       <input
                         value={formData.model}
                         onChange={(e) => update("model", e.target.value)}
                         className="input-dark w-full px-6 py-4 rounded-2xl text-sm border-white/5 focus:border-gold-500/50 transition-all font-medium"
                         required
                       />
                    </div>

                    <div>
                       <label className="text-charcoal-500 text-[10px] font-black uppercase tracking-[0.2em] block mb-3 pl-1">Year</label>
                       <input
                         type="number"
                         value={formData.year}
                         onChange={(e) => update("year", e.target.value)}
                         className="input-dark w-full px-6 py-4 rounded-2xl text-sm border-white/5 focus:border-gold-500/50 transition-all font-medium"
                       />
                    </div>

                    <div>
                       <label className="text-charcoal-500 text-[10px] font-black uppercase tracking-[0.2em] block mb-3 pl-1">Mileage (km)</label>
                       <input
                         type="number"
                         value={formData.mileage}
                         onChange={(e) => update("mileage", e.target.value)}
                         className="input-dark w-full px-6 py-4 rounded-2xl text-sm border-white/5 focus:border-gold-500/50 transition-all font-medium"
                       />
                    </div>
                  </div>
               </div>

               <div className="glass-dark rounded-[2.5rem] p-10 border border-white/5">
                  <h2 className="text-white font-black text-xl mb-8 uppercase tracking-widest flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-gold-500 flex items-center justify-center text-black text-sm">02</span>
                    Pricing & Restoration
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                       <label className="text-charcoal-500 text-[10px] font-black uppercase tracking-[0.2em] block mb-3 pl-1">Our Price (₹) *</label>
                       <input
                         type="number"
                         value={formData.price}
                         onChange={(e) => update("price", e.target.value)}
                         className="input-dark w-full px-6 py-4 rounded-2xl text-sm border-white/5 focus:border-gold-500/50 transition-all font-bold text-gold-500"
                         required
                       />
                       <p className="text-[10px] text-charcoal-500 mt-2 pl-1 italic">Current Value: {formatPrice(Number(formData.price))}</p>
                    </div>

                    <div>
                       <label className="text-charcoal-500 text-[10px] font-black uppercase tracking-[0.2em] block mb-3 pl-1">Original Market Price (₹)</label>
                       <input
                         type="number"
                         value={formData.originalPrice}
                         onChange={(e) => update("originalPrice", e.target.value)}
                         className="input-dark w-full px-6 py-4 rounded-2xl text-sm border-white/5 focus:border-gold-500/50 transition-all font-medium"
                       />
                    </div>

                    <div>
                       <label className="text-charcoal-500 text-[10px] font-black uppercase tracking-[0.2em] block mb-3 pl-1">Restoration Info</label>
                       <input
                         value={formData.restorationStatus}
                         onChange={(e) => update("restorationStatus", e.target.value)}
                         className="input-dark w-full px-6 py-4 rounded-2xl text-sm border-white/5 focus:border-gold-500/50 transition-all font-medium"
                         placeholder="e.g. Fully Restored Engine"
                       />
                    </div>

                    <div>
                       <label className="text-charcoal-500 text-[10px] font-black uppercase tracking-[0.2em] block mb-3 pl-1">Damage Description</label>
                       <input
                         value={formData.damageType}
                         onChange={(e) => update("damageType", e.target.value)}
                         className="input-dark w-full px-6 py-4 rounded-2xl text-sm border-white/5 focus:border-gold-500/50 transition-all font-medium"
                         placeholder="e.g. Frontal Impact"
                       />
                    </div>
                  </div>
               </div>
            </div>

            <div className="xl:col-span-1 space-y-8">
               <div className="glass-dark rounded-[2.5rem] p-8 border border-white/5">
                  <h2 className="text-white font-black text-lg mb-6 uppercase tracking-widest">Inventory Status</h2>
                  <div className="space-y-6">
                    <div>
                       <label className="text-charcoal-500 text-[8px] font-black uppercase tracking-[0.2em] block mb-2 pl-1">Current Status</label>
                       <select 
                         value={formData.status}
                         onChange={(e) => update("status", e.target.value)}
                         className="input-dark w-full px-4 py-3 rounded-2xl text-sm font-bold uppercase tracking-widest border-white/5"
                       >
                         <option value="available">Available</option>
                         <option value="reserved">Reserved</option>
                         <option value="sold">Sold</option>
                       </select>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                       <span className="text-charcoal-300 text-xs font-bold uppercase tracking-wider">Featured Stock</span>
                       <button
                         type="button"
                         onClick={() => update("featured", !formData.featured)}
                         className={`w-12 h-6 rounded-full transition-all relative ${formData.featured ? "bg-gold-500 shadow-gold/40" : "bg-charcoal-700"}`}
                       >
                         <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.featured ? "left-7" : "left-1"}`} />
                       </button>
                    </div>

                    <div>
                       <label className="text-charcoal-500 text-[8px] font-black uppercase tracking-[0.2em] block mb-2 pl-1">Shift Transmission</label>
                       <select
                         value={formData.transmission}
                         onChange={(e) => update("transmission", e.target.value)}
                         className="input-dark w-full px-4 py-3 rounded-2xl text-sm font-medium border-white/5"
                        >
                         <option value="Manual">Manual</option>
                         <option value="Automatic">Automatic</option>
                       </select>
                    </div>
                    
                    <div>
                       <label className="text-charcoal-500 text-[8px] font-black uppercase tracking-[0.2em] block mb-2 pl-1">Fuel Protocol</label>
                       <select
                          value={formData.fuelType}
                          onChange={(e) => update("fuelType", e.target.value)}
                          className="input-dark w-full px-4 py-3 rounded-2xl text-sm font-medium border-white/5"
                        >
                         {["Petrol", "Diesel", "Electric", "Hybrid", "CNG"].map(t => <option key={t} value={t}>{t}</option>)}
                       </select>
                    </div>
                  </div>
               </div>

               <div className="glass shadow-2xl rounded-[2.5rem] p-8 border border-white/5">
                  <h2 className="text-white font-black text-lg mb-4 uppercase tracking-widest">Images Preview</h2>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {imagePreviews.slice(0, 4).map((url, i) => (
                      <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 group/img">
                        <Image src={url} alt="Preview" fill className="object-cover group-hover/img:scale-110 transition-transform" />
                        {i === 0 && <div className="absolute top-2 left-2 bg-gold-500 text-black text-[8px] px-1.5 py-0.5 rounded font-black">COVER</div>}
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-charcoal-500 italic text-center leading-relaxed">Images cannot be changed in quick-edit mode. To replace images, please use the standard uploader.</p>
               </div>
            </div>
          </div>

          <div className="flex gap-4 pt-10 border-t border-white/5">
             <motion.button
               type="submit"
               disabled={submitting}
               whileHover={{ scale: 1.02, y: -2 }}
               whileTap={{ scale: 0.98 }}
               className="btn-gold flex-1 py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 shadow-gold hover:shadow-gold-lg transition-all disabled:opacity-50"
             >
               {submitting ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Update Inventory Record</>}
             </motion.button>
             <Link
               href="/admin/cars"
               className="px-10 py-5 rounded-[1.5rem] bg-white/5 border border-white/10 text-charcoal-400 font-black uppercase tracking-[0.2em] text-sm hover:bg-white/10 hover:text-white transition-all flex items-center justify-center"
             >
               Cancel
             </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
