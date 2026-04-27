import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MENU_WIDTH = SCREEN_WIDTH * 0.75;

const GREEN  = "#C7F000";
const BG     = "#0D0D0D";
const CARD   = "#1A1A1A";
const BORDER = "#2A2A2A";
const MUTED  = "#888888";
const WHITE  = "#FFFFFF";
const RED    = "#FF3B30";

const menuItems = [
  { key: "profile",      label: "Profile",       icon: "P" },
  { key: "calories",     label: "Calorie Log",   icon: "C" },
  { key: "videos",       label: "Video Library",  icon: "V" },
];

export default function SlideMenu({ visible, onClose, onNavigate, onLogout, userName }) {
  const slideAnim = useRef(new Animated.Value(-MENU_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -MENU_WIDTH, duration: 200, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={s.overlay}>
        <Animated.View style={[s.backdrop, { opacity: fadeAnim }]}>
          <TouchableOpacity style={s.backdropTouch} onPress={onClose} activeOpacity={1} />
        </Animated.View>

        <Animated.View style={[s.menu, { transform: [{ translateX: slideAnim }] }]}>
          <SafeAreaView style={s.menuInner}>
            <View style={s.menuHeader}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{(userName || "U")[0].toUpperCase()}</Text>
              </View>
              <Text style={s.userName}>{userName || "User"}</Text>
              <Text style={s.userLabel}>OXY GYM Member</Text>
            </View>

            <View style={s.divider} />

            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={s.menuItem}
                onPress={() => { onClose(); onNavigate(item.key); }}
                activeOpacity={0.7}
              >
                <View style={s.iconCircle}>
                  <Text style={s.iconText}>{item.icon}</Text>
                </View>
                <Text style={s.menuLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}

            <View style={s.spacer} />
            <View style={s.divider} />

            <TouchableOpacity
              style={s.menuItem}
              onPress={() => { onClose(); onLogout(); }}
              activeOpacity={0.7}
            >
              <View style={[s.iconCircle, { backgroundColor: "rgba(255, 59, 48, 0.12)" }]}>
                <Text style={[s.iconText, { color: RED }]}>X</Text>
              </View>
              <Text style={[s.menuLabel, { color: RED }]}>Logout</Text>
            </TouchableOpacity>

            <View style={{ height: 20 }} />
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, flexDirection: "row" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },
  backdropTouch: { flex: 1 },
  menu: {
    position: "absolute", top: 0, bottom: 0, left: 0,
    width: MENU_WIDTH, backgroundColor: BG,
    borderRightWidth: 1, borderRightColor: BORDER,
    elevation: 10,
    shadowColor: "#000", shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.4, shadowRadius: 12,
  },
  menuInner: { flex: 1, paddingTop: 20 },
  menuHeader: { padding: 24, paddingTop: 12 },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: GREEN, alignItems: "center", justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: { color: "#000", fontSize: 20, fontWeight: "900" },
  userName: { color: WHITE, fontSize: 18, fontWeight: "800", marginBottom: 2 },
  userLabel: { color: MUTED, fontSize: 12 },
  divider: { height: 1, backgroundColor: BORDER, marginHorizontal: 16, marginVertical: 8 },
  menuItem: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 12, paddingHorizontal: 24, gap: 14,
  },
  iconCircle: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: "rgba(199, 240, 0, 0.08)",
    alignItems: "center", justifyContent: "center",
  },
  iconText: { color: GREEN, fontSize: 13, fontWeight: "800" },
  menuLabel: { color: WHITE, fontSize: 14, fontWeight: "600" },
  spacer: { flex: 1 },
});
