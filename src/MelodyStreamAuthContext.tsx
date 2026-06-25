import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  accessToken: string | null;
  isAuthenticated: boolean;
  login: () => void;
  bypass: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem('melodystream_access_token'));
  const [refreshToken, setRefreshToken] = useState<string | null>(localStorage.getItem('melodystream_refresh_token'));
  const [expiresAt, setExpiresAt] = useState<number | null>(
    localStorage.getItem('melodystream_expires_at') ? Number(localStorage.getItem('melodystream_expires_at')) : null
  );

  useEffect(() => {
    // Listen for messages from the OAuth popup
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'MELODYSTREAM_AUTH_SUCCESS') {
        const { access_token, refresh_token, expires_in } = event.data;
        const expires_at = Date.now() + expires_in * 1000;
        
        setAccessToken(access_token);
        setRefreshToken(refresh_token);
        setExpiresAt(expires_at);

        localStorage.setItem('melodystream_access_token', access_token);
        if (refresh_token) {
          localStorage.setItem('melodystream_refresh_token', refresh_token);
        }
        localStorage.setItem('melodystream_expires_at', expires_at.toString());
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Token refresh logic
  useEffect(() => {
    if (!refreshToken || !expiresAt) return;

    const checkToken = async () => {
      const isExpired = Date.now() > expiresAt - 60000; // Refresh 1 minute early
      if (isExpired) {
        try {
          const res = await fetch('/api/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken })
          });
          const data = await res.json();
          if (data.access_token) {
            setAccessToken(data.access_token);
            localStorage.setItem('melodystream_access_token', data.access_token);
            if (data.refresh_token) {
               setRefreshToken(data.refresh_token);
               localStorage.setItem('melodystream_refresh_token', data.refresh_token);
            }
            const newExpiresAt = Date.now() + data.expires_in * 1000;
            setExpiresAt(newExpiresAt);
            localStorage.setItem('melodystream_expires_at', newExpiresAt.toString());
          }
        } catch (error) {
          // Failed to refresh token
          logout();
        }
      }
    };

    const interval = setInterval(checkToken, 60000); // check every minute
    checkToken(); // check immediately on mount

    return () => clearInterval(interval);
  }, [refreshToken, expiresAt]);

  const login = React.useCallback(async () => {
    try {
      console.log("Starting login process...");
      const redirectUri = window.location.origin + '/api/callback';
      const fetchUrl = `/api/auth/url?redirect_uri=${encodeURIComponent(redirectUri)}`;
      console.log("Fetching: " + fetchUrl);
      const res = await fetch(fetchUrl);
      
      const rawText = await res.text();
      console.log("Raw Response Body:", rawText.slice(0, 500));
      
      let url = "";
      try {
        const parsed = JSON.parse(rawText);
        url = parsed.url;
      } catch (e) {
         throw new Error("Invalid response from auth endpoint: " + rawText);
      }
      
      console.log("Redirecting to OAuth provider in the current window:", url);
      window.location.href = url;
    } catch (e: any) {
      // Failed to login
    }
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Allow localhost or .run.app
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'MELODYSTREAM_AUTH_SUCCESS') {
        const { access_token, refresh_token, expires_in } = event.data;
        setAccessToken(access_token);
        if (refresh_token) {
           setRefreshToken(refresh_token);
        }
        setExpiresAt(Date.now() + expires_in * 1000);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const bypass = React.useCallback(() => {
    setAccessToken('local_bypass');
    localStorage.setItem('melodystream_access_token', 'local_bypass');
  }, []);

  const logout = React.useCallback(() => {
    setAccessToken(null);
    setRefreshToken(null);
    setExpiresAt(null);
    localStorage.removeItem('melodystream_access_token');
    localStorage.removeItem('melodystream_refresh_token');
    localStorage.removeItem('melodystream_expires_at');
  }, []);

  return (
    <AuthContext.Provider value={{ accessToken, isAuthenticated: !!accessToken, login, bypass, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
