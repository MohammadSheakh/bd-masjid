'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Lock, Mail, User, AlertCircle, Loader2 } from 'lucide-react';
import { loginUser, registerUser } from '@/lib/api';

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
  const [error, setError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

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
              {mode === 'login'
                ? 'Follow mosques, save timetables, and receive alerts'
                : 'Join our verified mosque community across Bangladesh'}
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
        <div className="flex px-5 mb-4">
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

        {/* Error notification */}
        {error && (
          <div className="mx-5 mb-4 p-2.5 rounded-[10px] bg-[#fafafa] border border-red-300 flex items-start gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-3.5">
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

          {/* Black primary pill button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-[#111114] hover:bg-[#27272a] text-white rounded-full text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 active:scale-98 disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : mode === 'login' ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
