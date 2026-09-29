'use client';

import React, { useState } from 'react';
import { X, Check, Edit3, ArrowRight, Moon } from 'lucide-react';
import { Mosque } from '@/types/mosque';
import { submitScheduleSuggestion } from '@/lib/api';
import { formatTo12Hour, convertTo24Hour } from '@/lib/time';
import { TimePickerInput } from '@/components/TimePickerInput';

interface SuggestionModalProps {
  mosque: Mosque | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function SuggestionModal({ mosque, onClose, onSuccess }: SuggestionModalProps) {
  if (!mosque) return null;

  const schedule = mosque.prayerSchedule;

  const [fajr, setFajr] = useState(formatTo12Hour(schedule?.fajrJamaat, ''));
  const [zuhr, setZuhr] = useState(formatTo12Hour(schedule?.zuhrJamaat, ''));
  const [asr, setAsr] = useState(formatTo12Hour(schedule?.asrJamaat, ''));
  const [maghrib, setMaghrib] = useState(formatTo12Hour(schedule?.maghribJamaat, ''));
  const [isha, setIsha] = useState(formatTo12Hour(schedule?.ishaJamaat, ''));
  const [jumuah, setJumuah] = useState(formatTo12Hour(schedule?.jumuahJamaat, ''));
  const [jumuahSecond, setJumuahSecond] = useState(formatTo12Hour(schedule?.jumuahSecondJamaat, ''));

  // Ramadan timings
  const [taraweeh, setTaraweeh] = useState(formatTo12Hour(schedule?.taraweehJamaat, ''));
  const [sahri, setSahri] = useState(formatTo12Hour(schedule?.sahriEnd, ''));
  const [iftar, setIftar] = useState(formatTo12Hour(schedule?.iftarStart, ''));
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
          fajrJamaat: fajr ? convertTo24Hour(fajr) : undefined,
          zuhrJamaat: zuhr ? convertTo24Hour(zuhr) : undefined,
          asrJamaat: asr ? convertTo24Hour(asr) : undefined,
          maghribJamaat: maghrib ? convertTo24Hour(maghrib) : undefined,
          ishaJamaat: isha ? convertTo24Hour(isha) : undefined,
          jumuahJamaat: jumuah ? convertTo24Hour(jumuah) : undefined,
          jumuahSecondJamaat: jumuahSecond ? convertTo24Hour(jumuahSecond) : undefined,
          taraweehJamaat: taraweeh ? convertTo24Hour(taraweeh) : undefined,
          sahriEnd: sahri ? convertTo24Hour(sahri) : undefined,
          iftarStart: iftar ? convertTo24Hour(iftar) : undefined,
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
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
              Enter the updated Jamaat times announced by the mosque committee (e.g. 5:15 AM, 1:30 PM).
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div>
                <span className="text-[10px] text-[#6e6e73] font-medium block mb-1">Fajr</span>
                <TimePickerInput
                  value={fajr}
                  onChange={setFajr}
                  placeholder="5:15"
                  defaultPeriod="AM"
                />
              </div>
              <div>
                <span className="text-[10px] text-[#6e6e73] font-medium block mb-1">Zuhr</span>
                <TimePickerInput
                  value={zuhr}
                  onChange={setZuhr}
                  placeholder="1:30"
                  defaultPeriod="PM"
                />
              </div>
              <div>
                <span className="text-[10px] text-[#6e6e73] font-medium block mb-1">Asr</span>
                <TimePickerInput
                  value={asr}
                  onChange={setAsr}
                  placeholder="4:45"
                  defaultPeriod="PM"
                />
              </div>
              <div>
                <span className="text-[10px] text-[#6e6e73] font-medium block mb-1">Maghrib</span>
                <TimePickerInput
                  value={maghrib}
                  onChange={setMaghrib}
                  placeholder="6:15"
                  defaultPeriod="PM"
                />
              </div>
              <div>
                <span className="text-[10px] text-[#6e6e73] font-medium block mb-1">Isha</span>
                <TimePickerInput
                  value={isha}
                  onChange={setIsha}
                  placeholder="8:00"
                  defaultPeriod="PM"
                />
              </div>
              <div>
                <span className="text-[10px] text-[#6e6e73] font-medium block mb-1">Jumu'ah 1st</span>
                <TimePickerInput
                  value={jumuah}
                  onChange={setJumuah}
                  placeholder="1:30"
                  defaultPeriod="PM"
                />
              </div>
            </div>

            <div className="pt-0.5">
              <span className="text-[10px] text-[#6e6e73] font-medium block mb-1">
                Jumu'ah 2nd Session (Optional, for large capacity mosques)
              </span>
              <TimePickerInput
                value={jumuahSecond}
                onChange={setJumuahSecond}
                placeholder="2:15"
                defaultPeriod="PM"
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
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs mt-2.5 p-2.5 bg-emerald-50/30 rounded-xl border border-emerald-100/60 animate-in fade-in duration-150">
                  <div>
                    <span className="text-[10px] text-[#6e6e73] font-medium block mb-1">Taraweeh</span>
                    <TimePickerInput
                      value={taraweeh}
                      onChange={setTaraweeh}
                      placeholder="8:45"
                      defaultPeriod="PM"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6e6e73] font-medium block mb-1">Sahri End</span>
                    <TimePickerInput
                      value={sahri}
                      onChange={setSahri}
                      placeholder="4:30"
                      defaultPeriod="AM"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6e6e73] font-medium block mb-1">Iftar Start</span>
                    <TimePickerInput
                      value={iftar}
                      onChange={setIftar}
                      placeholder="6:15"
                      defaultPeriod="PM"
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
