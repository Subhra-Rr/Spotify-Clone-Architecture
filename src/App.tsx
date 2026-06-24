import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./MelodyStreamAuthContext";
import MelodyStreamDashboard from "./MelodyStreamDashboard";
import { Eye, EyeOff, Check, X, Music } from "lucide-react";
import { auth, googleProvider } from "./firebase";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged,
  User,
} from "firebase/auth";

// Firebase Auth Screen Component
function FirebaseAuthScreen({ onAuthSuccess, onContinueAsGuest }: { onAuthSuccess: () => void; onContinueAsGuest: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const calculatePasswordStrength = (pwd: string) => {
    let score = 0;
    if (!pwd) return score;
    if (pwd.length > 6) score += 1;
    if (pwd.length > 10) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    return Math.min(score, 4);
  };

  const passwordStrength = calculatePasswordStrength(password);
  const strengthLabels = ["Weak", "Fair", "Good", "Strong", "Very Strong"];
  const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-400", "bg-green-500"];

  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

  const isPasswordValid = hasMinLength && hasNumber && hasSpecialChar;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!isLogin && !isPasswordValid) {
       setError("Please meet all password requirements before signing up.");
       return;
    }
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        setMessage("Account created successfully!");
      }
      onAuthSuccess();
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      setError("Please enter your email address.");
      return;
    }
    setError("");
    setMessage("");
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setMessage("Password reset email sent. Please check your inbox.");
      setShowResetModal(false);
      setResetEmail("");
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    }
  };

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

  return (
    <div className="flex flex-col h-screen bg-black items-center justify-center font-sans">
      <div className="bg-[#121212] p-8 sm:p-12 rounded-lg w-full max-w-md shadow-2xl mx-4">
        <div className="flex justify-center mb-8">
          <Music className="w-16 h-16 text-[#8b5cf6]" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight mb-8 text-center font-sans">
          {isLogin ? "Log in to MelodyStream" : "Sign up for MelodyStream"}
        </h1>

        {error && (
          <div className="bg-red-500/10 text-red-500 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}
        
        {message && (
          <div className="bg-green-500/10 text-green-500 p-3 rounded mb-4 text-sm">
            {message}
          </div>
        )}

        <button
          onClick={handleGoogleAuth}
          className="w-full bg-transparent border border-[#878787] text-white font-bold text-[15px] rounded-full py-3 mb-2 hover:border-white transition-colors flex items-center justify-center gap-2"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>
        <div className="flex items-center gap-4 mb-6 mt-4">
          <div className="h-px bg-[#282828] flex-1"></div>
          <span className="text-[#878787] text-sm">or</span>
          <div className="h-px bg-[#282828] flex-1"></div>
        </div>

        <form onSubmit={handleEmailAuth} className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-white">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="bg-[#242424] text-white px-4 py-3 rounded text-[15px] border border-transparent focus:border-white outline-none transition-colors"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-white">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="bg-[#242424] text-white px-4 py-3 rounded text-[15px] border border-transparent focus:border-white outline-none transition-colors w-full pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b3b3b3] hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          
          {!isLogin && (
            <div className="mt-1 mb-2">
              <div className="flex gap-1 h-1.5 w-full bg-[#3e3e3e] rounded-full overflow-hidden mb-3">
                {[...Array(4)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-full flex-1 transition-all duration-300 ${i <= passwordStrength - 1 && password.length > 0 ? strengthColors[passwordStrength] : 'bg-transparent'}`}
                  ></div>
                ))}
              </div>
              
              <div className="flex flex-col gap-1.5">
                <div className={`flex items-center gap-2 text-sm transition-colors ${hasMinLength ? 'text-[#a78bfa]' : 'text-[#b3b3b3]'}`}>
                  {hasMinLength ? <Check size={16} /> : <X size={16} />} At least 8 characters
                </div>
                <div className={`flex items-center gap-2 text-sm transition-colors ${hasNumber ? 'text-[#a78bfa]' : 'text-[#b3b3b3]'}`}>
                  {hasNumber ? <Check size={16} /> : <X size={16} />} At least 1 number
                </div>
                <div className={`flex items-center gap-2 text-sm transition-colors ${hasSpecialChar ? 'text-[#a78bfa]' : 'text-[#b3b3b3]'}`}>
                  {hasSpecialChar ? <Check size={16} /> : <X size={16} />} At least 1 special character
                </div>
              </div>
            </div>
          )}

          {isLogin && (
            <button 
              type="button" 
              onClick={() => {
                setShowResetModal(true);
                setResetEmail(email);
              }}
              className="text-white hover:text-[#a78bfa] font-bold text-sm text-left hover:underline mb-2 transition-colors self-start"
            >
              Forgot your password?
            </button>
          )}

          <button
            type="submit"
            disabled={!isLogin && !isPasswordValid}
            className={`font-bold text-[15px] rounded-full py-3.5 mt-2 transition-all ${!isLogin && !isPasswordValid ? 'bg-[#8b5cf6]/50 text-white/50 cursor-not-allowed' : 'bg-[#8b5cf6] text-white hover:scale-105'}`}
          >
            {isLogin ? "Log In" : "Sign Up"}
          </button>
        </form>

        <div className="flex items-center gap-4 mb-4 mt-2">
          <div className="h-px bg-[#282828] flex-1"></div>
          <span className="text-[#878787] text-xs">or</span>
          <div className="h-px bg-[#282828] flex-1"></div>
        </div>

        <button
          onClick={onContinueAsGuest}
          className="w-full bg-transparent border border-[#8b5cf6]/50 hover:border-[#8b5cf6] text-white/90 hover:text-white font-semibold text-[15px] rounded-full py-3 mb-6 hover:bg-[#8b5cf6]/10 transition-all flex items-center justify-center gap-2"
        >
          Continue as Guest / Local Player
        </button>

        <div className="text-center text-[#878787] text-[15px]">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            className="text-white hover:text-[#a78bfa] hover:underline font-bold transition-colors"
          >
            {isLogin ? "Sign up for MelodyStream" : "Log in here"}
          </button>
        </div>
      </div>

      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#282828] p-6 rounded-lg w-full max-w-md shadow-2xl border border-[#3f3f3f]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Reset Password</h2>
              <button 
                onClick={() => setShowResetModal(false)} 
                className="text-[#b3b3b3] hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-[#b3b3b3] text-sm mb-4">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Email address"
                className="bg-[#3e3e3e] text-white px-4 py-3 rounded text-[15px] border border-transparent focus:border-white outline-none transition-colors"
                required
              />
              <div className="flex gap-4 justify-end mt-4">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-6 py-2.5 rounded-full border border-[#b3b3b3] text-white font-bold hover:scale-105 hover:border-white transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#8b5cf6] text-white font-bold hover:scale-105 transition-transform"
                >
                  Send Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
      setFirebaseUser(user);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleContinueAsGuest = () => {
    setFirebaseUser({
      uid: 'guest_user',
      displayName: 'Local Guest',
      email: 'guest@example.com',
      photoURL: null,
      delete: async () => {},
    } as any);
  };

  const handleLogout = () => {
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

  return <MelodyStreamDashboard onLogout={handleLogout} />;
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
