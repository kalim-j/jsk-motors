"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  memo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Save,
  MapPin,
  Phone,
  Star,
  Brain,
  Filter,
  Wifi,
  WifiOff,
  RefreshCw,
  Clock,
  TrendingUp,
  Users,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  ChevronLeft,
  ChevronRight,
  Mail,
  StickyNote,
} from "lucide-react";
import {
  subscribeToDealers,
  addDealer,
  updateDealer,
  deleteDealer,
  toggleDealerStatus,
} from "@/lib/firestore";
import type { Dealer } from "@/lib/firestore";
import { INDIAN_STATES } from "@/lib/utils";
import { useDebouncedValue } from "@/hooks/useDebounce";
import { sampleDealers } from "@/lib/sampleData";
import toast from "react-hot-toast";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(ts: { toDate?: () => Date } | Date | undefined | null): string {
  if (!ts) return "—";
  const date = ts && typeof ts === "object" && "toDate" in ts && typeof ts.toDate === "function"
    ? ts.toDate()
    : (ts as Date);
  const diff = Date.now() - date.getTime();
  const s = Math.floor(diff / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

// ─── Enhanced AI Suggestion Engine ────────────────────────────────────────────

interface AiQuery {
  carType: string;
  damageLevel: string;
  state: string;
  budget?: string;
}

interface ScoredDealer extends Dealer {
  _score: number;
  _reasons: string[];
}

function runAiEngine(dealers: Dealer[], query: AiQuery): ScoredDealer[] {
  const DAMAGE_SPEC_MAP: Record<string, string[]> = {
    Minor: ["Body Repair", "Painting", "Dent Removal"],
    Moderate: ["Body Repair", "Mechanical", "Painting"],
    Severe: ["Full Restoration", "Mechanical", "Body Repair"],
    "Total Loss": ["Full Restoration"],
  };

  const requiredSpecs = DAMAGE_SPEC_MAP[query.damageLevel] || [];

  return dealers
    .filter((d) => d.status === "active")
    .map((d) => {
      let score = 0;
      const reasons: string[] = [];

      // State proximity
      if (d.state === query.state) {
        score += 4;
        reasons.push("Same state");
      }

      // Car type match
      const carTypeLower = query.carType.toLowerCase();
      if (
        carTypeLower &&
        d.carTypes.some(
          (t) =>
            t.toLowerCase().includes(carTypeLower) ||
            carTypeLower.includes(t.toLowerCase())
        )
      ) {
        score += 3;
        reasons.push(`Handles ${query.carType}`);
      }

      // Specialization match for damage
      const matchedSpecs = requiredSpecs.filter((spec) =>
        d.specialization.some((s) =>
          s.toLowerCase().includes(spec.toLowerCase())
        )
      );
      if (matchedSpecs.length > 0) {
        score += matchedSpecs.length * 2;
        reasons.push(`Specializes in ${matchedSpecs[0]}`);
      }

      // Rating boost
      if (d.rating >= 4.8) {
        score += 2;
        reasons.push("Top rated");
      } else if (d.rating >= 4.5) {
        score += 1;
      }

      return { ...d, _score: score, _reasons: reasons };
    })
    .filter((d) => d._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, 4);
}

// ─── Sub-components (memoised for render performance) ────────────────────────

const LiveIndicator = memo(function LiveIndicator({
  isLive,
}: {
  isLive: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${
        isLive
          ? "text-green-400 bg-green-500/10 border-green-500/30"
          : "text-red-400 bg-red-500/10 border-red-500/30"
      }`}
    >
      {isLive ? (
        <>
          <span className="relative flex w-2 h-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full w-2 h-2 bg-green-400" />
          </span>
          <Wifi size={12} />
          Live
        </>
      ) : (
        <>
          <WifiOff size={12} />
          Offline
        </>
      )}
    </div>
  );
});

const DealerStatusDot = memo(function DealerStatusDot({
  status,
}: {
  status: "active" | "inactive";
}) {
  return (
    <span className="relative flex w-2.5 h-2.5 flex-shrink-0">
      {status === "active" && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
      )}
      <span
        className={`relative inline-flex rounded-full w-2.5 h-2.5 ${
          status === "active" ? "bg-green-400" : "bg-charcoal-600"
        }`}
      />
    </span>
  );
});

const DealerTableRow = memo(function DealerTableRow({
  dealer,
  isNew,
  onEdit,
  onDelete,
  onToggleStatus,
}: {
  dealer: Dealer;
  isNew: boolean;
  onEdit: (d: Dealer) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, status: "active" | "inactive") => void;
}) {
  const lastUpdated = dealer.lastUpdated
    ? timeAgo(dealer.lastUpdated)
    : dealer.createdAt
    ? timeAgo(dealer.createdAt)
    : "—";

  return (
    <motion.tr
      layout
      initial={{ opacity: 0, backgroundColor: isNew ? "rgba(212,175,55,0.12)" : "transparent" }}
      animate={{ opacity: 1, backgroundColor: "transparent" }}
      transition={{ duration: isNew ? 0.8 : 0.3 }}
      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
    >
      {/* Dealer Name */}
      <td className="py-4 px-5">
        <div className="flex items-center gap-3">
          <DealerStatusDot status={dealer.status} />
          <div>
            <div className="font-semibold text-white text-sm group-hover:text-gold-400 transition-colors">
              {dealer.name}
            </div>
            <div className="text-charcoal-500 text-xs flex items-center gap-1 mt-0.5">
              <Phone size={10} />
              {dealer.phone}
            </div>
          </div>
        </div>
      </td>

      {/* Location */}
      <td className="py-4 px-4 hidden md:table-cell">
        <div className="flex items-center gap-1.5 text-charcoal-300 text-sm">
          <MapPin size={12} className="text-gold-500 flex-shrink-0" />
          <span>{dealer.city}, {dealer.state}</span>
        </div>
      </td>

      {/* Specialization */}
      <td className="py-4 px-4 hidden lg:table-cell">
        <div className="flex flex-wrap gap-1">
          {dealer.specialization?.slice(0, 2).map((s) => (
            <span
              key={s}
              className="text-xs text-charcoal-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/5"
            >
              {s}
            </span>
          ))}
          {(dealer.specialization?.length || 0) > 2 && (
            <span className="text-xs text-charcoal-600">
              +{dealer.specialization.length - 2}
            </span>
          )}
        </div>
      </td>

      {/* Car Types */}
      <td className="py-4 px-4 hidden xl:table-cell">
        <div className="text-charcoal-400 text-xs">
          {dealer.carTypes?.slice(0, 2).join(", ")}
          {(dealer.carTypes?.length || 0) > 2 && "…"}
        </div>
      </td>

      {/* Rating */}
      <td className="py-4 px-4">
        <div className="flex items-center gap-1 text-sm">
          <Star size={12} className="text-gold-400 fill-gold-400 flex-shrink-0" />
          <span className="text-white font-medium">{dealer.rating}</span>
        </div>
      </td>

      {/* Status */}
      <td className="py-4 px-4">
        <span
          className={`text-xs px-2.5 py-1 rounded-full font-medium ${
            dealer.status === "active"
              ? "badge-available"
              : "bg-charcoal-800 text-charcoal-400 border border-charcoal-700"
          }`}
        >
          {dealer.status}
        </span>
      </td>

      {/* Last Updated */}
      <td className="py-4 px-4 hidden xl:table-cell">
        <div className="flex items-center gap-1 text-charcoal-500 text-xs">
          <Clock size={10} />
          {lastUpdated}
        </div>
      </td>

      {/* Actions */}
      <td className="py-4 px-5">
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => onToggleStatus(dealer.id!, dealer.status)}
            title={dealer.status === "active" ? "Deactivate" : "Activate"}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              dealer.status === "active"
                ? "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                : "bg-charcoal-800 text-charcoal-400 hover:bg-charcoal-700"
            }`}
          >
            {dealer.status === "active" ? (
              <ToggleRight size={14} />
            ) : (
              <ToggleLeft size={14} />
            )}
          </button>
          <button
            onClick={() => onEdit(dealer)}
            className="w-8 h-8 rounded-lg bg-gold-500/10 flex items-center justify-center hover:bg-gold-500/20 transition-all text-gold-400"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={() => onDelete(dealer.id!)}
            className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-all text-red-400"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </motion.tr>
  );
});

// ─── Default form state ───────────────────────────────────────────────────────

const DEFAULT_FORM = {
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
  city: "",
  state: "Tamil Nadu",
  specialization: "",
  carTypes: "",
  rating: 4.5,
  status: "active" as "active" | "inactive",
  notes: "",
};

const PAGE_SIZE = 10;

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminDealersPage() {
  const [allDealers, setAllDealers] = useState<Dealer[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  // Search & filter
  const [rawSearch, setRawSearch] = useState("");
  const search = useDebouncedValue(rawSearch, 280);
  const [stateFilter, setStateFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Pagination
  const [page, setPage] = useState(1);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editDealer, setEditDealer] = useState<Dealer | null>(null);
  const [formData, setFormData] = useState(DEFAULT_FORM);

  // AI
  const [showAi, setShowAi] = useState(false);
  const [aiQuery, setAiQuery] = useState<AiQuery>({
    carType: "",
    damageLevel: "Moderate",
    state: "Tamil Nadu",
    budget: "",
  });
  const [aiResults, setAiResults] = useState<ScoredDealer[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  // Track previous IDs to detect newly added
  const prevIdsRef = useRef<Set<string>>(new Set());

  // ── Real-time subscription ─────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);

    const unsubscribe = subscribeToDealers(
      async (dealers) => {
        // Automatically insert sample data if no dealers exist
        if (dealers.length === 0 && !sessionStorage.getItem("hasSeededDealers")) {
          sessionStorage.setItem("hasSeededDealers", "true");
          try {
            await Promise.all(sampleDealers.map(sd => addDealer(sd)));
            toast.success("Sample dealers automatically added!");
          } catch (e) {
            console.error("Failed to seed dealers", e);
          }
        }

        // Detect newly added docs
        const currentIds = new Set(dealers.map((d) => d.id!).filter(Boolean));
        const addedIds = new Set<string>();
        currentIds.forEach((id) => {
          if (!prevIdsRef.current.has(id) && prevIdsRef.current.size > 0) {
            addedIds.add(id);
          }
        });
        prevIdsRef.current = currentIds;

        if (addedIds.size > 0) {
          setNewIds((prev) => new Set([...prev, ...addedIds]));
          setTimeout(() => {
            setNewIds((prev) => {
              const next = new Set(prev);
              addedIds.forEach((id) => next.delete(id));
              return next;
            });
          }, 4000);
        }

        setAllDealers(dealers);
        setIsLive(true);
        setLoadError(false);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore error:", error);
        // Firestore failed (offline / permissions) — fall back to sample data
        setAllDealers(sampleDealers as Dealer[]);
        setIsLive(false);
        setLoadError(true);
        setLoading(false);
        toast.error("Failed to load dealers from live database");
      }
    );

    return () => unsubscribe();
  }, []);

  // ── Derived filtered + paginated list ──────────────────────────────────────
  const filtered = allDealers.filter((d) => {
    if (
      search &&
      !d.name.toLowerCase().includes(search.toLowerCase()) &&
      !d.city.toLowerCase().includes(search.toLowerCase()) &&
      !d.contactPerson.toLowerCase().includes(search.toLowerCase()) &&
      !d.phone.includes(search)
    )
      return false;
    if (stateFilter !== "All" && d.state !== stateFilter) return false;
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, stateFilter, statusFilter]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = {
    total: allDealers.length,
    active: allDealers.filter((d) => d.status === "active").length,
    inactive: allDealers.filter((d) => d.status === "inactive").length,
    states: new Set(allDealers.map((d) => d.state)).size,
  };

  const recentlyActive = [...allDealers]
    .filter((d) => d.status === "active" && d.lastUpdated)
    .sort((a, b) => {
      const aTime = a.lastUpdated && typeof a.lastUpdated === "object" && "toDate" in a.lastUpdated
        ? a.lastUpdated.toDate().getTime()
        : 0;
      const bTime = b.lastUpdated && typeof b.lastUpdated === "object" && "toDate" in b.lastUpdated
        ? b.lastUpdated.toDate().getTime()
        : 0;
      return bTime - aTime;
    })
    .slice(0, 3);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const openAddModal = useCallback(() => {
    setFormData(DEFAULT_FORM);
    setEditDealer(null);
    setShowAddModal(true);
  }, []);

  const openEditModal = useCallback((dealer: Dealer) => {
    setFormData({
      name: dealer.name,
      contactPerson: dealer.contactPerson || "",
      phone: dealer.phone,
      email: dealer.email || "",
      city: dealer.city,
      state: dealer.state,
      specialization: dealer.specialization.join(", "),
      carTypes: dealer.carTypes.join(", "),
      rating: dealer.rating,
      status: dealer.status,
      notes: dealer.notes || "",
    });
    setEditDealer(dealer);
    setShowAddModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowAddModal(false);
    setEditDealer(null);
    setFormData(DEFAULT_FORM);
  }, []);

  const handleSave = async () => {
    if (!formData.name || !formData.phone || !formData.city) {
      toast.error("Name, phone, and city are required");
      return;
    }

    const payload = {
      name: formData.name.trim(),
      contactPerson: formData.contactPerson.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim() || undefined,
      city: formData.city.trim(),
      state: formData.state,
      specialization: formData.specialization
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      carTypes: formData.carTypes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      rating: Number(formData.rating),
      status: formData.status,
      notes: formData.notes.trim() || undefined,
    };

    try {
      if (editDealer?.id) {
        await updateDealer(editDealer.id, payload);
        toast.success("Dealer updated — live!");
      } else {
        await addDealer(payload);
        toast.success("Dealer added — reflecting live!");
      }
      closeModal();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save. Check Firebase permissions.");
    }
  };

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Delete this dealer permanently?")) return;
    try {
      await deleteDealer(id);
      toast.success("Dealer removed");
    } catch {
      toast.error("Delete failed — check permissions");
    }
  }, []);

  const handleToggleStatus = useCallback(
    async (id: string, current: "active" | "inactive") => {
      try {
        await toggleDealerStatus(id, current);
        toast.success(
          `Dealer ${current === "active" ? "deactivated" : "activated"}`
        );
      } catch {
        toast.error("Status update failed");
      }
    },
    []
  );

  const runAi = () => {
    if (!aiQuery.carType && aiQuery.damageLevel === "Moderate") {
      toast("Fill at least one field for better suggestions", { icon: "💡" });
    }
    setAiLoading(true);
    // Simulate async AI processing
    setTimeout(() => {
      const results = runAiEngine(allDealers, aiQuery);
      setAiResults(results);
      setAiLoading(false);
      if (results.length === 0) {
        toast("No matching dealers. Try different criteria.", { icon: "🔍" });
      }
    }, 600);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-black pt-20">
      <div className="container-custom py-10">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-display text-3xl font-bold text-white">
                Dealer Network
              </h1>
              <LiveIndicator isLive={isLive} />
            </div>
            <p className="text-charcoal-400 text-sm">
              {loading
                ? "Connecting to live database..."
                : `${stats.total} dealers · ${stats.active} active · ${stats.states} states`}
            </p>
            {loadError && (
              <p className="text-yellow-400 text-xs mt-1 flex items-center gap-1">
                <RefreshCw size={10} className="animate-spin" />
                Using cached data — Firebase may need rules update
              </p>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowAi(!showAi)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all ${
                showAi
                  ? "btn-gold"
                  : "glass border border-white/10 text-charcoal-300 hover:border-gold-500/30"
              }`}
            >
              <Brain size={15} />
              AI Suggest
            </button>
            <button
              onClick={openAddModal}
              className="btn-gold px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2"
            >
              <Plus size={16} />
              Add Dealer
            </button>
          </div>
        </div>

        {/* ── Analytics Strip ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Dealers", value: stats.total, Icon: Users, color: "text-gold-400", bg: "bg-gold-500/10" },
            { label: "Active", value: stats.active, Icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10" },
            { label: "Inactive", value: stats.inactive, Icon: WifiOff, color: "text-charcoal-400", bg: "bg-charcoal-800" },
            { label: "States Covered", value: stats.states, Icon: TrendingUp, color: "text-blue-400", bg: "bg-blue-500/10" },
          ].map(({ label, value, Icon, color, bg }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={`glass-dark rounded-2xl p-4 border border-white/5 flex items-center gap-3`}
            >
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon size={18} className={color} />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{loading ? "—" : value}</div>
                <div className="text-charcoal-400 text-xs">{label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Recently Active Strip ──────────────────────────────────────────── */}
        {recentlyActive.length > 0 && (
          <div className="glass-gold rounded-2xl p-4 mb-8 border border-gold-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={14} className="text-gold-400" />
              <span className="text-gold-400 text-sm font-semibold">Recently Active</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {recentlyActive.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center gap-2 glass px-3 py-1.5 rounded-xl border border-white/5 text-xs"
                >
                  <DealerStatusDot status="active" />
                  <span className="text-white font-medium">{d.name}</span>
                  <span className="text-charcoal-500">·</span>
                  <span className="text-charcoal-400">{d.city}</span>
                  <span className="text-charcoal-600">
                    {timeAgo(d.lastUpdated)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── AI Panel ───────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {showAi && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="glass-gold rounded-2xl p-6 mb-8 border border-gold-500/30 overflow-hidden"
            >
              <div className="flex items-center gap-2 mb-5">
                <Brain size={18} className="text-gold-400" />
                <h2 className="text-white font-bold text-base">
                  AI Dealer Suggestion Engine
                </h2>
                <span className="text-charcoal-500 text-xs">
                  (Multi-factor scoring: location × car type × damage × rating)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                {[
                  { label: "Car Type", key: "carType", placeholder: "SUV, Sedan, EV…", type: "input" },
                  { label: "Damage Level", key: "damageLevel", options: ["Minor", "Moderate", "Severe", "Total Loss"], type: "select" },
                  { label: "Location (State)", key: "state", options: INDIAN_STATES, type: "select" },
                  { label: "Budget (optional)", key: "budget", placeholder: "e.g. 50000", type: "input" },
                ].map(({ label, key, placeholder, options, type }) => (
                  <div key={key}>
                    <label className="text-charcoal-300 text-xs font-medium block mb-2">
                      {label}
                    </label>
                    {type === "input" ? (
                      <input
                        value={(aiQuery as Record<string, string>)[key]}
                        onChange={(e) =>
                          setAiQuery((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        placeholder={placeholder}
                        className="input-dark w-full px-4 py-2.5 rounded-xl text-sm"
                      />
                    ) : (
                      <select
                        value={(aiQuery as Record<string, string>)[key]}
                        onChange={(e) =>
                          setAiQuery((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        className="input-dark w-full px-4 py-2.5 rounded-xl text-sm"
                      >
                        {options!.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={runAi}
                disabled={aiLoading}
                className="btn-gold px-6 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 disabled:opacity-70"
              >
                {aiLoading ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Brain size={14} />
                )}
                {aiLoading ? "Analysing..." : "Find Best Dealers"}
              </button>

              {/* AI Results */}
              <AnimatePresence>
                {aiResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                  >
                    {aiResults.map((d, i) => (
                      <div
                        key={d.id || i}
                        className="glass-dark rounded-2xl p-4 border border-gold-500/20 relative overflow-hidden"
                      >
                        {/* Score badge */}
                        <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-gold-500 text-black text-xs font-black flex items-center justify-center">
                          #{i + 1}
                        </div>

                        <div className="flex items-center gap-2 mb-2 pr-8">
                          <DealerStatusDot status="active" />
                          <span className="text-white text-sm font-semibold leading-tight">
                            {d.name}
                          </span>
                        </div>
                        <div className="text-charcoal-400 text-xs mb-1">
                          <MapPin size={10} className="inline mr-1 text-gold-500" />
                          {d.city}, {d.state}
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {d._reasons.map((r) => (
                            <span
                              key={r}
                              className="text-xs bg-gold-500/10 text-gold-400 px-1.5 py-0.5 rounded-md border border-gold-500/20"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs text-gold-400">
                            <Star size={10} className="fill-gold-400" />
                            {d.rating}
                          </div>
                          <a
                            href={`tel:${d.phone}`}
                            className="text-xs text-charcoal-400 hover:text-gold-300 transition-colors"
                          >
                            📞 {d.phone}
                          </a>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Search + Filters ───────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-400" />
            <input
              value={rawSearch}
              onChange={(e) => setRawSearch(e.target.value)}
              placeholder="Search name, city, phone… (debounced)"
              className="input-dark w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
            />
            {rawSearch && (
              <button
                onClick={() => setRawSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-500 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="input-dark px-4 py-2.5 rounded-xl text-sm min-w-[130px]"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="input-dark px-4 py-2.5 rounded-xl text-sm min-w-[160px]"
          >
            <option value="All">All States</option>
            {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-3 text-xs text-charcoal-500">
          <span>
            {loading ? "Loading..." : `${filtered.length} dealer${filtered.length !== 1 ? "s" : ""} found`}
            {search && <> for &ldquo;<span className="text-gold-400">{search}</span>&rdquo;</>}
          </span>
          {(search || stateFilter !== "All" || statusFilter !== "all") && (
            <button
              onClick={() => { setRawSearch(""); setStateFilter("All"); setStatusFilter("all"); }}
              className="text-charcoal-400 hover:text-red-400 flex items-center gap-1 transition-colors"
            >
              <X size={11} /> Clear filters
            </button>
          )}
        </div>

        {/* ── Dealers Table ──────────────────────────────────────────────────── */}
        <div className="glass-dark rounded-2xl border border-white/5 overflow-hidden">
          {loading ? (
            /* Skeleton */
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4 items-center py-3">
                  <div className="skeleton w-3 h-3 rounded-full flex-shrink-0" />
                  <div className="skeleton h-4 flex-1 rounded-lg" />
                  <div className="skeleton h-4 w-32 rounded-lg hidden md:block" />
                  <div className="skeleton h-4 w-24 rounded-lg hidden lg:block" />
                  <div className="skeleton h-6 w-16 rounded-full" />
                  <div className="skeleton h-4 w-20 rounded-lg" />
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    {["Dealer", "Location", "Specialization", "Car Types", "Rating", "Status", "Updated", "Actions"].map(
                      (h, i) => (
                        <th
                          key={h}
                          className={`text-left py-3.5 px-4 text-charcoal-400 text-xs font-semibold uppercase tracking-wider ${
                            i === 0 ? "px-5" :
                            i === 2 ? "hidden lg:table-cell" :
                            i === 3 ? "hidden xl:table-cell" :
                            i === 1 ? "hidden md:table-cell" :
                            i === 6 ? "hidden xl:table-cell" : ""
                          } ${i === 7 ? "text-right px-5" : ""}`}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {paginated.map((dealer) => (
                      <DealerTableRow
                        key={dealer.id}
                        dealer={dealer}
                        isNew={newIds.has(dealer.id!)}
                        onEdit={openEditModal}
                        onDelete={handleDelete}
                        onToggleStatus={handleToggleStatus}
                      />
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>

              {paginated.length === 0 && (
                <div className="py-16 text-center">
                  <Filter size={40} className="text-charcoal-700 mx-auto mb-3" />
                  <p className="text-charcoal-400">
                    {allDealers.length === 0
                      ? "No dealers yet — add the first one!"
                      : "No dealers match your filters"}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Pagination ─────────────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-5">
            <p className="text-charcoal-500 text-xs">
              Showing {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 glass rounded-xl flex items-center justify-center border border-white/10 text-charcoal-300 disabled:opacity-30 hover:border-gold-500/30 transition-all"
              >
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                const pg = i + 1;
                return (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className={`w-8 h-8 rounded-xl text-sm font-medium transition-all ${
                      page === pg
                        ? "btn-gold"
                        : "glass border border-white/10 text-charcoal-400 hover:border-gold-500/30"
                    }`}
                  >
                    {pg}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 glass rounded-xl flex items-center justify-center border border-white/10 text-charcoal-300 disabled:opacity-30 hover:border-gold-500/30 transition-all"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ── Add / Edit Modal ───────────────────────────────────────────────── */}
        <AnimatePresence>
          {showAddModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
              onClick={closeModal}
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                onClick={(e) => e.stopPropagation()}
                className="glass-dark rounded-3xl p-8 w-full max-w-lg border border-gold-500/20 shadow-2xl max-h-[90vh] overflow-y-auto"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-white font-display font-bold text-xl">
                      {editDealer ? "Edit Dealer" : "Add New Dealer"}
                    </h2>
                    <p className="text-charcoal-500 text-xs mt-0.5">
                      {editDealer
                        ? "Changes reflect live instantly"
                        : "Will appear in table immediately"}
                    </p>
                  </div>
                  <button
                    onClick={closeModal}
                    className="w-9 h-9 glass rounded-xl flex items-center justify-center border border-white/10 text-charcoal-400 hover:text-white transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  {[
                    { label: "Business Name *", field: "name", placeholder: "Auto shop name", icon: null },
                    { label: "Contact Person", field: "contactPerson", placeholder: "Owner/Manager name", icon: null },
                    { label: "Phone Number *", field: "phone", placeholder: "10-digit mobile", icon: Phone },
                    { label: "Email", field: "email", placeholder: "dealer@email.com", icon: Mail },
                    { label: "City *", field: "city", placeholder: "City", icon: MapPin },
                    { label: "Specialization (comma separated)", field: "specialization", placeholder: "Body Repair, Painting, Mechanical" },
                    { label: "Car Types (comma separated)", field: "carTypes", placeholder: "Sedan, SUV, EV" },
                  ].map(({ label, field, placeholder }) => (
                    <div key={field}>
                      <label className="text-charcoal-300 text-xs font-medium block mb-1.5">
                        {label}
                      </label>
                      <input
                        value={(formData as Record<string, string | number>)[field] as string}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, [field]: e.target.value }))
                        }
                        placeholder={placeholder}
                        className="input-dark w-full px-4 py-2.5 rounded-xl text-sm"
                      />
                    </div>
                  ))}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-charcoal-300 text-xs font-medium block mb-1.5">State</label>
                      <select
                        value={formData.state}
                        onChange={(e) => setFormData((p) => ({ ...p, state: e.target.value }))}
                        className="input-dark w-full px-4 py-2.5 rounded-xl text-sm"
                      >
                        {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-charcoal-300 text-xs font-medium block mb-1.5">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value as "active" | "inactive" }))}
                        className="input-dark w-full px-4 py-2.5 rounded-xl text-sm"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-charcoal-300 text-xs font-medium block mb-1.5">
                      Rating (1–5)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={1}
                        max={5}
                        step={0.1}
                        value={formData.rating}
                        onChange={(e) => setFormData((p) => ({ ...p, rating: Number(e.target.value) }))}
                        className="flex-1 accent-yellow-500"
                      />
                      <span className="text-gold-400 font-bold text-sm w-8 text-right">
                        {formData.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-charcoal-300 text-xs font-medium block mb-1.5 flex items-center gap-1">
                      <StickyNote size={11} /> Notes (internal)
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                      placeholder="Internal notes about this dealer..."
                      rows={2}
                      className="input-dark w-full px-4 py-2.5 rounded-xl text-sm resize-none"
                    />
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleSave}
                    className="btn-gold flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                  >
                    <Save size={15} />
                    {editDealer ? "Save Changes" : "Add Dealer"}
                  </button>
                  <button
                    onClick={closeModal}
                    className="glass flex-1 py-3 rounded-xl text-sm text-charcoal-300 border border-white/10 hover:border-gold-500/30 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
