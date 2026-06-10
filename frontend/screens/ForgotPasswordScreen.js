import React, { useState } from "react";
import {
  ActivityIndicator,
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
import { BASE_URL } from "../config";

const GREEN  = "#C7F000";
const BG     = "#000000";
const CARD   = "#1C1C1E";
const BORDER = "#2C2C2E";
const MUTED  = "#A1A1A6";
const WHITE  = "#FFFFFF";
const RED    = "#FF453A";

export default function ForgotPasswordScreen({ navigation }) {
  const [step, setStep]         = useState("request"); // "request" | "reset"
  const [email, setEmail]       = useState("");
  const [code, setCode]         = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [notice, setNotice]     = useState("");

  const requestCode = async () => {
    if (!email.trim()) { setError("Enter your email."); return; }
    setLoading(true); setError(""); setNotice("");
    try {
      const res = await fetch(`${BASE_URL}/api/users/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.message || "Something went wrong."); return; }
      // Always advance — the response is intentionally generic.
      setNotice("If that email is registered, a 6-digit code is on its way.");
      setStep("reset");
    } catch {
      setError("Network error. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async () => {
    if (!code.trim() || !password) { setError("Enter the code and a new password."); return; }
    setLoading(true); setError(""); setNotice("");
    try {
      const res = await fetch(`${BASE_URL}/api/users/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: code.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.message || "Could not reset password."); return; }
      navigation.replace("Login");
    } catch {
      setError("Network error. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          <TouchableOpacity style={s.backRow} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={20} color={WHITE} />
          </TouchableOpacity>

          <Text style={s.title}>Reset Password</Text>
          <Text style={s.subtitle}>
            {step === "request"
              ? "Enter your email and we'll send you a reset code."
              : "Enter the 6-digit code we sent and choose a new password."}
          </Text>

          {notice ? <Text style={s.noticeText}>{notice}</Text> : null}

          {step === "request" ? (
            <View style={s.form}>
              <Text style={s.label}>Email</Text>
              <TextInput
                style={s.input}
                value={email}
                onChangeText={t => { setEmail(t); setError(""); }}
                placeholder="you@email.com"
                placeholderTextColor="#555"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {error ? <Text style={s.errorText}>{error}</Text> : null}
              <TouchableOpacity style={s.primaryBtn} onPress={requestCode} disabled={loading} activeOpacity={0.8}>
                {loading ? <ActivityIndicator color="#000" /> : <Text style={s.primaryBtnText}>Send Code</Text>}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={s.form}>
              <Text style={s.label}>Reset Code</Text>
              <TextInput
                style={s.input}
                value={code}
                onChangeText={t => { setCode(t); setError(""); }}
                placeholder="123456"
                placeholderTextColor="#555"
                keyboardType="number-pad"
                maxLength={6}
              />
              <Text style={[s.label, { marginTop: 16 }]}>New Password</Text>
              <View style={s.inputWrap}>
                <TextInput
                  style={[s.input, { paddingRight: 48 }]}
                  value={password}
                  onChangeText={t => { setPassword(t); setError(""); }}
                  placeholder="At least 8 characters, 1 number"
                  placeholderTextColor="#555"
                  secureTextEntry={!showPass}
                />
                <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPass(v => !v)}>
                  <Feather name={showPass ? "eye-off" : "eye"} size={18} color={MUTED} />
                </TouchableOpacity>
              </View>
              {error ? <Text style={s.errorText}>{error}</Text> : null}
              <TouchableOpacity style={s.primaryBtn} onPress={submitReset} disabled={loading} activeOpacity={0.8}>
                {loading ? <ActivityIndicator color="#000" /> : <Text style={s.primaryBtnText}>Reset Password</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={s.resendBtn} onPress={requestCode} disabled={loading}>
                <Text style={s.resendText}>Didn't get a code? Resend</Text>
              </TouchableOpacity>
            </View>
          )}
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

  noticeText: { color: GREEN, fontSize: 13, marginBottom: 16, lineHeight: 18 },

  form:      { gap: 6 },
  label:     { color: MUTED, fontSize: 12, marginBottom: 6 },
  input:     { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 16, color: WHITE, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15 },
  inputWrap: { position: "relative" },
  eyeBtn:    { position: "absolute", right: 14, top: 0, bottom: 0, justifyContent: "center" },

  errorText: { color: RED, fontSize: 13, marginTop: 8 },

  primaryBtn:     { backgroundColor: GREEN, paddingVertical: 16, borderRadius: 16, alignItems: "center", marginTop: 20 },
  primaryBtnText: { color: "#000", fontSize: 15, fontWeight: "700" },

  resendBtn:  { alignItems: "center", paddingVertical: 14, marginTop: 4 },
  resendText: { color: MUTED, fontSize: 13, fontWeight: "600" },
});
