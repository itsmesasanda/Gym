import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

const GREEN = "#C7F000";
const BG    = "#000000";
const CARD  = "#1A1A1A";
const MUTED = "#888888";
const WHITE = "#FFFFFF";

const articles = {
  Nutrition: [
    {
      title: "How Many Calories Do You Need",
      body: "Your calorie needs depend on your weight, height, age, and activity level. For muscle gain, aim for a 200–300 kcal surplus above your TDEE. For fat loss, a 300–500 kcal deficit works well. Track for 2 weeks and adjust based on the scale.\n\nA quick estimate: bodyweight in kg × 30–35 kcal = maintenance for moderate activity. If you're lifting 4+ times a week, lean toward the higher end.",
    },
    {
      title: "What Is Protein and Why It Matters",
      body: "Protein is the building block of muscle. Without adequate protein, your body can't repair muscle tissue after training — and growth stalls.\n\nAim for 1.6–2.2g of protein per kg of bodyweight daily. At 80kg, that's 128–176g. Spread it across 3–5 meals. The best sources: chicken breast, eggs, Greek yogurt, cottage cheese, whey protein, and fish.",
    },
    {
      title: "Meal Timing Basics",
      body: "Meal timing matters less than total daily intake — but it still plays a role. Eating protein within 2 hours post-workout helps muscle protein synthesis. Don't train on empty if you feel weak; a light snack 30–60 min before is fine.\n\nFor most people, 3–4 balanced meals work better than constantly snacking.",
    },
    {
      title: "Hydration Guide",
      body: "Water affects strength, endurance, and recovery more than most people realize. Even 2% dehydration can reduce performance.\n\nAim for 35–45ml per kg of bodyweight daily. At 80kg, that's around 2.8–3.6 liters. Increase intake on training days and in hot climates.",
    },
  ],
  Training: [
    {
      title: "How to Start at the Gym",
      body: "The first month is about learning movement patterns, not maxing out. Focus on the main compound lifts: squat, deadlift, bench press, overhead press, and row.\n\nStart with 3 days per week — full body or upper/lower. Leave at least one rest day between sessions.",
    },
    {
      title: "What Is Progressive Overload",
      body: "Progressive overload is the single most important principle in training. Your muscles grow in response to increasing demands. If you lift the same weight for the same reps every week, your body adapts and stops growing.\n\nAdd 2.5–5kg to compound lifts when you can complete all sets with good form.",
    },
    {
      title: "Why Rest Days Matter",
      body: "Muscle doesn't grow during training — it grows during recovery. Training is the stimulus, sleep and rest are when the adaptation happens.\n\nTake at least 1–2 full rest days per week. On rest days, light walking, stretching, or mobility work is fine.",
    },
    {
      title: "Form Before Weight",
      body: "Ego lifting is the fastest way to get injured. A rep with poor form doesn't count — it just damages joints and tendons.\n\nFor every major lift, spend the first few sessions with lighter weight: learn the movement, feel the target muscle working, and control the tempo.",
    },
  ],
};

function ArticleReader({ article, onBack }) {
  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={onBack}>
          <Feather name="arrow-left" size={20} color={WHITE} />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={2}>{article.title}</Text>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.readerContent}>
        <Text style={s.readerTitle}>{article.title}</Text>
        {article.body.split("\n\n").map((para, i) => (
          <Text key={i} style={s.readerPara}>{para}</Text>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function BeginnerGuideScreen({ navigation }) {
  const [tab, setTab]           = useState("Nutrition");
  const [expanded, setExpanded] = useState(null);

  if (expanded) {
    const all     = [...articles.Nutrition, ...articles.Training];
    const article = all.find(a => a.title === expanded);
    return <ArticleReader article={article} onBack={() => setExpanded(null)} />;
  }

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={20} color={WHITE} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Beginner Guide</Text>
      </View>

      {/* Tab pills */}
      <View style={s.tabRow}>
        {["Nutrition", "Training"].map(t => (
          <TouchableOpacity
            key={t}
            style={[s.tabPill, tab === t && s.tabPillActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[s.tabPillText, tab === t && s.tabPillTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.list}>
        {articles[tab].map(article => (
          <TouchableOpacity
            key={article.title}
            style={s.articleCard}
            onPress={() => setExpanded(article.title)}
            activeOpacity={0.75}
          >
            <View style={s.articleRow}>
              <View style={s.articleIconWrap}>
                <Feather
                  name={tab === "Nutrition" ? "coffee" : "activity"}
                  size={20}
                  color={GREEN}
                />
              </View>
              <View style={s.articleBody}>
                <Text style={s.articleTitle}>{article.title}</Text>
                <Text style={s.articlePreview} numberOfLines={2}>
                  {article.body.slice(0, 80)}…
                </Text>
                <View style={s.readMoreRow}>
                  <Text style={s.readMore}>Read More</Text>
                  <Feather name="chevron-right" size={12} color={GREEN} />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  header:      { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  backBtn:     { width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.07)", alignItems: "center", justifyContent: "center" },
  headerTitle: { color: WHITE, fontSize: 18, fontWeight: "700", flex: 1 },

  tabRow:           { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 14 },
  tabPill:          { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.07)" },
  tabPillActive:    { backgroundColor: GREEN },
  tabPillText:      { color: MUTED, fontSize: 14, fontWeight: "500" },
  tabPillTextActive:{ color: "#000", fontWeight: "700" },

  list: { paddingHorizontal: 16, gap: 12, paddingBottom: 40 },

  articleCard:    { backgroundColor: CARD, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  articleRow:     { flexDirection: "row", gap: 14 },
  articleIconWrap:{ width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(200,255,0,0.08)", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  articleBody:    { flex: 1 },
  articleTitle:   { color: WHITE, fontSize: 14, fontWeight: "700", marginBottom: 4 },
  articlePreview: { color: MUTED, fontSize: 12, lineHeight: 18, marginBottom: 8 },
  readMoreRow:    { flexDirection: "row", alignItems: "center", gap: 2 },
  readMore:       { color: GREEN, fontSize: 12, fontWeight: "600" },

  readerContent: { paddingHorizontal: 20, paddingBottom: 60 },
  readerTitle:   { color: WHITE, fontSize: 20, fontWeight: "800", marginBottom: 20, lineHeight: 28 },
  readerPara:    { color: MUTED, fontSize: 14, lineHeight: 24, marginBottom: 14 },
});
