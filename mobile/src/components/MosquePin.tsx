import React from 'react';
import { StyleSheet, View, Pressable, Text } from 'react-native';
import { Mosque } from '../types/mosque';
import { ferioColors, ferioRadius } from '../theme/tokens';

interface MosquePinProps {
  mosque: Mosque;
  isFollowed?: boolean;
  isSelected?: boolean;
  onPress: (mosque: Mosque) => void;
}

export const MosquePin: React.FC<MosquePinProps> = ({
  mosque,
  isFollowed = false,
  isSelected = false,
  onPress,
}) => {
  return (
    <Pressable
      onPress={() => onPress(mosque)}
      style={({ pressed }) => [
        styles.touchTarget,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Mosque marker for ${mosque.name}`}
    >
      <View
        style={[
          styles.pinBase,
          isFollowed ? styles.pinFollowed : styles.pinStandard,
          isSelected && styles.pinSelected,
        ]}
      >
        <Text style={styles.pinSymbol}>{isFollowed ? '★' : '•'}</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  touchTarget: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinBase: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  pinStandard: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: ferioColors.primary,
  },
  pinFollowed: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ferioColors.accent,
  },
  pinSelected: {
    borderColor: ferioColors.accent,
    borderWidth: 2.5,
    transform: [{ scale: 1.15 }],
  },
  pinSymbol: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 12,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
});
