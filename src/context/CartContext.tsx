"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import toast from "react-hot-toast";

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  userId: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: any) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | null>(null);

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    if (!user) {
      setCartItems([]);
      return;
    }

    const q = query(collection(db, "cart", user.uid, "items"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as CartItem[];
      setCartItems(items);
    });

    return unsubscribe;
  }, [user]);

  const addToCart = async (product: any) => {
    if (!user) {
      toast.error("Please login to add items to cart");
      return;
    }

    const existingItem = cartItems.find((item) => item.productId === product.id);

    if (existingItem) {
      await updateDoc(doc(db, "cart", user.uid, "items", existingItem.id), {
        quantity: existingItem.quantity + 1,
      });
    } else {
      await addDoc(collection(db, "cart", user.uid, "items"), {
        userId: user.uid,
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1,
      });
    }
    toast.success("Added to cart");
  };

  const removeFromCart = async (itemId: string) => {
    if (!user) return;
    await deleteDoc(doc(db, "cart", user.uid, "items", itemId));
    toast.success("Removed from cart");
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (!user || quantity < 1) return;
    await updateDoc(doc(db, "cart", user.uid, "items", itemId), { quantity });
  };

  const clearCart = async () => {
    if (!user) return;
    const promises = cartItems.map((item) => deleteDoc(doc(db, "cart", user.uid, "items", item.id)));
    await Promise.all(promises);
  };

  const totalAmount = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
