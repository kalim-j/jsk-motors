import { useState } from "react";
import { Dealer } from "@/types/dealer";
import { X, Phone, MessageSquare } from "lucide-react";
import { supabase } from "@/lib/supabase";
import CustomSelect from "@/components/ui/CustomSelect";

interface InquiryModalProps {
  dealer: Dealer;
  onClose: () => void;
}

export default function InquiryModal({ dealer, onClose }: InquiryModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    type: "buy",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("dealer_inquiries").insert({
      dealer_id: dealer.id,
      inquirer_name: formData.name,
      phone: formData.phone,
      inquiry_type: formData.type,
      message: formData.message,
    });

    setLoading(false);

    if (error) {
      alert("Failed to send inquiry. Please try again.");
      console.error(error);
    } else {
      setSuccess(true);
    }
  };

  const handleWhatsApp = () => {
    if (!dealer.whatsapp && !dealer.phone) return;
    
    const phone = (dealer.whatsapp || dealer.phone)?.replace(/\D/g, '');
    const text = `Hi ${dealer.name}, I found you on JSK Car Body Shop. I'm interested in: ${formData.type.replace('_', ' ')}. ${formData.message}`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-charcoal-950 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden relative animate-fade-in">
        <div className="flex justify-between items-center p-6 border-b border-white/10 bg-black/50">
          <div>
            <h3 className="text-xl font-bold text-white">Contact {dealer.name}</h3>
            <p className="text-sm text-charcoal-400">{dealer.city}, {dealer.state}</p>
          </div>
          <button onClick={onClose} className="text-charcoal-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
              <MessageSquare size={32} />
            </div>
            <h4 className="text-2xl font-bold text-white mb-2">Inquiry Sent!</h4>
            <p className="text-charcoal-300 mb-6">
              The dealer has received your details and will contact you shortly. You can also reach out to them directly.
            </p>
            
            <div className="flex flex-col gap-3">
              {dealer.phone && (
                <a href={`tel:${dealer.phone}`} className="btn-outline-gold py-3 rounded-xl flex items-center justify-center gap-2 font-bold">
                  <Phone size={18} /> Call {dealer.phone}
                </a>
              )}
              {(dealer.whatsapp || dealer.phone) && (
                <button onClick={handleWhatsApp} className="bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-colors">
                  <MessageSquare size={18} /> Continue on WhatsApp
                </button>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal-400 uppercase tracking-wider mb-2">Your Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-black border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:border-gold-500/50 outline-none"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-charcoal-400 uppercase tracking-wider mb-2">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-black border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:border-gold-500/50 outline-none"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-400 uppercase tracking-wider mb-2">Inquiry Type</label>
              <CustomSelect
                value={formData.type}
                onChange={(v) => setFormData({ ...formData, type: v })}
                options={[
                  { value: "buy", label: "Buy a Car" },
                  { value: "sell", label: "Sell a Car" },
                  { value: "spare_parts", label: "Spare Parts" },
                  { value: "service", label: "Body Shop / Service" },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-400 uppercase tracking-wider mb-2">Message</label>
              <textarea
                required
                rows={3}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-gold-500/50 outline-none resize-none"
                placeholder="Hi, I am looking for..."
              />
            </div>

            <div className="pt-4 flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors font-semibold text-sm text-charcoal-300">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="flex-1 btn-gold py-3 rounded-xl font-bold text-black disabled:opacity-50 text-sm">
                {loading ? "Sending..." : "Send Inquiry"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
