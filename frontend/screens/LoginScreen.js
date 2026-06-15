import React, { useEffect, useState } from "react";
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
import { useVideoPlayer, VideoView } from "expo-video";
import { setUserEmail, setUserToken, setUserName, setUserGym } from "../utils/session";
import { BASE_URL } from "../config";

const GREEN  = "#C7F000";
const BG     = "#000000";
const CARD   = "#1C1C1E";
const BORDER = "#2C2C2E";
const MUTED  = "#A1A1A6";
const WHITE  = "#FFFFFF";
const RED    = "#FF453A";

// Module-scope so the asset is required once, not on every render.
const LOGIN_VIDEO = require("../assets/login.mp4");

export default function LoginScreen({ navigation }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");

  // Looping, muted background video (assets/login.mp4)
  const player = useVideoPlayer(LOGIN_VIDEO, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  // Backstop: autoplay in the setup callback can be missed while the asset is
  // still buffering. Re-trigger play() once the player reports it's ready.
  useEffect(() => {
    if (!player) return;
    const sub = player.addListener("statusChange", ({ status }) => {
      if (status === "readyToPlay") player.play();
    });
    player.play();
    return () => sub.remove();
  }, [player]);

  const handleLogin = async () => {
    if (!email || !password) { setError("Please fill in all fields."); return; }
    try {
      const res = await fetch(`${BASE_URL}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Login failed"); return; }
      setUserEmail(data.email);
      setUserToken(data.token || null);
      setUserName(data.name || null);
      setUserGym(data.gym || null); // auto-detected from the account
      navigation.replace("Tabs");
    } catch {
      setError("Network error. Check backend connection.");
    }
  };

  return (
    <View style={s.root}>
      {/* Full-screen background video + dark overlay for text legibility */}
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        contentFit="cover"
        nativeControls={false}
        pointerEvents="none"
      />
      <View style={s.overlay} pointerEvents="none" />

      <SafeAreaView style={s.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          <View style={s.body}>
            {/* Logo */}
            <View style={s.logoWrap}>
              <View style={s.logoBox}>
                <Feather name="zap" size={32} color="#000" />
              </View>
              <Text style={s.title}>Welcome back</Text>
              <Text style={s.subtitle}>Sign in to continue your journey</Text>
            </View>

            {/* Form */}
            <View style={s.form}>
              <View style={s.fieldWrap}>
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
              </View>
              <View style={s.fieldWrap}>
                <Text style={s.label}>Password</Text>
                <View style={s.inputWrap}>
                  <TextInput
                    style={[s.input, { paddingRight: 48 }]}
                    value={password}
                    onChangeText={t => { setPassword(t); setError(""); }}
                    placeholder="••••••••"
                    placeholderTextColor="#555"
                    secureTextEntry={!showPass}
                  />
                  <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPass(v => !v)}>
                    <Feather name={showPass ? "eye-off" : "eye"} size={18} color={MUTED} />
                  </TouchableOpacity>
                </View>
              </View>

              {error ? <Text style={s.errorText}>{error}</Text> : null}

              <TouchableOpacity style={s.primaryBtn} onPress={handleLogin} activeOpacity={0.8}>
                <Text style={s.primaryBtnText}>Sign In</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.forgotBtn} onPress={() => navigation.navigate("ForgotPassword")}>
                <Text style={s.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={s.footer}>
            <View style={s.dividerRow}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>or</Text>
              <View style={s.dividerLine} />
            </View>
            <TouchableOpacity style={s.outlineBtn} onPress={() => navigation.navigate("Register")} activeOpacity={0.8}>
              <Text style={s.outlineBtnText}>Get Started</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor: BG },
  // Darken the video so the form and text stay readable
  overlay:   { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },
  container: { flex: 1, backgroundColor: "transparent" },
  scroll:    { flexGrow: 1, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 32 },

  body:     { flex: 1, justifyContent: "center", paddingTop: 40 },
  logoWrap: { marginBottom: 40 },
  logoBox:  { width: 64, height: 64, borderRadius: 18, backgroundColor: GREEN, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  title:    { color: WHITE, fontSize: 30, fontWeight: "700", marginBottom: 4 },
  subtitle: { color: MUTED, fontSize: 15 },

  form:      { gap: 16 },
  fieldWrap: { gap: 6 },
  label:     { color: MUTED, fontSize: 12 },
  input:     { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 16, color: WHITE, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15 },
  inputWrap: { position: "relative" },
  eyeBtn:    { position: "absolute", right: 14, top: 0, bottom: 0, justifyContent: "center" },

  errorText: { color: RED, fontSize: 13 },

  primaryBtn:     { backgroundColor: GREEN, paddingVertical: 16, borderRadius: 16, alignItems: "center", marginTop: 4 },
  primaryBtnText: { color: "#000", fontSize: 15, fontWeight: "700" },
  forgotBtn:      { alignItems: "center", paddingVertical: 12 },
  forgotText:     { color: MUTED, fontSize: 13, fontWeight: "600" },

  footer:       { marginTop: 32 },
  dividerRow:   { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  dividerLine:  { flex: 1, height: 1, backgroundColor: BORDER },
  dividerText:  { color: MUTED, fontSize: 13 },
  outlineBtn:      { borderWidth: 1.5, borderColor: GREEN, paddingVertical: 16, borderRadius: 16, alignItems: "center", marginBottom: 12 },
  outlineBtnText:  { color: GREEN, fontSize: 15, fontWeight: "600" },
});
