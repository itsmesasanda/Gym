import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Svg, { Rect } from "react-native-svg";
import { getUserEmail, getUserName } from "../utils/session";

const GREEN = "#C7F000";
const BG    = "#000000";
const WHITE = "#FFFFFF";
const MUTED = "#888888";

function QRCodeSVG({ value }) {
  const size = 21;
  const seed = value.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const pseudo = (i) => {
    const x = Math.sin(seed + i) * 10000;
    return x - Math.floor(x) > 0.45;
  };

  const cells = Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => {
      if ((r < 7 && c < 7) || (r < 7 && c >= size - 7) || (r >= size - 7 && c < 7)) {
        const dr = r < 7 ? r : r - (size - 7);
        const dc = c < 7 ? c : c >= size - 7 ? c - (size - 7) : c;
        const inOuter = dr === 0 || dr === 6 || dc === 0 || dc === 6;
        const inInner = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        return inOuter || inInner;
      }
      return pseudo(r * size + c);
    })
  );

  const cell  = 8;
  const total = size * cell;

  return (
    <Svg width={total} height={total} viewBox={`0 0 ${total} ${total}`}>
      {cells.map((row, r) =>
        row.map((filled, c) =>
          filled ? (
            <Rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell} height={cell} fill="#000" rx={1} />
          ) : null
        )
      )}
    </Svg>
  );
}

export default function QRCheckinScreen({ navigation }) {
  const email   = getUserEmail() || "";
  const name    = getUserName() || email;
  const today   = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  const qrValue = `PWR001-${email}-${new Date().toISOString().split("T")[0]}`;

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={20} color={WHITE} />
        </TouchableOpacity>
        <Text style={s.title}>Check In</Text>
      </View>

      <View style={s.body}>
        <Text style={s.subtitle}>Scan this QR code at the gym entrance</Text>

        {/* QR Glass Card */}
        <View style={s.qrCard}>
          <View style={s.qrBox}>
            <QRCodeSVG value={qrValue} />
          </View>
          <Text style={s.memberName}>{name}</Text>
          <Text style={s.memberId}>{email}</Text>
          <Text style={s.memberDate}>{today}</Text>
        </View>

        {/* Refresh pill */}
        <View style={s.refreshPill}>
          <Feather name="refresh-cw" size={12} color={MUTED} />
          <Text style={s.refreshText}>Refreshes daily at midnight</Text>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate("CheckinConfirmation")}>
          <Text style={s.troubleText}>Having trouble?</Text>
        </TouchableOpacity>

        <Text style={s.manualNote}>Show this screen to gym staff for manual check-in</Text>
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
  qrBox:      { backgroundColor: WHITE, padding: 14, borderRadius: 16, marginBottom: 16 },
  memberName: { color: WHITE, fontSize: 16, fontWeight: "700", marginBottom: 2 },
  memberId:   { color: MUTED, fontSize: 13, marginBottom: 4 },
  memberDate: { color: "#666", fontSize: 12 },

  refreshPill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  refreshText: { color: MUTED, fontSize: 12 },

  troubleText: { color: GREEN, fontSize: 14, fontWeight: "600" },
  manualNote:  { color: "#555", fontSize: 12, textAlign: "center" },
});
