import React, { useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  Pressable,
} from 'react-native';
import {
  CollectionService,
  MosqueCollectionTag,
  COLLECTION_TAGS,
} from '../services/collectionService';
import { CollectionStorage } from '../lib/storage';

interface CollectionTagModalProps {
  visible: boolean;
  mosqueId: string;
  mosqueName: string;
  language?: 'bn' | 'en';
  onClose: () => void;
  onTagsUpdated?: (tags: MosqueCollectionTag[]) => void;
}

export const CollectionTagModal: React.FC<CollectionTagModalProps> = ({
  visible,
  mosqueId,
  mosqueName,
  language = 'en',
  onClose,
  onTagsUpdated,
}) => {
  const isBn = language === 'bn';
  const [selectedTags, setSelectedTags] = useState<MosqueCollectionTag[]>([]);

  useEffect(() => {
    if (visible && mosqueId) {
      setSelectedTags(CollectionStorage.getMosqueTags(mosqueId));
    }
  }, [visible, mosqueId]);

  const handleToggleTag = (tag: MosqueCollectionTag) => {
    const updated = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];

    setSelectedTags(updated);
    CollectionStorage.setMosqueTags(mosqueId, updated);
    onTagsUpdated?.(updated);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>
                {isBn ? 'মসজিদ শ্রেণীবদ্ধ করুন' : 'Categorize Mosque'}
              </Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {mosqueName}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close modal">
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* Description */}
          <Text style={styles.instructions}>
            {isBn
              ? 'আপনার দৈনিক রুটিনের সাথে মিলিয়ে মসজিদটি সংরক্ষণ করুন:'
              : 'Tag this mosque to match your daily prayer routine:'}
          </Text>

          {/* Tag Rows */}
          <View style={styles.tagsList}>
            {COLLECTION_TAGS.map((tagItem) => {
              const isSelected = selectedTags.includes(tagItem.id);
              return (
                <Pressable
                  key={tagItem.id}
                  onPress={() => handleToggleTag(tagItem.id)}
                  style={[styles.tagRow, isSelected && styles.tagRowSelected]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                >
                  <View style={styles.tagIconBox}>
                    <Text style={styles.tagIcon}>{tagItem.icon}</Text>
                  </View>
                  <View style={styles.tagInfo}>
                    <Text style={[styles.tagTitle, isSelected && styles.tagTitleSelected]}>
                      {isBn ? tagItem.labelBn : tagItem.labelEn}
                    </Text>
                    <Text style={styles.tagDescription}>
                      {isBn ? tagItem.descriptionBn : tagItem.descriptionEn}
                    </Text>
                  </View>
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    <Text style={[styles.checkboxCheck, isSelected && styles.checkboxCheckSelected]}>
                      {isSelected ? '✓' : ''}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Done Button */}
          <Pressable
            onPress={onClose}
            style={styles.doneBtn}
            accessibilityRole="button"
            accessibilityLabel="Done"
          >
            <Text style={styles.doneBtnText}>
              {isBn ? 'সম্পন্ন করুন' : 'Done'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111114',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6e6e73',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    color: '#6e6e73',
    fontWeight: '600',
  },
  instructions: {
    fontSize: 12,
    color: '#6e6e73',
    marginVertical: 12,
  },
  tagsList: {
    gap: 10,
    marginBottom: 20,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e8e8ea',
    borderRadius: 12,
    padding: 12,
  },
  tagRowSelected: {
    backgroundColor: '#ecfdf5',
    borderColor: '#059669',
  },
  tagIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e8e8ea',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tagIcon: {
    fontSize: 18,
  },
  tagInfo: {
    flex: 1,
    marginRight: 8,
  },
  tagTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111114',
  },
  tagTitleSelected: {
    color: '#059669',
  },
  tagDescription: {
    fontSize: 11,
    color: '#6e6e73',
    marginTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  checkboxCheck: {
    fontSize: 12,
    color: 'transparent',
  },
  checkboxCheckSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  doneBtn: {
    backgroundColor: '#111114',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
