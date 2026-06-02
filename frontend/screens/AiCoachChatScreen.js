import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
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
import { BASE_URL } from "../config";
import { authFetch } from "../utils/authFetch";

const BG     = "#000000";
const CARD   = "#1C1C1E";
const BORDER = "#2C2C2E";
const GREEN  = "#C7F000";
const WHITE  = "#FFFFFF";
const MUTED  = "#A1A1A6";
const BLUE   = "#5AC8FA";
const ORANGE = "#FF9500";

const SUGGESTIONS = [
  "I have no injuries",
  "I have a knee/shoulder injury",
  "I can train 3 days a week",
  "My goal is to build muscle",
];

function WorkoutPlanCard({ plan, onSave, saving }) {
  const [expanded, setExpanded] = useState(null);

  return (
    <View style={s.planCard}>
      <View style={s.planHeader}>
        <MaterialCommunityIcons name="dumbbell" size={18} color={GREEN} />
        <Text style={s.planTitle}>{plan.title}</Text>
      </View>

      {plan.goal ? (
        <View style={s.planGoalRow}>
          <Feather name="target" size={12} color={ORANGE} />
          <Text style={s.planGoalText}>{plan.goal.replace(/_/g, " ")}</Text>
        </View>
      ) : null}

      <View style={s.planDays}>
        {plan.days.map((day, i) => {
          const isOpen = expanded === i;
          return (
            <View key={i} style={s.dayBlock}>
              <TouchableOpacity
                style={s.dayHeader}
                onPress={() => setExpanded(isOpen ? null : i)}
                activeOpacity={0.8}
              >
                <View style={s.dayNumBadge}>
                  <Text style={s.dayNumText}>{day.day}</Text>
                </View>
                <Text style={s.dayFocus} numberOfLines={1}>{day.focus}</Text>
                <Feather name={isOpen ? "chevron-up" : "chevron-down"} size={14} color={MUTED} />
              </TouchableOpacity>

              {isOpen && (
                <View style={s.exerciseList}>
                  {(day.exercises || []).map((ex, j) => (
                    <View key={j} style={s.exerciseRow}>
                      <View style={s.exDot} />
                      <Text style={s.exName} numberOfLines={1}>{ex.name}</Text>
                      <Text style={s.exMeta}>{ex.sets}×{ex.reps}</Text>
                      {ex.rest ? <Text style={s.exRest}>{ex.rest}</Text> : null}
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </View>

      {plan.notes ? (
        <Text style={s.planNotes}>{plan.notes}</Text>
      ) : null}

      <TouchableOpacity
        style={[s.saveBtn, saving && s.saveBtnDisabled]}
        onPress={onSave}
        disabled={saving}
        activeOpacity={0.85}
      >
        {saving ? (
          <ActivityIndicator color="#000" size="small" />
        ) : (
          <>
            <Feather name="download" size={14} color="#000" />
            <Text style={s.saveBtnText}>Save to My Workouts</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

function Bubble({ msg, onSave, saving }) {
  const isUser = msg.role === "user";

  if (isUser) {
    return (
      <View style={s.bubbleRow}>
        <View style={[s.bubble, s.bubbleUser]}>
          <Text style={s.bubbleTextUser}>{msg.content}</Text>
        </View>
      </View>
    );
  }

  if (msg.type === "workout_plan" && msg.plan) {
    return (
      <View style={[s.bubbleRow, s.bubbleRowAi]}>
        <View style={s.coachAvatar}>
          <MaterialCommunityIcons name="robot-outline" size={14} color={GREEN} />
        </View>
        <View style={{ flex: 1 }}>
          {msg.content ? (
            <View style={[s.bubble, s.bubbleAi, { marginBottom: 8 }]}>
              <Text style={s.bubbleTextAi}>{msg.content}</Text>
            </View>
          ) : null}
          <WorkoutPlanCard plan={msg.plan} onSave={() => onSave(msg.plan)} saving={saving} />
        </View>
      </View>
    );
  }

  return (
    <View style={[s.bubbleRow, s.bubbleRowAi]}>
      <View style={s.coachAvatar}>
        <MaterialCommunityIcons name="robot-outline" size={14} color={GREEN} />
      </View>
      <View style={[s.bubble, s.bubbleAi]}>
        <Text style={s.bubbleTextAi}>{msg.content}</Text>
      </View>
    </View>
  );
}

let msgId = 0;
const mkMsg = (role, content, extras = {}) => ({ id: String(++msgId), role, content, ...extras });

export default function AiCoachChatScreen({ navigation }) {
  const [messages, setMessages]       = useState([
    mkMsg("assistant", "Hey! I'm Coach, your AI fitness assistant. Before I build you a personalised workout plan, let me ask — do you have any injuries or physical limitations I should know about?"),
  ]);
  const [input, setInput]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [savingPlan, setSavingPlan]   = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => { fetchProfile(); }, []);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, [messages]);

  const fetchProfile = async () => {
    try {
      const r = await authFetch(`${BASE_URL}/api/users/profile`);
      if (r.ok) setUserProfile(await r.json());
    } catch { /* profile is optional context */ }
  };

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");

    const history = messages.map(m => ({
      role:    m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));
    setMessages(prev => [...prev, mkMsg("user", msg)]);
    setLoading(true);

    try {
      const r = await authFetch(`${BASE_URL}/api/coach/chat`, {
        method: "POST",
        body: JSON.stringify({
          message:             msg,
          userProfile,
          conversationHistory: history,
        }),
      });
      const json = await r.json();
      if (r.status === 429) {
        setMessages(prev => [
          ...prev,
          mkMsg("assistant", json.message || "You've reached your daily message limit. Come back tomorrow!"),
        ]);
        return;
      }
      if (!r.ok || !json.success) throw new Error(json.message || "Coach error");

      setMessages(prev => [
        ...prev,
        mkMsg("assistant", json.content, { type: json.type, plan: json.plan }),
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        mkMsg("assistant", "Sorry, I couldn't reach the server. Please try again."),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const generatePlan = () => {
    send("Generate my personalised workout plan based on our conversation");
  };

  const saveWorkout = async (plan) => {
    if (savingPlan) return;
    setSavingPlan(true);
    try {
      const r = await authFetch(`${BASE_URL}/api/coach/save-workout`, {
        method: "POST",
        body: JSON.stringify({ plan }),
      });
      const json = await r.json();
      if (!r.ok || !json.success) throw new Error(json.message || "Save failed");
      Alert.alert("Saved!", "Workout plan added to your library.", [
        {
          text: "View Plan",
          onPress: () => navigation.navigate("Tabs", {
            screen: "WorkoutLog",
            params: { openTab: "plan" },
          }),
        },
        { text: "OK", style: "cancel" },
      ]);
    } catch (err) {
      Alert.alert("Error", err.message || "Could not save workout.");
    } finally {
      setSavingPlan(false);
    }
  };

  return (
    <SafeAreaView style={s.container} edges={["top"]}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Feather name="arrow-left" size={20} color={WHITE} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <View style={s.headerAvatar}>
            <MaterialCommunityIcons name="robot-outline" size={16} color={GREEN} />
          </View>
          <View>
            <Text style={s.headerTitle}>AI Coach</Text>
            <Text style={s.headerSub}>Powered by Llama 4</Text>
          </View>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map(msg => (
            <Bubble key={msg.id} msg={msg} onSave={saveWorkout} saving={savingPlan} />
          ))}

          {loading && (
            <View style={[s.bubbleRow, s.bubbleRowAi]}>
              <View style={s.coachAvatar}>
                <MaterialCommunityIcons name="robot-outline" size={14} color={GREEN} />
              </View>
              <View style={[s.bubble, s.bubbleAi, s.typingBubble]}>
                <ActivityIndicator color={GREEN} size="small" />
                <Text style={s.typingText}>Thinking…</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick suggestions — only shown until user starts chatting */}
        {messages.length <= 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.suggestScroll}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          >
            {SUGGESTIONS.map((sugg, i) => (
              <TouchableOpacity key={i} style={s.suggestChip} onPress={() => send(sugg)}>
                <Text style={s.suggestText}>{sugg}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Generate Workout Plan button */}
        <TouchableOpacity
          style={[s.generateBtn, loading && s.generateBtnDisabled]}
          onPress={generatePlan}
          disabled={loading}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="dumbbell" size={16} color="#000" />
          <Text style={s.generateBtnText}>Generate Workout Plan</Text>
          <Feather name="arrow-right" size={14} color="#000" />
        </TouchableOpacity>

        {/* Input bar */}
        <View style={s.inputBar}>
          <TextInput
            style={s.textInput}
            value={input}
            onChangeText={setInput}
            placeholder="Ask your coach…"
            placeholderTextColor={MUTED}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={() => send()}
          />
          <TouchableOpacity
            style={[s.sendBtn, (!input.trim() || loading) && s.sendBtnDisabled]}
            onPress={() => send()}
            disabled={!input.trim() || loading}
            activeOpacity={0.8}
          >
            <Feather name="send" size={18} color={(!input.trim() || loading) ? MUTED : "#000"} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: BG },

  header:         { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  backBtn:        { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerCenter:   { flexDirection: "row", alignItems: "center", gap: 10 },
  headerAvatar:   { width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(199,240,0,0.1)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(199,240,0,0.2)" },
  headerTitle:    { color: WHITE, fontSize: 14, fontWeight: "700" },
  headerSub:      { color: MUTED, fontSize: 11 },

  scroll:         { flex: 1 },
  scrollContent:  { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, gap: 12 },

  bubbleRow:      { flexDirection: "row", justifyContent: "flex-end" },
  bubbleRowAi:    { justifyContent: "flex-start", alignItems: "flex-end", gap: 8 },
  bubble:         { maxWidth: "80%", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleUser:     { backgroundColor: GREEN, borderBottomRightRadius: 4 },
  bubbleAi:       { backgroundColor: CARD, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: BORDER },
  bubbleTextUser: { color: "#000", fontSize: 14, fontWeight: "500" },
  bubbleTextAi:   { color: WHITE, fontSize: 14, lineHeight: 20 },
  coachAvatar:    { width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(199,240,0,0.08)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(199,240,0,0.15)", marginBottom: 4 },
  typingBubble:   { flexDirection: "row", alignItems: "center", gap: 8 },
  typingText:     { color: MUTED, fontSize: 13 },

  /* Workout plan card */
  planCard:       { backgroundColor: CARD, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: "rgba(199,240,0,0.2)", gap: 12, maxWidth: "95%" },
  planHeader:     { flexDirection: "row", alignItems: "center", gap: 8 },
  planTitle:      { color: WHITE, fontSize: 15, fontWeight: "700", flex: 1 },
  planGoalRow:    { flexDirection: "row", alignItems: "center", gap: 6 },
  planGoalText:   { color: ORANGE, fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
  planDays:       { gap: 6 },
  dayBlock:       { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: BORDER },
  dayHeader:      { flexDirection: "row", alignItems: "center", gap: 10, padding: 10 },
  dayNumBadge:    { width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(199,240,0,0.15)", alignItems: "center", justifyContent: "center" },
  dayNumText:     { color: GREEN, fontSize: 11, fontWeight: "700" },
  dayFocus:       { color: WHITE, fontSize: 13, fontWeight: "600", flex: 1 },
  exerciseList:   { paddingHorizontal: 10, paddingBottom: 10, gap: 6 },
  exerciseRow:    { flexDirection: "row", alignItems: "center", gap: 8 },
  exDot:          { width: 5, height: 5, borderRadius: 3, backgroundColor: GREEN },
  exName:         { color: WHITE, fontSize: 12, flex: 1 },
  exMeta:         { color: BLUE, fontSize: 11, fontWeight: "600" },
  exRest:         { color: MUTED, fontSize: 11 },
  planNotes:      { color: MUTED, fontSize: 12, lineHeight: 17, fontStyle: "italic" },
  saveBtn:        { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: GREEN, borderRadius: 14, paddingVertical: 10 },
  saveBtnDisabled:{ opacity: 0.5 },
  saveBtnText:    { color: "#000", fontSize: 13, fontWeight: "700" },

  suggestScroll:  { maxHeight: 44, marginBottom: 4 },
  suggestChip:    { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: CARD, borderRadius: 20, borderWidth: 1, borderColor: BORDER },
  suggestText:    { color: WHITE, fontSize: 12 },

  generateBtn:         { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: GREEN, marginHorizontal: 16, marginBottom: 8, borderRadius: 16, paddingVertical: 13 },
  generateBtnDisabled: { opacity: 0.45 },
  generateBtnText:     { color: "#000", fontSize: 14, fontWeight: "700" },

  inputBar:       { flexDirection: "row", alignItems: "flex-end", gap: 10, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16, borderTopWidth: 1, borderTopColor: BORDER, backgroundColor: BG },
  textInput:      { flex: 1, backgroundColor: CARD, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, color: WHITE, fontSize: 14, maxHeight: 100, borderWidth: 1, borderColor: BORDER },
  sendBtn:        { width: 42, height: 42, borderRadius: 21, backgroundColor: GREEN, alignItems: "center", justifyContent: "center" },
  sendBtnDisabled:{ backgroundColor: CARD },
});
