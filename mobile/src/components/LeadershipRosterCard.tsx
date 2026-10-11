import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Linking,
  Alert,
} from 'react-native';
import { MosqueStaffMember } from '../types/mosque';
import { ferioColors, ferioRadius, ferioSpacing } from '../theme/tokens';

interface LeadershipRosterCardProps {
  staffMembers: MosqueStaffMember[];
  onClaimRole?: () => void;
  onVerifyCommittee?: () => void;
}

const ROLE_THEMES: Record<string, { bg: string; text: string; border: string }> = {
  Khatib: { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' },
  'Senior Pesh Imam': { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' },
  Imam: { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' },
  Moazzin: { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
  'President / Mutawalli': { bg: '#f3f4f6', text: ferioColors.primary, border: '#e5e7eb' },
  President: { bg: '#f3f4f6', text: ferioColors.primary, border: '#e5e7eb' },
  'General Secretary': { bg: '#f3f4f6', text: ferioColors.primary, border: '#e5e7eb' },
  Mutawalli: { bg: '#f3f4f6', text: ferioColors.primary, border: '#e5e7eb' },
};

export const LeadershipRosterCard: React.FC<LeadershipRosterCardProps> = ({
  staffMembers,
  onClaimRole,
  onVerifyCommittee,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!staffMembers || staffMembers.length === 0) {
    if (!onClaimRole) return null;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>Mosque Leadership & Staff</Text>
            <Text style={styles.cardSubtitle}>Verified spiritual & administrative leads</Text>
          </View>
        </View>
        {onClaimRole && (
          <Pressable
            style={styles.claimRoleBtn}
            onPress={onClaimRole}
            accessibilityRole="button"
            accessibilityLabel="Claim Leadership Role"
          >
            <Text style={styles.claimRoleText}>👑 Are you an Imam or Committee lead? Claim Role →</Text>
          </Pressable>
        )}
        {onVerifyCommittee && (
          <Pressable
            style={styles.verifyCommitteeBtn}
            onPress={onVerifyCommittee}
            accessibilityRole="button"
            accessibilityLabel="Official Committee Verification"
          >
            <Text style={styles.verifyCommitteeText}>🛡️ Official Committee Verification & Proof →</Text>
          </Pressable>
        )}
      </View>
    );
  }

  const displayedStaff = isExpanded ? staffMembers : staffMembers.slice(0, 2);

  const handleCall = async (number: string, name: string) => {
    const url = `tel:${number.replace(/\s+/g, '')}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Dialer Unavailable', `Direct call to ${name} is not supported on this device: ${number}`);
      }
    } catch {
      Alert.alert('Dialer Error', `Could not initiate call to ${number}`);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardTitle}>Mosque Leadership & Staff</Text>
          <Text style={styles.cardSubtitle}>Verified spiritual & administrative leads</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{staffMembers.length} Leaders</Text>
        </View>
      </View>

      <View style={styles.staffList}>
        {displayedStaff.map((staff) => {
          const theme = ROLE_THEMES[staff.role] || {
            bg: ferioColors.canvas,
            text: ferioColors.primary,
            border: ferioColors.border,
          };

          return (
            <View key={staff.id} style={styles.staffItem}>
              <View style={styles.staffTopRow}>
                <View style={styles.staffInfo}>
                  <Text style={styles.staffName}>{staff.name}</Text>
                  <View style={styles.roleRow}>
                    <View style={[styles.roleBadge, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                      <Text style={[styles.roleText, { color: theme.text }]}>
                        {staff.role}
                      </Text>
                    </View>

                    {staff.isVerified && (
                      <View style={styles.verifiedBadge}>
                        <Text style={styles.verifiedText}>✓ Verified</Text>
                      </View>
                    )}
                  </View>
                </View>

                {staff.contactNumber && (
                  <Pressable
                    style={styles.callBtn}
                    onPress={() => handleCall(staff.contactNumber!, staff.name)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`Call ${staff.name}`}
                  >
                    <Text style={styles.callBtnText}>📞 Call</Text>
                  </Pressable>
                )}
              </View>

              {staff.contactNumber && (
                <Text style={styles.contactText}>Tel: {staff.contactNumber}</Text>
              )}
            </View>
          );
        })}
      </View>

      {staffMembers.length > 2 && (
        <Pressable
          style={styles.expandToggle}
          onPress={() => setIsExpanded((prev) => !prev)}
          accessibilityRole="button"
        >
          <Text style={styles.expandToggleText}>
            {isExpanded
              ? '▲ Show Less'
              : `▼ Show all ${staffMembers.length} leadership members`}
          </Text>
        </Pressable>
      )}

      {onClaimRole && (
        <Pressable
          style={styles.claimRoleBtn}
          onPress={onClaimRole}
          accessibilityRole="button"
          accessibilityLabel="Claim Leadership Role"
        >
          <Text style={styles.claimRoleText}>👑 Are you an Imam or Committee lead? Claim Role →</Text>
        </Pressable>
      )}

      {onVerifyCommittee && (
        <Pressable
          style={styles.verifyCommitteeBtn}
          onPress={onVerifyCommittee}
          accessibilityRole="button"
          accessibilityLabel="Official Committee Verification"
        >
          <Text style={styles.verifyCommitteeText}>🛡️ Official Committee Verification & Proof →</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: ferioColors.surface,
    borderWidth: 1,
    borderColor: ferioColors.border,
    borderRadius: ferioRadius.lg,
    padding: ferioSpacing.lg,
    marginBottom: ferioSpacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ferioSpacing.md,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: ferioColors.primary,
  },
  cardSubtitle: {
    fontSize: 11,
    color: ferioColors.muted,
    marginTop: 2,
  },
  countBadge: {
    backgroundColor: ferioColors.canvas,
    paddingHorizontal: ferioSpacing.sm,
    paddingVertical: 3,
    borderRadius: ferioRadius.full,
    borderWidth: 1,
    borderColor: ferioColors.border,
  },
  countText: {
    fontSize: 10,
    fontWeight: '600',
    color: ferioColors.muted,
  },
  staffList: {
    gap: ferioSpacing.sm,
  },
  staffItem: {
    backgroundColor: ferioColors.canvas,
    borderWidth: 1,
    borderColor: ferioColors.border,
    borderRadius: ferioRadius.md,
    padding: ferioSpacing.md,
  },
  staffTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  staffInfo: {
    flex: 1,
    marginRight: ferioSpacing.sm,
  },
  staffName: {
    fontSize: 13,
    fontWeight: '700',
    color: ferioColors.primary,
    marginBottom: 4,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: ferioSpacing.xs,
  },
  roleBadge: {
    paddingHorizontal: ferioSpacing.sm,
    paddingVertical: 2,
    borderRadius: ferioRadius.sm,
    borderWidth: 1,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
  },
  verifiedBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: ferioSpacing.sm,
    paddingVertical: 2,
    borderRadius: ferioRadius.sm,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  callBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: ferioSpacing.md,
    paddingVertical: 6,
    borderRadius: ferioRadius.full,
  },
  callBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  contactText: {
    fontSize: 11,
    color: ferioColors.muted,
    marginTop: ferioSpacing.xs,
    fontVariant: ['tabular-nums'],
  },
  expandToggle: {
    alignItems: 'center',
    paddingTop: ferioSpacing.md,
    marginTop: ferioSpacing.xs,
    borderTopWidth: 1,
    borderTopColor: ferioColors.border,
  },
  expandToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: ferioColors.primary,
  },
  claimRoleBtn: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e8e8ea',
    borderRadius: ferioRadius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginTop: ferioSpacing.sm,
  },
  claimRoleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  verifyCommitteeBtn: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: ferioRadius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  verifyCommitteeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
});
