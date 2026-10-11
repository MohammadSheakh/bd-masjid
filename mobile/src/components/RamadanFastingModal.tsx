import React, { useEffect, useState } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { BangladeshiDivision, FastingCountdownState, FastingDua } from '../types/ramadan';
import { RamadanService } from '../services/ramadanService';

interface RamadanFastingModalProps {
  visible: boolean;
  onClose: () => void;
  isBangla?: boolean;
}

export const RamadanFastingModal: React.FC<RamadanFastingModalProps> = ({
  visible,
  onClose,
  isBangla = true,
}) => {
  const [state, setState] = useState<FastingCountdownState>(() =>
    RamadanService.getFastingCountdownStateSync()
  );
  const [activeDuaTab, setActiveDuaTab] = useState<'SEHRI_NIYYAT' | 'IFTAR_DUA'>('SEHRI_NIYYAT');
  const divisions = RamadanService.getAllDivisions();
  const duas = RamadanService.getDuas();
  const schedule = RamadanService.getFullScheduleSync();

  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setState(RamadanService.getFastingCountdownStateSync());
    }, 1000);
    return () => clearInterval(interval);
  }, [visible]);

  const handleSelectDivision = (div: BangladeshiDivision) => {
    RamadanService.setSelectedDivision(div);
    setState(RamadanService.getFastingCountdownStateSync());
  };

  const selectedDua = duas.find((d) => d.id === activeDuaTab) || duas[0];

  const pad = (n: number) => n.toString().padStart(2, '0');
  const timerDisplay = `${pad(state.hoursLeft)}:${pad(state.minutesLeft)}:${pad(state.secondsLeft)}`;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <View style={styles.titleRow}>
                <Text style={styles.titleIcon}>🌙</Text>
                <Text style={styles.title}>
                  {isBangla ? 'রমজান ও রোজা ক্যালেন্ডার' : 'Ramadan & Fasting Hub'}
                </Text>
              </View>
              <Text style={styles.subtitle}>
                {isBangla
                  ? 'ইসলামিক ফাউন্ডেশন বাংলাদেশ আঞ্চলিক সময়সূচি'
                  : 'Islamic Foundation Bangladesh Regional Offsets'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Division Selector */}
            <Text style={styles.sectionLabel}>
              {isBangla ? 'বিভাগ নির্বাচন করুন' : 'Select Division'}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.divisionRow}>
              {divisions.map((d) => {
                const isSelected = d.division === state.selectedDivision;
                const offsetText = d.iftarOffsetMinutes === 0
                  ? ''
                  : ` (${d.iftarOffsetMinutes > 0 ? '+' : ''}${d.iftarOffsetMinutes}m)`;
                return (
                  <TouchableOpacity
                    key={d.division}
                    style={[styles.divPill, isSelected && styles.divPillActive]}
                    onPress={() => handleSelectDivision(d.division)}
                  >
                    <Text style={[styles.divPillText, isSelected && styles.divPillTextActive]}>
                      {isBangla ? d.nameBangla : d.nameEnglish}
                      {offsetText}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Countdown Hero Card */}
            <View style={styles.heroCard}>
              <View style={styles.heroHeader}>
                <View style={styles.targetBadge}>
                  <Text style={styles.targetBadgeText}>
                    {state.target === 'IFTAR'
                      ? isBangla ? 'ইফতারের বাকি' : 'Time Left for Iftar'
                      : isBangla ? 'সেহরির শেষ সময় বাকি' : 'Time Left for Sehri End'}
                  </Text>
                </View>
                <Text style={styles.targetTimeText}>
                  {state.target === 'IFTAR' ? 'সন্ধ্যা ' : 'ভোর '}
                  {state.targetTime}
                </Text>
              </View>
              <Text style={styles.countdownClock}>{timerDisplay}</Text>
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${state.progressPercent}%` }]} />
              </View>
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>
                  {state.isFastingActive
                    ? isBangla ? 'রোজা চলমান' : 'Fasting Active'
                    : isBangla ? 'সেহরি সমাপ্তির অপেক্ষা' : 'Awaiting Sehri End'}
                </Text>
                <Text style={styles.progressPercentText}>{state.progressPercent}%</Text>
              </View>
            </View>

            {/* Dua Tabs */}
            <View style={styles.duaHeaderRow}>
              <Text style={styles.sectionLabel}>
                {isBangla ? 'দোয়া ও নিয়ত' : 'Supplications & Niyyat'}
              </Text>
              <View style={styles.duaTabs}>
                <TouchableOpacity
                  style={[styles.duaTabBtn, activeDuaTab === 'SEHRI_NIYYAT' && styles.duaTabActive]}
                  onPress={() => setActiveDuaTab('SEHRI_NIYYAT')}
                >
                  <Text style={[styles.duaTabText, activeDuaTab === 'SEHRI_NIYYAT' && styles.duaTabTextActive]}>
                    {isBangla ? 'সেহরির নিয়ত' : 'Sehri Niyyat'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.duaTabBtn, activeDuaTab === 'IFTAR_DUA' && styles.duaTabActive]}
                  onPress={() => setActiveDuaTab('IFTAR_DUA')}
                >
                  <Text style={[styles.duaTabText, activeDuaTab === 'IFTAR_DUA' && styles.duaTabTextActive]}>
                    {isBangla ? 'ইফতারের দোয়া' : 'Iftar Dua'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Dua Card */}
            <View style={styles.duaCard}>
              <Text style={styles.duaArabic}>{selectedDua.arabic}</Text>
              <Text style={styles.duaTransliteration}>{selectedDua.transliterationBangla}</Text>
              <Text style={styles.duaTranslation}>
                {isBangla ? selectedDua.translationBangla : selectedDua.translationEnglish}
              </Text>
            </View>

            {/* 10-Day Timetable */}
            <Text style={styles.sectionLabel}>
              {isBangla ? 'রমজান সময়সূচি' : 'Ramadan Schedule'} ({isBangla ? RamadanService.getDivisionOffsetSync().nameBangla : RamadanService.getDivisionOffsetSync().nameEnglish})
            </Text>
            <View style={styles.tableContainer}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableHead, { flex: 1.2 }]}>{isBangla ? 'দিন' : 'Day'}</Text>
                <Text style={[styles.tableHead, { flex: 1.2 }]}>{isBangla ? 'সেহরি শেষ' : 'Sehri End'}</Text>
                <Text style={[styles.tableHead, { flex: 1.2 }]}>{isBangla ? 'ইফতার' : 'Iftar'}</Text>
              </View>
              {schedule.map((day) => (
                <View key={day.dayNumber} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 1.2, fontWeight: '600' }]}>{day.hijriDate}</Text>
                  <Text style={[styles.tableCell, { flex: 1.2, color: '#059669' }]}>{day.sehriEndTime}</Text>
                  <Text style={[styles.tableCell, { flex: 1.2, color: '#d97706', fontWeight: '700' }]}>{day.iftarTime}</Text>
                </View>
              ))}
            </View>
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
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111114',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  divisionRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  divPill: {
    backgroundColor: '#f4f4f5',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e8e8ea',
  },
  divPillActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  divPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111114',
  },
  divPillTextActive: {
    color: '#ffffff',
  },
  heroCard: {
    backgroundColor: '#111114',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  targetBadge: {
    backgroundColor: 'rgba(217, 119, 6, 0.25)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  targetBadgeText: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '700',
  },
  targetTimeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  countdownClock: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 1,
    marginVertical: 10,
    fontVariant: ['tabular-nums'],
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressLabel: {
    color: '#9ca3af',
    fontSize: 11,
  },
  progressPercentText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700',
  },
  duaHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  duaTabs: {
    flexDirection: 'row',
    backgroundColor: '#f4f4f5',
    borderRadius: 8,
    padding: 2,
  },
  duaTabBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  duaTabActive: {
    backgroundColor: '#ffffff',
  },
  duaTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6e6e73',
  },
  duaTabTextActive: {
    color: '#111114',
    fontWeight: '700',
  },
  duaCard: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e8e8ea',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  duaArabic: {
    fontSize: 17,
    lineHeight: 28,
    textAlign: 'right',
    color: '#111114',
    fontWeight: '600',
    marginBottom: 8,
  },
  duaTransliteration: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    marginBottom: 6,
    lineHeight: 18,
  },
  duaTranslation: {
    fontSize: 12,
    color: '#3f3f46',
    lineHeight: 18,
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: '#e8e8ea',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f4f4f5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8ea',
  },
  tableHead: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6e6e73',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f4f4f5',
    backgroundColor: '#ffffff',
  },
  tableCell: {
    fontSize: 12,
    color: '#111114',
  },
});
