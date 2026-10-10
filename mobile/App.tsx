import React, { useState, useMemo, useEffect } from 'react';
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
import { RamadanFastingModal } from './src/components/RamadanFastingModal';
import { OfflineMapRegionsModal } from './src/components/OfflineMapRegionsModal';
import { ferioColors, ferioRadius, ferioSpacing } from './src/theme/tokens';

const AMENITY_TAGS = ['All', 'Women Space', 'Air Conditioned', 'Parking', 'Following'];

export default function App() {
  const [mosquesList, setMosquesList] = useState<Mosque[]>(BANGLADESH_MOSQUES_FIXTURES);
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
  const [isRamadanOpen, setIsRamadanOpen] = useState(false);
  const [isOfflineRegionsOpen, setIsOfflineRegionsOpen] = useState(false);
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

  const handleRetrySync = async () => {
    setIsRetrying(true);
    try {
      await ApiClient.getNearbyMosques(23.8103, 90.4125);
      await OfflineOutboxService.drainOutbox();
    } finally {
      setIsRetrying(false);
    }
  };

  const toggleFollow = (id: string) => {
    setFollowedIds((prev) => {
      const updated = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      PreferencesStorage.setFollowedMosqueIds(updated);
      ApiClient.toggleFollowMosque(id).catch(() => {});
      return updated;
    });
    setCollectionsVersion((v) => v + 1);
  };

  const filteredMosques = useMemo(() => {
    return mosquesList.filter((mosque) => {
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
  }, [mosquesList, searchQuery, selectedTag, followedIds, activeCollectionTag, collectionsVersion]);

  const collectionCounts = useMemo(() => {
    const all = CollectionStorage.getCollections();
    return {
      ALL: mosquesList.length,
      HOME: Object.keys(all).filter((id) => all[id]?.includes('HOME')).length,
      WORK: Object.keys(all).filter((id) => all[id]?.includes('WORK')).length,
      JUMUAH: Object.keys(all).filter((id) => all[id]?.includes('JUMUAH')).length,
      FAVORITE: Object.keys(all).filter((id) => all[id]?.includes('FAVORITE')).length,
    };
  }, [mosquesList, collectionsVersion]);

  const topFollowedMosque = useMemo(() => {
    return mosquesList.find((m) => followedIds.includes(m.id)) ?? mosquesList[0];
  }, [mosquesList, followedIds]);

  useEffect(() => {
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

          {/* Ramadan Fasting Hub Pill (ADR-061) */}
          <Pressable
            onPress={() => setIsRamadanOpen(true)}
            style={({ pressed }) => [styles.ramadanToggleBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Open Ramadan Fasting & Iftar Hub"
          >
            <Text style={styles.ramadanToggleText}>🌙 {lang === 'bn' ? 'রোজা' : 'Fasting'}</Text>
          </Pressable>

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
            return (
              <Pressable
                key={tag}
                onPress={() => setSelectedTag(tag)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{tag}</Text>
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
          data={filteredMosques}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <>
              <PrayerCountdownBanner
                schedule={topFollowedMosque.prayerSchedule}
                autoSilentSettings={autoSilentSettings}
                onPressAutoSilentSettings={() => setIsModalOpen(true)}
              />
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
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No mosques match your criteria</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search query or filter tags.</Text>
            </View>
          }
        />
      ) : (
        <MosqueMapView
          mosques={filteredMosques}
          followedIds={followedIds}
          selectedMosqueId={selectedMosque?.id}
          onSelectMosque={(m) => setSelectedMosque(m)}
          onPinDropped={(coords) => setAddMosqueCoords(coords)}
          onLocateMe={() => {
            setSelectedTag('All');
            setSearchQuery('');
          }}
          onOpenOfflineRegions={() => setIsOfflineRegionsOpen(true)}
        />
      )}

      {/* Floating Centered Viewport Toggle Pill */}
      <ViewTogglePill
        mode={viewportMode}
        count={filteredMosques.length}
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
          existingMosques={mosquesList}
          onClose={() => setAddMosqueCoords(null)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onMosqueCreated={(newMosque) => {
            setMosquesList((prev) => [newMosque, ...prev]);
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
          const found = mosquesList.find((m) => m.id === mosqueId);
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

      {/* Ramadan & Fasting Hub Modal (ADR-061) */}
      <RamadanFastingModal
        visible={isRamadanOpen}
        onClose={() => setIsRamadanOpen(false)}
        isBangla={lang === 'bn'}
      />

      {/* Offline Map Regions Manager Modal (ADR-062) */}
      <OfflineMapRegionsModal
        visible={isOfflineRegionsOpen}
        onClose={() => setIsOfflineRegionsOpen(false)}
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
  },
  pressed: {
    opacity: 0.8,
  },
});
