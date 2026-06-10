import React, { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LineChart } from "react-native-chart-kit";
import { BASE_URL } from "../config";
import { getUserEmail } from "../utils/session";
import { authFetch } from "../utils/authFetch";

const GREEN  = "#C7F000";
const BG     = "#000000";
const CARD   = "#1C1C1E";
const BORDER = "#2C2C2E";
const MUTED  = "#A1A1A6";
const WHITE  = "#FFFFFF";
const RED    = "#FF3B30";
const ORANGE = "#FF9500";

const { width: SW } = Dimensions.get("window");

const MUSCLE_GROUPS = ["Chest", "Back", "Legs", "Arms", "Shoulders", "Biceps", "Triceps", "Core"];

// ── Helpers ───────────────────────────────────────────────────────
const todayStr = () =>
  new Date().toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" });
const timeStr = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};
const parseNum = (v) => { const n = Number(v); return Number.isFinite(n) ? n : null; };

const mondayOf = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
};
const weekKey = (date) => mondayOf(date).toISOString().slice(0, 10);
const weekRangeLabel = (key) => {
  const mon = new Date(key + "T00:00:00");
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  const f = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${f(mon)} – ${f(sun)}`;
};

const groupByWeek = (items) => {
  const acc = {};
  items.forEach((w) => {
    const d = new Date(w.createdAt || w.date);
    if (isNaN(d)) return;
    const wk = weekKey(d);
    const dk = d.toISOString().slice(0, 10);
    const dlabel = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    if (!acc[wk]) acc[wk] = {};
    if (!acc[wk][dk]) acc[wk][dk] = { label: dlabel, items: [] };
    acc[wk][dk].items.push(w);
  });
  return acc;
};

// ── Main Component ────────────────────────────────────────────────
export default function WorkoutScreen({ navigation, route }) {
  const [tab, setTab]           = useState("today");
  const [workouts, setWorkouts] = useState([]);
  const [plans, setPlans]       = useState([]);

  // Log form
  const [showLog,  setShowLog]  = useState(false);
  const [logName,  setLogName]  = useState("");
  const [logMG,    setLogMG]    = useState("Chest");
  const [logSets,  setLogSets]  = useState([{ reps: "", weight: "" }]);
  const [logNotes, setLogNotes] = useState("");

  // Today tab — which plan day is selected
  const [planDay, setPlanDay] = useState(1);

  // History drill-down
  const [histLevel, setHistLevel] = useState("weeks");
  const [histWeek,  setHistWeek]  = useState(null);
  const [histDay,   setHistDay]   = useState(null);

  // Plan tab
  const [planView,   setPlanView]   = useState("list"); // list | viewer
  const [viewedPlan, setViewedPlan] = useState(null);
  const [editEx,     setEditEx]     = useState(null);   // { dayIdx, exIdx }
  const [editForm,   setEditForm]   = useState({ name: "", sets: "", reps: "", notes: "" });

  // Progress tab
  const [selEx,   setSelEx]   = useState(null);
  const [tooltip, setTooltip] = useState(null);

  const email = getUserEmail();

  const fetchWorkouts = useCallback(async () => {
    try {
      const r = await authFetch(`${BASE_URL}/api/workouts`);
      if (r.ok) setWorkouts(await r.json());
    } catch {}
  }, []);

  const fetchPlans = useCallback(async () => {
    if (!email) return;
    try {
      const r = await authFetch(`${BASE_URL}/api/workout-plans`);
      if (r.ok) {
        const data = await r.json();
        setPlans(Array.isArray(data) ? data : []);
      }
    } catch {}
  }, [email]);

  useFocusEffect(
    useCallback(() => {
      fetchWorkouts();
      fetchPlans();
    }, [fetchWorkouts, fetchPlans])
  );

  useEffect(() => {
    if (route?.params?.openTab) {
      setTab(route.params.openTab);
      navigation.setParams({ openTab: undefined });
    }
  }, [route?.params?.openTab]);

  // ── Log save ──────────────────────────────────────────────────
  const saveLog = async () => {
    if (logName.trim().length < 2) { Alert.alert("Invalid", "Enter an exercise name."); return; }
    try {
      const r = await authFetch(`${BASE_URL}/api/workouts`, {
        method: "POST",
        body: JSON.stringify({
          exerciseName: logName.trim(),
          muscleGroup:  logMG,
          notes:        logNotes.trim(),
          duration:     0,
          sets:         logSets.map((s) => ({ reps: parseNum(s.reps), weight: parseNum(s.weight) })),
          date:         todayStr(),
          time:         timeStr(),
        }),
      });
      if (!r.ok) throw new Error("Save failed");
      await fetchWorkouts();
      closeLog();
    } catch (e) { Alert.alert("Error", e.message); }
  };

  const openLog = (name = "") => {
    setLogName(name); setLogMG("Chest");
    setLogSets([{ reps: "", weight: "" }]); setLogNotes("");
    setShowLog(true);
  };
  const closeLog = () => {
    setShowLog(false);
    setLogName(""); setLogMG("Chest");
    setLogSets([{ reps: "", weight: "" }]); setLogNotes("");
  };

  // ── Plan exercise edit ────────────────────────────────────────
  const openEditEx = (dayIdx, exIdx) => {
    const ex = viewedPlan.days[dayIdx].exercises[exIdx];
    setEditForm({ name: ex.name, sets: String(ex.sets), reps: ex.reps, notes: ex.notes || "" });
    setEditEx({ dayIdx, exIdx });
  };

  const saveEditEx = async () => {
    if (!viewedPlan || !editEx) return;
    const updated = JSON.parse(JSON.stringify(viewedPlan));
    updated.days[editEx.dayIdx].exercises[editEx.exIdx] = {
      name:  editForm.name.trim(),
      sets:  parseInt(editForm.sets) || 3,
      reps:  editForm.reps.trim() || "10-12",
      notes: editForm.notes.trim() || null,
    };
    try {
      const r = await authFetch(`${BASE_URL}/api/workout-plans/${viewedPlan._id}`, {
        method: "PATCH",
        body: JSON.stringify({ days: updated.days }),
      });
      if (!r.ok) throw new Error("Update failed");
      const saved = await r.json();
      setViewedPlan(saved);
      setPlans((prev) => prev.map((p) => (p._id === saved._id ? saved : p)));
      setEditEx(null);
    } catch (e) { Alert.alert("Error", e.message); }
  };

  // ── Derived data ──────────────────────────────────────────────
  const today         = todayStr();
  const todayWorkouts = workouts.filter((w) => w.date === today);

  // Today's plan — most recently created
  const currentPlan = plans[0] || null;
  const planDays    = currentPlan?.days || [];
  const selPlanDay  = planDays.find((d) => d.day_number === planDay) || planDays[0] || null;

  // History grouping
  const byWeek   = groupByWeek(workouts);
  const weekKeys = Object.keys(byWeek).sort().reverse();
  const histDays = histWeek ? (byWeek[histWeek] || {}) : {};
  const dayKeys  = Object.keys(histDays).sort().reverse();
  const histItems = (histDay && histDays[histDay]) ? histDays[histDay].items : [];

  // Progress
  const uniqueExercises = [...new Set(workouts.map((w) => w.exerciseName))];
  const activeEx        = selEx || uniqueExercises[0] || null;

  const progressSessions = workouts
    .filter((w) => w.exerciseName === activeEx)
    .map((w) => {
      const d = new Date(w.createdAt || w.date);
      return {
        dateObj:   d,
        shortDate: `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
        fullDate:  d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        maxWeight: Math.max(...(w.sets?.map((s) => s.weight || 0) || [0])),
        sets:      w.sets?.length || 0,
        reps:      w.sets?.reduce((n, s) => n + (s.reps || 0), 0) || 0,
      };
    })
    .sort((a, b) => a.dateObj - b.dateObj)
    .slice(-8);

  // ── LOG FORM (full-screen) ────────────────────────────────────
  if (showLog) {
    return (
      <SafeAreaView style={s.container} edges={["top"]}>
        <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 80 }} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={s.backRow} onPress={closeLog}>
            <Feather name="arrow-left" size={18} color={MUTED} />
            <Text style={s.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={s.pageTitle}>Log Exercise</Text>

          <View style={s.formCard}>
            <Text style={s.formLabel}>Exercise Name</Text>
            <TextInput style={s.formInput} placeholder="e.g. Bench Press" placeholderTextColor="#555" value={logName} onChangeText={setLogName} />
          </View>

          <View style={s.formCard}>
            <Text style={s.formLabel}>Muscle Group</Text>
            <View style={s.muscleGrid}>
              {MUSCLE_GROUPS.map((mg) => (
                <TouchableOpacity key={mg} style={[s.muscleBtn, logMG === mg && s.muscleBtnActive]} onPress={() => setLogMG(mg)}>
                  <Text style={[s.muscleBtnText, logMG === mg && s.muscleBtnTextActive]}>{mg}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Text style={s.setsTitle}>Sets</Text>
          {logSets.map((set, i) => (
            <View key={i} style={s.setCard}>
              <Text style={s.setNum}>Set {i + 1}</Text>
              <View style={s.setRowInner}>
                <TextInput style={s.setInput} placeholder="Reps"   placeholderTextColor="#555" keyboardType="numeric" value={set.reps}   onChangeText={(v) => setLogSets((p) => p.map((x, j) => j === i ? { ...x, reps:   v } : x))} />
                <TextInput style={s.setInput} placeholder="kg"     placeholderTextColor="#555" keyboardType="numeric" value={set.weight} onChangeText={(v) => setLogSets((p) => p.map((x, j) => j === i ? { ...x, weight: v } : x))} />
              </View>
            </View>
          ))}
          {logSets.length < 6 && (
            <TouchableOpacity style={s.addSetBtn} onPress={() => setLogSets((p) => [...p, { reps: "", weight: "" }])}>
              <Feather name="plus" size={16} color={GREEN} />
              <Text style={s.addSetText}>Add Set</Text>
            </TouchableOpacity>
          )}

          <View style={s.formCard}>
            <Text style={s.formLabel}>Notes (optional)</Text>
            <TextInput style={[s.formInput, { height: 70, textAlignVertical: "top" }]} placeholder="How did it feel?" placeholderTextColor="#555" multiline value={logNotes} onChangeText={setLogNotes} />
          </View>

          <TouchableOpacity style={s.saveBtn} onPress={saveLog}>
            <Feather name="check" size={16} color="#000" />
            <Text style={s.saveBtnText}>Save Workout</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── EDIT EXERCISE (full-screen) ───────────────────────────────
  if (editEx !== null && viewedPlan) {
    return (
      <SafeAreaView style={s.container} edges={["top"]}>
        <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 80 }} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={s.backRow} onPress={() => setEditEx(null)}>
            <Feather name="arrow-left" size={18} color={MUTED} />
            <Text style={s.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={s.pageTitle}>Edit Exercise</Text>

          <View style={s.formCard}>
            <Text style={s.formLabel}>Exercise Name</Text>
            <TextInput style={s.formInput} placeholder="e.g. Bench Press" placeholderTextColor="#555" value={editForm.name} onChangeText={(v) => setEditForm((f) => ({ ...f, name: v }))} />
            <Text style={[s.formLabel, { marginTop: 14 }]}>Sets</Text>
            <TextInput style={s.formInput} placeholder="e.g. 3" placeholderTextColor="#555" keyboardType="numeric" value={editForm.sets} onChangeText={(v) => setEditForm((f) => ({ ...f, sets: v }))} />
            <Text style={[s.formLabel, { marginTop: 14 }]}>Reps</Text>
            <TextInput style={s.formInput} placeholder="e.g. 8-12 or 10" placeholderTextColor="#555" value={editForm.reps} onChangeText={(v) => setEditForm((f) => ({ ...f, reps: v }))} />
            <Text style={[s.formLabel, { marginTop: 14 }]}>Notes (optional)</Text>
            <TextInput style={[s.formInput, { height: 70, textAlignVertical: "top" }]} placeholder="Any notes..." placeholderTextColor="#555" multiline value={editForm.notes} onChangeText={(v) => setEditForm((f) => ({ ...f, notes: v }))} />
          </View>

          <TouchableOpacity style={s.saveBtn} onPress={saveEditEx}>
            <Feather name="check" size={16} color="#000" />
            <Text style={s.saveBtnText}>Save Changes</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── MAIN SCREEN ───────────────────────────────────────────────
  return (
    <SafeAreaView style={s.container} edges={["top"]}>

      {/* Header */}
      <View style={s.topHeader}>
        <Text style={s.screenTitle}>Train</Text>
        {tab === "today" && (
          <TouchableOpacity style={s.addBtn} onPress={() => openLog()}>
            <Feather name="plus" size={18} color="#000" />
          </TouchableOpacity>
        )}
      </View>

      {/* 4-tab pill bar */}
      <View style={s.tabWrap}>
        <View style={s.tabRow}>
          {["Today", "History", "Plan", "Progress"].map((t) => (
            <TouchableOpacity
              key={t}
              style={[s.tabPill, tab === t.toLowerCase() && s.tabPillActive]}
              onPress={() => {
                setTab(t.toLowerCase());
                if (t === "History") { setHistLevel("weeks"); setHistWeek(null); setHistDay(null); }
                if (t === "Plan")    { setPlanView("list"); setViewedPlan(null); }
              }}
            >
              <Text style={[s.tabPillText, tab === t.toLowerCase() && s.tabPillTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ══ TODAY ══════════════════════════════════════════════ */}
      {tab === "today" && (
        <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }} keyboardShouldPersistTaps="handled">

          {currentPlan ? (
            <>
              <View style={s.sectionHead}>
                <Text style={s.sectionLabel}>Today's Plan</Text>
                <Text style={s.sectionSub} numberOfLines={1}>{currentPlan.title}</Text>
              </View>

              {/* Day picker */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }} contentContainerStyle={{ gap: 8, paddingRight: 4 }}>
                {planDays.map((d) => (
                  <TouchableOpacity
                    key={d.day_number}
                    style={[s.dayChip, planDay === d.day_number && s.dayChipActive]}
                    onPress={() => setPlanDay(d.day_number)}
                  >
                    <Text style={[s.dayChipText, planDay === d.day_number && s.dayChipTextActive]}>Day {d.day_number}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {selPlanDay && (
                <View style={s.planDayCard}>
                  <View style={s.planDayHeader}>
                    <View style={s.dayBadge}><Text style={s.dayBadgeText}>{selPlanDay.day_number}</Text></View>
                    <Text style={s.planDayFocus}>{selPlanDay.focus}</Text>
                  </View>
                  {selPlanDay.exercises?.length === 0 ? (
                    <Text style={s.restText}>Rest Day — recover well</Text>
                  ) : (
                    selPlanDay.exercises?.map((ex, i) => (
                      <View key={i} style={s.planExRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={s.planExName}>{ex.name}</Text>
                          <Text style={s.planExMeta}>{ex.sets} sets × {ex.reps}</Text>
                        </View>
                        <TouchableOpacity style={s.logItBtn} onPress={() => openLog(ex.name)}>
                          <Text style={s.logItText}>Log</Text>
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                </View>
              )}
            </>
          ) : (
            <TouchableOpacity style={s.emptyCard} onPress={() => setTab("plan")}>
              <MaterialCommunityIcons name="dumbbell" size={26} color="#333" style={{ marginBottom: 8 }} />
              <Text style={s.emptyText}>No active plan.</Text>
              <Text style={s.emptySubText}>Tap to go to the Plan tab and create one.</Text>
            </TouchableOpacity>
          )}

          <Text style={[s.sectionLabel, { marginTop: currentPlan ? 20 : 0, marginBottom: 10 }]}>Logged Today</Text>
          {todayWorkouts.length === 0 ? (
            <View style={s.emptyCard}>
              <Text style={s.emptyText}>Nothing logged yet.</Text>
              <Text style={s.emptySubText}>Tap Log on a plan exercise or + for a custom one.</Text>
            </View>
          ) : (
            todayWorkouts.map((w) => <LoggedCard key={w._id} workout={w} />)
          )}
        </ScrollView>
      )}

      {/* ══ HISTORY ════════════════════════════════════════════ */}
      {tab === "history" && (
        <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }} keyboardShouldPersistTaps="handled">

          {/* Weeks */}
          {histLevel === "weeks" && (
            weekKeys.length === 0 ? (
              <View style={s.emptyCard}>
                <Feather name="clock" size={26} color="#333" style={{ marginBottom: 8 }} />
                <Text style={s.emptyText}>No history yet.</Text>
              </View>
            ) : weekKeys.map((wk) => {
              const days  = byWeek[wk];
              const nDays = Object.keys(days).length;
              const nEx   = Object.values(days).reduce((n, d) => n + d.items.length, 0);
              return (
                <TouchableOpacity key={wk} style={s.histCard} onPress={() => { setHistWeek(wk); setHistLevel("days"); }} activeOpacity={0.8}>
                  <View style={s.histAccent} />
                  <View style={s.histBody}>
                    <Text style={s.histTitle}>Week of {weekRangeLabel(wk)}</Text>
                    <Text style={s.histSub}>{nDays} day{nDays !== 1 ? "s" : ""}  ·  {nEx} exercise{nEx !== 1 ? "s" : ""}</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={MUTED} style={{ alignSelf: "center", marginRight: 14 }} />
                </TouchableOpacity>
              );
            })
          )}

          {/* Days */}
          {histLevel === "days" && (
            <>
              <TouchableOpacity style={s.backRow} onPress={() => { setHistLevel("weeks"); setHistWeek(null); }}>
                <Feather name="arrow-left" size={16} color={MUTED} />
                <Text style={s.backText}>{weekRangeLabel(histWeek)}</Text>
              </TouchableOpacity>
              {dayKeys.map((dk) => {
                const { label, items } = histDays[dk];
                return (
                  <TouchableOpacity key={dk} style={s.histCard} onPress={() => { setHistDay(dk); setHistLevel("exercises"); }} activeOpacity={0.8}>
                    <View style={s.histAccent} />
                    <View style={s.histBody}>
                      <Text style={s.histTitle}>{label}</Text>
                      <Text style={s.histSub}>{items.length} exercise{items.length !== 1 ? "s" : ""}</Text>
                    </View>
                    <Feather name="chevron-right" size={18} color={MUTED} style={{ alignSelf: "center", marginRight: 14 }} />
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          {/* Exercises */}
          {histLevel === "exercises" && (
            <>
              <TouchableOpacity style={s.backRow} onPress={() => { setHistLevel("days"); setHistDay(null); }}>
                <Feather name="arrow-left" size={16} color={MUTED} />
                <Text style={s.backText}>{histDays[histDay]?.label}</Text>
              </TouchableOpacity>
              {histItems.length === 0
                ? <Text style={s.noDataText}>No exercises found.</Text>
                : histItems.map((w) => <LoggedCard key={w._id} workout={w} showMeta />)
              }
            </>
          )}
        </ScrollView>
      )}

      {/* ══ PLAN ═══════════════════════════════════════════════ */}
      {tab === "plan" && (
        <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }} keyboardShouldPersistTaps="handled">

          {planView === "list" && (
            plans.length === 0 ? (
              <View style={s.emptyCard}>
                <MaterialCommunityIcons name="robot-outline" size={26} color="#333" style={{ marginBottom: 8 }} />
                <Text style={s.emptyText}>No AI plans yet.</Text>
                <Text style={s.emptySubText}>Chat with AI Coach and tap "Generate Workout Plan".</Text>
              </View>
            ) : plans.map((p) => (
              <TouchableOpacity key={p._id} style={s.planCard} onPress={() => { setViewedPlan(p); setPlanView("viewer"); }} activeOpacity={0.85}>
                <View style={s.planAccent} />
                <View style={s.planBody}>
                  <Text style={s.planTitle} numberOfLines={1}>{p.title}</Text>
                  <Text style={s.planGoal}>Goal: {p.goal}</Text>
                  <Text style={s.planDate}>{new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</Text>
                </View>
                <Feather name="chevron-right" size={18} color={MUTED} style={{ alignSelf: "center", marginRight: 14 }} />
              </TouchableOpacity>
            ))
          )}

          {planView === "viewer" && viewedPlan && (
            <>
              <TouchableOpacity style={s.backRow} onPress={() => { setPlanView("list"); setViewedPlan(null); }}>
                <Feather name="arrow-left" size={16} color={MUTED} />
                <Text style={s.backText}>All Plans</Text>
              </TouchableOpacity>
              <Text style={s.pageTitle}>{viewedPlan.title}</Text>
              <Text style={s.pageSub}>Goal: {viewedPlan.goal}</Text>

              {viewedPlan.days?.map((day, dayIdx) => (
                <View key={dayIdx} style={s.planDayCard}>
                  <View style={s.planDayHeader}>
                    <View style={s.dayBadge}><Text style={s.dayBadgeText}>{day.day_number}</Text></View>
                    <Text style={s.planDayFocus}>{day.focus}</Text>
                  </View>
                  {day.exercises?.length === 0 ? (
                    <Text style={s.restText}>Rest Day</Text>
                  ) : day.exercises?.map((ex, exIdx) => (
                    <View key={exIdx} style={s.planExRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.planExName}>{ex.name}</Text>
                        <Text style={s.planExMeta}>{ex.sets} sets × {ex.reps}</Text>
                        {ex.notes ? <Text style={s.planExNotes}>{ex.notes}</Text> : null}
                      </View>
                      <TouchableOpacity style={s.editExBtn} onPress={() => openEditEx(dayIdx, exIdx)}>
                        <Feather name="edit-2" size={13} color={MUTED} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ))}

              <TouchableOpacity
                style={s.deleteBtn}
                onPress={() => Alert.alert("Delete plan?", "This cannot be undone.", [
                  { text: "Cancel", style: "cancel" },
                  { text: "Delete", style: "destructive", onPress: async () => {
                    try {
                      await authFetch(`${BASE_URL}/api/workout-plans/${viewedPlan._id}`, { method: "DELETE" });
                      await fetchPlans();
                      setPlanView("list"); setViewedPlan(null);
                    } catch { Alert.alert("Error", "Could not delete."); }
                  }},
                ])}
              >
                <Feather name="trash-2" size={14} color={WHITE} />
                <Text style={s.deleteBtnText}>Delete Plan</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      )}

      {/* ══ PROGRESS ═══════════════════════════════════════════ */}
      {tab === "progress" && (
        <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }} keyboardShouldPersistTaps="handled">

          <Text style={[s.sectionLabel, { marginBottom: 12 }]}>Select Exercise</Text>

          {uniqueExercises.length === 0 ? (
            <View style={s.emptyCard}>
              <Text style={s.emptyText}>Log some exercises to see progress.</Text>
            </View>
          ) : (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 8, paddingRight: 4 }}>
                {uniqueExercises.map((ex) => (
                  <TouchableOpacity key={ex} style={[s.exPill, activeEx === ex && s.exPillActive]} onPress={() => { setSelEx(ex); setTooltip(null); }}>
                    <Text style={[s.exPillText, activeEx === ex && s.exPillTextActive]}>{ex}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Chart */}
              <View style={s.progressCard}>
                <View style={s.progressCardHead}>
                  <Feather name="trending-up" size={15} color={GREEN} />
                  <Text style={s.progressCardTitle}>Max Weight Progress</Text>
                </View>

                {progressSessions.length < 2 ? (
                  <Text style={s.noDataText}>Log at least 2 sessions to see a chart.</Text>
                ) : (
                  <>
                    {tooltip !== null && progressSessions[tooltip.index] && (
                      <View style={s.tooltipBox}>
                        <Text style={s.tooltipDate}>{progressSessions[tooltip.index].shortDate}</Text>
                        <Text style={s.tooltipVal}>Max Weight (kg) : {tooltip.value}</Text>
                      </View>
                    )}
                    <LineChart
                      data={{
                        labels:   progressSessions.map((p) => p.shortDate),
                        datasets: [{ data: progressSessions.map((p) => p.maxWeight) }],
                      }}
                      width={SW - 64}
                      height={180}
                      chartConfig={{
                        backgroundColor:         CARD,
                        backgroundGradientFrom:  CARD,
                        backgroundGradientTo:    CARD,
                        decimalPlaces:           0,
                        color:       (o = 1) => `rgba(199,240,0,${o})`,
                        labelColor:  ()     => MUTED,
                        propsForDots:            { r: "5", strokeWidth: "2", stroke: GREEN },
                        propsForBackgroundLines: { stroke: BORDER, strokeDasharray: "" },
                      }}
                      bezier
                      onDataPointClick={({ index, value }) => setTooltip({ index, value })}
                      style={{ borderRadius: 12, marginVertical: 4 }}
                    />
                  </>
                )}
              </View>

              {/* Session table */}
              {progressSessions.length > 0 && (
                <View style={s.tableCard}>
                  <View style={s.tableHeader}>
                    <Text style={[s.tableHead, { flex: 2 }]}>DATE</Text>
                    <Text style={[s.tableHead, { flex: 1, textAlign: "right" }]}>MAX</Text>
                    <Text style={[s.tableHead, { flex: 1, textAlign: "right" }]}>SETS</Text>
                    <Text style={[s.tableHead, { flex: 1, textAlign: "right" }]}>REPS</Text>
                  </View>
                  {[...progressSessions].reverse().map((sess, i) => (
                    <View key={i} style={[s.tableRow, i % 2 === 0 && s.tableRowAlt]}>
                      <Text style={[s.tableCell, { flex: 2 }]}>{sess.fullDate}</Text>
                      <Text style={[s.tableCell, s.tableCellMax, { flex: 1, textAlign: "right" }]}>{sess.maxWeight}kg</Text>
                      <Text style={[s.tableCell, { flex: 1, textAlign: "right" }]}>{sess.sets}</Text>
                      <Text style={[s.tableCell, { flex: 1, textAlign: "right" }]}>{sess.reps}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}

    </SafeAreaView>
  );
}

// ── LoggedCard ─────────────────────────────────────────────────────
function LoggedCard({ workout, showMeta }) {
  const [expanded, setExpanded] = useState(false);
  const mw = Math.max(...(workout.sets?.map((s) => s.weight || 0) || [0]));
  return (
    <TouchableOpacity style={s.workoutCard} onPress={() => setExpanded((e) => !e)} activeOpacity={0.8}>
      <View style={s.cardLeft} />
      <View style={s.cardBody}>
        <View style={s.cardTopRow}>
          <Text style={s.cardExercise} numberOfLines={1}>{workout.exerciseName}</Text>
          <View style={s.muscleBadge}>
            <Text style={s.muscleBadgeText}>{workout.muscleGroup || "General"}</Text>
          </View>
        </View>
        {showMeta && workout.date && (
          <View style={s.metaRow}>
            <Feather name="calendar" size={11} color={MUTED} />
            <Text style={s.metaText}>{workout.date}</Text>
            {workout.time ? (
              <>
                <Feather name="clock" size={11} color={MUTED} style={{ marginLeft: 8 }} />
                <Text style={s.metaText}>{workout.time}</Text>
              </>
            ) : null}
          </View>
        )}
        <View style={s.cardStats}>
          <View style={s.cardStatItem}>
            <MaterialCommunityIcons name="dumbbell" size={12} color={MUTED} />
            <Text style={s.cardStatText}>{workout.sets?.length || 0} sets</Text>
          </View>
          <View style={s.cardStatItem}>
            <Feather name="maximize-2" size={12} color={GREEN} />
            <Text style={[s.cardStatText, { color: GREEN }]}>{mw} kg max</Text>
          </View>
          <Feather name={expanded ? "chevron-up" : "chevron-down"} size={14} color={MUTED} style={{ marginLeft: "auto" }} />
        </View>
        {expanded && workout.sets?.map((set, i) => (
          <View key={i} style={s.expandedSetRow}>
            <Text style={s.setLabel}>Set {i + 1}</Text>
            <Text style={s.setText}>{set.reps} reps · {set.weight} kg</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

// ── Styles ─────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: BG },
  scroll:       { flex: 1, paddingHorizontal: 16 },

  topHeader:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  screenTitle:  { color: WHITE, fontSize: 26, fontWeight: "900" },
  addBtn:       { width: 38, height: 38, borderRadius: 19, backgroundColor: GREEN, alignItems: "center", justifyContent: "center" },

  tabWrap:           { paddingHorizontal: 16, marginBottom: 16 },
  tabRow:            { flexDirection: "row", backgroundColor: CARD, borderRadius: 18, padding: 4 },
  tabPill:           { flex: 1, paddingVertical: 8, borderRadius: 14, alignItems: "center" },
  tabPillActive:     { backgroundColor: GREEN },
  tabPillText:       { color: MUTED, fontSize: 12, fontWeight: "600" },
  tabPillTextActive: { color: "#000", fontWeight: "700" },

  backRow:  { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6, marginBottom: 16 },
  backText: { color: MUTED, fontSize: 14 },

  pageTitle: { color: WHITE, fontSize: 22, fontWeight: "900", marginBottom: 4 },
  pageSub:   { color: MUTED, fontSize: 13, marginBottom: 16 },

  sectionHead:  { flexDirection: "row", alignItems: "baseline", gap: 8, marginBottom: 10 },
  sectionLabel: { color: WHITE, fontSize: 14, fontWeight: "700" },
  sectionSub:   { color: MUTED, fontSize: 12, flex: 1 },

  emptyCard:    { backgroundColor: CARD, borderRadius: 20, padding: 32, alignItems: "center", borderWidth: 1, borderColor: BORDER, marginBottom: 14 },
  emptyText:    { color: WHITE, fontSize: 14, fontWeight: "600" },
  emptySubText: { color: MUTED, fontSize: 12, marginTop: 4, textAlign: "center" },

  // Today — day picker
  dayChip:          { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: CARD, borderRadius: 14, borderWidth: 1, borderColor: BORDER },
  dayChipActive:    { backgroundColor: GREEN, borderColor: GREEN },
  dayChipText:      { color: MUTED, fontSize: 12, fontWeight: "600" },
  dayChipTextActive:{ color: "#000", fontWeight: "700" },

  // Plan day card (shared — Today + Plan viewer)
  planDayCard:   { backgroundColor: CARD, borderRadius: 20, borderWidth: 1, borderColor: BORDER, borderLeftWidth: 4, borderLeftColor: GREEN, padding: 14, marginBottom: 12 },
  planDayHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  dayBadge:      { width: 26, height: 26, borderRadius: 13, backgroundColor: "rgba(199,240,0,0.15)", alignItems: "center", justifyContent: "center" },
  dayBadgeText:  { color: GREEN, fontSize: 11, fontWeight: "800" },
  planDayFocus:  { color: WHITE, fontSize: 15, fontWeight: "800", flex: 1 },
  restText:      { color: MUTED, fontSize: 13, fontStyle: "italic", textAlign: "center", paddingVertical: 8 },
  planExRow:     { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderTopWidth: 1, borderTopColor: BORDER },
  planExName:    { color: WHITE, fontSize: 13, fontWeight: "700" },
  planExMeta:    { color: GREEN, fontSize: 11, fontWeight: "700", marginTop: 2 },
  planExNotes:   { color: MUTED, fontSize: 11, marginTop: 2, fontStyle: "italic" },
  logItBtn:      { paddingHorizontal: 14, paddingVertical: 7, backgroundColor: GREEN, borderRadius: 12 },
  logItText:     { color: "#000", fontSize: 12, fontWeight: "800" },
  editExBtn:     { padding: 8 },

  // History
  histCard:   { backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER, flexDirection: "row", marginBottom: 10, overflow: "hidden" },
  histAccent: { width: 4, backgroundColor: GREEN },
  histBody:   { flex: 1, padding: 14 },
  histTitle:  { color: WHITE, fontSize: 14, fontWeight: "700" },
  histSub:    { color: MUTED, fontSize: 12, marginTop: 2 },

  // Plan list
  planCard:   { backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER, flexDirection: "row", marginBottom: 10, overflow: "hidden" },
  planAccent: { width: 4, backgroundColor: GREEN },
  planBody:   { flex: 1, padding: 14 },
  planTitle:  { color: WHITE, fontSize: 14, fontWeight: "800" },
  planGoal:   { color: MUTED, fontSize: 12, marginTop: 2 },
  planDate:   { color: MUTED, fontSize: 11, marginTop: 4 },

  // Logged workout card
  workoutCard:     { backgroundColor: CARD, borderRadius: 20, borderWidth: 1, borderColor: BORDER, flexDirection: "row", marginBottom: 12, overflow: "hidden" },
  cardLeft:        { width: 4, backgroundColor: GREEN },
  cardBody:        { flex: 1, padding: 14 },
  cardTopRow:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  cardExercise:    { color: WHITE, fontSize: 15, fontWeight: "800", flex: 1, marginRight: 8 },
  muscleBadge:     { backgroundColor: "rgba(200,255,0,0.15)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: "rgba(200,255,0,0.25)" },
  muscleBadgeText: { color: GREEN, fontSize: 10, fontWeight: "700" },
  metaRow:         { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8 },
  metaText:        { color: MUTED, fontSize: 11 },
  cardStats:       { flexDirection: "row", alignItems: "center", gap: 12 },
  cardStatItem:    { flexDirection: "row", alignItems: "center", gap: 4 },
  cardStatText:    { color: MUTED, fontSize: 12 },
  expandedSetRow:  { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: BORDER },
  setLabel:        { color: MUTED, fontSize: 12, width: 40 },
  setText:         { color: WHITE, fontSize: 12, fontWeight: "600" },

  // Progress
  exPill:          { borderWidth: 1, borderColor: BORDER, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  exPillActive:    { backgroundColor: GREEN, borderColor: GREEN },
  exPillText:      { color: MUTED, fontSize: 12, fontWeight: "600" },
  exPillTextActive:{ color: "#000", fontWeight: "700" },

  progressCard:     { backgroundColor: CARD, borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: BORDER },
  progressCardHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  progressCardTitle:{ color: WHITE, fontSize: 14, fontWeight: "700" },

  tooltipBox:  { backgroundColor: "rgba(28,28,30,0.97)", borderRadius: 10, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: BORDER },
  tooltipDate: { color: WHITE, fontSize: 13, fontWeight: "700" },
  tooltipVal:  { color: GREEN, fontSize: 12, fontWeight: "600", marginTop: 2 },

  tableCard:    { backgroundColor: CARD, borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: BORDER, marginBottom: 14 },
  tableHeader:  { flexDirection: "row", padding: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  tableHead:    { color: MUTED, fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  tableRow:     { flexDirection: "row", paddingHorizontal: 12, paddingVertical: 12 },
  tableRowAlt:  { backgroundColor: "rgba(255,255,255,0.025)" },
  tableCell:    { color: WHITE, fontSize: 13 },
  tableCellMax: { color: ORANGE, fontWeight: "700" },

  noDataText: { color: MUTED, fontSize: 13, fontStyle: "italic" },

  // Forms
  formCard:            { backgroundColor: CARD, borderRadius: 20, borderWidth: 1, borderColor: BORDER, padding: 16, marginBottom: 14 },
  formLabel:           { color: MUTED, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  formInput:           { backgroundColor: "#111", borderRadius: 12, borderWidth: 1, borderColor: BORDER, color: WHITE, padding: 13, fontSize: 15 },
  muscleGrid:          { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  muscleBtn:           { width: "47%", borderWidth: 1, borderColor: BORDER, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  muscleBtnActive:     { backgroundColor: GREEN, borderColor: GREEN },
  muscleBtnText:       { color: MUTED, fontSize: 13, fontWeight: "600" },
  muscleBtnTextActive: { color: "#000", fontWeight: "700" },

  setsTitle:   { color: GREEN, fontSize: 13, fontWeight: "700", marginBottom: 12 },
  setCard:     { backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 14, marginBottom: 10 },
  setNum:      { color: WHITE, fontSize: 13, fontWeight: "700", marginBottom: 10 },
  setRowInner: { flexDirection: "row", gap: 10 },
  setInput:    { flex: 1, backgroundColor: "#111", borderRadius: 12, borderWidth: 1, borderColor: BORDER, color: WHITE, padding: 12, textAlign: "center", fontSize: 14 },
  addSetBtn:   { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER, paddingVertical: 14, marginBottom: 14 },
  addSetText:  { color: GREEN, fontSize: 14, fontWeight: "700" },
  saveBtn:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: GREEN, borderRadius: 16, paddingVertical: 16, marginBottom: 12 },
  saveBtnText: { color: "#000", fontSize: 15, fontWeight: "800" },
  deleteBtn:   { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: RED, borderRadius: 16, paddingVertical: 14, marginBottom: 12, marginTop: 8 },
  deleteBtnText:{ color: WHITE, fontSize: 14, fontWeight: "800" },
});
