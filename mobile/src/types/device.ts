/**
 * Remote Push Device Domain Models (ADR-055)
 * Conforming to backend-nest-prisma/src/features/user-management/userDevices/
 */

export type DeviceType = 'android' | 'ios' | 'web' | 'desktop';

export interface RegisterDevicePayload {
  fcmToken: string;
  deviceType: DeviceType;
  deviceName?: string;
  deviceOsVersion?: string;
  appVersion?: string;
}

export interface UserDevice {
  id: string;
  userId?: string;
  fcmToken: string;
  deviceType: DeviceType;
  deviceName: string;
  deviceOsVersion?: string | null;
  appVersion?: string | null;
  isPushEnabled: boolean;
  lastActiveAt?: string | null;
  createdAt: string;
}
