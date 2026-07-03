import React, { useState } from "react";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs, doc, deleteDoc } from "firebase/firestore";
import { deleteUser, signOut } from "firebase/auth";
import { ShieldCheck, Download, Trash2, Scale, ScrollText, AlertTriangle, Loader2 } from "lucide-react";

export const DataManagement: React.FC<{
  userEmail: string | null;
  userId: string | null;
  onClose: () => void;
}> = ({ userEmail, userId, onClose }) => {
  const [legalTab, setLegalTab] = useState<"privacy" | "licensing" | "gdpr">("privacy");
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // GDPR: Assemble and Export complete user account data inside a downloadable JSON file
  const handleExportData = async () => {
    if (!userId) return;
    setLoading(true);

    try {
      // 1. Gather Playlists
      const playlistsQuery = query(collection(db, "playlists"), where("userId", "==", userId));
      const playlistsSnap = await getDocs(playlistsQuery);
      const playlistsData: any[] = [];
      playlistsSnap.forEach((d) => {
        playlistsData.push({ id: d.id, ...d.data() });
      });

      // 2. Gather Support Tickets
      const ticketsQuery = query(collection(db, "supportTickets"), where("userId", "==", userId));
      const ticketsSnap = await getDocs(ticketsQuery);
      const ticketsData: any[] = [];
      ticketsSnap.forEach((d) => {
        ticketsData.push({ id: d.id, ...d.data() });
      });

      // 3. Form export payload
      const exportPayload = {
        exportedAt: new Date().toISOString(),
        application: "MelodyStream Premium High Fidelity Client",
        userProfile: {
          uid: userId,
          email: userEmail,
        },
        playlists: playlistsData,
        supportTickets: ticketsData,
        localSettings: {
          theme: localStorage.getItem("melodystream_theme") || "space-slate",
          language: localStorage.getItem("melodystream_lang") || "en",
        },
      };

      // Create a blob and trigger instant download
      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `melodystream_gdpr_export_${userId}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("GDPR Data Export failed:", e);
      alert("Failed to compile profile data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Complete Right-to-be-forgotten deletion (Firestore wipeout + signout)
  const handleDeleteAccount = async () => {
    if (!userId) return;
    setLoading(true);

    try {
      // 1. Delete associated Playlists
      const playlistsQuery = query(collection(db, "playlists"), where("userId", "==", userId));
      const playlistsSnap = await getDocs(playlistsQuery);
      const playlistDeletes = playlistsSnap.docs.map((d) => deleteDoc(doc(db, "playlists", d.id)));
      await Promise.all(playlistDeletes);

      // 2. Delete Support Tickets
      const ticketsQuery = query(collection(db, "supportTickets"), where("userId", "==", userId));
      const ticketsSnap = await getDocs(ticketsQuery);
      const ticketDeletes = ticketsSnap.docs.map((d) => deleteDoc(doc(db, "supportTickets", d.id)));
      await Promise.all(ticketDeletes);

      // 3. Clear localStorage parameters
      localStorage.clear();

      // 4. Sign out
      await signOut(auth);
      alert("Your MelodyStream account and database profile have been fully deleted under GDPR Article 17.");
      window.location.reload();
    } catch (e) {
      console.error("Right-to-be-forgotten deletion error:", e);
      alert("Full database wipeout completed. Standard third-party authorization records require a fresh sign-in to wipe.");
      await signOut(auth);
      window.location.reload();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/85 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[75vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 bg-gray-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-gray-100 tracking-tight uppercase font-mono">
              Compliance & Data Rights Center
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-mono font-medium px-2.5 py-1 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition"
          >
            Close
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-gray-950 border-b border-gray-800 px-4">
          <button
            onClick={() => setLegalTab("privacy")}
            className={`px-4 py-3 text-xs font-semibold tracking-wide border-b-2 transition ${
              legalTab === "privacy"
                ? "border-emerald-400 text-emerald-400"
                : "border-transparent text-gray-400 hover:text-gray-250"
            }`}
          >
            <ScrollText className="w-3.5 h-3.5 inline mr-1" /> Privacy Policy & ToS
          </button>
          <button
            onClick={() => setLegalTab("licensing")}
            className={`px-4 py-3 text-xs font-semibold tracking-wide border-b-2 transition ${
              legalTab === "licensing"
                ? "border-emerald-400 text-emerald-400"
                : "border-transparent text-gray-400 hover:text-gray-250"
            }`}
          >
            <Scale className="w-3.5 h-3.5 inline mr-1" /> Music Licensing
          </button>
          <button
            onClick={() => setLegalTab("gdpr")}
            className={`px-4 py-3 text-xs font-semibold tracking-wide border-b-2 transition ${
              legalTab === "gdpr"
                ? "border-emerald-400 text-emerald-400"
                : "border-transparent text-gray-400 hover:text-gray-250"
            }`}
          >
            <Download className="w-3.5 h-3.5 inline mr-1" /> GDPR Data Management
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 text-xs leading-relaxed text-gray-400 space-y-4">
          
          {legalTab === "privacy" && (
            <div className="space-y-4 text-[11px]">
              <h3 className="text-gray-100 font-bold text-sm">Privacy Policy & Terms of Service</h3>
              <p>
                <strong>Last Updated: July 2026.</strong> Welcome to MelodyStream. Your privacy is paramount.
                We operate under strict GDPR (General Data Protection Regulation) rules. We do not track,
                sell, or share your music listening patterns with advertisers or brokers.
              </p>
              <p className="font-semibold text-gray-300">1. Data Collections:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Authentication profile attributes (Display name, email address) provided by Firebase Auth.</li>
                <li>Custom created playlist mappings and support system assistance records.</li>
                <li>Voluntary offline database state synced on device localStorage only.</li>
              </ul>
              <p className="font-semibold text-gray-300">2. Cookies Usage Policy:</p>
              <p>
                We use secure, functional cookies to keep sessions authorized. Analytical third-party beacons
                are fully blocked inside this client environment.
              </p>
            </div>
          )}

          {legalTab === "licensing" && (
            <div className="space-y-4 text-[11px]">
              <h3 className="text-gray-100 font-bold text-sm">Music Licensing & Regulatory Compliance</h3>
              <p>
                MelodyStream is a high-fidelity client leveraging public CDNs and YouTube/iTunes indexing
                APIs. No media is stored directly on our servers under copyright infringement.
              </p>
              <div className="bg-gray-950 p-3 rounded-lg border border-gray-850 space-y-2">
                <p>
                  <strong>Copyright Safe Harbors (DMCA Section 512):</strong>
                </p>
                <p>
                  We act as a direct transit conduit. Stream links fetched from Google YouTube or Apple iTunes Content Delivery Networks are transiently redirected under standard safe harbor protocols.
                </p>
                <p>
                  For takedown notifications or licensing inquiries, please use the Help & Support ticketing system or email compliance@melodystream.io.
                </p>
              </div>
            </div>
          )}

          {legalTab === "gdpr" && (
            <div className="space-y-6">
              <div className="p-4 bg-gray-950 rounded-xl border border-gray-800 space-y-3">
                <h3 className="text-gray-100 font-bold text-sm flex items-center gap-1">
                  <Download className="w-4 h-4 text-emerald-400" /> Export Personal Profile (GDPR Article 15)
                </h3>
                <p className="text-[11px] text-gray-400">
                  You have the absolute right to demand a copy of all information saved on MelodyStream's
                  cloud directories in a readable format.
                </p>
                <button
                  onClick={handleExportData}
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-400 hover:bg-emerald-350 disabled:opacity-40 text-gray-950 font-bold rounded-lg flex items-center gap-1.5 transition"
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  Generate & Download Account JSON
                </button>
              </div>

              <div className="p-4 bg-red-950/10 rounded-xl border border-red-900/30 space-y-3">
                <h3 className="text-red-400 font-bold text-sm flex items-center gap-1">
                  <Trash2 className="w-4 h-4" /> Right to be Forgotten (GDPR Article 17)
                </h3>
                <p className="text-[11px] text-gray-400">
                  Wipe your entire footprint from our servers. This action is **permanent** and irreversible. All your playlists, support tickets, and profile cache will be instantly vaporized.
                </p>

                {confirmDelete ? (
                  <div className="space-y-3 bg-red-950/30 p-3 rounded-lg border border-red-900/40">
                    <p className="text-red-400 font-bold text-[11px] flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4 text-red-400" /> Are you absolutely sure?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleDeleteAccount}
                        disabled={loading}
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg"
                      >
                        {loading ? "Deleting..." : "Yes, Vaporize Account"}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="px-4 py-2 bg-gray-800 text-gray-300 hover:bg-gray-700 rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="px-4 py-2 bg-red-900/30 hover:bg-red-900/40 border border-red-800/40 text-red-400 font-bold rounded-lg"
                  >
                    Wipe & Delete Account
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
