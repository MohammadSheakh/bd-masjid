'use client';

import React, { useState } from 'react';
import { X, Check, Clock, ArrowRight, AlertCircle } from 'lucide-react';
import { Mosque } from '@/types/mosque';
import { updatePrayerSchedule } from '@/lib/api';
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

  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const payload: Record<string, string | undefined> = {
      fajrJamaat: fajr ? convertTo24Hour(fajr) : undefined,
      zuhrJamaat: zuhr ? convertTo24Hour(zuhr) : undefined,
      asrJamaat: asr ? convertTo24Hour(asr) : undefined,
      maghribJamaat: maghrib ? convertTo24Hour(maghrib) : undefined,
      ishaJamaat: isha ? convertTo24Hour(isha) : undefined,
      jumuahJamaat: jumuah ? convertTo24Hour(jumuah) : undefined,
      jumuahSecondJamaat: jumuahSecond ? convertTo24Hour(jumuahSecond) : undefined,
      reason: description.trim() || undefined,
    };

    const cleanPayload: Record<string, string | undefined> = {};
    for (const [key, value] of Object.entries(payload)) {
      if (value) cleanPayload[key] = value;
    }

    try {
      await updatePrayerSchedule(mosque.id, cleanPayload);
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to update timetable. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#e8e8ea] overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#e8e8ea] flex items-center justify-between bg-[#fafafa]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-zinc-100 text-[#111114] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#111114]">Update Prayer Timetable</h2>
              <p className="text-[11px] text-[#6e6e73] truncate max-w-[240px]">{mosque.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-full text-[#6e6e73] hover:text-[#111114] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-[#111114]">Timetable Updated Immediately</h3>
            <p className="text-xs text-[#6e6e73]">
              The new Jamaat times are now live on the platform for all musallis.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
            <p className="text-xs text-[#6e6e73]">
              Enter updated congregational Jamaat times (e.g. 5:15 AM, 1:30 PM). Changes take effect instantly.
            </p>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

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

            <div>
              <label className="block text-xs font-semibold text-[#111114] mb-1">
                Change Reason / Committee Notice (Optional)
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
              <span>{isSubmitting ? 'Updating...' : 'Update Timetable Immediately'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
