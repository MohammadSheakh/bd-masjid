import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MosqueStaffRole } from '../types/community';
import { ApiClient } from '../lib/apiClient';
import { ContributorService } from '../services/contributorService';
import { AuthService } from '../services/authService';

interface RoleClaimModalProps {
  visible: boolean;
  mosqueId: string;
  mosqueName: string;
  onClose: () => void;
  isBangla?: boolean;
}

const AVAILABLE_ROLES: { role: MosqueStaffRole; labelBn: string; labelEn: string }[] = [
  { role: 'KHATIB', labelBn: 'খতিব', labelEn: 'Khatib' },
  { role: 'SENIOR_IMAM', labelBn: 'সিনিয়র ইমাম', labelEn: 'Senior Imam' },
  { role: 'IMAM', labelBn: 'ইমাম', labelEn: 'Imam' },
  { role: 'MUAZZIN', labelBn: 'মুয়াজ্জিন', labelEn: 'Muazzin' },
  { role: 'MUTAWALLI', labelBn: 'মোতাওয়াল্লি', labelEn: 'Mutawalli' },
  { role: 'PRESIDENT', labelBn: 'সভাপতি', labelEn: 'President' },
  { role: 'SECRETARY', labelBn: 'সাধারণ সম্পাদক', labelEn: 'Secretary' },
  { role: 'COMMITTEE_MEMBER', labelBn: 'কমিটি সদস্য', labelEn: 'Committee' },
  { role: 'KHADEM', labelBn: 'খাদেম', labelEn: 'Khadem' },
];

export const RoleClaimModal: React.FC<RoleClaimModalProps> = ({
  visible,
  mosqueId,
  mosqueName,
  onClose,
  isBangla = true,
}) => {
  const user = AuthService.getUserSync();
  const [selectedRole, setSelectedRole] = useState<MosqueStaffRole>('IMAM');
  const [name, setName] = useState(user?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [evidence, setEvidence] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert(isBangla ? 'ভুল' : 'Error', isBangla ? 'অনুগ্রহ করে আপনার নাম লিখুন' : 'Please enter your name');
      return;
    }
    if (!phoneNumber.trim() || phoneNumber.length < 8) {
      Alert.alert(isBangla ? 'ভুল' : 'Error', isBangla ? 'সঠিক মোবাইল নম্বর দিন' : 'Please enter a valid phone number');
      return;
    }

    setIsSubmitting(true);
    try {
      await ApiClient.submitRoleClaim(mosqueId, {
        role: selectedRole,
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        evidence: evidence.trim() || undefined,
      });

      ContributorService.awardOptimisticPoints(50, `Role claim: ${selectedRole}`);

      Alert.alert(
        isBangla ? 'দাবি সফলভাবে জমা হয়েছে' : 'Claim Submitted',
        isBangla
          ? 'আপনার নেতৃত্ব দাবি জমা হয়েছে। প্রশাসনিক যাচাইকরণ শেষে ব্যাজ প্রদর্শিত হবে।'
          : 'Your leadership claim has been submitted for verification.',
        [{ text: 'OK', onPress: onClose }]
      );
    } catch {
      Alert.alert(isBangla ? 'ত্রুটি' : 'Error', isBangla ? 'দাবি জমা ব্যর্থ হয়েছে' : 'Failed to submit claim');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <View style={styles.titleRow}>
                <Text style={styles.titleIcon}>👑</Text>
                <Text style={styles.title}>{isBangla ? 'মসজিদ নেতৃত্ব দাবি করুন' : 'Claim Mosque Role'}</Text>
              </View>
              <Text style={styles.subtitle} numberOfLines={1}>{mosqueName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Role Chips */}
            <Text style={styles.label}>{isBangla ? 'আপনার পদবী নির্বাচন করুন' : 'Select Official Role'}</Text>
            <View style={styles.roleGrid}>
              {AVAILABLE_ROLES.map((r) => {
                const isSelected = selectedRole === r.role;
                return (
                  <TouchableOpacity
                    key={r.role}
                    style={[styles.roleChip, isSelected && styles.roleChipActive]}
                    onPress={() => setSelectedRole(r.role)}
                  >
                    <Text style={[styles.roleChipText, isSelected && styles.roleChipTextActive]}>
                      {isBangla ? r.labelBn : r.labelEn}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Inputs */}
            <Text style={styles.label}>{isBangla ? 'পূর্ণ নাম' : 'Full Name'}</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={isBangla ? 'মাওলানা / হাফেজ...' : 'Enter your name'}
              placeholderTextColor="#9ca3af"
            />

            <Text style={styles.label}>{isBangla ? 'যোগাযোগের মোবাইল নম্বর' : 'Phone Number'}</Text>
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              placeholder="017XXXXXXXX"
              placeholderTextColor="#9ca3af"
            />

            <Text style={styles.label}>
              {isBangla ? 'নিয়োগ বা প্রমাণের বিবরণ (ঐচ্ছিক)' : 'Appointment Evidence / Resolution Notes'}
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={evidence}
              onChangeText={setEvidence}
              multiline
              numberOfLines={3}
              placeholder={isBangla ? 'কমিটি রেজোলিউশন তারিখ বা সভাপতির নাম/মোবাইল...' : 'Resolution details or committee contact'}
              placeholderTextColor="#9ca3af"
            />

            {/* Submit CTA */}
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {isBangla ? 'যাচাইকরণের জন্য জমা দিন' : 'Submit Leadership Claim'}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '88%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e8e8ea',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  titleIcon: {
    fontSize: 18,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111114',
  },
  subtitle: {
    fontSize: 12,
    color: '#6e6e73',
    marginTop: 2,
    maxWidth: 260,
  },
  closeBtn: {
    fontSize: 18,
    color: '#6e6e73',
    fontWeight: '600',
    padding: 4,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111114',
    marginBottom: 6,
    marginTop: 10,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  roleChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f4f4f5',
    borderWidth: 1,
    borderColor: '#e8e8ea',
  },
  roleChipActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111114',
  },
  roleChipTextActive: {
    color: '#ffffff',
  },
  input: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e8e8ea',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#111114',
  },
  textArea: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#111114',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 16,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
