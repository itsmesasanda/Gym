import React, { useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";

const GREEN = "#C7F000";
const BG    = "#000000";
const MUTED = "#888888";
const WHITE = "#FFFFFF";

const BADGES = [
  { id: "1",  icon: { lib: "Feather",               name: "activity"        }, name: "First Visit",       desc: "Checked into the gym for the first time.", earned: true,  date: "Jan 15, 2025" },
  { id: "2",  icon: { lib: "MaterialCommunityIcons", name: "fire"            }, name: "7-Day Streak",      desc: "Checked in 7 days in a row.",             earned: true,  date: "Jan 22, 2025" },
  { id: "3",  icon: { lib: "MaterialCommunityIcons", name: "dumbbell"        }, name: "First Workout",     desc: "Logged your first workout session.",      earned: true,  date: "Jan 15, 2025" },
  { id: "4",  icon: { lib: "MaterialCommunityIcons", name: "robot-outline"   }, name: "First AI Plan",     desc: "Started your first AI-generated workout.", earned: true,  date: "Jan 16, 2025" },
  { id: "5",  icon: { lib: "MaterialCommunityIcons", name: "food-apple"      }, name: "First Meal Logged", desc: "Tracked your first meal.",                earned: true,  date: "Jan 15, 2025" },
  { id: "6",  icon: { lib: "MaterialCommunityIcons", name: "trophy-outline"  }, name: "30-Day Streak",     desc: "Check in for 30 days in a row.",          earned: false, progress: 12, max: 30  },
  { id: "7",  icon: { lib: "Feather",               name: "award"           }, name: "100-Day Streak",    desc: "The ultimate consistency badge.",          earned: false, progress: 12, max: 100 },
  { id: "8",  icon: { lib: "MaterialCommunityIcons", name: "clipboard-list"  }, name: "10 Workouts",       desc: "Complete 10 workout sessions.",           earned: false, progress: 4,  max: 10  },
  { id: "9",  icon: { lib: "MaterialCommunityIcons", name: "trophy"          }, name: "50 Workouts",       desc: "Complete 50 workout sessions.",           earned: false, progress: 4,  max: 50  },
  { id: "10", icon: { lib: "MaterialCommunityIcons", name: "food-apple"      }, name: "30 Days Nutrition", desc: "Log meals for 30 consecutive days.",      earned: false, progress: 12, max: 30  },
  { id: "11", icon: { lib: "Feather",               name: "calendar"        }, name: "3 Month Member",    desc: "Active member for 3 months.",             earned: false, progress: 1,  max: 3   },
  { id: "12", icon: { lib: "Feather",               name: "star"            }, name: "6 Month Member",    desc: "Active member for 6 months.",             earned: false, progress: 1,  max: 6   },
];

const TIMELINE = [
  { date: "May 21", activity: "Checked in · Upper Body Push Day" },
  { date: "May 20", activity: "Checked in · Rest day — recovery session" },
  { date: "May 19", activity: "Checked in · Lower Body Strength Day" },
  { date: "May 18", activity: "Checked in · Full Body Circuit" },
  { date: "May 17", activity: "Checked in · Push Day" },
];

const STREAK_DAYS    = 12;
const NEXT_MILESTONE = 30;

function BadgeIcon({ icon, size = 18, color = WHITE }) {
  if (icon.lib === "MaterialCommunityIcons") return <MaterialCommunityIcons name={icon.name} size={size} color={color} />;
  return <Feather name={icon.name} size={size} color={color} />;
}

function StreakRing({ current, max }) {
  const size   = 100;
  const stroke = 10;
  const r      = (size - stroke) / 2;
  const circ   = 2 * Math.PI * r;
  const offset = circ - (current / max) * circ;
  return (
    <View style={{ transform: [{ rotate: "-90deg" }] }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(200,255,0,0.12)" strokeWidth={stroke} />
        <Circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={GREEN} strokeWidth={stroke}
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

export default function StreaksScreen({ navigation }) {
  const [selectedBadge, setBadge] = useState(null);

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={20} color={WHITE} />
        </TouchableOpacity>
        <Text style={s.title}>Streaks & Milestones</Text>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* ── Streak Hero ── */}
        <View style={s.heroCard}>
          <View style={s.ringWrap}>
            <StreakRing current={STREAK_DAYS} max={NEXT_MILESTONE} />
            <View style={s.ringOverlay}>
              <MaterialCommunityIcons name="fire" size={28} color={GREEN} />
            </View>
          </View>
          <View>
            <Text style={s.streakNum}>{STREAK_DAYS}</Text>
            <Text style={s.streakLabel}>day streak</Text>
            <Text style={s.streakSub}>{NEXT_MILESTONE - STREAK_DAYS} days until next badge</Text>
          </View>
        </View>

        {/* ── Badge Grid ── */}
        <Text style={s.sectionTitle}>Milestone Badges</Text>
        <View style={s.badgeGrid}>
          {BADGES.map(badge => (
            <TouchableOpacity
              key={badge.id}
              style={[s.badgeCard, badge.earned && s.badgeCardEarned]}
              onPress={() => setBadge(badge)}
              activeOpacity={0.8}
            >
              <View style={s.badgeIconWrap}>
                <BadgeIcon icon={badge.icon} size={20} color={badge.earned ? GREEN : "#555"} />
                {!badge.earned && (
                  <View style={s.lockOverlay}>
                    <Feather name="lock" size={8} color="#888" />
                  </View>
                )}
              </View>
              <Text style={[s.badgeName, badge.earned && s.badgeNameEarned]}>{badge.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Timeline ── */}
        <Text style={s.sectionTitle}>Recent Activity</Text>
        <View style={s.timelineWrap}>
          <View style={s.timelineLine} />
          <View style={s.timelineItems}>
            {TIMELINE.map((item, i) => (
              <View key={i} style={s.timelineItem}>
                <View style={s.timelineDot} />
                <View>
                  <Text style={s.timelineDate}>{item.date}</Text>
                  <Text style={s.timelineActivity}>{item.activity}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>

      {/* ── Badge Detail Sheet ── */}
      <Modal visible={!!selectedBadge} transparent animationType="slide">
        <TouchableOpacity style={s.sheetOverlay} activeOpacity={1} onPress={() => setBadge(null)}>
          <View style={s.sheet}>
            {selectedBadge && (
              <>
                <View style={s.sheetIconWrap}>
                  <BadgeIcon icon={selectedBadge.icon} size={36} color={selectedBadge.earned ? GREEN : "#555"} />
                </View>
                <Text style={s.sheetName}>{selectedBadge.name}</Text>
                <Text style={s.sheetDesc}>{selectedBadge.desc}</Text>
                {selectedBadge.earned ? (
                  <View style={s.earnedBadge}>
                    <Text style={s.earnedText}>Earned {selectedBadge.date}</Text>
                  </View>
                ) : (
                  <View style={s.progressWrap}>
                    <View style={s.progressHeader}>
                      <Text style={s.progressLabel}>Progress</Text>
                      <Text style={s.progressValue}>{selectedBadge.progress} / {selectedBadge.max}</Text>
                    </View>
                    <View style={s.progressBarBg}>
                      <View style={[s.progressBarFill, { width: `${(selectedBadge.progress / selectedBadge.max) * 100}%` }]} />
                    </View>
                  </View>
                )}
                <TouchableOpacity style={s.sheetClose} onPress={() => setBadge(null)}>
                  <Text style={s.sheetCloseText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  header:   { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  backBtn:  { width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.07)", alignItems: "center", justifyContent: "center" },
  title:    { color: WHITE, fontSize: 18, fontWeight: "700" },

  content: { paddingHorizontal: 16, paddingBottom: 60, gap: 16 },

  heroCard:   { borderRadius: 24, padding: 20, flexDirection: "row", alignItems: "center", gap: 20, backgroundColor: "#111", borderWidth: 1, borderColor: "rgba(200,255,0,0.15)" },
  ringWrap:   { position: "relative", width: 100, height: 100 },
  ringOverlay:{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" },
  streakNum:  { color: GREEN, fontSize: 48, fontWeight: "900", lineHeight: 52 },
  streakLabel:{ color: WHITE, fontSize: 14, fontWeight: "600" },
  streakSub:  { color: MUTED, fontSize: 12, marginTop: 4 },

  sectionTitle: { color: WHITE, fontSize: 14, fontWeight: "700" },

  badgeGrid:      { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  badgeCard:      { width: "30%", backgroundColor: "#111", borderRadius: 16, padding: 12, alignItems: "center", gap: 6, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", opacity: 0.5 },
  badgeCardEarned:{ backgroundColor: "rgba(200,255,0,0.08)", borderColor: "rgba(200,255,0,0.2)", opacity: 1 },
  badgeIconWrap:  { position: "relative", width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  lockOverlay:    { position: "absolute", bottom: -2, right: -2, width: 14, height: 14, borderRadius: 7, backgroundColor: "#222", alignItems: "center", justifyContent: "center" },
  badgeName:      { color: "#555", fontSize: 10, fontWeight: "600", textAlign: "center", lineHeight: 14 },
  badgeNameEarned:{ color: GREEN },

  timelineWrap:    { position: "relative", paddingLeft: 24 },
  timelineLine:    { position: "absolute", left: 12, top: 0, bottom: 0, width: 2, backgroundColor: "rgba(200,255,0,0.2)" },
  timelineItems:   { gap: 16 },
  timelineItem:    { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  timelineDot:     { width: 10, height: 10, borderRadius: 5, backgroundColor: GREEN, marginTop: 3, marginLeft: -5, shadowColor: GREEN, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 4 },
  timelineDate:    { color: GREEN, fontSize: 11, fontWeight: "600", marginBottom: 2 },
  timelineActivity:{ color: MUTED, fontSize: 12 },

  sheetOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  sheet:        { backgroundColor: "#1A1A1A", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  sheetIconWrap:{ width: 72, height: 72, borderRadius: 24, backgroundColor: "rgba(200,255,0,0.08)", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  sheetName:    { color: WHITE, fontSize: 16, fontWeight: "700", marginBottom: 8 },
  sheetDesc:    { color: MUTED, fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 16 },
  earnedBadge:  { backgroundColor: "rgba(200,255,0,0.1)", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginBottom: 16 },
  earnedText:   { color: GREEN, fontSize: 12, fontWeight: "600" },
  progressWrap: { width: "100%", marginBottom: 16 },
  progressHeader:{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  progressLabel: { color: MUTED, fontSize: 12 },
  progressValue: { color: GREEN, fontSize: 12, fontWeight: "600" },
  progressBarBg: { height: 6, backgroundColor: "#2a2a2a", borderRadius: 3, overflow: "hidden" },
  progressBarFill:{ height: "100%", backgroundColor: GREEN, borderRadius: 3 },
  sheetClose:    { width: "100%", paddingVertical: 14, borderRadius: 16, backgroundColor: "#2a2a2a", alignItems: "center" },
  sheetCloseText:{ color: WHITE, fontWeight: "600" },
});
