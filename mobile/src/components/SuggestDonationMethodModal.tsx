import React, { useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MosqueDonationMethod } from '../types/mosque';
import { ApiClient } from '../lib/apiClient';

interface SuggestDonationMethodModalProps {
  visible?: boolean;
  isOpen?: boolean;
  mosqueId?: string;
  mosqueName?: string;
  mosque?: { id: string; name: string };
  onClose: () => void;
  onSuccess?: () => void;
  onDonationAdded?: (method: MosqueDonationMethod) => void;
  isBangla?: boolean;
}

export const SuggestDonationMethodModal: React.FC<SuggestDonationMethodModalProps> = ({
  visible,
  isOpen,
  mosqueId,
  mosqueName,
  mosque,
  onClose,
  onSuccess,
  onDonationAdded,
  isBangla = true,
}) => {
  const isModalVisible = visible ?? isOpen ?? false;
  const effectiveMosqueId = mosque?.id || mosqueId || '';
  const effectiveMosqueName = mosque?.name || mosqueName || '';

  const [methods, setMethods] = useState<MosqueDonationMethod[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [methodType, setMethodType] = useState<'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK_TRANSFER'>('BKASH');
  const [accountType, setAccountType] = useState<'MERCHANT' | 'PERSONAL' | 'BANK_ACCOUNT'>('MERCHANT');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountTitle, setAccountTitle] = useState('');
  const [bankName, setBankName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [instructions, setInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (isModalVisible && effectiveMosqueId) {
      loadDonations();
      setStatusMessage(null);
    }
  }, [isModalVisible, effectiveMosqueId]);

  const loadDonations = async () => {
    setIsLoading(true);
    try {
      const data = await ApiClient.fetchMosqueDonations(effectiveMosqueId);
      setMethods(data || []);
    } catch {
      setMethods([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSubmit = async () => {
    if (!accountNumber.trim()) {
      setStatusMessage({
        type: 'error',
        text: isBangla ? 'অনুগ্রহ করে অ্যাকাউন্ট নম্বর দিন।' : 'Please enter an account number.',
      });
      return;
    }

    if (!accountTitle.trim()) {
      setStatusMessage({
        type: 'error',
        text: isBangla ? 'অনুগ্রহ করে অ্যাকাউন্টের নাম দিন।' : 'Please enter the beneficiary account title.',
      });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    const result = await ApiClient.createMosqueDonation(effectiveMosqueId, {
      methodType,
      accountType: methodType === 'BANK_TRANSFER' ? 'BANK_ACCOUNT' : accountType,
      accountNumber: accountNumber.trim(),
      accountTitle: accountTitle.trim() || undefined,
      bankName: methodType === 'BANK_TRANSFER' ? bankName.trim() : undefined,
      branchName: methodType === 'BANK_TRANSFER' ? branchName.trim() : undefined,
      routingNumber: methodType === 'BANK_TRANSFER' ? routingNumber.trim() : undefined,
      instructions: instructions.trim() || undefined,
    });

    setIsSubmitting(false);

    if (result.success && result.data) {
      setStatusMessage({
        type: 'success',
        text: isBangla
          ? 'অনুদান চ্যানেল যাচাইকরণের জন্য জমা দেওয়া হয়েছে।'
          : 'Donation destination submitted for verification.',
      });
      setMethods((prev) => [...prev, result.data!]);
      if (onDonationAdded) onDonationAdded(result.data!);
      if (onSuccess) onSuccess();
      setShowAddForm(false);
      setAccountNumber('');
      setAccountTitle('');
      setBankName('');
      setBranchName('');
      setRoutingNumber('');
      setInstructions('');
    } else {
      setStatusMessage({
        type: 'error',
        text:
          result.error ||
          (isBangla ? 'অনুদান চ্যানেল জমা দেওয়া সম্ভব হয়নি।' : 'Failed to submit donation destination.'),
      });
    }
  };

  if (!isModalVisible) return null;

  return (
    <Modal visible={isModalVisible} animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.iconBadge}>
                <Text style={styles.iconBadgeText}>💳</Text>
              </View>
              <View style={styles.headerTextCol}>
                <Text style={styles.title}>
                  {isBangla ? 'মসজিদ অনুদান ফান্ড' : 'Mosque Donations'}
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {effectiveMosqueName}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close modal">
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content Body */}
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Security Banner matching web */}
            <View style={styles.securityBanner}>
              <Text style={styles.securityIcon}>🛡️</Text>
              <View style={styles.securityTextGroup}>
                <Text style={styles.securityTitle}>
                  {isBangla ? 'অফিসিয়াল মসজিদ অ্যাকাউন্ট' : 'Official Mosque Accounts'}
                </Text>
                <Text style={styles.securityDesc}>
                  {isBangla
                    ? 'শুধুমাত্র মসজিদ কমিটি কর্তৃক পরিচালিত যাচাইকৃত অ্যাকাউন্টগুলো এখানে প্রদর্শিত। অনুদান প্রেরণের পূর্বে অবশ্যই অ্যাকাউন্টের নাম মিলিয়ে নিন।'
                    : 'Only verified accounts managed by the mosque committee are listed. Always ensure the account title matches before confirming payment.'}
                </Text>
              </View>
            </View>

            {statusMessage && (
              <View
                style={[
                  styles.statusBox,
                  statusMessage.type === 'success' ? styles.statusBoxSuccess : styles.statusBoxError,
                ]}
              >
                <Text style={styles.statusIcon}>
                  {statusMessage.type === 'success' ? '✓' : '⚠️'}
                </Text>
                <Text
                  style={[
                    styles.statusText,
                    statusMessage.type === 'success' ? styles.statusTextSuccess : styles.statusTextError,
                  ]}
                >
                  {statusMessage.text}
                </Text>
              </View>
            )}

            {/* Toggle bar between viewing and registering */}
            <View style={styles.toggleRow}>
              <Text style={styles.sectionHeading}>
                {isBangla ? `যাচাইকৃত চ্যানেল (${methods.length})` : `Verified Channels (${methods.length})`}
              </Text>
              <TouchableOpacity
                onPress={() => setShowAddForm(!showAddForm)}
                style={styles.toggleBtn}
              >
                <Text style={styles.toggleBtnText}>
                  {showAddForm
                    ? isBangla ? 'অ্যাকাউন্ট দেখুন' : 'View Accounts'
                    : isBangla ? '+ অনুদান চ্যানেল যোগ করুন' : '+ Register Account'}
                </Text>
              </TouchableOpacity>
            </View>

            {showAddForm ? (
              /* Add Account Form matching web */
              <View style={styles.formContainer}>
                {/* Channel Type */}
                <Text style={styles.formLabel}>
                  {isBangla ? 'চ্যানেল ধরন *' : 'Channel Type *'}
                </Text>
                <View style={styles.channelTypeGrid}>
                  {(['BKASH', 'NAGAD', 'ROCKET', 'BANK_TRANSFER'] as const).map((type) => {
                    const isSelected = methodType === type;
                    return (
                      <TouchableOpacity
                        key={type}
                        style={[styles.channelChip, isSelected && styles.channelChipActive]}
                        onPress={() => setMethodType(type)}
                      >
                        <Text style={[styles.channelChipText, isSelected && styles.channelChipTextActive]}>
                          {type === 'BANK_TRANSFER' ? 'Bank Transfer' : type}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {methodType !== 'BANK_TRANSFER' && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.formLabel}>
                      {isBangla ? 'অ্যাকাউন্ট ধরন *' : 'Account Type *'}
                    </Text>
                    <View style={styles.accountTypeRow}>
                      <TouchableOpacity
                        style={[styles.accountTypeChip, accountType === 'MERCHANT' && styles.accountTypeChipActive]}
                        onPress={() => setAccountType('MERCHANT')}
                      >
                        <Text style={[styles.accountTypeChipText, accountType === 'MERCHANT' && styles.accountTypeChipTextActive]}>
                          Merchant (Payment)
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.accountTypeChip, accountType === 'PERSONAL' && styles.accountTypeChipActive]}
                        onPress={() => setAccountType('PERSONAL')}
                      >
                        <Text style={[styles.accountTypeChipText, accountType === 'PERSONAL' && styles.accountTypeChipTextActive]}>
                          Personal (Send Money)
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Account Number */}
                <View style={styles.inputGroup}>
                  <Text style={styles.formLabel}>
                    {methodType === 'BANK_TRANSFER'
                      ? isBangla ? 'ব্যাংক হিসাব নম্বর *' : 'Account Number *'
                      : isBangla ? 'ওয়ালেট মোবাইল নম্বর *' : 'Wallet Number *'}
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                    placeholder={methodType === 'BANK_TRANSFER' ? '2050XXXXXXXXX' : '017XXXXXXXX'}
                    placeholderTextColor="#9ca3af"
                    keyboardType={methodType === 'BANK_TRANSFER' ? 'default' : 'phone-pad'}
                  />
                </View>

                {/* Account Title */}
                <View style={styles.inputGroup}>
                  <Text style={styles.formLabel}>
                    {isBangla ? 'অ্যাকাউন্টের নাম / সুবিধাভোগী *' : 'Official Account Title / Beneficiary *'}
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    value={accountTitle}
                    onChangeText={setAccountTitle}
                    placeholder={isBangla ? 'উদা: বায়তুল আমান জামে মসজিদ ফান্ড' : 'e.g. Baitul Aman Jame Masjid Fund'}
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                {/* Bank details if Bank Transfer */}
                {methodType === 'BANK_TRANSFER' && (
                  <View style={styles.bankFieldsRow}>
                    <View style={[styles.inputGroup, styles.flex1]}>
                      <Text style={styles.formLabel}>{isBangla ? 'ব্যাংকের নাম' : 'Bank Name'}</Text>
                      <TextInput
                        style={styles.textInput}
                        value={bankName}
                        onChangeText={setBankName}
                        placeholder="Islami Bank PLC"
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                    <View style={[styles.inputGroup, styles.flex1]}>
                      <Text style={styles.formLabel}>{isBangla ? 'শাখার নাম' : 'Branch Name'}</Text>
                      <TextInput
                        style={styles.textInput}
                        value={branchName}
                        onChangeText={setBranchName}
                        placeholder="Dhanmondi Branch"
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                  </View>
                )}

                {/* Instructions */}
                <View style={styles.inputGroup}>
                  <Text style={styles.formLabel}>
                    {isBangla ? 'পরিশোধের নির্দেশনা (ঐচ্ছিক)' : 'Payment Instructions (Optional)'}
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    value={instructions}
                    onChangeText={setInstructions}
                    placeholder={
                      isBangla
                        ? 'উদা: রেফারেন্সে লিখুন: DONATION বা কাউন্টার: ০১'
                        : 'e.g. Use reference: DONATION or Counter: 01'
                    }
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                {/* Form Buttons */}
                <View style={styles.formActionsRow}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setShowAddForm(false)}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.cancelBtnText}>{isBangla ? 'বাতিল' : 'Cancel'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <Text style={styles.submitBtnText}>
                        {isBangla ? 'চ্যানেল সংরক্ষণ করুন' : 'Register Channel'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* Verified Channels List matching web */
              <View style={styles.listContainer}>
                {isLoading ? (
                  <View style={styles.centerBox}>
                    <ActivityIndicator size="small" color="#059669" />
                    <Text style={styles.loadingText}>
                      {isBangla ? 'অনুদান অ্যাকাউন্ট লোড হচ্ছে...' : 'Loading donation accounts...'}
                    </Text>
                  </View>
                ) : methods.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyTitle}>
                      {isBangla ? 'কোনো যাচাইকৃত অ্যাকাউন্ট নেই' : 'No verified donation accounts'}
                    </Text>
                    <Text style={styles.emptyDesc}>
                      {isBangla
                        ? 'মসজিদ কমিটি বা ইমাম মহোদয় উপরে "+ অনুদান চ্যানেল যোগ করুন" বাটনে ক্লিক করে অ্যাকাউন্ট যোগ করতে পারেন।'
                        : 'Verified committee members or imams can register an account above.'}
                    </Text>
                  </View>
                ) : (
                  methods.map((method) => {
                    const isBank = method.methodType === 'BANK_TRANSFER';
                    const isCopied = copiedId === method.id;

                    return (
                      <View key={method.id} style={styles.methodCard}>
                        <View style={styles.cardTopRow}>
                          <View style={styles.brandRow}>
                            <View style={[styles.brandIconBox, isBank ? styles.bankIconBox : styles.mfsIconBox]}>
                              <Text style={styles.brandEmoji}>{isBank ? '🏛️' : '📱'}</Text>
                            </View>
                            <View>
                              <View style={styles.brandTitleRow}>
                                <Text style={styles.brandName}>
                                  {method.methodType.replace(/_/g, ' ')}
                                </Text>
                                <View style={styles.accountTypeBadge}>
                                  <Text style={styles.accountTypeBadgeText}>
                                    {method.accountType.replace(/_/g, ' ')}
                                  </Text>
                                </View>
                              </View>
                              {method.accountTitle ? (
                                <Text style={styles.accountTitleText}>{method.accountTitle}</Text>
                              ) : null}
                            </View>
                          </View>

                          <View style={styles.verifiedPill}>
                            <Text style={styles.verifiedText}>✓ Verified</Text>
                          </View>
                        </View>

                        {/* Number Box with Copy */}
                        <View style={styles.numberBox}>
                          <Text style={styles.monoNumber} selectable>
                            {method.accountNumber}
                          </Text>
                          <TouchableOpacity
                            style={[styles.copyBtn, isCopied && styles.copyBtnSuccess]}
                            onPress={() => handleCopy(method.accountNumber, method.id)}
                          >
                            <Text style={[styles.copyBtnText, isCopied && styles.copyBtnTextSuccess]}>
                              {isCopied ? 'Copied ✓' : 'Copy'}
                            </Text>
                          </TouchableOpacity>
                        </View>

                        {method.bankName ? (
                          <Text style={styles.bankDetailText}>
                            Bank: <Text style={styles.boldText}>{method.bankName}</Text>
                            {method.branchName ? ` (${method.branchName})` : ''}
                            {method.routingNumber ? ` | Routing: ${method.routingNumber}` : ''}
                          </Text>
                        ) : null}

                        {method.instructions ? (
                          <View style={styles.instructionBox}>
                            <Text style={styles.instructionText}>
                              Note: {method.instructions}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    );
                  })
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// Also export DonationModal as alias to match web name
export const DonationModal = SuggestDonationMethodModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    maxWidth: 580,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e8e8ea',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadgeText: {
    fontSize: 16,
  },
  headerTextCol: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111114',
  },
  subtitle: {
    fontSize: 11,
    color: '#6e6e73',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f4f4f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    color: '#6e6e73',
    fontWeight: '600',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  securityBanner: {
    flexDirection: 'row',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    gap: 10,
    alignItems: 'flex-start',
  },
  securityIcon: {
    fontSize: 16,
    marginTop: 1,
  },
  securityTextGroup: {
    flex: 1,
  },
  securityTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#14532d',
    marginBottom: 2,
  },
  securityDesc: {
    fontSize: 11,
    color: '#166534',
    lineHeight: 16,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    marginBottom: 14,
    gap: 8,
  },
  statusBoxSuccess: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  statusBoxError: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  statusIcon: {
    fontSize: 14,
  },
  statusText: {
    flex: 1,
    fontSize: 12,
  },
  statusTextSuccess: {
    color: '#065f46',
  },
  statusTextError: {
    color: '#991b1b',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#6e6e73',
  },
  toggleBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  formContainer: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e8e8ea',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  formLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#111114',
    marginBottom: 6,
  },
  channelTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  channelChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e8e8ea',
  },
  channelChipActive: {
    backgroundColor: '#111114',
    borderColor: '#111114',
  },
  channelChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#374151',
  },
  channelChipTextActive: {
    color: '#ffffff',
  },
  inputGroup: {
    marginBottom: 12,
  },
  accountTypeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  accountTypeChip: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e8e8ea',
  },
  accountTypeChipActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#059669',
  },
  accountTypeChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6e6e73',
  },
  accountTypeChipTextActive: {
    color: '#059669',
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e8e8ea',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 12.5,
    color: '#111114',
  },
  bankFieldsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  flex1: {
    flex: 1,
  },
  formActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
    paddingTop: 10,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e8e8ea',
    backgroundColor: '#ffffff',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6e6e73',
  },
  submitBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#111114',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  listContainer: {
    gap: 12,
  },
  centerBox: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: '#6e6e73',
    marginTop: 8,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e8e8ea',
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 11,
    color: '#6e6e73',
    textAlign: 'center',
    lineHeight: 16,
  },
  methodCard: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e8e8ea',
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  brandIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankIconBox: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  mfsIconBox: {
    backgroundColor: '#fdf2f8',
    borderWidth: 1,
    borderColor: '#fbcfe8',
  },
  brandEmoji: {
    fontSize: 15,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111114',
  },
  accountTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#f4f4f5',
  },
  accountTypeBadgeText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#71717a',
  },
  accountTitleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#065f46',
    marginTop: 2,
  },
  verifiedPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  numberBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e8e8ea',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  monoNumber: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 13,
    fontWeight: '700',
    color: '#111114',
    letterSpacing: 0.8,
  },
  copyBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#f4f4f5',
  },
  copyBtnSuccess: {
    backgroundColor: '#ecfdf5',
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111114',
  },
  copyBtnTextSuccess: {
    color: '#059669',
  },
  bankDetailText: {
    fontSize: 10.5,
    color: '#6e6e73',
  },
  boldText: {
    fontWeight: '700',
    color: '#1f2937',
  },
  instructionBox: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f4f4f5',
    borderRadius: 8,
    padding: 8,
  },
  instructionText: {
    fontSize: 10.5,
    color: '#6e6e73',
  },
});
