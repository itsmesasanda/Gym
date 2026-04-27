import React, { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BASE_URL } from "../config";
import { getUserEmail, getUserToken, clearUserEmail } from "../utils/session";
import SlideMenu from "../components/SlideMenu";

const API = BASE_URL;
const { width: SCREEN_WIDTH } = Dimensions.get("window");

const GREEN  = "#C7F000";
const BG     = "#0D0D0D";
const CARD   = "#1A1A1A";
const BORDER = "#2A2A2A";
const MUTED  = "#888888";
const WHITE  = "#FFFFFF";
const PURPLE = "#BF5AF2";
const BLUE   = "#64D2FF";
const ORANGE = "#FF9F0A";

const DUMMY_ANNOUNCEMENTS = [
  {
    id: "1",
    title: "Gym Closed on May 1st",
    description: "We will be closed for Labour Day. Regular hours resume May 2nd.",
    date: "2026-05-01",
    type: "notice",
  },
  {
    id: "2",
    title: "New Yoga Classes Available",
    description: "Starting next week, Monday and Wednesday evenings at 6 PM. Sign up at the front desk.",
    date: "2026-05-05",
    type: "event",
  },
  {
    id: "3",
    title: "Summer Body Challenge",
    description: "8-week transformation challenge starts May 10th. Prizes for top 3 finishers.",
    date: "2026-05-10",
    type: "event",
  },
  {
    id: "4",
    title: "Maintenance Notice",
    description: "Swimming pool maintenance scheduled for April 30th. Pool will be closed for the day.",
    date: "2026-04-30",
    type: "notice",
  },
];

export default function DashboardScreen({ navigation }) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [userName, setUserName] = useState("");
  const [announcements, setAnnouncements] = useState(DUMMY_ANNOUNCEMENTS);
  const [todayWorkout, setTodayWorkout] = useState(null);
  const [calorieData, setCalorieData] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0, goal: 2000 });

  const email = getUserEmail();

  const fetchAll = useCallback(async () => {
    if (!email) return;
    await Promise.all([fetchProfile(), fetchTodayWorkout(), fetchCalories()]);
  }, [email]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const fetchProfile = async () => {
    try {
      const token = getUserToken();
      const url = token
        ? `${API}/api/users/profile`
        : `${API}/api/users/profile?email=${encodeURIComponent(email)}`;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const r = await fetch(url, { headers });
      if (r.ok) {
        const data = await r.json();
        setUserName(data.name || "");
        if (data.calories) setCalorieData(prev => ({ ...prev, goal: data.calories }));
      }
    } catch (e) { console.error("fetchProfile:", e); }
  };

  const fetchTodayWorkout = async () => {
    try {
      const r = await fetch(`${API}/api/workout-plans?email=${encodeURIComponent(email)}`);
      if (!r.ok) return;
      const plans = await r.json();
      if (!plans.length) return;

      const latestPlan = plans[0];
      const today = new Date().getDay();
      const dayNumber = today === 0 ? 7 : today;

      const todayDay = latestPlan.days?.find(d => d.day_number === dayNumber);
      if (todayDay) {
        setTodayWorkout({ plan: latestPlan, day: todayDay });
      } else if (latestPlan.days?.length > 0) {
        setTodayWorkout({ plan: latestPlan, day: latestPlan.days[0] });
      }
    } catch (e) { console.error("fetchTodayWorkout:", e); }
  };

  const fetchCalories = async () => {
    try {
      const r = await fetch(`${API}/api/logs/${encodeURIComponent(email)}`);
      if (!r.ok) return;
      const logs = await r.json();
      if (!Array.isArray(logs)) return;

      const today = new Date().toISOString().split("T")[0];
      const todayLogs = logs.filter(l => {
        const logDate = new Date(l.timestamp || l.createdAt).toISOString().split("T")[0];
        return logDate === today;
      });

      const totals = todayLogs.reduce((acc, l) => ({
        calories: acc.calories + (l.calories || 0),
        protein: acc.protein + (l.protein || 0),
        carbs: acc.carbs + (l.carbs || 0),
        fats: acc.fats + (l.fats || 0),
      }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

      setCalorieData(prev => ({ ...prev, ...totals }));
    } catch (e) { console.error("fetchCalories:", e); }
  };

  const handleMenuNavigate = (key) => {
    if (key === "profile") navigation.navigate("Profile");
    else if (key === "calories") navigation.navigate("CalorieLog");
    else if (key === "workouts") navigation.navigate("WorkoutLog");
    else if (key === "videos") navigation.navigate("VideoLib");
  };

  const handleLogout = () => {
    clearUserEmail();
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const calorieProgress = calorieData.goal > 0
    ? Math.min(Math.round((calorieData.calories / calorieData.goal) * 100), 100) : 0;
  const remaining = Math.max(calorieData.goal - calorieData.calories, 0);

  return (
    <SafeAreaView style={s.container}>
      <SlideMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onNavigate={handleMenuNavigate}
        onLogout={handleLogout}
        userName={userName}
      />

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => setMenuVisible(true)} style={s.hamburger}>
            <View style={s.hamburgerLine} />
            <View style={[s.hamburgerLine, { width: 16 }]} />
            <View style={s.hamburgerLine} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.greeting}>{greeting()}</Text>
            <Text style={s.headerName}>{userName || "there"}</Text>
          </View>
          <View style={s.headerRight} />
        </View>

        {/* Announcements Carousel */}
        {announcements.length > 0 && (
          <View style={s.announcementSection}>
            <Text style={s.sectionLabel}>NOTICES & EVENTS</Text>
            <FlatList
              data={announcements}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={s.announcementScroll}
              snapToInterval={SCREEN_WIDTH * 0.78 + 12}
              decelerationRate="fast"
              renderItem={({ item }) => (
                <View style={[s.announcementCard, item.type === "notice" ? s.noticeCard : s.eventCard]}>
                  <View style={s.announcementTagRow}>
                    <View style={[s.announcementTag, item.type === "notice" ? s.noticeTag : s.eventTag]}>
                      <Text style={s.announcementTagText}>{item.type === "notice" ? "NOTICE" : "EVENT"}</Text>
                    </View>
                    {item.date && (
                      <Text style={s.announcementDate}>
                        {new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </Text>
                    )}
                  </View>
                  <Text style={s.announcementTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={s.announcementDesc} numberOfLines={3}>{item.description}</Text>
                </View>
              )}
            />
          </View>
        )}

        {/* Today's Workout */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>TODAY'S WORKOUT</Text>
          {todayWorkout ? (
            <View style={s.workoutCard}>
              <View style={s.workoutHeader}>
                <View>
                  <Text style={s.workoutFocus}>{todayWorkout.day.focus}</Text>
                  <Text style={s.workoutPlan}>{todayWorkout.plan.title}</Text>
                </View>
                <View style={s.dayBadge}>
                  <Text style={s.dayBadgeText}>Day {todayWorkout.day.day_number}</Text>
                </View>
              </View>

              {todayWorkout.day.exercises?.length === 0 ? (
                <View style={s.restDayBox}>
                  <Text style={s.restDayText}>Rest Day</Text>
                  <Text style={s.restDaySubtext}>Recovery is part of the process</Text>
                </View>
              ) : (
                <View style={s.exerciseList}>
                  {todayWorkout.day.exercises?.map((ex, i) => (
                    <View key={i} style={s.exerciseRow}>
                      <View style={s.exerciseIndex}>
                        <Text style={s.exerciseIndexText}>{i + 1}</Text>
                      </View>
                      <View style={s.exerciseInfo}>
                        <Text style={s.exerciseName}>{ex.name}</Text>
                        {ex.notes ? <Text style={s.exerciseNotes}>{ex.notes}</Text> : null}
                      </View>
                      <Text style={s.exerciseMeta}>{ex.sets} x {ex.reps}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View style={s.emptyCard}>
              <Text style={s.emptyTitle}>No workout plan yet</Text>
              <Text style={s.emptySubtext}>Generate one from the AI Workouts tab</Text>
            </View>
          )}
        </View>

        {/* Daily Nutrition */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>DAILY NUTRITION</Text>
          <View style={s.calorieCard}>
            <View style={s.calorieTopRow}>
              <View>
                <Text style={s.calorieConsumed}>{Math.round(calorieData.calories)}</Text>
                <Text style={s.calorieOfGoal}>of {calorieData.goal} kcal</Text>
              </View>
              <View style={s.calorieRight}>
                <Text style={s.calorieRemaining}>{Math.round(remaining)}</Text>
                <Text style={s.calorieRemainingLabel}>remaining</Text>
              </View>
            </View>

            <View style={s.progressBarBg}>
              <View style={[s.progressBarFill, { width: `${calorieProgress}%` }]} />
            </View>

            <View style={s.macroRow}>
              <View style={s.macroItem}>
                <View style={[s.macroIndicator, { backgroundColor: BLUE }]} />
                <View>
                  <Text style={s.macroValue}>{Math.round(calorieData.protein)}g</Text>
                  <Text style={s.macroLabel}>Protein</Text>
                </View>
              </View>
              <View style={s.macroItem}>
                <View style={[s.macroIndicator, { backgroundColor: ORANGE }]} />
                <View>
                  <Text style={s.macroValue}>{Math.round(calorieData.carbs)}g</Text>
                  <Text style={s.macroLabel}>Carbs</Text>
                </View>
              </View>
              <View style={s.macroItem}>
                <View style={[s.macroIndicator, { backgroundColor: PURPLE }]} />
                <View>
                  <Text style={s.macroValue}>{Math.round(calorieData.fats)}g</Text>
                  <Text style={s.macroLabel}>Fat</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Daily Rings */}
        <View style={s.section}>
          <View style={s.ringsCard}>
            <Text style={s.ringsTitle}>Daily Rings</Text>
            <View style={s.ringsLayout}>
              <View style={s.ringOuter}>
                <View style={s.ringMid}>
                  <View style={s.ringInner}>
                    <Text style={s.ringValue}>{calorieProgress}</Text>
                    <Text style={s.ringPercent}>%</Text>
                  </View>
                </View>
              </View>
              <View style={s.ringsInfo}>
                <View style={s.ringRow}>
                  <View style={[s.ringDot, { backgroundColor: "#ff6c3a" }]} />
                  <Text style={s.ringLabel}>Calories</Text>
                  <View style={{ flex: 1 }} />
                  <Text style={s.ringStat}>{Math.round(calorieData.calories)}</Text>
                </View>
                <View style={s.ringRow}>
                  <View style={[s.ringDot, { backgroundColor: BLUE }]} />
                  <Text style={s.ringLabel}>Protein</Text>
                  <View style={{ flex: 1 }} />
                  <Text style={s.ringStat}>{Math.round(calorieData.protein)}g</Text>
                </View>
                <View style={s.ringRemainingBox}>
                  <Text style={s.ringRemainingText}>{Math.round(remaining)} kcal remaining</Text>
                  <Text style={s.ringRemainingText}>{Math.max(150 - Math.round(calorieData.protein), 0)}g protein left</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>QUICK ACTIONS</Text>
          <View style={s.quickGrid}>
            <TouchableOpacity style={s.quickCard} onPress={() => navigation.navigate("AIWorkouts")}>
              <Text style={s.quickTitle}>Generate Plan</Text>
              <Text style={s.quickSub}>AI Workout</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.quickCard} onPress={() => navigation.navigate("AIMeals")}>
              <Text style={s.quickTitle}>Get Meals</Text>
              <Text style={s.quickSub}>AI Nutrition</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.quickCard} onPress={() => navigation.navigate("Progress")}>
              <Text style={s.quickTitle}>Track Progress</Text>
              <Text style={s.quickSub}>Body Stats</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.quickCard} onPress={() => handleMenuNavigate("calories")}>
              <Text style={s.quickTitle}>Log Calories</Text>
              <Text style={s.quickSub}>Daily Intake</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scroll: { flex: 1 },

  header: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 16,
    paddingTop: 16, paddingBottom: 12,
  },
  hamburger: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: CARD,
    alignItems: "center", justifyContent: "center", gap: 5,
    borderWidth: 1, borderColor: BORDER,
  },
  hamburgerLine: { width: 20, height: 2, backgroundColor: WHITE, borderRadius: 1 },
  headerCenter: { flex: 1, marginLeft: 14 },
  greeting: { color: MUTED, fontSize: 12, fontWeight: "500" },
  headerName: { color: WHITE, fontSize: 20, fontWeight: "900", marginTop: 1 },
  headerRight: { width: 40 },

  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionLabel: {
    color: MUTED, fontSize: 10, fontWeight: "800",
    letterSpacing: 1.5, marginBottom: 12,
  },

  announcementSection: { marginTop: 20, paddingLeft: 16 },
  announcementScroll: { paddingRight: 16, gap: 12 },
  announcementCard: {
    width: SCREEN_WIDTH * 0.78, backgroundColor: CARD, borderRadius: 14,
    padding: 16, borderWidth: 1, borderColor: BORDER, borderLeftWidth: 3,
  },
  noticeCard: { borderLeftColor: ORANGE },
  eventCard: { borderLeftColor: GREEN },
  announcementTagRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  announcementTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  noticeTag: { backgroundColor: "rgba(255, 159, 10, 0.15)" },
  eventTag: { backgroundColor: "rgba(199, 240, 0, 0.15)" },
  announcementTagText: { fontSize: 9, fontWeight: "800", color: WHITE, letterSpacing: 1 },
  announcementDate: { color: MUTED, fontSize: 11 },
  announcementTitle: { color: WHITE, fontSize: 15, fontWeight: "800", marginBottom: 6 },
  announcementDesc: { color: MUTED, fontSize: 12, lineHeight: 17 },

  workoutCard: {
    backgroundColor: CARD, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: BORDER,
    borderLeftWidth: 3, borderLeftColor: GREEN,
  },
  workoutHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: 14,
  },
  workoutFocus: { color: WHITE, fontSize: 18, fontWeight: "800" },
  workoutPlan: { color: MUTED, fontSize: 11, marginTop: 3 },
  dayBadge: {
    backgroundColor: "rgba(199,240,0,0.12)", paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 6,
  },
  dayBadgeText: { color: GREEN, fontSize: 11, fontWeight: "700" },

  restDayBox: { alignItems: "center", paddingVertical: 20 },
  restDayText: { color: WHITE, fontSize: 16, fontWeight: "700" },
  restDaySubtext: { color: MUTED, fontSize: 12, marginTop: 4 },

  exerciseList: { gap: 2 },
  exerciseRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  exerciseIndex: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: "rgba(199,240,0,0.12)",
    alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  exerciseIndexText: { color: GREEN, fontSize: 11, fontWeight: "800" },
  exerciseInfo: { flex: 1 },
  exerciseName: { color: WHITE, fontSize: 14, fontWeight: "600" },
  exerciseNotes: { color: MUTED, fontSize: 11, marginTop: 2 },
  exerciseMeta: { color: GREEN, fontSize: 12, fontWeight: "700" },

  emptyCard: {
    backgroundColor: CARD, borderRadius: 14, padding: 32,
    borderWidth: 1, borderColor: BORDER, alignItems: "center",
  },
  emptyTitle: { color: WHITE, fontSize: 15, fontWeight: "700", marginBottom: 4 },
  emptySubtext: { color: MUTED, fontSize: 12 },

  calorieCard: {
    backgroundColor: CARD, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: BORDER,
  },
  calorieTopRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-end", marginBottom: 14,
  },
  calorieConsumed: { color: WHITE, fontSize: 34, fontWeight: "900", lineHeight: 36 },
  calorieOfGoal: { color: MUTED, fontSize: 12, marginTop: 2 },
  calorieRight: { alignItems: "flex-end" },
  calorieRemaining: { color: GREEN, fontSize: 22, fontWeight: "800" },
  calorieRemainingLabel: { color: MUTED, fontSize: 11 },

  progressBarBg: {
    height: 5, backgroundColor: BORDER, borderRadius: 3,
    marginBottom: 16, overflow: "hidden",
  },
  progressBarFill: { height: "100%", backgroundColor: GREEN, borderRadius: 3 },

  macroRow: { flexDirection: "row", justifyContent: "space-between" },
  macroItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  macroIndicator: { width: 3, height: 28, borderRadius: 2 },
  macroValue: { color: WHITE, fontSize: 15, fontWeight: "800" },
  macroLabel: { color: MUTED, fontSize: 10, textTransform: "uppercase", fontWeight: "600" },

  // Daily Rings
  ringsCard: {
    backgroundColor: CARD, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: BORDER,
  },
  ringsTitle: { color: WHITE, fontSize: 16, fontWeight: "800", marginBottom: 14 },
  ringsLayout: { flexDirection: "row", alignItems: "center", gap: 20 },
  ringOuter: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 4, borderColor: "#333",
    alignItems: "center", justifyContent: "center",
  },
  ringMid: {
    width: 62, height: 62, borderRadius: 31,
    borderWidth: 3, borderColor: "#2A2A2A",
    alignItems: "center", justifyContent: "center",
  },
  ringInner: { alignItems: "center" },
  ringValue: { color: WHITE, fontSize: 18, fontWeight: "900" },
  ringPercent: { color: MUTED, fontSize: 10 },
  ringsInfo: { flex: 1, gap: 8 },
  ringRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  ringDot: { width: 8, height: 8, borderRadius: 4 },
  ringLabel: { color: WHITE, fontSize: 14, fontWeight: "600" },
  ringStat: { color: WHITE, fontSize: 15, fontWeight: "800" },
  ringRemainingBox: {
    backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 8,
    padding: 8, marginTop: 4,
  },
  ringRemainingText: { color: MUTED, fontSize: 12 },

  // Quick actions
  quickGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 10,
  },
  quickCard: {
    width: "48%", backgroundColor: CARD, borderRadius: 12,
    padding: 16, borderWidth: 1, borderColor: BORDER,
  },
  quickTitle: { color: WHITE, fontSize: 14, fontWeight: "700", marginBottom: 3 },
  quickSub: { color: MUTED, fontSize: 11 },
});
