/**
 * Notification Fixtures (ADR-013, ADR-053 Parity)
 * Fallback fixtures simulating live database events for followed mosques.
 */

import { UserNotification } from '../types/mosque';

export const BANGLADESH_NOTIFICATION_FIXTURES: UserNotification[] = [
  {
    id: 'notif-1',
    mosqueId: 'mosque-dhaka-baitul-mukarram',
    type: 'ANNOUNCEMENT',
    title: 'Urgent: Namaz-e-Janazah Notice',
    body: 'Namaz-e-Janazah of respected scholar Mawlana Nurul Islam will be held immediately after Asr prayer (4:45 PM) at South Plaza.',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    mosque: {
      id: 'mosque-dhaka-baitul-mukarram',
      name: 'Baitul Mukarram National Mosque',
      city: 'Dhaka',
    },
  },
  {
    id: 'notif-2',
    mosqueId: 'mosque-dhaka-tara-masjid',
    type: 'SCHEDULE_CHANGE',
    title: 'Maghrib Jammat Time Updated',
    body: 'Maghrib Jammat shifted to 18:15 due to seasonal twilight change.',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    mosque: {
      id: 'mosque-dhaka-tara-masjid',
      name: 'Star Mosque (Tara Masjid)',
      city: 'Dhaka',
    },
  },
  {
    id: 'notif-3',
    mosqueId: 'mosque-dhaka-baitul-mukarram',
    type: 'ANNOUNCEMENT',
    title: "Special Jumu'ah Khutbah",
    body: 'Khutbah on "Family Values & Youth Guidance in Islam" delivered by visiting Khatib Dr. Muhammad Shahidullah.',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    mosque: {
      id: 'mosque-dhaka-baitul-mukarram',
      name: 'Baitul Mukarram National Mosque',
      city: 'Dhaka',
    },
  },
  {
    id: 'notif-4',
    mosqueId: 'mosque-chattogram-anderkilla',
    type: 'DONATION_UPDATE',
    title: 'Verified bKash Merchant Channel Added',
    body: 'Official bKash merchant number (01811998877) verified by Committee President and General Secretary.',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    mosque: {
      id: 'mosque-chattogram-anderkilla',
      name: 'Anderkilla Shahi Jame Mosque',
      city: 'Chattogram',
    },
  },
];
