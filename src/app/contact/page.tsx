"use client";

import { motion } from "framer-motion";
import {
  Phone,
  MapPin,
  Clock,
  MessageCircle,
  Send,
  Mail,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import CustomSelect from "@/components/ui/CustomSelect";

const MAPS_EMBED =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3893.0!2d78.279!3d12.518!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTLCsDMxJzA0LjgiTiA3OMKwMTYnNDQuNCJF!5e0!3m2!1sen!2sin!4v1681234567890!5m2!1sen!2sin";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    service: "General Inquiry",
    preferredDate: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error("Name and phone are required");
      return;
    }
    setSubmitting(true);
    // Simulate form submission
    await new Promise((r) => setTimeout(r, 1200));
    setSubmitting(false);
    toast.success("Appointment request sent! We'll call you shortly.");
    setFormData({
      name: "",
      phone: "",
      email: "",
      service: "General Inquiry",
      preferredDate: "",
      message: "",
    });
  };

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
              Get In Touch
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">
              Contact <span className="gold-text">JSK CAR BODY SHOP</span>
            </h1>
            <p className="text-charcoal-400 max-w-xl mx-auto">
              Visit us or call for a free estimate. We&apos;re here Monday to Saturday,
              9 AM – 7 PM.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container-custom py-16">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left: Contact Info */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <motion.a
                href="tel:7010587940"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                whileHover={{ scale: 1.03 }}
                className="glass-dark rounded-2xl p-5 border border-white/5 hover:border-gold-500/30 transition-all duration-300 group"
              >
                <div className="w-10 h-10 rounded-xl bg-gold-500/15 flex items-center justify-center mb-3 group-hover:bg-gold-500/25 transition-colors">
                  <Phone size={18} className="text-gold-500" />
                </div>
                <div className="text-white font-semibold text-sm mb-1">Call Now</div>
                <div className="text-gold-400 text-xs">7010587940</div>
              </motion.a>

              <motion.a
                href="https://wa.me/917010587940?text=Hello JSK CAR BODY SHOP!"
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                whileHover={{ scale: 1.03 }}
                className="glass-dark rounded-2xl p-5 border border-green-500/20 hover:border-green-500/40 transition-all duration-300 group"
              >
                <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center mb-3 group-hover:bg-green-500/25 transition-colors">
                  <MessageCircle size={18} className="text-green-400" />
                </div>
                <div className="text-white font-semibold text-sm mb-1">WhatsApp</div>
                <div className="text-green-400 text-xs">Chat instantly</div>
              </motion.a>

              <motion.a
                href="tel:9092704777"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.03 }}
                className="glass-dark rounded-2xl p-5 border border-white/5 hover:border-gold-500/30 transition-all duration-300 group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center mb-3 group-hover:bg-blue-500/25 transition-colors">
                  <Phone size={18} className="text-blue-400" />
                </div>
                <div className="text-white font-semibold text-sm mb-1">Support</div>
                <div className="text-blue-400 text-xs">9092704777</div>
              </motion.a>

              <motion.a
                href="mailto:jskjageer@gmail.com"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                whileHover={{ scale: 1.03 }}
                className="glass-dark rounded-2xl p-5 border border-white/5 hover:border-gold-500/30 transition-all duration-300 group"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center mb-3 group-hover:bg-purple-500/25 transition-colors">
                  <Mail size={18} className="text-purple-400" />
                </div>
                <div className="text-white font-semibold text-sm mb-1">Email Us</div>
                <div className="text-purple-400 text-xs truncate">jskjageer@gmail.com</div>
              </motion.a>
            </div>

            {/* Info Cards */}
            <div className="glass-dark rounded-2xl p-6 border border-white/5 space-y-5">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center flex-shrink-0">
                  <MapPin size={18} className="text-gold-500" />
                </div>
                <div>
                  <div className="text-white font-semibold text-sm mb-1">Our Location</div>
                  <p className="text-charcoal-400 text-sm leading-relaxed">
                    A-7, Athiyaman Auto Nagar,<br />
                    Krishnagiri Main Road, Gundalapatti,<br />
                    Tamil Nadu 636701
                  </p>
                  <a
                    href="https://maps.app.goo.gl/wwEvkkBtf745wfbt8"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gold-400 text-xs hover:text-gold-300 transition-colors mt-2 inline-block"
                  >
                    → Open in Google Maps
                  </a>
                </div>
              </div>

              <div className="gold-divider" />

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center flex-shrink-0">
                  <Clock size={18} className="text-gold-500" />
                </div>
                <div>
                  <div className="text-white font-semibold text-sm mb-2">Business Hours</div>
                  <div className="space-y-1">
                    {[
                      { day: "Monday – Friday", time: "9:00 AM – 7:00 PM" },
                      { day: "Saturday", time: "9:00 AM – 6:00 PM" },
                      { day: "Sunday", time: "10:00 AM – 3:00 PM" },
                    ].map(({ day, time }) => (
                      <div key={day} className="flex justify-between text-sm">
                        <span className="text-charcoal-400">{day}</span>
                        <span className="text-white font-medium">{time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Map Embed */}
            <div className="rounded-2xl overflow-hidden border border-white/10" style={{ height: 280 }}>
              <iframe
                src={MAPS_EMBED}
                width="100%"
                height="100%"
                style={{ border: 0, filter: "invert(90%) hue-rotate(180deg)" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="JSK CAR BODY SHOP Location"
              />
            </div>
          </div>

          {/* Right: Appointment Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-dark rounded-3xl p-8 border border-gold-500/15"
          >
            <h2 className="font-display text-2xl font-bold text-white mb-2">
              Book an Appointment
            </h2>
            <p className="text-charcoal-400 text-sm mb-8">
              Fill this form and we&apos;ll confirm your slot within a few hours.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-charcoal-300 text-xs font-medium block mb-2">
                    Your Name *
                  </label>
                  <input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Full name"
                    className="input-dark w-full px-4 py-3 rounded-xl text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-charcoal-300 text-xs font-medium block mb-2">
                    Phone Number *
                  </label>
                  <input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Mobile number"
                    className="input-dark w-full px-4 py-3 rounded-xl text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-charcoal-300 text-xs font-medium block mb-2">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your@email.com"
                  className="input-dark w-full px-4 py-3 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-charcoal-300 text-xs font-medium block mb-2">
                    Service Required
                  </label>
                  <CustomSelect
                    value={formData.service}
                    onChange={(v) => setFormData({ ...formData, service: v })}
                    options={[
                      { value: "General Inquiry", label: "General Inquiry" },
                      { value: "Car Restoration", label: "Car Restoration" },
                      { value: "Body Painting", label: "Body Painting" },
                      { value: "Dent Removal", label: "Dent Removal" },
                      { value: "Buy a Car", label: "Buy a Car" },
                      { value: "Sell My Car", label: "Sell My Car" },
                      { value: "Mechanical Repair", label: "Mechanical Repair" },
                    ]}
                  />
                </div>
                <div>
                  <label className="text-charcoal-300 text-xs font-medium block mb-2">
                    Preferred Date
                  </label>
                  <input
                    type="date"
                    value={formData.preferredDate}
                    onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                    min={new Date().toISOString().split("T")[0]}
                    className="input-dark w-full px-4 py-3 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-charcoal-300 text-xs font-medium block mb-2">
                  Message / Details
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  placeholder="Describe your car, the issue, or what you need help with..."
                  className="input-dark w-full px-4 py-3 rounded-xl text-sm resize-none"
                />
              </div>

              <motion.button
                type="submit"
                disabled={submitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-gold w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={18} />
                    Send Request
                  </>
                )}
              </motion.button>

              <p className="text-charcoal-500 text-xs text-center">
                Or call directly:{" "}
                <a href="tel:7010587940" className="text-gold-400 hover:text-gold-300">
                  7010587940
                </a>{" "}
                /{" "}
                <a href="tel:9092704777" className="text-gold-400 hover:text-gold-300">
                  9092704777
                </a>
              </p>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
