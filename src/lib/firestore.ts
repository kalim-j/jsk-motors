import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  QueryConstraint,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Car {
  id?: string;
  name: string; // Changed from title
  brand: string;
  model: string;
  year: number;
  price: number;
  originalPrice?: number;
  condition: string;
  mileage: number;
  fuel: string; // Changed from fuelType
  transmission: string;
  city: string;
  state: string;
  description: string;
  images: string[];
  featured: boolean;
  status: "available" | "sold" | "reserved";
  damageType?: string;
  restorationStatus?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface DealerActivityLog {
  action: "added" | "updated" | "status_changed";
  timestamp: Timestamp;
  changedBy?: string;
  details?: string;
}

export interface Dealer {
  id?: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  city: string;
  state: string;
  specialization: string[];
  carTypes: string[];
  rating: number;
  status: "active" | "inactive";
  notes?: string;
  activityLog?: DealerActivityLog[];
  lastUpdated?: Timestamp;
  createdAt?: Timestamp;
}

export interface CarSubmission {
  id?: string;
  userId: string;
  userEmail: string;
  userName: string;
  carBrand: string;
  carModel: string;
  carYear: number;
  expectedPrice: number;
  damageDescription: string;
  damageLevel: "Minor" | "Moderate" | "Severe" | "Total Loss";
  city: string;
  state: string;
  phone: string;
  images: string[];
  status: "pending" | "approved" | "rejected" | "under_review";
  adminNotes?: string;
  offeredPrice?: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface RepairEntry {
  id?: string;
  carName: string;
  description: string;
  date: string;
  cost: string;
  beforeImages: string[];
  afterImages: string[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface RepairEntry {
  id?: string;
  carName: string;
  description: string;
  date: string;
  cost: string;
  beforeImages: string[];
  afterImages: string[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// ─── Cars ─────────────────────────────────────────────────────────────────────

export const getCars = async (filters?: {
  status?: string;
  city?: string;
  fuelType?: string;
  featured?: boolean;
}): Promise<Car[]> => {
  const constraints: QueryConstraint[] = [orderBy("createdAt", "desc")];

  if (filters?.status) {
    constraints.unshift(where("status", "==", filters.status));
  }
  if (filters?.city) {
    constraints.unshift(where("city", "==", filters.city));
  }
  if (filters?.featured !== undefined) {
    constraints.unshift(where("featured", "==", filters.featured));
  }

  const q = query(collection(db, "cars"), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Car));
};

export const getFeaturedCars = async (limitCount = 6): Promise<Car[]> => {
  const q = query(
    collection(db, "cars"),
    where("featured", "==", true),
    where("status", "==", "available"),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Car));
};

export const getCarById = async (id: string): Promise<Car | null> => {
  const docRef = doc(db, "cars", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Car;
  }
  return null;
};

export const addCar = async (car: Omit<Car, "id">): Promise<string> => {
  const docRef = await addDoc(collection(db, "cars"), {
    ...car,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateCar = async (
  id: string,
  car: Partial<Car>
): Promise<void> => {
  const docRef = doc(db, "cars", id);
  await updateDoc(docRef, { ...car, updatedAt: serverTimestamp() });
};

export const deleteCar = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, "cars", id));
};

// ─── Dealers — Real-time ───────────────────────────────────────────────────────

/**
 * One-time fetch of all dealers (for non-realtime use)
 */
export const getDealers = async (): Promise<Dealer[]> => {
  const q = query(collection(db, "dealers"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as Dealer)
  );
};

/**
 * Real-time onSnapshot listener for dealers collection.
 * Returns an unsubscribe function — call it to stop listening.
 */
export const subscribeToDealers = (
  callback: (dealers: Dealer[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const q = query(
    collection(db, "dealers"),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const dealers = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Dealer)
      );
      callback(dealers);
    },
    (error) => {
      console.error("Dealer listener error:", error);
      onError?.(error);
    }
  );
};

/**
 * Real-time listener for active dealers only
 */
export const subscribeToActiveDealers = (
  callback: (dealers: Dealer[]) => void
): Unsubscribe => {
  const q = query(
    collection(db, "dealers"),
    where("status", "==", "active"),
    orderBy("lastUpdated", "desc"),
    limit(10)
  );

  return onSnapshot(q, (snapshot) => {
    const dealers = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Dealer)
    );
    callback(dealers);
  });
};

export const addDealer = async (
  dealer: Omit<Dealer, "id">
): Promise<string> => {
  const docRef = await addDoc(collection(db, "dealers"), {
    ...dealer,
    createdAt: serverTimestamp(),
    lastUpdated: serverTimestamp(),
    activityLog: [
      {
        action: "added",
        timestamp: new Date(),
        details: "Dealer added to network",
      },
    ],
  });
  return docRef.id;
};

export const updateDealer = async (
  id: string,
  dealer: Partial<Dealer>
): Promise<void> => {
  await updateDoc(doc(db, "dealers", id), {
    ...dealer,
    lastUpdated: serverTimestamp(),
  });
};

export const toggleDealerStatus = async (
  id: string,
  currentStatus: "active" | "inactive"
): Promise<void> => {
  const newStatus = currentStatus === "active" ? "inactive" : "active";
  await updateDoc(doc(db, "dealers", id), {
    status: newStatus,
    lastUpdated: serverTimestamp(),
  });
};

export const deleteDealer = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, "dealers", id));
};

// ─── Submissions ──────────────────────────────────────────────────────────────

export const getSubmissions = async (): Promise<CarSubmission[]> => {
  const q = query(
    collection(db, "car_submissions"),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as CarSubmission)
  );
};

export const getUserSubmissions = async (
  userId: string
): Promise<CarSubmission[]> => {
  const q = query(
    collection(db, "car_submissions"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as CarSubmission)
  );
};

export const addSubmission = async (
  submission: Omit<CarSubmission, "id">
): Promise<string> => {
  const docRef = await addDoc(collection(db, "car_submissions"), {
    ...submission,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateSubmission = async (
  id: string,
  data: Partial<CarSubmission>
): Promise<void> => {
  await updateDoc(doc(db, "car_submissions", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

// ─── Real-time Submissions Listener ───────────────────────────────────────────

export const subscribeToSubmissions = (
  callback: (submissions: CarSubmission[]) => void
): Unsubscribe => {
  const q = query(
    collection(db, "car_submissions"),
    orderBy("createdAt", "desc"),
    limit(50)
  );
  });
};

// ─── Repairs / Showcase ───────────────────────────────────────────────────────

export const getRepairs = async (): Promise<RepairEntry[]> => {
  const q = query(collection(db, "repairs"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as RepairEntry)
  );
};

export const subscribeToRepairs = (
  callback: (repairs: RepairEntry[]) => void
): Unsubscribe => {
  const q = query(collection(db, "repairs"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as RepairEntry)));
  });
};

export const addRepair = async (repair: Omit<RepairEntry, "id">): Promise<string> => {
  const docRef = await addDoc(collection(db, "repairs"), {
    ...repair,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const deleteRepair = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, "repairs", id));
};
