import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { clearUserEmail } from "../utils/session";

const GREEN = "#C7F000";
const BG    = "#000000";
const WHITE = "#FFFFFF";
const MUTED = "#888888";
const RED   = "#FF4444";

export default function AccessLockedScreen({ navigation }) {
  const handleLogout = () => {
    clearUserEmail();
    navigation.replace("Login");
  };

  return (
    <SafeAreaView style={s.container} edges={["top", "bottom"]}>
      <View style={s.body}>

        {/* Lock icon */}
        <View style={s.lockCircle}>
          <Feather name="lock" size={36} color={RED} />
        </View>

        <Text style={s.title}>Access Suspended</Text>
        <Text style={s.bodyText}>
          Your gym membership payment is overdue. Please settle your balance to regain full access.
        </Text>
        <Text style={s.overdueText}>3 days overdue</Text>

        <TouchableOpacity style={s.contactBtn}>
          <Text style={s.contactBtnText}>Contact Gym</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.signOutBtn} onPress={handleLogout}>
          <Text style={s.signOutText}>Sign Out</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  body:      { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 14 },

  lockCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: "rgba(255,68,68,0.1)",
    borderWidth: 1.5, borderColor: "rgba(255,68,68,0.3)",
    alignItems: "center", justifyContent: "center",
    shadowColor: RED, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25, shadowRadius: 30, elevation: 6,
    marginBottom: 8,
  },
  title:       { color: WHITE, fontSize: 24, fontWeight: "800", textAlign: "center" },
  bodyText:    { color: MUTED, fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 4 },
  overdueText: { color: RED, fontSize: 14, fontWeight: "600", marginBottom: 8 },

  contactBtn:     { width: "100%", paddingVertical: 16, borderRadius: 20, backgroundColor: GREEN, alignItems: "center" },
  contactBtnText: { color: "#000", fontSize: 15, fontWeight: "700" },
  signOutBtn:     { width: "100%", paddingVertical: 16, borderRadius: 20, backgroundColor: "transparent", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.12)", alignItems: "center" },
  signOutText:    { color: WHITE, fontSize: 15, fontWeight: "600" },
});
