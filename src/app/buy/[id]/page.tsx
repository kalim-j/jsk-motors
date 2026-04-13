"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function RedirectPage() {
  const router = useRouter();
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      router.replace(`/cars/${id}`);
    } else {
      router.replace("/buy");
    }
  }, [id, router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-gold-500 animate-pulse font-display text-xl uppercase tracking-widest font-black">
        Redirecting to Premium Details...
      </div>
    </div>
  );
}
