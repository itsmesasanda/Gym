import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

const GREEN = "#C7F000";
const BG    = "#000000";
const WHITE = "#FFFFFF";
const MUTED = "#888888";

export default function CheckinConfirmationScreen({ navigation }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const time = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  return (
    <SafeAreaView style={s.container} edges={["top", "bottom"]}>
      <View style={s.body}>

        {/* Animated checkmark */}
        <Animated.View style={[s.checkCircle, { transform: [{ scale: scaleAnim }] }]}>
          <Feather name="check" size={42} color={GREEN} />
        </Animated.View>

        <Text style={s.checkedTitle}>Checked In!</Text>
        <Text style={s.timeText}>{time}</Text>

        {/* Streak card */}
        <View style={s.streakCard}>
          <View style={s.streakIcon}>
            <MaterialCommunityIcons name="fire" size={26} color="#FF9500" />
          </View>
          <View>
            <View style={s.streakRow}>
              <Text style={s.streakNum}>12</Text>
              <Text style={s.streakLabel}> day streak</Text>
            </View>
            <Text style={s.streakSub}>Keep it up! 18 more days for your next badge</Text>
          </View>
        </View>

        {/* AI Insight */}
        <View style={s.insightCard}>
          <View style={s.insightIcon}>
            <MaterialCommunityIcons name="robot-outline" size={16} color={GREEN} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.insightTitle}>{"Today's AI Insight"}</Text>
            <Text style={s.insightText}>
              {"You've hit your protein goal 5 days in a row. Great consistency — keep it up today!"}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={s.dashBtn}
          onPress={() => navigation.navigate("Dashboard")}
        >
          <Text style={s.dashBtnText}>Go to Dashboard</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  body:      { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, gap: 16 },

  checkCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: "rgba(200,255,0,0.12)",
    borderWidth: 2, borderColor: "rgba(200,255,0,0.3)",
    alignItems: "center", justifyContent: "center",
    shadowColor: GREEN, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3, shadowRadius: 30, elevation: 8,
    marginBottom: 4,
  },
  checkedTitle: { color: WHITE, fontSize: 26, fontWeight: "800" },
  timeText:     { color: MUTED, fontSize: 14, marginBottom: 8 },

  streakCard: { width: "100%", flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "#1A1A1A", borderRadius: 20, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  streakIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: "rgba(255,149,0,0.12)", alignItems: "center", justifyContent: "center" },
  streakRow:  { flexDirection: "row", alignItems: "baseline" },
  streakNum:  { color: GREEN, fontSize: 26, fontWeight: "800" },
  streakLabel:{ color: WHITE, fontSize: 15, fontWeight: "600" },
  streakSub:  { color: MUTED, fontSize: 12, marginTop: 2 },

  insightCard:  { width: "100%", flexDirection: "row", alignItems: "flex-start", gap: 12, backgroundColor: "#1A1A1A", borderRadius: 20, padding: 14, borderWidth: 1, borderColor: "rgba(200,255,0,0.1)" },
  insightIcon:  { width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(200,255,0,0.1)", alignItems: "center", justifyContent: "center", marginTop: 2 },
  insightTitle: { color: GREEN, fontSize: 12, fontWeight: "600", marginBottom: 2 },
  insightText:  { color: "#aaa", fontSize: 12, lineHeight: 18 },

  dashBtn:     { width: "100%", paddingVertical: 16, borderRadius: 20, backgroundColor: GREEN, alignItems: "center", marginTop: 8 },
  dashBtnText: { color: "#000", fontSize: 15, fontWeight: "700" },
});
