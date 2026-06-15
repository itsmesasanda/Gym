import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import { getUserEmail, getUserName, getUserGym } from "../utils/session";
import { authFetch } from "../utils/authFetch";
import { BASE_URL } from "../config";

const GREEN = "#C7F000";
const BG    = "#000000";
const WHITE = "#FFFFFF";
const MUTED = "#888888";

export default function QRCheckinScreen({ navigation }) {
  const email = getUserEmail() || "";
  const name  = getUserName() || email;
  const gym   = getUserGym();

  const [payload, setPayload] = useState(null);
  const [error, setError]     = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res  = await authFetch(`${BASE_URL}/api/users/checkin-token`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed");
        if (active) setPayload(data.payload);
      } catch {
        if (active) setError("Couldn't load your check-in code. Ask gym staff for a manual check-in.");
      }
    })();
    return () => { active = false; };
  }, []);

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={20} color={WHITE} />
        </TouchableOpacity>
        <Text style={s.title}>Check In</Text>
      </View>

      <View style={s.body}>
        <Text style={s.subtitle}>Show this QR at the gym entrance to be scanned</Text>

        <View style={s.qrCard}>
          <View style={s.qrBox}>
            {payload ? (
              <QRCode value={payload} size={216} backgroundColor="#FFFFFF" color="#000000" />
            ) : error ? (
              <Feather name="alert-triangle" size={44} color="#999" />
            ) : (
              <ActivityIndicator size="large" color="#000" />
            )}
          </View>
          <Text style={s.memberName}>{name}</Text>
          {!!email && <Text style={s.memberId}>{email}</Text>}
          {gym?.name ? <Text style={s.memberGym}>{gym.name}{gym.code ? ` · ${gym.code}` : ""}</Text> : null}
        </View>

        {error ? <Text style={s.errorText}>{error}</Text> : null}

        <Text style={s.manualNote}>This code is unique to you. Staff can also check you in manually.</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  header:   { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  backBtn:  { width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.07)", alignItems: "center", justifyContent: "center" },
  title:    { color: WHITE, fontSize: 18, fontWeight: "700" },

  body:     { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, gap: 20 },
  subtitle: { color: MUTED, fontSize: 14, textAlign: "center" },

  qrCard: {
    width: "100%", maxWidth: 300,
    backgroundColor: "rgba(28,28,30,0.9)",
    borderRadius: 24, padding: 24, alignItems: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
    shadowColor: GREEN, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08, shadowRadius: 40, elevation: 6,
  },
  qrBox:      { backgroundColor: WHITE, padding: 14, borderRadius: 16, marginBottom: 16, width: 244, height: 244, alignItems: "center", justifyContent: "center" },
  memberName: { color: WHITE, fontSize: 16, fontWeight: "700", marginBottom: 2 },
  memberId:   { color: MUTED, fontSize: 13, marginBottom: 4 },
  memberGym:  { color: GREEN, fontSize: 12, fontWeight: "600" },

  errorText:  { color: "#FF6B6B", fontSize: 13, textAlign: "center" },
  manualNote: { color: "#555", fontSize: 12, textAlign: "center" },
});
