"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, LogOut, User, Settings, TrendingUp, ShoppingCart } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import toast from "react-hot-toast";

// Using a new variable name to forcefully break the stale Next.js SSR cache memory reference
const NAVIGATION_LINKS = [
  { href: "/", label: "Home" },
  { href: "/buy", label: "Buy Cars" },
  { href: "/sell", label: "Sell Your Car" },
  { href: "/shop", label: "Marketplace" },
  { href: "/services", label: "Services" },
  { href: "/dealers", label: "Dealer Network" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, isAdmin, logout, loading } = useAuth();
  const { cartItems } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
    } catch {
      toast.error("Failed to log out");
    }
  };

  return (
    <motion.header
      initial={false}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-black/90 backdrop-blur-xl border-b border-gold-500/20 shadow-lg shadow-black/50"
          : "bg-transparent"
      }`}
    >
      <div className="container-custom">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gold-gradient shadow-gold">
                <span className="text-black font-display font-black text-xl tracking-tight">
                  JSK
                </span>
              </div>
              <div className="absolute -inset-1 bg-gold-gradient rounded-lg opacity-0 group-hover:opacity-30 blur transition-opacity duration-300" />
            </div>
            <div className="hidden sm:block">
              <div className="text-white font-display font-bold text-lg leading-tight">
                JSK CAR BODY SHOP
              </div>
              <div className="text-gold-500 text-xs tracking-widest uppercase font-medium">
                Car Restoration & Resale
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {NAVIGATION_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link ${pathname === link.href ? "active" : ""}`}
              >
                {link.label}
              </Link>
            ))}
            {mounted && isAdmin && (
              <Link
                href="/admin"
                className={`nav-link text-gold-500 ${
                  pathname.startsWith("/admin") ? "active" : ""
                }`}
              >
                Admin Panel
              </Link>
            )}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Cart Icon */}
            {mounted && (
              <Link
                href="/cart"
                className="relative p-2 text-charcoal-400 hover:text-gold-500 transition-colors"
                aria-label="Cart"
              >
                <ShoppingCart size={20} />
                {cartItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gold-500 text-black text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full leading-none">
                    {cartItems.reduce((a, i) => a + i.quantity, 0)}
                  </span>
                )}
              </Link>
            )}
            {!mounted || loading ? (
              <div className="w-24 h-9 skeleton rounded-full" />
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 glass-gold px-4 py-2 rounded-full hover:shadow-gold transition-all duration-300"
                >
                  <div className="w-8 h-8 rounded-full bg-gold-gradient flex items-center justify-center text-black font-bold text-sm">
                    {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                  </div>
                  <span className="text-white text-sm font-medium max-w-[120px] truncate">
                    {user.displayName || user.email}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`text-gold-500 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 mt-2 w-52 glass-dark rounded-xl overflow-hidden shadow-xl border border-gold-500/20"
                      onBlur={() => setUserMenuOpen(false)}
                    >
                      <div className="p-3 border-b border-white/10">
                        <p className="text-xs text-charcoal-400">Signed in as</p>
                        <p className="text-sm text-white font-medium truncate">
                          {user.email}
                        </p>
                        {isAdmin && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-gold-500/20 text-gold-400 text-xs rounded-full border border-gold-500/30">
                            Admin
                          </span>
                        )}
                      </div>
                      <div className="p-1">
                        <Link
                          href="/dashboard"
                          className="flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-white/5 rounded-lg transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <User size={14} className="text-charcoal-400" />
                          User Dashboard
                        </Link>
                        <button
                          onClick={() => {
                            handleLogout();
                            setUserMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <LogOut size={14} />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/auth/login"
                  className="btn-outline-gold px-5 py-2 rounded-full text-sm font-semibold"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="btn-gold px-5 py-2 rounded-full text-sm font-semibold"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 text-white hover:text-gold-500 transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto", transition: { duration: 0.3, ease: "easeInOut" } }}
            exit={{ opacity: 0, height: 0, transition: { duration: 0.2, ease: "easeInOut" } }}
            className="lg:hidden bg-black/95 backdrop-blur-xl border-t border-gold-500/20 overflow-hidden"
          >
            <div className="container-custom py-6 space-y-1">
              {NAVIGATION_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`block py-3 px-4 text-base font-medium rounded-lg transition-all duration-200 ${
                    pathname === link.href
                      ? "text-gold-500 bg-gold-500/10"
                      : "text-white/80 hover:text-gold-500 hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {mounted && isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className="block py-3 px-4 text-base font-medium text-gold-400 hover:text-gold-300 rounded-lg hover:bg-gold-500/10 transition-colors"
                >
                  ⚙ Admin Panel
                </Link>
              )}
              <div className="pt-4 border-t border-white/10 mt-4">
                {!mounted || loading ? (
                  <div className="w-full h-11 skeleton rounded-full" />
                ) : user ? (
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="w-full py-3 px-4 text-red-400 text-left font-medium"
                  >
                    Sign Out
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <Link
                      href="/auth/login"
                      onClick={() => setIsOpen(false)}
                      className="flex-1 text-center py-3 btn-outline-gold rounded-full text-sm font-semibold"
                    >
                      Login
                    </Link>
                    <Link
                      href="/auth/register"
                      onClick={() => setIsOpen(false)}
                      className="flex-1 text-center py-3 btn-gold rounded-full text-sm font-semibold"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
