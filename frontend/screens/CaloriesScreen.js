import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  createMealLog,
  deleteMealLog,
  getCalorieUserId,
  getTodayLogs,
  searchFoods,
  updateMealLog,
} from "../services/calorieApi";
import { getUserEmail } from "../utils/session";

const ACTIVE_VIEW_KEY = "calories_active_view";

const readPersistedView = (fallback) => {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage.getItem(ACTIVE_VIEW_KEY) || fallback;
  }
  return fallback;
};

const persistView = (view) => {
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.setItem(ACTIVE_VIEW_KEY, view);
  }
};

const emptyForm = {
  foodName: "",
  calories: "",
  protein: "",
  carbs: "",
  fats: "",
};

const quickActions = [
  { key: "dashboard", label: "Home" },
  { key: "log", label: "Log Meal" },
  { key: "search", label: "Search" },
  { key: "log", label: "Summary" },
];

const toNumber = (value) => Number(value || 0);
const round = (value) => Math.round(Number(value || 0));

export default function CaloriesScreen({ initialView = "dashboard" }) {
  const [activeView, setActiveViewState] = useState(() => readPersistedView(initialView));
  const [form, setForm] = useState(emptyForm);

  const setActiveView = (view) => {
    persistView(view);
    setActiveViewState(view);
  };
  const [editingMealId, setEditingMealId] = useState(null);
  const [dailyStats, setDailyStats] = useState(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const userId = getCalorieUserId(getUserEmail());
  const foodMatches = useMemo(() => searchFoods(query), [query]);

  const loadLogs = async () => {
    try {
      setError("");
      const todayResponse = await getTodayLogs(userId);
      setDailyStats(todayResponse.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    const view = initialView === "progress" ? "dashboard" : initialView;
    persistView(view);
    setActiveViewState(view);
  }, [initialView]);

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const fillMealForm = (food) => {
    setForm({
      foodName: food.foodName,
      calories: String(food.calories),
      protein: String(food.protein),
      carbs: String(food.carbs),
      fats: String(food.fats),
    });
    setQuery(food.foodName);
    setActiveView("log");
  };

  const saveMeal = async (mealData = null) => {
    const payload = mealData || {
      foodName: form.foodName.trim(),
      calories: toNumber(form.calories),
      protein: toNumber(form.protein),
      carbs: toNumber(form.carbs),
      fats: toNumber(form.fats),
    };

    if (!payload.foodName || !payload.calories) {
      Alert.alert("Missing details", "Add a food name and calories.");
      return;
    }

    setSaving(true);
    try {
      if (editingMealId && !mealData) {
        await updateMealLog(editingMealId, payload);
      } else {
        await createMealLog(userId, payload);
      }
      setForm(emptyForm);
      setEditingMealId(null);
      setQuery("");
      await loadLogs();
      if (mealData) {
        Alert.alert("Meal added", `${payload.foodName} was added to today's log.`);
      } else if (editingMealId) {
        Alert.alert("Meal updated", `${payload.foodName} was updated successfully.`);
      }
    } catch (err) {
      Alert.alert(editingMealId ? "Could not update meal" : "Could not save meal", err.message);
    } finally {
      setSaving(false);
    }
  };

  const editMeal = (meal) => {
    setForm({
      foodName: meal.foodName || "",
      calories: String(round(meal.calories)),
      protein: String(round(meal.protein)),
      carbs: String(round(meal.carbs)),
      fats: String(round(meal.fats)),
    });
    setQuery(meal.foodName || "");
    setEditingMealId(meal._id);
    setActiveView("log");
  };

  const removeMeal = async (id) => {
    try {
      await deleteMealLog(id);
      await loadLogs();
    } catch (err) {
      Alert.alert("Could not delete meal", err.message);
    }
  };

  const totals = dailyStats?.totals || { calories: 0, protein: 0, carbs: 0, fats: 0 };
  const meals = dailyStats?.meals || [];
  const goal = dailyStats?.goal || 2200;
  const progress = dailyStats?.progressPercentage || 0;
  const remaining = dailyStats?.remainingCalories ?? Math.max(goal - totals.calories, 0);
  const todayLabel = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#C7F000" />
        <Text style={styles.muted}>Loading calorie log...</Text>
      </View>
    );
  }

  const renderContent = () => {
    if (activeView === "log") {
      return (
        <LogView
          form={form}
          editingMealId={editingMealId}
          query={query}
          foodMatches={foodMatches}
          saving={saving}
          setField={setField}
          setQuery={setQuery}
          fillMealForm={fillMealForm}
          saveMeal={() => saveMeal()}
          meals={meals}
          editMeal={editMeal}
          removeMeal={removeMeal}
        />
      );
    }

    if (activeView === "search") {
      return (
        <SearchView
          query={query}
          setQuery={setQuery}
          foods={foodMatches}
          fillMealForm={fillMealForm}
          saveMeal={saveMeal}
          saving={saving}
        />
      );
    }

    return (
      <DashboardView
        totals={totals}
        goal={goal}
        progress={progress}
        remaining={remaining}
        meals={meals}
        setActiveView={setActiveView}
        editMeal={editMeal}
        removeMeal={removeMeal}
      />
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>
              {activeView === "dashboard" ? "Good evening" : activeView === "search" ? "Nutrition Database" : `Today - ${todayLabel}`}
            </Text>
            <Text style={styles.title}>
              {activeView === "dashboard" ? "Dashboard" : activeView === "search" ? "Search Food" : "Log Calories"}
            </Text>
          </View>
          <TouchableOpacity style={styles.searchTopButton} onPress={() => setActiveView("search")}>
            <Text style={styles.searchTopText}>Search</Text>
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {renderContent()}
      </ScrollView>

      <View style={styles.bottomNav}>
        <NavButton label="Dashboard" active={activeView === "dashboard"} onPress={() => setActiveView("dashboard")} />
        <NavButton label="Log" active={activeView === "log"} onPress={() => setActiveView("log")} />
        <NavButton label="Search" active={activeView === "search"} onPress={() => setActiveView("search")} />
      </View>
    </View>
  );
}

function DashboardView({ totals, goal, progress, remaining, meals, setActiveView, editMeal, removeMeal }) {
  const proteinGoal = 150;
  const carbsGoal = 280;

  return (
    <>
      <View style={styles.metricGrid}>
        <MetricCard title="Calories Today" value={round(totals.calories)} suffix={`/ ${goal}`} color="#ffffff" />
        <MetricCard title="Protein" value={`${round(totals.protein)}g`} suffix={`/ ${proteinGoal}g`} color="#39c6f5" />
        <MetricCard title="Carbs" value={`${round(totals.carbs)}g`} suffix={`/ ${carbsGoal}g`} color="#f9b13f" />
        <MetricCard title="Goal Progress" value={`${progress}%`} suffix={remaining > 0 ? "Maintain" : "Goal hit"} color="#ff7b39" />
      </View>

      <View style={styles.ringCard}>
        <Text style={styles.cardTitle}>Daily Rings</Text>
        <View style={styles.ringLayout}>
          <View style={styles.ringOuter}>
            <View style={styles.ringMid}>
              <View style={styles.ringInner}>
                <Text style={styles.ringValue}>{progress}</Text>
                <Text style={styles.ringLabel}>%</Text>
              </View>
            </View>
          </View>
          <View style={styles.ringStats}>
            <Stepper color="#ff6c3a" label="Calories" value={round(totals.calories)} />
            <Stepper color="#39c6f5" label="Protein" value={`${round(totals.protein)}g`} />
            <View style={styles.remainingBox}>
              <Text style={styles.remainingText}>{round(remaining)} kcal remaining</Text>
              <Text style={styles.remainingText}>{Math.max(150 - round(totals.protein), 0)}g protein left</Text>
            </View>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Quick Access</Text>
      <View style={styles.quickGrid}>
        {quickActions.map((action, index) => (
          <TouchableOpacity key={`${action.label}-${index}`} style={styles.quickCard} onPress={() => setActiveView(action.key)}>
            <Text style={styles.quickIcon}>{index === 0 ? ">" : index === 1 ? "+" : index === 2 ? "o" : "#"}</Text>
            <Text style={styles.quickText}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Meals</Text>
        <TouchableOpacity onPress={() => setActiveView("log")}>
          <Text style={styles.seeAll}>{"See all ->"}</Text>
        </TouchableOpacity>
      </View>
      <MealList meals={meals.slice(0, 3)} editMeal={editMeal} removeMeal={removeMeal} emptyText="No recent meals yet." />
    </>
  );
}

function LogView({ form, editingMealId, query, foodMatches, saving, setField, setQuery, fillMealForm, saveMeal, meals, editMeal, removeMeal }) {
  return (
    <>
      <View style={styles.totalCard}>
        <View style={styles.totalRow}>
          <Text style={styles.totalCalories}>{round(form.calories) || 0}</Text>
          <Text style={styles.muted}>/ 2200 kcal</Text>
        </View>
        <View style={styles.macroStrip}>
          <Text style={styles.blueText}>P: {round(form.protein)}g</Text>
          <Text style={styles.orangeText}>C: {round(form.carbs)}g</Text>
          <Text style={styles.pinkText}>F: {round(form.fats)}g</Text>
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.cardTitle}>+ New Entry</Text>
        <Text style={styles.inputLabel}>Food Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Grilled Chicken Breast"
          placeholderTextColor="#555"
          value={query}
          onChangeText={(value) => {
            setQuery(value);
            setField("foodName", value);
          }}
        />

        {query ? (
          <View style={styles.suggestionList}>
            {foodMatches.slice(0, 4).map((food) => (
              <TouchableOpacity key={food.foodName} style={styles.suggestionRow} onPress={() => fillMealForm(food)}>
                <Text style={styles.suggestionName}>{food.foodName}</Text>
                <Text style={styles.limeText}>{food.calories}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <Text style={styles.inputLabel}>Calories (kcal) *</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor="#555"
          value={form.calories}
          onChangeText={(value) => setField("calories", value)}
        />

        <Text style={styles.inputLabel}>Macros</Text>
        <View style={styles.macroInputs}>
          <NutritionInput color="#39c6f5" label="Protein (g)" value={form.protein} onChangeText={(value) => setField("protein", value)} />
          <NutritionInput color="#f9b13f" label="Carbs (g)" value={form.carbs} onChangeText={(value) => setField("carbs", value)} />
          <NutritionInput color="#ff5c9a" label="Fats (g)" value={form.fats} onChangeText={(value) => setField("fats", value)} />
        </View>

        <TouchableOpacity style={[styles.primaryButton, saving && styles.disabled]} onPress={saveMeal} disabled={saving}>
          <Text style={styles.primaryButtonText}>{saving ? "Saving..." : editingMealId ? "Update Meal" : "Log Meal"}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Today's Meals ({meals.length})</Text>
      <MealList meals={meals} editMeal={editMeal} removeMeal={removeMeal} emptyText="No meals logged today." />
    </>
  );
}

function SearchView({ query, setQuery, foods, fillMealForm, saveMeal, saving }) {
  return (
    <>
      <TextInput
        style={styles.searchInput}
        placeholder="Search chicken, banana, rice..."
        placeholderTextColor="#5f5f5f"
        value={query}
        onChangeText={setQuery}
      />

      <Text style={styles.categoryTitle}>Popular Foods</Text>
      {foods.map((food) => (
        <View key={food.foodName} style={styles.foodCard}>
          <TouchableOpacity style={styles.foodCardTop} onPress={() => fillMealForm(food)}>
            <View style={styles.foodCardInfo}>
              <Text style={styles.foodCardName}>{food.foodName}</Text>
              <Text style={styles.foodMacros}>
                <Text style={styles.blueText}>P: {food.protein}g</Text>
                {"   "}
                <Text style={styles.orangeText}>C: {food.carbs}g</Text>
                {"   "}
                <Text style={styles.pinkText}>F: {food.fats}g</Text>
              </Text>
            </View>
            <View style={styles.foodCaloriesBox}>
              <Text style={styles.foodCalories}>{food.calories}</Text>
              <Text style={styles.foodKcal}>kcal</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addFoodButton, saving && styles.disabled]}
            onPress={() => saveMeal(food)}
            disabled={saving}
          >
            <Text style={styles.addFoodText}>+ Add to Today's Log</Text>
          </TouchableOpacity>
        </View>
      ))}
    </>
  );
}

function ProgressView({ progressMode, setProgressMode, weeklyStats, monthlyStats, goal }) {
  const weekDays = weeklyStats?.days || [];
  const monthWeeks = monthlyStats?.weeks || [];
  const activeData = progressMode === "weekly" ? weekDays : monthWeeks;
  const maxCalories = Math.max(...activeData.map((item) => item.calories || item.avgCalories || 0), goal, 1);

  const weeklyAverages = weekDays.reduce((acc, day) => ({
    calories: acc.calories + day.calories,
    protein: acc.protein + day.protein,
    carbs: acc.carbs + day.carbs,
    fats: acc.fats + day.fats,
    days: acc.days + (day.mealCount > 0 ? 1 : 0),
  }), { calories: 0, protein: 0, carbs: 0, fats: 0, days: 0 });

  const trackedDays = Math.max(weeklyAverages.days, 1);

  return (
    <>
      <View style={styles.segmented}>
        <TouchableOpacity
          style={[styles.segment, progressMode === "weekly" && styles.segmentActive]}
          onPress={() => setProgressMode("weekly")}
        >
          <Text style={[styles.segmentText, progressMode === "weekly" && styles.segmentTextActive]}>Weekly</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segment, progressMode === "monthly" && styles.segmentActive]}
          onPress={() => setProgressMode("monthly")}
        >
          <Text style={[styles.segmentText, progressMode === "monthly" && styles.segmentTextActive]}>Monthly</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.cardTitle}>{progressMode === "weekly" ? "Last 7 Days" : "Last 4 Weeks"}</Text>
        <Text style={styles.muted}>{progressMode === "weekly" ? `Daily calories vs ${goal} kcal goal` : "Average daily calories per week"}</Text>
        <View style={styles.chart}>
          {activeData.map((item, index) => {
            const value = progressMode === "weekly" ? item.calories : item.avgCalories;
            const height = Math.max(8, (value / maxCalories) * 105);
            const label = progressMode === "weekly" ? item.dayLabel : item.label.replace("Week ", "W");
            const isToday = index === activeData.length - 1;
            return (
              <View key={`${label}-${index}`} style={styles.barSlot}>
                <Text style={styles.barValue}>{value ? round(value) : ""}</Text>
                <View style={[styles.bar, { height }, isToday && styles.barToday]} />
                <Text style={[styles.barLabel, isToday && styles.limeText]}>{label}</Text>
              </View>
            );
          })}
        </View>
        <View style={styles.legendRow}>
          <Legend color="#C7F000" label="Today" />
          <Legend color="#1f6a39" label="Goal met" />
          <Legend color="#38384f" label="Below" />
        </View>
      </View>

      {progressMode === "weekly" ? (
        <View style={styles.panel}>
          <Text style={styles.cardTitle}>7-Day Summary</Text>
          <View style={styles.summaryGrid}>
            <SummaryItem color="#C7F000" label="Avg Calories" value={`${round(weeklyAverages.calories / trackedDays)} kcal`} />
            <SummaryItem color="#39c6f5" label="Avg Protein" value={`${round(weeklyAverages.protein / trackedDays)}g`} />
            <SummaryItem color="#f9b13f" label="Avg Carbs" value={`${round(weeklyAverages.carbs / trackedDays)}g`} />
            <SummaryItem color="#ff5c9a" label="Avg Fats" value={`${round(weeklyAverages.fats / trackedDays)}g`} />
            <SummaryItem color="#4ade80" label="Days Tracked" value={`${weeklyAverages.days} / 7`} />
            <SummaryItem color="#c084fc" label="Goals Hit" value={`${weekDays.filter((day) => day.calories >= goal).length} days`} />
          </View>
        </View>
      ) : (
        <View style={styles.panel}>
          <Text style={styles.cardTitle}>Week Breakdown</Text>
          {monthWeeks.map((week) => (
            <View key={week.label} style={styles.weekRow}>
              <View>
                <Text style={styles.weekTitle}>{week.label}</Text>
                <Text style={styles.muted}>Avg {round(week.avgCalories)} kcal/day - {week.days} days tracked</Text>
                <Text style={styles.foodMacros}>
                  <Text style={styles.blueText}>P: {round(week.protein / Math.max(week.days, 1))}g/day</Text>
                  {"   "}
                  <Text style={styles.orangeText}>C: {round(week.carbs / Math.max(week.days, 1))}g/day</Text>
                  {"   "}
                  <Text style={styles.pinkText}>F: {round(week.fats / Math.max(week.days, 1))}g/day</Text>
                </Text>
              </View>
              <Text style={week.avgCalories >= goal ? styles.goodBadge : styles.warnBadge}>
                {week.avgCalories >= goal ? "Goal met" : "Below goal"}
              </Text>
            </View>
          ))}
        </View>
      )}
    </>
  );
}

function MealList({ meals, editMeal, removeMeal, emptyText }) {
  if (!meals.length) {
    return <Text style={styles.emptyText}>{emptyText}</Text>;
  }

  return meals.map((meal) => (
    <View key={meal._id} style={styles.mealRow}>
      <View style={styles.mealInfo}>
        <Text style={styles.mealTitle}>{meal.foodName}</Text>
        <Text style={styles.mealMeta}>
          P {round(meal.protein)}g / C {round(meal.carbs)}g / F {round(meal.fats)}g
        </Text>
      </View>
      <View style={styles.mealActions}>
        <Text style={styles.mealCalories}>{round(meal.calories)}</Text>
        <View style={styles.mealActionRow}>
          <TouchableOpacity onPress={() => editMeal(meal)} style={styles.editButton}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => removeMeal(meal._id)} style={styles.deleteButton}>
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  ));
}

function MetricCard({ title, value, suffix, color }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={styles.metricSuffix}>{suffix}</Text>
    </View>
  );
}

function Stepper({ color, label, value }) {
  return (
    <View style={styles.stepperRow}>
      <Text style={[styles.dot, { color }]}>●</Text>
      <Text style={styles.stepperLabel}>{label}</Text>
      <Text style={styles.stepperButton}>-</Text>
      <Text style={styles.stepperValue}>{value}</Text>
      <Text style={styles.stepperPlus}>+</Text>
    </View>
  );
}

function NutritionInput({ label, value, onChangeText, color }) {
  return (
    <View style={styles.nutritionInputWrap}>
      <Text style={[styles.nutritionLabel, { color }]}>{label}</Text>
      <TextInput
        style={styles.smallInput}
        keyboardType="numeric"
        placeholder="0"
        placeholderTextColor="#555"
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

function NavButton({ label, active, onPress }) {
  return (
    <TouchableOpacity style={styles.navItem} onPress={onPress}>
      <View style={[styles.navIcon, active && styles.navIconActive]}>
        <Text style={[styles.navIconText, active && styles.navIconTextActive]}>
          {label === "Dashboard" ? "#" : label === "Log" ? "+" : label === "Search" ? "o" : ">"}
        </Text>
      </View>
      <Text style={[styles.navText, active && styles.navTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Legend({ color, label }) {
  return (
    <View style={styles.legend}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

function SummaryItem({ color, label, value }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#070707",
  },
  content: {
    padding: 18,
    paddingBottom: 102,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#070707",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  eyebrow: {
    color: "#7a7a7a",
    fontSize: 12,
    fontWeight: "700",
  },
  title: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "900",
  },
  searchTopButton: {
    backgroundColor: "#C7F000",
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  searchTopText: {
    color: "#111",
    fontWeight: "900",
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricCard: {
    width: "48%",
    backgroundColor: "#181818",
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: "#252525",
    minHeight: 90,
  },
  metricTitle: {
    color: "#8f8f8f",
    fontSize: 12,
    fontWeight: "700",
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "900",
    marginTop: 8,
  },
  metricSuffix: {
    color: "#777",
    fontSize: 12,
    marginTop: 2,
  },
  ringCard: {
    backgroundColor: "#181818",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#252525",
    padding: 16,
    marginTop: 14,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 12,
  },
  ringLayout: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  ringOuter: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 9,
    borderColor: "#2a2a2a",
    justifyContent: "center",
    alignItems: "center",
  },
  ringMid: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 8,
    borderColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  ringInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
  },
  ringValue: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
  ringLabel: {
    color: "#777",
    fontSize: 10,
  },
  ringStats: {
    flex: 1,
    gap: 10,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    fontSize: 16,
  },
  stepperLabel: {
    color: "#aaa",
    flex: 1,
    fontWeight: "700",
  },
  stepperButton: {
    color: "#aaa",
    backgroundColor: "#333",
    borderRadius: 12,
    width: 24,
    height: 24,
    textAlign: "center",
    lineHeight: 24,
    fontWeight: "900",
  },
  stepperValue: {
    color: "#fff",
    minWidth: 34,
    textAlign: "center",
    fontWeight: "900",
  },
  stepperPlus: {
    color: "#111",
    backgroundColor: "#C7F000",
    borderRadius: 12,
    width: 24,
    height: 24,
    textAlign: "center",
    lineHeight: 24,
    fontWeight: "900",
  },
  remainingBox: {
    backgroundColor: "#111",
    borderRadius: 8,
    padding: 10,
  },
  remainingText: {
    color: "#aaa",
    fontSize: 12,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
    marginTop: 18,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  seeAll: {
    color: "#C7F000",
    fontWeight: "900",
    marginTop: 8,
  },
  quickGrid: {
    flexDirection: "row",
    gap: 9,
  },
  quickCard: {
    flex: 1,
    backgroundColor: "#191919",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#252525",
    padding: 12,
    alignItems: "center",
    minHeight: 76,
  },
  quickIcon: {
    color: "#C7F000",
    fontSize: 16,
    fontWeight: "900",
  },
  quickText: {
    color: "#bbb",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 8,
    textAlign: "center",
  },
  totalCard: {
    backgroundColor: "#171717",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#252525",
    padding: 16,
    marginBottom: 14,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottomWidth: 1,
    borderBottomColor: "#2b2b2b",
    paddingBottom: 14,
  },
  totalCalories: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "900",
  },
  macroStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  panel: {
    backgroundColor: "#181818",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#252525",
    padding: 16,
    marginBottom: 14,
  },
  inputLabel: {
    color: "#8f8f8f",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 7,
    marginTop: 4,
  },
  input: {
    backgroundColor: "#222",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#292929",
    color: "#fff",
    padding: 13,
    marginBottom: 12,
  },
  suggestionList: {
    marginTop: -5,
    marginBottom: 10,
    gap: 7,
  },
  suggestionRow: {
    backgroundColor: "#101010",
    borderRadius: 8,
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  suggestionName: {
    color: "#ddd",
    fontWeight: "800",
    flex: 1,
  },
  macroInputs: {
    flexDirection: "row",
    gap: 8,
  },
  nutritionInputWrap: {
    flex: 1,
  },
  nutritionLabel: {
    fontSize: 10,
    fontWeight: "900",
    marginBottom: 5,
  },
  smallInput: {
    backgroundColor: "#222",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#292929",
    color: "#fff",
    padding: 12,
    textAlign: "center",
  },
  primaryButton: {
    marginTop: 14,
    backgroundColor: "#C7F000",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#111",
    fontWeight: "900",
  },
  searchInput: {
    backgroundColor: "#181818",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#252525",
    color: "#fff",
    padding: 14,
    marginBottom: 16,
  },
  categoryTitle: {
    color: "#777",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  foodCard: {
    backgroundColor: "#181818",
    borderWidth: 1,
    borderColor: "#252525",
    borderRadius: 8,
    padding: 13,
    marginBottom: 12,
  },
  foodCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  foodCardInfo: {
    flex: 1,
  },
  foodCardName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
  },
  foodMacros: {
    color: "#999",
    marginTop: 6,
    fontSize: 12,
    fontWeight: "800",
  },
  foodCaloriesBox: {
    alignItems: "flex-end",
  },
  foodCalories: {
    color: "#C7F000",
    fontSize: 22,
    fontWeight: "900",
  },
  foodKcal: {
    color: "#777",
    fontSize: 10,
    fontWeight: "800",
  },
  addFoodButton: {
    backgroundColor: "#9FBF3B",
    borderRadius: 8,
    marginTop: 11,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  addFoodText: {
    color: "#1f2a0f",
    fontWeight: "900",
    fontSize: 12,
  },
  segmented: {
    flexDirection: "row",
    backgroundColor: "#181818",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#252525",
    padding: 4,
    marginBottom: 14,
  },
  segment: {
    flex: 1,
    padding: 11,
    borderRadius: 7,
    alignItems: "center",
  },
  segmentActive: {
    backgroundColor: "#C7F000",
  },
  segmentText: {
    color: "#777",
    fontWeight: "900",
  },
  segmentTextActive: {
    color: "#111",
  },
  chartCard: {
    backgroundColor: "#181818",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#252525",
    padding: 16,
    marginBottom: 14,
  },
  chart: {
    height: 170,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 16,
  },
  barSlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  barValue: {
    color: "#6f6f6f",
    fontSize: 10,
    marginBottom: 4,
    height: 14,
  },
  bar: {
    width: 18,
    borderRadius: 5,
    backgroundColor: "#32324c",
  },
  barToday: {
    backgroundColor: "#C7F000",
  },
  barLabel: {
    color: "#777",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 8,
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: 12,
  },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 15,
  },
  summaryItem: {
    width: "50%",
  },
  summaryLabel: {
    color: "#777",
    fontSize: 12,
    fontWeight: "800",
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "900",
    marginTop: 4,
  },
  weekRow: {
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
    paddingBottom: 14,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  weekTitle: {
    color: "#fff",
    fontWeight: "900",
    marginBottom: 4,
  },
  goodBadge: {
    color: "#C7F000",
    backgroundColor: "#1d2c12",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    fontSize: 11,
    fontWeight: "900",
    alignSelf: "flex-start",
  },
  warnBadge: {
    color: "#ff9f43",
    backgroundColor: "#2c1c10",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    fontSize: 11,
    fontWeight: "900",
    alignSelf: "flex-start",
  },
  mealRow: {
    backgroundColor: "#171717",
    borderRadius: 8,
    padding: 13,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#252525",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  mealInfo: {
    flex: 1,
  },
  mealTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
  },
  mealMeta: {
    color: "#8f8f8f",
    marginTop: 5,
    fontSize: 12,
  },
  mealActions: {
    alignItems: "flex-end",
  },
  mealActionRow: {
    marginTop: 8,
    flexDirection: "row",
    gap: 8,
  },
  mealCalories: {
    color: "#C7F000",
    fontSize: 18,
    fontWeight: "900",
  },
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#1f2430",
  },
  editText: {
    color: "#a9c8ff",
    fontWeight: "800",
    fontSize: 12,
  },
  deleteButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#2a1515",
  },
  deleteText: {
    color: "#ff8a8a",
    fontWeight: "800",
    fontSize: 12,
  },
  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#080808",
    borderTopWidth: 1,
    borderTopColor: "#191919",
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 8,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  navItem: {
    flex: 1,
    alignItems: "center",
  },
  navIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  navIconActive: {
    backgroundColor: "#C7F000",
  },
  navIconText: {
    color: "#555",
    fontWeight: "900",
  },
  navIconTextActive: {
    color: "#111",
  },
  navText: {
    color: "#565656",
    fontSize: 10,
    fontWeight: "900",
    marginTop: 3,
  },
  navTextActive: {
    color: "#C7F000",
  },
  muted: {
    color: "#8f8f8f",
  },
  emptyText: {
    color: "#777",
    backgroundColor: "#131313",
    borderRadius: 8,
    padding: 18,
    textAlign: "center",
  },
  error: {
    color: "#ff8a8a",
    marginBottom: 12,
  },
  disabled: {
    opacity: 0.6,
  },
  blueText: {
    color: "#39c6f5",
    fontWeight: "900",
  },
  orangeText: {
    color: "#f9b13f",
    fontWeight: "900",
  },
  pinkText: {
    color: "#ff5c9a",
    fontWeight: "900",
  },
  limeText: {
    color: "#C7F000",
    fontWeight: "900",
  },
});
