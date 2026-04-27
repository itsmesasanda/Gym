import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { BASE_URL } from "../config";

const API = BASE_URL;

// ─── colours (matching screenshots) ─────────────────────────────────────────
const GREEN  = "#C7F000";
const BG     = "#000000";
const CARD   = "#1A1A1A";
const CARD2  = "#111111";
const BORDER = "#2A2A2A";
const MUTED  = "#888888";
const WHITE  = "#FFFFFF";
const RED    = "#FF3B30";
const BLUE   = "#4FC3F7";

// ─── helpers ─────────────────────────────────────────────────────────────────
const todayStr = () => {
  const d = new Date();
  return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const pop = (title, msg) => {
  if (Platform.OS === "web" && globalThis.alert) {
    globalThis.alert(msg ? `${title}\n${msg}` : title);
  } else {
    Alert.alert(title, msg);
  }
};

// ─── component ───────────────────────────────────────────────────────────────
export default function ProgressScreen() {
  const { width: winW } = useWindowDimensions();
  const [chartW, setChartW] = useState(winW - 32);

  // tabs
  const [tab, setTab] = useState("exercises");

  // ── measurements state ────────────────────────────────────────────────────
  const [measurements,   setMeasurements]   = useState([]);
  const [showLogModal,   setShowLogModal]   = useState(false);
  const [editingMId,     setEditingMId]     = useState(null);
  const [mForm,          setMForm]          = useState({ weight: "", bodyFat: "", waist: "" });
  const [deleteMTarget,  setDeleteMTarget]  = useState(null); // {id, label}

  // ── goals state ───────────────────────────────────────────────────────────
  const [goals,          setGoals]          = useState([]);
  const [showGoalModal,  setShowGoalModal]  = useState(false);
  const [editingGId,     setEditingGId]     = useState(null);
  const [gForm,          setGForm]          = useState({
    name: "",
    targetWeight: "0", targetReps: "0", targetSets: "0",
    currentWeight: "0", currentReps: "0", currentSets: "0",
  });
  const [deleteGTarget,  setDeleteGTarget]  = useState(null); // {id, name}

  // ── fetch ─────────────────────────────────────────────────────────────────
  const fetchMeasurements = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/progress/measurements`);
      if (!r.ok) return;
      setMeasurements(await r.json());
    } catch (e) { console.error(e); }
  }, []);

  const fetchGoals = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/progress/goals`);
      if (!r.ok) return;
      setGoals(await r.json());
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchMeasurements(); fetchGoals(); }, []);

  // ── measurement actions ───────────────────────────────────────────────────
  const openLog = () => {
    setEditingMId(null);
    setMForm({ weight: "", bodyFat: "", waist: "" });
    setShowLogModal(true);
  };

  const openEditM = (m) => {
    setEditingMId(m.id);
    setMForm({
      weight:  String(m.weight),
      bodyFat: String(m.bodyFat),
      waist:   String(m.waist),
    });
    setShowLogModal(true);
  };

  const saveM = async () => {
    const w  = parseFloat(mForm.weight);
    const bf = parseFloat(mForm.bodyFat);
    const wa = parseFloat(mForm.waist);
    if (isNaN(w) || w <= 0)  return pop("Error", "Enter a valid weight.");
    if (isNaN(bf) || bf < 0) return pop("Error", "Enter a valid body fat %.");
    if (isNaN(wa) || wa <= 0)return pop("Error", "Enter a valid waist measurement.");

    const payload = { weight: w, bodyFat: bf, waist: wa, date: todayStr() };
    try {
      if (editingMId) {
        const r = await fetch(`${API}/api/progress/measurements/${editingMId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const updated = await r.json();
        setMeasurements((prev) => prev.map((m) => m.id === editingMId ? updated : m));
      } else {
        const r = await fetch(`${API}/api/progress/measurements`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const created = await r.json();
        setMeasurements((prev) => [created, ...prev]);
      }
      setShowLogModal(false);
    } catch (e) { pop("Error", "Could not save. Is the server running?"); }
  };

  const confirmDeleteM = (m) => setDeleteMTarget({ id: m.id, label: `${m.weight}kg on ${m.date}` });

  const doDeleteM = async () => {
    if (!deleteMTarget) return;
    try {
      await fetch(`${API}/api/progress/measurements/${deleteMTarget.id}`, { method: "DELETE" });
      setMeasurements((prev) => prev.filter((m) => m.id !== deleteMTarget.id));
    } catch (e) { pop("Error", "Could not delete."); }
    setDeleteMTarget(null);
  };

  // ── goal actions ──────────────────────────────────────────────────────────
  const openAddGoal = () => {
    setEditingGId(null);
    setGForm({ name: "", targetWeight: "0", targetReps: "0", targetSets: "0", currentWeight: "0", currentReps: "0", currentSets: "0" });
    setShowGoalModal(true);
  };

  const openEditG = (g) => {
    setEditingGId(g.id);
    setGForm({
      name:          g.name,
      targetWeight:  String(g.target?.weight  ?? 0),
      targetReps:    String(g.target?.reps    ?? 0),
      targetSets:    String(g.target?.sets    ?? 0),
      currentWeight: String(g.current?.weight ?? 0),
      currentReps:   String(g.current?.reps   ?? 0),
      currentSets:   String(g.current?.sets   ?? 0),
    });
    setShowGoalModal(true);
  };

  const saveG = async () => {
    if (!gForm.name.trim()) return pop("Error", "Exercise name is required.");
    const payload = {
      name:    gForm.name.trim(),
      target:  { weight: +gForm.targetWeight,  reps: +gForm.targetReps,  sets: +gForm.targetSets  },
      current: { weight: +gForm.currentWeight, reps: +gForm.currentReps, sets: +gForm.currentSets },
    };
    try {
      if (editingGId) {
        const r = await fetch(`${API}/api/progress/goals/${editingGId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const updated = await r.json();
        setGoals((prev) => prev.map((g) => g.id === editingGId ? updated : g));
      } else {
        const r = await fetch(`${API}/api/progress/goals`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const created = await r.json();
        setGoals((prev) => [created, ...prev]);
      }
      setShowGoalModal(false);
    } catch (e) { pop("Error", "Could not save. Is the server running?"); }
  };

  const confirmDeleteG = (g) => setDeleteGTarget({ id: g.id, name: g.name });

  const doDeleteG = async () => {
    if (!deleteGTarget) return;
    try {
      await fetch(`${API}/api/progress/goals/${deleteGTarget.id}`, { method: "DELETE" });
      setGoals((prev) => prev.filter((g) => g.id !== deleteGTarget.id));
    } catch (e) { pop("Error", "Could not delete."); }
    setDeleteGTarget(null);
  };

  // ── chart ─────────────────────────────────────────────────────────────────
  const sorted = [...measurements].sort((a, b) => a.date.localeCompare(b.date));

  const chartData = useMemo(() => ({
    labels:   sorted.length ? sorted.map((m) => m.date) : [""],
    datasets: [{
      data:        sorted.length ? sorted.map((m) => m.weight) : [0],
      color:       (o = 1) => `rgba(199,240,0,${o})`,
      strokeWidth: 2,
    }],
  }), [sorted]);

  const yLabels = useMemo(() => {
    if (!sorted.length) return ["0kg"];
    const ws  = sorted.map((m) => Number(m.weight));
    let mn    = Math.min(...ws), mx = Math.max(...ws);
    if (mn === mx) { mn = Math.max(0, mn - 1); mx += 1; }
    const stp = (mx - mn) / 4;
    return Array.from({ length: 5 }, (_, i) => `${(mx - stp * i).toFixed(1)}kg`);
  }, [sorted]);

  // ── goal progress calc ────────────────────────────────────────────────────
  const goalProgress = (g) => {
    const tw = g.target?.weight || 0;
    const tr = g.target?.reps   || 0;
    const ts = g.target?.sets   || 0;
    const total = tw + tr + ts;
    if (total === 0) return 0;
    const cw = Math.min(g.current?.weight || 0, tw);
    const cr = Math.min(g.current?.reps   || 0, tr);
    const cs = Math.min(g.current?.sets   || 0, ts);
    return Math.round(((cw + cr + cs) / total) * 100);
  };

  // ── render goal card ──────────────────────────────────────────────────────
  const GoalCard = ({ g }) => {
    const pct = goalProgress(g);
    return (
      <View style={s.goalCard}>
        <View style={s.goalCardTop}>
          <View style={{ flex: 1 }}>
            <Text style={s.goalName}>{g.name}</Text>
            <Text style={s.goalSub}>
              {g.target?.weight ?? 0}kg × {g.target?.reps ?? 0} reps × {g.target?.sets ?? 0} sets
            </Text>
          </View>
          <View style={s.goalActions}>
            <TouchableOpacity style={s.iconBtn} onPress={() => openEditG(g)}>
              <Text style={s.iconEdit}>✎</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.iconBtn} onPress={() => confirmDeleteG(g)}>
              <Text style={s.iconDelete}>🗑</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Progress bar */}
        <View style={s.progressRow}>
          <Text style={s.progressLabel}>Overall Progress</Text>
          <Text style={s.progressPct}>{pct}%</Text>
        </View>
        <View style={s.barBg}>
          <View style={[s.barFill, { width: `${pct}%` }]} />
        </View>

        {/* Current stats */}
        <View style={s.statsRow}>
          {[
            { label: "Weight", cur: `${g.current?.weight ?? 0}kg`, target: `/${g.target?.weight ?? 0}kg` },
            { label: "Reps",   cur: String(g.current?.reps ?? 0),  target: `/${g.target?.reps ?? 0}`    },
            { label: "Sets",   cur: String(g.current?.sets ?? 0),  target: `/${g.target?.sets ?? 0}`    },
          ].map((stat) => (
            <View key={stat.label} style={s.statCol}>
              <Text style={s.statLabel2}>{stat.label}</Text>
              <Text style={s.statCur}>{stat.cur}</Text>
              <Text style={s.statTarget}>{stat.target}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // ── render measurement row ────────────────────────────────────────────────
  const MRow = ({ item }) => (
    <View style={s.mRow}>
      <Text style={s.mDate}>{item.date}</Text>
      <Text style={s.mWeight}>{item.weight}kg</Text>
      <Text style={s.mBf}>{item.bodyFat}%</Text>
      <Text style={s.mWaist}>{item.waist}cm</Text>
      <View style={s.mActions}>
        <TouchableOpacity style={s.iconBtn} onPress={() => openEditM(item)}>
          <Text style={s.iconEdit}>✎</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.iconBtn} onPress={() => confirmDeleteM(item)}>
          <Text style={s.iconDelete}>🗑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>

      {/* ── Page title ── */}
      <View style={s.titleBar}>
        <Text style={s.pageTitle}>Progress Tracking Dashboard</Text>
      </View>

      {/* ── Tab pills ── */}
      <View style={s.tabRow}>
        <TouchableOpacity
          style={[s.tabPill, tab === "exercises" && s.tabPillActive]}
          onPress={() => setTab("exercises")}
        >
          <Text style={[s.tabPillText, tab === "exercises" && s.tabPillTextActive]}>Exercises</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tabPill, tab === "bodystats" && s.tabPillActive]}
          onPress={() => setTab("bodystats")}
        >
          <Text style={[s.tabPillText, tab === "bodystats" && s.tabPillTextActive]}>Body Stats</Text>
        </TouchableOpacity>
      </View>

      {/* ══════════════ EXERCISES TAB ══════════════ */}
      {tab === "exercises" && (
        <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
          {/* Section header */}
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Exercise Goals</Text>
            <TouchableOpacity style={s.addBtn} onPress={openAddGoal}>
              <Text style={s.addBtnText}>+ Add Goal</Text>
            </TouchableOpacity>
          </View>

          {goals.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyIcon}>🏋️</Text>
              <Text style={s.emptyText}>No exercise goals yet.</Text>
              <Text style={s.emptySub}>Tap "+ Add Goal" to create your first goal.</Text>
            </View>
          ) : (
            goals.map((g) => <GoalCard key={g.id} g={g} />)
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ══════════════ BODY STATS TAB ══════════════ */}
      {tab === "bodystats" && (
        <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
          {/* Section header */}
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Body Measurements</Text>
            <TouchableOpacity style={s.addBtn} onPress={openLog}>
              <Text style={s.addBtnText}>+ Log Today</Text>
            </TouchableOpacity>
          </View>

          {/* Weight Trend chart */}
          <View
            style={s.chartCard}
            onLayout={(e) => {
              const w = e.nativeEvent.layout.width;
              if (w > 0) setChartW(w - 16);
            }}
          >
            <Text style={s.chartTitle}>Weight Trend</Text>
            {sorted.length === 0 ? (
              <View style={s.chartEmpty}>
                <Text style={s.chartEmptyText}>Log your first measurement to see the chart</Text>
              </View>
            ) : (
              <View style={{ flexDirection: "row" }}>
                {/* Custom y-axis */}
                <View style={s.yAxis}>
                  {yLabels.map((l) => (
                    <Text key={l} style={s.yLabel}>{l}</Text>
                  ))}
                </View>
                <LineChart
                  data={chartData}
                  width={Math.max(0, chartW - 52)}
                  height={180}
                  withHorizontalLabels={false}
                  chartConfig={{
                    backgroundColor:        CARD,
                    backgroundGradientFrom: CARD,
                    backgroundGradientTo:   CARD,
                    decimalPlaces:          1,
                    color:                  (o = 1) => `rgba(199,240,0,${o})`,
                    labelColor:             (o = 1) => `rgba(136,136,136,${o})`,
                    propsForDots:           { r: "4", strokeWidth: "2", stroke: GREEN, fill: GREEN },
                    propsForLabels:         { fontSize: 9 },
                  }}
                  style={{ borderRadius: 0, paddingRight: 0 }}
                  bezier
                  segments={4}
                />
              </View>
            )}
          </View>

          {/* Measurements table */}
          <View style={s.tableCard}>
            {/* Header row */}
            <View style={s.tableHead}>
              {["DATE", "WEIGHT", "BF%", "WAIST", "EDIT"].map((h, i) => (
                <Text key={h} style={[s.thCell, i === 4 && { flex: 0.7 }]}>{h}</Text>
              ))}
            </View>

            {measurements.length === 0 ? (
              <View style={s.empty}>
                <Text style={s.emptyIcon}>📏</Text>
                <Text style={s.emptyText}>No measurements yet.</Text>
                <Text style={s.emptySub}>Tap "+ Log Today" to start tracking.</Text>
              </View>
            ) : (
              <FlatList
                data={measurements}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <MRow item={item} />}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={s.divider} />}
              />
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ══ LOG / EDIT MEASUREMENT MODAL ══ */}
      <Modal visible={showLogModal} transparent animationType="slide" onRequestClose={() => setShowLogModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            {/* Header */}
            <View style={s.modalHead}>
              <Text style={s.modalTitle}>{editingMId ? "Edit Measurement" : "Log Measurement"}</Text>
              <TouchableOpacity onPress={() => setShowLogModal(false)} style={s.closeBtn}>
                <Text style={s.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Fields */}
            {[
              { label: "Weight (kg)",   key: "weight",  placeholder: "e.g., 80" },
              { label: "Body Fat (%)",  key: "bodyFat", placeholder: "e.g., 16" },
              { label: "Waist (cm)",    key: "waist",   placeholder: "e.g., 82" },
            ].map(({ label, key, placeholder }) => (
              <View key={key}>
                <Text style={s.fieldLabel}>{label}</Text>
                <TextInput
                  style={s.fieldInput}
                  placeholder={placeholder}
                  placeholderTextColor={MUTED}
                  keyboardType="decimal-pad"
                  value={mForm[key]}
                  onChangeText={(t) => setMForm((f) => ({ ...f, [key]: t.replace(/[^0-9.]/g, "") }))}
                />
              </View>
            ))}

            <TouchableOpacity style={s.saveBtn} onPress={saveM}>
              <Text style={s.saveBtnText}>
                {editingMId ? "Save Changes" : "Log Measurement"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ══ ADD / EDIT GOAL MODAL ══ */}
      <Modal visible={showGoalModal} transparent animationType="slide" onRequestClose={() => setShowGoalModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.modalHead}>
              <Text style={s.modalTitle}>{editingGId ? "Edit Exercise Goal" : "Add Exercise Goal"}</Text>
              <TouchableOpacity onPress={() => setShowGoalModal(false)} style={s.closeBtn}>
                <Text style={s.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={s.fieldLabel}>Exercise Name</Text>
            <TextInput
              style={s.fieldInput}
              placeholder="Bench Press"
              placeholderTextColor={MUTED}
              value={gForm.name}
              onChangeText={(t) => setGForm((f) => ({ ...f, name: t }))}
            />

            {/* Target row */}
            <View style={s.triRow}>
              {[
                { label: "Target kg",   key: "targetWeight" },
                { label: "Target Reps", key: "targetReps"   },
                { label: "Target Sets", key: "targetSets"   },
              ].map(({ label, key }) => (
                <View key={key} style={{ flex: 1 }}>
                  <Text style={s.fieldLabel}>{label}</Text>
                  <TextInput
                    style={[s.fieldInput, { textAlign: "center" }]}
                    keyboardType="numeric"
                    value={gForm[key]}
                    onChangeText={(t) => setGForm((f) => ({ ...f, [key]: t.replace(/[^0-9]/g, "") }))}
                  />
                </View>
              ))}
            </View>

            {/* Current row — only shown when editing */}
            {editingGId && (
              <View style={s.triRow}>
                {[
                  { label: "Current kg",   key: "currentWeight" },
                  { label: "Current Reps", key: "currentReps"   },
                  { label: "Current Sets", key: "currentSets"   },
                ].map(({ label, key }) => (
                  <View key={key} style={{ flex: 1 }}>
                    <Text style={s.fieldLabel}>{label}</Text>
                    <TextInput
                      style={[s.fieldInput, { textAlign: "center" }]}
                      keyboardType="numeric"
                      value={gForm[key]}
                      onChangeText={(t) => setGForm((f) => ({ ...f, [key]: t.replace(/[^0-9]/g, "") }))}
                    />
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity style={s.saveBtn} onPress={saveG}>
              <Text style={s.saveBtnText}>✓  Save Goal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ══ DELETE MEASUREMENT CONFIRM ══ */}
      <Modal visible={!!deleteMTarget} transparent animationType="fade" onRequestClose={() => setDeleteMTarget(null)}>
        <View style={s.modalOverlay}>
          <View style={s.confirmBox}>
            <Text style={s.confirmTitle}>Delete Measurement</Text>
            <Text style={s.confirmMsg}>Are you sure you want to delete this measurement?</Text>
            <View style={s.confirmBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setDeleteMTarget(null)}>
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.deleteBtn} onPress={doDeleteM}>
                <Text style={s.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ══ DELETE GOAL CONFIRM ══ */}
      <Modal visible={!!deleteGTarget} transparent animationType="fade" onRequestClose={() => setDeleteGTarget(null)}>
        <View style={s.modalOverlay}>
          <View style={s.confirmBox}>
            <Text style={s.confirmTitle}>Delete Goal</Text>
            <Text style={s.confirmMsg}>Are you sure you want to delete this goal?</Text>
            <View style={s.confirmBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setDeleteGTarget(null)}>
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.deleteBtn} onPress={doDeleteG}>
                <Text style={s.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: BG },

  titleBar:   { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  pageTitle:  { color: WHITE, fontSize: 20, fontWeight: "800" },

  tabRow:     { flexDirection: "row", padding: 12, gap: 10 },
  tabPill:    { flex: 1, paddingVertical: 10, borderRadius: 24, alignItems: "center", backgroundColor: CARD, borderWidth: 1, borderColor: BORDER },
  tabPillActive: { backgroundColor: GREEN, borderColor: GREEN },
  tabPillText:   { color: MUTED, fontSize: 14, fontWeight: "700" },
  tabPillTextActive: { color: "#000" },

  scroll:     { flex: 1, paddingHorizontal: 16 },

  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16, marginBottom: 14 },
  sectionTitle:  { color: WHITE, fontSize: 16, fontWeight: "700" },
  addBtn:        { backgroundColor: GREEN, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  addBtnText:    { color: "#000", fontSize: 12, fontWeight: "800" },

  // goal card
  goalCard:    { backgroundColor: CARD, borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: BORDER },
  goalCardTop: { flexDirection: "row", alignItems: "flex-start", marginBottom: 12 },
  goalName:    { color: WHITE, fontSize: 15, fontWeight: "700" },
  goalSub:     { color: MUTED, fontSize: 11, marginTop: 3 },
  goalActions: { flexDirection: "row", gap: 4 },

  progressRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  progressLabel:{ color: MUTED, fontSize: 11 },
  progressPct: { color: GREEN, fontSize: 12, fontWeight: "700" },
  barBg:       { height: 6, backgroundColor: "#2A2A2A", borderRadius: 3, marginBottom: 14, overflow: "hidden" },
  barFill:     { height: 6, backgroundColor: GREEN, borderRadius: 3 },

  statsRow:    { flexDirection: "row" },
  statCol:     { flex: 1 },
  statLabel2:  { color: MUTED, fontSize: 10, marginBottom: 2 },
  statCur:     { color: WHITE, fontSize: 20, fontWeight: "900" },
  statTarget:  { color: MUTED, fontSize: 11 },

  iconBtn:     { padding: 6 },
  iconEdit:    { color: MUTED, fontSize: 15 },
  iconDelete:  { color: RED, fontSize: 15 },

  // chart
  chartCard:   { backgroundColor: CARD, borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: BORDER },
  chartTitle:  { color: WHITE, fontSize: 15, fontWeight: "700", marginBottom: 10 },
  chartEmpty:  { height: 120, justifyContent: "center", alignItems: "center" },
  chartEmptyText: { color: MUTED, fontSize: 13, textAlign: "center" },
  yAxis:       { width: 52, justifyContent: "space-between", paddingVertical: 8 },
  yLabel:      { color: MUTED, fontSize: 10 },

  // table
  tableCard:   { backgroundColor: CARD, borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: BORDER, marginBottom: 16 },
  tableHead:   { flexDirection: "row", backgroundColor: CARD2, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: BORDER },
  thCell:      { flex: 1, color: MUTED, fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4 },

  mRow:        { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 12 },
  mDate:       { flex: 1, color: WHITE, fontSize: 13, fontWeight: "600" },
  mWeight:     { flex: 1, color: GREEN, fontSize: 13, fontWeight: "700" },
  mBf:         { flex: 1, color: WHITE, fontSize: 13 },
  mWaist:      { flex: 1, color: WHITE, fontSize: 13 },
  mActions:    { flex: 0.7, flexDirection: "row", justifyContent: "center", gap: 2 },
  divider:     { height: 1, backgroundColor: BORDER },

  // empty
  empty:       { alignItems: "center", paddingVertical: 36 },
  emptyIcon:   { fontSize: 40, marginBottom: 10 },
  emptyText:   { color: WHITE, fontSize: 15, fontWeight: "600", marginBottom: 4 },
  emptySub:    { color: MUTED, fontSize: 12, textAlign: "center" },

  // modals
  modalOverlay:{ flex: 1, backgroundColor: "rgba(0,0,0,0.82)", justifyContent: "flex-end" },
  modalBox:    { backgroundColor: CARD, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36 },
  modalHead:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  modalTitle:  { color: WHITE, fontSize: 17, fontWeight: "700" },
  closeBtn:    { width: 32, height: 32, justifyContent: "center", alignItems: "center" },
  closeBtnText:{ color: MUTED, fontSize: 20 },

  fieldLabel:  { color: WHITE, fontSize: 13, fontWeight: "600", marginTop: 12, marginBottom: 6 },
  fieldInput:  {
    backgroundColor: CARD2,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: WHITE,
    fontSize: 14,
  },

  triRow:      { flexDirection: "row", gap: 8, marginTop: 4 },

  saveBtn:     { backgroundColor: GREEN, borderRadius: 28, paddingVertical: 15, alignItems: "center", marginTop: 22 },
  saveBtnText: { color: "#000", fontSize: 15, fontWeight: "800" },

  // confirm dialog
  confirmBox:  { backgroundColor: CARD, borderRadius: 16, margin: 32, padding: 24, alignItems: "center" },
  confirmTitle:{ color: WHITE, fontSize: 16, fontWeight: "700", marginBottom: 8 },
  confirmMsg:  { color: MUTED, fontSize: 13, textAlign: "center", marginBottom: 20 },
  confirmBtns: { flexDirection: "row", gap: 16 },
  cancelBtn:   { paddingHorizontal: 24, paddingVertical: 10 },
  cancelBtnText:{ color: BLUE, fontSize: 14, fontWeight: "700" },
  deleteBtn:   { paddingHorizontal: 24, paddingVertical: 10 },
  deleteBtnText:{ color: RED, fontSize: 14, fontWeight: "700" },
});
