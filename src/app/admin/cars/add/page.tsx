"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, X, Check } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { addCar } from "@/lib/firestore";
import { uploadCarImages } from "@/lib/storage";
import { INDIAN_STATES, CAR_BRANDS, formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";
import CustomSelect from "@/components/ui/CustomSelect";

export default function AddCarPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    price: "",
    originalPrice: "",
    condition: "Good" as const,
    mileage: "",
    fuel: "Petrol" as const,
    transmission: "Manual" as const,
    city: "",
    state: "Tamil Nadu",
    description: "",
    featured: false,
    status: "available" as const,
    damageType: "",
    restorationStatus: "",
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 8) {
      toast.error("Maximum 8 images");
      return;
    }
    setImages((prev) => [...prev, ...files]);
    setImagePreviews((prev) => [
      ...prev,
      ...files.map((f) => URL.createObjectURL(f)),
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.brand || !formData.price) {
      toast.error("Fill all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const carId = `car_${Date.now()}`;
      let imageUrls: string[] = [];

      if (images.length > 0) {
        try {
          imageUrls = await uploadCarImages(images, carId);
        } catch {
          imageUrls = [
            "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800",
          ];
          toast("Using placeholder image. Configure Firebase Storage for real uploads.", { icon: "⚠" });
        }
      }

      await addCar({
        name: formData.name,
        brand: formData.brand,
        model: formData.model,
        year: formData.year,
        price: Number(formData.price),
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
        condition: formData.condition,
        mileage: Number(formData.mileage),
        fuel: formData.fuel,
        transmission: formData.transmission,
        city: formData.city,
        state: formData.state,
        description: formData.description,
        featured: formData.featured,
        status: formData.status,
        damageType: formData.damageType,
        restorationStatus: formData.restorationStatus,
        images: imageUrls,
      });

      toast.success("Car added successfully!");
      router.push("/admin/cars");
    } catch (error) {
      console.error(error);
      toast.error("Failed to add car. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const update = (field: string, value: unknown) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="min-h-screen bg-black pt-20">
      <div className="container-custom py-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/admin/cars"
            className="w-9 h-9 glass rounded-xl flex items-center justify-center hover:border-gold-500/30 border border-white/10 transition-colors"
          >
            <ArrowLeft size={16} className="text-charcoal-300" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Add New Car</h1>
            <p className="text-charcoal-400 text-sm">Add a new car to the inventory</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
          {/* Basic Info */}
          <div className="glass-dark rounded-2xl p-7 border border-white/5">
            <h2 className="text-white font-bold text-lg mb-6">Basic Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="text-charcoal-300 text-xs font-medium block mb-2">
                  Listing Title *
                </label>
                <input
                  value={formData.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="e.g., 2020 Hyundai Creta Fully Restored"
                  className="input-dark w-full px-4 py-3 rounded-xl text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-charcoal-300 text-xs font-medium block mb-2">Brand *</label>
                <CustomSelect
                  value={formData.brand}
                  onChange={(v) => update("brand", v)}
                  options={[
                    { value: "", label: "Select Brand" },
                    ...CAR_BRANDS.map(b => ({ value: b, label: b }))
                  ]}
                />
              </div>

              <div>
                <label className="text-charcoal-300 text-xs font-medium block mb-2">Model *</label>
                <input
                  value={formData.model}
                  onChange={(e) => update("model", e.target.value)}
                  placeholder="e.g., Creta"
                  className="input-dark w-full px-4 py-3 rounded-xl text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-charcoal-300 text-xs font-medium block mb-2">Year *</label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => update("year", Number(e.target.value))}
                  min={1990}
                  max={new Date().getFullYear()}
                  className="input-dark w-full px-4 py-3 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="text-charcoal-300 text-xs font-medium block mb-2">
                  Selling Price (₹) *
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => update("price", e.target.value)}
                  placeholder="e.g., 750000"
                  className="input-dark w-full px-4 py-3 rounded-xl text-sm"
                  required
                />
                {formData.price && (
                  <p className="text-gold-400 text-xs mt-1">
                    = {formatPrice(Number(formData.price))}
                  </p>
                )}
              </div>

              <div>
                <label className="text-charcoal-300 text-xs font-medium block mb-2">
                  Market Price (₹) — for showing savings
                </label>
                <input
                  type="number"
                  value={formData.originalPrice}
                  onChange={(e) => update("originalPrice", e.target.value)}
                  placeholder="e.g., 1200000"
                  className="input-dark w-full px-4 py-3 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="text-charcoal-300 text-xs font-medium block mb-2">Mileage (km)</label>
                <input
                  type="number"
                  value={formData.mileage}
                  onChange={(e) => update("mileage", e.target.value)}
                  placeholder="e.g., 45000"
                  className="input-dark w-full px-4 py-3 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="text-charcoal-300 text-xs font-medium block mb-2">Fuel Type</label>
                <CustomSelect
                  value={formData.fuel}
                  onChange={(v) => update("fuel", v)}
                  options={["Petrol","Diesel","Electric","Hybrid","CNG"].map(t => ({ value: t, label: t }))}
                />
              </div>

              <div>
                <label className="text-charcoal-300 text-xs font-medium block mb-2">Transmission</label>
                <CustomSelect
                  value={formData.transmission}
                  onChange={(v) => update("transmission", v)}
                  options={["Manual","Automatic"].map(t => ({ value: t, label: t }))}
                />
              </div>

              <div>
                <label className="text-charcoal-300 text-xs font-medium block mb-2">Condition</label>
                <CustomSelect
                  value={formData.condition}
                  onChange={(v) => update("condition", v)}
                  options={["Excellent","Good","Fair","Restoration"].map(c => ({ value: c, label: c }))}
                />
              </div>

              <div>
                <label className="text-charcoal-300 text-xs font-medium block mb-2">City</label>
                <input
                  value={formData.city}
                  onChange={(e) => update("city", e.target.value)}
                  placeholder="City name"
                  className="input-dark w-full px-4 py-3 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="text-charcoal-300 text-xs font-medium block mb-2">State</label>
                <CustomSelect
                  value={formData.state}
                  onChange={(v) => update("state", v)}
                  options={INDIAN_STATES.map(s => ({ value: s, label: s }))}
                />
              </div>

              <div>
                <label className="text-charcoal-300 text-xs font-medium block mb-2">Original Damage Type</label>
                <input
                  value={formData.damageType}
                  onChange={(e) => update("damageType", e.target.value)}
                  placeholder="e.g., Front End Collision"
                  className="input-dark w-full px-4 py-3 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="text-charcoal-300 text-xs font-medium block mb-2">Restoration Status</label>
                <input
                  value={formData.restorationStatus}
                  onChange={(e) => update("restorationStatus", e.target.value)}
                  placeholder="e.g., Fully Restored"
                  className="input-dark w-full px-4 py-3 rounded-xl text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-charcoal-300 text-xs font-medium block mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => update("description", e.target.value)}
                  rows={4}
                  placeholder="Detailed description of the car, restoration work done, current condition..."
                  className="input-dark w-full px-4 py-3 rounded-xl text-sm resize-none"
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="flex flex-wrap gap-6 mt-5">
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => update("featured", !formData.featured)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    formData.featured ? "bg-gold-500" : "bg-charcoal-700"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                      formData.featured ? "left-6" : "left-1"
                    }`}
                  />
                </div>
                <span className="text-charcoal-300 text-sm">Featured Car</span>
              </label>

              <div>
                <label className="text-charcoal-300 text-xs font-medium block mb-2">Status</label>
                <CustomSelect
                  value={formData.status}
                  onChange={(v) => update("status", v)}
                  options={[
                    { value: "available", label: "Available" },
                    { value: "reserved", label: "Reserved" },
                    { value: "sold", label: "Sold" },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="glass-dark rounded-2xl p-7 border border-white/5">
            <h2 className="text-white font-bold text-lg mb-5">Car Images</h2>
            <label className="block w-full cursor-pointer mb-5">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageSelect}
                className="sr-only"
              />
              <div className="border-2 border-dashed border-white/15 hover:border-gold-500/40 rounded-2xl p-8 text-center transition-colors">
                <Upload size={28} className="text-charcoal-500 mx-auto mb-2" />
                <p className="text-white font-medium text-sm mb-1">
                  Click to upload images
                </p>
                <p className="text-charcoal-500 text-xs">Up to 8 images</p>
              </div>
            </label>

            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-4 gap-3">
                {imagePreviews.map((url, i) => (
                  <div key={i} className="relative group aspect-square rounded-xl overflow-hidden">
                    <Image src={url} alt={`Preview ${i + 1}`} fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setImages((p) => p.filter((_, j) => j !== i));
                        setImagePreviews((p) => p.filter((_, j) => j !== i));
                      }}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} className="text-white" />
                    </button>
                    {i === 0 && (
                      <div className="absolute bottom-1.5 left-1.5 bg-gold-500 text-black text-xs px-1.5 py-0.5 rounded font-bold">
                        MAIN
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <motion.button
              type="submit"
              disabled={submitting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-gold px-8 py-3.5 rounded-full font-bold flex items-center gap-2 disabled:opacity-70"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <Check size={18} />
                  Add Car to Inventory
                </>
              )}
            </motion.button>
            <Link
              href="/admin/cars"
              className="glass px-8 py-3.5 rounded-full text-charcoal-300 font-medium border border-white/10 hover:border-gold-500/30 transition-all text-sm"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
