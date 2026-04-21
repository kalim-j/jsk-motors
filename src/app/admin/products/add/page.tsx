"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Upload,
  X,
  Package,
  Loader2,
  Tag,
  DollarSign,
  BarChart2,
  AlignLeft,
  Image as ImageIcon,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { uploadToCloudinary } from "@/lib/cloudinary";
import toast from "react-hot-toast";

const CATEGORIES = [
  { value: "spare", label: "Spare Part" },
  { value: "accessory", label: "Accessory" },
  { value: "oil", label: "Oil & Fluids" },
  { value: "tyre", label: "Tyre" },
];

const CONDITIONS = [
  { value: "new", label: "New" },
  { value: "used", label: "Used" },
  { value: "refurbished", label: "Refurbished" },
];

const BRANDS = [
  "Bosch",
  "Denso",
  "NGK",
  "MRF",
  "CEAT",
  "Apollo",
  "JK Tyre",
  "Castrol",
  "Mobil",
  "Shell",
  "Gulf",
  "Exide",
  "Amaron",
  "Maruti Genuine",
  "Hyundai Genuine",
  "Tata Genuine",
  "Mahindra Genuine",
  "Minda",
  "Valeo",
  "FAG",
  "SKF",
  "Moog",
  "Gabriel",
  "Monroe",
  "Others",
];

interface ImagePreview {
  file: File;
  preview: string;
  uploading: boolean;
  progress: number;
  url?: string;
}

export default function AddProductPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    category: "spare",
    brand: "",
    price: "",
    quantity: "",
    description: "",
    condition: "new",
  });
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  if (!authLoading && !isAdmin) {
    router.push("/");
    return null;
  }

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const newImages: ImagePreview[] = Array.from(files)
      .slice(0, 6 - images.length)
      .map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        uploading: false,
        progress: 0,
      }));
    setImages((prev) => [...prev, ...newImages]);
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const uploadAllToCloudinary = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (img.url) { urls.push(img.url); continue; }
      setImages((prev) =>
        prev.map((im, idx) => (idx === i ? { ...im, uploading: true } : im))
      );
      try {
        const url = await uploadToCloudinary(img.file);
        setImages((prev) =>
          prev.map((im, idx) =>
            idx === i ? { ...im, uploading: false, progress: 100, url } : im
          )
        );
        urls.push(url);
      } catch (err) {
        console.error(`Image ${i + 1} upload failed:`, err);
        throw err;
      }
    }
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) { toast.error("Product name is required"); return; }
    if (!formData.price) { toast.error("Price is required"); return; }
    if (!formData.quantity) { toast.error("Stock quantity is required"); return; }
    if (!formData.brand) { toast.error("Brand is required"); return; }
    if (images.length === 0) { toast.error("Please upload at least one image"); return; }

    setSaving(true);
    const toastId = toast.loading("Uploading to Cloudinary & saving...");
    try {
      const imageUrls = await uploadAllToCloudinary();

      await addDoc(collection(db, "products"), {
        name: formData.name.trim(),
        category: formData.category,
        brand: formData.brand.trim(),
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        stock: parseInt(formData.quantity),
        description: formData.description.trim(),
        condition: formData.condition,
        images: imageUrls,
        image: imageUrls[0] || "",
        status: "approved",
        addedBy: "admin",
        addedByEmail: user?.email || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success("Product published to marketplace!", { id: toastId });
      setDone(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to publish product. Please try again.", { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setDone(false);
    setFormData({ name: "", category: "spare", brand: "", price: "", quantity: "", description: "", condition: "new" });
    setImages([]);
  };

  // ── Success Screen ────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-24 h-24 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={48} className="text-green-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Product Published!
          </h2>
          <p className="text-gray-400 mb-8">
            The product is now live in the marketplace.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={resetForm}
              className="px-6 py-3 bg-[#111] border border-white/10 text-white rounded-xl hover:border-[#D4AF37]/30 transition-all text-sm"
            >
              Add Another
            </button>
            <Link
              href="/admin/products"
              className="px-6 py-3 bg-[#D4AF37] text-black font-bold rounded-xl hover:bg-yellow-500 transition-all text-sm"
            >
              View Inventory
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#050505] pt-24 pb-16 px-4 md:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <Link
            href="/admin/products"
            className="p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">
              Add <span className="text-[#D4AF37]">Product</span>
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Images upload to Cloudinary · Data saved to Firestore
            </p>
          </div>
        </div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* ── Image Upload ─────────────────────────────────────────── */}
          <div className="bg-[#0c0c0c] border border-white/8 rounded-2xl p-6">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-4">
              <ImageIcon size={16} className="text-[#D4AF37]" />
              Product Images
              <span className="text-gray-600 font-normal ml-1">(up to 6, first = main)</span>
            </label>

            {/* Drop zone */}
            <div
              onClick={() => !saving && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all group ${
                saving
                  ? "border-white/5 cursor-not-allowed"
                  : "border-white/10 hover:border-[#D4AF37]/40 hover:bg-white/[0.02]"
              }`}
            >
              <Upload
                size={32}
                className="mx-auto text-gray-600 group-hover:text-[#D4AF37] transition-colors mb-3"
              />
              <p className="text-gray-400 text-sm">Click to select images</p>
              <p className="text-gray-600 text-xs mt-1">
                JPG, PNG, WebP — uploads to Cloudinary
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
              />
            </div>

            {/* Previews */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mt-4">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square rounded-xl overflow-hidden border border-white/10"
                  >
                    <Image src={img.preview} alt="" fill className="object-cover" />

                    {/* Uploading spinner */}
                    {img.uploading && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 size={18} className="text-[#D4AF37] animate-spin" />
                      </div>
                    )}

                    {/* Done tick */}
                    {img.progress === 100 && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle size={11} className="text-white" />
                      </div>
                    )}

                    {/* Remove */}
                    {!saving && (
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 left-1 w-5 h-5 bg-black/70 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors"
                      >
                        <X size={10} className="text-white" />
                      </button>
                    )}

                    {/* Main badge */}
                    {idx === 0 && (
                      <div className="absolute bottom-0 inset-x-0 text-center py-0.5 bg-[#D4AF37]">
                        <span className="text-[8px] text-black font-black uppercase tracking-wider">
                          MAIN
                        </span>
                      </div>
                    )}
                  </div>
                ))}
                {images.length < 6 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-white/10 hover:border-[#D4AF37]/40 transition-all flex items-center justify-center text-gray-600 hover:text-[#D4AF37]"
                  >
                    <Upload size={18} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── Product Details ──────────────────────────────────────── */}
          <div className="bg-[#0c0c0c] border border-white/8 rounded-2xl p-6 space-y-5">
            <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <Package size={16} className="text-[#D4AF37]" />
              Product Details
            </h2>

            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">
                Product Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Bosch Spark Plug Set — Maruti Swift"
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] outline-none placeholder-gray-600 transition-colors"
                required
              />
            </div>

            {/* Category + Brand */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">
                  <Tag size={11} className="inline mr-1" />
                  Category <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">
                  Brand <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] outline-none"
                  required
                >
                  <option value="">Select Brand</option>
                  {BRANDS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Price + Stock + Condition */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">
                  <DollarSign size={11} className="inline mr-1" />
                  Price (₹) <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0"
                    className="w-full bg-black border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white text-sm focus:border-[#D4AF37] outline-none placeholder-gray-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">
                  <BarChart2 size={11} className="inline mr-1" />
                  Stock Qty <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="0"
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] outline-none placeholder-gray-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">
                  <Sparkles size={11} className="inline mr-1" />
                  Condition
                </label>
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] outline-none"
                >
                  {CONDITIONS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">
                <AlignLeft size={11} className="inline mr-1" />
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                placeholder="Compatibility, features, specifications..."
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] outline-none placeholder-gray-600 resize-none"
              />
            </div>
          </div>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={saving}
            whileHover={{ scale: saving ? 1 : 1.01 }}
            whileTap={{ scale: saving ? 1 : 0.99 }}
            className="w-full py-4 bg-[#D4AF37] text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-yellow-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed text-base"
          >
            {saving ? (
              <><Loader2 size={20} className="animate-spin" /> Publishing...</>
            ) : (
              <><Package size={20} /> Publish Product to Marketplace</>
            )}
          </motion.button>
        </motion.form>
      </div>
    </div>
  );
}
