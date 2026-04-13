"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  Calendar, 
  Car, 
  Clock, 
  CheckCircle, 
  XCircle,
  LogOut,
  ChevronRight,
  Camera,
  LayoutDashboard
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice, formatDate } from "@/lib/utils";

interface UserData {
  name: string;
  email: string;
  phone: string;
  dob: string;
  photoURL: string;
  createdAt: Timestamp | Date | null; 
}

interface SubmittedCar {
  id: string;
  carBrand: string;
  carModel: string;
  carYear: number;
  expectedPrice: number;
  status: "pending" | "approved" | "rejected" | "under_review";
  createdAt: Timestamp | Date | null;
  images: string[];
}

export default function ProfilePage() {
  const { user, logout, isAdmin } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userCars, setUserCars] = useState<SubmittedCar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfileData() {
      if (!user) return;
      
      try {
        // Fetch User Info
        console.log("DEBUG: FETCHING PROFILE FOR UID:", user.uid);
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data() as UserData);
        }

        // Fetch User Cars
        console.log("DEBUG: QUERYING SUBMISSIONS FOR UID:", user.uid);
        const q = query(
          collection(db, "car_submissions"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        console.log("DEBUG: SUBMISSIONS FOUND:", snapshot.docs.length);
        const cars = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as SubmittedCar[];
        setUserCars(cars);
      } catch (error) {
        console.error("Error fetching profile:", error);
        // Silently skip if error is index-related
      } finally {
        setLoading(false);
      }
    }

    fetchProfileData();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-white text-2xl font-bold mb-4">Please login to view profile</h2>
          <Link href="/auth/login" className="btn-gold px-8 py-3 rounded-full inline-block">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = {
    pending: { label: "Pending", icon: Clock, color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20" },
    approved: { label: "Approved", icon: CheckCircle, color: "text-green-400", bg: "bg-green-400/10 border-green-400/20" },
    rejected: { label: "Rejected", icon: XCircle, color: "text-red-400", bg: "bg-red-400/10 border-red-400/20" },
    under_review: { label: "Under Review", icon: Clock, color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20" },
  };

  return (
    <div className="min-h-screen bg-black pt-28 pb-20">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Sidebar: Profile Info */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 space-y-6"
          >
            <div className="glass-dark rounded-3xl p-8 border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-gold-500/10 transition-colors" />
              
              <div className="relative text-center mb-8">
                <div className="w-24 h-24 rounded-2xl bg-gold-gradient p-1 mx-auto mb-4 relative group/avatar shadow-gold">
                  <div className="w-full h-full rounded-2xl bg-charcoal-950 overflow-hidden relative flex items-center justify-center">
                    {userData?.photoURL ? (
                      <Image 
                        src={userData.photoURL} 
                        alt={userData.name} 
                        fill 
                        className="object-cover"
                      />
                    ) : user.photoURL ? (
                      <Image 
                        src={user.photoURL} 
                        alt={user.displayName || "User"} 
                        fill 
                        className="object-cover"
                      />
                    ) : (
                      <UserIcon size={40} className="text-gold-500" />
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                      <Camera size={24} className="text-gold-400" />
                    </div>
                  </div>
                </div>
                <h1 className="text-white text-2xl font-bold font-display">{userData?.name || user.displayName || "JSK User"}</h1>
                <p className="text-charcoal-400 text-sm">Member since {formatDate(userData?.createdAt || user.metadata.creationTime || new Date())}</p>
                {isAdmin && (
                  <Link href="/admin" className="inline-flex items-center gap-2 mt-4 px-4 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs font-bold hover:bg-gold-500/20 transition-all">
                    <LayoutDashboard size={14} /> Admin Panel
                  </Link>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 group/info hover:border-gold-500/30 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center flex-shrink-0 group-hover/info:scale-110 transition-transform">
                    <Mail size={18} className="text-gold-500" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-charcoal-500 text-[10px] uppercase tracking-wider font-black">Email Address</p>
                    <p className="text-white text-sm truncate font-medium">{userData?.email || user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 group/info hover:border-gold-500/30 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center flex-shrink-0 group-hover/info:scale-110 transition-transform">
                    <Phone size={18} className="text-gold-500" />
                  </div>
                  <div>
                    <p className="text-charcoal-500 text-[10px] uppercase tracking-wider font-black">Phone Number</p>
                    <p className="text-white text-sm font-medium">{userData?.phone || "Not provided"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 group/info hover:border-gold-500/30 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center flex-shrink-0 group-hover/info:scale-110 transition-transform">
                    <Calendar size={18} className="text-gold-500" />
                  </div>
                  <div>
                    <p className="text-charcoal-500 text-[10px] uppercase tracking-wider font-black">Date of Birth</p>
                    <p className="text-white text-sm font-medium">{userData?.dob || "Not provided"}</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => {
                  logout();
                  router.push("/");
                }}
                className="w-full mt-8 py-4 rounded-2xl border border-red-500/20 hover:bg-red-500/10 text-red-400 text-sm font-bold transition-all flex items-center justify-center gap-2 group/logout"
              >
                <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" /> Sign Out from Account
              </button>
            </div>
          </motion.div>

          {/* Main Content: Submitted Cars */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-white text-3xl font-bold font-display flex items-center gap-3">
                  My Submissions
                </h2>
                <p className="text-charcoal-400 text-sm mt-1">Track the status of your listed cars</p>
              </div>
              <Link href="/sell" className="btn-gold px-6 py-2.5 rounded-full text-sm font-bold shadow-gold flex items-center gap-2">
                Sell Another <ChevronRight size={16} />
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="glass-dark rounded-4xl h-72 animate-pulse border border-white/5" />
                ))}
              </div>
            ) : userCars.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {userCars.map((car, index) => {
                  const status = statusConfig[car.status] || statusConfig.pending;
                  const StatusIcon = status.icon;
                  
                  return (
                    <motion.div 
                      key={car.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="glass-dark rounded-4xl border border-white/5 overflow-hidden hover:border-gold-500/40 transition-all group shadow-2xl hover:shadow-gold/10"
                    >
                      <div className="relative h-48 overflow-hidden">
                        {car.images?.[0] ? (
                          <Image 
                            src={car.images[0]} 
                            alt={car.carModel} 
                            fill 
                            className="object-cover group-hover:scale-110 transition-transform duration-1000"
                          />
                        ) : (
                          <div className="w-full h-full bg-charcoal-900 flex items-center justify-center">
                            <Car size={48} className="text-charcoal-800" />
                          </div>
                        )}
                        <div className={`absolute top-5 right-5 px-4 py-2 rounded-2xl backdrop-blur-xl border ${status.bg} flex items-center gap-2 z-10 shadow-2xl scale-90 group-hover:scale-100 transition-transform`}>
                          <StatusIcon size={16} className={status.color} />
                          <span className={`text-[11px] font-black uppercase tracking-widest ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-8">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-white font-bold text-xl leading-tight font-display mb-1 group-hover:text-gold-400 transition-colors">
                              {car.carYear} {car.carBrand}
                            </h3>
                            <p className="text-charcoal-400 font-medium">{car.carModel}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-gold-400 font-black text-xl">{formatPrice(car.expectedPrice)}</p>
                            <p className="text-charcoal-500 text-[10px] uppercase font-black tracking-widest">Target Price</p>
                          </div>
                        </div>
                        
                        <div className="pt-6 border-t border-white/10 flex items-center justify-between mt-2">
                          <div className="flex flex-col">
                    <span className="text-charcoal-500 text-[10px] uppercase font-black tracking-widest">Date Listed</span>
                            <span className="text-charcoal-300 text-xs font-medium">
                        {formatDate(car.createdAt || new Date())}
                            </span>
                          </div>
                          <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-gold-500 hover:text-black transition-all group/btn">
                            <ChevronRight size={20} className="group-hover/btn:translate-x-0.5 transition-transform" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="glass-dark rounded-[3rem] p-20 text-center border border-dashed border-gold-500/10 shadow-inner">
                <div className="w-24 h-24 rounded-4xl bg-gold-500/5 flex items-center justify-center mx-auto mb-8 shadow-gold/5 border border-gold-500/10">
                  <Car size={48} className="text-gold-500/20" />
                </div>
                <h3 className="text-white text-2xl font-bold mb-3 font-display">No Submissions Yet</h3>
                <p className="text-charcoal-400 mb-10 max-w-sm mx-auto leading-relaxed">Turn your unused, damaged, or second-hand cars into instant cash today through JSK Motors.</p>
                <Link href="/sell" className="btn-gold px-12 py-5 rounded-full font-black text-sm uppercase tracking-widest shadow-gold hover:shadow-gold/40 hover:-translate-y-1 transition-all">
                  Sell Your Car Now
                </Link>
              </div>
            )}

            {/* Placeholder for purchased cars */}
            <div className="pt-12">
              <div className="flex items-center gap-4 mb-8">
                <h2 className="text-white/20 text-3xl font-bold font-display flex items-center gap-3">
                   Purchased History
                </h2>
                <div className="h-px flex-1 bg-white/5" />
                <span className="text-[10px] px-3 py-1 rounded-full border border-white/5 bg-white/2 text-charcoal-600 tracking-[0.2em] font-black uppercase">Phase 2 Locked</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-30 select-none grayscale">
                  <div className="glass shadow-none rounded-4xl h-56 border-dashed" />
                  <div className="glass shadow-none rounded-4xl h-56 border-dashed" />
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
