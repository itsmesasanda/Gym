import React, { useState, useEffect, useCallback } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { BASE_URL } from "../config";

const API = BASE_URL;

const GREEN  = "#C7F000";
const BG     = "#0D0D0D";
const CARD   = "#1A1A1A";
const BORDER = "#2A2A2A";
const MUTED  = "#888888";
const WHITE  = "#FFFFFF";
const RED    = "#FF3B30";

const MUSCLE_GROUPS  = ["Chest", "Back", "Legs", "Arms", "Shoulders", "Biceps", "Triceps", "Core"];
const QUICK_GROUPS   = ["Chest", "Back", "Legs", "Arms"];

const getTodayStr = () =>
  new Date().toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" });

const getTimeStr = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const getWeekStart = (weeksAgo = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() - weeksAgo * 7);
  d.setHours(0, 0, 0, 0);
  return d;
};

const maxWeight = (workout) =>
  Math.max(...(workout.sets?.map((s) => s.weight || 0) || [0]));

export default function WorkoutScreen() {
  const [view, setView] = useState("home"); // home | history | progress | addWorkout | editWorkout
  const [workouts, setWorkouts] = useState([]);
  const [selected, setSelected] = useState(null);

  // form state
  const [exerciseName, setExerciseName] = useState("");
  const [muscleGroup, setMuscleGroup]   = useState("Chest");
  const [duration, setDuration]         = useState("");
  const [notes, setNotes]               = useState("");
  const [sets, setSets]                 = useState([{ reps: "", weight: "" }]);

  // progress filter
  const [selectedExercise, setSelectedExercise] = useState(null);

  // ── fetch ───────────────────────────────────────────────
  const fetchWorkouts = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/workouts`);
      if (!r.ok) return;
      setWorkouts(await r.json());
    } catch (e) {
      console.error("fetchWorkouts:", e);
    }
  }, []);

  useEffect(() => { fetchWorkouts(); }, [fetchWorkouts]);

  // ── form helpers ────────────────────────────────────────
  const resetForm = (mg = "Chest") => {
    setExerciseName(""); setMuscleGroup(mg);
    setDuration(""); setNotes("");
    setSets([{ reps: "", weight: "" }]);
  };

  const openAdd = (mg = "Chest") => {
    resetForm(mg);
    setSelected(null);
    setView("addWorkout");
  };

  const openEdit = (w) => {
    setSelected(w);
    setExerciseName(w.exerciseName);
    setMuscleGroup(w.muscleGroup || "General");
    setDuration(w.duration ? String(w.duration) : "");
    setNotes(w.notes || "");
    setSets(
      w.sets?.length
        ? w.sets.map((s) => ({ reps: String(s.reps ?? ""), weight: String(s.weight ?? "") }))
        : [{ reps: "", weight: "" }]
    );
    setView("editWorkout");
  };

  const addSet  = () => setSets((p) => [...p, { reps: "", weight: "" }]);
  const updSet  = (i, f, v) => setSets((p) => p.map((s, idx) => (idx === i ? { ...s, [f]: v } : s)));

  // ── CRUD ────────────────────────────────────────────────
  const saveWorkout = async () => {
    if (!exerciseName.trim()) {
      Alert.alert("Missing field", "Please enter an exercise name.");
      return;
    }
    const payload = {
      exerciseName: exerciseName.trim(),
      muscleGroup,
      duration: duration ? Number(duration) : undefined,
      notes,
      sets: sets.map((s) => ({ reps: Number(s.reps || 0), weight: Number(s.weight || 0) })),
      date: getTodayStr(),
      time: getTimeStr(),
    };
    try {
      const r = await fetch(`${API}/api/workouts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error("Save failed");
      await fetchWorkouts();
      setView("home");
    } catch {
      Alert.alert("Error", "Could not save workout.");
    }
  };

  const updateWorkout = async () => {
    if (!selected) return;
    const payload = {
      exerciseName: exerciseName.trim(),
      muscleGroup,
      duration: duration ? Number(duration) : undefined,
      notes,
      sets: sets.map((s) => ({ reps: Number(s.reps || 0), weight: Number(s.weight || 0) })),
    };
    try {
      const r = await fetch(`${API}/api/workouts/${selected._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error("Update failed");
      await fetchWorkouts();
      setView("home");
    } catch {
      Alert.alert("Error", "Could not update workout.");
    }
  };

  const deleteWorkout = () => {
    Alert.alert("Delete Workout", "Are you sure you want to delete this workout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await fetch(`${API}/api/workouts/${selected._id}`, { method: "DELETE" });
            await fetchWorkouts();
            setView("home");
          } catch {
            Alert.alert("Error", "Could not delete workout.");
          }
        },
      },
    ]);
  };

  // ── derived data ────────────────────────────────────────
  const today = getTodayStr();
  const todayWorkouts = workouts.filter((w) => w.date === today);
  const todayStats = {
    sets:      todayWorkouts.reduce((n, w) => n + (w.sets?.length || 0), 0),
    exercises: todayWorkouts.length,
    volume:    todayWorkouts.reduce(
      (n, w) => n + (w.sets?.reduce((s, x) => s + (x.reps || 0) * (x.weight || 0), 0) || 0), 0
    ),
  };

  const uniqueExercises = [...new Set(workouts.map((w) => w.exerciseName))];
  const activeExercise  = selectedExercise || uniqueExercises[0] || null;

  const thisWeekWorkouts = workouts.filter((w) => new Date(w.createdAt) >= getWeekStart(0));
  const consistency      = Math.round((thisWeekWorkouts.length / 7) * 100);

  const volumeByMuscle = workouts.reduce((acc, w) => {
    const mg  = w.muscleGroup || "General";
    const vol = w.sets?.reduce((s, x) => s + (x.reps || 0) * (x.weight || 0), 0) || 0;
    acc[mg]   = (acc[mg] || 0) + vol;
    return acc;
  }, {});
  const maxMuscleVol = Math.max(...Object.values(volumeByMuscle), 1);

  const getMaxWeightWeek = (ex, weeksAgo) => {
    const start = getWeekStart(weeksAgo);
    const end   = weeksAgo > 0 ? getWeekStart(weeksAgo - 1) : new Date(Date.now() + 86400000);
    let max = 0;
    workouts.forEach((w) => {
      if (w.exerciseName !== ex) return;
      const d = new Date(w.createdAt);
      if (d < start || d >= end) return;
      w.sets?.forEach((s) => { if (s.weight > max) max = s.weight; });
    });
    return max;
  };

  const getVolumeWeek = (ex, weeksAgo) => {
    const start = getWeekStart(weeksAgo);
    const end   = weeksAgo > 0 ? getWeekStart(weeksAgo - 1) : new Date(Date.now() + 86400000);
    return workouts
      .filter((w) => {
        if (w.exerciseName !== ex) return false;
        const d = new Date(w.createdAt);
        return d >= start && d < end;
      })
      .reduce((n, w) => n + (w.sets?.reduce((s, x) => s + (x.reps || 0) * (x.weight || 0), 0) || 0), 0);
  };

  const maxWeightWeeks = activeExercise
    ? [3, 2, 1, 0].map((wa, i) => ({ label: `Week ${i + 1}`, value: getMaxWeightWeek(activeExercise, wa) }))
    : [1, 2, 3, 4].map((i) => ({ label: `Week ${i}`, value: 0 }));

  const volumeWeeks = activeExercise
    ? [3, 2, 1, 0].map((wa, i) => ({ label: `Week ${i + 1}`, value: getVolumeWeek(activeExercise, wa) }))
    : [1, 2, 3, 4].map((i) => ({ label: `Week ${i}`, value: 0 }));

  const maxMW = Math.max(...maxWeightWeeks.map((w) => w.value), 1);
  const maxVW = Math.max(...volumeWeeks.map((w) => w.value), 1);

  const trend = (() => {
    const v = maxWeightWeeks.map((w) => w.value);
    if (v[3] > v[2]) return { label: "Improving", icon: "📈" };
    if (v[3] < v[2]) return { label: "Declining", icon: "📉" };
    return { label: "Stable", icon: "⚖️" };
  })();

  const totalVolume = workouts.reduce(
    (n, w) => n + (w.sets?.reduce((s, x) => s + (x.reps || 0) * (x.weight || 0), 0) || 0), 0
  );

  // ── sub-views ───────────────────────────────────────────

  const renderHome = () => (
    <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
      <Text style={s.pageTitle}>Today's Workout</Text>
      <Text style={s.pageSubtitle}>Keep up the hard work, you're doing great! 💪</Text>

      {/* Stats */}
      <View style={s.statsRow}>
        <View style={s.statCard}>
          <Text style={s.statIcon}>🏋</Text>
          <Text style={s.statValue}>{todayStats.sets}</Text>
          <Text style={s.statLabel}>Sets</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statIcon}>⚡</Text>
          <Text style={s.statValue}>{todayStats.exercises}</Text>
          <Text style={s.statLabel}>Exercises</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statIcon}>⚖</Text>
          <Text style={s.statValue}>{(todayStats.volume / 1000).toFixed(1)}k</Text>
          <Text style={s.statLabel}>kg Volume</Text>
        </View>
      </View>

      {/* Quick Add */}
      <Text style={s.sectionTitle}>Quick Add</Text>
      <View style={s.quickGrid}>
        {QUICK_GROUPS.map((mg) => (
          <TouchableOpacity key={mg} style={s.quickBtn} onPress={() => openAdd(mg)}>
            <Text style={s.quickBtnIcon}>⊕</Text>
            <Text style={s.quickBtnText}>{mg}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Today's workouts */}
      <Text style={s.sectionTitle}>Your Workouts</Text>
      {todayWorkouts.length === 0 ? (
        <Text style={s.emptyText}>No workouts logged today. Add one!</Text>
      ) : (
        todayWorkouts.map((w) => (
          <WorkoutCard key={w._id} workout={w} onPress={() => openEdit(w)} />
        ))
      )}
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderHistory = () => (
    <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
      <Text style={s.pageTitle}>Workout History</Text>
      <Text style={s.pageSubtitle}>Review your past workouts</Text>
      {workouts.length === 0 ? (
        <Text style={s.emptyText}>No workout history yet.</Text>
      ) : (
        workouts.map((w) => <WorkoutCard key={w._id} workout={w} showMeta />)
      )}
      <View style={{ height: 80 }} />
    </ScrollView>
  );

  const renderProgress = () => (
    <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
      <Text style={s.pageTitle}>Progress Tracker</Text>
      <Text style={s.pageSubtitle}>Monitor your strength gains</Text>

      {/* This Week */}
      <View style={s.progressCard}>
        <View style={s.progressCardHead}>
          <Text style={s.progressIcon}>📅</Text>
          <Text style={s.progressCardTitle}>This Week</Text>
        </View>
        <View style={s.weekStatRow}>
          <View style={s.weekStat}>
            <Text style={s.weekStatValue}>{thisWeekWorkouts.length}</Text>
            <Text style={s.weekStatLabel}>Workouts</Text>
          </View>
          <View style={s.weekStat}>
            <Text style={s.weekStatValue}>{consistency}%</Text>
            <Text style={s.weekStatLabel}>Consistency</Text>
          </View>
        </View>
      </View>

      {/* Volume by Muscle Group */}
      <View style={s.progressCard}>
        <View style={s.progressCardHead}>
          <Text style={s.progressIcon}>🏋</Text>
          <Text style={s.progressCardTitle}>Volume by Muscle Group</Text>
        </View>
        {Object.keys(volumeByMuscle).length === 0 ? (
          <Text style={s.noDataText}>No data yet</Text>
        ) : (
          Object.entries(volumeByMuscle).map(([mg, vol]) => (
            <View key={mg} style={s.muscleRow}>
              <Text style={s.muscleLabel}>{mg}</Text>
              <Text style={s.muscleVol}>{vol.toFixed(1)}</Text>
              <View style={s.barBg}>
                <View style={[s.barFill, { width: `${(vol / maxMuscleVol) * 100}%` }]} />
              </View>
            </View>
          ))
        )}
      </View>

      {/* Select Exercise */}
      {uniqueExercises.length > 0 && (
        <View style={s.progressCard}>
          <View style={s.progressCardHead}>
            <Text style={s.progressIcon}>≡</Text>
            <Text style={s.progressCardTitle}>Select Exercise</Text>
          </View>
          <View style={s.exercisePills}>
            {uniqueExercises.map((ex) => (
              <TouchableOpacity
                key={ex}
                style={[s.exPill, activeExercise === ex && s.exPillActive]}
                onPress={() => setSelectedExercise(ex)}
              >
                <Text style={[s.exPillText, activeExercise === ex && s.exPillTextActive]}>{ex}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Max Weight - Last 4 Weeks */}
      <View style={s.progressCard}>
        <View style={s.progressCardHead}>
          <Text style={s.progressIcon}>↗</Text>
          <Text style={s.progressCardTitle}>Max Weight - Last 4 Weeks</Text>
        </View>
        {maxWeightWeeks.map((w, i) => (
          <View key={i} style={s.weekBarRow}>
            <Text style={s.weekBarLabel}>{w.label}</Text>
            <Text style={s.weekBarVal}>{w.value.toFixed(1)}</Text>
            <View style={s.weekBarBg}>
              <View style={[s.weekBarFill, { width: `${(w.value / maxMW) * 100}%` }]} />
            </View>
          </View>
        ))}
        <Text style={s.trendText}>
          {trend.icon} Trend: {trend.icon} {trend.label}
        </Text>
      </View>

      {/* Volume - Last 4 Weeks */}
      <View style={s.progressCard}>
        <View style={s.progressCardHead}>
          <Text style={s.progressIcon}>🔋</Text>
          <Text style={s.progressCardTitle}>Volume - Last 4 Weeks</Text>
        </View>
        {volumeWeeks.map((w, i) => (
          <View key={i} style={s.weekBarRow}>
            <Text style={s.weekBarLabel}>{w.label}</Text>
            <Text style={s.weekBarVal}>{w.value.toFixed(1)}</Text>
            <View style={s.weekBarBg}>
              <View style={[s.weekBarFill, { width: `${(w.value / maxVW) * 100}%` }]} />
            </View>
          </View>
        ))}
        <Text style={s.trendText}>⚡ Total Volume: {(totalVolume / 1000).toFixed(1)}k kg</Text>
      </View>

      <View style={{ height: 80 }} />
    </ScrollView>
  );

  const renderAddWorkout = () => (
    <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
      <Text style={s.pageTitle}>Add Workout</Text>

      <View style={s.formCard}>
        <Text style={s.formLabel}>Exercise Name</Text>
        <TextInput
          style={s.formInput}
          placeholder="e.g. Bench Press"
          placeholderTextColor={MUTED}
          value={exerciseName}
          onChangeText={setExerciseName}
        />
      </View>

      <View style={s.formCard}>
        <Text style={s.formLabel}>Muscle Group</Text>
        <View style={s.muscleGrid}>
          {MUSCLE_GROUPS.map((mg) => (
            <TouchableOpacity
              key={mg}
              style={[s.muscleBtn, muscleGroup === mg && s.muscleBtnActive]}
              onPress={() => setMuscleGroup(mg)}
            >
              <Text style={[s.muscleBtnText, muscleGroup === mg && s.muscleBtnTextActive]}>{mg}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={s.formCard}>
        <Text style={s.formLabel}>Duration (minutes)</Text>
        <TextInput
          style={s.formInput}
          placeholder="e.g. 45"
          placeholderTextColor={MUTED}
          keyboardType="numeric"
          value={duration}
          onChangeText={setDuration}
        />
        <Text style={[s.formLabel, { marginTop: 14 }]}>Notes (optional)</Text>
        <TextInput
          style={[s.formInput, s.notesInput]}
          placeholder="e.g. Good form, felt strong"
          placeholderTextColor={MUTED}
          multiline
          value={notes}
          onChangeText={setNotes}
        />
      </View>

      <Text style={[s.sectionTitle, { color: GREEN }]}>Sets</Text>
      {sets.map((set, i) => (
        <View key={i} style={s.setCard}>
          <Text style={s.setTitle}>Set {i + 1}</Text>
          <View style={s.setRow}>
            <TextInput
              style={s.setInput}
              placeholder="Reps"
              placeholderTextColor={MUTED}
              keyboardType="numeric"
              value={set.reps}
              onChangeText={(v) => updSet(i, "reps", v)}
            />
            <TextInput
              style={s.setInput}
              placeholder="Weight (kg)"
              placeholderTextColor={MUTED}
              keyboardType="numeric"
              value={set.weight}
              onChangeText={(v) => updSet(i, "weight", v)}
            />
          </View>
        </View>
      ))}

      <TouchableOpacity style={s.addSetBtn} onPress={addSet}>
        <Text style={s.addSetText}>+ Add Set</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.saveBtn} onPress={saveWorkout}>
        <Text style={s.saveBtnText}>Save Workout</Text>
      </TouchableOpacity>

      <View style={{ height: 80 }} />
    </ScrollView>
  );

  const renderEditWorkout = () => (
    <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={s.backRow} onPress={() => setView("home")}>
        <Text style={s.backText}>← Workout Details</Text>
      </TouchableOpacity>
      <Text style={s.pageTitle}>Edit Workout</Text>

      <View style={s.formCard}>
        <Text style={s.formLabel}>Exercise</Text>
        <View style={s.exerciseDisplay}>
          <Text style={s.exerciseDisplayText}>{exerciseName}</Text>
        </View>
      </View>

      <Text style={[s.sectionTitle, { color: GREEN }]}>Sets</Text>
      {sets.map((set, i) => (
        <View key={i} style={s.setCard}>
          <Text style={s.setTitle}>Set {i + 1}</Text>
          <View style={s.setRow}>
            <TextInput
              style={s.setInput}
              placeholder="Reps"
              placeholderTextColor={MUTED}
              keyboardType="numeric"
              value={set.reps}
              onChangeText={(v) => updSet(i, "reps", v)}
            />
            <TextInput
              style={s.setInput}
              placeholder="Weight"
              placeholderTextColor={MUTED}
              keyboardType="numeric"
              value={set.weight}
              onChangeText={(v) => updSet(i, "weight", v)}
            />
          </View>
        </View>
      ))}

      <TouchableOpacity style={s.addSetBtn} onPress={addSet}>
        <Text style={s.addSetText}>+ Add Set</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.saveBtn} onPress={updateWorkout}>
        <Text style={s.saveBtnText}>Update Workout</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.deleteBtn} onPress={deleteWorkout}>
        <Text style={s.deleteBtnText}>Delete Workout</Text>
      </TouchableOpacity>

      <View style={{ height: 80 }} />
    </ScrollView>
  );

  // ── layout ──────────────────────────────────────────────
  const isForm = view === "addWorkout" || view === "editWorkout";

  return (
    <SafeAreaView style={s.container}>
      {isForm ? (
        view === "addWorkout" ? renderAddWorkout() : renderEditWorkout()
      ) : (
        <>
          {view === "home"     && renderHome()}
          {view === "history"  && renderHistory()}
          {view === "progress" && renderProgress()}

          {view === "home" && (
            <TouchableOpacity style={s.fab} onPress={() => openAdd()}>
              <Text style={s.fabText}>+</Text>
            </TouchableOpacity>
          )}

          <View style={s.bottomNav}>
            <NavTab label="Home"     active={view === "home"}     onPress={() => setView("home")}     icon="⌂" />
            <NavTab label="Stats"    active={false}               onPress={() => {}}                  icon="≡" />
            <NavTab label="History"  active={view === "history"}  onPress={() => setView("history")}  icon="◷" />
            <NavTab label="Progress" active={view === "progress"} onPress={() => setView("progress")} icon="↗" />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────

function WorkoutCard({ workout, onPress, showMeta }) {
  const mw = maxWeight(workout);
  return (
    <TouchableOpacity
      style={s.workoutCard}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={s.cardAccent} />
      <View style={s.cardBody}>
        <View style={s.cardTopRow}>
          <Text style={s.cardExercise}>{workout.exerciseName}</Text>
          <View style={s.muscleBadge}>
            <Text style={s.muscleBadgeText}>{workout.muscleGroup || "General"}</Text>
          </View>
        </View>
        {showMeta && (
          <View style={s.metaRow}>
            <Text style={s.metaText}>📅 {workout.date}</Text>
            <Text style={s.metaText}>  🕐 {workout.time}</Text>
          </View>
        )}
        <Text style={s.cardMaxWeight}>↔ Max: {mw}kg</Text>
        <View style={s.cardDivider} />
        {workout.sets?.map((set, i) => (
          <Text key={i} style={s.cardSetText}>
            • Set {i + 1}: {set.reps} reps • {set.weight} kg
          </Text>
        ))}
      </View>
    </TouchableOpacity>
  );
}

function NavTab({ label, icon, active, onPress }) {
  return (
    <TouchableOpacity style={s.navTab} onPress={onPress}>
      <Text style={[s.navIcon, active && s.navIconActive]}>{icon}</Text>
      <Text style={[s.navLabel, active && s.navLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────
const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: BG },
  scroll:     { flex: 1, paddingHorizontal: 16 },

  pageTitle:    { color: WHITE, fontSize: 28, fontWeight: "900", marginTop: 20, marginBottom: 4 },
  pageSubtitle: { color: MUTED, fontSize: 13, marginBottom: 20 },
  sectionTitle: { color: WHITE, fontSize: 16, fontWeight: "800", marginTop: 20, marginBottom: 12 },
  emptyText:    { color: MUTED, textAlign: "center", padding: 20, backgroundColor: CARD, borderRadius: 12 },
  noDataText:   { color: MUTED, fontSize: 13, marginTop: 4 },

  // stats
  statsRow:   { flexDirection: "row", gap: 10, marginBottom: 4 },
  statCard:   {
    flex: 1, backgroundColor: CARD, borderRadius: 12, borderWidth: 1,
    borderColor: BORDER, alignItems: "center", paddingVertical: 16,
  },
  statIcon:  { fontSize: 20, marginBottom: 4 },
  statValue: { color: GREEN, fontSize: 22, fontWeight: "900" },
  statLabel: { color: MUTED, fontSize: 11, marginTop: 2 },

  // quick add
  quickGrid: { flexDirection: "row", gap: 10 },
  quickBtn:  {
    flex: 1, backgroundColor: CARD, borderRadius: 10, borderWidth: 1,
    borderColor: BORDER, alignItems: "center", paddingVertical: 14,
  },
  quickBtnIcon: { color: GREEN, fontSize: 18, fontWeight: "900" },
  quickBtnText: { color: WHITE, fontSize: 12, fontWeight: "700", marginTop: 4 },

  // workout card
  workoutCard: {
    flexDirection: "row", backgroundColor: CARD, borderRadius: 12,
    borderWidth: 1, borderColor: BORDER, marginBottom: 12, overflow: "hidden",
  },
  cardAccent:    { width: 4, backgroundColor: GREEN },
  cardBody:      { flex: 1, padding: 14 },
  cardTopRow:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  cardExercise:  { color: WHITE, fontSize: 16, fontWeight: "800", flex: 1, marginRight: 8 },
  muscleBadge:   { backgroundColor: GREEN, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  muscleBadgeText:{ color: "#111", fontSize: 11, fontWeight: "800" },
  metaRow:       { flexDirection: "row", marginBottom: 6 },
  metaText:      { color: MUTED, fontSize: 12 },
  cardMaxWeight: { color: GREEN, fontSize: 13, fontWeight: "700", marginBottom: 8 },
  cardDivider:   { height: 1, backgroundColor: BORDER, marginBottom: 8 },
  cardSetText:   { color: MUTED, fontSize: 13, marginBottom: 2 },

  // progress cards
  progressCard: {
    backgroundColor: CARD, borderRadius: 12, borderWidth: 1,
    borderColor: BORDER, padding: 16, marginBottom: 14,
    borderLeftWidth: 4, borderLeftColor: GREEN,
  },
  progressCardHead:  { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  progressIcon:      { fontSize: 18, marginRight: 8 },
  progressCardTitle: { color: WHITE, fontSize: 15, fontWeight: "800" },

  weekStatRow:   { flexDirection: "row", justifyContent: "space-around" },
  weekStat:      { alignItems: "center" },
  weekStatValue: { color: GREEN, fontSize: 30, fontWeight: "900" },
  weekStatLabel: { color: MUTED, fontSize: 12, marginTop: 2 },

  muscleRow:   { marginBottom: 10 },
  muscleLabel: { color: WHITE, fontSize: 13, fontWeight: "700", marginBottom: 4 },
  muscleVol:   { color: GREEN, fontSize: 12, fontWeight: "700", position: "absolute", right: 0, top: 0 },
  barBg:       { height: 6, backgroundColor: BORDER, borderRadius: 3, overflow: "hidden" },
  barFill:     { height: 6, backgroundColor: GREEN, borderRadius: 3 },

  exercisePills: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  exPill:        {
    borderWidth: 1, borderColor: BORDER, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  exPillActive:     { backgroundColor: GREEN, borderColor: GREEN },
  exPillText:       { color: MUTED, fontSize: 13, fontWeight: "700" },
  exPillTextActive: { color: "#111" },

  weekBarRow:  { marginBottom: 12 },
  weekBarLabel:{ color: WHITE, fontSize: 13, fontWeight: "700", marginBottom: 4 },
  weekBarVal:  { color: GREEN, fontSize: 12, fontWeight: "700", position: "absolute", right: 0, top: 0 },
  weekBarBg:   { height: 6, backgroundColor: BORDER, borderRadius: 3, overflow: "hidden" },
  weekBarFill: { height: 6, backgroundColor: GREEN, borderRadius: 3 },
  trendText:   { color: MUTED, fontSize: 12, textAlign: "center", marginTop: 8 },

  // form
  formCard:     {
    backgroundColor: CARD, borderRadius: 12, borderWidth: 1,
    borderColor: BORDER, padding: 16, marginBottom: 14,
  },
  formLabel:    { color: MUTED, fontSize: 12, fontWeight: "700", marginBottom: 8, textTransform: "uppercase" },
  formInput:    {
    backgroundColor: "#111", borderRadius: 8, borderWidth: 1,
    borderColor: BORDER, color: WHITE, padding: 13,
  },
  notesInput:   { height: 80, textAlignVertical: "top" },

  muscleGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  muscleBtn:  {
    width: "47%", borderWidth: 1, borderColor: BORDER, borderRadius: 8,
    paddingVertical: 12, alignItems: "center",
  },
  muscleBtnActive:     { backgroundColor: GREEN, borderColor: GREEN },
  muscleBtnText:       { color: WHITE, fontSize: 13, fontWeight: "700" },
  muscleBtnTextActive: { color: "#111" },

  setCard:  {
    backgroundColor: CARD, borderRadius: 12, borderWidth: 1,
    borderColor: BORDER, padding: 14, marginBottom: 10,
  },
  setTitle: { color: WHITE, fontSize: 14, fontWeight: "700", marginBottom: 10 },
  setRow:   { flexDirection: "row", gap: 10 },
  setInput: {
    flex: 1, backgroundColor: "#111", borderRadius: 8, borderWidth: 1,
    borderColor: BORDER, color: WHITE, padding: 12, textAlign: "center",
  },

  exerciseDisplay:     {
    backgroundColor: "#111", borderRadius: 8, borderWidth: 1,
    borderColor: BORDER, padding: 13,
  },
  exerciseDisplayText: { color: WHITE, fontSize: 15, fontWeight: "700" },

  addSetBtn:  {
    backgroundColor: CARD, borderRadius: 10, borderWidth: 1,
    borderColor: BORDER, paddingVertical: 16, alignItems: "center", marginBottom: 14,
  },
  addSetText: { color: GREEN, fontSize: 15, fontWeight: "800" },

  saveBtn:     {
    backgroundColor: GREEN, borderRadius: 12, paddingVertical: 17,
    alignItems: "center", marginBottom: 12,
  },
  saveBtnText: { color: "#111", fontSize: 16, fontWeight: "900" },

  deleteBtn:     {
    backgroundColor: RED, borderRadius: 12, paddingVertical: 17,
    alignItems: "center", marginBottom: 12,
  },
  deleteBtnText: { color: WHITE, fontSize: 16, fontWeight: "900" },

  backRow:  { marginTop: 10, marginBottom: 4 },
  backText: { color: WHITE, fontSize: 15, fontWeight: "700" },

  // FAB
  fab:     {
    position: "absolute", right: 20, bottom: 80,
    width: 56, height: 56, borderRadius: 28, backgroundColor: GREEN,
    alignItems: "center", justifyContent: "center", elevation: 4,
  },
  fabText: { color: "#111", fontSize: 30, fontWeight: "900", lineHeight: 34 },

  // bottom nav
  bottomNav: {
    flexDirection: "row", backgroundColor: "#111", borderTopWidth: 1,
    borderTopColor: BORDER, paddingVertical: 10,
  },
  navTab:        { flex: 1, alignItems: "center" },
  navIcon:       { color: MUTED, fontSize: 20 },
  navIconActive: { color: GREEN },
  navLabel:      { color: MUTED, fontSize: 11, fontWeight: "700", marginTop: 3 },
  navLabelActive:{ color: GREEN },
});