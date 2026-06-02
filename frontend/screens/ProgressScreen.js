// ProgressScreen.js
// Converted from MyFitnessApp TypeScript to plain JavaScript
// Contains Overview, Exercises, and Body Stats tabs in one screen

import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { BASE_URL } from '../config';
import { fetchWithTimeout, parseJsonSafe } from '../services/http';
import { getUserEmail } from '../utils/session';
import { authFetch } from '../utils/authFetch';
import { progressStyles as styles } from './progressStyles';
import { bodyStatsStyles } from './bodyStatsStyles';
import { overviewStyles } from './overviewStyles';

const API = BASE_URL;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── ActionButton helper (web uses <button>, native uses TouchableOpacity) ──
const ActionButton = ({ onPress, children, style }) => {
  if (Platform.OS === 'web') {
    const cssStyle = {
      background: 'none',
      border: 'none',
      padding: 0,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    };
    if (style) {
      if (style.backgroundColor) cssStyle.backgroundColor = style.backgroundColor;
      if (style.borderRadius) cssStyle.borderRadius = style.borderRadius;
      if (style.width) cssStyle.width = style.width;
      if (style.height) cssStyle.height = style.height;
      if (style.flexDirection) cssStyle.flexDirection = style.flexDirection;
      if (style.gap) cssStyle.gap = style.gap;
      if (style.paddingHorizontal) cssStyle.paddingLeft = cssStyle.paddingRight = style.paddingHorizontal;
      if (style.paddingVertical) cssStyle.paddingTop = cssStyle.paddingBottom = style.paddingVertical;
    }
    return (<button onClick={onPress} style={cssStyle}>{children}</button>);
  }
  return (<TouchableOpacity onPress={onPress} style={style}>{children}</TouchableOpacity>);
};

// ════════════════════════════════════════════════════════════════════
// OVERVIEW TAB COMPONENT
// ════════════════════════════════════════════════════════════════════
const OverviewTab = ({ exercises, bodyStats, refreshCounter, loading, error, onRetry }) => {
  const [daysLoggedThisMonth, setDaysLoggedThisMonth] = useState(0);
  const [daysInCurrentMonth, setDaysInCurrentMonth] = useState(30);

  useEffect(() => {
    const now = new Date();
    const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    setDaysInCurrentMonth(totalDays);

    // Count unique days logged this calendar month
    const currentMonth = now.getMonth() + 1;
    const uniqueDays = new Set();
    bodyStats.forEach(entry => {
      if (typeof entry.date === 'string' && entry.date.length === 5) {
        const month = parseInt(entry.date.substring(0, 2), 10);
        if (month === currentMonth) uniqueDays.add(entry.date);
      } else {
        const d = new Date(entry.date);
        if (!isNaN(d.getTime()) && d.getMonth() + 1 === currentMonth) uniqueDays.add(d.toDateString());
      }
    });
    setDaysLoggedThisMonth(uniqueDays.size);
  }, [exercises, bodyStats, refreshCounter]);

  if (loading) {
    return <Text style={overviewStyles.emptyText}>Loading overview...</Text>;
  }

  if (error) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: 20 }}>
        <Text style={[overviewStyles.emptyText, { marginBottom: 10 }]}>Could not load progress data</Text>
        <Text style={[overviewStyles.emptyText, { fontSize: 13, marginBottom: 14 }]}>{error}</Text>
        <ActionButton onPress={onRetry} style={styles.addGoalButton}>
          <Text style={styles.addGoalText}>Retry</Text>
        </ActionButton>
      </View>
    );
  }

  const sorted = [...bodyStats].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const latestBodyFat = sorted.length > 0 ? sorted[0].bodyFat : null;
  const previousBodyFat = sorted.length > 1 ? sorted[1].bodyFat : null;
  const bodyFatDelta = latestBodyFat !== null && previousBodyFat !== null
    ? +(latestBodyFat - previousBodyFat).toFixed(1) : null;

  const latestBMI = (() => {
    if (sorted.length === 0) return null;
    const entry = sorted[0];
    if (entry.bmi && entry.bmi > 0) return entry.bmi;
    if (entry.weight > 0 && entry.height > 0) return entry.weight / Math.pow(entry.height / 100, 2);
    return null;
  })();

  const bmiCategory = (bmi) => {
    if (bmi < 18.5) return { label: 'Underweight', type: 'negative' };
    if (bmi < 25)   return { label: 'Normal',      type: 'positive' };
    if (bmi < 30)   return { label: 'Overweight',  type: 'negative' };
    return           { label: 'Obese',             type: 'negative' };
  };

  const monthProgress = daysInCurrentMonth > 0 ? daysLoggedThisMonth / daysInCurrentMonth : 0;
  const consistencyPct = Math.round(monthProgress * 100);
  const now2 = new Date();
  const monthName = now2.toLocaleString('default', { month: 'long' });
  const daysRemaining = daysInCurrentMonth - now2.getDate();

  const totalGoals = exercises.length;
  const completedCount = exercises.filter(e => e.progress >= 100).length;

  const SummaryCard = ({ title, value, subtitle, badge, badgeType }) => (
    <View style={overviewStyles.summaryCard}>
      <View>
        <Text style={overviewStyles.cardTitle}>{title}</Text>
        <View style={overviewStyles.valueContainer}>
          <Text style={overviewStyles.cardValue}>{value}</Text>
          <Text style={overviewStyles.cardSubtitle}>{subtitle}</Text>
        </View>
        {badge && (
          <View style={[overviewStyles.cardBadge, badgeType === 'positive' ? overviewStyles.badgePositive : overviewStyles.badgeNegative]}>
            <Text style={overviewStyles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <ScrollView style={overviewStyles.content} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={overviewStyles.cardsGrid}>
        <View style={overviewStyles.welcomeDividerContainer}>
          <View style={overviewStyles.sectionDividerLine} />
          <Text style={overviewStyles.welcomeHeading}>Welcome back! Let's see your progress.</Text>
          <View style={overviewStyles.sectionDividerLine} />
        </View>

        {/* Monthly Streak Card */}
        <View style={overviewStyles.streakCard}>
          <Text style={overviewStyles.streakLabel}>🔥 {monthName} Logged</Text>
          <View style={overviewStyles.streakValueRow}>
            <Text style={overviewStyles.streakCount}>{daysLoggedThisMonth}</Text>
            <Text style={overviewStyles.streakUnit}>/{daysInCurrentMonth}</Text>
          </View>
          <View style={overviewStyles.streakProgressContainer}>
            <View style={overviewStyles.streakProgressTrack}>
              <View style={[overviewStyles.streakProgressFill, { width: `${consistencyPct}%` }]} />
            </View>
            <Text style={overviewStyles.streakProgressLabel}>{consistencyPct}%</Text>
            <Text style={[overviewStyles.streakProgressLabel, { marginTop: 2, opacity: 0.7 }]}>
              {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left in {monthName}
            </Text>
          </View>
          <View style={overviewStyles.streakBadge}>
            <Text style={overviewStyles.streakBadgeText}>
              {daysLoggedThisMonth === 0 ? 'Not started' : consistencyPct >= 80 ? '🌟 Excellent' : consistencyPct >= 50 ? '⚡ Halfway' : '🌱 Building'}
            </Text>
          </View>
        </View>

        {/* Goals Completed Card */}
        <View style={overviewStyles.summaryCard}>
          <View style={overviewStyles.summaryContent}>
            <Text style={overviewStyles.summaryLabel}>Monthly Goal Completion</Text>
            <View style={overviewStyles.summaryValueRow}>
              <Text style={overviewStyles.summaryCount}>{completedCount}</Text>
              <Text style={overviewStyles.summaryTotal}>/{totalGoals}</Text>
            </View>
            <View style={overviewStyles.summaryProgressContainer}>
              <View style={overviewStyles.summaryProgressTrack}>
                <View style={[overviewStyles.summaryProgressFill, { width: totalGoals > 0 ? `${Math.round((completedCount / totalGoals) * 100)}%` : '0%' }]} />
              </View>
              <Text style={overviewStyles.summaryProgressLabel}>
                {totalGoals > 0 ? `${Math.round((completedCount / totalGoals) * 100)}%` : '0%'}
              </Text>
              <Text style={overviewStyles.cardCaption}>"Track your grind. See your growth." 💪</Text>
              <View style={overviewStyles.summaryBadge}>
                <Text style={overviewStyles.summaryBadgeText}>{completedCount === totalGoals && totalGoals > 0 ? 'Done' : 'Active'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Section Divider */}
        <View style={overviewStyles.sectionDividerContainer}>
          <View style={overviewStyles.sectionDividerLine} />
          <Text style={overviewStyles.sectionDividerText}>Body Composition Overview</Text>
          <View style={overviewStyles.sectionDividerLine} />
        </View>

        <SummaryCard
          title="Body Fat"
          value={latestBodyFat !== null ? `${latestBodyFat.toFixed(1)}%` : '—'}
          subtitle="latest measurement"
          badge={bodyFatDelta !== null ? (bodyFatDelta < 0 ? `↓ ${Math.abs(bodyFatDelta)}% since last` : bodyFatDelta > 0 ? `↑ ${bodyFatDelta}% since last` : 'No change') : undefined}
          badgeType={bodyFatDelta !== null ? (bodyFatDelta < 0 ? 'positive' : 'negative') : undefined}
        />
        <SummaryCard
          title="BMI"
          value={latestBMI !== null ? latestBMI.toFixed(1) : '—'}
          subtitle="latest measurement"
          badge={latestBMI !== null ? bmiCategory(latestBMI).label : undefined}
          badgeType={latestBMI !== null ? bmiCategory(latestBMI).type : undefined}
        />
      </View>
    </ScrollView>
  );
};

// ════════════════════════════════════════════════════════════════════
// BODY STATS TAB COMPONENT
// ════════════════════════════════════════════════════════════════════
const BodyStatsTab = ({ refreshCallback }) => {
  const [showLogModal, setShowLogModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isLogToday, setIsLogToday] = useState(false);
  const [measurements, setMeasurements] = useState([]);
  const [editingMeasurementId, setEditingMeasurementId] = useState(null);
  const [currentHeight, setCurrentHeight] = useState(0);

  const getTodayDateStr = () => {
    const today = new Date();
    return `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
  };

  const getDisplayHeight = (data) => {
    const todayDate = getTodayDateStr();
    const todayMeasurement = data.find(m => m.date === todayDate);
    if (todayMeasurement?.height > 0) return todayMeasurement.height;
    if (data.length > 0) return data[data.length - 1]?.height || 0;
    return 0;
  };

  const email = getUserEmail();

  useEffect(() => { fetchMeasurements(); }, []);

  const fetchMeasurements = async () => {
    try {
      const response = await authFetch(`${API}/api/progress/measurements`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setMeasurements(data);
      setCurrentHeight(getDisplayHeight(data));
    } catch (error) {
      console.error('Error fetching measurements:', error);
    }
  };

  const [newLogData, setNewLogData] = useState({
    height: '', weight: '', waist: '', date: getTodayDateStr(),
  });

  const calculatedBodyFat = useMemo(() => {
    const h = parseFloat((newLogData.height || '').replace(',', '.'));
    const w = parseFloat((newLogData.waist || '').replace(',', '.'));
    if (!h || !w || h <= 0 || w <= 0) return '';
    const bf = 64 - (20 * (h / w));
    return bf > 0 ? bf.toFixed(1) : '';
  }, [newLogData.height, newLogData.waist]);

  const calculatedBMI = useMemo(() => {
    const h = parseFloat((newLogData.height || '').replace(',', '.'));
    const wt = parseFloat((newLogData.weight || '').replace(',', '.'));
    if (!h || !wt || h <= 0 || wt <= 0) return '';
    return (wt / Math.pow(h / 100, 2)).toFixed(1);
  }, [newLogData.height, newLogData.weight]);

  const weightSummary = useMemo(() => {
    if (measurements.length === 0) return null;
    const latest = measurements[0].weight;
    const previous = measurements.length > 1 ? measurements[1].weight : null;
    const start = measurements[measurements.length - 1].weight;
    let description = "";
    let highlight = "";
    if (previous !== null) {
      const diff = latest - previous;
      const absDiff = Math.abs(diff).toFixed(1);
      if (diff < 0) { description = "Your weight has decreased by "; highlight = `${absDiff}kg`; description += "since your last log."; }
      else if (diff > 0) { description = "Your weight has increased by "; highlight = `${absDiff}kg`; description += "since your last log."; }
      else { description = "Your weight has "; highlight = "remained steady"; description += " since your last log."; }
    } else { description = "Initial weight logged at "; highlight = `${latest}kg`; description += ". Start tracking to see variation!"; }
    if (measurements.length > 2) {
      const totalDiff = latest - start;
      const absTotalDiff = Math.abs(totalDiff).toFixed(1);
      if (totalDiff < 0) description += ` You've lost a total of ${absTotalDiff}kg so far.`;
      else if (totalDiff > 0) description += ` You've gained a total of ${absTotalDiff}kg so far.`;
    }
    return { description, highlight };
  }, [measurements]);

  const chartData = {
    labels: measurements.length > 0 ? measurements.map(m => m.date).reverse() : [''],
    datasets: [{
      data: measurements.length > 0 ? measurements.map(m => m.weight).reverse() : [0],
      color: (opacity = 1) => `rgba(199, 240, 0, ${opacity})`,
      strokeWidth: 3, withDots: true, withShadow: false,
    }],
  };

  const handleLogToday = () => {
    const today = getTodayDateStr();
    const todaysLog = measurements.find(m => m.date === today);
    if (todaysLog) { handleEditMeasurement(todaysLog.id); }
    else { setNewLogData({ height: '', weight: '', waist: '', date: today }); setEditingMeasurementId(null); setIsCreating(true); setIsLogToday(true); setShowLogModal(true); }
  };

  const handleSaveLog = async () => {
    if (!newLogData.weight?.trim() || !newLogData.waist?.trim() || !newLogData.height?.trim() || !newLogData.date?.trim()) {
      if (Platform.OS === 'web') window.alert('filling all the fields are mandotory');
      else Alert.alert('Error', 'filling all the fields are mandotory');
      return;
    }
    const height = parseFloat(newLogData.height.replace(',', '.'));
    const weight = parseFloat(newLogData.weight.replace(',', '.'));
    const waist  = parseFloat(newLogData.waist.replace(',', '.'));
    if (height <= 0 || weight <= 0 || waist <= 0) {
      if (Platform.OS === 'web') window.alert('All values must be greater than 0');
      else Alert.alert('Error', 'All values must be greater than 0');
      return;
    }
    if (!calculatedBodyFat) {
      if (Platform.OS === 'web') window.alert('filling all the fields are mandotory');
      else Alert.alert('Error', 'filling all the fields are mandotory');
      return;
    }
    const dateRegex = /^\d{2}-\d{2}$/;
    if (!dateRegex.test(newLogData.date)) {
      if (Platform.OS === 'web') window.alert('Please enter date in MM-DD format (e.g., 03-31)');
      else Alert.alert('Error', 'Please enter date in MM-DD format');
      return;
    }
    const [month, day] = newLogData.date.split('-').map(Number);
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      if (Platform.OS === 'web') window.alert('Please enter a valid date');
      else Alert.alert('Error', 'Please enter a valid date');
      return;
    }
    const todayDate = getTodayDateStr();
    if (!isLogToday && !editingMeasurementId && newLogData.date === todayDate) {
      if (Platform.OS === 'web') window.alert('Use the "+ Today" button to log today\'s measurements!');
      else Alert.alert('Info', 'Use the "+ Today" button');
      return;
    }
    const dateExists = measurements.some(m => m.date === newLogData.date && m.id !== editingMeasurementId);
    if (dateExists) {
      if (Platform.OS === 'web') window.alert('You have added measurements for this date!');
      else Alert.alert('Error', 'You have added measurements for this date!');
      return;
    }

    const newMeasurement = {
      date: newLogData.date, weight, bodyFat: parseFloat(calculatedBodyFat),
      waist, height, bmi: parseFloat(calculatedBMI),
      email: email || undefined,
    };

    try {
      if (editingMeasurementId) {
        const existing = measurements.find(m => m.id === editingMeasurementId);
        if (existing) newMeasurement.date = existing.date;
        const response = await authFetch(`${API}/api/progress/measurements/${editingMeasurementId}`, {
          method: 'PUT', body: JSON.stringify(newMeasurement),
        });
        const updated = await response.json();
        const updatedAll = measurements.map(m => m.id === editingMeasurementId ? updated : m);
        setMeasurements(updatedAll);
        setCurrentHeight(getDisplayHeight(updatedAll));
      } else {
        const response = await authFetch(`${API}/api/progress/measurements`, {
          method: 'POST', body: JSON.stringify(newMeasurement),
        });
        const created = await response.json();
        const allMeasurements = [created, ...measurements].sort((a, b) => b.date.localeCompare(a.date));
        setMeasurements(allMeasurements);
        setCurrentHeight(getDisplayHeight(allMeasurements));
      }
      setNewLogData({ height: '', weight: '', waist: '', date: getTodayDateStr() });
      setEditingMeasurementId(null); setShowLogModal(false);
      if (refreshCallback) refreshCallback();
      if (Platform.OS === 'web') window.alert(`Measurement ${editingMeasurementId ? 'updated' : 'logged'} successfully!`);
      else Alert.alert('Success', `Measurement ${editingMeasurementId ? 'updated' : 'logged'} successfully!`);
    } catch (error) {
      console.error('Error saving measurement:', error);
      if (Platform.OS === 'web') window.alert('Failed to save measurement');
      else Alert.alert('Error', 'Failed to save measurement');
    }
  };

  const handleEditMeasurement = (id) => {
    const measurement = measurements.find(m => m.id === id);
    if (measurement) {
      setNewLogData({ height: measurement.height ? measurement.height.toString() : '', weight: measurement.weight.toString(), waist: measurement.waist.toString(), date: measurement.date });
      setEditingMeasurementId(id); setIsCreating(false); setShowLogModal(true);
    }
  };

  const handleDeleteMeasurement = (id) => {
    const doDelete = async () => {
      try {
        await authFetch(`${API}/api/progress/measurements/${id}`, { method: 'DELETE' });
        const updated = measurements.filter(m => m.id !== id);
        setMeasurements(updated); setCurrentHeight(getDisplayHeight(updated));
        if (refreshCallback) refreshCallback();
        if (Platform.OS === 'web') window.alert('Measurement deleted successfully');
        else Alert.alert('Success', 'Measurement deleted successfully');
      } catch (error) {
        if (Platform.OS === 'web') window.alert('Failed to delete measurement');
        else Alert.alert('Error', 'Failed to delete measurement');
      }
    };
    if (Platform.OS === 'web') { if (window.confirm('are you sure you want to delete this?')) doDelete(); return; }
    Alert.alert('Delete Measurement', 'are you sure you want to delete this?', [{ text: 'Cancel' }, { text: 'OK', onPress: doDelete, style: 'destructive' }]);
  };

  const closeAndResetModal = () => {
    setShowLogModal(false); setEditingMeasurementId(null); setIsCreating(false); setIsLogToday(false);
    setNewLogData({ height: '', weight: '', waist: '', date: getTodayDateStr() });
  };

  const renderMeasurementRow = ({ item }) => (
    <View style={bodyStatsStyles.tableRow}>
      <Text style={bodyStatsStyles.dateCell}>{item.date}</Text>
      <Text style={bodyStatsStyles.weightCell}>{item.weight}kg</Text>
      <Text style={bodyStatsStyles.bodyFatCell}>{item.bodyFat}%</Text>
      <Text style={bodyStatsStyles.waistCell}>{item.waist}cm</Text>
      <View style={bodyStatsStyles.actionsCellContainer}>
        <ActionButton onPress={() => handleEditMeasurement(item.id)} style={bodyStatsStyles.actionButton}>
          <Text style={bodyStatsStyles.editIcon}>✎</Text>
        </ActionButton>
        <ActionButton onPress={() => handleDeleteMeasurement(item.id)} style={bodyStatsStyles.actionButton}>
          <Text style={bodyStatsStyles.deleteIcon}>🗑</Text>
        </ActionButton>
      </View>
    </View>
  );

  return (
    <ScrollView style={bodyStatsStyles.content} showsVerticalScrollIndicator={false}>
      <View style={bodyStatsStyles.sectionHeader}>
        <Text style={bodyStatsStyles.sectionTitle}>Body Measurements</Text>
        <ActionButton onPress={() => { setNewLogData({ height: '', weight: '', waist: '', date: getTodayDateStr() }); setEditingMeasurementId(null); setIsCreating(true); setIsLogToday(true); setShowLogModal(true); }} style={bodyStatsStyles.logButton}>
          <Text style={bodyStatsStyles.logButtonPlus}>+</Text>
          <Text style={bodyStatsStyles.logButtonText}>Log Measurement</Text>
        </ActionButton>
      </View>

      {/* Weight Trend Chart */}
      <View style={bodyStatsStyles.chartContainer}>
        <Text style={bodyStatsStyles.chartTitle}>Weight Trend</Text>
        <LineChart
          data={chartData}
          width={SCREEN_WIDTH}
          height={220}
          chartConfig={{
            backgroundColor: '#1C1C1E', backgroundGradientFrom: '#1C1C1E', backgroundGradientTo: '#1C1C1E',
            decimalPlaces: 1, color: (opacity = 1) => `rgba(199, 240, 0, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(161, 161, 166, ${opacity})`,
            propsForDots: { r: '5', strokeWidth: '2', stroke: '#C7F000', fill: '#C7F000' },
            propsForLabels: { fontSize: 10 },
          }}
          style={{ marginVertical: 8, borderRadius: 0, paddingRight: 0, marginLeft: -16 }}
          bezier yAxisInterval={0.5} segments={4}
        />
      </View>

      {/* Weight Summary */}
      {weightSummary && (
        <View style={bodyStatsStyles.summaryCard}>
          <Text style={bodyStatsStyles.summaryHeader}>Weight Summary</Text>
          <Text style={bodyStatsStyles.summaryDescription}>
            {weightSummary.description.split(weightSummary.highlight).map((part, index, array) => (
              <React.Fragment key={index}>
                {part}
                {index < array.length - 1 && (<Text style={bodyStatsStyles.summaryHighlight}>{weightSummary.highlight}</Text>)}
              </React.Fragment>
            ))}
          </Text>
        </View>
      )}

      {/* Measurements Table */}
      <View style={bodyStatsStyles.tableContainer}>
        <View style={bodyStatsStyles.tableHeader}>
          <Text style={[bodyStatsStyles.headerCell, { flex: 1 }]}>DATE</Text>
          <Text style={[bodyStatsStyles.headerCell, { flex: 1 }]}>WEIGHT</Text>
          <Text style={[bodyStatsStyles.headerCell, { flex: 1 }]}>BF%</Text>
          <Text style={[bodyStatsStyles.headerCell, { flex: 1 }]}>WAIST</Text>
          <Text style={[bodyStatsStyles.headerCell, { flex: 0.6 }]}>EDIT</Text>
        </View>
        <FlatList data={measurements} renderItem={renderMeasurementRow} keyExtractor={(item) => item.id} scrollEnabled={false} ItemSeparatorComponent={() => <View style={bodyStatsStyles.rowDivider} />} />
      </View>

      <View style={{ height: 20 }} />

      {/* Log Measurement Modal */}
      <Modal visible={showLogModal} animationType="slide" transparent={true} onRequestClose={closeAndResetModal}>
        <View style={bodyStatsStyles.modalOverlay}>
          <View style={bodyStatsStyles.modalContent}>
            <View style={bodyStatsStyles.modalHeader}>
              <Text style={bodyStatsStyles.modalTitle}>{isCreating ? 'Log Measurement' : 'Edit Measurement'}</Text>
              <TouchableOpacity onPress={closeAndResetModal} style={bodyStatsStyles.closeButton}>
                <Text style={bodyStatsStyles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={{ marginBottom: 12 }}>
              <Text style={bodyStatsStyles.inputLabel}>Date (MM-DD)</Text>
              <TextInput style={[bodyStatsStyles.input, !!editingMeasurementId && bodyStatsStyles.disabledInput]} placeholder="e.g., 03-31" placeholderTextColor="#A1A1A6" value={newLogData.date} onChangeText={(text) => { const filtered = text.replace(/[^0-9-]/g, ''); if (filtered.length <= 5) setNewLogData({ ...newLogData, date: filtered }); }} editable={!editingMeasurementId} maxLength={5} />
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={bodyStatsStyles.inputLabel}>Height (cm)</Text>
                <TextInput style={[bodyStatsStyles.input, !!editingMeasurementId && bodyStatsStyles.disabledInput]} placeholder="e.g., 175" placeholderTextColor="#A1A1A6" keyboardType="decimal-pad" value={newLogData.height} onChangeText={(text) => setNewLogData({ ...newLogData, height: text.replace(/[^0-9.]/g, '') })} editable={!editingMeasurementId} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={bodyStatsStyles.inputLabel}>Weight (kg)</Text>
                <TextInput style={bodyStatsStyles.input} placeholder="e.g., 80" placeholderTextColor="#A1A1A6" keyboardType="decimal-pad" value={newLogData.weight} onChangeText={(text) => setNewLogData({ ...newLogData, weight: text.replace(/[^0-9.]/g, '') })} />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={bodyStatsStyles.inputLabel}>Waist (cm)</Text>
                <TextInput style={bodyStatsStyles.input} placeholder="e.g., 82" placeholderTextColor="#A1A1A6" keyboardType="decimal-pad" value={newLogData.waist} onChangeText={(text) => setNewLogData({ ...newLogData, waist: text.replace(/[^0-9.]/g, '') })} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={bodyStatsStyles.inputLabel}>Body Fat (%)</Text>
                <View style={bodyStatsStyles.bodyFatDisplay}>
                  <Text style={{ color: calculatedBodyFat ? '#FFFFFF' : '#A1A1A6', fontSize: 14, fontWeight: '500' }}>
                    {calculatedBodyFat ? `${calculatedBodyFat}%` : 'Auto'}
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={bodyStatsStyles.submitButton} onPress={handleSaveLog}>
              <Text style={bodyStatsStyles.submitButtonText}>{editingMeasurementId ? 'Save Changes' : 'Log Measurement'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

// ════════════════════════════════════════════════════════════════════
// MAIN PROGRESS SCREEN
// ════════════════════════════════════════════════════════════════════
export default function ProgressScreen() {
  const [activeTab, setActiveTab] = useState('overview');
  const [exercises, setExercises] = useState([]);
  const [bodyStats, setBodyStats] = useState([]);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [goalsLoading, setGoalsLoading] = useState(true);
  const [bodyStatsLoading, setBodyStatsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const email = getUserEmail();

  useEffect(() => { fetchGoals(); fetchBodyStats(); }, []);

  const fetchBodyStats = async () => {
    try {
      setBodyStatsLoading(true);
      const response = await fetchWithTimeout(`${API}/api/progress/measurements${email ? `?email=${encodeURIComponent(email)}` : ''}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await parseJsonSafe(response);
      setBodyStats(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching body stats:', error);
      setLoadError(error.message || 'Could not fetch body stats.');
      setBodyStats([]);
    } finally {
      setBodyStatsLoading(false);
    }
  };

  const refreshAllData = async () => {
    setLoadError('');
    await Promise.all([fetchGoals(), fetchBodyStats()]);
    setRefreshCounter(prev => prev + 1);
  };

  const fetchGoals = async () => {
    try {
      setGoalsLoading(true);
      const response = await fetchWithTimeout(`${API}/api/progress/goals${email ? `?email=${encodeURIComponent(email)}` : ''}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await parseJsonSafe(response);
      setExercises(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching goals:', error);
      setLoadError(error.message || 'Could not fetch goals.');
      setExercises([]);
    } finally {
      setGoalsLoading(false);
    }
  };

  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [targetReps, setTargetReps] = useState('');
  const [targetSets, setTargetSets] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [currentReps, setCurrentReps] = useState('');
  const [currentSets, setCurrentSets] = useState('');

  const resetForm = () => {
    setSelectedExercise(''); setTargetWeight(''); setTargetReps(''); setTargetSets('');
    setCurrentWeight(''); setCurrentReps(''); setCurrentSets(''); setEditingGoalId(null);
  };

  const handleAddGoal = async () => {
    if (!selectedExercise?.trim() || !targetWeight?.trim() || !targetReps?.trim() || !targetSets?.trim()) {
      if (Platform.OS === 'web') window.alert('filling all the fields are mandotory');
      else Alert.alert('Error', 'filling all the fields are mandotory');
      return;
    }
    const tW = parseFloat(targetWeight) || 1; const tR = parseInt(targetReps, 10) || 1; const tS = parseInt(targetSets, 10) || 1;
    const cW = parseFloat(currentWeight) || 0; const cR = parseInt(currentReps, 10) || 0; const cS = parseInt(currentSets, 10) || 0;
    if (tW <= 0 || tR <= 0 || tS <= 0) {
      if (Platform.OS === 'web') window.alert('Target values must be greater than 0');
      else Alert.alert('Error', 'Target values must be greater than 0');
      return;
    }
    const pW = Math.min(100, Math.max(0, (cW / tW) * 100)); const pR = Math.min(100, Math.max(0, (cR / tR) * 100)); const pS = Math.min(100, Math.max(0, (cS / tS) * 100));
    const newExercise = { name: selectedExercise, target: `${targetWeight}kg × ${targetReps} reps × ${targetSets} sets`, current: { weight: cW, reps: cR, sets: cS }, progress: Math.round((pW + pR + pS) / 3), email: email || undefined };

    try {
      if (editingGoalId) {
        const response = await authFetch(`${API}/api/progress/goals/${editingGoalId}`, { method: 'PUT', body: JSON.stringify(newExercise) });
        const updated = await response.json();
        setExercises(exercises.map(ex => ex.id === editingGoalId ? updated : ex));
      } else {
        const response = await authFetch(`${API}/api/progress/goals`, { method: 'POST', body: JSON.stringify(newExercise) });
        const created = await response.json();
        setExercises([...exercises, created]);
      }
      resetForm(); setShowAddGoalModal(false); setRefreshCounter(prev => prev + 1);
      if (Platform.OS === 'web') window.alert(`Goal ${editingGoalId ? 'updated' : 'added'} successfully!`);
      else Alert.alert('Success', `Goal ${editingGoalId ? 'updated' : 'added'} successfully!`);
    } catch (error) {
      if (Platform.OS === 'web') window.alert('Failed to save goal');
      else Alert.alert('Error', 'Failed to save goal');
    }
  };

  const handleDeleteGoal = (id) => {
    const doDelete = async () => {
      try {
        await authFetch(`${API}/api/progress/goals/${id}`, { method: 'DELETE' });
        setExercises(exercises.filter(ex => ex.id !== id)); setRefreshCounter(prev => prev + 1);
        if (Platform.OS === 'web') window.alert('Goal deleted successfully');
        else Alert.alert('Success', 'Goal deleted successfully');
      } catch (error) {
        if (Platform.OS === 'web') window.alert('Failed to delete goal');
        else Alert.alert('Error', 'Failed to delete goal');
      }
    };
    if (Platform.OS === 'web') { if (window.confirm('are you sure you want to delete this?')) doDelete(); return; }
    Alert.alert('Delete Goal', 'are you sure you want to delete this?', [{ text: 'Cancel' }, { text: 'OK', onPress: doDelete, style: 'destructive' }]);
  };

  const handleEditGoal = (id) => {
    const goalToEdit = exercises.find(ex => ex.id === id);
    if (goalToEdit) {
      setSelectedExercise(goalToEdit.name);
      const targetParts = goalToEdit.target.match(/([\d.]+)kg × ([\d.]+) reps × ([\d.]+) sets/);
      if (targetParts) { setTargetWeight(targetParts[1]); setTargetReps(targetParts[2]); setTargetSets(targetParts[3]); }
      else { setTargetWeight('0'); setTargetReps('0'); setTargetSets('0'); }
      setCurrentWeight(goalToEdit.current?.weight?.toString() || '');
      setCurrentReps(goalToEdit.current?.reps?.toString() || '');
      setCurrentSets(goalToEdit.current?.sets?.toString() || '');
      setEditingGoalId(id); setShowAddGoalModal(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Progress Tracking Dashboard</Text>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        {['overview', 'exercises', 'bodystats'].map((tab) => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.activeTab]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'overview' ? 'Overview' : tab === 'exercises' ? 'Exercises' : 'Body Stats'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {activeTab === 'overview' && (
        <OverviewTab
          exercises={exercises}
          bodyStats={bodyStats}
          refreshCounter={refreshCounter}
          loading={goalsLoading || bodyStatsLoading}
          error={loadError}
          onRetry={refreshAllData}
        />
      )}
      {activeTab === 'bodystats' && <BodyStatsTab refreshCallback={refreshAllData} />}

      {activeTab === 'exercises' && (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.goalsCard}>
            <Text style={styles.goalsLabel}>Goals Completed</Text>
            <View style={styles.goalsValueRow}>
              <Text style={styles.goalsCount}>{exercises.filter(e => e.progress >= 100).length}</Text>
              <Text style={styles.goalsUnit}>/{exercises.length}</Text>
            </View>
            <Text style={styles.goalsSubtext}>
              {exercises.length === 0 ? 'No goals set' : exercises.filter(e => e.progress >= 100).length === exercises.length ? 'All goals achieved! 🏆' : `${exercises.length - exercises.filter(e => e.progress >= 100).length} goal${exercises.length - exercises.filter(e => e.progress >= 100).length !== 1 ? 's' : ''} left`}
            </Text>
            <View style={styles.goalsBadge}>
              <Text style={styles.goalsBadgeText}>{exercises.filter(e => e.progress >= 100).length === exercises.length && exercises.length > 0 ? 'Done' : 'Active'}</Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Exercise Goals</Text>
            <ActionButton onPress={() => { resetForm(); setShowAddGoalModal(true); }} style={styles.addGoalButton}>
              <Text style={styles.addGoalPlus}>+</Text>
              <Text style={styles.addGoalText}>Add Goal</Text>
            </ActionButton>
          </View>

          {exercises.map((exercise) => (
            <View key={exercise.id} style={styles.exerciseCard}>
              <View style={styles.cardHeader}>
                <View style={styles.exerciseNameContainer}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <Text style={styles.exerciseTarget}>{exercise.target}</Text>
                </View>
                <View style={styles.cardActions}>
                  <ActionButton onPress={() => handleEditGoal(exercise.id)} style={styles.actionButton}><Text style={styles.actionIcon}>✎</Text></ActionButton>
                  <ActionButton onPress={() => handleDeleteGoal(exercise.id)} style={styles.actionButton}><Text style={styles.actionIcon}>🗑</Text></ActionButton>
                </View>
              </View>
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Overall Progress</Text>
                  <Text style={styles.progressPercentage}>{exercise.progress}%</Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <LinearGradient colors={['#C7F000', '#A8D000']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.progressBarFill, { width: `${exercise.progress}%` }]} />
                </View>
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}><Text style={styles.statLabel}>Weight</Text><Text style={styles.statValue}>{exercise.current.weight}kg</Text><Text style={styles.statSubtext}>/ {exercise.target.split('×')[0].trim()}</Text></View>
                  <View style={styles.statItem}><Text style={styles.statLabel}>Reps</Text><Text style={styles.statValue}>{exercise.current.reps}</Text><Text style={styles.statSubtext}>/ {exercise.target.split('×')[1]?.trim().split(' ')[0] || '0'}</Text></View>
                  <View style={styles.statItem}><Text style={styles.statLabel}>Sets</Text><Text style={styles.statValue}>{exercise.current.sets}</Text><Text style={styles.statSubtext}>/ {exercise.target.split('×')[2]?.trim().split(' ')[0] || '0'}</Text></View>
                </View>
              </View>
            </View>
          ))}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* Add Goal Modal */}
      <Modal visible={showAddGoalModal} animationType="slide" transparent={true} onRequestClose={() => setShowAddGoalModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingGoalId ? 'Edit Exercise Goal' : 'Add Exercise Goal'}</Text>
              <TouchableOpacity onPress={() => { setShowAddGoalModal(false); resetForm(); }} style={styles.closeButton}><Text style={styles.closeButtonText}>✕</Text></TouchableOpacity>
            </View>
            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <View style={styles.formSection}>
                <Text style={styles.label}>Exercise Name</Text>
                <TextInput style={[styles.textInput, editingGoalId ? styles.disabledInput : null]} placeholder="e.g., Bench Press" placeholderTextColor="#A1A1A6" value={selectedExercise} onChangeText={(text) => setSelectedExercise(text.replace(/[0-9]/g, ''))} editable={!editingGoalId} />
              </View>
              <View style={styles.inputRow}>
                <View style={styles.inputGroup}><Text style={styles.label}>Target kg</Text><TextInput style={[styles.textInput, editingGoalId ? styles.disabledInput : null]} placeholder="0" placeholderTextColor="#A1A1A6" keyboardType="decimal-pad" value={targetWeight} onChangeText={(text) => setTargetWeight(text.replace(/[^0-9.]/g, ''))} editable={!editingGoalId} /></View>
                <View style={styles.inputGroup}><Text style={styles.label}>Target Reps</Text><TextInput style={[styles.textInput, editingGoalId ? styles.disabledInput : null]} placeholder="0" placeholderTextColor="#A1A1A6" keyboardType="number-pad" value={targetReps} onChangeText={(text) => setTargetReps(text.replace(/[^0-9]/g, ''))} editable={!editingGoalId} /></View>
                <View style={styles.inputGroup}><Text style={styles.label}>Target Sets</Text><TextInput style={[styles.textInput, editingGoalId ? styles.disabledInput : null]} placeholder="0" placeholderTextColor="#A1A1A6" keyboardType="number-pad" value={targetSets} onChangeText={(text) => setTargetSets(text.replace(/[^0-9]/g, ''))} editable={!editingGoalId} /></View>
              </View>
              {!!editingGoalId && (
                <View style={styles.inputRow}>
                  <View style={styles.inputGroup}><Text style={styles.label}>Current kg</Text><TextInput style={styles.textInput} placeholder="0" placeholderTextColor="#A1A1A6" keyboardType="decimal-pad" value={currentWeight} onChangeText={(text) => setCurrentWeight(text.replace(/[^0-9.]/g, ''))} /></View>
                  <View style={styles.inputGroup}><Text style={styles.label}>Current Reps</Text><TextInput style={styles.textInput} placeholder="0" placeholderTextColor="#A1A1A6" keyboardType="number-pad" value={currentReps} onChangeText={(text) => setCurrentReps(text.replace(/[^0-9]/g, ''))} /></View>
                  <View style={styles.inputGroup}><Text style={styles.label}>Current Sets</Text><TextInput style={styles.textInput} placeholder="0" placeholderTextColor="#A1A1A6" keyboardType="number-pad" value={currentSets} onChangeText={(text) => setCurrentSets(text.replace(/[^0-9]/g, ''))} /></View>
                </View>
              )}
            </ScrollView>
            <TouchableOpacity style={styles.modalSubmitButton} onPress={handleAddGoal}><Text style={styles.modalSubmitText}>✔ Save Goal</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
