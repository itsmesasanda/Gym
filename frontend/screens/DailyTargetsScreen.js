import React, { useRef } from "react";
import { PanResponder, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { getUserToken, setUserEmail } from "../utils/session";
import { BASE_URL } from "../config";

const GREEN  = "#C7F000";
const BG     = "#000000";
const CARD   = "#1C1C1E";
const BORDER = "#2C2C2E";
const MUTED  = "#A1A1A6";
const WHITE  = "#FFFFFF";
const BLUE   = "#4FC3F7";
const ORANGE = "#FF9500";

export default function DailyTargetsScreen({ navigation, route }) {
  const { email, goal, targetWeight, height, weight, activityLevel } = route.params;

  setUserEmail(email);

  const age = 21;
  const BMR = 10 * weight + 6.25 * height - 5 * age + 5;
  const activityMultiplier = activityLevel === "low" ? 1.2 : activityLevel === "high" ? 1.9 : 1.55;
  let calories = Math.round(BMR * activityMultiplier);
  if (goal === "muscle_gain") calories += 300;
  if (goal === "fat_loss")    calories -= 300;
  const protein = Math.round(weight * 2);

  const goalLabel = { muscle_gain: "Muscle Gain", fat_loss: "Fat Loss", maintenance: "Maintenance" }[goal] || goal;
  const actLabel  = { low: "Low", moderate: "Moderate", high: "High" }[activityLevel] || activityLevel;

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 20 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderRelease: (_, g) => {
        if (g.dx < -60) handleSave();
        if (g.dx >  60) navigation.goBack();
      },
    })
  ).current;

  const handleSave = async () => {
    try {
      const token = getUserToken();
      const url = token
        ? `${BASE_URL}/api/users/profile`
        : `${BASE_URL}/api/users/profile?email=${encodeURIComponent(email)}`;
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ goal, targetWeight, height, weight, activityLevel, calories, protein }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message); return; }
      navigation.replace("Tutorial");
    } catch {
      alert("Failed to save profile");
    }
  };

  return (
    <SafeAreaView style={s.container} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={s.scroll} {...pan.panHandlers}>

        {/* Progress bar — all 3 active */}
        <View style={s.progressRow}>
          {[1, 2, 3].map(i => (
            <View key={i} style={[s.progressSeg, { backgroundColor: GREEN }]} />
          ))}
        </View>

        <Text style={s.step}>Step 3 of 3</Text>
        <Text style={s.title}>Your Daily Targets</Text>
        <Text style={s.subtitle}>Calculated based on your data</Text>

        {/* Calorie hero card */}
        <View style={s.mainCard}>
          <View style={s.calIconWrap}>
            <Feather name="zap" size={20} color={GREEN} />
          </View>
          <Text style={s.mainCardLabel}>Daily Calories</Text>
          <Text style={s.calorieNum}>{calories.toLocaleString()}</Text>
          <Text style={s.calorieUnit}>kcal per day</Text>
        </View>

        {/* Stat cards */}
        <View style={s.cardsRow}>
          <View style={s.statCard}>
            <MaterialCommunityIcons name="dumbbell" size={18} color={BLUE} style={{ marginBottom: 6 }} />
            <Text style={s.statLabel}>Daily Protein</Text>
            <Text style={s.statValue}>{protein}g</Text>
            <Text style={s.statSub}>Protein target</Text>
          </View>
          <View style={s.statCard}>
            <Feather name="target" size={18} color={ORANGE} style={{ marginBottom: 6 }} />
            <Text style={s.statLabel}>Your Goal</Text>
            <Text style={[s.statValue, { fontSize: 14 }]}>{goalLabel}</Text>
            <Text style={s.statSub}>{actLabel} activity</Text>
          </View>
        </View>

        <TouchableOpacity style={s.saveBtn} onPress={handleSave} activeOpacity={0.8}>
          <Feather name="check" size={18} color="#000" />
          <Text style={s.saveBtnText}>Save & Continue</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scroll:    { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },

  progressRow: { flexDirection: "row", gap: 8, marginBottom: 24 },
  progressSeg: { flex: 1, height: 4, borderRadius: 2 },

  step:     { color: GREEN, fontSize: 13, marginBottom: 6 },
  title:    { color: WHITE, fontSize: 24, fontWeight: "700", marginBottom: 4 },
  subtitle: { color: MUTED, fontSize: 14, marginBottom: 24 },

  mainCard: { backgroundColor: CARD, borderRadius: 24, padding: 28, alignItems: "center", marginBottom: 16, borderWidth: 1, borderColor: "rgba(200,255,0,0.12)" },
  calIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(200,255,0,0.1)", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  mainCardLabel: { color: MUTED, fontSize: 13, marginBottom: 6 },
  calorieNum:    { color: WHITE, fontSize: 54, fontWeight: "900", lineHeight: 60 },
  calorieUnit:   { color: GREEN, fontSize: 14, marginTop: 4 },

  cardsRow: { flexDirection: "row", gap: 12, marginBottom: 32 },
  statCard:  { flex: 1, backgroundColor: CARD, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: BORDER },
  statLabel: { color: MUTED, fontSize: 11, marginBottom: 4 },
  statValue: { color: WHITE, fontSize: 20, fontWeight: "800", marginBottom: 2 },
  statSub:   { color: GREEN, fontSize: 11 },

  saveBtn:     { backgroundColor: GREEN, paddingVertical: 16, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  saveBtnText: { color: "#000", fontSize: 15, fontWeight: "700" },
});
