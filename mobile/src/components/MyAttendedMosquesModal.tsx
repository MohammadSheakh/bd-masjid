import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { AttendedMosqueItem, AttendanceStatus } from '../types/mosque';
import { ApiClient } from '../lib/apiClient';
import { ferioColors, ferioRadius, ferioSpacing } from '../theme/tokens';

interface MyAttendedMosquesModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectMosque?: (mosqueId: string) => void;
  isBangla?: boolean;
}

export const MyAttendedMosquesModal: React.FC<MyAttendedMosquesModalProps> = ({
  visible,
  onClose,
  onSelectMosque,
  isBangla = true,
}) => {
  const [attendedMosques, setAttendedMosques] = useState<AttendedMosqueItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAttended = useCallback(async () => {
    try {
      setIsLoading(true);
      const items = await ApiClient.getMyAttendedMosques();
      setAttendedMosques(items);
    } catch {
      setAttendedMosques([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      fetchAttended();
    }
  }, [visible, fetchAttended]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAttended();
  };

  const handleRemove = async (mosqueId: string, mosqueName: string) => {
    Alert.alert(
      isBangla ? 'বাতিল নিশ্চিত করুন' : 'Confirm Removal',
      isBangla
        ? `${mosqueName} থেকে আপনার নিয়মিত মুসল্লি স্ট্যাটাস বাদ দিতে চান?`
        : `Remove attendance affiliation for ${mosqueName}?`,
      [
        { text: isBangla ? 'না' : 'Cancel', style: 'cancel' },
        {
          text: isBangla ? 'হ্যাঁ, বাদ দিন' : 'Remove',
          style: 'destructive',
          onPress: async () => {
            setAttendedMosques((prev) => prev.filter((m) => m.mosqueId !== mosqueId));
            try {
              await ApiClient.setAttendance(mosqueId, 'NONE');
            } catch {}
          },
        },
      ]
    );
  };

  const handleSelect = (mosqueId: string) => {
    onClose();
    if (onSelectMosque) {
      onSelectMosque(mosqueId);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>
                {isBangla ? 'আমার নিয়মিত মসজিদ' : 'My Regular Mosques'}
              </Text>
              <Text style={styles.subtitle}>
                {isBangla
                  ? 'আপনার নিয়মিত জামাতের মসজিদসমূহ'
                  : 'Mosques where you pray with congregation regularly'}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* List Content */}
          {isLoading && !isRefreshing ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="small" color="#059669" />
              <Text style={styles.loadingText}>
                {isBangla ? 'লোড হচ্ছে...' : 'Loading mosques...'}
              </Text>
            </View>
          ) : attendedMosques.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyIcon}>🕌</Text>
              <Text style={styles.emptyTitle}>
                {isBangla ? 'কোনো মসজিদ যুক্ত নেই' : 'No Affiliated Mosques'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {isBangla
                  ? 'যেকোনো মসজিদের বিস্তারিত পেইজে গিয়ে "আমার নিয়মিত মসজিদ" বোতাম চাপুন।'
                  : 'Open any mosque detail sheet and tap "I pray here regularly" to affiliate.'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={attendedMosques}
              keyExtractor={(item) => item.mosqueId}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  colors={['#059669']}
                  tintColor="#059669"
                />
              }
              renderItem={({ item }) => {
                const isRegular = item.status === 'REGULAR';
                return (
                  <TouchableOpacity
                    style={styles.card}
                    onPress={() => handleSelect(item.mosqueId)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.cardLeft}>
                      <Text style={styles.mosqueName}>{item.mosqueName}</Text>
                      {item.city && (
                        <Text style={styles.cityText}>📍 {item.city}</Text>
                      )}
                      <View style={[styles.statusBadge, isRegular ? styles.regularBadge : styles.occasionalBadge]}>
                        <Text style={[styles.statusBadgeText, isRegular ? styles.regularText : styles.occasionalText]}>
                          {isRegular
                            ? isBangla ? '✓ নিয়মিত মুসল্লি' : '✓ Regular Attendee'
                            : isBangla ? '✓ অনিয়মিত' : '✓ Occasional'}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => handleRemove(item.mosqueId, item.mosqueName)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text style={styles.removeBtnText}>✕</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#fafafa',
    borderTopLeftRadius: ferioRadius.xl,
    borderTopRightRadius: ferioRadius.xl,
    maxHeight: '80%',
    minHeight: '50%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ferioSpacing.md,
    paddingTop: ferioSpacing.md,
    paddingBottom: ferioSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8ea',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: ferioColors.primary,
  },
  subtitle: {
    fontSize: 12,
    color: ferioColors.muted,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: ferioRadius.full,
    backgroundColor: '#f4f4f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6e6e73',
  },
  listContent: {
    padding: ferioSpacing.md,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e8e8ea',
    borderRadius: ferioRadius.lg,
    padding: ferioSpacing.md,
    marginBottom: 8,
  },
  cardLeft: {
    flex: 1,
    marginRight: 8,
  },
  mosqueName: {
    fontSize: 14,
    fontWeight: '700',
    color: ferioColors.primary,
    marginBottom: 2,
  },
  cityText: {
    fontSize: 11,
    color: ferioColors.muted,
    marginBottom: 6,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: ferioRadius.full,
    borderWidth: 1,
  },
  regularBadge: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  occasionalBadge: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  regularText: {
    color: '#059669',
  },
  occasionalText: {
    color: '#374151',
  },
  removeBtn: {
    padding: 8,
    borderRadius: ferioRadius.full,
    backgroundColor: '#fef2f2',
  },
  removeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#dc2626',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: ferioColors.muted,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: ferioColors.primary,
  },
  emptySubtitle: {
    fontSize: 12,
    color: ferioColors.muted,
    textAlign: 'center',
    marginTop: 4,
  },
});
