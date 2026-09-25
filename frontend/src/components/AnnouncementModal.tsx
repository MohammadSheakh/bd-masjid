'use client';

import React, { useState, useEffect } from 'react';
import { Mosque, MosqueAnnouncement } from '@/types/mosque';
import {
  fetchMosqueAnnouncements,
  createMosqueAnnouncement,
} from '@/lib/api';
import { X, Pin, Megaphone, Plus, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  mosque: Mosque;
  onAnnouncementCreated?: (announcement: MosqueAnnouncement) => void;
}

export function AnnouncementModal({
  isOpen,
  onClose,
  mosque,
  onAnnouncementCreated,
}: AnnouncementModalProps) {
  const [announcements, setAnnouncements] = useState<MosqueAnnouncement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPostForm, setShowPostForm] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen && mosque.id) {
      loadAnnouncements();
    }
  }, [isOpen, mosque.id]);

  const loadAnnouncements = async () => {
    setIsLoading(true);
    try {
      const data = await fetchMosqueAnnouncements(mosque.id);
      setAnnouncements(data);
    } catch {
      setAnnouncements([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    setStatusMessage(null);

    const result = await createMosqueAnnouncement(mosque.id, {
      title: title.trim(),
      content: content.trim(),
      isPinned,
    });

    setIsSubmitting(false);

    if (result.success && result.data) {
      setStatusMessage({
        type: 'success',
        text: 'Announcement posted successfully!',
      });
      setAnnouncements((prev) => [result.data, ...prev]);
      if (onAnnouncementCreated) {
        onAnnouncementCreated(result.data);
      }
      setTitle('');
      setContent('');
      setIsPinned(false);
      setShowPostForm(false);
    } else {
      setStatusMessage({
        type: 'error',
        text: result.error || 'Failed to post announcement.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#e8e8ea] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#e8e8ea] flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#111114]">Community Notices</h2>
              <p className="text-xs text-[#6e6e73] truncate max-w-[280px]">
                {mosque.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-100 text-[#6e6e73] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {statusMessage && (
            <div
              className={`p-3.5 rounded-2xl flex items-center gap-2.5 text-xs ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Toggle between viewing and posting */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#6e6e73]">
              Active Notices ({announcements.length})
            </span>
            <button
              onClick={() => setShowPostForm(!showPostForm)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showPostForm ? 'View Notices' : 'Post Notice'}</span>
            </button>
          </div>

          {/* Post New Announcement Form */}
          {showPostForm ? (
            <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-[#fafafa] border border-[#e8e8ea] space-y-3.5">
              <div>
                <label className="text-[11px] font-semibold text-[#111114] block mb-1">
                  Notice Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Special Jumu'ah Khutbah or Taraweeh Time"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#e8e8ea] bg-white focus:outline-none focus:ring-2 focus:ring-[#111114]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#111114] block mb-1">
                  Notice Description *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide complete details for the musallis..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#e8e8ea] bg-white focus:outline-none focus:ring-2 focus:ring-[#111114] resize-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinAnnouncement"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="rounded border-[#e8e8ea] text-[#111114] focus:ring-0"
                />
                <label htmlFor="pinAnnouncement" className="text-xs text-[#6e6e73] cursor-pointer flex items-center gap-1">
                  <Pin className="w-3 h-3 text-amber-600" />
                  <span>Pin to top of mosque profile</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPostForm(false)}
                  className="px-3.5 py-1.5 rounded-full border border-[#e8e8ea] text-xs font-semibold text-[#6e6e73] hover:text-black"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-full bg-[#111114] text-white text-xs font-semibold hover:bg-zinc-800 disabled:opacity-50"
                >
                  {isSubmitting ? 'Posting...' : 'Publish Notice'}
                </button>
              </div>
            </form>
          ) : (
            /* Announcements List */
            <div className="space-y-3">
              {isLoading ? (
                <div className="p-8 text-center text-xs text-[#6e6e73]">
                  Loading notices...
                </div>
              ) : announcements.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-[#fafafa] border border-[#e8e8ea] text-xs text-[#6e6e73]">
                  No active notices published for this mosque yet.
                </div>
              ) : (
                announcements.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      item.isPinned
                        ? 'bg-amber-50/40 border-amber-200'
                        : 'bg-[#fafafa] border-[#e8e8ea]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        {item.isPinned && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full">
                            <Pin className="w-2.5 h-2.5" />
                            Pinned
                          </span>
                        )}
                        <h3 className="text-xs font-bold text-[#111114]">
                          {item.title}
                        </h3>
                      </div>
                      <span className="text-[10px] text-[#6e6e73] flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3 text-zinc-400" />
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-700 leading-relaxed whitespace-pre-line">
                      {item.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
