import React, { useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Linking,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Mosque, MosqueStaffMember, MosqueSuggestionItem, PrayerSchedule } from '../types/mosque';
import { ApiClient } from '../lib/apiClient';
import { formatTo12Hour } from '../lib/time';
import { ferioColors, ferioRadius, ferioSpacing } from '../theme/tokens';
import { AttendanceAffiliationCard } from './AttendanceAffiliationCard';
import { TimetableUpdateModal } from './TimetableUpdateModal';
import { NoticeBoardModal } from './NoticeBoardModal';
import { ReportIssueModal } from './ReportIssueModal';
import { LeadershipRosterCard } from './LeadershipRosterCard';
import { FacilitiesCard } from './FacilitiesCard';
import { SuggestFacilitiesModal } from './SuggestFacilitiesModal';
import { MosqueSuggestionModal } from './MosqueSuggestionModal';
import { DonationChannelsCard } from './DonationChannelsCard';
import { SuggestDonationMethodModal } from './SuggestDonationMethodModal';
import { PrayerScheduleAuditModal } from './PrayerScheduleAuditModal';
import { CollectionTagModal } from './CollectionTagModal';
import { RoleClaimModal } from './RoleClaimModal';
import { CommitteeVerificationModal } from './CommitteeVerificationModal';
import { CreateAnnouncementModal } from './CreateAnnouncementModal';
import { CollectionStorage } from '../lib/storage';
import { CollectionService, MosqueCollectionTag } from '../services/collectionService';


interface MosqueDetailSheetProps {
  mosque: Mosque | null;
  visible: boolean;
  isFollowed?: boolean;
  onToggleFollow?: (id: string) => void;
  onClose: () => void;
  onOpenAuthModal?: () => void;
}

export const MosqueDetailSheet: React.FC<MosqueDetailSheetProps> = ({
  mosque,
  visible,
  isFollowed = false,
  onToggleFollow,
  onClose,
  onOpenAuthModal,
}) => {
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [noticeModalVisible, setNoticeModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [suggestFacilitiesModalVisible, setSuggestFacilitiesModalVisible] = useState(false);
  const [tagModalVisible, setTagModalVisible] = useState(false);
  const [roleClaimModalVisible, setRoleClaimModalVisible] = useState(false);
  const [createAnnouncementVisible, setCreateAnnouncementVisible] = useState(false);
  const [suggestDonationModalVisible, setSuggestDonationModalVisible] = useState(false);
  const [auditModalVisible, setAuditModalVisible] = useState(false);
  const [committeeVerificationModalVisible, setCommitteeVerificationModalVisible] = useState(false);
  const [suggestionModalVisible, setSuggestionModalVisible] = useState(false);
  const [publicSuggestions, setPublicSuggestions] = useState<MosqueSuggestionItem[]>([]);
  const [activeTags, setActiveTags] = useState<MosqueCollectionTag[]>([]);
  const [activeSchedule, setActiveSchedule] = useState<PrayerSchedule | null | undefined>(mosque?.prayerSchedule);
  const [activeFacility, setActiveFacility] = useState(mosque?.facility);
  const [copiedShare, setCopiedShare] = useState(false);

  useEffect(() => {
    setActiveSchedule(mosque?.prayerSchedule);
    setActiveFacility(mosque?.facility);
    if (mosque?.id) {
      setActiveTags(CollectionStorage.getMosqueTags(mosque.id));
      ApiClient.fetchPublicMosqueSuggestions(mosque.id, 1, 5)
        .then((res) => {
          if (res?.items) setPublicSuggestions(res.items);
        })
        .catch(() => setPublicSuggestions([]));
    }
  }, [mosque?.id, mosque?.prayerSchedule, mosque?.facility]);

  if (!mosque) return null;

  const schedule = activeSchedule ?? mosque.prayerSchedule;

  const freshness = mosque.freshness || { level: 'FRESH', daysAgo: 0 };
  const freshnessLabel = {
    FRESH: `Verified recently (${freshness.daysAgo}d ago)`,
    STALE: `Updated ${freshness.daysAgo}d ago · May need seasonal check`,
    VERY_STALE: `Updated ${freshness.daysAgo}d ago · Outdated`,
  }[freshness.level || 'FRESH'];

  const prayerRows = [
    { name: 'Fajr', jammat: schedule?.fajrJamaat, start: schedule?.fajrStart },
    { name: 'Zuhr', jammat: schedule?.zuhrJamaat, start: schedule?.zuhrStart },
    { name: 'Asr', jammat: schedule?.asrJamaat, start: schedule?.asrStart },
    { name: 'Maghrib', jammat: schedule?.maghribJamaat, start: schedule?.maghribStart },
    { name: 'Isha', jammat: schedule?.ishaJamaat, start: schedule?.ishaStart },
    { name: "Jumu'ah", jammat: schedule?.jumuahJamaat, start: '12:45' },
  ];

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
                onPress={() => setTagModalVisible(true)}
                style={styles.tagBtn}
                accessibilityRole="button"
                accessibilityLabel="Categorize Mosque"
              >
                {activeTags.length > 0 ? (
                  <Text style={styles.tagBtnText}>
                    {activeTags.map((t) => CollectionService.getTagMeta(t).icon).join('')}
                  </Text>
                ) : (
                  <Feather name="tag" size={13} color="#71717a" />
                )}
              </Pressable>

              <Pressable
                onPress={() => onToggleFollow?.(mosque.id)}
                style={[styles.followBtn, isFollowed && styles.followBtnActive]}
              >
                <Text style={[styles.followBtnText, isFollowed && styles.followBtnTextActive]}>
                  {isFollowed ? 'Following' : '+ Follow'}
                </Text>
              </Pressable>

              <Pressable onPress={onClose} style={styles.closeBtn}>
                <Feather name="x" size={18} color="#71717a" />
              </Pressable>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Freshness banner (ADR-072 web parity) */}
            <View style={styles.freshnessBanner}>
              <View style={styles.freshnessLeft}>
                <Feather name="clock" size={13} color="#059669" />
                <Text style={styles.freshnessText}>{freshnessLabel}</Text>
              </View>
              <Pressable
                onPress={() => setUpdateModalVisible(true)}
                accessibilityRole="button"
                accessibilityLabel="Update prayer times"
              >
                <Text style={styles.freshnessLink}>Update Times</Text>
              </Pressable>
            </View>
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
                  <View style={styles.noticeStripIconBox}>
                    <Feather
                      name={mosque.announcements.some((a) => a.priority === 'URGENT') ? 'alert-triangle' : 'volume-2'}
                      size={15}
                      color={mosque.announcements.some((a) => a.priority === 'URGENT') ? '#dc2626' : '#2563eb'}
                    />
                  </View>
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
                <Feather name="chevron-right" size={16} color="#9ca3af" />
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
                <View style={styles.timetableActions}>
                  <Pressable
                    onPress={() => setAuditModalVisible(true)}
                    style={styles.historyBtn}
                    accessibilityRole="button"
                    accessibilityLabel="View schedule revision history"
                  >
                    <Feather name="clock" size={11} color="#4b5563" style={{ marginRight: 4 }} />
                    <Text style={styles.historyBtnText}>History</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setUpdateModalVisible(true)}
                    style={styles.updateTimesBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Update prayer times"
                  >
                    <Text style={styles.updateTimesBtnText}>+ Update</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.timetableTable}>
                <View style={styles.tableHeaderRow}>
                  <Text style={styles.tableHeaderCol}>Prayer</Text>
                  <Text style={[styles.tableHeaderCol, { textAlign: 'center' }]}>Start Time</Text>
                  <Text style={[styles.tableHeaderCol, { textAlign: 'right' }]}>Jamaat Time</Text>
                </View>
                {prayerRows.map((row) => {
                  const isFriday = row.name === "Jumu'ah";
                  return (
                    <View key={row.name} style={[styles.tableRow, isFriday && styles.tableRowFriday]}>
                      <Text style={[styles.waqtCol, isFriday && styles.waqtColFriday]}>{row.name}</Text>
                      <Text style={styles.startCol}>{formatTo12Hour(row.start, '—')}</Text>
                      <Text style={[styles.timeCol, isFriday && styles.timeColFriday]}>
                        {formatTo12Hour(row.jammat, '—')}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Holy Month of Ramadan Timings */}
              {(schedule?.taraweehJamaat || schedule?.sahriEnd || schedule?.iftarStart) && (
                <View style={styles.ramadanBox}>
                  <View style={styles.ramadanTitleRow}>
                    <Feather name="moon" size={13} color="#059669" style={{ marginRight: 5 }} />
                    <Text style={styles.ramadanTitle}>Holy Month of Ramadan Timings</Text>
                  </View>
                  <View style={styles.ramadanGrid}>
                    <View style={styles.ramadanCell}>
                      <Text style={styles.ramadanLabel}>Sahri End</Text>
                      <Text style={styles.ramadanVal}>{formatTo12Hour(schedule.sahriEnd, '—')}</Text>
                    </View>
                    <View style={styles.ramadanCell}>
                      <Text style={styles.ramadanLabel}>Iftar Start</Text>
                      <Text style={styles.ramadanVal}>{formatTo12Hour(schedule.iftarStart, '—')}</Text>
                    </View>
                    <View style={styles.ramadanCell}>
                      <Text style={styles.ramadanLabel}>Taraweeh</Text>
                      <Text style={[styles.ramadanVal, { color: ferioColors.accent }]}>
                        {formatTo12Hour(schedule.taraweehJamaat, '—')}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Card 2: Verified Donation Channels (ADR-028, ADR-051, ADR-067) */}
            <DonationChannelsCard
              donationMethods={mosque.donationMethods || []}
              onPressSuggest={() => setSuggestDonationModalVisible(true)}
            />

            {/* Card 3: Mosque Leadership & Staff Roster (ADR-009, ADR-047, ADR-064, ADR-069) */}
            <LeadershipRosterCard
              staffMembers={mosque.staffMembers || []}
              onClaimRole={() => setRoleClaimModalVisible(true)}
              onVerifyCommittee={() => setCommitteeVerificationModalVisible(true)}
            />

            {/* Card 4: Facilities Overview (ADR-025, ADR-050) */}
            <FacilitiesCard
              mosque={{
                ...mosque,
                facility: activeFacility ?? mosque.facility,
              }}
              onPressSuggest={() => setSuggestFacilitiesModalVisible(true)}
            />

            {/* Card 5: Community Suggestions & Feedback matching web MosqueDetailModal */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.communityHeaderLeft}>
                  <Feather name="message-square" size={14} color="#2563eb" style={{ marginRight: 6 }} />
                  <Text style={styles.cardTitle}>Community Feedback</Text>
                </View>
                <Pressable
                  onPress={() => setSuggestionModalVisible(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Add community suggestion or complaint"
                >
                  <Text style={styles.suggestionAddLink}>+ Suggest / Complain</Text>
                </Pressable>
              </View>

              {publicSuggestions.length > 0 ? (
                <View style={styles.suggestionList}>
                  {publicSuggestions.slice(0, 3).map((item) => (
                    <View key={item.id} style={styles.suggestionItem}>
                      <View style={styles.suggestionItemHeader}>
                        <View style={styles.suggestionBadgeRow}>
                          <View style={styles.suggestionTypeBadge}>
                            <Text style={styles.suggestionTypeBadgeText}>{item.type}</Text>
                          </View>
                          {item.urgency === 'HIGH' && (
                            <View style={styles.suggestionUrgentBadge}>
                              <Text style={styles.suggestionUrgentBadgeText}>Urgent</Text>
                            </View>
                          )}
                          {item.targetRoles && item.targetRoles.length > 0 && (
                            <Text style={styles.suggestionTargetRoles}>
                              To: {item.targetRoles.join(', ')}
                            </Text>
                          )}
                        </View>
                        <Text
                          style={[
                            styles.suggestionStatus,
                            item.status === 'RESOLVED' && styles.suggestionStatusResolved,
                          ]}
                        >
                          {item.status}
                        </Text>
                      </View>
                      <Text style={styles.suggestionDesc}>{item.description}</Text>
                      {item.resolutionNotes ? (
                        <View style={styles.resolutionBox}>
                          <Text style={styles.resolutionText}>
                            <Text style={styles.resolutionBold}>Committee response: </Text>
                            {item.resolutionNotes}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptySuggestionText}>
                  No public suggestions posted yet. Tap Suggest below to submit feedback for the Imam or Committee.
                </Text>
              )}
            </View>

            {/* Quick Actions 4-Card Toolbar (Directions, Donate, Suggest, Report) */}
            <View style={styles.quickActionsGrid}>
              <Pressable
                onPress={() => {
                  const url = `https://www.google.com/maps/dir/?api=1&destination=${mosque.latitude},${mosque.longitude}`;
                  Linking.openURL(url).catch(() => {});
                }}
                style={styles.quickActionBtn}
                accessibilityRole="button"
                accessibilityLabel="Get directions in Maps"
              >
                <Feather name="navigation" size={16} color="#059669" style={styles.quickActionIconSvg} />
                <Text style={styles.quickActionText}>Directions</Text>
              </Pressable>

              <Pressable
                onPress={() => setSuggestDonationModalVisible(true)}
                style={styles.quickActionBtn}
                accessibilityRole="button"
                accessibilityLabel="Open donation channels"
              >
                <Feather name="credit-card" size={16} color="#059669" style={styles.quickActionIconSvg} />
                <Text style={styles.quickActionText}>Donate</Text>
              </Pressable>

              <Pressable
                onPress={() => setSuggestionModalVisible(true)}
                style={styles.quickActionBtn}
                accessibilityRole="button"
                accessibilityLabel="Suggest or complain"
              >
                <Feather name="edit-3" size={16} color="#2563eb" style={styles.quickActionIconSvg} />
                <Text style={styles.quickActionText}>Suggest</Text>
              </Pressable>

              <Pressable
                onPress={() => setReportModalVisible(true)}
                style={styles.quickActionBtn}
                accessibilityRole="button"
                accessibilityLabel="Report issue"
              >
                <Feather name="flag" size={16} color="#e11d48" style={styles.quickActionIconSvg} />
                <Text style={styles.quickActionText}>Report</Text>
              </Pressable>
            </View>

            {/* Sheet Footer: ID & Share */}
            <View style={styles.footerRow}>
              <Text style={styles.footerId}>ID: {mosque.id.slice(0, 10)}...</Text>
              <Pressable
                onPress={async () => {
                  try {
                    await Clipboard.setStringAsync(
                      `${mosque.name} - BD Masjid\nhttps://bd-masjid.gov.bd/mosque/${mosque.id}`
                    );
                    setCopiedShare(true);
                    setTimeout(() => setCopiedShare(false), 2000);
                  } catch {
                    setCopiedShare(true);
                    setTimeout(() => setCopiedShare(false), 2000);
                  }
                }}
                style={styles.shareBtn}
                accessibilityRole="button"
                accessibilityLabel="Share mosque profile"
              >
                <Feather
                  name={copiedShare ? 'check' : 'share-2'}
                  size={12}
                  color={copiedShare ? '#059669' : ferioColors.primary}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.shareBtnText, copiedShare && styles.shareBtnTextCopied]}>
                  {copiedShare ? 'Copied Link!' : 'Share'}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>

        <TimetableUpdateModal
          visible={updateModalVisible}
          mosqueId={mosque.id}
          mosqueName={mosque.name}
          currentSchedule={schedule}
          onClose={() => setUpdateModalVisible(false)}
          onOpenAuthModal={onOpenAuthModal}
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
          onOpenAuthModal={onOpenAuthModal}
        />

        <SuggestFacilitiesModal
          visible={suggestFacilitiesModalVisible}
          mosqueId={mosque.id}
          mosqueName={mosque.name}
          initialFacilities={activeFacility ?? mosque.facility}
          onClose={() => setSuggestFacilitiesModalVisible(false)}
          onOpenAuthModal={onOpenAuthModal}
          onSuccess={(suggested) => {
            setActiveFacility((prev) => ({
              ...(prev ?? {}),
              ...suggested,
            }));
          }}
        />

        <MosqueSuggestionModal
          visible={suggestionModalVisible}
          mosque={mosque}
          onClose={() => setSuggestionModalVisible(false)}
          onSuccess={() => {
            if (mosque?.id) {
              ApiClient.fetchPublicMosqueSuggestions(mosque.id, 1, 5)
                .then((res) => {
                  if (res?.items) setPublicSuggestions(res.items);
                })
                .catch(() => {});
            }
          }}
        />

        <CollectionTagModal
          visible={tagModalVisible}
          mosqueId={mosque.id}
          mosqueName={mosque.name}
          onClose={() => setTagModalVisible(false)}
          onTagsUpdated={(updated) => setActiveTags(updated)}
        />

        <RoleClaimModal
          visible={roleClaimModalVisible}
          mosqueId={mosque.id}
          mosqueName={mosque.name}
          onClose={() => setRoleClaimModalVisible(false)}
        />

        <CreateAnnouncementModal
          visible={createAnnouncementVisible}
          mosqueId={mosque.id}
          mosqueName={mosque.name}
          onClose={() => setCreateAnnouncementVisible(false)}
        />

        <SuggestDonationMethodModal
          visible={suggestDonationModalVisible}
          mosqueId={mosque.id}
          mosqueName={mosque.name}
          onClose={() => setSuggestDonationModalVisible(false)}
        />

        <PrayerScheduleAuditModal
          visible={auditModalVisible}
          mosqueId={mosque.id}
          mosqueName={mosque.name}
          onClose={() => setAuditModalVisible(false)}
          onReportDiscrepancy={() => setReportModalVisible(true)}
        />

        <CommitteeVerificationModal
          visible={committeeVerificationModalVisible}
          mosqueId={mosque.id}
          mosqueName={mosque.name}
          onClose={() => setCommitteeVerificationModalVisible(false)}
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
  tagBtn: {
    backgroundColor: ferioColors.surface,
    borderColor: ferioColors.border,
    borderWidth: 1,
    borderRadius: ferioRadius.full,
    paddingHorizontal: 8,
    paddingVertical: ferioSpacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagBtnText: {
    fontSize: 14,
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
  timetableActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyBtn: {
    backgroundColor: '#f4f4f5',
    paddingHorizontal: ferioSpacing.sm,
    paddingVertical: 5,
    borderRadius: ferioRadius.full,
    borderWidth: 1,
    borderColor: ferioColors.border,
  },
  historyBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: ferioColors.muted,
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
  tableHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fafafa',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: ferioColors.border,
  },
  tableHeaderCol: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: ferioColors.muted,
  },
  tableRowFriday: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    borderRadius: ferioRadius.sm,
  },
  waqtColFriday: {
    color: ferioColors.accent,
    fontWeight: '700',
  },
  startCol: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: ferioColors.muted,
    fontVariant: ['tabular-nums'],
  },
  timeColFriday: {
    color: ferioColors.accent,
  },
  ramadanBox: {
    marginTop: ferioSpacing.sm,
    padding: ferioSpacing.sm + 2,
    borderRadius: ferioRadius.md,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  ramadanTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065f46',
    marginBottom: 6,
  },
  ramadanGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  ramadanCell: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 6,
    borderRadius: ferioRadius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  ramadanLabel: {
    fontSize: 9,
    color: ferioColors.muted,
    marginBottom: 2,
  },
  ramadanVal: {
    fontSize: 12,
    fontWeight: '700',
    color: ferioColors.primary,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: ferioSpacing.xs,
  },
  quickActionBtn: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: ferioColors.border,
    borderRadius: ferioRadius.lg,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  freshnessBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#f4f4f5',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    marginBottom: 4,
  },
  freshnessLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  freshnessText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#3f3f46',
  },
  freshnessLink: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
    textDecorationLine: 'underline',
  },
  communityHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionAddLink: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563eb',
  },
  suggestionList: {
    gap: 8,
    marginTop: 6,
  },
  suggestionItem: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e8e8ea',
    borderRadius: 12,
    padding: 10,
    gap: 4,
  },
  suggestionItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  suggestionBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  suggestionTypeBadge: {
    backgroundColor: '#f4f4f5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  suggestionTypeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#111114',
  },
  suggestionUrgentBadge: {
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  suggestionUrgentBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#e11d48',
  },
  suggestionTargetRoles: {
    fontSize: 9,
    color: '#6e6e73',
  },
  suggestionStatus: {
    fontSize: 9,
    fontWeight: '600',
    color: '#6e6e73',
  },
  suggestionStatusResolved: {
    color: '#059669',
  },
  suggestionDesc: {
    fontSize: 11,
    color: '#111114',
    lineHeight: 15,
  },
  resolutionBox: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#d1fae5',
    borderRadius: 8,
    padding: 6,
    marginTop: 4,
  },
  resolutionText: {
    fontSize: 10,
    color: '#065f46',
  },
  resolutionBold: {
    fontWeight: '700',
  },
  emptySuggestionText: {
    fontSize: 11,
    color: '#6e6e73',
    lineHeight: 15,
  },
  quickActionIconSvg: {
    marginBottom: 4,
  },
  quickActionText: {
    fontSize: 10,
    fontWeight: '600',
    color: ferioColors.primary,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: ferioSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: ferioColors.border,
    marginTop: ferioSpacing.xs,
    marginBottom: ferioSpacing.lg,
  },
  footerId: {
    fontSize: 11,
    color: ferioColors.muted,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  shareBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: ferioColors.primary,
  },
  shareBtnTextCopied: {
    color: '#059669',
  },
  noticeStripIconBox: {
    marginRight: ferioSpacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ramadanTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
});
