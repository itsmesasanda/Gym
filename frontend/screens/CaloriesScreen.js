import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";

import {
  createMealLog,
  deleteMealLog,
  getCalorieUserId,
  getTodayLogs,
  getWeeklyLogs,
  searchFoods,
  updateMealLog,
} from "../services/calorieApi";
import { getUserEmail } from "../utils/session";
import { authFetch } from "../utils/authFetch";
import { BASE_URL } from "../config";
import { SkeletonBox, SkeletonCircle, SkeletonList } from "../components/Skeleton";

const BG      = "#000000";
const CARD    = "#1C1C1E";
const BORDER  = "#2C2C2E";
const GREEN   = "#C7F000";
const WHITE   = "#FFFFFF";
const MUTED   = "#A1A1A6";
const BLUE    = "#5AC8FA";
const RED     = "#FF453A";
const ORANGE  = "#FF9500";

const round = (v) => Math.round(Number(v || 0));
const calcMacros = (food, weightG) => {
  const w = Number(weightG) || 0;
  return {
    foodName: food.foodName,
    calories: Math.round(food.calories * w / 100),
    protein:  Math.round(food.protein  * w / 100),
    carbs:    Math.round(food.carbs    * w / 100),
    fats:     Math.round(food.fats     * w / 100),
  };
};
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const newEntry = () => ({ id: uid(), query: "", food: null, weight: "" });

const GOALS = [
  { key: "muscle_gain",  label: "Muscle Gain" },
  { key: "weight_loss",  label: "Weight Loss" },
  { key: "maintenance",  label: "Maintenance" },
  { key: "high_protein", label: "High Protein" },
  { key: "low_carb",    label: "Low Carb" },
];

/* ── Circular SVG ring ─────────────────────────────────────── */
function CircularProgress({ value, max, color, size = 90, stroke = 9, label, sub }) {
  const r      = (size - stroke) / 2;
  const circ   = 2 * Math.PI * r;
  const offset = circ - Math.min(value / Math.max(max, 1), 1) * circ;
  return (
    <View style={{ alignItems: "center", gap: 6 }}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
          <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={BORDER} strokeWidth={stroke} />
          <Circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={[circ, circ]} strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </Svg>
        <View style={s.ringCenter}>
          <Text style={s.ringValue}>{value}</Text>
          <Text style={s.ringMax}>/ {max}</Text>
        </View>
      </View>
      <View style={{ alignItems: "center" }}>
        <Text style={s.ringLabel}>{label}</Text>
        <Text style={s.ringSub}>{sub}</Text>
      </View>
    </View>
  );
}

/* ── Main screen ───────────────────────────────────────────── */
export default function CaloriesScreen() {
  const [tab, setTab]         = useState("today");
  const [expandedGroup, setExpandedGroup] = useState(null);

  /* Add-meal modal */
  const [showAddModal, setShowAddModal]     = useState(false);
  const [mealNameInput, setMealNameInput]   = useState("");
  const [foodEntries, setFoodEntries]       = useState([newEntry()]);
  const [activeIdx, setActiveIdx]           = useState(0);

  /* AI recommendation modal */
  const [showAiModal, setShowAiModal]   = useState(false);
  const [aiGoal, setAiGoal]             = useState("muscle_gain");
  const [aiCalories, setAiCalories]     = useState("");
  const [aiProtein, setAiProtein]       = useState("");
  const [aiContext, setAiContext]       = useState("");
  const [aiLoading, setAiLoading]       = useState(false);
  const [aiResults, setAiResults]       = useState(null);
  const [aiError, setAiError]           = useState("");
  const [editingAiRank, setEditingAiRank] = useState(null);
  const [aiEdits, setAiEdits]             = useState({});

  /* Data */
  const [dailyStats, setDailyStats]   = useState(null);
  const [weeklyStats, setWeeklyStats] = useState(null);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState("");

  const userId = getCalorieUserId(getUserEmail());

  /* Suggestions for the focused add-entry */
  const activeQuery = foodEntries[activeIdx]?.query ?? "";
  const suggestions = useMemo(() => searchFoods(activeQuery), [activeQuery]);

  /* ── API ────────────────────────────────────────────────── */
  const loadLogs = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getTodayLogs(userId);
      setDailyStats(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadWeeklyLogs = async () => {
    try {
      setWeeklyLoading(true);
      const res = await getWeeklyLogs(userId);
      setWeeklyStats(res.data);
    } catch {
      // silently fail — weekly chart just shows zeros
    } finally {
      setWeeklyLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setWeeklyStats(null);
      loadLogs();
    }, [])
  );

  useEffect(() => {
    if (tab === "weekly" && !weeklyStats) loadWeeklyLogs();
  }, [tab]);

  /* ── Add modal helpers ──────────────────────────────────── */
  const openAdd = () => {
    setMealNameInput("");
    setFoodEntries([newEntry()]);
    setActiveIdx(0);
    setShowAddModal(true);
  };

  const closeAdd = () => {
    setShowAddModal(false);
    setMealNameInput("");
    setFoodEntries([newEntry()]);
    setActiveIdx(0);
  };

  const updateEntryQuery = (idx, q) => {
    setActiveIdx(idx);
    setFoodEntries(prev => prev.map((e, i) => i === idx ? { ...e, query: q, food: null } : e));
  };

  const selectFoodForEntry = (idx, food) => {
    setFoodEntries(prev => {
      const next = prev.map((e, i) => i === idx ? { ...e, query: food.foodName, food } : e);
      if (idx === next.length - 1) next.push(newEntry());
      return next;
    });
    setActiveIdx(idx + 1);
  };

  const updateEntryWeight = (idx, w) => {
    setFoodEntries(prev => prev.map((e, i) => i === idx ? { ...e, weight: w } : e));
  };

  const removeEntry = (idx) => {
    setFoodEntries(prev => prev.length === 1 ? [newEntry()] : prev.filter((_, i) => i !== idx));
    setActiveIdx(0);
  };

  const saveMeals = async () => {
    const valid = foodEntries.filter(e => e.food && Number(e.weight) > 0);
    if (!valid.length) {
      Alert.alert("No foods ready", "Select a food and enter weight in grams.");
      return;
    }
    setSaving(true);
    const groupId   = uid();
    const groupName = mealNameInput.trim() || `Meal ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
    try {
      for (const entry of valid) {
        await createMealLog(userId, {
          ...calcMacros(entry.food, entry.weight),
          mealGroupId: groupId,
          mealName:    groupName,
        });
      }
      closeAdd();
      await loadLogs();
      setWeeklyStats(null); // invalidate so it reloads next time weekly tab is opened
    } catch (err) {
      Alert.alert("Could not save meals", err.message);
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete group ────────────────────────────────────────── */
  const deleteMealGroup = (group) => {
    Alert.alert(
      `Delete "${group.mealName}"?`,
      `This will remove ${group.foods.length} food item${group.foods.length > 1 ? "s" : ""}.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Promise.all(group.foods.map(food => deleteMealLog(String(food._id))))
              .then(() => { setExpandedGroup(null); return loadLogs(); })
              .catch(err => Alert.alert("Delete failed", err.message));
          },
        },
      ]
    );
  };

  /* ── AI recommendation ──────────────────────────────────── */
  const fetchAiRecs = async () => {
    const targetCal = Number(aiCalories);
    const targetPro = Number(aiProtein);
    if (!targetCal || targetCal < 50) {
      setAiError("Enter a calorie target (min 50 kcal).");
      return;
    }
    setAiLoading(true);
    setAiError("");
    setAiResults(null);
    try {
      // Goes through the authenticated backend (not the Python service directly),
      // so the request is behind auth + rate limiting and no RAG URL is exposed.
      const res = await authFetch(`${BASE_URL}/api/meal-plans/preview`, {
        method: "POST",
        body: JSON.stringify({
          calories: targetCal,
          protein:  targetPro > 0 ? targetPro : undefined,
          goal:     aiGoal,
          context:  aiContext.trim() || undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json?.message || "Could not get recommendations. Please try again.");
      }
      setAiResults(json.meals);
    } catch (err) {
      setAiError(err.message || "Something went wrong.");
    } finally {
      setAiLoading(false);
    }
  };

  /* ── AI inline edit helpers ─────────────────────────────── */
  const toggleAiEdit = (meal) => {
    if (editingAiRank === meal.rank) {
      setEditingAiRank(null);
    } else {
      setEditingAiRank(meal.rank);
      if (!aiEdits[meal.rank]) {
        setAiEdits(prev => ({
          ...prev,
          [meal.rank]: {
            title:         meal.title,
            calories:      String(Math.round(meal.calories)),
            protein:       String(Math.round(meal.protein)),
            fat:           String(Math.round(meal.fat)),
            carbs:         String(Math.round(meal.carbs)),
            serving_size_g:String(Math.round(meal.serving_size_g || 100)),
          },
        }));
      }
    }
  };

  const setAiEditField = (rank, field, value) => {
    setAiEdits(prev => ({ ...prev, [rank]: { ...prev[rank], [field]: value } }));
  };

  /* ── Open Add Meal modal pre-filled from an AI pick ─────── */
  const openAddModalWithAiMeal = (meal) => {
    const e         = aiEdits[meal.rank] || {};
    const title     = e.title     ?? meal.title;
    const calories  = Number(e.calories  ?? meal.calories);
    const protein   = Number(e.protein   ?? meal.protein);
    const fat       = Number(e.fat       ?? meal.fat);
    const carbs     = Number(e.carbs     ?? meal.carbs);
    const baseSrv   = Number(e.serving_size_g ?? meal.serving_size_g) || 100;
    const targetCal = Number(aiCalories) || calories;
    const scale     = calories > 0 ? targetCal / calories : 1;
    const servingG  = Math.max(1, Math.round(baseSrv * scale));

    // Normalise to per-100g so calcMacros works correctly
    const syntheticFood = {
      foodName: title,
      calories: calories / servingG * 100,
      protein:  protein  / servingG * 100,
      carbs:    carbs    / servingG * 100,
      fats:     fat      / servingG * 100,
    };

    setMealNameInput(title);
    setFoodEntries([{ id: uid(), query: title, food: syntheticFood, weight: String(servingG) }]);
    setActiveIdx(0);
    setShowAiModal(false);
    setShowAddModal(true);
  };

  /* ── Derived data ────────────────────────────────────────── */
  const totals        = dailyStats?.totals       || { calories: 0, protein: 0 };
  const groupedMeals  = dailyStats?.groupedMeals || [];
  const calorieGoal   = dailyStats?.goal        || 2200;
  const proteinGoal   = dailyStats?.proteinGoal || 150;
  const remaining     = Math.max(calorieGoal - round(totals.calories), 0);
  const onTrack       = round(totals.calories) <= calorieGoal;

  const weekData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    const dateStr = d.toISOString().split("T")[0];
    const isToday = i === 6;
    const apiDay  = weeklyStats?.days?.find(day => day.date === dateStr);
    return {
      date:     d.toLocaleDateString("en-US", { weekday: "short" }),
      calories: isToday ? round(totals.calories) : round(apiDay?.calories ?? 0),
      protein:  isToday ? round(totals.protein)  : round(apiDay?.protein  ?? 0),
      isToday,
    };
  });
  const avgCals       = Math.round(weekData.reduce((s, d) => s + d.calories, 0) / 7);
  const totalWeekCals = weekData.reduce((s, d) => s + d.calories, 0);
  const weekBalance   = totalWeekCals - calorieGoal * 7;
  const maxBarCals    = Math.max(...weekData.map(d => d.calories), calorieGoal, 1);

  if (loading) {
    // Skeleton mirrors the real layout: header, rings card, then meal cards.
    return (
      <SafeAreaView style={s.container} edges={["top"]}>
        <View style={{ paddingHorizontal: 20, paddingTop: 8, gap: 16 }}>
          <SkeletonBox height={24} width={140} borderRadius={8} />
          <View style={[s.ringsCard, { justifyContent: "space-around" }]}>
            <SkeletonCircle size={90} />
            <SkeletonCircle size={90} />
            <SkeletonCircle size={90} />
          </View>
          <SkeletonBox height={14} width={120} borderRadius={6} />
          <SkeletonList count={3} height={72} borderRadius={20} />
        </View>
      </SafeAreaView>
    );
  }
  if (error && !dailyStats) {
    return (
      <View style={s.center}>
        <Text style={[s.muted, { color: RED, marginBottom: 12 }]}>Could not load calorie log</Text>
        <TouchableOpacity style={s.retryBtn} onPress={loadLogs}>
          <Text style={s.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <SafeAreaView style={s.container} edges={["top"]}>

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Calorie Log</Text>
        <TouchableOpacity style={s.aiBtn} onPress={() => { setShowAiModal(true); setAiResults(null); setAiError(""); }}>
          <MaterialCommunityIcons name="robot-outline" size={18} color={GREEN} />
          <Text style={s.aiBtnText}>AI Picks</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Toggle */}
      <View style={s.tabWrap}>
        <View style={s.tabRow}>
          {[["today", "Today"], ["weekly", "Weekly"]].map(([key, label]) => (
            <TouchableOpacity key={key} style={[s.tabPill, tab === key && s.tabPillActive]} onPress={() => setTab(key)}>
              <Text style={[s.tabText, tab === key && s.tabTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {tab === "today" ? (
          <>
            {/* Progress Rings */}
            <View style={s.ringsCard}>
              <CircularProgress value={round(totals.calories)} max={calorieGoal} color={GREEN} label="Calories" sub="kcal" />
              <View style={s.ringDivider} />
              <CircularProgress value={round(totals.protein)} max={proteinGoal} color={BLUE} label="Protein" sub="grams" />
              <View style={s.ringDivider} />
              <View style={s.remainingCol}>
                <Text style={s.remainingNum}>{remaining.toLocaleString()}</Text>
                <Text style={s.remainingSub}>kcal left</Text>
                <View style={[s.trackBadge, { backgroundColor: onTrack ? "rgba(199,240,0,0.15)" : "rgba(255,69,58,0.15)" }]}>
                  <Text style={[s.trackText, { color: onTrack ? GREEN : RED }]}>{onTrack ? "On track" : "Exceeded"}</Text>
                </View>
              </View>
            </View>

            {/* Grouped Meal Cards */}
            <Text style={s.sectionLabel}>
              {"Today's Meals"}{groupedMeals.length > 0 ? ` (${groupedMeals.length})` : ""}
            </Text>

            {groupedMeals.length === 0 ? (
              <View style={s.emptyState}>
                <MaterialCommunityIcons name="food-apple" size={32} color={MUTED} />
                <Text style={s.emptyTitle}>No meals logged</Text>
                <Text style={s.emptyMuted}>Tap + to add your first meal</Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {groupedMeals.map(group => {
                  const isOpen = expandedGroup === group.groupId;
                  return (
                    <View key={group.groupId} style={s.mealGroupCard}>
                      {/* Group header */}
                      <TouchableOpacity
                        style={s.mealGroupHeader}
                        onPress={() => setExpandedGroup(isOpen ? null : group.groupId)}
                        activeOpacity={0.8}
                      >
                        <View style={s.mealGroupIconWrap}>
                          <MaterialCommunityIcons name="food-fork-drink" size={16} color={GREEN} />
                        </View>
                        <View style={s.mealGroupInfo}>
                          <Text style={s.mealGroupName}>{group.mealName}</Text>
                          <Text style={s.mealGroupMeta}>
                            {group.foods.length} food{group.foods.length > 1 ? "s" : ""}  ·  {round(group.totalProtein)}g protein
                          </Text>
                        </View>
                        <Text style={s.mealGroupCal}>{round(group.totalCalories)}</Text>
                        <Text style={s.mealGroupKcal}>kcal</Text>
                        <View style={{ marginLeft: 4 }}>
                          <Feather name={isOpen ? "chevron-up" : "chevron-down"} size={16} color={MUTED} />
                        </View>
                      </TouchableOpacity>

                      {/* Expanded food list */}
                      {isOpen && (
                        <View style={s.mealGroupBody}>
                          {group.foods.map((food, fi) => (
                            <View key={food._id} style={[s.foodRow, fi < group.foods.length - 1 && s.foodRowBorder]}>
                              <View style={s.foodDot} />
                              <View style={{ flex: 1 }}>
                                <Text style={s.foodName} numberOfLines={1}>{food.foodName}</Text>
                                <Text style={s.foodMeta}>{round(food.protein)}g protein · {round(food.carbs)}g carbs</Text>
                              </View>
                              <Text style={s.foodCal}>{round(food.calories)} kcal</Text>
                            </View>
                          ))}
                          <TouchableOpacity style={s.deleteGroupBtn} onPress={() => deleteMealGroup(group)}>
                            <Feather name="trash-2" size={13} color={RED} />
                            <Text style={s.deleteGroupText}>Delete meal</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </>
        ) : (
          <>
            {weeklyLoading && (
              <View style={{ alignItems: "center", paddingVertical: 12 }}>
                <ActivityIndicator color={GREEN} size="small" />
              </View>
            )}
            <View style={s.weekSummaryRow}>
              <View style={s.weekSummaryCard}>
                <Text style={s.weekSumLabel}>Avg/day</Text>
                <Text style={s.weekSumValue}>{avgCals}</Text>
                <Text style={s.weekSumUnit}>kcal</Text>
              </View>
              <View style={s.weekSummaryCard}>
                <Text style={s.weekSumLabel}>Total</Text>
                <Text style={s.weekSumValue}>{totalWeekCals.toLocaleString()}</Text>
                <Text style={s.weekSumUnit}>kcal</Text>
              </View>
              <View style={s.weekSummaryCard}>
                <Text style={s.weekSumLabel}>{weekBalance >= 0 ? "Surplus" : "Deficit"}</Text>
                <Text style={[s.weekSumValue, { color: weekBalance >= 0 ? RED : GREEN }]}>
                  {Math.abs(weekBalance).toLocaleString()}
                </Text>
                <Text style={s.weekSumUnit}>kcal</Text>
              </View>
            </View>

            <View style={s.chartCard}>
              <Text style={s.chartTitle}>7-Day Calorie Intake</Text>
              <View style={s.barChart}>
                {weekData.map((d, i) => {
                  const height = Math.max(4, (d.calories / maxBarCals) * 100);
                  return (
                    <View key={i} style={s.barSlot}>
                      <View style={[s.bar, { height }, d.isToday && s.barToday]} />
                      <Text style={[s.barLabel, d.isToday && { color: GREEN }]}>{d.date}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={s.tableCard}>
              <View style={s.tableHeader}>
                <Text style={[s.tableHCell, { flex: 1 }]}>DAY</Text>
                <Text style={[s.tableHCell, { width: 80, textAlign: "right" }]}>CALORIES</Text>
                <Text style={[s.tableHCell, { width: 70, textAlign: "right" }]}>PROTEIN</Text>
              </View>
              {weekData.map((d, i) => (
                <View key={i} style={[s.tableRow, i < 6 && s.tableRowBorder]}>
                  <Text style={[s.tableCell, { flex: 1 }]}>{d.date}</Text>
                  <Text style={[s.tableCell, { width: 80, textAlign: "right", color: GREEN, fontWeight: "600" }]}>{d.calories}</Text>
                  <Text style={[s.tableCell, { width: 70, textAlign: "right" }]}>{d.protein}g</Text>
                </View>
              ))}
            </View>
          </>
        )}

      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={s.fab} onPress={openAdd} activeOpacity={0.85}>
        <Feather name="plus" size={24} color="#000" />
      </TouchableOpacity>

      {/* ═══════════════════════════════════════════════════════
          ADD MEAL MODAL
      ═══════════════════════════════════════════════════════ */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={closeAdd}>
        <View style={s.modalOverlay}>
          <TouchableOpacity style={s.modalBackdrop} onPress={closeAdd} activeOpacity={1} />
          <View style={s.modalSheet}>

            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Add Meal</Text>
              <TouchableOpacity onPress={closeAdd}>
                <Feather name="x" size={20} color={MUTED} />
              </TouchableOpacity>
            </View>

            {/* Meal name */}
            <TextInput
              style={s.mealNameInput}
              placeholder="Meal name (e.g. Lunch, Post-workout)"
              placeholderTextColor={MUTED}
              value={mealNameInput}
              onChangeText={setMealNameInput}
            />

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ maxHeight: 420 }}>
              <View style={{ gap: 14 }}>
                {foodEntries.map((entry, idx) => (
                  <View key={entry.id} style={s.entryBlock}>
                    <View style={s.entryHeader}>
                      <Text style={s.entryNum}>Food {idx + 1}</Text>
                      {foodEntries.length > 1 && (
                        <TouchableOpacity onPress={() => removeEntry(idx)}>
                          <Feather name="x" size={14} color={MUTED} />
                        </TouchableOpacity>
                      )}
                    </View>

                    <TextInput
                      style={s.input}
                      placeholder="Search food…"
                      placeholderTextColor={MUTED}
                      value={entry.query}
                      onFocus={() => setActiveIdx(idx)}
                      onChangeText={v => updateEntryQuery(idx, v)}
                    />

                    {activeIdx === idx && entry.query.length > 0 && !entry.food && suggestions.length > 0 && (
                      <View style={s.suggestions}>
                        {suggestions.slice(0, 4).map(food => (
                          <TouchableOpacity
                            key={food.foodName}
                            style={s.suggRow}
                            onPress={() => selectFoodForEntry(idx, food)}
                          >
                            <Text style={s.suggName} numberOfLines={1}>{food.foodName}</Text>
                            <Text style={s.suggCal}>{food.calories} kcal/100g</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {entry.food && (
                      <View style={s.selectedBadge}>
                        <Feather name="check-circle" size={14} color={GREEN} />
                        <Text style={s.selectedText} numberOfLines={1}>{entry.food.foodName}</Text>
                      </View>
                    )}

                    <TextInput
                      style={[s.input, { marginTop: 8 }]}
                      placeholder="Weight in grams (e.g. 150)"
                      placeholderTextColor={MUTED}
                      keyboardType="numeric"
                      value={entry.weight}
                      onFocus={() => setActiveIdx(idx)}
                      onChangeText={v => updateEntryWeight(idx, v)}
                    />

                    {entry.food && Number(entry.weight) > 0 && (
                      <View style={s.previewRow}>
                        <Text style={s.previewItem}>{Math.round(entry.food.calories * Number(entry.weight) / 100)} kcal</Text>
                        <Text style={s.previewItem}>{Math.round(entry.food.protein * Number(entry.weight) / 100)}g protein</Text>
                        <Text style={s.previewItem}>{Math.round(entry.food.carbs * Number(entry.weight) / 100)}g carbs</Text>
                      </View>
                    )}
                  </View>
                ))}
                <Text style={s.hintText}>Select a food to automatically add the next food field</Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[s.submitBtn, saving && { opacity: 0.6 }]}
              onPress={saveMeals}
              disabled={saving}
            >
              <Feather name="check" size={16} color="#000" />
              <Text style={s.submitText}>{saving ? "Saving…" : "Log Meal"}</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════
          AI RECOMMENDATION MODAL
      ═══════════════════════════════════════════════════════ */}
      <Modal visible={showAiModal} transparent animationType="slide" onRequestClose={() => setShowAiModal(false)}>
        <View style={s.modalOverlay}>
          <TouchableOpacity style={s.modalBackdrop} onPress={() => setShowAiModal(false)} activeOpacity={1} />
          <View style={[s.modalSheet, { maxHeight: "88%" }]}>

            <View style={s.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <MaterialCommunityIcons name="robot-outline" size={20} color={GREEN} />
                <Text style={s.modalTitle}>AI Meal Picks</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAiModal(false)}>
                <Feather name="x" size={20} color={MUTED} />
              </TouchableOpacity>
            </View>

            {/* Calories + Protein inputs */}
            <View style={s.aiInputRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>Calories (kcal)</Text>
                <TextInput
                  style={s.input}
                  placeholder="e.g. 500"
                  placeholderTextColor={MUTED}
                  keyboardType="numeric"
                  value={aiCalories}
                  onChangeText={setAiCalories}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>Protein (g)</Text>
                <TextInput
                  style={s.input}
                  placeholder="e.g. 30"
                  placeholderTextColor={MUTED}
                  keyboardType="numeric"
                  value={aiProtein}
                  onChangeText={setAiProtein}
                />
              </View>
            </View>

            {/* Context input */}
            <View>
              <Text style={s.fieldLabel}>Context (optional)</Text>
              <TextInput
                style={s.input}
                placeholder="e.g. post-workout, no dairy, vegetarian"
                placeholderTextColor={MUTED}
                value={aiContext}
                onChangeText={setAiContext}
              />
            </View>

            {/* Goal selector */}
            <View>
              <Text style={s.fieldLabel}>Goal</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {GOALS.map(g => (
                  <TouchableOpacity
                    key={g.key}
                    style={[s.goalChip, aiGoal === g.key && s.goalChipActive]}
                    onPress={() => setAiGoal(g.key)}
                  >
                    <Text style={[s.goalChipText, aiGoal === g.key && s.goalChipTextActive]}>{g.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <TouchableOpacity
              style={[s.submitBtn, aiLoading && { opacity: 0.6 }]}
              onPress={fetchAiRecs}
              disabled={aiLoading}
            >
              {aiLoading
                ? <ActivityIndicator size="small" color="#000" />
                : <MaterialCommunityIcons name="robot-outline" size={16} color="#000" />
              }
              <Text style={s.submitText}>{aiLoading ? "Finding meals…" : "Get Recommendations"}</Text>
            </TouchableOpacity>

            {aiError ? (
              <View style={s.aiErrorBox}>
                <Feather name="alert-circle" size={14} color={RED} />
                <Text style={s.aiErrorText}>{aiError}</Text>
              </View>
            ) : null}

            {/* Results */}
            {aiResults && (
              <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 4 }} keyboardShouldPersistTaps="handled">
                <View style={{ gap: 10 }}>
                  {aiResults.map(meal => {
                    const e           = aiEdits[meal.rank] || {};
                    const isEditing   = editingAiRank === meal.rank;
                    const displayCal  = Number(e.calories  ?? meal.calories);
                    const displayProt = Number(e.protein   ?? meal.protein);
                    const displayFat  = Number(e.fat       ?? meal.fat);
                    const displayCarb = Number(e.carbs     ?? meal.carbs);
                    const displaySrv  = Number(e.serving_size_g ?? meal.serving_size_g) || 100;
                    const targetCal   = Number(aiCalories) || displayCal;
                    const scale       = displayCal > 0 ? targetCal / displayCal : 1;
                    const servingWeight = Math.max(1, Math.round(displaySrv * scale));
                    return (
                    <View key={meal.rank} style={s.aiCard}>

                      {/* Title row */}
                      <View style={s.aiCardTop}>
                        <View style={{ flex: 1 }}>
                          <Text style={s.aiMealTitle} numberOfLines={2}>
                            {isEditing ? (e.title ?? meal.title) : (e.title ?? meal.title)}
                          </Text>
                          {!isEditing && <Text style={s.aiMealWhy}>{meal.why_recommended}</Text>}
                        </View>
                        <View style={s.aiMatchBadge}>
                          <Text style={s.aiMatchText}>{meal.calorie_match_pct}%</Text>
                          <Text style={s.aiMatchSub}>match</Text>
                        </View>
                      </View>

                      {/* Inline edit form */}
                      {isEditing && (
                        <View style={s.aiEditForm}>
                          <View style={s.aiEditRow}>
                            <View style={{ flex: 2 }}>
                              <Text style={s.aiEditLabel}>Name</Text>
                              <TextInput
                                style={s.aiEditInput}
                                value={e.title ?? meal.title}
                                onChangeText={v => setAiEditField(meal.rank, "title", v)}
                                placeholderTextColor={MUTED}
                              />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={s.aiEditLabel}>Serve (g)</Text>
                              <TextInput
                                style={s.aiEditInput}
                                value={e.serving_size_g ?? String(Math.round(meal.serving_size_g || 100))}
                                onChangeText={v => setAiEditField(meal.rank, "serving_size_g", v)}
                                keyboardType="numeric"
                                placeholderTextColor={MUTED}
                              />
                            </View>
                          </View>
                          <View style={s.aiEditRow}>
                            <View style={{ flex: 1 }}>
                              <Text style={s.aiEditLabel}>Kcal</Text>
                              <TextInput style={s.aiEditInput} value={e.calories ?? String(Math.round(meal.calories))} onChangeText={v => setAiEditField(meal.rank, "calories", v)} keyboardType="numeric" placeholderTextColor={MUTED} />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={s.aiEditLabel}>Protein (g)</Text>
                              <TextInput style={s.aiEditInput} value={e.protein ?? String(Math.round(meal.protein))} onChangeText={v => setAiEditField(meal.rank, "protein", v)} keyboardType="numeric" placeholderTextColor={MUTED} />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={s.aiEditLabel}>Fat (g)</Text>
                              <TextInput style={s.aiEditInput} value={e.fat ?? String(Math.round(meal.fat))} onChangeText={v => setAiEditField(meal.rank, "fat", v)} keyboardType="numeric" placeholderTextColor={MUTED} />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={s.aiEditLabel}>Carbs (g)</Text>
                              <TextInput style={s.aiEditInput} value={e.carbs ?? String(Math.round(meal.carbs))} onChangeText={v => setAiEditField(meal.rank, "carbs", v)} keyboardType="numeric" placeholderTextColor={MUTED} />
                            </View>
                          </View>
                        </View>
                      )}

                      {/* Serving weight pill */}
                      <View style={s.aiServingRow}>
                        <MaterialCommunityIcons name="weight-gram" size={13} color={ORANGE} />
                        <Text style={s.aiServingText}>
                          Serve <Text style={s.aiServingWeight}>{servingWeight}g</Text> for {Math.round(targetCal)} kcal
                        </Text>
                      </View>

                      {/* Macro row + buttons */}
                      <View style={s.aiMacroRow}>
                        <View style={s.aiMacro}>
                          <Text style={[s.aiMacroVal, { color: GREEN }]}>{Math.round(displayCal)}</Text>
                          <Text style={s.aiMacroLabel}>kcal/srv</Text>
                        </View>
                        <View style={s.aiMacro}>
                          <Text style={[s.aiMacroVal, { color: BLUE }]}>{Math.round(displayProt)}g</Text>
                          <Text style={s.aiMacroLabel}>protein</Text>
                        </View>
                        <View style={s.aiMacro}>
                          <Text style={[s.aiMacroVal, { color: ORANGE }]}>{Math.round(displayFat)}g</Text>
                          <Text style={s.aiMacroLabel}>fat</Text>
                        </View>
                        <View style={s.aiMacro}>
                          <Text style={[s.aiMacroVal, { color: MUTED }]}>{Math.round(displayCarb)}g</Text>
                          <Text style={s.aiMacroLabel}>carbs</Text>
                        </View>
                        <TouchableOpacity
                          style={[s.aiEditBtn, isEditing && s.aiEditBtnActive]}
                          onPress={() => toggleAiEdit(meal)}
                        >
                          <Feather name="edit-2" size={13} color={isEditing ? "#000" : MUTED} />
                        </TouchableOpacity>
                        <TouchableOpacity style={s.aiLogBtn} onPress={() => openAddModalWithAiMeal(meal)}>
                          <Feather name="plus" size={14} color="#000" />
                          <Text style={s.aiLogText}>Log</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                  })}
                </View>
              </ScrollView>
            )}

          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  center:    { flex: 1, backgroundColor: BG, alignItems: "center", justifyContent: "center" },
  muted:     { color: MUTED, fontSize: 13, marginTop: 8 },
  retryBtn:  { marginTop: 12, backgroundColor: GREEN, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  retryText: { color: "#000", fontWeight: "700" },

  /* Header */
  header:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  headerTitle: { color: WHITE, fontSize: 20, fontWeight: "700" },
  aiBtn:       { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: "rgba(199,240,0,0.1)", borderRadius: 20, borderWidth: 1, borderColor: "rgba(199,240,0,0.25)" },
  aiBtnText:   { color: GREEN, fontSize: 12, fontWeight: "700" },

  /* Tabs */
  tabWrap: { paddingHorizontal: 20, paddingBottom: 12 },
  tabRow:  { flexDirection: "row", backgroundColor: CARD, borderRadius: 18, padding: 4 },
  tabPill:       { flex: 1, paddingVertical: 8, borderRadius: 14, alignItems: "center" },
  tabPillActive: { backgroundColor: GREEN },
  tabText:       { color: MUTED, fontSize: 14, fontWeight: "400" },
  tabTextActive: { color: "#000", fontWeight: "700" },

  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 110, gap: 16 },

  /* Rings */
  ringsCard:    { flexDirection: "row", alignItems: "center", justifyContent: "space-around", padding: 20, borderRadius: 20, backgroundColor: CARD },
  ringDivider:  { width: 1, height: 64, backgroundColor: BORDER },
  ringCenter:   { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  ringValue:    { color: WHITE, fontSize: 16, fontWeight: "700" },
  ringMax:      { color: MUTED, fontSize: 9 },
  ringLabel:    { color: WHITE, fontSize: 12, fontWeight: "600" },
  ringSub:      { color: MUTED, fontSize: 10 },
  remainingCol: { alignItems: "center", gap: 4 },
  remainingNum: { color: WHITE, fontSize: 22, fontWeight: "700" },
  remainingSub: { color: MUTED, fontSize: 10 },
  trackBadge:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, marginTop: 4 },
  trackText:    { fontSize: 10, fontWeight: "600" },

  sectionLabel: { color: MUTED, fontSize: 13, fontWeight: "600" },

  /* Grouped meal card */
  mealGroupCard:   { borderRadius: 20, backgroundColor: CARD, overflow: "hidden" },
  mealGroupHeader: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14 },
  mealGroupIconWrap:{ width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(199,240,0,0.1)", alignItems: "center", justifyContent: "center" },
  mealGroupInfo:   { flex: 1 },
  mealGroupName:   { color: WHITE, fontSize: 14, fontWeight: "600" },
  mealGroupMeta:   { color: MUTED, fontSize: 12, marginTop: 2 },
  mealGroupCal:    { color: GREEN, fontSize: 15, fontWeight: "700" },
  mealGroupKcal:   { color: MUTED, fontSize: 10, alignSelf: "flex-end", marginBottom: 2 },

  mealGroupBody:   { borderTopWidth: 1, borderTopColor: BORDER, paddingHorizontal: 14, paddingBottom: 4 },
  foodRow:         { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 },
  foodRowBorder:   { borderBottomWidth: 1, borderBottomColor: "rgba(44,44,46,0.6)" },
  foodDot:         { width: 6, height: 6, borderRadius: 3, backgroundColor: GREEN },
  foodName:        { color: WHITE, fontSize: 13, fontWeight: "500" },
  foodMeta:        { color: MUTED, fontSize: 11, marginTop: 1 },
  foodCal:         { color: MUTED, fontSize: 12 },
  deleteGroupBtn:  { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-end", paddingVertical: 10 },
  deleteGroupText: { color: RED, fontSize: 12, fontWeight: "600" },

  emptyState: { alignItems: "center", paddingVertical: 40, gap: 6 },
  emptyTitle: { color: WHITE, fontSize: 15, fontWeight: "600", marginTop: 4 },
  emptyMuted: { color: MUTED, fontSize: 12 },

  /* Weekly */
  weekSummaryRow:  { flexDirection: "row", gap: 10 },
  weekSummaryCard: { flex: 1, padding: 12, borderRadius: 20, backgroundColor: CARD },
  weekSumLabel:    { color: MUTED, fontSize: 10, marginBottom: 4 },
  weekSumValue:    { color: WHITE, fontSize: 16, fontWeight: "700" },
  weekSumUnit:     { color: MUTED, fontSize: 10, marginTop: 2 },
  chartCard:       { padding: 16, borderRadius: 20, backgroundColor: CARD },
  chartTitle:      { color: WHITE, fontSize: 14, fontWeight: "600", marginBottom: 12 },
  barChart:        { flexDirection: "row", alignItems: "flex-end", height: 120, gap: 4 },
  barSlot:         { flex: 1, alignItems: "center", justifyContent: "flex-end", gap: 6 },
  bar:             { width: "100%", borderRadius: 6, backgroundColor: BORDER },
  barToday:        { backgroundColor: GREEN },
  barLabel:        { color: MUTED, fontSize: 10, fontWeight: "500" },
  tableCard:       { borderRadius: 20, backgroundColor: CARD, overflow: "hidden" },
  tableHeader:     { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: BORDER },
  tableHCell:      { color: MUTED, fontSize: 10, fontWeight: "600" },
  tableRow:        { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  tableRowBorder:  { borderBottomWidth: 1, borderBottomColor: BORDER },
  tableCell:       { color: WHITE, fontSize: 14 },

  /* FAB */
  fab: {
    position: "absolute", bottom: 90, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: GREEN, alignItems: "center", justifyContent: "center",
    shadowColor: GREEN, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },

  /* Modal shell */
  modalOverlay:  { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.7)" },
  modalSheet:    { backgroundColor: CARD, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 14 },
  modalHeader:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  modalTitle:    { color: WHITE, fontSize: 16, fontWeight: "700" },

  mealNameInput: {
    backgroundColor: "rgba(199,240,0,0.06)", borderWidth: 1, borderColor: "rgba(199,240,0,0.2)",
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, color: WHITE, fontSize: 14,
  },

  /* Entry block */
  entryBlock:  { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 14, gap: 8, borderWidth: 1, borderColor: BORDER },
  entryHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 2 },
  entryNum:    { color: MUTED, fontSize: 11, fontWeight: "600" },

  fieldLabel: { color: MUTED, fontSize: 12, marginBottom: 6 },
  input: {
    backgroundColor: "#000", borderWidth: 1, borderColor: BORDER,
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
    color: WHITE, fontSize: 14,
  },

  suggestions: { backgroundColor: "#111", borderRadius: 14, borderWidth: 1, borderColor: BORDER, overflow: "hidden" },
  suggRow:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: "rgba(44,44,46,0.5)" },
  suggName:    { color: WHITE, fontSize: 13, fontWeight: "500", flex: 1, marginRight: 8 },
  suggCal:     { color: GREEN, fontSize: 12, fontWeight: "600" },

  selectedBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "rgba(199,240,0,0.08)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(199,240,0,0.2)" },
  selectedText:  { color: GREEN, fontSize: 13, fontWeight: "500", flex: 1 },

  previewRow:  { flexDirection: "row", gap: 8 },
  previewItem: { flex: 1, textAlign: "center", color: MUTED, fontSize: 11, backgroundColor: "#000", borderRadius: 10, paddingVertical: 6, borderWidth: 1, borderColor: BORDER },

  hintText: { color: "#555", fontSize: 12, textAlign: "center", paddingHorizontal: 8 },

  submitBtn:  { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: GREEN, borderRadius: 20, paddingVertical: 14 },
  submitText: { color: "#000", fontSize: 14, fontWeight: "700" },

  /* AI modal */
  goalChip:         { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#111", borderWidth: 1, borderColor: BORDER },
  goalChipActive:   { backgroundColor: "rgba(199,240,0,0.12)", borderColor: "rgba(199,240,0,0.4)" },
  goalChipText:     { color: MUTED, fontSize: 12, fontWeight: "600" },
  goalChipTextActive:{ color: GREEN, fontWeight: "700" },
  aiInputRow:       { flexDirection: "row", gap: 12 },
  aiInfoRow:        { flexDirection: "row", alignItems: "center", gap: 6 },
  aiInfoText:       { color: MUTED, fontSize: 12 },
  aiErrorBox:       { flexDirection: "row", alignItems: "center", gap: 6, padding: 12, backgroundColor: "rgba(255,69,58,0.08)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,69,58,0.2)" },
  aiErrorText:      { color: RED, fontSize: 12, flex: 1 },

  /* AI result cards */
  aiCard:          { backgroundColor: "#111", borderRadius: 18, padding: 14, borderWidth: 1, borderColor: BORDER, gap: 10 },
  aiCardTop:       { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  aiMealTitle:     { color: WHITE, fontSize: 14, fontWeight: "600" },
  aiMealWhy:       { color: MUTED, fontSize: 11, marginTop: 3, lineHeight: 16 },
  aiMatchBadge:    { alignItems: "center", backgroundColor: "rgba(199,240,0,0.1)", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: "rgba(199,240,0,0.2)" },
  aiMatchText:     { color: GREEN, fontSize: 15, fontWeight: "800" },
  aiMatchSub:      { color: MUTED, fontSize: 9 },
  aiServingRow:    { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,149,0,0.08)", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: "rgba(255,149,0,0.2)" },
  aiServingText:   { color: MUTED, fontSize: 12 },
  aiServingWeight: { color: ORANGE, fontWeight: "700" },
  aiMacroRow:  { flexDirection: "row", alignItems: "center", gap: 8 },
  aiMacro:     { alignItems: "center", flex: 1 },
  aiMacroVal:  { fontSize: 13, fontWeight: "700" },
  aiMacroLabel:{ color: MUTED, fontSize: 10 },
  aiLogBtn:    { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: GREEN, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  aiLogText:   { color: "#000", fontSize: 12, fontWeight: "700" },

  /* AI inline edit */
  aiEditBtn:       { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: BORDER },
  aiEditBtnActive: { backgroundColor: GREEN, borderColor: GREEN },
  aiEditForm:      { backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 12, padding: 12, gap: 10, borderWidth: 1, borderColor: BORDER },
  aiEditRow:       { flexDirection: "row", gap: 8 },
  aiEditLabel:     { color: MUTED, fontSize: 10, fontWeight: "600", marginBottom: 4 },
  aiEditInput:     { backgroundColor: "#000", borderWidth: 1, borderColor: BORDER, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, color: WHITE, fontSize: 13 },
});
