import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./MelodyStreamAuthContext";
import MelodyStreamDashboard from "./MelodyStreamDashboard";
import { Music } from "lucide-react";
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
          <Music className="w-16 h-16 text-[#8b5cf6]" />
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
        <Music className="w-24 h-24 text-[#8b5cf6]" />
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

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
