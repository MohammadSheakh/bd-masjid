import React, { useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
} from 'react-native';
import { Mosque, MosqueDonationMethod, MosqueStaffMember, PrayerSchedule } from '../types/mosque';
import { formatTo12Hour } from '../lib/time';
import { ferioColors, ferioRadius, ferioSpacing } from '../theme/tokens';
import { AttendanceAffiliationCard } from './AttendanceAffiliationCard';
import { TimetableUpdateModal } from './TimetableUpdateModal';
import { NoticeBoardModal } from './NoticeBoardModal';
import { ReportIssueModal } from './ReportIssueModal';

interface MosqueDetailSheetProps {
  mosque: Mosque | null;
  visible: boolean;
  isFollowed?: boolean;
  onToggleFollow?: (id: string) => void;
  onClose: () => void;
}

export const MosqueDetailSheet: React.FC<MosqueDetailSheetProps> = ({
  mosque,
  visible,
  isFollowed = false,
  onToggleFollow,
  onClose,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [noticeModalVisible, setNoticeModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [activeSchedule, setActiveSchedule] = useState<PrayerSchedule | null | undefined>(mosque?.prayerSchedule);

  useEffect(() => {
    setActiveSchedule(mosque?.prayerSchedule);
  }, [mosque?.id, mosque?.prayerSchedule]);

  if (!mosque) return null;

  const schedule = activeSchedule ?? mosque.prayerSchedule;

  const prayerRows = [
    { name: 'Fajr', jammat: schedule?.fajrJamaat, start: schedule?.fajrStart },
    { name: 'Zuhr', jammat: schedule?.zuhrJamaat, start: schedule?.zuhrStart },
    { name: 'Asr', jammat: schedule?.asrJamaat, start: schedule?.asrStart },
    { name: 'Maghrib', jammat: schedule?.maghribJamaat, start: schedule?.maghribStart },
    { name: 'Isha', jammat: schedule?.ishaJamaat, start: schedule?.ishaStart },
    { name: "Jumu'ah", jammat: schedule?.jumuahJamaat, start: '12:45' },
  ];

  const handleCopy = (method: MosqueDonationMethod) => {
    setCopiedId(method.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          <View style={styles.dragIndicator} />

          {/* Sheet Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Text style={styles.mosqueName} numberOfLines={1}>
                {mosque.name}
              </Text>
              <Text style={styles.mosqueAddress} numberOfLines={1}>
                {mosque.address || mosque.city || 'Bangladesh'}
                {mosque.distanceMeters !== undefined
                  ? ` • ${Math.round(mosque.distanceMeters)}m away`
                  : ''}
              </Text>
            </View>

            <View style={styles.headerActions}>
              <Pressable
                onPress={() => onToggleFollow?.(mosque.id)}
                style={[styles.followBtn, isFollowed && styles.followBtnActive]}
              >
                <Text style={[styles.followBtnText, isFollowed && styles.followBtnTextActive]}>
                  {isFollowed ? 'Following' : '+ Follow'}
                </Text>
              </Pressable>

              <Pressable onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </Pressable>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Mosque Notice Board Strip (ADR-011, ADR-044) */}
            {mosque.announcements && mosque.announcements.length > 0 && (
              <Pressable
                onPress={() => setNoticeModalVisible(true)}
                style={[
                  styles.noticeStrip,
                  mosque.announcements.some((a) => a.priority === 'URGENT') && styles.noticeStripUrgent,
                ]}
                accessibilityRole="button"
                accessibilityLabel="View Mosque Notice Board"
              >
                <View style={styles.noticeStripLeft}>
                  <Text style={styles.noticeStripIcon}>
                    {mosque.announcements.some((a) => a.priority === 'URGENT') ? '🚨' : '📢'}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.noticeStripTitle,
                        mosque.announcements.some((a) => a.priority === 'URGENT') && styles.noticeStripTitleUrgent,
                      ]}
                      numberOfLines={1}
                    >
                      {mosque.announcements[0].title}
                    </Text>
                    <Text style={styles.noticeStripSub}>
                      {mosque.announcements.length} active notice{mosque.announcements.length > 1 ? 's' : ''} • Tap to view notice board
                    </Text>
                  </View>
                </View>
                <Text style={styles.noticeStripArrow}>→</Text>
              </Pressable>
            )}

            {/* Community Attendance Affiliation & Dual-Count (ADR-024, ADR-035) */}
            <AttendanceAffiliationCard
              mosqueId={mosque.id}
              summary={mosque.attendanceSummary}
            />

            {/* Card 1: Complete Timetable Breakdown */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardTitle}>Daily Jammat Timetable</Text>
                  <Text style={styles.cardHeaderSub}>Direct community correction</Text>
                </View>
                <Pressable
                  onPress={() => setUpdateModalVisible(true)}
                  style={styles.updateTimesBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Update prayer times"
                >
                  <Text style={styles.updateTimesBtnText}>+ Update</Text>
                </Pressable>
              </View>

              <View style={styles.timetableTable}>
                {prayerRows.map((row) => (
                  <View key={row.name} style={styles.tableRow}>
                    <Text style={styles.waqtCol}>{row.name}</Text>
                    <Text style={styles.timeCol}>{formatTo12Hour(row.jammat, '—')}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Card 2: Verified Donation Channels (ADR-028) */}
            {mosque.donationMethods && mosque.donationMethods.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Verified Donations</Text>
                  <Text style={styles.cardHeaderSub}>1-tap copy</Text>
                </View>

                {mosque.donationMethods.map((method) => (
                  <View key={method.id} style={styles.donationItem}>
                    <View style={styles.donationDetails}>
                      <View style={styles.methodHeader}>
                        <Text style={styles.methodName}>{method.methodType}</Text>
                        <Text style={styles.accountTypeBadge}>{method.accountType}</Text>
                      </View>
                      <Text style={styles.accountNumber}>{method.accountNumber}</Text>
                      {method.accountTitle && (
                        <Text style={styles.accountTitle}>{method.accountTitle}</Text>
                      )}
                      {method.verifiedByRoles && (
                        <Text style={styles.provenanceText}>
                          ✓ Verified by {method.verifiedByRoles.join(', ').toLowerCase()}
                        </Text>
                      )}
                    </View>

                    <Pressable
                      onPress={() => handleCopy(method)}
                      style={[styles.copyPill, copiedId === method.id && styles.copyPillActive]}
                    >
                      <Text
                        style={[
                          styles.copyPillText,
                          copiedId === method.id && styles.copyPillTextActive,
                        ]}
                      >
                        {copiedId === method.id ? 'Copied!' : 'Copy'}
                      </Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            {/* Card 3: Verified Staff Roster (ADR-024) */}
            {mosque.staffMembers && mosque.staffMembers.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Mosque Leadership & Staff</Text>
                </View>

                {mosque.staffMembers.map((staff: MosqueStaffMember) => (
                  <View key={staff.id} style={styles.staffItem}>
                    <View style={styles.staffInfo}>
                      <Text style={styles.staffName}>{staff.name}</Text>
                      <Text style={styles.staffRole}>{staff.role}</Text>
                    </View>
                    {staff.isVerified && (
                      <View style={styles.staffVerifiedPill}>
                        <Text style={styles.staffVerifiedText}>✓ Verified</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Card 4: Facilities Overview (ADR-025) */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Facilities & Amenities</Text>
                {mosque.capacity ? (
                  <Text style={styles.capacityBadge}>Capacity: {mosque.capacity.toLocaleString()}</Text>
                ) : null}
              </View>

              <View style={styles.facilityGrid}>
                {[
                  { label: "Women's Area", available: mosque.hasSeparateWomenSpace },
                  { label: 'Air Conditioning', available: mosque.hasAirConditioning },
                  { label: 'Parking Area', available: mosque.hasParking },
                  { label: 'Wheelchair Access', available: mosque.hasWheelchairAccess },
                  { label: 'Janaza Facility', available: mosque.hasJanazaFacility },
                ].map((item) => (
                  <View key={item.label} style={styles.facilityPill}>
                    <Text style={item.available ? styles.facIconActive : styles.facIconInactive}>
                      {item.available ? '●' : '○'}
                    </Text>
                    <Text style={styles.facLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Community Issue Reporting Trigger (ADR-020, ADR-045) */}
            <Pressable
              style={styles.reportIssueTrigger}
              onPress={() => setReportModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Report an issue with this mosque"
            >
              <Text style={styles.reportIssueText}>🚩 Report an issue / incorrect information</Text>
            </Pressable>
          </ScrollView>
        </View>

        <TimetableUpdateModal
          visible={updateModalVisible}
          mosqueId={mosque.id}
          mosqueName={mosque.name}
          currentSchedule={schedule}
          onClose={() => setUpdateModalVisible(false)}
          onScheduleUpdated={(partial) => {
            setActiveSchedule((prev) => ({ ...(prev ?? {}), ...partial }));
          }}
        />

        <NoticeBoardModal
          visible={noticeModalVisible}
          mosqueName={mosque.name}
          announcements={mosque.announcements || []}
          onClose={() => setNoticeModalVisible(false)}
        />

        <ReportIssueModal
          visible={reportModalVisible}
          mosqueId={mosque.id}
          mosqueName={mosque.name}
          onClose={() => setReportModalVisible(false)}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: ferioColors.canvas,
    borderTopLeftRadius: ferioRadius.xl,
    borderTopRightRadius: ferioRadius.xl,
    paddingHorizontal: ferioSpacing.lg,
    paddingTop: ferioSpacing.md,
    maxHeight: '90%',
  },
  dragIndicator: {
    width: 36,
    height: 4,
    backgroundColor: ferioColors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: ferioSpacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: ferioSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ferioColors.border,
  },
  headerLeft: {
    flex: 1,
    marginRight: ferioSpacing.md,
  },
  mosqueName: {
    fontSize: 17,
    fontWeight: '700',
    color: ferioColors.primary,
  },
  mosqueAddress: {
    fontSize: 12,
    color: ferioColors.muted,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ferioSpacing.sm,
  },
  followBtn: {
    paddingHorizontal: ferioSpacing.md,
    paddingVertical: ferioSpacing.xs,
    borderRadius: ferioRadius.full,
    backgroundColor: ferioColors.surface,
    borderWidth: 1,
    borderColor: ferioColors.border,
  },
  followBtnActive: {
    backgroundColor: ferioColors.primary,
    borderColor: ferioColors.primary,
  },
  followBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: ferioColors.primary,
  },
  followBtnTextActive: {
    color: ferioColors.primaryForeground,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: ferioColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ferioColors.border,
  },
  closeBtnText: {
    fontSize: 12,
    color: ferioColors.muted,
    fontWeight: '700',
  },
  scrollBody: {
    paddingVertical: ferioSpacing.md,
    gap: ferioSpacing.md,
    paddingBottom: ferioSpacing.xxxl,
  },
  card: {
    backgroundColor: ferioColors.surface,
    borderRadius: ferioRadius.xl,
    padding: ferioSpacing.md,
    borderWidth: 1,
    borderColor: ferioColors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ferioSpacing.sm,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: ferioColors.primary,
  },
  cardHeaderSub: {
    fontSize: 11,
    color: ferioColors.muted,
  },
  badgeSuccess: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: ferioSpacing.sm,
    paddingVertical: 2,
    borderRadius: ferioRadius.full,
  },
  badgeSuccessText: {
    fontSize: 10,
    fontWeight: '600',
    color: ferioColors.accent,
  },
  updateTimesBtn: {
    backgroundColor: '#f4f4f5',
    paddingHorizontal: ferioSpacing.sm,
    paddingVertical: 5,
    borderRadius: ferioRadius.full,
    borderWidth: 1,
    borderColor: ferioColors.border,
  },
  updateTimesBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: ferioColors.primary,
  },
  timetableTable: {
    borderTopWidth: 1,
    borderTopColor: ferioColors.border,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: ferioSpacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
  },
  waqtCol: {
    fontSize: 13,
    color: ferioColors.muted,
    fontWeight: '500',
  },
  timeCol: {
    fontSize: 13,
    color: ferioColors.primary,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  donationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: ferioColors.canvas,
    borderRadius: ferioRadius.lg,
    padding: ferioSpacing.sm,
    marginBottom: ferioSpacing.xs,
    borderWidth: 1,
    borderColor: ferioColors.border,
  },
  donationDetails: {
    flex: 1,
    marginRight: ferioSpacing.sm,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  methodName: {
    fontSize: 12,
    fontWeight: '700',
    color: ferioColors.primary,
  },
  accountTypeBadge: {
    fontSize: 9,
    color: ferioColors.muted,
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 4,
    borderRadius: 3,
  },
  accountNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: ferioColors.primary,
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
  },
  accountTitle: {
    fontSize: 11,
    color: ferioColors.muted,
    marginTop: 1,
  },
  provenanceText: {
    fontSize: 10,
    color: ferioColors.accent,
    fontWeight: '500',
    marginTop: 2,
  },
  copyPill: {
    paddingHorizontal: ferioSpacing.md,
    paddingVertical: ferioSpacing.xs,
    borderRadius: ferioRadius.full,
    backgroundColor: ferioColors.surface,
    borderWidth: 1,
    borderColor: ferioColors.border,
  },
  copyPillActive: {
    backgroundColor: ferioColors.accent,
    borderColor: ferioColors.accent,
  },
  copyPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: ferioColors.primary,
  },
  copyPillTextActive: {
    color: '#ffffff',
  },
  staffItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: ferioSpacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 13,
    fontWeight: '600',
    color: ferioColors.primary,
  },
  staffRole: {
    fontSize: 11,
    color: ferioColors.muted,
    marginTop: 1,
  },
  staffVerifiedPill: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: ferioSpacing.sm,
    paddingVertical: 2,
    borderRadius: ferioRadius.full,
  },
  staffVerifiedText: {
    fontSize: 10,
    fontWeight: '600',
    color: ferioColors.accent,
  },
  capacityBadge: {
    fontSize: 11,
    fontWeight: '500',
    color: ferioColors.muted,
  },
  facilityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ferioSpacing.xs,
  },
  facilityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ferioColors.canvas,
    borderRadius: ferioRadius.full,
    paddingHorizontal: ferioSpacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: ferioColors.border,
    marginRight: 4,
    marginBottom: 4,
  },
  facIconActive: {
    color: ferioColors.accent,
    fontSize: 10,
    marginRight: 4,
  },
  facIconInactive: {
    color: ferioColors.muted,
    fontSize: 10,
    marginRight: 4,
  },
  facLabel: {
    fontSize: 11,
    color: ferioColors.primary,
    fontWeight: '500',
  },
  noticeStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: ferioRadius.md,
    padding: ferioSpacing.md,
    marginBottom: ferioSpacing.md,
  },
  noticeStripUrgent: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
  },
  noticeStripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  noticeStripIcon: {
    fontSize: 20,
    marginRight: ferioSpacing.sm,
  },
  noticeStripTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e40af',
  },
  noticeStripTitleUrgent: {
    color: '#991b1b',
  },
  noticeStripSub: {
    fontSize: 11,
    color: ferioColors.muted,
    marginTop: 2,
  },
  noticeStripArrow: {
    fontSize: 16,
    color: ferioColors.muted,
    marginLeft: ferioSpacing.sm,
  },
  reportIssueTrigger: {
    paddingVertical: ferioSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: ferioSpacing.sm,
    marginBottom: ferioSpacing.xl,
  },
  reportIssueText: {
    fontSize: 12,
    color: ferioColors.muted,
    textDecorationLine: 'underline',
  },
});
