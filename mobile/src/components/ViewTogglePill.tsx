import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { ferioColors, ferioRadius, ferioSpacing } from '../theme/tokens';

export type ViewportMode = 'list' | 'map';

interface ViewTogglePillProps {
  mode: ViewportMode;
  count?: number;
  onToggle: (mode: ViewportMode) => void;
}

export const ViewTogglePill: React.FC<ViewTogglePillProps> = ({
  mode,
  count = 0,
  onToggle,
}) => {
  return (
    <View style={styles.floatingContainer} pointerEvents="box-none">
      <View style={styles.pillCard}>
        <Pressable
          onPress={() => onToggle('list')}
          style={[styles.segmentBtn, mode === 'list' && styles.segmentBtnActive]}
          accessibilityRole="button"
          accessibilityLabel="Switch to Mosque List View"
        >
          <Text style={[styles.segmentText, mode === 'list' && styles.segmentTextActive]}>
            List {count > 0 ? `(${count})` : ''}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onToggle('map')}
          style={[styles.segmentBtn, mode === 'map' && styles.segmentBtnActive]}
          accessibilityRole="button"
          accessibilityLabel="Switch to Map View"
        >
          <Text style={[styles.segmentText, mode === 'map' && styles.segmentTextActive]}>
            Map
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    bottom: ferioSpacing.xl,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  pillCard: {
    flexDirection: 'row',
    backgroundColor: ferioColors.primary,
    borderRadius: ferioRadius.full,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  segmentBtn: {
    paddingHorizontal: ferioSpacing.lg,
    paddingVertical: ferioSpacing.xs + 2,
    borderRadius: ferioRadius.full,
  },
  segmentBtnActive: {
    backgroundColor: ferioColors.surface,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.75)',
  },
  segmentTextActive: {
    color: ferioColors.primary,
  },
});
