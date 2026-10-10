import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Mosque, PrayerAutoSilentSettings } from './src/types/mosque';
import { BANGLADESH_MOSQUES_FIXTURES } from './src/data/mosqueFixtures';
import { PrayerCountdownBanner } from './src/components/PrayerCountdownBanner';
import { MosqueCard } from './src/components/MosqueCard';
import { ViewTogglePill, ViewportMode } from './src/components/ViewTogglePill';
import { AutoSilentModal } from './src/components/AutoSilentModal';
import { MosqueDetailSheet } from './src/components/MosqueDetailSheet';
import { MosqueMapView } from './src/components/MosqueMapView';
import { OfflineBanner } from './src/components/OfflineBanner';
import { AddMosqueSheet } from './src/components/AddMosqueSheet';
import { QiblaCompassModal } from './src/components/QiblaCompassModal';
import { DailyHadithCard } from './src/components/DailyHadithCard';
import { CollectionFilterBar, CollectionFilterSelection } from './src/components/CollectionFilterBar';
import { NotificationInboxModal } from './src/components/NotificationInboxModal';
import { AuthSessionModal } from './src/components/AuthSessionModal';
import { OemBatteryWizardModal } from './src/components/OemBatteryWizardModal';
import { PreferencesStorage, CollectionStorage } from './src/lib/storage';
import { ApiClient } from './src/lib/apiClient';
import { AutoSilentService } from './src/services/autoSilentService';
import { PrayerNotificationService } from './src/services/prayerNotificationService';
import { TelemetryService } from './src/services/telemetryService';
import { LocalizationService, Language } from './src/services/localizationService';
import { NotificationInboxService } from './src/services/notificationInboxService';
import { AuthService } from './src/services/authService';
import { OemBatteryService } from './src/services/oemBatteryService';
import { PushDeviceService } from './src/services/pushDeviceService';
import { UserProfile } from './src/types/auth';
import { OutboxSyncBadge } from './src/components/OutboxSyncBadge';
import { OfflineOutboxService } from './src/services/offlineOutboxService';
import { ModeratorReviewModal } from './src/components/ModeratorReviewModal';
import { ModeratorService } from './src/services/moderatorService';
import { DiagnosticsTelemetryModal } from './src/components/DiagnosticsTelemetryModal';
import { LocationRadarService } from './src/services/locationRadarService';
import { AnnouncementsFeedModal } from './src/components/AnnouncementsFeedModal';
import { CreateAnnouncementModal } from './src/components/CreateAnnouncementModal';
import { MyAttendedMosquesModal } from './src/components/MyAttendedMosquesModal';
import { ferioColors, ferioRadius, ferioSpacing } from './src/theme/tokens';

const AMENITY_TAGS = ['All', '📍 Nearest', '🕌 My Mosques', '📢 Notices', 'Women Space', 'Air Conditioned', 'Parking', 'Following'];

export default function App() {
  const [followedMosques, setFollowedMosques] = useState<Mosque[]>([]);
  const [isFollowedLoading, setIsFollowedLoading] = useState(true);
  const [discoveredMosques, setDiscoveredMosques] = useState<Mosque[]>([]);
  const [isSearchingLoading, setIsSearchingLoading] = useState(false);
  const [addMosqueCoords, setAddMosqueCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const [viewportMode, setViewportMode] = useState<ViewportMode>('list');
  const [followedIds, setFollowedIds] = useState<string[]>(() =>
    PreferencesStorage.getFollowedMosqueIds()
  );
  const [selectedMosque, setSelectedMosque] = useState<Mosque | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQiblaOpen, setIsQiblaOpen] = useState(false);
  const [isNotificationInboxOpen, setIsNotificationInboxOpen] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState<number>(() =>
    NotificationInboxService.getUnreadCountSync()
  );
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOemWizardOpen, setIsOemWizardOpen] = useState(false);
  const [isModModalOpen, setIsModModalOpen] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [isAnnouncementsModalOpen, setIsAnnouncementsModalOpen] = useState(false);
  const [isCreateAnnouncementOpen, setIsCreateAnnouncementOpen] = useState(false);
  const [isMyAttendedOpen, setIsMyAttendedOpen] = useState(false);
  const [pendingModCount, setPendingModCount] = useState<number>(() =>
    ModeratorService.getPendingCountSync()
  );
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() =>
    AuthService.getUserSync()
  );
  const [lang, setLang] = useState<Language>(() => LocalizationService.getLanguage());
  const [activeCollectionTag, setActiveCollectionTag] = useState<CollectionFilterSelection>('ALL');
  const [collectionsVersion, setCollectionsVersion] = useState(0);

  const [autoSilentSettings, setAutoSilentSettings] = useState<PrayerAutoSilentSettings>(() => {
    const saved = PreferencesStorage.getAutoSilentSettings();
    return (
      saved ?? {
        isEnabled: true,
        durationMinutes: 10,
        leadOffsetMinutes: 0,
        enabledPrayers: {
          fajr: true,
          zuhr: true,
          asr: true,
          maghrib: true,
          isha: true,
          jumuah: true,
        },
        hasDndPermission: true,
        activeSilenceExpiry: null,
      }
    );
  });

  const [isOffline, setIsOffline] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const unsubscribe = ApiClient.onOfflineStatusChange((status) => {
      setIsOffline(status);
    });
    return unsubscribe;
  }, []);

  const loadFollowedMosques = useCallback(async () => {
    setIsFollowedLoading(true);
    try {
      const list = await ApiClient.getFollowedMosques();
      setFollowedMosques(list);
      const ids = list.map((m) => m.id);
      setFollowedIds(ids);
      PreferencesStorage.setFollowedMosqueIds(ids);
    } catch {
      const localIds = PreferencesStorage.getFollowedMosqueIds();
      const localList = BANGLADESH_MOSQUES_FIXTURES.filter((m) => localIds.includes(m.id));
      setFollowedMosques(localList);
      setFollowedIds(localIds);
    } finally {
      setIsFollowedLoading(false);
    }
  }, []);

  const findMosqueById = useCallback(
    (id: string): Mosque | undefined => {
      return (
        followedMosques.find((m) => m.id === id) ||
        discoveredMosques.find((m) => m.id === id) ||
        BANGLADESH_MOSQUES_FIXTURES.find((m) => m.id === id)
      );
    },
    [followedMosques, discoveredMosques]
  );

  const handleRetrySync = async () => {
    setIsRetrying(true);
    try {
      await loadFollowedMosques();
      await OfflineOutboxService.drainOutbox();
    } finally {
      setIsRetrying(false);
    }
  };

  const toggleFollow = (id: string) => {
    const isCurrentlyFollowed = followedIds.includes(id);
    const nextIds = isCurrentlyFollowed
      ? followedIds.filter((item) => item !== id)
      : [...followedIds, id];
    setFollowedIds(nextIds);
    PreferencesStorage.setFollowedMosqueIds(nextIds);

    if (isCurrentlyFollowed) {
      setFollowedMosques((prev) => prev.filter((m) => m.id !== id));
    } else {
      const target = findMosqueById(id);
      if (target) {
        setFollowedMosques((prev) => (prev.some((m) => m.id === id) ? prev : [target, ...prev]));
      } else {
        ApiClient.getMosqueById(id).then((m) => {
          if (m) setFollowedMosques((prev) => (prev.some((p) => p.id === m.id) ? prev : [m, ...prev]));
        });
      }
    }

    ApiClient.toggleFollowMosque(id).catch(() => {});
    setCollectionsVersion((v) => v + 1);
  };

  const isSearchingOrFiltering = Boolean(
    searchQuery.trim() !== '' ||
    selectedTag !== 'All' ||
    activeCollectionTag !== 'ALL'
  );

  useEffect(() => {
    if (!isSearchingOrFiltering) return;
    const timer = setTimeout(async () => {
      setIsSearchingLoading(true);
      try {
        let results: Mosque[];
        if (searchQuery.trim()) {
          results = await ApiClient.searchMosques(searchQuery.trim());
        } else if (selectedTag === '📍 Nearest') {
          results = await ApiClient.getNearbyMosques(23.8103, 90.4125);
        } else {
          results = await ApiClient.searchMosques();
        }
        setDiscoveredMosques(results);
      } catch {
        setDiscoveredMosques(BANGLADESH_MOSQUES_FIXTURES);
      } finally {
        setIsSearchingLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedTag, activeCollectionTag, isSearchingOrFiltering]);

  const displayedMosques = useMemo(() => {
    if (!isSearchingOrFiltering) {
      return followedMosques;
    }

    const sourceList = discoveredMosques.length > 0 ? discoveredMosques : BANGLADESH_MOSQUES_FIXTURES;
    const list = sourceList.filter((mosque) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        mosque.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (mosque.city && mosque.city.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (activeCollectionTag !== 'ALL') {
        const tags = CollectionStorage.getMosqueTags(mosque.id);
        if (!tags.includes(activeCollectionTag)) return false;
      }

      if (selectedTag === 'Following') return followedIds.includes(mosque.id);
      if (selectedTag === 'Women Space') return !!mosque.hasSeparateWomenSpace;
      if (selectedTag === 'Air Conditioned') return !!mosque.hasAirConditioning;
      if (selectedTag === 'Parking') return !!mosque.hasParking;

      return true;
    });

    if (selectedTag === '📍 Nearest') {
      return LocationRadarService.sortMosquesByProximity(list);
    }
    return list;
  }, [isSearchingOrFiltering, followedMosques, discoveredMosques, searchQuery, selectedTag, activeCollectionTag, followedIds, collectionsVersion]);

  const mapMosques = useMemo(() => {
    const mosqueMap = new Map<string, Mosque>();
    displayedMosques.forEach((m) => mosqueMap.set(m.id, m));
    followedMosques.forEach((m) => mosqueMap.set(m.id, m));
    return Array.from(mosqueMap.values());
  }, [displayedMosques, followedMosques]);

  const collectionCounts = useMemo(() => {
    const all = CollectionStorage.getCollections();
    const sourceList = isSearchingOrFiltering ? displayedMosques : followedMosques;
    return {
      ALL: sourceList.length,
      HOME: Object.keys(all).filter((id) => all[id]?.includes('HOME')).length,
      WORK: Object.keys(all).filter((id) => all[id]?.includes('WORK')).length,
      JUMUAH: Object.keys(all).filter((id) => all[id]?.includes('JUMUAH')).length,
      FAVORITE: Object.keys(all).filter((id) => all[id]?.includes('FAVORITE')).length,
    };
  }, [isSearchingOrFiltering, displayedMosques, followedMosques, collectionsVersion]);

  const topFollowedMosque = useMemo(() => {
    return followedMosques[0] ?? null;
  }, [followedMosques]);

  useEffect(() => {
    loadFollowedMosques();
    TelemetryService.initTelemetry();
    TelemetryService.addBreadcrumb('lifecycle', 'BD Masjid application initialized');

    AutoSilentService.checkDndPermission().then((granted) => {
      setAutoSilentSettings((prev) => ({ ...prev, hasDndPermission: granted }));
    });

    const unsubNotif = NotificationInboxService.subscribeUnreadCount((count) => {
      setUnreadNotificationCount(count);
    });
    NotificationInboxService.syncUnreadCount();

    const unsubAuth = AuthService.subscribeAuth((session) => {
      setCurrentUser(session.user);
    });
    AuthService.hydrateSession();

    PushDeviceService.syncDeviceRegistration();
    OfflineOutboxService.drainOutbox();

    const unsubMod = ModeratorService.subscribe((count) => {
      setPendingModCount(count);
    });
    ModeratorService.loadModerationQueue();

    return () => {
      unsubNotif();
      unsubAuth();
      unsubMod();
    };
  }, []);

  useEffect(() => {
    if (topFollowedMosque?.prayerSchedule && autoSilentSettings.isEnabled) {
      AutoSilentService.syncDailyPrayerAlarms(
        topFollowedMosque.prayerSchedule,
        autoSilentSettings
      );
      PrayerNotificationService.schedulePreJamaatAlarms(
        topFollowedMosque,
        10
      );
    }
  }, [topFollowedMosque, autoSilentSettings]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Top Navbar */}
      <View style={styles.topNavbar}>
        <Pressable
          onLongPress={() => setIsDiagnosticsOpen(true)}
          delayLongPress={700}
          accessibilityLabel="BD Masjid Brand Title (Long press for diagnostics)"
        >
          <Text style={styles.brandTitle}>{LocalizationService.t('brandTitle')}</Text>
          <Text style={styles.brandSubtitle}>{LocalizationService.t('brandSubtitle')}</Text>
        </Pressable>

        <View style={styles.topNavbarActions}>
          {/* 1-Tap Language Toggle Pill (ADR-048) */}
          <Pressable
            onPress={() => {
              const next = LocalizationService.toggleLanguage();
              setLang(next);
            }}
            style={({ pressed }) => [styles.langToggleBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Toggle Language between Bangla and English"
          >
            <Text style={styles.langToggleText}>
              {lang === 'bn' ? 'বাং' : 'EN'}
            </Text>
          </Pressable>

          {/* Community Notice Board & Announcements Hub (ADR-044, ADR-065) */}
          <Pressable
            onPress={() => setIsAnnouncementsModalOpen(true)}
            style={({ pressed }) => [styles.announcementsToggleBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Open Notice Board & Bulletins"
          >
            <Text style={styles.announcementsToggleText}>📢 {lang === 'bn' ? 'বিজ্ঞপ্তি' : 'Notices'}</Text>
          </Pressable>

          {/* In-App Notification Bell Pill (ADR-053) */}
          <Pressable
            onPress={() => setIsNotificationInboxOpen(true)}
            style={({ pressed }) => [styles.bellToggleBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Open Notification Inbox"
          >
            <Text style={styles.bellIcon}>🔔</Text>
            {unreadNotificationCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>
                  {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                </Text>
              </View>
            )}
          </Pressable>

          {/* User Profile / Contributor Pill (ADR-054) */}
          <Pressable
            onPress={() => setIsAuthModalOpen(true)}
            style={({ pressed }) => [styles.profileToggleBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Open User Account & Profile"
          >
            <Text style={styles.profileIcon}>👤</Text>
            <Text style={styles.profileToggleText} numberOfLines={1}>
              {currentUser
                ? currentUser.name.split(' ')[0]
                : lang === 'bn' ? 'লগইন' : 'Sign In'}
            </Text>
            {currentUser && <View style={styles.profileVerifiedDot} />}
          </Pressable>

          {/* Moderator Console Pill (ADR-058) */}
          {(currentUser?.role === 'MODERATOR' || currentUser?.role === 'ADMIN' || ModeratorService.isModeratorSync()) && (
            <Pressable
              onPress={() => setIsModModalOpen(true)}
              style={({ pressed }) => [styles.modToggleBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Open Moderator Console"
            >
              <Text style={styles.modToggleText}>🛡️ Mod</Text>
              {pendingModCount > 0 && (
                <View style={styles.modBadge}>
                  <Text style={styles.modBadgeText}>{pendingModCount}</Text>
                </View>
              )}
            </Pressable>
          )}

          <Pressable
            onPress={() => setIsQiblaOpen(true)}
            style={({ pressed }) => [styles.qiblaToggleBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Open Qibla Compass"
          >
            <Text style={styles.qiblaToggleText}>{LocalizationService.t('qiblaCompass')}</Text>
          </Pressable>

          <Pressable
            onPress={() => setIsModalOpen(true)}
            style={({ pressed }) => [styles.silentToggleBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Auto-Silent Settings"
          >
            <Text style={styles.silentToggleText}>
              {autoSilentSettings.isEnabled
                ? LocalizationService.t('autoSilentOn')
                : LocalizationService.t('autoSilentOff')}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={LocalizationService.t('searchPlaceholder')}
          placeholderTextColor={ferioColors.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Routine Collection Filter Pills (ADR-052) */}
      <CollectionFilterBar
        activeTag={activeCollectionTag}
        tagCounts={collectionCounts}
        language={lang}
        onSelectTag={setActiveCollectionTag}
      />

      {/* Amenity Filter Chips */}
      <View style={styles.filterChipContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipRow}
        >
          {AMENITY_TAGS.map((tag) => {
            const active = selectedTag === tag;
            const isNoticesTag = tag === '📢 Notices';
            const isMyMosquesTag = tag === '🕌 My Mosques';
            const displayLabel =
              tag === '📍 Nearest' && lang === 'bn'
                ? '📍 নিকটবর্তী'
                : tag === '📢 Notices' && lang === 'bn'
                ? '📢 বিজ্ঞপ্তি'
                : tag === '🕌 My Mosques' && lang === 'bn'
                ? '🕌 আমার মসজিদ'
                : tag;
            return (
              <Pressable
                key={tag}
                onPress={() => {
                  if (isNoticesTag) {
                    setIsAnnouncementsModalOpen(true);
                  } else if (isMyMosquesTag) {
                    setIsMyAttendedOpen(true);
                  } else {
                    setSelectedTag(tag);
                  }
                }}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{displayLabel}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Offline Status Warning Banner (ADR-038) */}
      <OfflineBanner
        visible={isOffline}
        onRetry={handleRetrySync}
        isRetrying={isRetrying}
      />

      {/* Offline Outbox Mutation Sync Badge (ADR-057) */}
      <OutboxSyncBadge />

      {/* Viewport: List or Map */}
      {viewportMode === 'list' ? (
        <FlatList
          data={displayedMosques}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <>
              {topFollowedMosque ? (
                <PrayerCountdownBanner
                  schedule={topFollowedMosque.prayerSchedule}
                  autoSilentSettings={autoSilentSettings}
                  onPressAutoSilentSettings={() => setIsModalOpen(true)}
                />
              ) : null}
              <DailyHadithCard language={lang} />
            </>
          }
          renderItem={({ item }) => (
            <MosqueCard
              mosque={item}
              isFollowed={followedIds.includes(item.id)}
              onToggleFollow={toggleFollow}
              onPress={(m) => setSelectedMosque(m)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            (isSearchingOrFiltering ? isSearchingLoading : isFollowedLoading) ? (
              <View style={styles.emptyContainer}>
                <ActivityIndicator size="small" color={ferioColors.primary} />
                <Text style={styles.emptySubtitle}>
                  {!isSearchingOrFiltering
                    ? (lang === 'bn' ? 'অনুসৃত মসজিদ লোড হচ্ছে...' : 'Loading followed mosques...')
                    : (lang === 'bn' ? 'মসজিদ খোঁজা হচ্ছে...' : 'Searching mosques...')}
                </Text>
              </View>
            ) : !isSearchingOrFiltering ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Text style={styles.emptyIcon}>🕌</Text>
                </View>
                <Text style={styles.emptyTitle}>
                  {lang === 'bn' ? 'কোনো অনুসৃত মসজিদ নেই' : 'No followed mosques yet'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {lang === 'bn'
                    ? 'আপনার এলাকার মসজিদ খুঁজে পেতে বা ফিল্টার করে মসজিদ ফলো করুন।'
                    : 'Search above for your neighborhood mosque or explore nearby mosques to follow their daily prayer schedule.'}
                </Text>
                <Pressable
                  onPress={() => setSelectedTag('📍 Nearest')}
                  style={({ pressed }) => [styles.emptyActionBtn, pressed && styles.pressed]}
                  accessibilityRole="button"
                >
                  <Text style={styles.emptyActionBtnText}>
                    {lang === 'bn' ? '📍 নিকটস্থ মসজিদ খুঁজুন' : '📍 Explore Nearest Mosques'}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>
                  {lang === 'bn' ? 'কোনো মসজিদ পাওয়া যায়নি' : 'No mosques match your criteria'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {lang === 'bn' ? 'অনুসন্ধান বা ফিল্টার পরিবর্তন করুন।' : 'Try adjusting your search query or filter tags.'}
                </Text>
              </View>
            )
          }
        />
      ) : (
        <MosqueMapView
          mosques={mapMosques}
          followedIds={followedIds}
          selectedMosqueId={selectedMosque?.id}
          onSelectMosque={(m) => setSelectedMosque(m)}
          onPinDropped={(coords) => setAddMosqueCoords(coords)}
          onLocateMe={() => {
            setSelectedTag('All');
            setSearchQuery('');
          }}
        />
      )}

      {/* Floating Centered Viewport Toggle Pill */}
      <ViewTogglePill
        mode={viewportMode}
        count={displayedMosques.length}
        onToggle={setViewportMode}
      />

      {/* Auto-Silent DND Configuration Modal */}
      <AutoSilentModal
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        settings={autoSilentSettings}
        onRequestDndPermission={() => AutoSilentService.requestDndPermission()}
        onUpdateSettings={(updated) =>
          setAutoSilentSettings((prev) => {
            const next = { ...prev, ...updated };
            PreferencesStorage.setAutoSilentSettings(next);
            return next;
          })
        }
      />

      {/* Mosque Detail Gesture Sheet */}
      <MosqueDetailSheet
        mosque={selectedMosque}
        visible={!!selectedMosque}
        isFollowed={selectedMosque ? followedIds.includes(selectedMosque.id) : false}
        onToggleFollow={toggleFollow}
        onClose={() => setSelectedMosque(null)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Contributor Add Mosque Sheet */}
      {addMosqueCoords && (
        <AddMosqueSheet
          visible={!!addMosqueCoords}
          initialCoords={addMosqueCoords}
          existingMosques={discoveredMosques.length > 0 ? discoveredMosques : BANGLADESH_MOSQUES_FIXTURES}
          onClose={() => setAddMosqueCoords(null)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onMosqueCreated={(newMosque) => {
            setDiscoveredMosques((prev) => [newMosque, ...prev]);
            setSelectedMosque(newMosque);
          }}
        />
      )}

      {/* Qibla Direction Compass Modal */}
      <QiblaCompassModal
        visible={isQiblaOpen}
        onClose={() => setIsQiblaOpen(false)}
      />

      {/* In-App Notification Inbox Sheet (ADR-053) */}
      <NotificationInboxModal
        visible={isNotificationInboxOpen}
        onClose={() => setIsNotificationInboxOpen(false)}
        onSelectMosque={(mosqueId) => {
          const found = findMosqueById(mosqueId);
          if (found) setSelectedMosque(found);
        }}
        isBangla={lang === 'bn'}
      />

      {/* User Auth & Contributor Session Modal (ADR-054) */}
      <AuthSessionModal
        visible={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        isBangla={lang === 'bn'}
      />

      {/* OEM Battery Killer Mitigation Wizard Modal (ADR-037 & Screen 15) */}
      <OemBatteryWizardModal
        visible={isOemWizardOpen}
        onClose={() => setIsOemWizardOpen(false)}
      />

      {/* Community Moderator & Scout Review Modal (ADR-058) */}
      <ModeratorReviewModal
        visible={isModModalOpen}
        onClose={() => setIsModModalOpen(false)}
      />

      {/* Low-End Hardware Diagnostics & Field Ops Telemetry Modal (ADR-059) */}
      <DiagnosticsTelemetryModal
        visible={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
      />

      {/* Community Notice Board & Announcements Hub (ADR-065) */}
      <AnnouncementsFeedModal
        visible={isAnnouncementsModalOpen}
        onClose={() => setIsAnnouncementsModalOpen(false)}
        onSelectMosque={(id) => {
          const found = findMosqueById(id);
          if (found) setSelectedMosque(found);
        }}
        onOpenCreate={() => {
          setIsAnnouncementsModalOpen(false);
          setIsCreateAnnouncementOpen(true);
        }}
      />

      <CreateAnnouncementModal
        visible={isCreateAnnouncementOpen}
        mosqueId={topFollowedMosque?.id || BANGLADESH_MOSQUES_FIXTURES[0].id}
        mosqueName={topFollowedMosque?.name || BANGLADESH_MOSQUES_FIXTURES[0].name}
        onClose={() => setIsCreateAnnouncementOpen(false)}
      />

      {/* Musalli Regular Congregation & Attended Mosques Hub (ADR-066) */}
      <MyAttendedMosquesModal
        visible={isMyAttendedOpen}
        onClose={() => setIsMyAttendedOpen(false)}
        onSelectMosque={(id) => {
          const found = findMosqueById(id);
          if (found) setSelectedMosque(found);
        }}
        isBangla={lang === 'bn'}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ferioColors.canvas,
  },
  topNavbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ferioSpacing.lg,
    paddingTop: ferioSpacing.md,
    paddingBottom: ferioSpacing.sm,
    backgroundColor: ferioColors.canvas,
    borderBottomWidth: 1,
    borderBottomColor: ferioColors.border,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ferioColors.primary,
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: ferioColors.muted,
  },
  topNavbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ferioSpacing.xs,
  },
  langToggleBtn: {
    paddingHorizontal: ferioSpacing.sm + 2,
    paddingVertical: ferioSpacing.xs,
    borderRadius: ferioRadius.full,
    backgroundColor: ferioColors.canvas,
    borderWidth: 1,
    borderColor: ferioColors.border,
  },
  langToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: ferioColors.primary,
  },
  announcementsToggleBtn: {
    paddingHorizontal: ferioSpacing.sm + 2,
    paddingVertical: ferioSpacing.xs,
    borderRadius: ferioRadius.full,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  announcementsToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },
  bellToggleBtn: {
    position: 'relative',
    paddingHorizontal: ferioSpacing.sm + 2,
    paddingVertical: ferioSpacing.xs,
    borderRadius: ferioRadius.full,
    backgroundColor: ferioColors.canvas,
    borderWidth: 1,
    borderColor: ferioColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellIcon: {
    fontSize: 12,
  },
  bellBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: ferioColors.accent,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  bellBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: ferioColors.primaryForeground,
  },
  profileToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: ferioSpacing.sm + 2,
    paddingVertical: ferioSpacing.xs,
    borderRadius: ferioRadius.full,
    backgroundColor: ferioColors.surface,
    borderWidth: 1,
    borderColor: ferioColors.border,
  },
  profileIcon: {
    fontSize: 11,
  },
  profileToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: ferioColors.primary,
    maxWidth: 70,
  },
  profileVerifiedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ferioColors.accent,
  },
  modToggleBtn: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: ferioSpacing.sm + 2,
    paddingVertical: ferioSpacing.xs,
    borderRadius: ferioRadius.full,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  modToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  modBadge: {
    backgroundColor: '#059669',
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  modBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#ffffff',
  },
  qiblaToggleBtn: {
    paddingHorizontal: ferioSpacing.md,
    paddingVertical: ferioSpacing.xs,
    borderRadius: ferioRadius.full,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  qiblaToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  ramadanToggleBtn: {
    paddingHorizontal: ferioSpacing.sm + 2,
    paddingVertical: ferioSpacing.xs,
    borderRadius: ferioRadius.full,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  ramadanToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#d97706',
  },
  silentToggleBtn: {
    paddingHorizontal: ferioSpacing.md,
    paddingVertical: ferioSpacing.xs,
    borderRadius: ferioRadius.full,
    backgroundColor: ferioColors.surface,
    borderWidth: 1,
    borderColor: ferioColors.border,
  },
  silentToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: ferioColors.primary,
  },
  searchContainer: {
    paddingHorizontal: ferioSpacing.lg,
    paddingTop: ferioSpacing.sm,
  },
  searchInput: {
    height: 42,
    backgroundColor: ferioColors.surface,
    borderRadius: ferioRadius.full,
    paddingHorizontal: ferioSpacing.lg,
    fontSize: 13,
    color: ferioColors.primary,
    borderWidth: 1,
    borderColor: ferioColors.border,
  },
  filterChipContainer: {
    paddingVertical: ferioSpacing.xs,
  },
  filterChipRow: {
    paddingHorizontal: ferioSpacing.lg,
    paddingVertical: ferioSpacing.xs,
    gap: ferioSpacing.sm,
  },
  chip: {
    paddingHorizontal: ferioSpacing.md,
    paddingVertical: ferioSpacing.xs,
    borderRadius: ferioRadius.full,
    backgroundColor: ferioColors.surface,
    borderWidth: 1,
    borderColor: ferioColors.border,
  },
  chipActive: {
    backgroundColor: ferioColors.primary,
    borderColor: ferioColors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    color: ferioColors.muted,
  },
  chipTextActive: {
    color: ferioColors.primaryForeground,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 80, // Space for floating toggle pill
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    margin: ferioSpacing.lg,
    borderRadius: ferioRadius.xl,
    borderWidth: 1,
    borderColor: ferioColors.border,
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ferioColors.primary,
  },
  mapSubtitle: {
    fontSize: 12,
    color: ferioColors.muted,
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: ferioSpacing.xxxl,
    paddingHorizontal: ferioSpacing.lg,
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: ferioRadius.full,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ferioSpacing.sm,
  },
  emptyIcon: {
    fontSize: 22,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: ferioColors.primary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: ferioColors.muted,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  emptyActionBtn: {
    marginTop: ferioSpacing.md,
    backgroundColor: ferioColors.primary,
    paddingHorizontal: ferioSpacing.lg,
    paddingVertical: ferioSpacing.sm,
    borderRadius: ferioRadius.full,
  },
  emptyActionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: ferioColors.primaryForeground,
  },
  pressed: {
    opacity: 0.8,
  },
});
