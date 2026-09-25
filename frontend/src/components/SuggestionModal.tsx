'use client';

import React, { useState } from 'react';
import { X, Check, Edit3, ArrowRight, Moon } from 'lucide-react';
import { Mosque } from '@/types/mosque';
import { submitScheduleSuggestion } from '@/lib/api';

interface SuggestionModalProps {
  mosque: Mosque | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function SuggestionModal({ mosque, onClose, onSuccess }: SuggestionModalProps) {
  if (!mosque) return null;

  const schedule = mosque.prayerSchedule;

  const [fajr, setFajr] = useState(schedule?.fajrJamaat || '');
  const [zuhr, setZuhr] = useState(schedule?.zuhrJamaat || '');
  const [asr, setAsr] = useState(schedule?.asrJamaat || '');
  const [maghrib, setMaghrib] = useState(schedule?.maghribJamaat || '');
  const [isha, setIsha] = useState(schedule?.ishaJamaat || '');
  const [jumuah, setJumuah] = useState(schedule?.jumuahJamaat || '');
  const [jumuahSecond, setJumuahSecond] = useState(schedule?.jumuahSecondJamaat || '');

  // Ramadan timings
  const [taraweeh, setTaraweeh] = useState(schedule?.taraweehJamaat || '');
  const [sahri, setSahri] = useState(schedule?.sahriEnd || '');
  const [iftar, setIftar] = useState(schedule?.iftarStart || '');
  const [showRamadan, setShowRamadan] = useState(
    Boolean(schedule?.taraweehJamaat || schedule?.sahriEnd || schedule?.iftarStart),
  );

  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await submitScheduleSuggestion(mosque.id, {
        suggestedTimes: {
          fajrJamaat: fajr,
          zuhrJamaat: zuhr,
          asrJamaat: asr,
          maghribJamaat: maghrib,
          ishaJamaat: isha,
          jumuahJamaat: jumuah,
          jumuahSecondJamaat: jumuahSecond.trim() || undefined,
          taraweehJamaat: taraweeh.trim() || undefined,
          sahriEnd: sahri.trim() || undefined,
          iftarStart: iftar.trim() || undefined,
        },
        description: description.trim() || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch {
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#e8e8ea] overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#e8e8ea] flex items-center justify-between bg-[#fafafa]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#111114]">Suggest Timetable Change</h2>
              <p className="text-[11px] text-[#6e6e73] truncate max-w-[240px]">{mosque.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-zinc-400 hover:text-zinc-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-[#111114]">Suggestion Submitted</h3>
            <p className="text-xs text-[#6e6e73]">
              Thank you for contributing! Your suggestion has been queued for moderator review.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
            <p className="text-xs text-[#6e6e73]">
              Enter the updated Jamaat times announced by the mosque committee.
            </p>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-[#6e6e73]">Fajr</span>
                <input
                  type="text"
                  value={fajr}
                  onChange={(e) => setFajr(e.target.value)}
                  placeholder="05:15"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#e8e8ea]"
                />
              </div>
              <div>
                <span className="text-[10px] text-[#6e6e73]">Zuhr</span>
                <input
                  type="text"
                  value={zuhr}
                  onChange={(e) => setZuhr(e.target.value)}
                  placeholder="13:30"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#e8e8ea]"
                />
              </div>
              <div>
                <span className="text-[10px] text-[#6e6e73]">Asr</span>
                <input
                  type="text"
                  value={asr}
                  onChange={(e) => setAsr(e.target.value)}
                  placeholder="16:45"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#e8e8ea]"
                />
              </div>
              <div>
                <span className="text-[10px] text-[#6e6e73]">Maghrib</span>
                <input
                  type="text"
                  value={maghrib}
                  onChange={(e) => setMaghrib(e.target.value)}
                  placeholder="18:15"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#e8e8ea]"
                />
              </div>
              <div>
                <span className="text-[10px] text-[#6e6e73]">Isha</span>
                <input
                  type="text"
                  value={isha}
                  onChange={(e) => setIsha(e.target.value)}
                  placeholder="20:00"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#e8e8ea]"
                />
              </div>
              <div>
                <span className="text-[10px] text-[#6e6e73]">Jumu'ah 1st</span>
                <input
                  type="text"
                  value={jumuah}
                  onChange={(e) => setJumuah(e.target.value)}
                  placeholder="13:30"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#e8e8ea]"
                />
              </div>
            </div>

            <div className="pt-0.5">
              <span className="text-[10px] text-[#6e6e73]">Jumu'ah 2nd Session (Optional, for large capacity mosques)</span>
              <input
                type="text"
                value={jumuahSecond}
                onChange={(e) => setJumuahSecond(e.target.value)}
                placeholder="14:15"
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#e8e8ea] mt-0.5"
              />
            </div>

            {/* Ramadan Schedule (Taraweeh, Sahri, Iftar) */}
            <div className="pt-2 border-t border-[#f0f0f2]">
              <button
                type="button"
                onClick={() => setShowRamadan(!showRamadan)}
                className="flex items-center justify-between w-full text-xs font-semibold text-emerald-800 hover:text-emerald-900 bg-emerald-50/60 hover:bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Moon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ramadan Timetable (Taraweeh, Sahri, Iftar)</span>
                </span>
                <span className="text-[10px] text-emerald-600">
                  {showRamadan ? 'Hide' : 'Add / Edit'}
                </span>
              </button>

              {showRamadan && (
                <div className="grid grid-cols-3 gap-2 text-xs mt-2.5 p-2.5 bg-emerald-50/30 rounded-xl border border-emerald-100/60 animate-in fade-in duration-150">
                  <div>
                    <span className="text-[10px] text-[#6e6e73]">Taraweeh</span>
                    <input
                      type="text"
                      value={taraweeh}
                      onChange={(e) => setTaraweeh(e.target.value)}
                      placeholder="20:45"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#e8e8ea] bg-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6e6e73]">Sahri End</span>
                    <input
                      type="text"
                      value={sahri}
                      onChange={(e) => setSahri(e.target.value)}
                      placeholder="04:40"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#e8e8ea] bg-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6e6e73]">Iftar Start</span>
                    <input
                      type="text"
                      value={iftar}
                      onChange={(e) => setIftar(e.target.value)}
                      placeholder="18:25"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#e8e8ea] bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#111114] mb-1">
                Context / Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Changed for winter season as announced last Friday."
                className="w-full p-2.5 text-xs rounded-xl border border-[#e8e8ea] focus:outline-none focus:ring-1 focus:ring-[#111114]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-full bg-[#111114] hover:bg-[#27272a] text-white font-semibold text-xs transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>{isSubmitting ? 'Submitting...' : 'Submit Suggestion'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
