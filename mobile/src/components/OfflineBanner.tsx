import React from 'react';
import { StyleSheet, Text, View, Pressable, ActivityIndicator } from 'react-native';
import { ferioRadius, ferioSpacing } from '../theme/tokens';

interface OfflineBannerProps {
  visible: boolean;
  onRetry: () => void;
  isRetrying?: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  visible,
  onRetry,
  isRetrying = false,
}) => {
  if (!visible) return null;

  return (
    <View style={styles.banner}>
      <View style={styles.leftContent}>
        <View style={styles.indicatorDot} />
        <Text style={styles.messageText}>
          Offline — displaying cached schedules
        </Text>
      </View>

      <Pressable
        onPress={onRetry}
        disabled={isRetrying}
        style={({ pressed }) => [styles.retryPill, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Retry network connection"
      >
        {isRetrying ? (
          <ActivityIndicator size="small" color="#92400e" />
        ) : (
          <Text style={styles.retryText}>↻ Retry</Text>
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fffbeb',
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
    paddingHorizontal: ferioSpacing.lg,
    paddingVertical: ferioSpacing.xs + 2,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: ferioSpacing.sm,
  },
  indicatorDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#d97706',
    marginRight: ferioSpacing.xs + 2,
  },
  messageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
  },
  retryPill: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: ferioSpacing.sm,
    paddingVertical: 3,
    borderRadius: ferioRadius.full,
    borderWidth: 1,
    borderColor: '#fde68a',
    minWidth: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400e',
  },
  pressed: {
    opacity: 0.7,
  },
});
