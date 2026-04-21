"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  X,
  Loader2,
  Lightbulb,
  CheckCircle,
  Star,
  Package,
  Pencil,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { deleteDoc, doc } from "firebase/firestore";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  images?: string[];
  category: string;
  brand?: string;
  description: string;
  stock?: number;
  quantity?: number;
  condition?: string;
  status?: string;
}

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "spare", label: "Spare Parts" },
  { value: "accessory", label: "Accessory" },
  { value: "oil", label: "Oil & Fluids" },
  { value: "tyre", label: "Tyres" },
];

const CATEGORY_LABEL: Record<string, string> = {
  spare: "Spare Part",
  accessory: "Accessory",
  oil: "Oil & Fluids",
  tyre: "Tyre",
};

const CATEGORY_BADGE: Record<string, string> = {
  spare: "bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40",
  accessory: "bg-purple-500/15 text-purple-300 border border-purple-500/30",
  oil: "bg-orange-500/15 text-orange-300 border border-orange-500/30",
  tyre: "bg-green-500/15 text-green-300 border border-green-500/30",
};

function StarRating({ rating = 4.5 }: { rating?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={11}
          className={
            s <= Math.floor(rating)
              ? "text-[#D4AF37] fill-[#D4AF37]"
              : s - 0.5 <= rating
              ? "text-[#D4AF37] fill-[#D4AF37] opacity-50"
              : "text-gray-600"
          }
        />
      ))}
      <span className="text-[10px] text-gray-500 ml-1">{rating}</span>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-square bg-white/5" />
      <div className="p-4 space-y-3">
        <div className="h-3 w-16 bg-white/5 rounded-full" />
        <div className="h-4 w-3/4 bg-white/5 rounded-full" />
        <div className="h-3 w-1/2 bg-white/5 rounded-full" />
        <div className="h-5 w-1/3 bg-white/5 rounded-full" />
        <div className="h-9 w-full bg-white/5 rounded-xl mt-2" />
      </div>
    </div>
  );
}

export default function ShopPage() {
  const { user, isAdmin } = useAuth();
  const {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    totalAmount,
    clearCart,
  } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, "products"),
      where("status", "==", "approved"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product)));
      setLoading(false);
    });
    return unsub;
  }, []);

  const getStock = (p: Product) =>
    typeof p.stock === "number"
      ? p.stock
      : typeof p.quantity === "number"
      ? p.quantity
      : 0;

  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase();
    return (
      (p.name.toLowerCase().includes(q) ||
        (p.brand || "").toLowerCase().includes(q)) &&
      (category === "all" || p.category === category)
    );
  });

  const cartCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  const handleAddToCart = (product: Product) => {
    const stock = getStock(product);
    if (stock <= 0) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image || "",
    });
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Delete this product from the marketplace?")) return;
    try {
      await deleteDoc(doc(db, "products", id));
      toast.success("Product deleted");
    } catch {
      toast.error("Failed to delete product");
    }
  };

  const placeOrder = async () => {
    if (!user) {
      toast.error("Please login to place an order");
      return;
    }
    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    setIsCheckingOut(true);
    try {
      await addDoc(collection(db, "orders"), {
        userId: user.uid,
        userName: user.displayName || "Customer",
        userEmail: user.email,
        items: cartItems.map((i) => ({
          productId: i.productId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          image: i.image,
          subtotal: i.price * i.quantity,
        })),
        totalPrice: totalAmount,
        totalAmount,
        status: "pending",
        paymentMethod: "COD",
        createdAt: serverTimestamp(),
      });
      toast.success("Order placed successfully! We'll contact you shortly.");
      await clearCart();
      setIsCartOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] pt-24 pb-16">
      {/* ── Hero Strip ──────────────────────────────────────────────────────── */}
      <div className="border-b border-white/5 pb-10 mb-10 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
              Spare Parts{" "}
              <span className="text-[#D4AF37]">Marketplace</span>
            </h1>
            <p className="text-gray-400">
              Genuine parts · Fast delivery · Cash on Delivery
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/shop/submit"
              className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 text-gray-300 rounded-xl hover:border-[#D4AF37]/30 hover:text-[#D4AF37] transition-all text-sm font-medium"
            >
              <Lightbulb size={15} />
              Suggest Product
            </Link>
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 px-4 py-2.5 bg-[#D4AF37] text-black rounded-xl hover:bg-yellow-500 transition-all font-bold text-sm"
            >
              <ShoppingCart size={18} />
              Cart
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-black text-[#D4AF37] text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border border-[#D4AF37]">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* ── Search + Filter ──────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-sm">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or brand..."
              className="w-full bg-[#111] border border-white/10 rounded-xl pl-9 pr-10 py-2.5 text-white text-sm focus:border-[#D4AF37] outline-none transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  category === cat.value
                    ? "bg-[#D4AF37] text-black"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── States ───────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-5 border border-white/10">
              <Package size={36} className="text-gray-600" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              {search || category !== "all"
                ? "No products found"
                : "Marketplace is currently empty"}
            </h3>
            <p className="text-gray-500 text-sm mb-6 max-w-sm">
              {search || category !== "all"
                ? "Try adjusting your search or filter"
                : "Check back soon for spare parts, accessories & more"}
            </p>
            <div className="flex gap-3">
              {(search || category !== "all") && (
                <button
                  onClick={() => { setSearch(""); setCategory("all"); }}
                  className="px-5 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl text-sm hover:bg-white/10 transition-all"
                >
                  Clear Filters
                </button>
              )}
              <Link
                href="/shop/submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D4AF37] text-black font-bold rounded-xl hover:bg-yellow-500 transition-all text-sm"
              >
                <Lightbulb size={15} />
                Suggest a Product
              </Link>
            </div>
          </div>
        ) : (
          <>
            <p className="text-gray-500 text-xs mb-5">
              {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""} found
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filteredProducts.map((product, i) => {
                const stock = getStock(product);
                const inCart = cartItems.find(
                  (ci) => ci.productId === product.id
                );
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    stock={stock}
                    inCart={inCart}
                    isAdmin={isAdmin}
                    i={i}
                    onAdd={() => handleAddToCart(product)}
                    onInc={() => inCart && updateQuantity(inCart.id, inCart.quantity + 1)}
                    onDec={() => inCart && updateQuantity(inCart.id, inCart.quantity - 1)}
                    onDelete={() => handleDeleteProduct(product.id)}
                  />
                );
              })}
            </div>

            {/* Bottom CTA */}
            <div className="mt-16 text-center bg-[#111] border border-white/5 rounded-2xl p-8">
              <Lightbulb size={28} className="mx-auto text-[#D4AF37] mb-3" />
              <h3 className="text-white font-semibold mb-1">
                Can&apos;t find what you&apos;re looking for?
              </h3>
              <p className="text-gray-500 text-sm mb-5">
                Suggest a product and we&apos;ll add it to the marketplace
              </p>
              <Link
                href="/shop/submit"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#D4AF37] text-black font-bold rounded-xl hover:bg-yellow-500 transition-all text-sm"
              >
                Suggest a Product
              </Link>
            </div>
          </>
        )}
      </div>

      {/* ── Cart Drawer ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full md:w-[420px] bg-[#0c0c0c] border-l border-white/10 z-[60] flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={20} className="text-[#D4AF37]" />
                  <h2 className="text-lg font-bold text-white">Cart</h2>
                  {cartCount > 0 && (
                    <span className="bg-[#D4AF37] text-black text-xs font-bold px-2 py-0.5 rounded-full">
                      {cartCount}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 text-gray-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Items */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                      <ShoppingCart size={28} className="text-gray-600" />
                    </div>
                    <h3 className="text-white font-semibold mb-1">
                      Your cart is empty
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Add genuine spare parts to get started
                    </p>
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      className="flex gap-4 bg-white/[0.03] rounded-2xl p-3 border border-white/5"
                    >
                      <div className="relative w-20 h-20 bg-black rounded-xl overflow-hidden flex-shrink-0">
                        <Image
                          src={item.image || "/no-image.png"}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-white text-sm font-medium leading-snug line-clamp-2">
                            {item.name}
                          </h4>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <p className="text-[#D4AF37] font-bold text-sm mt-1">
                          ₹{item.price.toLocaleString("en-IN")}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-gray-400 transition-all"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-white text-sm font-semibold w-5 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-gray-400 transition-all"
                          >
                            <Plus size={12} />
                          </button>
                          <span className="ml-auto text-gray-500 text-xs">
                            ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Footer */}
              {cartItems.length > 0 && (
                <div className="p-5 border-t border-white/5 bg-[#0c0c0c] space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Total</span>
                    <span className="text-2xl font-bold text-white">
                      ₹{totalAmount.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <p className="text-gray-600 text-xs text-center uppercase tracking-widest">
                    Cash on Delivery • Free Pickup
                  </p>
                  <button
                    onClick={placeOrder}
                    disabled={isCheckingOut}
                    className="w-full py-4 bg-[#D4AF37] text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-yellow-500 transition-all disabled:opacity-60"
                  >
                    {isCheckingOut ? (
                      <><Loader2 size={18} className="animate-spin" /> Placing Order...</>
                    ) : (
                      <><CheckCircle size={18} /> Place Order (COD)</>
                    )}
                  </button>
                  <Link
                    href="/cart"
                    onClick={() => setIsCartOpen(false)}
                    className="block text-center text-[#D4AF37] text-sm hover:underline"
                  >
                    View full cart →
                  </Link>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({
  product,
  stock,
  inCart,
  isAdmin,
  i,
  onAdd,
  onInc,
  onDec,
  onDelete,
}: {
  product: Product;
  stock: number;
  inCart: { id: string; quantity: number } | undefined;
  isAdmin: boolean;
  i: number;
  onAdd: () => void;
  onInc: () => void;
  onDec: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(i * 0.04, 0.4) }}
      className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden flex flex-col group hover:border-[#D4AF37]/20 transition-all duration-300 hover:shadow-lg hover:shadow-[#D4AF37]/5"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-[#0c0c0c]">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag size={32} className="text-gray-700" />
          </div>
        )}

        {/* Category badge top-left */}
        <div className="absolute top-2 left-2">
          <span
            className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              CATEGORY_BADGE[product.category] ||
              "bg-white/10 text-gray-400 border border-white/10"
            }`}
          >
            {CATEGORY_LABEL[product.category] || product.category}
          </span>
        </div>

        {/* Out of stock overlay */}
        {stock <= 0 && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <span className="bg-red-500/90 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Out of Stock
            </span>
          </div>
        )}

        {/* Low stock warning */}
        {stock > 0 && stock <= 5 && (
          <div className="absolute top-2 right-2">
            <span className="bg-orange-500/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
              Only {stock} left
            </span>
          </div>
        )}

        {/* Admin controls */}
        {isAdmin && (
          <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Link
              href={`/admin/products`}
              className="w-7 h-7 bg-blue-500/80 hover:bg-blue-500 rounded-lg flex items-center justify-center backdrop-blur-sm"
              title="Edit"
            >
              <Pencil size={12} className="text-white" />
            </Link>
            <button
              onClick={onDelete}
              className="w-7 h-7 bg-red-500/80 hover:bg-red-500 rounded-lg flex items-center justify-center backdrop-blur-sm"
              title="Delete"
            >
              <Trash2 size={12} className="text-white" />
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Brand */}
        {product.brand && (
          <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">
            {product.brand}
          </p>
        )}

        {/* Name */}
        <h3 className="text-white text-sm font-semibold mb-1.5 line-clamp-2 leading-snug">
          {product.name}
        </h3>

        {/* Stars */}
        <StarRating rating={4.5} />

        {/* Price + Stock */}
        <div className="flex items-center justify-between mt-3 mb-3">
          <span className="text-[#D4AF37] font-bold text-lg">
            ₹{product.price.toLocaleString("en-IN")}
          </span>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              stock > 0
                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}
          >
            {stock > 0 ? `${stock} in stock` : "Out of stock"}
          </span>
        </div>

        {/* Condition badge */}
        {product.condition && (
          <span className="text-[10px] text-gray-500 mb-3 capitalize">
            Condition: {product.condition}
          </span>
        )}

        {/* Cart button */}
        <div className="mt-auto">
          {inCart ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onDec}
                className="flex-1 h-9 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-gray-300 hover:text-white transition-all border border-white/5"
              >
                <Minus size={14} />
              </button>
              <span className="text-white font-bold text-sm w-8 text-center">
                {inCart.quantity}
              </span>
              <button
                onClick={onInc}
                className="flex-1 h-9 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-gray-300 hover:text-white transition-all border border-white/5"
              >
                <Plus size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={onAdd}
              disabled={stock <= 0}
              className={`w-full h-9 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
                stock > 0
                  ? "bg-[#D4AF37] text-black hover:bg-yellow-500 active:scale-95"
                  : "bg-white/5 text-gray-600 cursor-not-allowed border border-white/5"
              }`}
            >
              <Plus size={14} />
              {stock > 0 ? "Add to Cart" : "Unavailable"}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
