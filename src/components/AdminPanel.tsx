import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  ShieldAlert,
  CheckCircle,
  MessageSquare,
  Trash2,
  ListMusic,
  Plus,
  Tv,
  Settings2,
  RefreshCw,
  HelpCircle,
  Activity,
} from "lucide-react";

interface Ticket {
  id: string;
  userId: string;
  email: string;
  subject: string;
  message: string;
  status: "Open" | "In-Progress" | "Resolved";
  createdAt?: any;
  adminReply?: string;
}

interface CuratedTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  audioUrl: string;
  coverUrl: string;
}

export const AdminPanel: React.FC<{
  onClose: () => void;
  featureFlags: {
    gapless: boolean;
    aiDJ: boolean;
    hdAudio: boolean;
  };
  setFeatureFlags: React.Dispatch<
    React.SetStateAction<{
      gapless: boolean;
      aiDJ: boolean;
      hdAudio: boolean;
    }>
  >;
}> = ({ onClose, featureFlags, setFeatureFlags }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<"tickets" | "curation" | "flags">("tickets");
  const [replyText, setReplyText] = useState<{ [ticketId: string]: string }>({});
  const [curatedTracks, setCuratedTracks] = useState<CuratedTrack[]>([]);
  const [curationForm, setCurationForm] = useState({
    title: "",
    artist: "",
    album: "",
    audioUrl: "",
    coverUrl: "",
  });

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "supportTickets"));
      const snapshot = await getDocs(q);
      const fetched: Ticket[] = [];
      snapshot.forEach((docSnapshot) => {
        fetched.push({ id: docSnapshot.id, ...docSnapshot.data() } as Ticket);
      });
      // Sort: Open first
      fetched.sort((a, b) => {
        if (a.status === "Open" && b.status !== "Open") return -1;
        if (a.status !== "Open" && b.status === "Open") return 1;
        return 0;
      });
      setTickets(fetched);
    } catch (err) {
      console.error("Error fetching support tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleUpdateStatus = async (ticketId: string, newStatus: Ticket["status"]) => {
    try {
      const ticketRef = doc(db, "supportTickets", ticketId);
      await updateDoc(ticketRef, { status: newStatus });
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
      );
    } catch (err) {
      console.error("Error updating ticket status:", err);
    }
  };

  const handleSendReply = async (ticketId: string) => {
    const text = replyText[ticketId];
    if (!text || !text.trim()) return;

    try {
      const ticketRef = doc(db, "supportTickets", ticketId);
      await updateDoc(ticketRef, {
        adminReply: text.trim(),
        status: "Resolved",
      });
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId ? { ...t, adminReply: text.trim(), status: "Resolved" } : t
        )
      );
      setReplyText((prev) => ({ ...prev, [ticketId]: "" }));
    } catch (err) {
      console.error("Error sending admin response:", err);
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    try {
      await deleteDoc(doc(db, "supportTickets", ticketId));
      setTickets((prev) => prev.filter((t) => t.id !== ticketId));
    } catch (err) {
      console.error("Error deleting support ticket:", err);
    }
  };

  const handleAddCurated = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!curationForm.title || !curationForm.artist) return;
    try {
      const videoId = `curated-${Date.now()}`;
      const newTrack: CuratedTrack = {
        id: videoId,
        title: curationForm.title,
        artist: curationForm.artist,
        album: curationForm.album || "Editorial Exclusive",
        duration: "03:15",
        audioUrl: curationForm.audioUrl || `https://itunes.apple.com/search?term=pop`, // fallback
        coverUrl: curationForm.coverUrl || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=300",
      };

      // Also persist to a separate "curatedTracks" collection in Firestore for shared access!
      await addDoc(collection(db, "curatedTracks"), {
        ...newTrack,
        createdAt: serverTimestamp(),
      });

      setCuratedTracks((prev) => [newTrack, ...prev]);
      setCurationForm({ title: "", artist: "", album: "", audioUrl: "", coverUrl: "" });
      alert("Track added to Curated/Editorial Pipeline successfully!");
    } catch (e) {
      console.error("Curation add track error:", e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-md p-4">
      <div className="w-full max-w-4xl bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 bg-gray-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
            <h2 className="text-lg font-bold text-gray-100 tracking-tight">
              MelodyStream HQ Administration & Editorial Hub
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-mono font-medium px-3 py-1 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition"
          >
            Close Dashboard
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-gray-950 border-b border-gray-800 px-4">
          <button
            onClick={() => setActiveSubTab("tickets")}
            className={`px-4 py-3 text-xs font-semibold tracking-wide border-b-2 transition ${
              activeSubTab === "tickets"
                ? "border-emerald-400 text-emerald-400 bg-gray-900/50"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            Support Inbox ({tickets.length})
          </button>
          <button
            onClick={() => setActiveSubTab("curation")}
            className={`px-4 py-3 text-xs font-semibold tracking-wide border-b-2 transition ${
              activeSubTab === "curation"
                ? "border-emerald-400 text-emerald-400 bg-gray-900/50"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            Editorial Pipeline Curation
          </button>
          <button
            onClick={() => setActiveSubTab("flags")}
            className={`px-4 py-3 text-xs font-semibold tracking-wide border-b-2 transition ${
              activeSubTab === "flags"
                ? "border-emerald-400 text-emerald-400 bg-gray-900/50"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            Beta Feature Switches
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-900 text-gray-300">
          
          {/* Sub-Tab 1: Tickets Support */}
          {activeSubTab === "tickets" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  Manage incoming customer assistance tickets live from the <code>supportTickets</code> collection.
                </p>
                <button
                  onClick={fetchTickets}
                  className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-emerald-400 transition"
                  title="Reload tickets"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
                </div>
              ) : tickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <CheckCircle className="w-12 h-12 text-emerald-500/30 mb-2" />
                  <p className="text-sm font-semibold text-gray-300">Clean Support Queue!</p>
                  <p className="text-xs text-gray-500 mt-1">No pending customer feedback tickets currently.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {tickets.map((t) => (
                    <div
                      key={t.id}
                      className="p-4 bg-gray-950/70 border border-gray-800 rounded-xl space-y-3 shadow-inner"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full ${
                                t.status === "Open"
                                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                  : t.status === "In-Progress"
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              }`}
                            >
                              {t.status}
                            </span>
                            <span className="text-xs font-mono text-gray-400">
                              Ticket ID: {t.id.slice(0, 8)}...
                            </span>
                          </div>
                          <h4 className="font-bold text-gray-200 mt-1 text-sm">
                            {t.subject || "No Subject Specified"}
                          </h4>
                          <p className="text-xs text-emerald-400 font-medium">
                            From: {t.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <select
                            value={t.status}
                            onChange={(e) =>
                              handleUpdateStatus(t.id, e.target.value as Ticket["status"])
                            }
                            className="bg-gray-900 border border-gray-700 text-xs px-2 py-1 rounded-lg text-gray-200 focus:outline-none"
                          >
                            <option value="Open">Set Open</option>
                            <option value="In-Progress">Set In-Progress</option>
                            <option value="Resolved">Set Resolved</option>
                          </select>
                          <button
                            onClick={() => handleDeleteTicket(t.id)}
                            className="p-1 text-gray-500 hover:text-red-400 rounded-md transition"
                            title="Delete Ticket"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-gray-300 leading-relaxed bg-gray-900/60 p-3 rounded-lg border border-gray-800 font-serif">
                        "{t.message}"
                      </p>

                      {t.adminReply && (
                        <div className="pl-4 border-l-2 border-emerald-400 bg-emerald-500/5 p-3 rounded-r-lg space-y-1">
                          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                            Sent Admin Answer:
                          </p>
                          <p className="text-xs italic text-gray-300">
                            "{t.adminReply}"
                          </p>
                        </div>
                      )}

                      {/* Reply Input Form */}
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="Type customer reply here (sends mail & resolves ticket)..."
                          value={replyText[t.id] || ""}
                          onChange={(e) =>
                            setReplyText((prev) => ({ ...prev, [t.id]: e.target.value }))
                          }
                          className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-100 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                        />
                        <button
                          onClick={() => handleSendReply(t.id)}
                          className="bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold px-3 py-1.5 rounded-lg text-xs transition"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sub-Tab 2: Editorial Playlist Curation */}
          {activeSubTab === "curation" && (
            <div className="space-y-6">
              <div className="p-4 bg-gray-950 border border-gray-800 rounded-xl space-y-4">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <ListMusic className="w-5 h-5" />
                  <h3 className="font-bold text-sm">Add Song to Curated Editorial Stream</h3>
                </div>
                <form onSubmit={handleAddCurated} className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1 col-span-2">
                    <label className="text-gray-400">Song Title</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g., Midnight City"
                      value={curationForm.title}
                      onChange={(e) =>
                        setCurationForm((prev) => ({ ...prev, title: e.target.value }))
                      }
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-gray-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-gray-400">Artist</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g., M83"
                      value={curationForm.artist}
                      onChange={(e) =>
                        setCurationForm((prev) => ({ ...prev, artist: e.target.value }))
                      }
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-gray-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-gray-400">Album Name</label>
                    <input
                      type="text"
                      placeholder="e.g., Hurry Up, We're Dreaming"
                      value={curationForm.album}
                      onChange={(e) =>
                        setCurationForm((prev) => ({ ...prev, album: e.target.value }))
                      }
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-gray-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-gray-400">Audio URL (CDN/Signed)</label>
                    <input
                      type="text"
                      placeholder="e.g., /api/stream/..."
                      value={curationForm.audioUrl}
                      onChange={(e) =>
                        setCurationForm((prev) => ({ ...prev, audioUrl: e.target.value }))
                      }
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-gray-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-gray-400">Artwork URL</label>
                    <input
                      type="text"
                      placeholder="Unsplash art url..."
                      value={curationForm.coverUrl}
                      onChange={(e) =>
                        setCurationForm((prev) => ({ ...prev, coverUrl: e.target.value }))
                      }
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-gray-100"
                    />
                  </div>
                  <button
                    type="submit"
                    className="col-span-2 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold py-2.5 rounded-lg text-xs mt-2 transition flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Publish to MelodyStream Editorial Radio
                  </button>
                </form>
              </div>

              {/* Curated list */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                  Live Editorial Tracks in Queue
                </h4>
                <div className="grid gap-2 text-xs">
                  <div className="p-3 bg-gray-950/40 border border-gray-800 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        className="w-8 h-8 rounded object-cover"
                        src="https://images.unsplash.com/photo-1614680376593-902f74fa0d41?q=80&w=150"
                        alt="art"
                      />
                      <div>
                        <p className="font-bold text-gray-100">Cyberpunk Rain</p>
                        <p className="text-[10px] text-gray-400">Tokyo Ambience Collective</p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-400/10 text-emerald-400 px-2 py-0.5 rounded-full font-mono">
                      EDITORIAL SEED
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sub-Tab 3: Feature Flags Rollout */}
          {activeSubTab === "flags" && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-950 border border-gray-800 rounded-xl space-y-3">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <Settings2 className="w-5 h-5" />
                  <h3 className="font-bold text-sm">Feature Flag Controller (Safe Canary Rollout)</h3>
                </div>
                <p className="text-xs text-gray-400">
                  Toggle next-generation premium playback and AI engines in real-time.
                </p>

                <div className="divide-y divide-gray-800 text-xs">
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <h4 className="font-bold text-gray-200">Sample-Accurate Gapless Playback</h4>
                      <p className="text-[10px] text-gray-500">
                        Pre-buffers audio chunks inside background threads to remove cross-track latency.
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setFeatureFlags((f) => ({ ...f, gapless: !f.gapless }))
                      }
                      className={`px-3 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider transition ${
                        featureFlags.gapless
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-gray-800 text-gray-400 border border-gray-700"
                      }`}
                    >
                      {featureFlags.gapless ? "Enabled" : "Disabled"}
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div>
                      <h4 className="font-bold text-gray-200">AI DJ Voice Commentary Intro</h4>
                      <p className="text-[10px] text-gray-500">
                        Synthesizes live radio host commentary using Gemini API model during song changes.
                      </p>
                    </div>
                    <button
                      onClick={() => setFeatureFlags((f) => ({ ...f, aiDJ: !f.aiDJ }))}
                      className={`px-3 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider transition ${
                        featureFlags.aiDJ
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-gray-800 text-gray-400 border border-gray-700"
                      }`}
                    >
                      {featureFlags.aiDJ ? "Enabled" : "Disabled"}
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div>
                      <h4 className="font-bold text-gray-200">Ultra High Definition FLAC Audio Quality</h4>
                      <p className="text-[10px] text-gray-500">
                        Sets stream codecs to 24-bit lossless FLAC (1411kbps sample rate).
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setFeatureFlags((f) => ({ ...f, hdAudio: !f.hdAudio }))
                      }
                      className={`px-3 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider transition ${
                        featureFlags.hdAudio
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-gray-800 text-gray-400 border border-gray-700"
                      }`}
                    >
                      {featureFlags.hdAudio ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
