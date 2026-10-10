import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MosqueDonationMethod } from '../types/mosque';
import { DonationService } from '../services/donationService';

interface DonationChannelsCardProps {
  donationMethods: MosqueDonationMethod[];
  language?: 'bn' | 'en';
  onPressSuggest?: () => void;
}

export const DonationChannelsCard: React.FC<DonationChannelsCardProps> = ({
  donationMethods,
  language = 'en',
  onPressSuggest,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const isBn = language === 'bn';

  if (!donationMethods || donationMethods.length === 0) {
    if (!onPressSuggest) return null;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>
              {isBn ? 'অনুদান চ্যানেল' : 'Mosque Donations'}
            </Text>
            <Text style={styles.cardHeaderSub}>
              {isBn ? 'কোনো চ্যানেল যুক্ত নেই' : 'No verified channels listed yet'}
            </Text>
          </View>
        </View>
        <Pressable
          style={styles.addChannelBtn}
          onPress={onPressSuggest}
          accessibilityRole="button"
          accessibilityLabel="Add Donation Channel"
        >
          <Text style={styles.addChannelBtnText}>
            {isBn ? '+ অনুদান মাধ্যম যোগ করুন →' : '+ Add Donation Channel →'}
          </Text>
        </Pressable>
      </View>
    );
  }

  const handleCopy = (id: string) => {
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardTitle}>
            {isBn ? 'যাচাইকৃত অনুদান চ্যানেল' : 'Verified Donation Channels'}
          </Text>
          <Text style={styles.cardHeaderSub}>
            {isBn ? 'কমিটি অনুমোদিত সরাসরি তহবিল' : 'Official multi-signatory accounts'}
          </Text>
        </View>
        <View style={styles.consensusPill}>
          <Text style={styles.consensusPillText}>
            ✓ {isBn ? 'বহু-স্বাক্ষরিত' : 'Consensus Verified'}
          </Text>
        </View>
      </View>

      {/* Donation Items */}
      {donationMethods.map((method) => {
        const brand = DonationService.getBrandConfig(method.methodType);
        const isPersonal = DonationService.isPersonalAccount(method.accountType);
        const attestationMatrix = DonationService.getAttestationMatrix(method.verifiedByRoles);
        const isCopied = copiedId === method.id;

        return (
          <View key={method.id} style={styles.itemBox}>
            {/* Top Bar: Brand Badge & Account Type */}
            <View style={styles.itemTopBar}>
              <View
                style={[
                  styles.brandBadge,
                  { backgroundColor: brand.badgeBg, borderColor: brand.badgeBorder },
                ]}
              >
                <Text style={[styles.brandBadgeText, { color: brand.brandColor }]}>
                  {brand.icon} {brand.name}
                </Text>
              </View>

              <View
                style={[
                  styles.accountTypePill,
                  isPersonal ? styles.accountTypeWarning : styles.accountTypeVerified,
                ]}
              >
                <Text
                  style={[
                    styles.accountTypePillText,
                    isPersonal ? styles.accountTypeWarningText : styles.accountTypeVerifiedText,
                  ]}
                >
                  {DonationService.getAccountTypeLabel(method.accountType, language)}
                </Text>
              </View>
            </View>

            {/* Account Number & Copy Trigger */}
            <View style={styles.numberRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.accountNumber}>{method.accountNumber}</Text>
                {method.accountTitle ? (
                  <Text style={styles.accountTitle}>{method.accountTitle}</Text>
                ) : null}
              </View>

              <Pressable
                onPress={() => handleCopy(method.id)}
                style={[styles.copyBtn, isCopied && styles.copyBtnActive]}
                accessibilityRole="button"
                accessibilityLabel={`Copy ${brand.name} account number`}
              >
                <Text style={[styles.copyBtnText, isCopied && styles.copyBtnTextActive]}>
                  {isCopied ? (isBn ? '✓ কপি হয়েছে' : '✓ Copied!') : (isBn ? 'কপি' : 'Copy')}
                </Text>
              </Pressable>
            </View>

            {/* Bank Specific Details */}
            {method.bankName ? (
              <View style={styles.bankDetailsBox}>
                <Text style={styles.bankNameText}>🏛️ {method.bankName}</Text>
                {method.branchName ? (
                  <Text style={styles.bankSubText}>
                    {isBn ? 'শাখা: ' : 'Branch: '}{method.branchName}
                    {method.routingNumber ? ` • Routing: ${method.routingNumber}` : ''}
                  </Text>
                ) : null}
              </View>
            ) : null}

            {/* USSD Helper Prompt */}
            {brand.ussdCode && !isPersonal ? (
              <Text style={styles.ussdHint}>
                💡 {isBn ? `অ্যাপ অথবা ডায়াল করুন ${brand.ussdCode} > পেমেন্ট` : `App or dial ${brand.ussdCode} > Merchant Payment`}
              </Text>
            ) : null}

            {/* Anti-Fraud Personal Warning Banner (ADR-028, ADR-051) */}
            {isPersonal && (
              <View style={styles.warningBanner}>
                <Text style={styles.warningBannerText}>
                  ⚠️ {isBn
                    ? 'ব্যক্তিগত নম্বর: বড় অংকের অনুদান পাঠানোর আগে কমিটির সাথে যাচাই করুন।'
                    : 'Personal number: verify with mosque committee before large transfers.'}
                </Text>
              </View>
            )}

            {/* Multi-Signatory Consensus Attestation Row */}
            <View style={styles.attestationRow}>
              <Text style={styles.attestationTitle}>
                {isBn ? 'অনুমোদন:' : 'Consensus:'}
              </Text>
              <View style={styles.attestationPillsWrap}>
                {attestationMatrix.map((item) => (
                  <View
                    key={item.roleKey}
                    style={[
                      styles.attestPill,
                      item.isAttested ? styles.attestPillActive : styles.attestPillPending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.attestPillText,
                        item.isAttested ? styles.attestPillActiveText : styles.attestPillPendingText,
                      ]}
                    >
                      {item.isAttested ? '✓ ' : '○ '}
                      {isBn ? item.labelBn : item.labelEn}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Creator Provenance */}
            {method.creatorName ? (
              <Text style={styles.provenanceNote}>
                {isBn ? 'তহবিল প্রকাশকারী: ' : 'Published by '}{method.creatorName} ({method.creatorRole})
              </Text>
            ) : null}
          </View>
        );
      })}

      {onPressSuggest && (
        <Pressable
          style={styles.addChannelBtn}
          onPress={onPressSuggest}
          accessibilityRole="button"
          accessibilityLabel="Add Donation Channel"
        >
          <Text style={styles.addChannelBtnText}>
            {isBn ? '+ নতুন অনুদান মাধ্যম যোগ করুন →' : '+ Add / Suggest Donation Channel →'}
          </Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e8e8ea',
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111114',
  },
  cardHeaderSub: {
    fontSize: 11,
    color: '#6e6e73',
    marginTop: 1,
  },
  consensusPill: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  consensusPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  itemBox: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e8e8ea',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  itemTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  brandBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  brandBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  accountTypePill: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  accountTypePillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  accountTypeVerified: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  accountTypeVerifiedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#166534',
  },
  accountTypeWarning: {
    backgroundColor: '#fef3c7',
    borderColor: '#fde68a',
  },
  accountTypeWarningText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400e',
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  accountNumber: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111114',
    letterSpacing: 0.5,
  },
  accountTitle: {
    fontSize: 12,
    color: '#4b5563',
    marginTop: 2,
  },
  copyBtn: {
    backgroundColor: '#111114',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  copyBtnActive: {
    backgroundColor: '#059669',
  },
  copyBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  copyBtnTextActive: {
    color: '#ffffff',
  },
  bankDetailsBox: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    padding: 8,
    marginTop: 6,
  },
  bankNameText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111114',
  },
  bankSubText: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  ussdHint: {
    fontSize: 11,
    color: '#4b5563',
    marginTop: 6,
  },
  warningBanner: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
  },
  warningBannerText: {
    fontSize: 11,
    color: '#b45309',
    lineHeight: 15,
  },
  attestationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  attestationTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  attestationPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  attestPill: {
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  attestPillActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  attestPillText: {
    fontSize: 10,
  },
  attestPillActiveText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#059669',
  },
  attestPillPending: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
  },
  attestPillPendingText: {
    fontSize: 10,
    color: '#9ca3af',
  },
  provenanceNote: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 6,
    fontStyle: 'italic',
  },
  addChannelBtn: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e8e8ea',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  addChannelBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
});
