/**
 * OEM Battery Optimization Mitigation Engine (ADR-037, PRD Screen 15)
 * Detects aggressive Android OEM task killers (Xiaomi, Samsung, Realme, Oppo, Vivo)
 * and provides brand-specific step-by-step mitigation instructions with deep links.
 */

import { Platform, Linking } from 'react-native';
import { PreferencesStorage } from '../lib/storage';

export type DeviceBrand = 'xiaomi' | 'samsung' | 'realme' | 'vivo' | 'generic' | 'ios';

export interface OemGuidance {
  brand: DeviceBrand;
  displayName: string;
  osSkin: string;
  warningNote: string;
  steps: string[];
  actionLabel: string;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
}

const OEM_GUIDANCE_CATALOG: Record<DeviceBrand, OemGuidance> = {
  xiaomi: {
    brand: 'xiaomi',
    displayName: 'Xiaomi / Redmi / POCO',
    osSkin: 'HyperOS / MIUI',
    warningNote: 'Aggressive battery management may silence or kill Jamaat countdowns and automated silent mode while your screen is off.',
    steps: [
      'Tap "Configure in System Settings" below to open App Info.',
      'Tap Battery Saver → Choose "No restrictions".',
      'Enable "Autostart" in App Permissions to guarantee timely prayer alarms.',
    ],
    actionLabel: 'Configure in HyperOS / MIUI Settings',
    riskLevel: 'HIGH',
  },
  samsung: {
    brand: 'samsung',
    displayName: 'Samsung Galaxy',
    osSkin: 'OneUI / Device Care',
    warningNote: 'OneUI puts background apps to deep sleep, preventing exact alarms and mosque notification updates.',
    steps: [
      'Tap "Configure in System Settings" below to open App Info.',
      'Tap Battery → Select "Unrestricted" background usage.',
      'Ensure BD Masjid is NOT listed in "Sleeping apps" or "Deep sleeping apps".',
    ],
    actionLabel: 'Configure in OneUI Battery Settings',
    riskLevel: 'HIGH',
  },
  realme: {
    brand: 'realme',
    displayName: 'Realme / Oppo / OnePlus',
    osSkin: 'ColorOS / OxygenOS',
    warningNote: 'ColorOS deep optimization suspends exact alarms when the phone remains idle during night or work hours.',
    steps: [
      'Tap "Configure in System Settings" below to open App Info.',
      'Enable "Allow background activity" and "Allow auto-launch".',
      'Disable "Deep cleanup / Optimization" for BD Masjid.',
    ],
    actionLabel: 'Configure in ColorOS Battery Settings',
    riskLevel: 'HIGH',
  },
  vivo: {
    brand: 'vivo',
    displayName: 'Vivo / iQOO',
    osSkin: 'Funtouch OS / OriginOS',
    warningNote: 'Funtouch OS restricts high background power apps, which can delay pre-Jamaat reminders.',
    steps: [
      'Tap "Configure in System Settings" below to open App Info.',
      'Navigate to Battery Management → Set to "High background power consumption".',
      'Ensure "Autostart" permission is granted.',
    ],
    actionLabel: 'Configure in Funtouch OS Settings',
    riskLevel: 'MEDIUM',
  },
  generic: {
    brand: 'generic',
    displayName: 'Android Device',
    osSkin: 'Stock Android',
    warningNote: 'Standard Android Doze mode can delay notifications if battery optimization is enabled.',
    steps: [
      'Tap "Configure in System Settings" below to open App Info.',
      'Tap Battery → Select "Unrestricted" to allow timely alarms.',
    ],
    actionLabel: 'Configure in App Settings',
    riskLevel: 'LOW',
  },
  ios: {
    brand: 'ios',
    displayName: 'Apple iPhone',
    osSkin: 'iOS',
    warningNote: 'iOS handles background alarms strictly via native notifications and focus modes.',
    steps: [
      'Ensure notifications are allowed in iOS Settings.',
      'For automated silence, use iOS Focus or the Action button / mute switch.',
    ],
    actionLabel: 'Open iOS Settings',
    riskLevel: 'LOW',
  },
};

export function detectDeviceBrand(): DeviceBrand {
  if (Platform.OS === 'ios') return 'ios';
  const constants = (Platform.constants || {}) as Record<string, any>;
  const brand = String(constants.Brand || constants.Manufacturer || '').toLowerCase();

  if (brand.includes('xiaomi') || brand.includes('redmi') || brand.includes('poco')) {
    return 'xiaomi';
  }
  if (brand.includes('samsung')) {
    return 'samsung';
  }
  if (brand.includes('realme') || brand.includes('oppo') || brand.includes('oneplus')) {
    return 'realme';
  }
  if (brand.includes('vivo') || brand.includes('iqoo')) {
    return 'vivo';
  }
  return 'generic';
}

export function getOemGuidance(brandKey?: string): OemGuidance {
  const brand = (brandKey as DeviceBrand) || detectDeviceBrand();
  return OEM_GUIDANCE_CATALOG[brand] || OEM_GUIDANCE_CATALOG.generic;
}

export async function openOemBatterySettings(): Promise<void> {
  try {
    await Linking.openSettings();
  } catch {}
}

export const OemBatteryService = {
  detectDeviceBrand,
  getOemGuidance,
  openOemBatterySettings,

  shouldShowWizard(): boolean {
    if (Platform.OS !== 'android') return false;
    return !PreferencesStorage.isOemWizardDismissed();
  },

  isDismissed(): boolean {
    return PreferencesStorage.isOemWizardDismissed();
  },

  dismissWizard(): void {
    PreferencesStorage.setOemWizardDismissed();
  },
};
