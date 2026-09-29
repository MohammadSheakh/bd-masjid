'use client';

import React, { useState, useEffect, useRef } from 'react';

export interface TimePickerInputProps {
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  defaultPeriod?: 'AM' | 'PM';
  disabled?: boolean;
  className?: string;
  id?: string;
}

/**
 * Parses any raw time string (12h "5:15 AM", 24h "17:30", or partial "5:15")
 * into a separated time string and period ('AM' | 'PM').
 */
export function parseTimeString(
  val?: string | null,
  fallbackPeriod: 'AM' | 'PM' = 'PM'
): { time: string; period: 'AM' | 'PM' } {
  if (!val || !val.trim()) {
    return { time: '', period: fallbackPeriod };
  }
  const str = val.trim();

  // Match 12-hour format e.g. "5:15 AM", "05:15 PM", "1:30pm", "1: AM"
  const m12 = str.match(/^(\d{1,2}(?::\d{0,2})?)\s*(AM|PM|am|pm)$/i);
  if (m12) {
    const rawTime = m12[1];
    const period = m12[2].toUpperCase() as 'AM' | 'PM';
    // Format hour nicely if colon and minutes exist
    if (rawTime.includes(':')) {
      const [h, m] = rawTime.split(':');
      const parsedH = parseInt(h, 10);
      if (!isNaN(parsedH)) {
        return { time: `${parsedH}:${m}`, period };
      }
    }
    return { time: rawTime, period };
  }

  // Match 24-hour format e.g. "13:30", "05:15", "0:45"
  const m24 = str.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) {
    const hours24 = parseInt(m24[1], 10);
    const m = m24[2];
    if (hours24 >= 0 && hours24 <= 23) {
      const period: 'AM' | 'PM' = hours24 >= 12 ? 'PM' : 'AM';
      const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
      return { time: `${hours12}:${m}`, period };
    }
  }

  // Bare time digits e.g. "5:15"
  const bareMatch = str.match(/^(\d{1,2}(?::\d{0,2})?)$/);
  if (bareMatch) {
    return { time: bareMatch[1], period: fallbackPeriod };
  }

  return { time: str, period: fallbackPeriod };
}

/**
 * Handles text entered in the input, extracting AM/PM if typed or pasted.
 */
function parseRawInput(
  raw: string,
  currentPeriod: 'AM' | 'PM'
): { timePart: string; period: 'AM' | 'PM'; full12h: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { timePart: '', period: currentPeriod, full12h: '' };
  }

  // Check if typed or pasted with AM/PM
  const ampmMatch = trimmed.match(/^(\d{1,2}(?::\d{0,2})?)\s*(AM|PM|am|pm)$/i);
  if (ampmMatch) {
    const rawTime = ampmMatch[1];
    const detectedPeriod = ampmMatch[2].toUpperCase() as 'AM' | 'PM';
    return {
      timePart: rawTime,
      period: detectedPeriod,
      full12h: `${rawTime} ${detectedPeriod}`,
    };
  }

  // Check if 24-hour time like "13:30"
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const h = parseInt(match24[1], 10);
    const m = match24[2];
    if (h >= 13 && h <= 23) {
      const h12 = h - 12;
      return {
        timePart: `${h12}:${m}`,
        period: 'PM',
        full12h: `${h12}:${m} PM`,
      };
    } else if (h === 0) {
      return {
        timePart: `12:${m}`,
        period: 'AM',
        full12h: `12:${m} AM`,
      };
    } else if (h === 12) {
      return {
        timePart: `12:${m}`,
        period: 'PM',
        full12h: `12:${m} PM`,
      };
    }
  }

  return {
    timePart: raw,
    period: currentPeriod,
    full12h: `${trimmed} ${currentPeriod}`,
  };
}

export function TimePickerInput({
  value,
  onChange,
  placeholder = '1:30',
  defaultPeriod = 'PM',
  disabled = false,
  className = '',
  id,
}: TimePickerInputProps) {
  const initial = parseTimeString(value, defaultPeriod);
  const [localTime, setLocalTime] = useState<string>(initial.time);
  const [period, setPeriod] = useState<'AM' | 'PM'>(initial.period);

  const prevValueRef = useRef(value);

  // Synchronize with external changes to `value`
  useEffect(() => {
    if (value !== prevValueRef.current) {
      prevValueRef.current = value;
      const parsed = parseTimeString(value, defaultPeriod);
      setLocalTime(parsed.time);
      if (value && value.trim()) {
        setPeriod(parsed.period);
      }
    }
  }, [value, defaultPeriod]);

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const parsed = parseRawInput(raw, period);
    setLocalTime(parsed.timePart);
    setPeriod(parsed.period);
    prevValueRef.current = parsed.full12h;
    onChange(parsed.full12h);
  };

  const handlePeriodChange = (newPeriod: 'AM' | 'PM') => {
    setPeriod(newPeriod);
    const nextValue = localTime.trim() ? `${localTime.trim()} ${newPeriod}` : '';
    prevValueRef.current = nextValue;
    onChange(nextValue);
  };

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {/* Time digits input */}
      <input
        id={id}
        type="text"
        value={localTime}
        onChange={handleTimeChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full min-w-0 px-2.5 py-1.5 text-xs text-[#111114] placeholder:text-[#8e8e93] rounded-lg border border-[#e8e8ea] bg-white focus:outline-none focus:border-[#111114] focus:ring-1 focus:ring-[#111114]/20 transition-all disabled:opacity-50 disabled:bg-zinc-50"
      />

      {/* AM / PM dropdown selector matching the compact box design */}
      <div className="relative shrink-0">
        <select
          value={period}
          onChange={(e) => handlePeriodChange(e.target.value as 'AM' | 'PM')}
          disabled={disabled}
          aria-label="Select AM or PM"
          className="appearance-none bg-[#f5f5f7] hover:bg-[#ebebee] active:bg-[#e4e4e7] border border-[#d2d2d7] text-[#111114] text-xs font-semibold rounded-lg pl-2.5 pr-6 py-1.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#111114] transition-all select-none disabled:opacity-50"
        >
          <option value="AM" className="bg-white text-zinc-900 font-semibold py-1">
            AM
          </option>
          <option value="PM" className="bg-white text-zinc-900 font-semibold py-1">
            PM
          </option>
        </select>
        {/* Downward triangle arrow indicator */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
          <svg
            className="w-2 h-2 text-[#6e6e73]"
            viewBox="0 0 10 6"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M0 0h10L5 6z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
