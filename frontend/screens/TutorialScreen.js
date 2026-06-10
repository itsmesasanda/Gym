import React, { useRef, useState } from "react";
import { PanResponder, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const GREEN = "#C7F000";
const BG    = "#000000";
const WHITE = "#FFFFFF";
const MUTED = "#888888";

const SLIDES = [
  {
    icon: "chart-box-outline",
    title: "Your Fitness Hub",
    description: "Track calories, workouts, and progress — all in one place. Your dashboard gives you a live view of your daily goals.",
  },
  {
    icon: "robot-outline",
    title: "AI-Powered Plans",
    description: "Your AI coach builds personalized workout and nutrition plans based on your goals. Ask it anything, anytime.",
  },
  {
    icon: "qrcode-scan",
    title: "Check In Daily",
    description: "Scan your QR code at the gym entrance each visit. Build streaks, earn badges, and stay accountable.",
  },
];

export default function TutorialScreen({ navigation }) {
  const [slide, setSlide] = useState(0);
  const isLast = slide === SLIDES.length - 1;
  const current = SLIDES[slide];

  const next = () => {
    if (isLast) navigation.replace("Tabs");
    else setSlide(s => s + 1);
  };

  const prev = () => {
    if (slide > 0) setSlide(s => s - 1);
  };

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 20 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderRelease: (_, g) => {
        if (g.dx < -60) next();
        if (g.dx >  60) prev();
      },
    })
  ).current;

  return (
    <SafeAreaView style={s.container} edges={["top", "bottom"]} {...pan.panHandlers}>
      {/* Skip */}
      <TouchableOpacity style={s.skipBtn} onPress={() => navigation.replace("Tabs")}>
        <Text style={s.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Illustration */}
      <View style={s.body}>
        <View style={s.illustration}>
          <MaterialCommunityIcons name={current.icon} size={64} color={GREEN} />
        </View>
        <Text style={s.title}>{current.title}</Text>
        <Text style={s.desc}>{current.description}</Text>
        <Text style={s.swipeHint}>Swipe to navigate</Text>
      </View>

      {/* Bottom */}
      <View style={s.bottom}>
        <View style={s.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[s.dot, { width: i === slide ? 20 : 6, backgroundColor: i === slide ? GREEN : "#2a2a2a" }]}
            />
          ))}
        </View>
        <TouchableOpacity style={s.nextBtn} onPress={next}>
          <Text style={s.nextBtnText}>{isLast ? "Let's Go" : "Next →"}</Text>
        </TouchableOpacity>
      </View>

      <View style={s.bottomGlow} pointerEvents="none" />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  skipBtn:  { alignSelf: "flex-end", paddingHorizontal: 20, paddingTop: 16 },
  skipText: { color: "#555", fontSize: 14, fontWeight: "500" },

  body:         { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  illustration: {
    width: 144, height: 144, borderRadius: 24,
    backgroundColor: "rgba(200,255,0,0.06)",
    borderWidth: 1, borderColor: "rgba(200,255,0,0.15)",
    alignItems: "center", justifyContent: "center",
    marginBottom: 32,
    shadowColor: GREEN, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15, shadowRadius: 40, elevation: 6,
  },
  title:     { color: WHITE, fontSize: 24, fontWeight: "800", textAlign: "center", marginBottom: 14 },
  desc:      { color: MUTED, fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 16 },
  swipeHint: { color: "#2a2a2a", fontSize: 12 },

  bottom:  { paddingHorizontal: 24, paddingBottom: 20 },
  dots:    { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 20 },
  dot:     { height: 6, borderRadius: 3 },
  nextBtn: { backgroundColor: GREEN, paddingVertical: 16, borderRadius: 20, alignItems: "center" },
  nextBtnText: { color: "#000", fontSize: 15, fontWeight: "700" },

  bottomGlow: { position: "absolute", bottom: 0, left: 0, right: 0, height: "30%", backgroundColor: "transparent" },
});
