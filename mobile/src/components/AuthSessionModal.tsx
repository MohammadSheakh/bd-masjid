/**
 * Ferio Auth & Contributor Session Modal (ADR-003, ADR-054)
 * - Guest Sign-In and Account Registration with instant feedback
 * - Authenticated Musalli/Contributor Profile card with role badges
 * - Non-blocking guest browsing preservation notice
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { AuthService } from '../services/authService';
import { UserProfile } from '../types/auth';
import { ferioColors, ferioRadius, ferioSpacing } from '../theme/tokens';
import { ContributorActivityModal } from './ContributorActivityModal';

interface AuthSessionModalProps {
  visible: boolean;
  onClose: () => void;
  isBangla?: boolean;
}

export const AuthSessionModal: React.FC<AuthSessionModalProps> = ({
  visible,
  onClose,
  isBangla = false,
}) => {
  const [user, setUser] = useState<UserProfile | null>(() => AuthService.getUserSync());
  const [tab, setTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [showContributorModal, setShowContributorModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setUser(AuthService.getUserSync());
      setErrorMessage(null);
      const unsubscribe = AuthService.subscribeAuth((session) => {
        setUser(session.user);
      });
      return unsubscribe;
    }
  }, [visible]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage(isBangla ? 'ইমেইল এবং পাসওয়ার্ড দিন' : 'Email and password are required');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await AuthService.login({ email: email.trim(), password });
      onClose();
    } catch {
      setErrorMessage(isBangla ? 'লগইন ব্যর্থ হয়েছে' : 'Login failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || password.length < 8) {
      setErrorMessage(
        isBangla
          ? 'নাম, ইমেইল এবং অন্তত ৮ অক্ষরের পাসওয়ার্ড দিন'
          : 'Name, email, and min 8 character password required'
      );
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await AuthService.register({
        name: name.trim(),
        email: email.trim(),
        password,
        phoneNumber: phoneNumber.trim() || undefined,
      });
      onClose();
    } catch {
      setErrorMessage(isBangla ? 'নিবন্ধন ব্যর্থ হয়েছে' : 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      isBangla ? 'লগআউট নিশ্চিতকরণ' : 'Confirm Sign Out',
      isBangla ? 'আপনি কি নিশ্চিত যে সাইন আউট করতে চান?' : 'Are you sure you want to sign out?',
      [
        { text: isBangla ? 'বাতিল' : 'Cancel', style: 'cancel' },
        {
          text: isBangla ? 'লগআউট' : 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await AuthService.logout();
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {user
                ? isBangla ? 'সেবক প্রোফাইল' : 'Contributor Profile'
                : isBangla ? 'অ্যাকাউন্টে প্রবেশ' : 'Sign In / Register'}
            </Text>
            <Pressable
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={12}
              accessibilityLabel="Close auth sheet"
            >
              <Text style={styles.closeIcon}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            {user ? (
              /* Authenticated Profile View */
              <View style={styles.profileContainer}>
                <View style={styles.avatarRow}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>
                      {AuthService.getInitials(user.name)}
                    </Text>
                  </View>
                  <View style={styles.profileMeta}>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleBadgeText}>
                        ✓ {AuthService.getRoleBadge(user.role, isBangla)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Contributor Benefit Box */}
                <View style={styles.benefitBox}>
                  <Text style={styles.benefitIcon}>🕌</Text>
                  <Text style={styles.benefitText}>
                    {isBangla
                      ? 'আপনার সকল মসজিদ ও জামাতের সময় আপডেট আপনার ভেরিফাইড প্রোফাইলে যুক্ত রয়েছে।'
                      : 'Your mosque listings and timetable updates are automatically verified under your account.'}
                  </Text>
                </View>

                {/* View Activity & Scout Points Button */}
                <Pressable
                  onPress={() => setShowContributorModal(true)}
                  style={styles.activityButton}
                  hitSlop={8}
                >
                  <Text style={styles.activityButtonText}>
                    {isBangla ? '🏅 কন্ট্রিবিউশন ও স্কাউট পয়েন্ট দেখুন →' : '🏅 View Activity & Scout Points →'}
                  </Text>
                </Pressable>

                {/* Sign Out Button */}
                <Pressable
                  onPress={handleLogout}
                  style={styles.signOutButton}
                  hitSlop={8}
                >
                  <Text style={styles.signOutButtonText}>
                    {isBangla ? 'লগআউট করুন' : 'Sign Out of Account'}
                  </Text>
                </Pressable>
              </View>
            ) : (
              /* Guest Sign In / Register View */
              <View style={styles.formContainer}>
                {/* Tabs */}
                <View style={styles.tabBar}>
                  <Pressable
                    onPress={() => {
                      setTab('LOGIN');
                      setErrorMessage(null);
                    }}
                    style={[styles.tabBtn, tab === 'LOGIN' && styles.tabBtnActive]}
                  >
                    <Text style={[styles.tabText, tab === 'LOGIN' && styles.tabTextActive]}>
                      {isBangla ? 'লগইন' : 'Sign In'}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setTab('REGISTER');
                      setErrorMessage(null);
                    }}
                    style={[styles.tabBtn, tab === 'REGISTER' && styles.tabBtnActive]}
                  >
                    <Text style={[styles.tabText, tab === 'REGISTER' && styles.tabTextActive]}>
                      {isBangla ? 'নতুন অ্যাকাউন্ট' : 'Register'}
                    </Text>
                  </Pressable>
                </View>

                {/* Error Banner */}
                {errorMessage && (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                )}

                {/* Inputs */}
                {tab === 'REGISTER' && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>{isBangla ? 'আপনার পূর্ণ নাম' : 'Full Name'}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={isBangla ? 'যেমন: মোহাম্মদ আব্দুল্লাহ' : 'e.g. Mohammad Abdullah'}
                      placeholderTextColor={ferioColors.muted}
                      value={name}
                      onChangeText={setName}
                    />
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{isBangla ? 'ইমেইল ঠিকানা' : 'Email Address'}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="user@example.com"
                    placeholderTextColor={ferioColors.muted}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{isBangla ? 'পাসওয়ার্ড' : 'Password'}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={isBangla ? 'কমপক্ষে ৮ অক্ষর' : 'Min 8 characters'}
                    placeholderTextColor={ferioColors.muted}
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>

                {tab === 'REGISTER' && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>
                      {isBangla ? 'মোবাইল নম্বর (ঐচ্ছিক)' : 'Phone Number (Optional)'}
                    </Text>
                    <TextInput
                      style={styles.input}
                      placeholder="017XXXXXXXX"
                      placeholderTextColor={ferioColors.muted}
                      keyboardType="phone-pad"
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                    />
                  </View>
                )}

                {/* Action CTA */}
                <Pressable
                  onPress={tab === 'LOGIN' ? handleLogin : handleRegister}
                  disabled={isLoading}
                  style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={ferioColors.primaryForeground} />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {tab === 'LOGIN'
                        ? isBangla ? 'লগইন করুন' : 'Sign In'
                        : isBangla ? 'অ্যাকাউন্ট তৈরি করুন' : 'Create Contributor Account'}
                    </Text>
                  )}
                </Pressable>

                {/* Non-blocking Guest Note */}
                <View style={styles.guestNote}>
                  <Text style={styles.guestNoteText}>
                    {isBangla
                      ? '💡 নামাজের সময়সূচি ও কিবলা কম্পাস ব্যবহারের জন্য কোনো অ্যাকাউন্টের প্রয়োজন নেই।'
                      : '💡 You can browse mosques, prayer times, and use Qibla compass anonymously without an account.'}
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      <ContributorActivityModal
        visible={showContributorModal}
        onClose={() => setShowContributorModal(false)}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: ferioColors.surface,
    borderTopLeftRadius: ferioRadius.xl,
    borderTopRightRadius: ferioRadius.xl,
    maxHeight: '90%',
    paddingBottom: ferioSpacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ferioSpacing.lg,
    paddingTop: ferioSpacing.lg,
    paddingBottom: ferioSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ferioColors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: ferioColors.primary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: ferioRadius.full,
    backgroundColor: ferioColors.mutedBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 14,
    color: ferioColors.muted,
    fontWeight: '700',
  },
  content: {
    padding: ferioSpacing.lg,
  },
  profileContainer: {
    gap: ferioSpacing.lg,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ferioSpacing.md,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ferioColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: ferioColors.primaryForeground,
  },
  profileMeta: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: ferioColors.primary,
  },
  userEmail: {
    fontSize: 13,
    color: ferioColors.muted,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: ferioColors.accentMuted,
    paddingHorizontal: ferioSpacing.sm,
    paddingVertical: 2,
    borderRadius: ferioRadius.full,
    marginTop: 4,
    borderWidth: 1,
    borderColor: ferioColors.accent,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: ferioColors.accent,
  },
  benefitBox: {
    flexDirection: 'row',
    backgroundColor: ferioColors.canvas,
    padding: ferioSpacing.md,
    borderRadius: ferioRadius.lg,
    borderWidth: 1,
    borderColor: ferioColors.border,
    gap: ferioSpacing.sm,
    alignItems: 'center',
  },
  benefitIcon: {
    fontSize: 22,
  },
  benefitText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: ferioColors.primary,
  },
  signOutButton: {
    backgroundColor: ferioColors.dangerMuted,
    borderRadius: ferioRadius.lg,
    paddingVertical: ferioSpacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  signOutButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: ferioColors.danger,
  },
  activityButton: {
    backgroundColor: ferioColors.primary,
    borderRadius: ferioRadius.lg,
    paddingVertical: ferioSpacing.md,
    alignItems: 'center',
  },
  activityButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: ferioColors.primaryForeground,
  },
  formContainer: {
    gap: ferioSpacing.md,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: ferioColors.mutedBackground,
    borderRadius: ferioRadius.full,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: ferioSpacing.sm,
    borderRadius: ferioRadius.full,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: ferioColors.surface,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: ferioColors.muted,
  },
  tabTextActive: {
    color: ferioColors.primary,
    fontWeight: '700',
  },
  errorBanner: {
    backgroundColor: ferioColors.dangerMuted,
    borderRadius: ferioRadius.md,
    padding: ferioSpacing.sm,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  errorText: {
    fontSize: 12,
    color: ferioColors.danger,
    textAlign: 'center',
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: ferioColors.primary,
  },
  input: {
    height: 42,
    backgroundColor: ferioColors.canvas,
    borderRadius: ferioRadius.md,
    borderWidth: 1,
    borderColor: ferioColors.border,
    paddingHorizontal: ferioSpacing.md,
    fontSize: 14,
    color: ferioColors.primary,
  },
  submitButton: {
    backgroundColor: ferioColors.primary,
    borderRadius: ferioRadius.full,
    paddingVertical: ferioSpacing.md,
    alignItems: 'center',
    marginTop: ferioSpacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: ferioColors.primaryForeground,
  },
  guestNote: {
    marginTop: ferioSpacing.xs,
    alignItems: 'center',
  },
  guestNoteText: {
    fontSize: 11,
    lineHeight: 16,
    color: ferioColors.muted,
    textAlign: 'center',
  },
});
