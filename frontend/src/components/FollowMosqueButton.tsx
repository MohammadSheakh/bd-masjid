'use client';

import React, { useState, useEffect } from 'react';
import { Bookmark, BookmarkCheck, Loader2 } from 'lucide-react';
import { fetchFollowStatus, toggleFollowMosque } from '@/lib/api';
import { AuthModal } from './AuthModal';

interface FollowMosqueButtonProps {
  mosqueId: string;
  initialFollowersCount?: number;
  className?: string;
  compact?: boolean;
}

export function FollowMosqueButton({
  mosqueId,
  initialFollowersCount = 0,
  className = '',
  compact = false,
}: FollowMosqueButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(initialFollowersCount);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetchFollowStatus(mosqueId).then((data) => {
      if (isMounted) {
        setIsFollowing(data.isFollowing);
        if (data.followersCount !== undefined) {
          setFollowersCount(data.followersCount);
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, [mosqueId]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      setIsAuthOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      const res = await toggleFollowMosque(mosqueId, isFollowing);
      if (res.success) {
        setIsFollowing(res.isFollowing);
        setFollowersCount(res.followersCount);
      }
    } catch {
      // Ignore error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleToggle}
        disabled={isLoading}
        aria-label={isFollowing ? 'Unfollow Mosque' : 'Follow Mosque'}
        className={`inline-flex items-center gap-1.5 text-xs font-semibold rounded-full transition-colors active:scale-95 disabled:opacity-50 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-[#111114] ${
          isFollowing
            ? 'bg-[#111114] text-white hover:bg-[#27272a]'
            : 'bg-[#fafafa] text-[#111114] border border-[#e8e8ea] hover:bg-[#f0f0f2]'
        } ${compact ? 'px-2.5 py-1 text-[11px]' : 'px-3.5 py-1.5'} ${className}`}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-current" />
        ) : isFollowing ? (
          <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <Bookmark className="w-3.5 h-3.5 text-[#6e6e73]" />
        )}

        <span>{isFollowing ? 'Following' : 'Follow'}</span>

        {followersCount > 0 && (
          <span
            className={`text-[10px] font-normal border-l pl-1.5 ml-0.5 ${
              isFollowing ? 'border-white/30 text-white/90' : 'border-[#e8e8ea] text-[#6e6e73]'
            }`}
          >
            {followersCount}
          </span>
        )}
      </button>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => {
          setIsAuthOpen(false);
          // Retry follow after successful login
          fetchFollowStatus(mosqueId).then((data) => {
            setIsFollowing(data.isFollowing);
            setFollowersCount(data.followersCount);
          });
        }}
      />
    </>
  );
}
