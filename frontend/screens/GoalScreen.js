import React, { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

const GREEN  = "#C7F000";
const BG     = "#000000";
const CARD   = "#1C1C1E";
const BORDER = "#2C2C2E";
const MUTED  = "#A1A1A6";
const WHITE  = "#FFFFFF";

const GOALS = [
  { id: "muscle_gain", label: "Muscle Gain",  desc: "Build strength & size",   icon: "arm-flex" },
  { id: "fat_loss",    label: "Fat Loss",     desc: "Lean out & get shredded", icon: "fire" },
  { id: "maintenance", label: "Maintenance", desc: "Stay fit & healthy",       icon: "scale-balance" },
];

export default function GoalScreen({ navigation, route }) {
  const [goal, setGoal]               = useState("muscle_gain");
  const [targetWeight, setTargetWeight] = useState("");

  const handleNext = () => {
    if (!targetWeight) { alert("Enter target weight"); return; }
    navigation.navigate("Measurements", { email: route.params?.email, goal, targetWeight: Number(targetWeight) });
  };

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 20 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderRelease: (_, g) => {
        if (g.dx < -60) handleNext();
      },
    })
  ).current;

  return (
    <SafeAreaView style={s.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          {...pan.panHandlers}
        >
          {/* Progress */}
          <View style={s.progressRow}>
            {[1, 2, 3].map(i => (
              <View key={i} style={[s.progressSeg, { backgroundColor: i <= 1 ? GREEN : BORDER }]} />
            ))}
          </View>

          <Text style={s.step}>Step 1 of 3</Text>
          <Text style={s.title}>Let's Set Your Goal</Text>
          <Text style={s.subtitle}>Choose what you want to achieve</Text>

          <View style={s.options}>
            {GOALS.map(opt => (
              <TouchableOpacity
                key={opt.id}
                style={[s.option, goal === opt.id && s.optionActive]}
                onPress={() => setGoal(opt.id)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name={opt.icon}
                  size={24}
                  color={goal === opt.id ? GREEN : WHITE}
                  style={s.optionIcon}
                />
                <View style={{ flex: 1 }}>
                  <Text style={s.optionLabel}>{opt.label}</Text>
                  <Text style={s.optionDesc}>{opt.desc}</Text>
                </View>
                <View style={[s.radio, goal === opt.id && s.radioActive]}>
                  {goal === opt.id && <View style={s.radioDot} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={s.fieldWrap}>
            <Text style={s.label}>Target Weight (kg)</Text>
            <TextInput
              style={s.input}
              value={targetWeight}
              onChangeText={setTargetWeight}
              placeholder="e.g. 75"
              placeholderTextColor="#555"
              keyboardType="numeric"
              returnKeyType="done"
            />
          </View>

          <TouchableOpacity style={s.nextBtn} onPress={handleNext} activeOpacity={0.8}>
            <Text style={s.nextBtnText}>Next</Text>
            <Feather name="chevron-right" size={18} color="#000" />
          </TouchableOpacity>

          <Text style={s.swipeHint}>Swipe left to continue</Text>
        </ScrollView>
      </KeyboardAvoidingView>
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

  options:      { gap: 12, marginBottom: 24 },
  option:       { backgroundColor: CARD, borderWidth: 1.5, borderColor: BORDER, borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  optionActive: { backgroundColor: "rgba(199,240,0,0.08)", borderColor: GREEN },
  optionIcon:   { width: 28, textAlign: "center" },
  optionLabel:  { color: WHITE, fontSize: 14, fontWeight: "600" },
  optionDesc:   { color: MUTED, fontSize: 12, marginTop: 2 },
  radio:        { width: 20, height: 20, borderRadius: 10, backgroundColor: BORDER, alignItems: "center", justifyContent: "center" },
  radioActive:  { backgroundColor: GREEN },
  radioDot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: "#000" },

  fieldWrap: { marginBottom: 32 },
  label:     { color: MUTED, fontSize: 12, marginBottom: 6 },
  input:     { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 16, color: WHITE, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15 },

  nextBtn:     { backgroundColor: GREEN, paddingVertical: 16, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 },
  nextBtnText: { color: "#000", fontSize: 15, fontWeight: "700" },

  swipeHint: { color: "#333", fontSize: 12, textAlign: "center" },
});
