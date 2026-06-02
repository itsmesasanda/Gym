import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import { BASE_URL } from "../config";
import { getUserEmail } from "../utils/session";
import { authFetch } from "../utils/authFetch";

const GREEN  = "#C7F000";
const BG     = "#000000";
const CARD   = "#1A1A1A";
const MUTED  = "#888888";
const WHITE  = "#FFFFFF";
const ORANGE = "#FF9500";
const BLUE   = "#4FC3F7";

const DEFAULT_ANNOUNCEMENTS = ["Welcome to the gym app!"];

function ConcentricRings({ outer, outerMax, middle, middleMax, inner, innerMax }) {
  const size = 120;
  const stroke = 10;
  const gap = 8;
  const r1 = size / 2 - stroke / 2;
  const r2 = r1 - stroke - gap;
  const r3 = r2 - stroke - gap;

  const rings = [
    { r: r1, color: GREEN,  track: "rgba(200,255,0,0.15)",  val: outer,  max: outerMax  },
    { r: r2, color: ORANGE, track: "rgba(255,149,0,0.15)",  val: middle, max: middleMax },
    { r: r3, color: BLUE,   track: "rgba(79,195,247,0.15)", val: inner,  max: innerMax  },
  ];

  return (
    <View style={{ transform: [{ rotate: "-90deg" }] }}>
      <Svg width={size} height={size}>
        {rings.map(({ r, color, track, val, max }, i) => {
          const circ = 2 * Math.PI * r;
          const offset = circ - Math.min(val / max, 1) * circ;
          return (
            <React.Fragment key={i}>
              <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
              <Circle
                cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke={color} strokeWidth={stroke}
                strokeDasharray={`${circ} ${circ}`}
                strokeDashoffset={offset}
                strokeLinecap="round"
              />
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

export default function DashboardScreen({ navigation }) {
  const [userName, setUserName]          = useState("");
  const [annIdx, setAnnIdx]              = useState(0);
  const [announcements, setAnnouncements] = useState(DEFAULT_ANNOUNCEMENTS);
  const [calorieData, setCalorie]        = useState({ calories: 0, protein: 0, goal: 2200, proteinGoal: 160 });
  const [todayWorkout, setWorkout]       = useState(null);
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const email = getUserEmail();

  useEffect(() => {
    const t = setInterval(() => setAnnIdx(i => (i + 1) % announcements.length), 3500);
    return () => clearInterval(t);
  }, [announcements.length]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -6, duration: 700, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0,  duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, [bounceAnim]);

  const fetchAnnouncements = async () => {
    try {
      const r = await authFetch(`${BASE_URL}/api/user/announcements`);
      if (!r.ok) return;
      const data = await r.json();
      if (Array.isArray(data) && data.length > 0) {
        setAnnouncements(data.map(a => a.title));
      }
    } catch { /* keep default */ }
  };

  const fetchAll = useCallback(async () => {
    if (!email) return;
    await Promise.all([fetchProfile(), fetchCalories(), fetchTodayWorkout(), fetchAnnouncements()]);
  }, [email]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const fetchProfile = async () => {
    try {
      const r = await authFetch(`${BASE_URL}/api/users/profile`);
      if (r.ok) {
        const d = await r.json();
        setUserName(d.name || "");
        setCalorie(prev => ({
          ...prev,
          ...(d.calories ? { goal: d.calories }           : {}),
          ...(d.protein  ? { proteinGoal: d.protein }     : {}),
        }));
      }
    } catch (e) { console.error("fetchProfile:", e); }
  };

  const fetchCalories = async () => {
    try {
      const r = await authFetch(`${BASE_URL}/api/logs/${encodeURIComponent(email)}`);
      if (!r.ok) return;
      const json = await r.json();
      const totals = json?.data?.totals;
      if (!totals) return;
      setCalorie(prev => ({
        ...prev,
        calories: totals.calories || 0,
        protein:  totals.protein  || 0,
      }));
    } catch (e) { console.error("fetchCalories:", e); }
  };

  const fetchTodayWorkout = async () => {
    try {
      const r = await authFetch(`${BASE_URL}/api/workout-plans`);
      if (!r.ok) return;
      const plans = await r.json();
      if (!plans.length) return;
      const plan = plans[0];
      const today = new Date().getDay();
      const dayNum = today === 0 ? 7 : today;
      const day = plan.days?.find(d => d.day_number === dayNum) || plan.days?.[0];
      if (day) setWorkout({ plan, day });
    } catch (e) { console.error("fetchTodayWorkout:", e); }
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  const firstName   = userName ? userName.split(" ")[0] : "there";
  const cals        = calorieData.calories || 0;
  const prot        = calorieData.protein  || 0;
  const workoutMin  = 38;
  const workoutMax  = 45;
  const exercises   = todayWorkout?.day?.exercises?.slice(0, 4)
    ?.map(ex => (typeof ex === "object" ? ex.name : ex))
    || ["Bench Press", "OHP", "Incline DB", "Tricep Dip"];

  return (
    <SafeAreaView style={s.container}>
      <LinearGradient
        colors={["#1A2400", "transparent"]}
        style={s.topGradient}
        pointerEvents="none"
      />

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ── Header ── */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.navigate("Drawer")} style={s.menuBtn}>
            <View style={s.menuLine} />
            <View style={[s.menuLine, { width: 16 }]} />
            <View style={s.menuLine} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.greeting}>{greeting()}</Text>
            <Text style={s.headerName}>{firstName}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate("Profile")} style={s.avatarBtn}>
            <Text style={s.avatarInitial}>{(userName || "U").charAt(0).toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Announcement Bar ── */}
        <View style={s.annBar}>
          <Feather name="bell" size={13} color={GREEN} />
          <Text style={s.annText} numberOfLines={1}>{announcements[annIdx]}</Text>
          <View style={s.annDots}>
            {announcements.map((_, i) => (
              <View key={i} style={[s.annDot, { width: i === annIdx ? 12 : 4, backgroundColor: i === annIdx ? GREEN : "#444" }]} />
            ))}
          </View>
        </View>

        {/* ── Activity Rings ── */}
        <View style={s.ringsCard}>
          <ConcentricRings
            outer={cals}      outerMax={calorieData.goal}
            middle={workoutMin} middleMax={workoutMax}
            inner={prot}      innerMax={calorieData.proteinGoal}
          />
          <View style={s.ringsInfo}>
            {[
              { dot: GREEN,  label: "Move",    value: `${cals.toLocaleString()}`, unit: `/ ${calorieData.goal.toLocaleString()} kcal` },
              { dot: ORANGE, label: "Workout", value: `${workoutMin}`,            unit: `/ ${workoutMax} min` },
              { dot: BLUE,   label: "Protein", value: `${prot}g`,                unit: `/ ${calorieData.proteinGoal}g` },
            ].map(({ dot, label, value, unit }) => (
              <View key={label} style={s.ringRow}>
                <View style={[s.ringDot, { backgroundColor: dot }]} />
                <Text style={s.ringLabel}>{label}</Text>
                <Text style={s.ringValue}>{value} <Text style={s.ringUnit}>{unit}</Text></Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── AI Generated Workout Card ── */}
        <View style={s.workoutCard}>
          <View style={s.aiBadge}>
            <Feather name="zap" size={10} color={GREEN} />
            <Text style={s.aiBadgeText}>AI GENERATED</Text>
          </View>
          <Text style={s.workoutTitle}>
            {todayWorkout?.day?.focus || "Upper Body Push Day"}
          </Text>
          <Text style={s.workoutDesc}>
            {todayWorkout ? todayWorkout.plan.title : "Chest, shoulders, triceps — progressive overload focus"}
          </Text>
          <View style={s.pillsRow}>
            {exercises.map((ex, i) => (
              <View key={i} style={s.pill}>
                <Text style={s.pillText}>{ex}</Text>
              </View>
            ))}
          </View>
          <View style={s.statsRow}>
            <View style={s.statItem}>
              <MaterialCommunityIcons name="dumbbell" size={12} color={MUTED} />
              <Text style={s.statText}>{todayWorkout?.day?.exercises?.length || 6} exercises</Text>
            </View>
            <View style={s.statItem}>
              <Feather name="clock" size={12} color={MUTED} />
              <Text style={s.statText}>52 min</Text>
            </View>
            <View style={s.statItem}>
              <Feather name="zap" size={12} color={MUTED} />
              <Text style={s.statText}>340 kcal</Text>
            </View>
          </View>
          <TouchableOpacity style={s.startBtn} onPress={() => navigation.navigate("WorkoutLog")}>
            <Text style={s.startBtnText}>Start Workout</Text>
            <Feather name="chevron-right" size={16} color="#000" />
          </TouchableOpacity>
        </View>

        {/* ── AI Insight ── */}
        <View style={s.insightCard}>
          <View style={s.insightIcon}>
            <MaterialCommunityIcons name="robot-outline" size={18} color={GREEN} />
          </View>
          <Text style={s.insightText}>
            <Text style={s.insightLabel}>AI Insight: </Text>
            {"You've hit your protein goal 5 days in a row — great consistency"}
          </Text>
        </View>

      </ScrollView>

      {/* ── Floating AI Chat FAB ── */}
      <Animated.View style={[s.fab, { transform: [{ translateY: bounceAnim }] }]} pointerEvents="box-none">
        <TouchableOpacity style={s.fabBtn} onPress={() => navigation.navigate("AiCoachChat")}>
          <MaterialCommunityIcons name="robot-outline" size={26} color="#000" />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: BG },
  topGradient: { position: "absolute", top: 0, left: 0, right: 0, height: "20%", zIndex: 0 },
  scroll:      { flex: 1, paddingHorizontal: 16 },

  header:       { flexDirection: "row", alignItems: "center", paddingTop: 14, paddingBottom: 12 },
  menuBtn:      { width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center", gap: 4 },
  menuLine:     { width: 20, height: 2, backgroundColor: WHITE, borderRadius: 1 },
  headerCenter: { flex: 1, alignItems: "center" },
  greeting:     { color: MUTED, fontSize: 11, fontWeight: "500" },
  headerName:   { color: WHITE, fontSize: 14, fontWeight: "800" },
  avatarBtn:    { width: 36, height: 36, borderRadius: 18, backgroundColor: GREEN, alignItems: "center", justifyContent: "center" },
  avatarInitial:{ color: "#000", fontSize: 14, fontWeight: "900" },

  annBar:  { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  annText: { flex: 1, color: "#ddd", fontSize: 12 },
  annTime: { color: "#666", fontSize: 10 },
  annDots: { flexDirection: "row", gap: 3 },
  annDot:  { height: 4, borderRadius: 2 },

  ringsCard: { flexDirection: "row", alignItems: "center", gap: 16, backgroundColor: CARD, borderRadius: 24, padding: 16, marginBottom: 16 },
  ringsInfo: { flex: 1, gap: 10 },
  ringRow:   { flexDirection: "row", alignItems: "center", gap: 6 },
  ringDot:   { width: 10, height: 10, borderRadius: 5 },
  ringLabel: { color: MUTED, fontSize: 11, width: 52 },
  ringValue: { color: WHITE, fontSize: 12, fontWeight: "700", flex: 1 },
  ringUnit:  { color: "#555", fontSize: 11, fontWeight: "400" },

  workoutCard:  { backgroundColor: CARD, borderRadius: 24, padding: 16, marginBottom: 16 },
  aiBadge:      { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", backgroundColor: "rgba(200,255,0,0.12)", borderWidth: 1, borderColor: "rgba(200,255,0,0.25)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 10 },
  aiBadgeText:  { color: GREEN, fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  workoutTitle: { color: WHITE, fontSize: 17, fontWeight: "800", marginBottom: 4 },
  workoutDesc:  { color: MUTED, fontSize: 12, marginBottom: 12 },
  pillsRow:     { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  pill:         { backgroundColor: "#222", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  pillText:     { color: "#aaa", fontSize: 10, fontWeight: "500" },
  statsRow:     { flexDirection: "row", gap: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#2a2a2a", marginBottom: 14 },
  statItem:     { flexDirection: "row", alignItems: "center", gap: 4 },
  statText:     { color: MUTED, fontSize: 12 },
  startBtn:     { backgroundColor: GREEN, paddingVertical: 14, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  startBtnText: { color: "#000", fontSize: 14, fontWeight: "700" },

  insightCard:  { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: CARD, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "rgba(200,255,0,0.1)" },
  insightIcon:  { width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(200,255,0,0.1)", alignItems: "center", justifyContent: "center" },
  insightText:  { flex: 1, color: "#aaa", fontSize: 12, lineHeight: 18 },
  insightLabel: { color: GREEN, fontWeight: "600" },

  fab:    { position: "absolute", bottom: 96, right: 16, zIndex: 20 },
  fabBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: GREEN, alignItems: "center", justifyContent: "center", shadowColor: GREEN, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
});
