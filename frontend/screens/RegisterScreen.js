import React, { useState } from "react";
import {
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
import { setUserEmail, setUserToken } from "../utils/session";
import { BASE_URL } from "../config";

const GREEN  = "#C7F000";
const BG     = "#000000";
const CARD   = "#1C1C1E";
const BORDER = "#2C2C2E";
const MUTED  = "#A1A1A6";
const WHITE  = "#FFFFFF";
const RED    = "#FF453A";

export default function RegisterScreen({ navigation }) {
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");

  const handleRegister = async () => {
    if (!name || !email || !password || !confirm) { setError("Please fill in all fields."); return; }
    if (password !== confirm)   { setError("Passwords do not match."); return; }
    if (password.length < 6)    { setError("Password must be at least 6 characters."); return; }
    try {
      const res = await fetch(`${BASE_URL}/api/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Registration failed"); return; }
      setUserEmail(data.email);
      setUserToken(data.token || null);
      navigation.navigate("Goal", { email: data.email });
    } catch {
      setError("Network error. Try again.");
    }
  };

  return (
    <SafeAreaView style={s.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={20} color={MUTED} />
            <Text style={s.backText}>Back</Text>
          </TouchableOpacity>

          <View style={s.logoWrap}>
            <View style={s.logoBox}>
              <Feather name="zap" size={24} color="#000" />
            </View>
            <Text style={s.title}>Create Account</Text>
            <Text style={s.subtitle}>Start your fitness journey today</Text>
          </View>

          <View style={s.form}>
            {[
              { label: "Full Name",         value: name,     setter: setName,     placeholder: "John Doe",            kb: "default",       secure: false },
              { label: "Email",             value: email,    setter: setEmail,    placeholder: "you@email.com",       kb: "email-address", secure: false },
              { label: "Password",          value: password, setter: setPassword, placeholder: "Min. 6 characters",   kb: "default",       secure: true  },
              { label: "Confirm Password",  value: confirm,  setter: setConfirm,  placeholder: "Re-enter password",   kb: "default",       secure: true  },
            ].map(({ label, value, setter, placeholder, kb, secure }, i) => (
              <View key={label} style={s.fieldWrap}>
                <Text style={s.label}>{label}</Text>
                <View style={s.inputWrap}>
                  <TextInput
                    style={[s.input, secure && { paddingRight: 48 }]}
                    value={value}
                    onChangeText={t => { setter(t); setError(""); }}
                    placeholder={placeholder}
                    placeholderTextColor="#555"
                    keyboardType={kb}
                    autoCapitalize={kb === "email-address" ? "none" : "words"}
                    secureTextEntry={secure && !showPass}
                  />
                  {secure && i === 2 && (
                    <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPass(v => !v)}>
                      <Feather name={showPass ? "eye-off" : "eye"} size={18} color={MUTED} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}

            {error ? <Text style={s.errorText}>{error}</Text> : null}

            <TouchableOpacity style={s.primaryBtn} onPress={handleRegister} activeOpacity={0.8}>
              <Text style={s.primaryBtnText}>Create Account</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={s.footerBtn} onPress={() => navigation.navigate("Login")}>
            <Text style={s.footerText}>Already have an account? <Text style={{ color: GREEN }}>Sign in</Text></Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: BG },
  scroll:     { flexGrow: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },

  backBtn:    { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 32 },
  backText:   { color: MUTED, fontSize: 14 },

  logoWrap:   { marginBottom: 32 },
  logoBox:    { width: 48, height: 48, borderRadius: 14, backgroundColor: GREEN, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  title:      { color: WHITE, fontSize: 30, fontWeight: "700", marginBottom: 4 },
  subtitle:   { color: MUTED, fontSize: 15 },

  form:       { gap: 14 },
  fieldWrap:  { gap: 6 },
  label:      { color: MUTED, fontSize: 12 },
  input:      { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 16, color: WHITE, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15 },
  inputWrap:  { position: "relative" },
  eyeBtn:     { position: "absolute", right: 14, top: 0, bottom: 0, justifyContent: "center" },

  errorText:  { color: RED, fontSize: 13 },
  primaryBtn: { backgroundColor: GREEN, paddingVertical: 16, borderRadius: 16, alignItems: "center", marginTop: 8 },
  primaryBtnText: { color: "#000", fontSize: 15, fontWeight: "700" },

  footerBtn:  { alignItems: "center", marginTop: 24 },
  footerText: { color: MUTED, fontSize: 13 },
});
