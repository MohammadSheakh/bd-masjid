import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import {
  CollectionService,
  MosqueCollectionTag,
  COLLECTION_TAGS,
} from '../services/collectionService';

export type CollectionFilterSelection = MosqueCollectionTag | 'ALL';

interface CollectionFilterBarProps {
  activeTag: CollectionFilterSelection;
  tagCounts: Record<CollectionFilterSelection, number>;
  language?: 'bn' | 'en';
  onSelectTag: (tag: CollectionFilterSelection) => void;
}

export const CollectionFilterBar: React.FC<CollectionFilterBarProps> = ({
  activeTag,
  tagCounts,
  language = 'en',
  onSelectTag,
}) => {
  const isBn = language === 'bn';

  const items: { id: CollectionFilterSelection; icon: string; label: string }[] = [
    {
      id: 'ALL',
      icon: '🕌',
      label: isBn ? 'সকল মসজিদ' : 'All Mosques',
    },
    ...COLLECTION_TAGS.map((t) => ({
      id: t.id as CollectionFilterSelection,
      icon: t.icon,
      label: isBn ? t.labelBn : t.labelEn,
    })),
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items.map((item) => {
          const isSelected = activeTag === item.id;
          const count = tagCounts[item.id] ?? 0;

          return (
            <Pressable
              key={item.id}
              onPress={() => onSelectTag(item.id)}
              style={[styles.pill, isSelected && styles.pillActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${item.label}, ${count} mosques`}
            >
              <Text style={styles.pillIcon}>{item.icon}</Text>
              <Text style={[styles.pillLabel, isSelected && styles.pillLabelActive]}>
                {item.label}
              </Text>
              <View style={[styles.countBadge, isSelected && styles.countBadgeActive]}>
                <Text style={[styles.countText, isSelected && styles.countTextActive]}>
                  {count}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e8e8ea',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#059669',
  },
  pillIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  pillLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4b5563',
  },
  pillLabelActive: {
    color: '#059669',
  },
  countBadge: {
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 6,
  },
  countBadgeActive: {
    backgroundColor: '#d1fae5',
  },
  countText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6b7280',
  },
  countTextActive: {
    color: '#059669',
  },
});
