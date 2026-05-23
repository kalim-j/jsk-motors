"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { writeBatch, doc, collection, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function ImportDealersPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const parseSQL = (sqlText: string) => {
    // Find the VALUES part
    const valuesIndex = sqlText.indexOf("VALUES");
    if (valuesIndex === -1) {
      throw new Error("No VALUES keyword found in the SQL script.");
    }
    
    let valuesPart = sqlText.substring(valuesIndex + 6).trim();
    if (valuesPart.endsWith(";")) {
      valuesPart = valuesPart.slice(0, -1);
    }

    // A simple regex to match tuples, accounting for potential nested quotes or escaped quotes
    // This splits the values part into individual row strings
    const rows = [];
    let currentRow = "";
    let inString = false;
    let depth = 0;

    for (let i = 0; i < valuesPart.length; i++) {
      const char = valuesPart[i];
      if (char === "'" && valuesPart[i - 1] !== "\\") {
        inString = !inString;
      }

      if (!inString) {
        if (char === "(") {
          depth++;
          if (depth === 1) continue; // Skip the outermost opening parenthesis
        } else if (char === ")") {
          depth--;
          if (depth === 0) {
            rows.push(currentRow);
            currentRow = "";
            continue;
          }
        } else if (char === "," && depth === 0) {
          continue; // Skip commas between tuples
        }
      }
      
      if (depth > 0) {
        currentRow += char;
      }
    }

    const dealers = rows.map((row) => {
      // Split by comma, but only outside of strings
      const cols = [];
      let currentCol = "";
      let inStr = false;
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === "'") {
          inStr = !inStr;
        } else if (char === "," && !inStr) {
          cols.push(currentCol.trim());
          currentCol = "";
          continue;
        }
        currentCol += char;
      }
      cols.push(currentCol.trim());

      // Clean up string quotes and escaped single quotes
      const cleanCol = (col: string) => {
        let cleaned = col;
        if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
          cleaned = cleaned.substring(1, cleaned.length - 1);
        }
        return cleaned.replace(/''/g, "'").trim();
      };

      return {
        name: cleanCol(cols[0] || ""),
        address: cleanCol(cols[1] || ""),
        city: cleanCol(cols[2] || ""),
        state: cleanCol(cols[3] || ""),
        phone: cleanCol(cols[4] || ""),
        email: cleanCol(cols[5] || ""),
        source: cleanCol(cols[6] || ""),
      };
    });

    return dealers.filter(d => d.name);
  };

  const handleImport = async () => {
    if (!file) return;

    try {
      setLoading(true);
      const text = await file.text();
      const parsedDealers = parseSQL(text);
      
      setTotal(parsedDealers.length);
      setProgress(0);

      // Firestore allows max 500 writes per batch
      const BATCH_SIZE = 450; 
      
      for (let i = 0; i < parsedDealers.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const chunk = parsedDealers.slice(i, i + BATCH_SIZE);
        
        chunk.forEach(dealerData => {
          const newDocRef = doc(collection(db, "dealers"));
          
          batch.set(newDocRef, {
            name: dealerData.name,
            contactPerson: "",
            phone: dealerData.phone,
            email: dealerData.email || "",
            city: dealerData.city,
            state: dealerData.state,
            specialization: ["Body Shop", "Repairs"],
            carTypes: ["All"],
            rating: 5,
            status: "active",
            notes: `Address: ${dealerData.address.replace(/\|\|/g, ", ")}\nSource: ${dealerData.source}`,
            createdAt: serverTimestamp(),
            lastUpdated: serverTimestamp(),
            activityLog: [
              {
                action: "added",
                timestamp: new Date(),
                details: "Imported via SQL upload",
              },
            ],
          });
        });

        await batch.commit();
        setProgress(Math.min(i + BATCH_SIZE, parsedDealers.length));
      }

      toast.success(`Successfully imported ${parsedDealers.length} dealers!`);
      router.push("/admin/dealers");
    } catch (error: any) {
      console.error("Import error:", error);
      toast.error(error.message || "Failed to import dealers");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Import Dealers</h1>
          <p className="text-muted-foreground mt-2">
            Upload an SQL file containing dealer INSERT statements to bulk import them into Firestore.
          </p>
        </div>
      </div>

      <div className="bg-card border rounded-xl p-8 shadow-sm">
        <div className="space-y-6">
          
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-10 flex flex-col items-center justify-center bg-muted/10 transition-colors hover:bg-muted/20">
            <input 
              type="file" 
              accept=".sql,.txt" 
              onChange={handleFileChange} 
              className="hidden" 
              id="file-upload" 
              disabled={loading}
            />
            <label 
              htmlFor="file-upload" 
              className="flex flex-col items-center cursor-pointer text-center"
            >
              {file ? (
                <FileText className="h-12 w-12 text-primary mb-4" />
              ) : (
                <Upload className="h-12 w-12 text-muted-foreground mb-4" />
              )}
              
              <span className="text-lg font-medium">
                {file ? file.name : "Click to select a file"}
              </span>
              <span className="text-sm text-muted-foreground mt-1">
                {file ? `${(file.size / 1024).toFixed(1)} KB` : "Supports .sql or .txt formats"}
              </span>
            </label>
          </div>

          {loading && total > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>Importing...</span>
                <span>{progress} / {total}</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${(progress / total) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-4 pt-4">
            <button
              onClick={() => router.back()}
              disabled={loading}
              className="px-4 py-2 rounded-md border font-medium hover:bg-muted transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!file || loading}
              className="flex items-center gap-2 px-6 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importing
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Start Import
                </>
              )}
            </button>
          </div>

        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4 flex gap-3">
        <AlertCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800 dark:text-blue-300">
          <p className="font-medium mb-1">Important Instructions:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Save the complete SQL INSERT query to a file named <strong>dealers.sql</strong></li>
            <li>The script expects the standard format: <code>INSERT INTO dealers (...) VALUES ('...'), ('...');</code></li>
            <li>Address fields with <code>||</code> will be formatted with commas.</li>
            <li>The import uses batched writes (up to 450 per batch) to ensure reliability.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
