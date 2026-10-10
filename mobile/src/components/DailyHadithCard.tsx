import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Share,
} from 'react-native';
import { HadithService } from '../services/hadithService';
import { PreferencesStorage } from '../lib/storage';
import { Language } from '../services/localizationService';
import { ferioColors, ferioRadius, ferioSpacing } from '../theme/tokens';

interface DailyHadithCardProps {
  language?: Language;
}

export const DailyHadithCard: React.FC<DailyHadithCardProps> = ({
  language = 'bn',
}) => {
  const [isCollapsed, setIsCollapsed] = useState(() =>
    PreferencesStorage.isHadithCardCollapsed()
  );

  const hadith = HadithService.getDailyHadith();

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      PreferencesStorage.setHadithCardCollapsed(next);
      return next;
    });
  };

  const handleShare = async () => {
    const textContent =
      language === 'bn'
        ? `📖 আজকের হাদিস (${hadith.topicBn})\n\n"${hadith.banglaText}"\n\n— ${hadith.narratorBn}\n📚 সূত্র: ${hadith.sourceBook} (${hadith.hadithNumber})\n\nশেয়ারকৃত: বিডি মসজিদ অ্যাপ`
        : `📖 Daily Hadith (${hadith.topicEn})\n\n"${hadith.englishText}"\n\n— ${hadith.narratorEn}\n📚 Reference: ${hadith.sourceBook} (${hadith.hadithNumber})\n\nShared via BD Masjid`;

    try {
      await Share.share({
        title: language === 'bn' ? 'আজকের হাদিস' : 'Daily Hadith',
        message: textContent,
      });
    } catch {
      // User cancelled share
    }
  };

  if (isCollapsed) {
    return (
      <Pressable
        style={styles.collapsedCard}
        onPress={toggleCollapse}
        accessibilityRole="button"
        accessibilityLabel="Expand daily Hadith card"
      >
        <Text style={styles.collapsedIcon}>📖</Text>
        <Text style={styles.collapsedTitle} numberOfLines={1}>
          {language === 'bn' ? 'আজকের হাদিস' : 'Daily Hadith'}:{' '}
          {language === 'bn' ? hadith.topicBn : hadith.topicEn}
        </Text>
        <Text style={styles.collapsedArrow}>▼</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.card}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerIcon}>📖</Text>
          <View>
            <Text style={styles.headerTitle}>
              {language === 'bn' ? 'আজকের হাদিস' : 'Daily Hadith'}
            </Text>
            <View style={styles.topicBadge}>
              <Text style={styles.topicBadgeText}>
                {language === 'bn' ? hadith.topicBn : hadith.topicEn}
              </Text>
            </View>
          </View>
        </View>

        <Pressable
          style={styles.collapseBtn}
          onPress={toggleCollapse}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Collapse daily Hadith card"
        >
          <Text style={styles.collapseBtnText}>▲</Text>
        </Pressable>
      </View>

      {/* Arabic Script */}
      <View style={styles.arabicBox}>
        <Text style={styles.arabicText}>{hadith.arabicText}</Text>
      </View>

      {/* Translation */}
      <Text style={styles.translationText}>
        "{language === 'bn' ? hadith.banglaText : hadith.englishText}"
      </Text>

      {/* Narrator */}
      <Text style={styles.narratorText}>
        — {language === 'bn' ? hadith.narratorBn : hadith.narratorEn}
      </Text>

      {/* Footer: Citation and Share Button */}
      <View style={styles.footer}>
        <View style={styles.sourcePill}>
          <Text style={styles.sourceText}>
            📚 {hadith.sourceBook} {hadith.hadithNumber}
          </Text>
        </View>

        <Pressable
          style={styles.shareBtn}
          onPress={handleShare}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Share this Hadith"
        >
          <Text style={styles.shareBtnText}>
            🔗 {language === 'bn' ? 'শেয়ার' : 'Share'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: ferioColors.surface,
    borderWidth: 1,
    borderColor: ferioColors.border,
    borderRadius: ferioRadius.lg,
    padding: ferioSpacing.md,
    marginHorizontal: ferioSpacing.lg,
    marginBottom: ferioSpacing.md,
  },
  collapsedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ferioColors.surface,
    borderWidth: 1,
    borderColor: ferioColors.border,
    borderRadius: ferioRadius.full,
    paddingHorizontal: ferioSpacing.md,
    paddingVertical: ferioSpacing.sm,
    marginHorizontal: ferioSpacing.lg,
    marginBottom: ferioSpacing.md,
  },
  collapsedIcon: {
    fontSize: 14,
    marginRight: ferioSpacing.xs,
  },
  collapsedTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: ferioColors.primary,
    flex: 1,
  },
  collapsedArrow: {
    fontSize: 10,
    color: ferioColors.muted,
    marginLeft: ferioSpacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ferioSpacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 20,
    marginRight: ferioSpacing.sm,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: ferioColors.primary,
  },
  topicBadge: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: ferioSpacing.xs + 2,
    paddingVertical: 1,
    borderRadius: ferioRadius.sm,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  topicBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  collapseBtn: {
    padding: ferioSpacing.xs,
  },
  collapseBtnText: {
    fontSize: 12,
    color: ferioColors.muted,
  },
  arabicBox: {
    backgroundColor: ferioColors.canvas,
    borderRadius: ferioRadius.md,
    padding: ferioSpacing.sm + 2,
    marginBottom: ferioSpacing.sm,
    borderWidth: 1,
    borderColor: '#f0f0f2',
  },
  arabicText: {
    fontSize: 15,
    lineHeight: 24,
    color: ferioColors.primary,
    textAlign: 'right',
    fontWeight: '500',
  },
  translationText: {
    fontSize: 13,
    lineHeight: 19,
    color: ferioColors.primary,
    marginBottom: 4,
  },
  narratorText: {
    fontSize: 11,
    color: ferioColors.muted,
    fontStyle: 'italic',
    marginBottom: ferioSpacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: ferioColors.border,
    paddingTop: ferioSpacing.xs + 2,
  },
  sourcePill: {
    backgroundColor: ferioColors.canvas,
    paddingHorizontal: ferioSpacing.sm,
    paddingVertical: 2,
    borderRadius: ferioRadius.full,
    borderWidth: 1,
    borderColor: ferioColors.border,
  },
  sourceText: {
    fontSize: 10,
    fontWeight: '600',
    color: ferioColors.muted,
  },
  shareBtn: {
    paddingHorizontal: ferioSpacing.sm,
    paddingVertical: 2,
  },
  shareBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
});
