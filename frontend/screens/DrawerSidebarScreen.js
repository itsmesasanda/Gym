import React from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { clearUserEmail, getUserEmail, getUserName } from "../utils/session";

const GREEN = "#C7F000";
const BG    = "rgba(14,14,14,0.97)";
const WHITE = "#FFFFFF";
const MUTED = "#888888";
const RED   = "#FF4444";

const SECTIONS = [
  {
    title: "GYM",
    items: [
      { icon: { lib: "MaterialIcons",          name: "qr-code"       }, label: "QR Check-in",    screen: "QRCheckin", soon: true },
      { icon: { lib: "MaterialCommunityIcons", name: "crown-outline" }, label: "My Membership",  screen: "Profile"     },
      { icon: { lib: "Feather",               name: "credit-card"   }, label: "Payment Status", screen: "Profile"     },
    ],
  },
  {
    title: "COMMUNITY",
    items: [
      { icon: { lib: "Feather", name: "user-check"     }, label: "My Trainer",   screen: "Profile"      },
      { icon: { lib: "Feather", name: "calendar"       }, label: "Book Session", screen: "Profile"      },
      { icon: { lib: "Feather", name: "message-circle" }, label: "Trainer Chat", screen: "AiCoachChat"  },
    ],
  },
  {
    title: "DISCOVER",
    items: [
      { icon: { lib: "Feather",               name: "video"          }, label: "Video Library",  screen: "VideoLib"      },
      { icon: { lib: "Feather",               name: "book-open"      }, label: "Beginner Guide", screen: "BeginnerGuide" },
      { icon: { lib: "MaterialCommunityIcons", name: "trophy-outline" }, label: "Streaks",        screen: "Streaks", soon: true },
    ],
  },
  {
    title: "ACCOUNT",
    items: [
      { icon: { lib: "Feather", name: "bell"        }, label: "Notifications", screen: "Notifications" },
      { icon: { lib: "Feather", name: "settings"    }, label: "Settings",      screen: "Profile"       },
      { icon: { lib: "Feather", name: "help-circle" }, label: "Help",          screen: "Profile"       },
    ],
  },
];

function ItemIcon({ lib, name, size = 16, color = WHITE }) {
  if (lib === "MaterialCommunityIcons") return <MaterialCommunityIcons name={name} size={size} color={color} />;
  if (lib === "MaterialIcons")          return <MaterialIcons          name={name} size={size} color={color} />;
  return <Feather name={name} size={size} color={color} />;
}

export default function DrawerSidebarScreen({ navigation }) {
  const email    = getUserEmail() || "";
  const name     = getUserName() || email;
  const initials = name ? name.slice(0, 2).toUpperCase() : "U";

  const go = (screen) => {
    navigation.goBack();
    if (screen === "Profile") {
      navigation.navigate("Tabs", { screen: "Profile" });
    } else {
      navigation.navigate(screen);
    }
  };

  // Features not yet wired to a backend — flagged as coming soon.
  const comingSoon = (label) =>
    Alert.alert(`${label} — coming soon`, "This feature isn't available yet. Stay tuned!");

  const handleLogout = () => {
    clearUserEmail();
    navigation.replace("Login");
  };

  return (
    <View style={s.overlay}>
      {/* ── Drawer Panel ── */}
      <SafeAreaView style={s.drawer} edges={["top", "bottom"]}>

        {/* Close */}
        <TouchableOpacity style={s.closeBtn} onPress={() => navigation.goBack()}>
          <Feather name="x" size={16} color={MUTED} />
        </TouchableOpacity>

        {/* Header */}
        <View style={s.drawerHeader}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <View>
            <Text style={s.memberName}>{name}</Text>
            <Text style={s.gymName}>{email}</Text>
          </View>
        </View>
        <View style={s.statusBadge}>
          <View style={s.statusDot} />
          <Text style={s.statusText}>Base Member · Active</Text>
        </View>

        {/* Sections */}
        <ScrollView style={s.sections} showsVerticalScrollIndicator={false}>
          {SECTIONS.map(section => (
            <View key={section.title} style={s.section}>
              <Text style={s.sectionTitle}>{section.title}</Text>
              {section.items.map(item => (
                <TouchableOpacity
                  key={item.label}
                  style={s.item}
                  onPress={() => (item.soon ? comingSoon(item.label) : go(item.screen))}
                  activeOpacity={0.7}
                >
                  <View style={s.itemIcon}>
                    <ItemIcon lib={item.icon.lib} name={item.icon.name} size={16} color={WHITE} />
                  </View>
                  <Text style={s.itemLabel}>{item.label}</Text>
                  {item.soon && (
                    <Text style={{ color: GREEN, fontSize: 10, fontWeight: "700", marginRight: 6 }}>
                      SOON
                    </Text>
                  )}
                  <Feather name="chevron-right" size={16} color="#333" />
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </ScrollView>

        {/* Sign Out */}
        <TouchableOpacity style={s.signOutBtn} onPress={handleLogout}>
          <Feather name="log-out" size={16} color={RED} />
          <Text style={s.signOutText}>Sign Out</Text>
        </TouchableOpacity>

      </SafeAreaView>

      {/* Tap outside to close */}
      <TouchableOpacity style={s.backdrop} onPress={() => navigation.goBack()} activeOpacity={1} />
    </View>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, flexDirection: "row", backgroundColor: "rgba(0,0,0,0.55)" },

  drawer:   { width: 300, backgroundColor: BG, borderRightWidth: 1, borderRightColor: "rgba(255,255,255,0.07)" },
  closeBtn: { alignSelf: "flex-end", margin: 16, width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" },

  drawerHeader: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  avatar:       { width: 56, height: 56, borderRadius: 28, backgroundColor: GREEN, alignItems: "center", justifyContent: "center" },
  avatarText:   { color: "#000", fontSize: 18, fontWeight: "900" },
  memberName:   { color: WHITE, fontSize: 16, fontWeight: "700" },
  gymName:      { color: MUTED, fontSize: 12, marginTop: 2 },

  statusBadge: { flexDirection: "row", alignItems: "center", gap: 6, marginHorizontal: 20, marginTop: 10, marginBottom: 4, alignSelf: "flex-start", backgroundColor: "rgba(200,255,0,0.1)", borderWidth: 1, borderColor: "rgba(200,255,0,0.2)", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  statusDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: GREEN },
  statusText:  { color: GREEN, fontSize: 11, fontWeight: "700" },

  sections:     { flex: 1, paddingTop: 8 },
  section:      { marginBottom: 4 },
  sectionTitle: { paddingHorizontal: 20, paddingVertical: 8, color: "#444", fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  item:         { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 13 },
  itemIcon:     { width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(200,255,0,0.08)", alignItems: "center", justifyContent: "center" },
  itemLabel:    { flex: 1, color: WHITE, fontSize: 14, fontWeight: "500" },

  signOutBtn:  { flexDirection: "row", alignItems: "center", gap: 12, marginHorizontal: 20, marginBottom: 12, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16, backgroundColor: "rgba(255,68,68,0.08)", borderWidth: 1, borderColor: "rgba(255,68,68,0.15)" },
  signOutText: { color: RED, fontSize: 14, fontWeight: "600" },

  backdrop: { flex: 1 },
});
