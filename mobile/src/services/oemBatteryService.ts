/**
 * OEM Battery Management Service conforming to ADR-037
 * Detects aggressive OEM background killers (Xiaomi HyperOS, Samsung OneUI, Realme ColorOS)
 * and provides brand-specific mitigation steps and settings launcher.
 */
import { Platform, Linking } from 'react-native';

export type DeviceBrand =
  | 'XIAOMI'
  | 'SAMSUNG'
  | 'REALME_OPPO'
  | 'VIVO'
  | 'HUAWEI'
  | 'GENERIC';

export interface OemGuidance {
  brand: DeviceBrand;
  displayName: string;
  osSkin: string;
  warningNote: string;
  steps: string[];
  actionLabel: string;
}

export function detectDeviceBrand(): DeviceBrand {
  if (Platform.OS !== 'android') {
    return 'GENERIC';
  }

  const brand = String((Platform.constants as Record<string, unknown>)?.Brand || '').toLowerCase();
  const manufacturer = String((Platform.constants as Record<string, unknown>)?.Manufacturer || '').toLowerCase();

  const combined = `${brand} ${manufacturer}`;

  if (combined.includes('xiaomi') || combined.includes('redmi') || combined.includes('poco')) {
    return 'XIAOMI';
  }
  if (combined.includes('samsung')) {
    return 'SAMSUNG';
  }
  if (combined.includes('realme') || combined.includes('oppo') || combined.includes('oneplus')) {
    return 'REALME_OPPO';
  }
  if (combined.includes('vivo') || combined.includes('iqoo')) {
    return 'VIVO';
  }
  if (combined.includes('huawei') || combined.includes('honor')) {
    return 'HUAWEI';
  }
  return 'GENERIC';
}

export function getOemGuidance(brand: DeviceBrand): OemGuidance {
  switch (brand) {
    case 'XIAOMI':
      return {
        brand,
        displayName: 'Xiaomi / Redmi / Poco',
        osSkin: 'HyperOS / MIUI',
        warningNote:
          'MIUI and HyperOS kill background alarm receivers unless Autostart is permitted and battery saving is disabled.',
        steps: [
          'Enable "Autostart" in App Info settings',
          'Set Battery Saver to "No restrictions"',
          'Lock BD Masjid in the recent apps task switcher',
        ],
        actionLabel: 'Open Xiaomi App Settings',
      };
    case 'SAMSUNG':
      return {
        brand,
        displayName: 'Samsung Galaxy',
        osSkin: 'OneUI / Device Care',
        warningNote:
          'Samsung Device Care puts idle apps into Deep Sleep, delaying exact Jammat auto-silent triggers.',
        steps: [
          'Open Battery settings in App Info',
          'Change battery usage from "Optimized" to "Unrestricted"',
          'Add BD Masjid to "Never sleeping apps" in Device Care',
        ],
        actionLabel: 'Open Samsung Battery Settings',
      };
    case 'REALME_OPPO':
      return {
        brand,
        displayName: 'Realme / Oppo / OnePlus',
        osSkin: 'ColorOS / OxygenOS',
        warningNote:
          'ColorOS freezes background alarms aggressively during screen-off sleep.',
        steps: [
          'Enable "Allow background activity"',
          'Enable "Allow auto-launch"',
          'Disable "Deep optimization / Sleep standby"',
        ],
        actionLabel: 'Open Background Settings',
      };
    case 'VIVO':
      return {
        brand,
        displayName: 'Vivo / iQOO',
        osSkin: 'FuntouchOS / OriginOS',
        warningNote:
          'FuntouchOS restricts high background power usage unless explicitly authorized.',
        steps: [
          'Set background power consumption to "High background power"',
          'Enable "Autostart" permission',
        ],
        actionLabel: 'Open Vivo App Settings',
      };
    default:
      return {
        brand,
        displayName: 'Android Device',
        osSkin: 'Stock Android',
        warningNote:
          'Disable standard battery optimization to guarantee prayer Auto-Silent alarms trigger on time while idle.',
        steps: [
          'Open App Info > Battery',
          'Select "Unrestricted" battery usage',
        ],
        actionLabel: 'Open App Settings',
      };
  }
}

export async function openOemBatterySettings(): Promise<void> {
  try {
    await Linking.openSettings();
  } catch {
    // Graceful fallback
  }
}
