"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, X, Upload, Loader2, Image as ImageIcon } from "lucide-react";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, orderBy, query } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { toast } from "react-hot-toast";
import { ReactCompareSlider, ReactCompareSliderImage } from "react-compare-slider";

interface RepairEntry {
  id?: string;
  carName: string;
  description: string;
  date: string;
  cost: string;
  beforeImages: string[];
  afterImages: string[];
  createdAt: Date | string;
}

export default function RepairShowcaseAdmin() {
  const [repairs, setRepairs] = useState<RepairEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    carName: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    cost: "",
  });
  
  const [beforeFiles, setBeforeFiles] = useState<File[]>([]);
  const [afterFiles, setAfterFiles] = useState<File[]>([]);
  const [beforeImageUrls, setBeforeImageUrls] = useState<string[]>([]);
  const [afterImageUrls, setAfterImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchRepairs();
  }, []);

  const fetchRepairs = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "repairs"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const data: RepairEntry[] = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as RepairEntry);
      });
      setRepairs(data);
    } catch (error) {
      console.error("Error fetching repairs:", error);
      toast.error("Failed to load repairs");
    } finally {
      setLoading(false);
    }
  };

  const uploadImages = async (files: File[], folder: string) => {
    const urls: string[] = [];
    for (const file of files) {
      const storageRef = ref(storage, `repairs/${folder}/${Date.now()}_${file.name}`);
      const uploadTask = await uploadBytesResumable(storageRef, file);
      const url = await getDownloadURL(uploadTask.ref);
      urls.push(url);
    }
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUploading(true);
      
      let finalBeforeUrls = [...beforeImageUrls];
      let finalAfterUrls = [...afterImageUrls];

      if (beforeFiles.length > 0) {
        const newBeforeUrls = await uploadImages(beforeFiles, "before");
        finalBeforeUrls = [...finalBeforeUrls, ...newBeforeUrls];
      }
      
      if (afterFiles.length > 0) {
        const newAfterUrls = await uploadImages(afterFiles, "after");
        finalAfterUrls = [...finalAfterUrls, ...newAfterUrls];
      }

      const repairData = {
        ...formData,
        beforeImages: finalBeforeUrls,
        afterImages: finalAfterUrls,
        updatedAt: new Date(),
      };

      if (editingId) {
        await updateDoc(doc(db, "repairs", editingId), repairData);
        toast.success("Repair entry updated!");
      } else {
        await addDoc(collection(db, "repairs"), {
          ...repairData,
          createdAt: new Date(),
        });
        toast.success("Repair entry created!");
      }

      closeModal();
      fetchRepairs();
    } catch (error) {
      console.error("Error saving repair:", error);
      toast.error("Failed to save repair entry");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;
    try {
      await deleteDoc(doc(db, "repairs", id));
      toast.success("Entry deleted");
      fetchRepairs();
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Failed to delete entry");
    }
  };

  const openModal = (repair?: RepairEntry) => {
    if (repair) {
      setFormData({
        carName: repair.carName,
        description: repair.description,
        date: repair.date,
        cost: repair.cost || "",
      });
      setBeforeImageUrls(repair.beforeImages || []);
      setAfterImageUrls(repair.afterImages || []);
      setEditingId(repair.id!);
    } else {
      setFormData({
        carName: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
        cost: "",
      });
      setBeforeImageUrls([]);
      setAfterImageUrls([]);
      setEditingId(null);
    }
    setBeforeFiles([]);
    setAfterFiles([]);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setBeforeFiles([]);
    setAfterFiles([]);
  };

  return (
    <div className="min-h-screen bg-black pt-20">
      <div className="container-custom py-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs font-medium mb-3">
              Admin &gt; Showcase
            </div>
            <h1 className="font-display text-3xl font-bold text-white">Repair Showcase</h1>
            <p className="text-charcoal-400 text-sm mt-1">Manage Before & After transformations</p>
          </div>
          <button onClick={() => openModal()} className="btn-gold px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2">
            <Plus size={16} />
            Add Entry
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-gold-500" size={40} />
          </div>
        ) : repairs.length === 0 ? (
          <div className="glass-dark rounded-2xl p-10 text-center border border-white/5">
            <ImageIcon size={48} className="mx-auto text-white/20 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No repair entries yet</h3>
            <p className="text-charcoal-400 text-sm mb-6">Add your first Before & After showcase entry.</p>
            <button onClick={() => openModal()} className="btn-gold px-5 py-2.5 rounded-full text-sm font-bold inline-flex items-center gap-2">
              <Plus size={16} /> Add Entry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {repairs.map((repair) => (
              <motion.div
                key={repair.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-dark rounded-2xl overflow-hidden border border-white/5 group"
              >
                <div className="relative aspect-video w-full">
                  {repair.beforeImages?.length > 0 && repair.afterImages?.length > 0 ? (
                    <ReactCompareSlider
                      itemOne={<ReactCompareSliderImage src={repair.beforeImages[0]} alt="Before" />}
                      itemTwo={<ReactCompareSliderImage src={repair.afterImages[0]} alt="After" />}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-white/5 flex items-center justify-center">
                      <ImageIcon size={32} className="text-white/20" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openModal(repair)} className="p-2 rounded-full bg-white/10 hover:bg-gold-500 hover:text-black backdrop-blur-sm text-white transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(repair.id!)} className="p-2 rounded-full bg-white/10 hover:bg-red-500 hover:text-white backdrop-blur-sm text-white transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-white">{repair.carName}</h3>
                    {repair.cost && <span className="text-gold-400 font-semibold font-display">₹{repair.cost}</span>}
                  </div>
                  <p className="text-charcoal-400 text-sm mb-4 line-clamp-2">{repair.description}</p>
                  <div className="text-xs text-charcoal-500">Repaired on {repair.date}</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">{editingId ? "Edit Showcase" : "Add New Showcase"}</h2>
                  <button onClick={closeModal} className="text-charcoal-400 hover:text-white transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-charcoal-300 mb-1.5">Car Name</label>
                      <input
                        type="text"
                        required
                        value={formData.carName}
                        onChange={(e) => setFormData({ ...formData, carName: e.target.value })}
                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-gold-500/50"
                        placeholder="e.g. BMW M3 G80"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal-300 mb-1.5">Date of Repair</label>
                      <input
                        type="date"
                        required
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-gold-500/50 [color-scheme:dark]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-charcoal-300 mb-1.5">Description of Work</label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-gold-500/50 min-h-[100px]"
                      placeholder="Describe what was repaired or upgraded..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-charcoal-300 mb-1.5">Cost (Optional)</label>
                    <input
                      type="text"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-gold-500/50"
                      placeholder="e.g. 50,000"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Before Images */}
                    <div>
                      <label className="block text-sm font-medium text-charcoal-300 mb-1.5">Before Images</label>
                      <div className="w-full bg-black border border-white/10 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition-colors cursor-pointer relative">
                        <Upload size={20} className="text-gold-400" />
                        <span className="text-xs text-charcoal-400 text-center">Click to upload before images</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files) {
                              setBeforeFiles(Array.from(e.target.files));
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                      </div>
                      {(beforeFiles.length > 0 || beforeImageUrls.length > 0) && (
                        <div className="mt-2 text-xs text-gold-400">
                          {beforeFiles.length > 0 ? `${beforeFiles.length} new files selected` : `${beforeImageUrls.length} existing files`}
                        </div>
                      )}
                    </div>

                    {/* After Images */}
                    <div>
                      <label className="block text-sm font-medium text-charcoal-300 mb-1.5">After Images</label>
                      <div className="w-full bg-black border border-white/10 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition-colors cursor-pointer relative">
                        <Upload size={20} className="text-green-400" />
                        <span className="text-xs text-charcoal-400 text-center">Click to upload after images</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files) {
                              setAfterFiles(Array.from(e.target.files));
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                      </div>
                      {(afterFiles.length > 0 || afterImageUrls.length > 0) && (
                        <div className="mt-2 text-xs text-green-400">
                          {afterFiles.length > 0 ? `${afterFiles.length} new files selected` : `${afterImageUrls.length} existing files`}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                    <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-full text-sm font-medium text-white hover:bg-white/10 transition-colors">
                      Cancel
                    </button>
                    <button type="submit" disabled={uploading} className="btn-gold px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 disabled:opacity-50 min-w-[120px] justify-center">
                      {uploading ? <Loader2 size={16} className="animate-spin" /> : editingId ? "Update" : "Save"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
