import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

const GREEN  = "#C7F000";
const BG     = "#000000";
const CARD   = "#1C1C1E";
const BORDER = "#2C2C2E";
const MUTED  = "#A1A1A6";
const WHITE  = "#FFFFFF";

const ACTIVITIES = [
  { id: "low",      label: "Low",      desc: "1–2 workouts per week" },
  { id: "moderate", label: "Moderate", desc: "3–4 workouts per week" },
  { id: "high",     label: "High",     desc: "5+ workouts per week"  },
];

export default function MeasurementsScreen({ navigation, route }) {
  const { email, goal, targetWeight } = route.params ?? {};
  const [height, setHeight]     = useState("");
  const [weight, setWeight]     = useState("");
  const [activity, setActivity] = useState("moderate");

  const handleNext = () => {
    if (!height || !weight) { alert("Enter height and weight"); return; }
    navigation.navigate("DailyTargets", {
      email, goal, targetWeight,
      height: Number(height),
      weight: Number(weight),
      activityLevel: activity,
    });
  };

  return (
    <SafeAreaView style={s.container} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* Progress bar */}
        <View style={s.progressRow}>
          {[1, 2, 3].map(i => (
            <View key={i} style={[s.progressSeg, { backgroundColor: i <= 2 ? GREEN : BORDER }]} />
          ))}
        </View>

        <Text style={s.step}>Step 2 of 3</Text>
        <Text style={s.title}>Your Measurements</Text>
        <Text style={s.subtitle}>Help us calculate your targets</Text>

        <View style={s.fieldWrap}>
          <Text style={s.label}>Height (cm)</Text>
          <TextInput
            style={s.input}
            value={height}
            onChangeText={setHeight}
            placeholder="e.g. 175"
            placeholderTextColor="#555"
            keyboardType="numeric"
          />
        </View>

        <View style={s.fieldWrap}>
          <Text style={s.label}>Current Weight (kg)</Text>
          <TextInput
            style={s.input}
            value={weight}
            onChangeText={setWeight}
            placeholder="e.g. 70"
            placeholderTextColor="#555"
            keyboardType="numeric"
          />
        </View>

        <Text style={[s.label, { marginBottom: 12 }]}>Activity Level</Text>
        <View style={s.options}>
          {ACTIVITIES.map(opt => (
            <TouchableOpacity
              key={opt.id}
              style={[s.option, activity === opt.id && s.optionActive]}
              onPress={() => setActivity(opt.id)}
              activeOpacity={0.8}
            >
              <View style={{ flex: 1 }}>
                <Text style={s.optionLabel}>{opt.label}</Text>
                <Text style={s.optionDesc}>{opt.desc}</Text>
              </View>
              <View style={[s.radio, activity === opt.id && s.radioActive]}>
                {activity === opt.id && <View style={s.radioDot} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={s.nextBtn} onPress={handleNext} activeOpacity={0.8}>
          <Text style={s.nextBtnText}>Next</Text>
          <Feather name="chevron-right" size={18} color="#000" />
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

  fieldWrap: { marginBottom: 20 },
  label:     { color: MUTED, fontSize: 12, marginBottom: 6 },
  input:     { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 16, color: WHITE, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15 },

  options:      { gap: 12, marginBottom: 32 },
  option:       { backgroundColor: CARD, borderWidth: 1.5, borderColor: BORDER, borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  optionActive: { backgroundColor: "rgba(199,240,0,0.08)", borderColor: GREEN },
  optionLabel:  { color: WHITE, fontSize: 14, fontWeight: "600" },
  optionDesc:   { color: MUTED, fontSize: 12, marginTop: 2 },
  radio:        { width: 20, height: 20, borderRadius: 10, backgroundColor: BORDER, alignItems: "center", justifyContent: "center" },
  radioActive:  { backgroundColor: GREEN },
  radioDot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: "#000" },

  nextBtn:     { backgroundColor: GREEN, paddingVertical: 16, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  nextBtnText: { color: "#000", fontSize: 15, fontWeight: "700" },
});
