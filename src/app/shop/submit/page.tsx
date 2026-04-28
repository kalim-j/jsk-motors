"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";
import Link from "next/link";
import { ArrowLeft, Upload, Package } from "lucide-react";

export default function SubmitProductPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    name: "", category: "spare", brand: "",
    price: "", quantity: "", condition: "New", description: ""
  });

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData }
    );
    const data = await res.json();
    return data.secure_url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Please login first"); return; }
    setLoading(true);
    try {
      let imageUrl = "";
      if (imageFile) imageUrl = await uploadToCloudinary(imageFile);
      await addDoc(collection(db, "product_submissions"), {
        ...form,
        price: Number(form.price),
        quantity: Number(form.quantity),
        images: imageUrl ? [imageUrl] : [],
        status: "pending",
        submittedBy: user.uid,
        submittedByEmail: user.email,
        submittedByName: user.displayName || "User",
        createdAt: serverTimestamp()
      });
      toast.success("Product submitted! Admin will review it shortly.");
      router.push("/shop");
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/shop" className="flex items-center gap-2 text-gray-400 hover:text-gold-500 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Marketplace
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <Package className="w-8 h-8 text-gold-500" />
          <h1 className="text-3xl font-bold text-white">Suggest a Product</h1>
        </div>
        <p className="text-gray-400 mb-8">Submit a spare part or accessory for listing in our marketplace</p>
        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl p-8 space-y-6 border border-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Product Name *</label>
              <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-yellow-500 focus:outline-none"
                placeholder="e.g. Brake Pad Set" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Category *</label>
              <select required value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-yellow-500 focus:outline-none">
                <option value="spare">Spare Part</option>
                <option value="accessory">Accessory</option>
                <option value="oil">Oil & Fluids</option>
                <option value="tyre">Tyre</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Brand *</label>
              <input required value={form.brand} onChange={e => setForm({...form, brand: e.target.value})}
                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-yellow-500 focus:outline-none"
                placeholder="e.g. Bosch" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Price (₹) *</label>
              <input required type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})}
                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-yellow-500 focus:outline-none"
                placeholder="e.g. 1299" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Stock Quantity *</label>
              <input required type="number" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})}
                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-yellow-500 focus:outline-none"
                placeholder="e.g. 10" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Condition</label>
              <select value={form.condition} onChange={e => setForm({...form, condition: e.target.value})}
                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-yellow-500 focus:outline-none">
                <option value="New">New</option>
                <option value="Used">Used</option>
                <option value="Refurbished">Refurbished</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Description *</label>
            <textarea required value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              rows={4} className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-yellow-500 focus:outline-none resize-none"
              placeholder="Describe the product, compatibility, condition..." />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Product Image</label>
            <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-yellow-500 transition-colors">
              <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
              <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)}
                className="hidden" id="image-upload" />
              <label htmlFor="image-upload" className="cursor-pointer text-yellow-500 hover:text-yellow-400">
                {imageFile ? imageFile.name : "Click to upload image"}
              </label>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-bold py-4 rounded-xl transition-colors text-lg">
            {loading ? "Submitting..." : "Submit for Review"}
          </button>
        </form>
      </div>
    </div>
  );
}
