'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Lock, Mail, User, AlertCircle, Loader2, ShieldCheck, Building2, Users } from 'lucide-react';
import { loginUser, registerUser, oauthLogin, getOAuthConfig } from '@/lib/api';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          prompt: (momentListener?: any) => void;
        };
      };
    };
  }
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleClientId, setGoogleClientId] = useState<string | null>(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || null,
  );

  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Fetch OAuth configuration from backend if not already set via NEXT_PUBLIC_GOOGLE_CLIENT_ID
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    if (!googleClientId) {
      getOAuthConfig()
        .then((config) => {
          if (isMounted && config.googleClientId) {
            setGoogleClientId(config.googleClientId);
          }
        })
        .catch(() => {});
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, googleClientId]);

  // Handle Google OAuth Credential response
  const handleGoogleCredentialResponse = useCallback(
    async (response: any) => {
      const idToken = response?.credential;
      if (!idToken) {
        setError('Google sign-in was cancelled or returned no credentials.');
        return;
      }

      setError(null);
      setGoogleLoading(true);

      try {
        const data = await oauthLogin('google', idToken);
        const token = data.accessToken || data.token;
        if (token && typeof window !== 'undefined') {
          localStorage.setItem('access_token', token);
          if (data.user) {
            localStorage.setItem('user_profile', JSON.stringify(data.user));
          }
        }
        onSuccess(data.user);
        onClose();
      } catch (err: any) {
        setError(err?.message || 'Google sign-in failed. Please try again.');
      } finally {
        setGoogleLoading(false);
      }
    },
    [onSuccess, onClose],
  );

  // Initialize Google Identity Services script & button
  useEffect(() => {
    if (!isOpen || !googleClientId) return;

    const setupGoogle = () => {
      if (!window.google?.accounts?.id || !googleBtnRef.current) return;

      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        googleBtnRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          logo_alignment: 'left',
          width: 335,
        });
      } catch {
        // Fallback to custom trigger if renderButton fails
      }
    };

    if (window.google?.accounts?.id) {
      setupGoogle();
    } else {
      const existingScript = document.getElementById('google-gsi-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'google-gsi-script';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => setupGoogle();
        document.body.appendChild(script);
      } else {
        existingScript.addEventListener('load', setupGoogle);
      }
    }
  }, [isOpen, googleClientId, handleGoogleCredentialResponse]);

  // Keyboard accessibility: Escape to close and focus management
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const timer = setTimeout(() => {
      firstInputRef.current?.focus();
    }, 50);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [isOpen, onClose, mode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const data = await loginUser(email.trim(), password);
        const token = data.accessToken || data.token;
        if (token && typeof window !== 'undefined') {
          localStorage.setItem('access_token', token);
          if (data.user) {
            localStorage.setItem('user_profile', JSON.stringify(data.user));
          }
        }
        onSuccess(data.user || { email });
        onClose();
      } else {
        const data = await registerUser(name.trim(), email.trim(), password);
        const token = data.accessToken || data.token;
        if (token && typeof window !== 'undefined') {
          localStorage.setItem('access_token', token);
          if (data.user) {
            localStorage.setItem('user_profile', JSON.stringify(data.user));
          }
        }
        onSuccess(data.user || { name, email });
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-sm bg-white rounded-[10px] border border-[#e8e8ea] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h2 id="auth-modal-title" className="text-base font-bold text-[#111114]">
              {mode === 'login' ? 'Sign In to BD Masjid' : 'Create Account'}
            </h2>
            <p className="text-xs text-[#6e6e73] mt-0.5">
              Mosque Committee, Staff, Visitors & Platform Admin
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#6e6e73] hover:text-[#111114] hover:bg-[#fafafa] border border-transparent hover:border-[#e8e8ea] transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-[#111114]"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex px-5 mb-3.5">
          <div className="w-full grid grid-cols-2 p-1 bg-[#fafafa] border border-[#e8e8ea] rounded-[10px] text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`py-1.5 rounded-[8px] transition-colors ${
                mode === 'login'
                  ? 'bg-white text-[#111114] font-semibold border border-[#e8e8ea]'
                  : 'text-[#6e6e73] hover:text-[#111114]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`py-1.5 rounded-[8px] transition-colors ${
                mode === 'register'
                  ? 'bg-white text-[#111114] font-semibold border border-[#e8e8ea]'
                  : 'text-[#6e6e73] hover:text-[#111114]'
              }`}
            >
              Register
            </button>
          </div>
        </div>

        {/* Role Audience Badges */}
        <div className="mx-5 mb-3.5 px-3 py-2 bg-[#fafafa] rounded-[10px] border border-[#e8e8ea] text-[11px] text-[#6e6e73]">
          <div className="flex items-center justify-between font-medium">
            <span className="flex items-center gap-1 text-[#111114]">
              <Users className="w-3 h-3 text-[#6e6e73]" /> Visitors
            </span>
            <span className="text-[#d1d1d6]">•</span>
            <span className="flex items-center gap-1 text-[#111114]">
              <Building2 className="w-3 h-3 text-[#6e6e73]" /> Mosque Staff
            </span>
            <span className="text-[#d1d1d6]">•</span>
            <span className="flex items-center gap-1 text-[#111114]">
              <ShieldCheck className="w-3 h-3 text-[#6e6e73]" /> Admin
            </span>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mx-5 mb-3.5 p-2.5 rounded-[10px] bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="flex-1">{error}</p>
          </div>
        )}

        {/* Google Sign-in Section */}
        <div className="px-5 mb-3">
          {googleLoading ? (
            <div className="w-full py-2.5 px-4 rounded-full border border-[#e8e8ea] bg-[#fafafa] flex items-center justify-center gap-2 text-xs text-[#6e6e73]">
              <Loader2 className="w-4 h-4 animate-spin text-[#111114]" />
              <span>Authenticating with Google...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              {/* Google Identity Services button container */}
              <div
                ref={googleBtnRef}
                className="w-full flex justify-center min-h-[40px]"
              />
              {/* Fallback branded button if GSI script is still loading */}
              {!googleClientId && (
                <button
                  type="button"
                  disabled
                  className="w-full py-2.5 px-4 rounded-full border border-[#e8e8ea] bg-[#fafafa] text-xs font-semibold text-[#6e6e73] flex items-center justify-center gap-2 cursor-not-allowed opacity-75"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Google Sign-In Loading...</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="relative px-5 mb-3.5">
          <div className="absolute inset-0 flex items-center px-5">
            <div className="w-full border-t border-[#e8e8ea]"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
            <span className="bg-white px-2 text-[#a1a1a6]">Or with email credentials</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-3">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-[#111114] mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-[#6e6e73]" />
                <input
                  ref={firstInputRef}
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mohammad Sheakh"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-[10px] border border-[#e8e8ea] bg-white text-[#111114] placeholder-[#6e6e73]/60 focus:outline-hidden focus:border-[#111114] focus-visible:ring-1 focus-visible:ring-[#111114]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#111114] mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-[#6e6e73]" />
              <input
                ref={mode === 'login' ? firstInputRef : undefined}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-[10px] border border-[#e8e8ea] bg-white text-[#111114] placeholder-[#6e6e73]/60 focus:outline-hidden focus:border-[#111114] focus-visible:ring-1 focus-visible:ring-[#111114]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#111114] mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-[#6e6e73]" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-[10px] border border-[#e8e8ea] bg-white text-[#111114] placeholder-[#6e6e73]/60 focus:outline-hidden focus:border-[#111114] focus-visible:ring-1 focus-visible:ring-[#111114]"
              />
            </div>
          </div>

          {/* Primary Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-[#111114] hover:bg-[#27272a] text-white rounded-full text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 active:scale-98 disabled:opacity-50 mt-1"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : mode === 'login' ? (
              'Sign In with Email'
            ) : (
              'Create Account with Email'
            )}
          </button>

          <p className="text-[10px] text-center text-[#6e6e73] pt-1">
            Platform Admin? Sign in with your registered Admin Google account or password from{' '}
            <code className="bg-[#fafafa] px-1 py-0.5 rounded border border-[#e8e8ea] font-mono text-[9px]">
              .env
            </code>
          </p>
        </form>
      </div>
    </div>
  );
}
