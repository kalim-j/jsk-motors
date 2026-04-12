"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Youtube,
  ArrowRight,
} from "lucide-react";

const footerLinks = {
  Services: [
    { label: "Car Restoration", href: "/services#restoration" },
    { label: "Body Painting", href: "/services#painting" },
    { label: "Dent Removal", href: "/services#dent" },
    { label: "Full Mechanical", href: "/services#mechanical" },
  ],
  "Quick Links": [
    { label: "Buy Cars", href: "/buy" },
    { label: "Sell Your Car", href: "/sell" },
    { label: "About Us", href: "/#about" },
    { label: "Contact", href: "/contact" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-charcoal-950 border-t border-gold-500/20 relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(212,175,55,0.05),transparent_70%)] pointer-events-none" />

      <div className="container-custom relative z-10">
        {/* Top CTA */}
        <div className="py-16 border-b border-white/5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h3 className="font-display text-3xl text-white font-bold mb-2">
                Ready to Transform Your Car?
              </h3>
              <p className="text-charcoal-400">
                Expert restoration at unbeatable prices across India
              </p>
            </div>
            <div className="flex gap-4">
              <Link href="/sell" className="btn-gold px-6 py-3 rounded-full font-semibold flex items-center gap-2">
                Sell Your Car <ArrowRight size={16} />
              </Link>
              <Link href="/contact" className="btn-outline-gold px-6 py-3 rounded-full font-semibold">
                Contact Us
              </Link>
            </div>
          </div>
        </div>

        {/* Main Footer Grid */}
        <div className="py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gold-gradient shadow-gold">
                <span className="text-black font-display font-black text-xl">JSK</span>
              </div>
              <div>
                <div className="text-white font-display font-bold text-lg">JSK Motors</div>
                <div className="text-gold-500 text-xs tracking-widest uppercase">
                  Est. Since 2010
                </div>
              </div>
            </div>
            <p className="text-charcoal-400 text-sm leading-relaxed mb-6">
              JSK CAR BODY SHOP — India&apos;s trusted partner for accident car
              restoration, professional painting, and premium resale services.
            </p>
            {/* Social */}
            <div className="flex gap-3">
              {[
                { Icon: Facebook, href: "#", label: "Facebook" },
                { Icon: Instagram, href: "#", label: "Instagram" },
                { Icon: Youtube, href: "#", label: "YouTube" },
              ].map(({ Icon, href, label }) => (
                <motion.a
                  key={label}
                  href={href}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={label}
                  className="w-10 h-10 glass rounded-full flex items-center justify-center text-charcoal-400 hover:text-gold-500 hover:border-gold-500/40 transition-all duration-300"
                >
                  <Icon size={16} />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-white font-semibold text-sm uppercase tracking-widest mb-6">
                {title}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-charcoal-400 text-sm hover:text-gold-500 transition-colors flex items-center gap-2 group"
                    >
                      <span className="w-4 h-px bg-charcoal-700 group-hover:bg-gold-500 group-hover:w-6 transition-all duration-300" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-widest mb-6">
              Contact
            </h4>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <MapPin size={16} className="text-gold-500 flex-shrink-0 mt-1" />
                <p className="text-charcoal-400 text-sm">
                  A-7, Athiyaman Auto Nagar, Krishnagiri Main Road, Gundalapatti,
                  Tamil Nadu 636701
                </p>
              </li>
              <li>
                <a
                  href="tel:7010587940"
                  className="flex gap-3 text-charcoal-400 text-sm hover:text-gold-500 transition-colors"
                >
                  <Phone size={16} className="text-gold-500 flex-shrink-0" />
                  7010587940
                </a>
              </li>
              <li>
                <a
                  href="tel:9092704777"
                  className="flex gap-3 text-charcoal-400 text-sm hover:text-gold-500 transition-colors"
                >
                  <Phone size={16} className="text-gold-500 flex-shrink-0" />
                  9092704777
                </a>
              </li>
              <li>
                <a
                  href="mailto:jskjageer@gmail.com"
                  className="flex gap-3 text-charcoal-400 text-sm hover:text-gold-500 transition-colors"
                >
                  <Mail size={16} className="text-gold-500 flex-shrink-0" />
                  jskjageer@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="py-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-charcoal-500 text-xs">
            © {new Date().getFullYear()} JSK Motors. All rights reserved. Made in India 🇮🇳
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-charcoal-500 text-xs hover:text-gold-500 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-charcoal-500 text-xs hover:text-gold-500 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
