import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { BASE_URL } from "../config";
import { authFetch } from "../utils/authFetch";

const GREEN  = "#C7F000";
const BG     = "#000000";
const CARD   = "#1A1A1A";
const MUTED  = "#888888";
const WHITE  = "#FFFFFF";

const FILTERS = ["All", "Announcements"];

export default function NotificationsScreen({ navigation }) {
  const [filter, setFilter]           = useState("All");
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    authFetch(`${BASE_URL}/api/user/announcements`)
      .then(r => r.json())
      .then(data => setAnnouncements(Array.isArray(data) ? data : []))
      .catch(() => setAnnouncements([]))
      .finally(() => setLoading(false));
  }, []);

  const visible = filter === "All"
    ? announcements
    : announcements;

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={20} color={WHITE} />
        </TouchableOpacity>
        <Text style={s.title}>Notifications</Text>
      </View>

      {/* Filter pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filtersRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[s.filterPill, filter === f && s.filterPillActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[s.filterText, filter === f && s.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color={GREEN} style={{ marginTop: 40 }} />
        ) : visible.length === 0 ? (
          <View style={s.empty}>
            <View style={s.emptyIconWrap}>
              <Feather name="bell" size={28} color="#555" />
            </View>
            <Text style={s.emptyText}>No notifications yet</Text>
          </View>
        ) : (
          visible.map(n => (
            <View key={n._id} style={[s.announcementCard, n.priority === "high" && s.cardUnread]}>
              <View style={s.announcementBanner}>
                <MaterialCommunityIcons name="bullhorn-outline" size={22} color={GREEN} />
                {n.priority === "high" && <View style={s.unreadDot} />}
              </View>
              <View style={s.cardBody}>
                <Text style={s.cardTitle}>{n.title}</Text>
                {!!n.body && <Text style={s.cardBodyText}>{n.body}</Text>}
                <Text style={s.cardTime}>{n.date}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  header:   { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  backBtn:  { width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.07)", alignItems: "center", justifyContent: "center" },
  title:    { color: WHITE, fontSize: 18, fontWeight: "700" },

  filtersRow:       { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  filterPill:       { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.07)" },
  filterPillActive: { backgroundColor: GREEN },
  filterText:       { color: MUTED, fontSize: 13, fontWeight: "500" },
  filterTextActive: { color: "#000", fontWeight: "700" },

  list:  { paddingHorizontal: 16, paddingBottom: 40, gap: 12 },
  empty: { alignItems: "center", marginTop: 60 },
  emptyIconWrap: { marginBottom: 10 },
  emptyText:     { color: "#555", fontSize: 14 },

  announcementCard:  { borderRadius: 20, overflow: "hidden", backgroundColor: CARD, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  cardUnread:        { borderColor: "rgba(200,255,0,0.15)" },
  announcementBanner:{ height: 60, backgroundColor: "#1A2400", flexDirection: "row", alignItems: "center", justifyContent: "center", position: "relative", paddingHorizontal: 12 },
  gymTag:            { position: "absolute", top: 8, right: 8, backgroundColor: "rgba(200,255,0,0.12)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  gymTagText:        { color: GREEN, fontSize: 10, fontWeight: "600" },
  unreadDot:         { position: "absolute", top: 8, left: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: GREEN },
  cardBody:          { padding: 14 },
  cardTitle:         { color: WHITE, fontSize: 14, fontWeight: "700", marginBottom: 4 },
  cardBodyText:      { color: MUTED, fontSize: 12, lineHeight: 18, marginBottom: 6 },
  cardTime:          { color: "#555", fontSize: 11 },

});
