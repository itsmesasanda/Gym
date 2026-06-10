import React, { useState, useEffect, useCallback } from "react";
import {
  ActivityIndicator,
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
import { getUserEmail } from "../utils/session";
import { authFetch } from "../utils/authFetch";
import { SkeletonList } from "../components/Skeleton";

const API = BASE_URL;

// ── Theme (matches WorkoutScreen.js) ────────────────────────
const GREEN  = "#C7F000";
const BG     = "#0D0D0D";
const CARD   = "#1A1A1A";
const BORDER = "#2A2A2A";
const MUTED  = "#888888";
const WHITE  = "#FFFFFF";
const RED    = "#FF3B30";
const AMBER  = "#FFB020";

export default function WorkoutPlanScreen() {
  // home | generating | viewer
  const [view, setView]               = useState("home");
  const [plans, setPlans]             = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [injuryText, setInjuryText]   = useState("");
  const [loadingList, setLoadingList] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const email = getUserEmail();

  // ── Fetch saved plans ─────────────────────────────────────
  const fetchPlans = useCallback(async () => {
    if (!email) return;
    setLoadingList(true);
    try {
      const r = await authFetch(`${API}/api/workout-plans`);
      if (!r.ok) throw new Error("Fetch failed");
      const data = await r.json();
      setPlans(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("fetchPlans:", e);
    } finally {
      setLoadingList(false);
    }
  }, [email]);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  // ── Generate ──────────────────────────────────────────────
  const generatePlan = async () => {
    if (!email) {
      Alert.alert("Not signed in", "Please log in first.");
      return;
    }

    setErrorMessage("");
    setView("generating");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const r = await authFetch(`${API}/api/workout-plans/generate`, {
        method: "POST",
        signal: controller.signal,
        body: JSON.stringify({
          injuryDescription: injuryText.trim(),
        }),
      });

      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.message || "Could not generate plan.");
      }

      const newPlan = await r.json();
      setSelectedPlan(newPlan);
      setInjuryText("");
      await fetchPlans();
      setView("viewer");
    } catch (e) {
      const message = e.name === "AbortError"
        ? "The workout AI took too long to respond. Make sure the workout AI service is running on port 8000, then try again."
        : e.message || "Something went wrong.";
      setErrorMessage(message);
      Alert.alert("Could not generate plan", message);
      setView("home");
    } finally {
      clearTimeout(timeoutId);
    }
  };

  // ── Delete plan ───────────────────────────────────────────
  const deletePlan = (planId) => {
    Alert.alert("Delete plan", "Are you sure you want to delete this plan?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await authFetch(`${API}/api/workout-plans/${planId}`, { method: "DELETE" });
            await fetchPlans();
            setView("home");
            setSelectedPlan(null);
          } catch (e) {
            Alert.alert("Error", "Could not delete plan.");
          }
        },
      },
    ]);
  };

  // ── Open viewer ───────────────────────────────────────────
  const openPlan = (plan) => {
    setSelectedPlan(plan);
    setView("viewer");
  };

  // ── Score color helper ────────────────────────────────────
  const scoreColor = (score) => {
    if (score == null)   return MUTED;
    if (score >= 80)     return GREEN;
    if (score >= 60)     return AMBER;
    return RED;
  };

  // ════════════════════════════════════════════════════════
  // RENDER: HOME
  // ════════════════════════════════════════════════════════
  if (view === "home") {
    return (
      <SafeAreaView style={s.container}>
        <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={s.pageTitle}>AI Plans</Text>
          <Text style={s.pageSubtitle}>Generate a 7-day workout plan tailored to your profile.</Text>

          {errorMessage ? (
            <View style={s.errorCard}>
              <Text style={s.errorTitle}>Could not generate plan</Text>
              <Text style={s.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Generator card */}
          <View style={s.formCard}>
            <Text style={s.formLabel}>Any injury or pain to work around?</Text>
            <TextInput
              style={[s.formInput, s.notesInput]}
              placeholder="Optional — e.g. lower back pain, knee tweak"
              placeholderTextColor={MUTED}
              value={injuryText}
              onChangeText={setInjuryText}
              multiline
            />
            <Text style={s.formHelper}>
              Leave empty if you have no injuries. Your fitness level and goal will be pulled from your profile.
            </Text>

            <TouchableOpacity style={s.saveBtn} onPress={generatePlan} activeOpacity={0.85}>
              <Text style={s.saveBtnText}>Generate New Plan</Text>
            </TouchableOpacity>
          </View>

          {/* Saved plans list */}
          <Text style={s.sectionTitle}>Your Saved Plans</Text>

          {loadingList && plans.length === 0 ? (
            <SkeletonList count={3} height={108} />
          ) : plans.length === 0 ? (
            <Text style={s.emptyText}>No plans yet. Generate your first one above.</Text>
          ) : (
            plans.map((p) => (
              <TouchableOpacity key={p._id} style={s.planCard} onPress={() => openPlan(p)} activeOpacity={0.85}>
                <View style={s.cardAccent} />
                <View style={s.cardBody}>
                  <View style={s.cardTopRow}>
                    <Text style={s.cardTitle} numberOfLines={1}>{p.title}</Text>
                    {p.validation?.score != null && (
                      <View style={[s.scoreBadge, { backgroundColor: scoreColor(p.validation.score) }]}>
                        <Text style={s.scoreBadgeText}>{p.validation.score}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={s.cardSub}>Goal: {p.goal}</Text>
                  <Text style={s.cardSub}>
                    {p.injuryDescription ? `Injury: ${p.injuryDescription}` : "No injury noted"}
                  </Text>
                  <Text style={s.cardDate}>
                    {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ════════════════════════════════════════════════════════
  // RENDER: GENERATING
  // ════════════════════════════════════════════════════════
  if (view === "generating") {
    return (
      <SafeAreaView style={[s.container, s.centered]}>
        <ActivityIndicator size="large" color={GREEN} />
        <Text style={s.generatingTitle}>Building your plan…</Text>
        <Text style={s.generatingSub}>This usually takes about 10 seconds.</Text>
        <Text style={[s.generatingSub, { marginTop: 8 }]}>Don't close the app.</Text>
      </SafeAreaView>
    );
  }

  // ════════════════════════════════════════════════════════
  // RENDER: PLAN VIEWER
  // ════════════════════════════════════════════════════════
  if (view === "viewer" && selectedPlan) {
    const v = selectedPlan.validation || {};
    return (
      <SafeAreaView style={s.container}>
        <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Back */}
          <TouchableOpacity onPress={() => { setView("home"); setSelectedPlan(null); }} style={s.backRow}>
            <Text style={s.backText}>← Back to plans</Text>
          </TouchableOpacity>

          <Text style={s.pageTitle}>{selectedPlan.title}</Text>
          <Text style={s.pageSubtitle}>Goal: {selectedPlan.goal}</Text>

          {selectedPlan.injuryDescription ? (
            <View style={s.infoCard}>
              <Text style={s.infoLabel}>Injury Note</Text>
              <Text style={s.infoText}>"{selectedPlan.injuryDescription}"</Text>
            </View>
          ) : null}

          {/* Validation summary */}
          {v.score != null && (
            <View style={s.infoCard}>
              <View style={s.cardTopRow}>
                <Text style={s.infoLabel}>Quality Score</Text>
                <View style={[s.scoreBadge, { backgroundColor: scoreColor(v.score) }]}>
                  <Text style={s.scoreBadgeText}>{v.score}/100</Text>
                </View>
              </View>
              {(v.errors?.length > 0) && (
                <View style={{ marginTop: 8 }}>
                  {v.errors.map((e, i) => (
                    <Text key={i} style={[s.warnText, { color: RED }]}>• {e}</Text>
                  ))}
                </View>
              )}
              {(v.warnings?.length > 0) && (
                <View style={{ marginTop: 8 }}>
                  {v.warnings.map((w, i) => (
                    <Text key={i} style={s.warnText}>• {w}</Text>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Days */}
          {selectedPlan.days?.map((day) => (
            <View key={day.day_number} style={s.dayCard}>
              <View style={s.dayHeader}>
                <Text style={s.dayNumber}>Day {day.day_number}</Text>
                <Text style={s.dayFocus}>{day.focus}</Text>
              </View>

              {day.exercises?.length === 0 ? (
                <Text style={s.restText}>Rest Day 💤</Text>
              ) : (
                day.exercises.map((ex, i) => (
                  <View key={i} style={s.exerciseRow}>
                    <Text style={s.exerciseName}>{ex.name}</Text>
                    <Text style={s.exerciseMeta}>
                      {ex.sets} sets × {ex.reps}
                    </Text>
                    {ex.notes ? (
                      <Text style={s.exerciseNotes}>📝 {ex.notes}</Text>
                    ) : null}
                  </View>
                ))
              )}
            </View>
          ))}

          {/* Delete */}
          <TouchableOpacity
            style={s.deleteBtn}
            onPress={() => deletePlan(selectedPlan._id)}
            activeOpacity={0.85}
          >
            <Text style={s.deleteBtnText}>Delete This Plan</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

// ── Styles ─────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  centered:  { alignItems: "center", justifyContent: "center" },
  scroll:    { flex: 1, paddingHorizontal: 16 },

  pageTitle:    { color: WHITE, fontSize: 28, fontWeight: "900", marginTop: 20, marginBottom: 4 },
  pageSubtitle: { color: MUTED, fontSize: 13, marginBottom: 20 },
  sectionTitle: { color: WHITE, fontSize: 16, fontWeight: "800", marginTop: 8, marginBottom: 12 },

  emptyText:    { color: MUTED, textAlign: "center", padding: 20, backgroundColor: CARD, borderRadius: 12 },

  errorCard: {
    backgroundColor: "rgba(255, 59, 48, 0.12)",
    borderColor: RED,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  errorTitle: { color: WHITE, fontSize: 14, fontWeight: "800", marginBottom: 4 },
  errorText: { color: "#ffb4ad", fontSize: 12, lineHeight: 17 },

  // Form card (generator)
  formCard: {
    backgroundColor: CARD, borderRadius: 12, borderWidth: 1,
    borderColor: BORDER, padding: 16, marginBottom: 14,
  },
  formLabel:    { color: MUTED, fontSize: 12, fontWeight: "700", marginBottom: 8, textTransform: "uppercase" },
  formInput:    {
    backgroundColor: "#111", borderRadius: 8, borderWidth: 1,
    borderColor: BORDER, color: WHITE, padding: 13,
  },
  notesInput:   { height: 80, textAlignVertical: "top" },
  formHelper:   { color: MUTED, fontSize: 11, marginTop: 8, marginBottom: 14, lineHeight: 16 },

  saveBtn:     {
    backgroundColor: GREEN, borderRadius: 12, paddingVertical: 17,
    alignItems: "center",
  },
  saveBtnText: { color: "#111", fontSize: 16, fontWeight: "900" },

  // Plan card (list item)
  planCard: {
    flexDirection: "row", backgroundColor: CARD, borderRadius: 12,
    borderWidth: 1, borderColor: BORDER, marginBottom: 12, overflow: "hidden",
  },
  cardAccent:    { width: 4, backgroundColor: GREEN },
  cardBody:      { flex: 1, padding: 14 },
  cardTopRow:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  cardTitle:     { color: WHITE, fontSize: 15, fontWeight: "800", flex: 1, marginRight: 8 },
  cardSub:       { color: MUTED, fontSize: 12, marginBottom: 2 },
  cardDate:      { color: MUTED, fontSize: 11, marginTop: 6 },

  scoreBadge:    { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, minWidth: 40, alignItems: "center" },
  scoreBadgeText:{ color: "#111", fontSize: 11, fontWeight: "800" },

  // Generating screen
  generatingTitle: { color: WHITE, fontSize: 18, fontWeight: "800", marginTop: 24 },
  generatingSub:   { color: MUTED, fontSize: 13, marginTop: 6, paddingHorizontal: 30, textAlign: "center" },

  // Viewer
  backRow:  { marginTop: 10, marginBottom: 4 },
  backText: { color: WHITE, fontSize: 15, fontWeight: "700" },

  infoCard: {
    backgroundColor: CARD, borderRadius: 12, borderWidth: 1,
    borderColor: BORDER, padding: 14, marginBottom: 14,
  },
  infoLabel: { color: MUTED, fontSize: 12, fontWeight: "700", textTransform: "uppercase", marginBottom: 4 },
  infoText:  { color: WHITE, fontSize: 14, fontStyle: "italic" },
  warnText:  { color: AMBER, fontSize: 12, marginTop: 2 },

  // Day card
  dayCard: {
    backgroundColor: CARD, borderRadius: 12, borderWidth: 1,
    borderColor: BORDER, padding: 14, marginBottom: 12,
    borderLeftWidth: 4, borderLeftColor: GREEN,
  },
  dayHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  dayNumber: { color: GREEN, fontSize: 13, fontWeight: "900", marginRight: 12 },
  dayFocus:  { color: WHITE, fontSize: 16, fontWeight: "800" },

  restText: { color: MUTED, fontSize: 14, fontStyle: "italic", textAlign: "center", paddingVertical: 8 },

  exerciseRow: {
    paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: BORDER,
  },
  exerciseName:  { color: WHITE, fontSize: 14, fontWeight: "700" },
  exerciseMeta:  { color: GREEN, fontSize: 12, fontWeight: "700", marginTop: 2 },
  exerciseNotes: { color: MUTED, fontSize: 12, marginTop: 4, fontStyle: "italic" },

  // Delete button
  deleteBtn:     {
    backgroundColor: RED, borderRadius: 12, paddingVertical: 17,
    alignItems: "center", marginTop: 12, marginBottom: 12,
  },
  deleteBtnText: { color: WHITE, fontSize: 16, fontWeight: "900" },
});
