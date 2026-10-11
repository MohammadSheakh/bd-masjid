import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { AuthService } from '../services/authService';
import { UserProfile } from '../types/auth';

interface ContributorAttributionBannerProps {
  onOpenAuthModal?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const ContributorAttributionBanner: React.FC<ContributorAttributionBannerProps> = ({
  onOpenAuthModal,
  style,
}) => {
  const [user, setUser] = useState<UserProfile | null>(() => AuthService.getUserSync());

  useEffect(() => {
    return AuthService.subscribeAuth((session) => {
      setUser(session.user);
    });
  }, []);

  if (user) {
    const initials = user.name.slice(0, 1).toUpperCase();
    const roleBadge = user.role === 'ADMIN' ? 'Admin' : user.role === 'MODERATOR' ? 'Moderator' : 'Scout';

    return (
      <View style={[styles.container, styles.authContainer, style]}>
        <View style={styles.authAvatar}>
          <Text style={styles.authAvatarText}>{initials}</Text>
        </View>
        <View style={styles.contentColumn}>
          <View style={styles.row}>
            <Text style={styles.authName} numberOfLines={1}>{user.name}</Text>
            <View style={styles.scoutPill}>
              <Text style={styles.scoutPillText}>✓ {roleBadge}</Text>
            </View>
          </View>
          <Text style={styles.authSub}>Provenance linked · Account verified</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.guestContainer, style]}>
      <View style={styles.guestAvatar}>
        <Text style={styles.guestAvatarText}>👤</Text>
      </View>
      <View style={styles.contentColumn}>
        <Text style={styles.guestTitle}>Anonymous Musalli</Text>
        <Text style={styles.guestSub}>Sign in to earn scout rep & link submission</Text>
      </View>
      {onOpenAuthModal && (
        <TouchableOpacity
          style={styles.signInButton}
          onPress={onOpenAuthModal}
          activeOpacity={0.7}
        >
          <Text style={styles.signInButtonText}>Sign In</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
  },
  authContainer: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  guestContainer: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  authAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  authAvatarText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  guestAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  guestAvatarText: {
    fontSize: 12,
  },
  contentColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065f46',
    maxWidth: 160,
  },
  scoutPill: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  scoutPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
  },
  authSub: {
    fontSize: 11,
    color: '#047857',
    marginTop: 1,
  },
  guestTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  guestSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  signInButton: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginLeft: 8,
  },
  signInButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
});
