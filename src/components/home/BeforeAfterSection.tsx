import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { ReactCompareSlider, ReactCompareSliderImage } from "react-compare-slider";
import { subscribeToRepairs, RepairEntry } from "@/lib/firestore";

export default function BeforeAfterSection() {
  const [repairs, setRepairs] = useState<RepairEntry[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  useEffect(() => {
    // Listen to real-time additions from admin
    const unsubscribe = subscribeToRepairs((data) => {
      setRepairs(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading || repairs.length === 0) return null;

  const active = repairs[activeIndex];

  return (
    <section className="section-padding bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(212,175,55,0.06),transparent_60%)] pointer-events-none" />

      <div className="container-custom relative z-10">
        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold-500/30 text-gold-400 text-sm font-medium mb-6">
            Real Results
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-white mb-6">
            Before & After{" "}
            <span className="gold-text">Transformation</span>
          </h2>
          <p className="text-charcoal-400 max-w-xl mx-auto">
            Slide to see the incredible transformations we achieve. Every car
            gets the royal treatment.
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {repairs.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => setActiveIndex(idx)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activeIndex === idx
                  ? "btn-gold"
                  : "glass text-charcoal-300 hover:text-white border border-white/10 hover:border-gold-500/30"
              }`}
            >
              {item.carName}
            </button>
          ))}
        </div>

        <motion.div
          key={active.id}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="grid lg:grid-cols-3 gap-8 items-center"
        >
          {/* Comparison Slider */}
          <div className="lg:col-span-2 relative">
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              <ReactCompareSlider
                itemOne={
                  <ReactCompareSliderImage
                    src={active.beforeImages[0] || ""}
                    alt="Before restoration"
                    style={{ objectFit: "cover" }}
                  />
                }
                itemTwo={
                  <ReactCompareSliderImage
                    src={active.afterImages[0] || ""}
                    alt="After restoration"
                    style={{ objectFit: "cover" }}
                  />
                }
                style={{ height: "420px" }}
              />
            </div>
            {/* Labels */}
            <div className="absolute top-4 left-4 bg-black/70 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm border border-red-500/30 text-red-400">
              BEFORE
            </div>
            <div className="absolute top-4 right-4 bg-black/70 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm border border-green-500/30 text-green-400">
              AFTER
            </div>
          </div>

          {/* Info Card */}
          <div className="glass-dark rounded-2xl p-8 border border-gold-500/15">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold-500/30 text-gold-400 text-xs font-medium mb-6">
              Full Restoration
            </div>
            <h3 className="font-display text-2xl font-bold text-white mb-4">
              {active.carName}
            </h3>
            <p className="text-charcoal-400 text-sm leading-relaxed mb-6">
              {active.description}
            </p>

            <div className="space-y-3 mb-8">
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-charcoal-400 text-sm">Completion Date</span>
                <span className="text-gold-400 font-semibold">{active.date}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-charcoal-400 text-sm">Work Type</span>
                <span className="text-white font-medium">Body & Paint</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-charcoal-400 text-sm">Cost Estimate</span>
                <span className="text-green-400 font-medium">{active.cost ? `₹${active.cost}` : "Custom Quote"}</span>
              </div>
            </div>

            <a
              href="tel:7010587940"
              className="btn-gold w-full py-3 rounded-full text-sm font-bold text-center block"
            >
              Book Similar Service
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
