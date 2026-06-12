import React, { useState } from "react";
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
import { Feather } from "@expo/vector-icons";
import { reportFeedback } from "../utils/report";
import { getUserEmail } from "../utils/session";

const GREEN  = "#C7F000";
const BG     = "#000000";
const CARD   = "#1C1C1E";
const BORDER = "#2C2C2E";
const MUTED  = "#A1A1A6";
const WHITE  = "#FFFFFF";

export default function ReportProblemScreen({ navigation }) {
  const [text, setText]       = useState("");
  const [sending, setSending] = useState(false);

  const submit = () => {
    const message = text.trim();
    if (message.length < 5) {
      Alert.alert("Tell us a bit more", "Please describe what happened (a sentence is fine).");
      return;
    }
    setSending(true);
    // Sends the note to Sentry with the user already attached via session context.
    reportFeedback(message, { email: getUserEmail() || "anonymous", platform: Platform.OS });
    setSending(false);
    Alert.alert("Thanks!", "Your report was sent. We'll look into it.", [
      { text: "OK", onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <SafeAreaView style={s.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          <TouchableOpacity style={s.backRow} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={20} color={WHITE} />
          </TouchableOpacity>

          <Text style={s.title}>Report a Problem</Text>
          <Text style={s.subtitle}>
            Tell us what went wrong or felt off. The more detail, the faster we can fix it.
          </Text>

          <TextInput
            style={s.input}
            value={text}
            onChangeText={setText}
            placeholder="e.g. I tapped 'AI Picks' and nothing happened…"
            placeholderTextColor="#555"
            multiline
            textAlignVertical="top"
            maxLength={1000}
          />

          <TouchableOpacity style={s.btn} onPress={submit} disabled={sending} activeOpacity={0.85}>
            {sending ? <ActivityIndicator color="#000" /> : <Text style={s.btnText}>Send Report</Text>}
          </TouchableOpacity>

          <View style={s.hintRow}>
            <Feather name="info" size={13} color={MUTED} />
            <Text style={s.hint}>
              We automatically include your account email and basic device info — no need to type them.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scroll:    { flexGrow: 1, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 32 },

  backRow:  { width: 40, height: 40, justifyContent: "center", marginBottom: 12 },
  title:    { color: WHITE, fontSize: 28, fontWeight: "700", marginBottom: 6 },
  subtitle: { color: MUTED, fontSize: 14, marginBottom: 20, lineHeight: 20 },

  input: {
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 16,
    color: WHITE, padding: 16, fontSize: 15, minHeight: 140, marginBottom: 20,
  },

  btn:     { backgroundColor: GREEN, paddingVertical: 16, borderRadius: 16, alignItems: "center" },
  btnText: { color: "#000", fontSize: 15, fontWeight: "700" },

  hintRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 16 },
  hint:    { color: MUTED, fontSize: 12, flex: 1, lineHeight: 17 },
});
