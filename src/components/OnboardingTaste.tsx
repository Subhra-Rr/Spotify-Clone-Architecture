import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Check, Music, Heart, ArrowRight } from "lucide-react";

interface Artist {
  id: string;
  name: string;
  genre: string;
  image: string;
}

const INITIAL_ARTISTS: Artist[] = [
  { id: "1", name: "Arijit Singh", genre: "Bollywood Romance", image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=150" },
  { id: "2", name: "The Weeknd", genre: "Synth-Pop / R&B", image: "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=150" },
  { id: "3", name: "Billie Eilish", genre: "Alt Pop", image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=150" },
  { id: "4", name: "Diljit Dosanjh", genre: "Punjabi Beats", image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=150" },
  { id: "5", name: "Hans Zimmer", genre: "Cinematic Classical", image: "https://images.unsplash.com/photo-1446057032654-9d8885db76c6?q=80&w=150" },
  { id: "6", name: "Lofi Girl", genre: "Chill Study Beats", image: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=150" },
];

const INITIAL_GENRES = [
  "Bollywood",
  "Punjabi",
  "Synthwave",
  "Chill Lofi",
  "Rock & Metal",
  "Hip-Hop",
  "Jazz Classical",
];

export const OnboardingTaste: React.FC<{
  onComplete: (selectedGenres: string[], selectedArtists: string[]) => void;
}> = ({ onComplete }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const toggleArtist = (artistName: string) => {
    setSelectedArtists((prev) =>
      prev.includes(artistName)
        ? prev.filter((a) => a !== artistName)
        : [...prev, artistName]
    );
  };

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else {
      onComplete(selectedGenres, selectedArtists);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/90 backdrop-blur-xl p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-xl bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
      >
        {/* Glow decoration */}
        <div className="absolute -top-16 -left-16 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full" />
        <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full" />

        {/* Step Indicator */}
        <div className="flex justify-between items-center mb-6 text-xs text-gray-500 font-mono">
          <span className="flex items-center gap-1 text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" /> PERSONALIZING MELODYSTREAM
          </span>
          <span>STEP {step} OF 2</span>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-xl font-bold text-gray-100 tracking-tight">
                  What sounds do you love?
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Select your favorite genres to seed your personalized recommendations.
                </p>
              </div>

              {/* Genre Grid */}
              <div className="flex flex-wrap gap-2.5">
                {INITIAL_GENRES.map((genre) => {
                  const active = selectedGenres.includes(genre);
                  return (
                    <button
                      key={genre}
                      onClick={() => toggleGenre(genre)}
                      className={`px-4 py-2 text-xs font-semibold rounded-full border transition-all duration-200 flex items-center gap-1.5 ${
                        active
                          ? "bg-emerald-400 text-gray-950 border-emerald-400 font-bold"
                          : "bg-gray-950/40 text-gray-300 border-gray-800 hover:border-gray-700"
                      }`}
                    >
                      <Music className="w-3.5 h-3.5" />
                      {genre}
                      {active && <Check className="w-3 h-3 text-gray-950 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-xl font-bold text-gray-100 tracking-tight">
                  Choose your favorite artists
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  We will suggest similar vocalists, bands, and custom soundwaves.
                </p>
              </div>

              {/* Artist Grid */}
              <div className="grid grid-cols-2 gap-3">
                {INITIAL_ARTISTS.map((artist) => {
                  const active = selectedArtists.includes(artist.name);
                  return (
                    <button
                      key={artist.id}
                      onClick={() => toggleArtist(artist.name)}
                      className={`p-3 rounded-2xl border flex items-center gap-3 transition-all text-left ${
                        active
                          ? "bg-emerald-500/10 border-emerald-400 text-gray-100"
                          : "bg-gray-950/40 border-gray-800 text-gray-300 hover:border-gray-700"
                      }`}
                    >
                      <img
                        className="w-10 h-10 rounded-full object-cover border border-gray-800"
                        src={artist.image}
                        alt={artist.name}
                      />
                      <div className="flex-1 overflow-hidden">
                        <p className="font-bold text-xs truncate">{artist.name}</p>
                        <p className="text-[10px] text-gray-500 truncate">{artist.genre}</p>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                          active ? "bg-emerald-400 border-emerald-400" : "border-gray-600"
                        }`}
                      >
                        {active && <Check className="w-2.5 h-2.5 text-gray-950 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleNext}
            disabled={step === 1 && selectedGenres.length === 0}
            className="px-5 py-2.5 bg-emerald-400 hover:bg-emerald-350 disabled:opacity-40 disabled:hover:bg-emerald-400 text-gray-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-400/10 transition"
          >
            {step === 1 ? (
              <>
                Continue <ArrowRight className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                Let's Play <Check className="w-3.5 h-3.5 stroke-[2]" />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
