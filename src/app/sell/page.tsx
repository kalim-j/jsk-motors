"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Upload,
  X,
  Camera,
  CheckCircle,
  Info,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { INDIAN_STATES, CAR_BRANDS } from "@/lib/utils";
import toast from "react-hot-toast";
import Image from "next/image";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const isValidURL = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const sellSchema = z.object({
  carBrand: z.string().min(1, "Brand required"),
  carModel: z.string().min(1, "Model required"),
  carYear: z.coerce.number().min(1990).max(new Date().getFullYear()),
  expectedPrice: z.coerce.number().min(10000, "Min ₹10,000"),
  damageDescription: z.string().min(20, "Please describe the damage (min 20 chars)"),
  damageLevel: z.enum(["Minor", "Moderate", "Severe", "Total Loss"]),
  city: z.string().min(2),
  state: z.string().min(2),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Valid Indian mobile number required"),
});

type SellFormData = z.infer<typeof sellSchema>;

export default function SellPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageLinks, setImageLinks] = useState<string[]>([""]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SellFormData>({
    resolver: zodResolver(sellSchema),
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 6) {
      toast.error("Maximum 6 images allowed");
      return;
    }
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setImages((prev) => [...prev, ...files]);
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: SellFormData) => {
    if (!user) {
      toast.error("Please login to submit your car");
      router.push("/auth/login");
      return;
    }

    if (images.length === 0) {
      toast.error("Please upload at least 1 photo");
      return;
    }

    setSubmitting(true);
    try {
      console.log("Form submit triggered. Submitting started...");

      const uploadImages = async (imageFiles: File[]) => {
        const urls: string[] = [];
        for (const image of imageFiles) {
          try {
            console.log("Uploading image:", image.name);
            const imageRef = ref(storage, `cars/${Date.now()}-${image.name}`);
            const snapshot = await uploadBytes(imageRef, image);
            const url = await getDownloadURL(snapshot.ref);
            urls.push(url);
            console.log("Image uploaded successfully:", url);
          } catch (error) {
            console.error("Image upload failed:", error);
          }
        }
        return urls;
      };

      let uploadedUrls: string[] = [];

      // Upload images safely
      if (images.length > 0) {
        uploadedUrls = await uploadImages(images);
      }

      // Handle links
      const validLinks = imageLinks.filter(
        (link) => link.trim() !== "" && isValidURL(link)
      );

      const finalImages = [...uploadedUrls, ...validLinks];

      console.log("Saving to Firestore...", { finalImages });

      if (finalImages.length === 0) {
        toast.error("Please provide at least 1 image file or valid link");
        setSubmitting(false);
        return;
      }

      await addDoc(collection(db, "car_submissions"), {
        userId: user.uid,
        userEmail: user.email || "",
        userName: user.displayName || user.email || "User",
        carBrand: data.carBrand,
        carModel: data.carModel,
        carYear: data.carYear,
        expectedPrice: data.expectedPrice,
        damageDescription: data.damageDescription,
        damageLevel: data.damageLevel,
        city: data.city,
        state: data.state,
        phone: data.phone,
        images: finalImages,
        status: "pending",
        createdAt: new Date()
      });

      console.log("Saved successfully");

      setSuccess(true);
      reset();
      setImages([]);
      setImagePreviews([]);
      setImageLinks([""]);
      toast.success("Car submitted successfully ✅");
    } catch (error) {
      console.error("🔥 FULL ERROR:", error);
      toast.error("Submission failed ❌ Check console");
    } finally {
      setSubmitting(false); // 🔥 MUST RUN
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-dark rounded-3xl p-10 text-center max-w-md border border-gold-500/20 shadow-2xl"
        >
          <div className="w-20 h-20 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-400" />
          </div>
          <h2 className="font-display text-3xl font-bold text-white mb-4">
            Submitted!
          </h2>
          <p className="text-charcoal-300 mb-8 leading-relaxed">
            Your car details have been submitted successfully. Our team will review
            and contact you within 24 hours with an offer.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => setSuccess(false)}
              className="flex-1 btn-outline-gold py-3 rounded-full text-sm font-semibold"
            >
              Submit Another
            </button>
            <Link href="/" className="flex-1 btn-gold py-3 rounded-full text-sm font-semibold text-center">
              Go Home
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-20">
      {/* Header */}
      <div className="bg-charcoal-950 border-b border-white/5 py-16">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold-500/30 text-gold-400 text-sm font-medium mb-6">
              Sell Your Car
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">
              Get the Best Price for{" "}
              <span className="gold-text">Your Car</span>
            </h1>
            <p className="text-charcoal-400 max-w-xl mx-auto">
              Even accident-damaged? We buy all conditions. Fill the form and
              get a competitive offer within 24 hours.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container-custom py-12">
        {!user && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 glass-gold rounded-2xl p-5 border border-gold-500/30 flex items-start gap-3"
          >
            <Info size={20} className="text-gold-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-semibold text-sm mb-1">
                Login required to submit
              </p>
              <p className="text-charcoal-300 text-xs">
                You can browse the form, but you need to{" "}
                <Link href="/auth/login" className="text-gold-400 underline">
                  login
                </Link>{" "}
                or{" "}
                <Link href="/auth/register" className="text-gold-400 underline">
                  register
                </Link>{" "}
                to submit your car.
              </p>
            </div>
          </motion.div>
        )}

        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Car Basic Info */}
            <div className="glass-dark rounded-2xl p-8 border border-white/5">
              <h2 className="text-white font-bold text-xl mb-6 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-gold-500 text-black text-sm font-black flex items-center justify-center">
                  1
                </span>
                Car Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-charcoal-300 text-sm font-medium block mb-2">
                    Car Brand *
                  </label>
                  <select
                    {...register("carBrand")}
                    className="input-dark w-full px-4 py-3 rounded-xl text-sm"
                  >
                    <option value="">Select Brand</option>
                    {CAR_BRANDS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  {errors.carBrand && (
                    <p className="text-red-400 text-xs mt-1">{errors.carBrand.message}</p>
                  )}
                </div>

                <div>
                  <label className="text-charcoal-300 text-sm font-medium block mb-2">
                    Car Model *
                  </label>
                  <input
                    {...register("carModel")}
                    placeholder="e.g., Creta, Swift, Nexon"
                    className="input-dark w-full px-4 py-3 rounded-xl text-sm"
                  />
                  {errors.carModel && (
                    <p className="text-red-400 text-xs mt-1">{errors.carModel.message}</p>
                  )}
                </div>

                <div>
                  <label className="text-charcoal-300 text-sm font-medium block mb-2">
                    Year of Manufacture *
                  </label>
                  <input
                    type="number"
                    {...register("carYear")}
                    placeholder="e.g., 2019"
                    min={1990}
                    max={new Date().getFullYear()}
                    className="input-dark w-full px-4 py-3 rounded-xl text-sm"
                  />
                  {errors.carYear && (
                    <p className="text-red-400 text-xs mt-1">{errors.carYear.message}</p>
                  )}
                </div>

                <div>
                  <label className="text-charcoal-300 text-sm font-medium block mb-2">
                    Expected Price (₹) *
                  </label>
                  <input
                    type="number"
                    {...register("expectedPrice")}
                    placeholder="e.g., 350000"
                    className="input-dark w-full px-4 py-3 rounded-xl text-sm"
                  />
                  {errors.expectedPrice && (
                    <p className="text-red-400 text-xs mt-1">{errors.expectedPrice.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Damage Info */}
            <div className="glass-dark rounded-2xl p-8 border border-white/5">
              <h2 className="text-white font-bold text-xl mb-6 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-gold-500 text-black text-sm font-black flex items-center justify-center">
                  2
                </span>
                Damage Details
              </h2>
              <div className="space-y-5">
                <div>
                  <label className="text-charcoal-300 text-sm font-medium block mb-3">
                    Damage Level *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {["Minor", "Moderate", "Severe", "Total Loss"].map((level) => (
                      <label key={level} className="cursor-pointer">
                        <input
                          type="radio"
                          {...register("damageLevel")}
                          value={level}
                          className="sr-only"
                        />
                        <div className="px-3 py-2 text-center text-sm rounded-xl border border-white/10 hover:border-gold-500/30 transition-all has-[:checked]:border-gold-500 has-[:checked]:bg-gold-500/10 has-[:checked]:text-gold-400">
                          {level}
                        </div>
                      </label>
                    ))}
                  </div>
                  {errors.damageLevel && (
                    <p className="text-red-400 text-xs mt-1">{errors.damageLevel.message}</p>
                  )}
                </div>

                <div>
                  <label className="text-charcoal-300 text-sm font-medium block mb-2">
                    Damage Description *
                  </label>
                  <textarea
                    {...register("damageDescription")}
                    rows={4}
                    placeholder="Describe the damage in detail. Include affected areas, type of damage, accident history, etc."
                    className="input-dark w-full px-4 py-3 rounded-xl text-sm resize-none"
                  />
                  {errors.damageDescription && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.damageDescription.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Car Photos & Links */}
            <div className="glass-dark rounded-2xl p-8 border border-white/5">
              <h2 className="text-white font-bold text-xl mb-6 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-gold-500 text-black text-sm font-black flex items-center justify-center">
                  3
                </span>
                Car Photos
              </h2>

              <div className="mb-6 space-y-4">
                <label className="text-charcoal-300 text-sm font-medium block">
                  Image Links (Optional)
                </label>
                {imageLinks.map((link, index) => (
                  <input
                    key={index}
                    type="text"
                    placeholder="Paste image URL (e.g., Google Drive sharing link, or raw image link)"
                    value={link}
                    onChange={(e) => {
                      const newLinks = [...imageLinks];
                      newLinks[index] = e.target.value;
                      setImageLinks(newLinks);
                    }}
                    className="input-dark w-full px-4 py-3 rounded-xl text-sm"
                  />
                ))}
                
                {imageLinks.length < 5 && (
                  <button
                    type="button"
                    onClick={() => setImageLinks([...imageLinks, ""])}
                    className="text-gold-400 text-sm hover:text-gold-300 transition-colors"
                  >
                    + Add Another Link
                  </button>
                )}
              </div>

              <label className="text-charcoal-300 text-xs text-center block mt-4">
                * Please provide at least one valid image address to submit your car.
              </label>
            </div>

            {/* Contact Info */}
            <div className="glass-dark rounded-2xl p-8 border border-white/5">
              <h2 className="text-white font-bold text-xl mb-6 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-gold-500 text-black text-sm font-black flex items-center justify-center">
                  4
                </span>
                Location & Contact
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="text-charcoal-300 text-sm font-medium block mb-2">
                    City *
                  </label>
                  <input
                    {...register("city")}
                    placeholder="Your city"
                    className="input-dark w-full px-4 py-3 rounded-xl text-sm"
                  />
                  {errors.city && (
                    <p className="text-red-400 text-xs mt-1">{errors.city.message}</p>
                  )}
                </div>

                <div>
                  <label className="text-charcoal-300 text-sm font-medium block mb-2">
                    State *
                  </label>
                  <select
                    {...register("state")}
                    className="input-dark w-full px-4 py-3 rounded-xl text-sm"
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {errors.state && (
                    <p className="text-red-400 text-xs mt-1">{errors.state.message}</p>
                  )}
                </div>

                <div>
                  <label className="text-charcoal-300 text-sm font-medium block mb-2">
                    Phone Number *
                  </label>
                  <input
                    {...register("phone")}
                    placeholder="10-digit mobile"
                    className="input-dark w-full px-4 py-3 rounded-xl text-sm"
                  />
                  {errors.phone && (
                    <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="text-center">
              {!user ? (
                <Link
                  href="/auth/login"
                  className="btn-gold px-12 py-4 rounded-full font-bold text-base inline-block"
                >
                  Login to Submit
                </Link>
              ) : (
                <motion.button
                  type="submit"
                  disabled={submitting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-gold-500 px-12 py-4 rounded-full font-bold text-black border border-gold-400 hover:bg-gold-400 transition-colors disabled:opacity-70 flex items-center gap-3 mx-auto"
                >
                  {submitting ? "Submitting..." : "Submit"}
                </motion.button>
              )}
              <p className="text-charcoal-500 text-xs mt-4">
                Our team will review and contact you within 24 hours
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
