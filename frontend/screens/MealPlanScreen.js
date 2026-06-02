import React, { useState, useEffect, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
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
import { createMealLog, getCalorieUserId } from "../services/calorieApi";

const API = BASE_URL;

const GREEN  = "#C7F000";
const BG     = "#0D0D0D";
const CARD   = "#1A1A1A";
const BORDER = "#2A2A2A";
const MUTED  = "#888888";
const WHITE  = "#FFFFFF";
const RED    = "#FF3B30";
const AMBER  = "#FFB020";
const BLUE   = "#007AFF";



export default function MealPlanScreen() {
  const [view, setView]               = useState("home");
  const [plans, setPlans]             = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [calories, setCalories]       = useState("");
  const [protein, setProtein]         = useState("");
  const [carbs, setCarbs]             = useState("");
  const [context, setContext]         = useState("");
  const [loadingList, setLoadingList] = useState(false);

  // Log modal state
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [logMeal, setLogMeal]                 = useState(null);
  const [logGrams, setLogGrams]               = useState("");
  const [logging, setLogging]                 = useState(false);

  const email = getUserEmail();

  // ── Fetch saved plans ─────────────────────────────────────
  const fetchPlans = useCallback(async () => {
    if (!email) return;
    setLoadingList(true);
    try {
      const r = await authFetch(`${API}/api/meal-plans`);
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

  // ── Recommend ─────────────────────────────────────────────
  const recommend = async () => {
    if (!email) {
      Alert.alert("Not signed in", "Please log in first.");
      return;
    }

    const cal = parseFloat(calories);
    if (!cal || cal < 50 || cal > 5000) {
      Alert.alert("Invalid calories", "Enter a value between 50 and 5000.");
      return;
    }

    setView("generating");
    try {
      const body = { calories: cal };
      if (protein) body.protein = parseFloat(protein);
      if (carbs)   body.carbs = parseFloat(carbs);
      if (context.trim()) body.context = context.trim();

      const r = await authFetch(`${API}/api/meal-plans/recommend`, {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.message || "Could not get recommendations.");
      }

      const newPlan = await r.json();
      setSelectedPlan(newPlan);
      setCalories("");
      setProtein("");
      setCarbs("");
      setContext("");
      await fetchPlans();
      setView("viewer");
    } catch (e) {
      Alert.alert("Error", e.message || "Something went wrong.");
      setView("home");
    }
  };

  // ── Delete ────────────────────────────────────────────────
  const deletePlan = (planId) => {
    Alert.alert("Delete recommendation", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await authFetch(`${API}/api/meal-plans/${planId}`, { method: "DELETE" });
            await fetchPlans();
            setView("home");
            setSelectedPlan(null);
          } catch (e) {
            Alert.alert("Error", "Could not delete.");
          }
        },
      },
    ]);
  };

  const openPlan = (plan) => {
    setSelectedPlan(plan);
    setView("viewer");
  };

  // ── Add to calorie log ────────────────────────────────────
const openLogModal = (meal) => {
    setLogMeal(meal);
    setLogGrams(String(meal.serving_size_g || 100));
    setLogModalVisible(true);
  };

  const confirmLog = async () => {
    if (!logMeal || !email) return;
    const grams = parseFloat(logGrams);
    if (!grams || grams <= 0) {
      Alert.alert("Invalid weight", "Enter a weight in grams.");
      return;
    }
    setLogging(true);

    try {
      const baseServing = logMeal.serving_size_g || 100;
      const ratio = grams / baseServing;
      const userId = getCalorieUserId(email);
      const mealData = {
        foodName:  `${logMeal.title} (${Math.round(grams)}g)`,
        calories:  Math.round(logMeal.calories * ratio),
        protein:   Math.round(logMeal.protein * ratio),
        carbs:     Math.round((logMeal.carbs || 0) * ratio),
        fats:      Math.round(logMeal.fat * ratio),
      };

      await createMealLog(userId, mealData);
      Alert.alert(
        "Logged",
        `${mealData.foodName} — ${mealData.calories} kcal added to today's log.`
      );
      setLogModalVisible(false);
      setLogMeal(null);
    } catch (e) {
      Alert.alert("Error", "Could not log this meal. Please try again.");
      console.error("confirmLog:", e);
    } finally {
      setLogging(false);
    }
  };

  const matchColor = (pct) => {
    if (pct == null) return MUTED;
    if (pct >= 90)   return GREEN;
    if (pct >= 70)   return AMBER;
    return RED;
  };

  // ════════════════════════════════════════════════════════
  // LOG MODAL
  // ════════════════════════════════════════════════════════
  const renderLogModal = () => {
    if (!logMeal) return null;
    const servingG = logMeal.serving_size_g || 100;
    return (
      <Modal
        visible={logModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLogModalVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Add to Calorie Log</Text>
            <Text style={s.modalMealName}>{logMeal.title}</Text>

            <Text style={s.modalLabel}>How much did you eat? (grams)</Text>
            <TextInput
              style={[s.formInput, { marginBottom: 16 }]}
              placeholder="e.g. 200"
              placeholderTextColor={MUTED}
              value={logGrams}
              onChangeText={setLogGrams}
              keyboardType="numeric"
            />

            {/* Preview */}
            <View style={s.previewCard}>
              <Text style={s.previewTitle}>What you'll log:</Text>
              <Text style={s.previewLine}>
                Weight: {logGrams || 0}g (recommended: {servingG}g)
              </Text>
              <Text style={s.previewLine}>
                Calories: {Math.round(logMeal.calories * (parseFloat(logGrams) || 0) / servingG)} kcal
              </Text>
              <Text style={s.previewLine}>
                Protein: {Math.round(logMeal.protein * (parseFloat(logGrams) || 0) / servingG)}g  •  
                Carbs: {Math.round((logMeal.carbs || 0) * (parseFloat(logGrams) || 0) / servingG)}g  •  
                Fat: {Math.round(logMeal.fat * (parseFloat(logGrams) || 0) / servingG)}g
              </Text>
            </View>

            <View style={s.modalButtons}>
              <TouchableOpacity
                style={s.cancelBtn}
                onPress={() => setLogModalVisible(false)}
              >
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.confirmBtn}
                onPress={confirmLog}
                disabled={logging}
              >
                {logging ? (
                  <ActivityIndicator size="small" color="#111" />
                ) : (
                  <Text style={s.confirmBtnText}>Log Meal</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // ════════════════════════════════════════════════════════
  // HOME
  // ════════════════════════════════════════════════════════
  if (view === "home") {
    return (
      <SafeAreaView style={s.container}>
        <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
          <Text style={s.pageTitle}>Meal Recommendations</Text>
          <Text style={s.pageSubtitle}>Get 5 AI-matched meals based on your targets.</Text>

          <View style={s.formCard}>
            <Text style={s.formLabel}>Calories (required)</Text>
            <TextInput
              style={s.formInput}
              placeholder="e.g. 500"
              placeholderTextColor={MUTED}
              value={calories}
              onChangeText={setCalories}
              keyboardType="numeric"
            />

            <View style={s.row}>
              <View style={s.halfInput}>
                <Text style={s.formLabel}>Protein (g)</Text>
                <TextInput
                  style={s.formInput}
                  placeholder="e.g. 30"
                  placeholderTextColor={MUTED}
                  value={protein}
                  onChangeText={setProtein}
                  keyboardType="numeric"
                />
              </View>
              <View style={s.halfInput}>
                <Text style={s.formLabel}>Carbs (g)</Text>
                <TextInput
                  style={s.formInput}
                  placeholder="e.g. 60"
                  placeholderTextColor={MUTED}
                  value={carbs}
                  onChangeText={setCarbs}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Text style={s.formLabel}>Context (optional)</Text>
            <TextInput
              style={[s.formInput, s.notesInput]}
              placeholder="e.g. post-workout, no dairy, Sri Lankan"
              placeholderTextColor={MUTED}
              value={context}
              onChangeText={setContext}
              multiline
            />

            <Text style={s.formHelper}>
              Your fitness goal will be pulled from your profile automatically.
            </Text>

            <TouchableOpacity style={s.saveBtn} onPress={recommend} activeOpacity={0.85}>
              <Text style={s.saveBtnText}>Get Recommendations</Text>
            </TouchableOpacity>
          </View>

          <Text style={s.sectionTitle}>Previous Recommendations</Text>

          {loadingList && plans.length === 0 ? (
            <Text style={s.emptyText}>Loading…</Text>
          ) : plans.length === 0 ? (
            <Text style={s.emptyText}>No recommendations yet. Try one above.</Text>
          ) : (
            plans.map((p) => (
              <TouchableOpacity key={p._id} style={s.planCard} onPress={() => openPlan(p)} activeOpacity={0.85}>
                <View style={s.cardAccent} />
                <View style={s.cardBody}>
                  <Text style={s.cardTitle}>{p.calories} kcal • {p.meals?.length || 0} meals</Text>
                  <Text style={s.cardSub}>
                    {p.context ? p.context : p.goal || "No context"}
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
  // GENERATING
  // ════════════════════════════════════════════════════════
  if (view === "generating") {
    return (
      <SafeAreaView style={[s.container, s.centered]}>
        <ActivityIndicator size="large" color={GREEN} />
        <Text style={s.generatingTitle}>Finding your meals…</Text>
        <Text style={s.generatingSub}>Searching 447 recipes for the best match.</Text>
        <Text style={[s.generatingSub, { marginTop: 8 }]}>This takes about 5 seconds.</Text>
      </SafeAreaView>
    );
  }

  // ════════════════════════════════════════════════════════
  // VIEWER
  // ════════════════════════════════════════════════════════
  if (view === "viewer" && selectedPlan) {
    return (
      <SafeAreaView style={s.container}>
        {renderLogModal()}
        <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>

          <TouchableOpacity onPress={() => { setView("home"); setSelectedPlan(null); }} style={s.backRow}>
            <Text style={s.backText}>← Back to recommendations</Text>
          </TouchableOpacity>

          <Text style={s.pageTitle}>{selectedPlan.calories} kcal Meals</Text>
          <Text style={s.pageSubtitle}>
            {selectedPlan.context ? `"${selectedPlan.context}"` : `Goal: ${selectedPlan.goal || "general"}`}
          </Text>

          {selectedPlan.meals?.map((meal, i) => (
            <View key={i} style={s.mealCard}>
              <View style={s.mealHeader}>
                <Text style={s.mealRank}>#{meal.rank}</Text>
                <Text style={s.mealTitle} numberOfLines={2}>{meal.title}</Text>
                <View style={[s.matchBadge, { backgroundColor: matchColor(meal.calorie_match_pct) }]}>
                  <Text style={s.matchBadgeText}>{meal.calorie_match_pct}%</Text>
                </View>
              </View>

              {/* Serving size */}
              {meal.serving_size_g > 0 && (
                <Text style={s.servingText}>Serving: {meal.serving_size_g}g</Text>
              )}

              <View style={s.macroRow}>
                <View style={s.macroItem}>
                  <Text style={s.macroValue}>{meal.calories}</Text>
                  <Text style={s.macroLabel}>kcal</Text>
                </View>
                <View style={s.macroItem}>
                  <Text style={s.macroValue}>{meal.protein}g</Text>
                  <Text style={s.macroLabel}>protein</Text>
                </View>
                <View style={s.macroItem}>
                  <Text style={s.macroValue}>{meal.carbs || 0}g</Text>
                  <Text style={s.macroLabel}>carbs</Text>
                </View>
                <View style={s.macroItem}>
                  <Text style={s.macroValue}>{meal.fat}g</Text>
                  <Text style={s.macroLabel}>fat</Text>
                </View>
                <View style={s.macroItem}>
                  <Text style={s.macroValue}>{meal.rating}</Text>
                  <Text style={s.macroLabel}>rating</Text>
                </View>
              </View>

              {meal.why_recommended ? (
                <Text style={s.whyText}>{meal.why_recommended}</Text>
              ) : null}

              {/* Add to calorie log button */}
              <TouchableOpacity
                style={s.logBtn}
                onPress={() => openLogModal(meal)}
                activeOpacity={0.85}
              >
                <Text style={s.logBtnText}>+ Add to Calorie Log</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity
            style={s.deleteBtn}
            onPress={() => deletePlan(selectedPlan._id)}
            activeOpacity={0.85}
          >
            <Text style={s.deleteBtnText}>Delete This Recommendation</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  centered:  { alignItems: "center", justifyContent: "center" },
  scroll:    { flex: 1, paddingHorizontal: 16 },

  pageTitle:    { color: WHITE, fontSize: 28, fontWeight: "900", marginTop: 20, marginBottom: 4 },
  pageSubtitle: { color: MUTED, fontSize: 13, marginBottom: 20 },
  sectionTitle: { color: WHITE, fontSize: 16, fontWeight: "800", marginTop: 8, marginBottom: 12 },

  emptyText: { color: MUTED, textAlign: "center", padding: 20, backgroundColor: CARD, borderRadius: 12 },

  formCard: {
    backgroundColor: CARD, borderRadius: 12, borderWidth: 1,
    borderColor: BORDER, padding: 16, marginBottom: 14,
  },
  formLabel:  { color: MUTED, fontSize: 12, fontWeight: "700", marginBottom: 6, marginTop: 10, textTransform: "uppercase" },
  formInput:  {
    backgroundColor: "#111", borderRadius: 8, borderWidth: 1,
    borderColor: BORDER, color: WHITE, padding: 13,
  },
  notesInput: { height: 70, textAlignVertical: "top" },
  formHelper: { color: MUTED, fontSize: 11, marginTop: 8, marginBottom: 14, lineHeight: 16 },
  row:        { flexDirection: "row", gap: 10 },
  halfInput:  { flex: 1 },

  saveBtn:     {
    backgroundColor: GREEN, borderRadius: 12, paddingVertical: 17,
    alignItems: "center",
  },
  saveBtnText: { color: "#111", fontSize: 16, fontWeight: "900" },

  planCard: {
    flexDirection: "row", backgroundColor: CARD, borderRadius: 12,
    borderWidth: 1, borderColor: BORDER, marginBottom: 12, overflow: "hidden",
  },
  cardAccent:  { width: 4, backgroundColor: GREEN },
  cardBody:    { flex: 1, padding: 14 },
  cardTitle:   { color: WHITE, fontSize: 15, fontWeight: "800", marginBottom: 4 },
  cardSub:     { color: MUTED, fontSize: 12, marginBottom: 2 },
  cardDate:    { color: MUTED, fontSize: 11, marginTop: 6 },

  generatingTitle: { color: WHITE, fontSize: 18, fontWeight: "800", marginTop: 24 },
  generatingSub:   { color: MUTED, fontSize: 13, marginTop: 6, paddingHorizontal: 30, textAlign: "center" },

  backRow:  { marginTop: 10, marginBottom: 4 },
  backText: { color: WHITE, fontSize: 15, fontWeight: "700" },

  // Meal card
  mealCard: {
    backgroundColor: CARD, borderRadius: 12, borderWidth: 1,
    borderColor: BORDER, padding: 14, marginBottom: 12,
    borderLeftWidth: 4, borderLeftColor: GREEN,
  },
  mealHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  mealRank:   { color: GREEN, fontSize: 14, fontWeight: "900", marginRight: 10 },
  mealTitle:  { color: WHITE, fontSize: 15, fontWeight: "800", flex: 1, marginRight: 8 },

  matchBadge:     { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, minWidth: 40, alignItems: "center" },
  matchBadgeText: { color: "#111", fontSize: 11, fontWeight: "800" },

  servingText: { color: AMBER, fontSize: 13, fontWeight: "700", marginBottom: 8 },

  macroRow:  { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  macroItem: { alignItems: "center", flex: 1 },
  macroValue:{ color: WHITE, fontSize: 15, fontWeight: "800" },
  macroLabel:{ color: MUTED, fontSize: 10, marginTop: 2, textTransform: "uppercase" },

  whyText: { color: MUTED, fontSize: 12, fontStyle: "italic", marginTop: 4, marginBottom: 8 },

  // Log button on each meal card
  logBtn: {
    backgroundColor: BLUE, borderRadius: 8, paddingVertical: 10,
    alignItems: "center", marginTop: 8,
  },
  logBtnText: { color: WHITE, fontSize: 13, fontWeight: "800" },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center", alignItems: "center", padding: 20,
  },
  modalCard: {
    backgroundColor: CARD, borderRadius: 16, padding: 20,
    width: "100%", maxWidth: 400, borderWidth: 1, borderColor: BORDER,
  },
  modalTitle:    { color: WHITE, fontSize: 20, fontWeight: "900", marginBottom: 4 },
  modalMealName: { color: GREEN, fontSize: 14, fontWeight: "700", marginBottom: 16 },
  modalLabel:    { color: MUTED, fontSize: 12, fontWeight: "700", textTransform: "uppercase", marginBottom: 8 },

  portionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  portionBtn: {
    backgroundColor: "#111", borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14,
    borderWidth: 1, borderColor: BORDER, minWidth: 52, alignItems: "center",
  },
  portionBtnActive: { backgroundColor: GREEN, borderColor: GREEN },
  portionBtnText:   { color: MUTED, fontSize: 14, fontWeight: "800" },
  portionBtnTextActive: { color: "#111" },

  previewCard: {
    backgroundColor: "#111", borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: BORDER, marginBottom: 16,
  },
  previewTitle: { color: MUTED, fontSize: 11, fontWeight: "700", textTransform: "uppercase", marginBottom: 6 },
  previewLine:  { color: WHITE, fontSize: 13, marginBottom: 3 },

  modalButtons: { flexDirection: "row", gap: 10 },
  cancelBtn: {
    flex: 1, borderRadius: 10, paddingVertical: 14,
    alignItems: "center", borderWidth: 1, borderColor: BORDER,
  },
  cancelBtnText: { color: MUTED, fontSize: 14, fontWeight: "800" },
  confirmBtn: {
    flex: 1, backgroundColor: GREEN, borderRadius: 10, paddingVertical: 14,
    alignItems: "center",
  },
  confirmBtnText: { color: "#111", fontSize: 14, fontWeight: "900" },

  deleteBtn:     {
    backgroundColor: RED, borderRadius: 12, paddingVertical: 17,
    alignItems: "center", marginTop: 12, marginBottom: 12,
  },
  deleteBtnText: { color: WHITE, fontSize: 16, fontWeight: "900" },
});
