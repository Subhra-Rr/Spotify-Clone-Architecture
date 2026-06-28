import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./MelodyStreamAuthContext";
import MelodyStreamDashboard from "./MelodyStreamDashboard";
import { Music, Download, BadgeCheck, ExternalLink, Loader2 } from "lucide-react";
import { auth, googleProvider } from "./firebase";
import {
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  User,
} from "firebase/auth";


// Firebase Auth Screen Component
function FirebaseAuthScreen({ onAuthSuccess, onContinueAsGuest }: { onAuthSuccess: () => void; onContinueAsGuest: () => void }) {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleGoogleAuth = async () => {
    setError("");
    setMessage("");
    try {
      googleProvider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, googleProvider);
      onAuthSuccess();
    } catch (err: any) {
      setError(err.message || "Google Auth failed");
    }
  };

  const isUnauthorizedDomain = error.toLowerCase().includes("unauthorized-domain") || error.toLowerCase().includes("auth/unauthorized-domain");

  return (
    <div className="flex flex-col min-h-screen bg-black items-center justify-center font-sans py-12 px-4">
      <div className="bg-[#121212] p-8 sm:p-12 rounded-lg w-full max-w-md shadow-2xl text-center border border-[#282828]">
        <div className="flex justify-center mb-6">
          <img src="/icon.svg" alt="MelodyStream Logo" className="w-20 h-20 shadow-[0_8px_30px_rgba(139,92,246,0.3)] rounded-2xl border border-white/10" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight mb-6 font-sans">
          Log in to MelodyStream
        </h1>

        {error && (
          <div className="bg-red-500/10 text-red-400 p-4 rounded mb-6 text-sm border border-red-500/20 text-left">
            <p className="font-bold text-red-500 mb-1">Firebase Error</p>
            <p className="text-gray-300 text-xs mb-3">{error}</p>
            
            {isUnauthorizedDomain && (
              <div className="border border-[#8b5cf6]/30 bg-black/40 p-3 rounded text-xs space-y-2 mt-2">
                <p className="font-bold text-[#8b5cf6]">How to enable real Google Login here:</p>
                <p className="text-gray-300 leading-relaxed">
                  Your current domain (<strong>{window.location.hostname}</strong>) must be authorized in your Firebase Project to use real Google login.
                </p>
                <ol className="list-decimal pl-4 space-y-2 text-gray-400 leading-normal">
                  <li>
                    Open your <a href="https://console.firebase.google.com/project/lateral-droplet-pln7n/authentication/settings" target="_blank" rel="noopener noreferrer" className="text-[#8b5cf6] hover:underline font-semibold">Firebase settings page</a>.
                  </li>
                  <li>
                    Click on <strong>"Authorised domains"</strong> (you were here in your screenshot!).
                  </li>
                  <li>
                    <strong className="text-white">Crucial Step:</strong> Because you already have many domains listed, the <strong>"Add domain"</strong> button is pushed off the screen. 
                    <span className="text-white font-medium"> Scroll down inside the right-hand panel/table to the very bottom</span>.
                  </li>
                  <li>
                    At the bottom of the table, you will see the <strong>"Add domain"</strong> button!
                  </li>
                  <li>
                    Click it, type <strong className="text-white select-all">{window.location.hostname}</strong>, and click <strong>"Add"</strong>.
                  </li>
                </ol>
              </div>
            )}
          </div>
        )}
        
        {message && (
          <div className="bg-green-500/10 text-green-500 p-3 rounded mb-6 text-sm text-left">
            {message}
          </div>
        )}

        <button
          onClick={handleGoogleAuth}
          className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-bold text-[15px] rounded-full py-3.5 mb-4 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            className="w-5 h-5 fill-current"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="white"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="white"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="white"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="white"
            />
          </svg>
          Continue with Google
        </button>

        <button
          onClick={onContinueAsGuest}
          className="w-full bg-transparent border border-[#282828] hover:border-[#3e3e3e] text-white/85 hover:text-white font-medium text-[14px] rounded-full py-2.5 mb-6 hover:bg-[#1f1f1f] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          Continue as Guest / Local Player
        </button>
      </div>
    </div>
  );
}

// MelodyStream Auth Setup
function MelodyStreamAuthScreen() {
  const { login, bypass } = useAuth();
  const [authErr, setAuthErr] = useState("");
  useEffect(() => {
     const p = new URLSearchParams(window.location.search);
     const err = p.get('error');
     if (err) setAuthErr(err);
  }, []);
  
  return (
    <div className="flex flex-col h-screen bg-black items-center justify-center font-sans">
      <div className="flex flex-col items-center gap-8 max-w-lg text-center pl-4 pr-4">
        <img src="/icon.svg" alt="MelodyStream Logo" className="w-28 h-28 shadow-[0_8px_30px_rgba(139,92,246,0.3)] rounded-3xl border border-white/10" />
        <h1 className="text-4xl font-bold text-white tracking-tight">
          Connect Music Library
        </h1>
        <p className="text-[#b3b3b3]">
          Connect your account to access your playlists, artists, and
          liked songs.
        </p>
        {authErr && (
           <p className="text-red-500 font-bold bg-red-500/10 px-4 py-2 rounded-md">
             Authentication failed: {authErr === 'invalid_grant' ? 'Session expired or trigger mismatch. Please try connecting again.' : authErr}
           </p>
         )}
        <div className="flex flex-col gap-4 w-full px-6">
          <button
            onClick={login}
            className="w-full bg-[#8b5cf6] text-white font-bold text-lg rounded-full py-3.5 hover:scale-105 transition-transform"
          >
            Connect Account
          </button>
          <button
            onClick={bypass}
            className="w-full bg-transparent border border-[#878787] text-white hover:border-white font-bold text-lg rounded-full py-3.5 hover:scale-105 transition-transform"
          >
            Skip & Use Standalone Player
          </button>
        </div>
      </div>
    </div>
  );
}

function MainLayout() {
  const { isAuthenticated, bypass } = useAuth();
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Automatically trigger the standalone bypass so they are never blocked by connection screens
    if (!isAuthenticated) {
      bypass();
    }
  }, [isAuthenticated, bypass]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        localStorage.removeItem('melodystream_guest_session');
        if (user.isAnonymous) {
          const localUserStr = localStorage.getItem('melodystream_local_logged_in_user');
          if (localUserStr) {
            try {
              const localUser = JSON.parse(localUserStr);
              if (localUser.uid === user.uid) {
                setFirebaseUser({
                  ...user,
                  displayName: localUser.displayName || user.displayName,
                  email: localUser.email || user.email,
                  photoURL: localUser.photoURL || user.photoURL,
                } as any);
                setLoading(false);
                return;
              }
            } catch (e) {}
          }
        } else {
          // Keep localStorage updated for Google/Email auth
          const customUser = {
            uid: user.uid,
            displayName: user.displayName || user.email?.split('@')[0] || "Listener",
            email: user.email,
            photoURL: user.photoURL,
          };
          localStorage.setItem('melodystream_local_logged_in_user', JSON.stringify(customUser));
        }
        setFirebaseUser(user);
      } else {
        const isGuest = localStorage.getItem('melodystream_guest_session') === 'true';
        if (isGuest) {
          setFirebaseUser({
            uid: 'guest_user',
            displayName: 'Local Guest',
            email: 'guest@example.com',
            photoURL: null,
            delete: async () => {},
          } as any);
        } else {
          setFirebaseUser(null);
        }
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleContinueAsGuest = () => {
    localStorage.setItem('melodystream_guest_session', 'true');
    setFirebaseUser({
      uid: 'guest_user',
      displayName: 'Local Guest',
      email: 'guest@example.com',
      photoURL: null,
      delete: async () => {},
    } as any);
  };

  const handleLogout = () => {
    localStorage.removeItem('melodystream_local_logged_in_user');
    localStorage.removeItem('melodystream_guest_session');
    signOut(auth).catch(() => {});
    setFirebaseUser(null);
  };

  if (loading)
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center text-white font-sans gap-4">
        <Music className="w-12 h-12 text-[#8b5cf6] animate-pulse" />
        <span className="text-sm font-medium text-[#b3b3b3] tracking-wide">Loading MelodyStream...</span>
      </div>
    );

  if (!firebaseUser) {
    return <FirebaseAuthScreen onAuthSuccess={() => {}} onContinueAsGuest={handleContinueAsGuest} />;
  }

  return <MelodyStreamDashboard user={firebaseUser} onLogout={handleLogout} />;
}

function PWAInstallScreen() {
  const [isPrompting, setIsPrompting] = useState(false);
  const [isPromptReady, setIsPromptReady] = useState(false);

  useEffect(() => {
    // Check if prompt is already captured
    if ((window as any).deferredPrompt) {
      setIsPromptReady(true);
    }

    // Also register custom callback for readiness
    (window as any).onBeforeInstallPromptReady = () => {
      setIsPromptReady(true);
    };

    return () => {
      (window as any).onBeforeInstallPromptReady = null;
    };
  }, []);

  const triggerInstall = async () => {
    if (isPrompting) return;
    setIsPrompting(true);

    try {
      const promptToUse = (window as any).deferredPrompt;
      if (promptToUse) {
        promptToUse.prompt();
        const { outcome } = await promptToUse.userChoice;
        if (outcome === "accepted") {
          (window as any).deferredPrompt = null;
          setIsPromptReady(false);
          // Redirect to the regular app URL (no query param)
          window.location.href = window.location.origin;
        }
      } else {
        // Fallback or instructions
        // Wait 1.5s to see if prompt fires, otherwise show instructions
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const finalPrompt = (window as any).deferredPrompt;
        if (finalPrompt) {
          finalPrompt.prompt();
          const { outcome } = await finalPrompt.userChoice;
          if (outcome === "accepted") {
            (window as any).deferredPrompt = null;
            setIsPromptReady(false);
            window.location.href = window.location.origin;
          }
        } else {
          // No prompt event. Show helpful modal instructions or alerts
          const userAgent = navigator.userAgent.toLowerCase();
          const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) || 
            (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /macintosh/i.test(navigator.userAgent));
          
          if (isIOSDevice) {
            alert("To install MelodyStream natively on your Apple device:\n1. Tap the Share button (⎋) in Safari.\n2. Select 'Add to Home Screen'.");
          } else {
            alert("To install MelodyStream natively:\nClick the Install icon (🖥️ or ➕) in your browser address bar, or open settings (⋮) and click 'Install MelodyStream'.");
          }
        }
      }
    } catch (err) {
      console.warn("PWA install error:", err);
    } finally {
      setIsPrompting(false);
    }
  };

  const handleOpenWeb = () => {
    // Redirect to the regular web player
    window.location.href = window.location.origin;
  };

  const isIOS = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase()) || 
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /macintosh/i.test(navigator.userAgent));

  return (
    <div className="flex flex-col min-h-screen bg-black items-center justify-center font-sans py-12 px-4 select-none">
      <div className="bg-[#121212] p-8 sm:p-12 rounded-2xl w-full max-w-md shadow-2xl text-center border border-[#282828] space-y-6 relative overflow-hidden">
        {/* Subtle glowing ambient backdrop */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-violet-600/10 rounded-full blur-[60px] pointer-events-none" />

        <div className="relative w-24 h-24 mx-auto mb-2">
          <img
            src="/icon.svg"
            alt="MelodyStream Logo"
            className="w-full h-full rounded-2xl shadow-[0_15px_40px_rgba(139,92,246,0.3)] border border-white/10"
            referrerPolicy="no-referrer"
          />
          <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border-2 border-[#121212] flex items-center justify-center shadow-lg">
            <BadgeCheck className="w-4 h-4 text-white fill-white/10" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
            Install MelodyStream
          </h1>
          <p className="text-[#a78bfa] text-xs font-bold uppercase tracking-wider mt-1.5">
            Native-Grade Standalone Application
          </p>
        </div>

        <p className="text-gray-300 text-[13px] leading-relaxed max-w-xs mx-auto">
          Installs directly onto your device for listening to music everywhere. Enjoy high-speed offline local caching, seamless lock screen integration, background playback, and full device media controls.
        </p>

        <div className="pt-2 space-y-3">
          <button
            onClick={triggerInstall}
            disabled={isPrompting}
            className="w-full py-4 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] text-white font-extrabold hover:scale-[1.02] active:scale-[0.98] transition-all text-sm shadow-[0_0_25px_rgba(139,92,246,0.4)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:scale-100"
          >
            {isPrompting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-white" />
                Prompting Device Installer...
              </>
            ) : (
              <>
                <Download className="w-5 h-5 animate-bounce" />
                Install Native App Now
              </>
            )}
          </button>

          <button
            onClick={handleOpenWeb}
            className="w-full bg-transparent border border-[#282828] hover:border-[#3e3e3e] text-white/80 hover:text-white font-semibold text-xs rounded-full py-3 hover:bg-[#1a1a1a] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Continue to Web Player
          </button>
        </div>

        {/* Dynamic Helpful Indicator */}
        <div className="pt-4 border-t border-white/5 text-[11px] text-[#808080] leading-relaxed">
          {isIOS ? (
            <p className="text-[#b3b3b3]">
              Apple iOS Device detected: Tap Safari's <strong className="text-white">Share ⎋</strong> then <strong className="text-white">"Add to Home Screen"</strong> if the install window does not launch automatically.
            </p>
          ) : (
            <p className="text-[#b3b3b3]">
              Compatible with Android, Windows, Mac, iPad, and Chromebook. Click the install prompt or use your browser settings <strong className="text-white">(⋮)</strong> -&gt; <strong className="text-[#a78bfa]">"Install MelodyStream"</strong>.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [isInstallRedirect, setIsInstallRedirect] = useState(false);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.get("install") === "true") {
      setIsInstallRedirect(true);
    }
  }, []);

  if (isInstallRedirect) {
    return <PWAInstallScreen />;
  }

  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
