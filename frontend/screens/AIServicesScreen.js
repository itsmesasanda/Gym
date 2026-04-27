import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import WorkoutPlanScreen from "./WorkoutPlanScreen";
import MealPlanScreen from "./MealPlanScreen";

const GREEN  = "#C7F000";
const BG     = "#0D0D0D";
const CARD   = "#1A1A1A";
const BORDER = "#2A2A2A";
const MUTED  = "#888888";
const WHITE  = "#FFFFFF";
const PURPLE = "#BF5AF2";
const BLUE   = "#64D2FF";

export default function AIServicesScreen() {
  // null = hub, "workout" = workout screen, "meal" = meal screen
  const [activeService, setActiveService] = useState(null);

  if (activeService === "workout") {
    return (
      <SafeAreaView style={s.container}>
        <TouchableOpacity onPress={() => setActiveService(null)} style={s.backRow}>
          <Text style={s.backText}>← Back to AI Services</Text>
        </TouchableOpacity>
        <WorkoutPlanScreen />
      </SafeAreaView>
    );
  }

  if (activeService === "meal") {
    return (
      <SafeAreaView style={s.container}>
        <TouchableOpacity onPress={() => setActiveService(null)} style={s.backRow}>
          <Text style={s.backText}>← Back to AI Services</Text>
        </TouchableOpacity>
        <MealPlanScreen />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.pageTitle}>AI Services</Text>
        <Text style={s.pageSubtitle}>AI-powered tools to optimize your fitness journey.</Text>

        {/* Workout Plans Card */}
        <TouchableOpacity
          style={[s.serviceCard, { borderLeftColor: GREEN }]}
          onPress={() => setActiveService("workout")}
          activeOpacity={0.85}
        >
          <View style={s.serviceHeader}>
            <Text style={s.serviceEmoji}>💪</Text>
            <View style={s.serviceTitleWrap}>
              <Text style={s.serviceTitle}>Workout Plans</Text>
              <Text style={s.serviceDesc}>
                Generate a personalized 7-day workout plan based on your goals, fitness level, and injuries.
              </Text>
            </View>
          </View>
          <View style={s.serviceFooter}>
            <View style={[s.tag, { backgroundColor: "rgba(199, 240, 0, 0.15)" }]}>
              <Text style={[s.tagText, { color: GREEN }]}>RAG + Groq AI</Text>
            </View>
            <Text style={s.arrowText}>→</Text>
          </View>
        </TouchableOpacity>

        {/* Meal Recommendations Card */}
        <TouchableOpacity
          style={[s.serviceCard, { borderLeftColor: PURPLE }]}
          onPress={() => setActiveService("meal")}
          activeOpacity={0.85}
        >
          <View style={s.serviceHeader}>
            <Text style={s.serviceEmoji}>🍽️</Text>
            <View style={s.serviceTitleWrap}>
              <Text style={s.serviceTitle}>Meal Recommendations</Text>
              <Text style={s.serviceDesc}>
                Get 5 AI-matched meals from 1,400+ recipes based on your calorie and macro targets.
              </Text>
            </View>
          </View>
          <View style={s.serviceFooter}>
            <View style={[s.tag, { backgroundColor: "rgba(191, 90, 242, 0.15)" }]}>
              <Text style={[s.tagText, { color: PURPLE }]}>Sri Lankan + Indian + Intl</Text>
            </View>
            <Text style={s.arrowText}>→</Text>
          </View>
        </TouchableOpacity>

        {/* Info text */}
        <View style={s.infoBox}>
          <Text style={s.infoText}>
            Both services use RAG (Retrieval-Augmented Generation) — your profile and preferences are matched against real data before the AI generates recommendations.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scroll: { flex: 1, paddingHorizontal: 16 },

  pageTitle: { color: WHITE, fontSize: 28, fontWeight: "900", marginTop: 20, marginBottom: 4 },
  pageSubtitle: { color: MUTED, fontSize: 13, marginBottom: 24 },

  backRow: { paddingHorizontal: 16, paddingVertical: 10 },
  backText: { color: WHITE, fontSize: 15, fontWeight: "700" },

  serviceCard: {
    backgroundColor: CARD, borderRadius: 16, padding: 20,
    marginBottom: 16, borderWidth: 1, borderColor: BORDER,
    borderLeftWidth: 4,
  },
  serviceHeader: { flexDirection: "row", gap: 14, marginBottom: 16 },
  serviceEmoji: { fontSize: 32, marginTop: 2 },
  serviceTitleWrap: { flex: 1 },
  serviceTitle: { color: WHITE, fontSize: 18, fontWeight: "800", marginBottom: 6 },
  serviceDesc: { color: MUTED, fontSize: 13, lineHeight: 19 },
  serviceFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontSize: 11, fontWeight: "700" },
  arrowText: { color: MUTED, fontSize: 20, fontWeight: "300" },

  infoBox: {
    backgroundColor: "rgba(100, 210, 255, 0.06)", borderRadius: 12,
    padding: 16, borderWidth: 1, borderColor: "rgba(100, 210, 255, 0.15)",
    marginTop: 8,
  },
  infoText: { color: MUTED, fontSize: 12, lineHeight: 18 },
});
