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
import {
  DonationChannelType,
  DonationChannelAccountType,
  DonationPurpose,
  CreateDonationPayload,
} from '../types/donation';
import { ApiClient } from '../lib/apiClient';
import { ferioColors, ferioRadius, ferioSpacing } from '../theme/tokens';

interface SuggestDonationMethodModalProps {
  visible: boolean;
  mosqueId: string;
  mosqueName: string;
  onClose: () => void;
  onSuccess?: () => void;
  isBangla?: boolean;
}

const BRANDS: { type: DonationChannelType; label: string; bg: string; text: string }[] = [
  { type: 'BKASH', label: 'bKash / বিকাশ', bg: '#fdf2f8', text: '#d12053' },
  { type: 'NAGAD', label: 'Nagad / নগদ', bg: '#fff7ed', text: '#e15b26' },
  { type: 'ROCKET', label: 'Rocket / রকেট', bg: '#faf5ff', text: '#8c338c' },
  { type: 'UPAY', label: 'Upay / উপায়', bg: '#eff6ff', text: '#0056b3' },
  { type: 'BANK_TRANSFER', label: 'Bank Transfer / ব্যাংক', bg: '#ecfdf5', text: '#059669' },
];

const ACCOUNT_TYPES: { type: DonationChannelAccountType; labelBn: string; labelEn: string }[] = [
  { type: 'MERCHANT', labelBn: 'মার্চেন্ট / অফিসিয়াল', labelEn: 'Merchant / Official' },
  { type: 'PERSONAL', labelBn: 'ব্যক্তিগত', labelEn: 'Personal' },
  { type: 'AGENT', labelBn: 'এজেন্ট', labelEn: 'Agent' },
];

const PURPOSES: { purpose: DonationPurpose; labelBn: string; labelEn: string }[] = [
  { purpose: 'GENERAL_FUND', labelBn: 'সাধারণ তহবিল', labelEn: 'General Fund' },
  { purpose: 'CONSTRUCTION', labelBn: 'মসজিদ নির্মাণ', labelEn: 'Construction' },
  { purpose: 'UTILITIES_MAINTENANCE', labelBn: 'বিদ্যুৎ ও রক্ষণাবেক্ষণ', labelEn: 'Utilities' },
  { purpose: 'ORPHAN_EDUCATION', labelBn: 'এতিম ও মক্তব', labelEn: 'Maktab' },
  { purpose: 'ZAKAT', labelBn: 'যাকাত তহবিল', labelEn: 'Zakat' },
];

export const SuggestDonationMethodModal: React.FC<SuggestDonationMethodModalProps> = ({
  visible,
  mosqueId,
  mosqueName,
  onClose,
  onSuccess,
  isBangla = true,
}) => {
  const [channelType, setChannelType] = useState<DonationChannelType>('BKASH');
  const [accountType, setAccountType] = useState<DonationChannelAccountType>('MERCHANT');
  const [purpose, setPurpose] = useState<DonationPurpose>('GENERAL_FUND');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountTitle, setAccountTitle] = useState('');
  const [bankName, setBankName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [paymentInstructions, setPaymentInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!accountNumber.trim() || accountNumber.trim().length < 3) {
      Alert.alert(
        isBangla ? 'ভুল তথ্য' : 'Validation Error',
        isBangla ? 'অনুগ্রহ করে সঠিক অ্যাকাউন্ট বা ওয়ালেট নম্বর দিন।' : 'Please enter a valid account or wallet number.'
      );
      return;
    }
    if (!accountTitle.trim() || accountTitle.trim().length < 2) {
      Alert.alert(
        isBangla ? 'ভুল তথ্য' : 'Validation Error',
        isBangla ? 'অনুগ্রহ করে অ্যাকাউন্টধারীর নাম দিন।' : 'Please enter the beneficiary account title.'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: CreateDonationPayload = {
        channelType,
        accountType,
        purpose,
        accountNumber: accountNumber.trim(),
        accountTitle: accountTitle.trim(),
        bankName: channelType === 'BANK_TRANSFER' ? bankName.trim() : undefined,
        branchName: channelType === 'BANK_TRANSFER' ? branchName.trim() : undefined,
        routingNumber: channelType === 'BANK_TRANSFER' ? routingNumber.trim() : undefined,
        paymentInstructions: paymentInstructions.trim() || undefined,
      };

      const res = await ApiClient.submitDonationChannel(mosqueId, payload);
      Alert.alert(
        isBangla ? 'সফল হয়েছে' : 'Success',
        res.message || (isBangla ? 'অনুদান চ্যানেল জমা দেওয়া হয়েছে।' : 'Donation channel draft submitted.')
      );
      setAccountNumber('');
      setAccountTitle('');
      setBankName('');
      setBranchName('');
      setRoutingNumber('');
      setPaymentInstructions('');
      onClose();
      if (onSuccess) onSuccess();
    } catch {
      Alert.alert(
        isBangla ? 'ত্রুটি' : 'Error',
        isBangla ? 'জমা দেওয়া সম্ভব হয়নি। আবার চেষ্টা করুন।' : 'Failed to submit donation channel. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
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
                {isBangla ? 'অনুদান চ্যানেল যোগ করুন' : 'Add Donation Channel'}
              </Text>
              <Text style={styles.subtitle}>{mosqueName}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Anti-fraud advisory */}
            <View style={styles.advisoryBox}>
              <Text style={styles.advisoryText}>
                🔒 {isBangla
                  ? 'প্রতারণা রোধে সকল অ্যাকাউন্ট মসজিদ কমিটির বহু-স্বাক্ষরিত অনুমোদনের পরই প্রকাশিত হবে।'
                  : 'To protect worshippers against fraud, submissions require verified leadership consensus.'}
              </Text>
            </View>

            {/* Brand Selector */}
            <Text style={styles.inputLabel}>{isBangla ? 'পেমেন্ট চ্যানেল' : 'Payment Brand'} *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
              {BRANDS.map((brand) => {
                const isActive = channelType === brand.type;
                return (
                  <TouchableOpacity
                    key={brand.type}
                    style={[
                      styles.brandPill,
                      isActive && { backgroundColor: brand.bg, borderColor: brand.text },
                    ]}
                    onPress={() => setChannelType(brand.type)}
                  >
                    <Text style={[styles.brandPillText, isActive && { color: brand.text, fontWeight: '700' }]}>
                      {brand.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Account Type */}
            <Text style={styles.inputLabel}>{isBangla ? 'অ্যাকাউন্টের ধরণ' : 'Account Type'} *</Text>
            <View style={styles.rowSelector}>
              {ACCOUNT_TYPES.map((type) => {
                const isActive = accountType === type.type;
                return (
                  <TouchableOpacity
                    key={type.type}
                    style={[styles.smallPill, isActive && styles.smallPillActive]}
                    onPress={() => setAccountType(type.type)}
                  >
                    <Text style={[styles.smallPillText, isActive && styles.smallPillTextActive]}>
                      {isBangla ? type.labelBn : type.labelEn}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Purpose */}
            <Text style={styles.inputLabel}>{isBangla ? 'তহবিলের উদ্দেশ্য' : 'Fund Purpose'} *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
              {PURPOSES.map((p) => {
                const isActive = purpose === p.purpose;
                return (
                  <TouchableOpacity
                    key={p.purpose}
                    style={[styles.smallPill, isActive && styles.smallPillActive]}
                    onPress={() => setPurpose(p.purpose)}
                  >
                    <Text style={[styles.smallPillText, isActive && styles.smallPillTextActive]}>
                      {isBangla ? p.labelBn : p.labelEn}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Account Number */}
            <Text style={styles.inputLabel}>
              {channelType === 'BANK_TRANSFER'
                ? isBangla ? 'ব্যাংক হিসাব নম্বর' : 'Account Number'
                : isBangla ? 'ওয়ালেট নম্বর (০১৭...)' : 'Wallet Number'} *
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder={channelType === 'BANK_TRANSFER' ? 'e.g. 2050123456789' : 'e.g. 01711000000'}
              placeholderTextColor="#9ca3af"
              value={accountNumber}
              onChangeText={setAccountNumber}
              keyboardType={channelType === 'BANK_TRANSFER' ? 'default' : 'phone-pad'}
            />

            {/* Account Title */}
            <Text style={styles.inputLabel}>
              {isBangla ? 'অ্যাকাউন্টের নাম (Beneficiary Title)' : 'Account Beneficiary Title'} *
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Baitul Mukarram Mosque Fund"
              placeholderTextColor="#9ca3af"
              value={accountTitle}
              onChangeText={setAccountTitle}
            />

            {/* Bank Fields if BANK_TRANSFER */}
            {channelType === 'BANK_TRANSFER' && (
              <>
                <Text style={styles.inputLabel}>{isBangla ? 'ব্যাংকের নাম' : 'Bank Name'} *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Islami Bank Bangladesh PLC"
                  placeholderTextColor="#9ca3af"
                  value={bankName}
                  onChangeText={setBankName}
                />

                <Text style={styles.inputLabel}>{isBangla ? 'শাখার নাম' : 'Branch Name'}</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Motijheel Corporate Branch"
                  placeholderTextColor="#9ca3af"
                  value={branchName}
                  onChangeText={setBranchName}
                />

                <Text style={styles.inputLabel}>{isBangla ? 'রাউটিং নম্বর' : 'Routing Number'}</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 125271829"
                  placeholderTextColor="#9ca3af"
                  value={routingNumber}
                  onChangeText={setRoutingNumber}
                  keyboardType="numeric"
                />
              </>
            )}

            {/* Reference Guidelines */}
            <Text style={styles.inputLabel}>{isBangla ? 'রেফারেন্স বা নির্দেশনা' : 'Payment Reference Note'}</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="e.g. Please enter your phone number in reference..."
              placeholderTextColor="#9ca3af"
              value={paymentInstructions}
              onChangeText={setPaymentInstructions}
              multiline
              numberOfLines={3}
            />

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {isBangla ? 'জমা দিন / Submit Channel' : 'Submit Channel Draft'}
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#fafafa',
    borderTopLeftRadius: ferioRadius.xl,
    borderTopRightRadius: ferioRadius.xl,
    maxHeight: '88%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ferioSpacing.md,
    paddingTop: ferioSpacing.md,
    paddingBottom: ferioSpacing.xs,
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
    color: '#059669',
    fontWeight: '600',
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
  scrollContent: {
    padding: ferioSpacing.md,
  },
  advisoryBox: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: ferioRadius.md,
    padding: 10,
    marginBottom: 10,
  },
  advisoryText: {
    fontSize: 11,
    color: '#1e40af',
    lineHeight: 16,
    fontWeight: '500',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginTop: 8,
    marginBottom: 6,
  },
  pillScroll: {
    marginBottom: 6,
  },
  brandPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: ferioRadius.full,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e8e8ea',
    marginRight: 6,
  },
  brandPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  rowSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  smallPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: ferioRadius.full,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e8e8ea',
    marginRight: 6,
  },
  smallPillActive: {
    backgroundColor: '#111114',
    borderColor: '#111114',
  },
  smallPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  smallPillTextActive: {
    color: '#ffffff',
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e8e8ea',
    borderRadius: ferioRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: ferioColors.primary,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#111114',
    borderRadius: ferioRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
});
