import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { clearUserEmail, getUserEmail, getUserToken } from "../utils/session";
import { BASE_URL } from "../config";
import { fetchWithTimeout, parseJsonSafe } from "../services/http";

const GREEN = "#C7F000";
const BG    = "#000000";
const CARD  = "rgba(28,28,30,0.95)";
const MUTED = "#888888";
const WHITE = "#FFFFFF";
const DIM   = "#444444";
const RED   = "#FF4444";
const BLUE  = "#4FC3F7";

function SectionHeader({ title, action, onAction }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionLabel}>{title}</Text>
      {action ? (
        <TouchableOpacity onPress={onAction}>
          <Text style={s.sectionAction}>{action}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function InfoRow({ label, value, color = MUTED }) {
  return (
    <View style={s.infoRow}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={[s.infoValue, { color }]}>{value}</Text>
    </View>
  );
}

export default function ProfileScreen({ navigation }) {
  const [user, setUser]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [editMode, setEditMode] = useState(null);
  const [showDeactivate, setDeactivate] = useState(false);

  const [contactForm, setContact] = useState({ name: "", email: "" });
  const [bodyForm, setBody]       = useState({ height: "", weight: "", activityLevel: "", goal: "" });

  const email = getUserEmail();

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError("");
      const token = getUserToken();
      const url = token
        ? `${BASE_URL}/api/users/profile`
        : `${BASE_URL}/api/users/profile?email=${encodeURIComponent(email)}`;
      const res  = await fetchWithTimeout(url, token ? { headers: { Authorization: `Bearer ${token}` } } : {});
      const data = await parseJsonSafe(res);
      if (!res.ok) { setError(data?.message || "Could not load profile."); return; }
      setUser(data);
      setContact({ name: data.name || "", email: data.email || "" });
      setBody({ height: String(data.height || ""), weight: String(data.weight || ""), activityLevel: data.activityLevel || "", goal: data.goal || "" });
    } catch (e) {
      setError(e.message || "Could not load profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (email) fetchUser(); else { setError("No signed-in user."); setLoading(false); } }, [email]);

  const saveContact = async () => {
    try {
      const token = getUserToken();
      const url = token ? `${BASE_URL}/api/users/profile` : `${BASE_URL}/api/users/profile?email=${encodeURIComponent(email)}`;
      const res = await fetchWithTimeout(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ name: contactForm.name, email: contactForm.email }),
      });
      const data = await parseJsonSafe(res);
      if (!res.ok) { Alert.alert("Error", data?.message || "Update failed"); return; }
      setUser(data); setEditMode(null);
    } catch { Alert.alert("Error", "Network error"); }
  };

  const saveBody = async () => {
    try {
      const token = getUserToken();
      const url = token ? `${BASE_URL}/api/users/profile` : `${BASE_URL}/api/users/profile?email=${encodeURIComponent(email)}`;
      const res = await fetchWithTimeout(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ height: Number(bodyForm.height), weight: Number(bodyForm.weight), activityLevel: bodyForm.activityLevel, goal: bodyForm.goal }),
      });
      const data = await parseJsonSafe(res);
      if (!res.ok) { Alert.alert("Error", data?.message || "Update failed"); return; }
      setUser(data); setEditMode(null);
    } catch { Alert.alert("Error", "Network error"); }
  };

  const handleLogout = () => {
    clearUserEmail();
    navigation.replace("Login");
  };

  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const goalLabel = { muscle_gain: "Muscle Gain", fat_loss: "Fat Loss", maintenance: "Maintenance" }[user?.goal] || user?.goal || "—";
  const actLabel  = { low: "Low (1–2x/wk)", moderate: "Moderate (3–4x/wk)", high: "High (5+/wk)" }[user?.activityLevel] || user?.activityLevel || "—";

  if (loading) return <View style={s.center}><Text style={s.loadingText}>Loading…</Text></View>;
  if (error || !user) return (
    <View style={s.center}>
      <Text style={{ color: RED, marginBottom: 12 }}>{error || "Could not load profile."}</Text>
      <TouchableOpacity style={s.retryBtn} onPress={fetchUser}>
        <Text style={s.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>

        {/* ── Header ── */}
        <LinearGradient
          colors={["rgba(200,255,0,0.08)", "transparent"]}
          style={s.headerGradient}
        >
          <Text style={s.screenTitle}>Profile</Text>
          <View style={s.avatarWrap}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{initials}</Text>
            </View>
            <Text style={s.name}>{user.name}</Text>
            <Text style={s.emailText}>{user.email}</Text>
          </View>
          <View style={s.statsRow}>
            {[
              { label: "Height", value: `${user.height || "—"}cm` },
              { label: "Weight", value: `${user.weight || "—"}kg` },
              { label: "Goal",   value: goalLabel },
            ].map(({ label, value }) => (
              <View key={label} style={s.statCard}>
                <Text style={s.statValue}>{value}</Text>
                <Text style={s.statLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        <View style={s.content}>

          {/* ── Membership ── */}
          <View style={s.card}>
            <SectionHeader title="MEMBERSHIP" />
            <InfoRow label="Plan"         value="Base — Active" color={GREEN} />
            <InfoRow label="Member Since" value="Jan 2025" />
            <InfoRow label="Gym"          value="PowerFit Gym · PWR001" />
          </View>

          {/* ── Body & Activity ── */}
          <View style={s.card}>
            <SectionHeader
              title="BODY & ACTIVITY"
              action={editMode === "body" ? "Cancel" : "Edit"}
              onAction={() => setEditMode(editMode === "body" ? null : "body")}
            />
            {editMode === "body" ? (
              <View style={s.editForm}>
                <View style={s.editRow}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={s.editLabel}>Height (cm)</Text>
                    <TextInput style={s.editInput} value={bodyForm.height} onChangeText={t => setBody(f => ({ ...f, height: t }))} keyboardType="numeric" placeholderTextColor={DIM} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.editLabel}>Weight (kg)</Text>
                    <TextInput style={s.editInput} value={bodyForm.weight} onChangeText={t => setBody(f => ({ ...f, weight: t }))} keyboardType="numeric" placeholderTextColor={DIM} />
                  </View>
                </View>
                <Text style={s.editLabel}>Activity Level</Text>
                <View style={s.pickerRow}>
                  {["low", "moderate", "high"].map(v => (
                    <TouchableOpacity
                      key={v}
                      onPress={() => setBody(f => ({ ...f, activityLevel: v }))}
                      style={[s.pickerBtn, bodyForm.activityLevel === v && s.pickerBtnActive]}
                    >
                      <Text style={[s.pickerBtnText, bodyForm.activityLevel === v && s.pickerBtnTextActive]}>
                        {v.charAt(0).toUpperCase() + v.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={s.editLabel}>Fitness Goal</Text>
                <View style={s.pickerRow}>
                  {[["muscle_gain", "Muscle"], ["fat_loss", "Fat Loss"], ["maintenance", "Maintain"]].map(([v, l]) => (
                    <TouchableOpacity
                      key={v}
                      onPress={() => setBody(f => ({ ...f, goal: v }))}
                      style={[s.pickerBtn, bodyForm.goal === v && s.pickerBtnActive]}
                    >
                      <Text style={[s.pickerBtnText, bodyForm.goal === v && s.pickerBtnTextActive]}>{l}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity style={s.saveBtn} onPress={saveBody}>
                  <Feather name="check" size={16} color="#000" />
                  <Text style={s.saveBtnText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <InfoRow label="Height"   value={`${user.height || "—"} cm`} color={BLUE} />
                <InfoRow label="Weight"   value={`${user.weight || "—"} kg`} color={BLUE} />
                <InfoRow label="Activity" value={actLabel} color={BLUE} />
                <InfoRow label="Goal"     value={goalLabel} color={BLUE} />
              </>
            )}
          </View>

          {/* ── Contact Info ── */}
          <View style={s.card}>
            <SectionHeader
              title="CONTACT INFO"
              action={editMode === "contact" ? "Cancel" : "Edit"}
              onAction={() => setEditMode(editMode === "contact" ? null : "contact")}
            />
            {editMode === "contact" ? (
              <View style={s.editForm}>
                <Text style={s.editLabel}>Full Name</Text>
                <TextInput style={s.editInput} value={contactForm.name} onChangeText={t => setContact(f => ({ ...f, name: t }))} placeholderTextColor={DIM} />
                <Text style={s.editLabel}>Email</Text>
                <TextInput style={s.editInput} value={contactForm.email} onChangeText={t => setContact(f => ({ ...f, email: t }))} keyboardType="email-address" autoCapitalize="none" placeholderTextColor={DIM} />
                <TouchableOpacity style={s.saveBtn} onPress={saveContact}>
                  <Feather name="check" size={16} color="#000" />
                  <Text style={s.saveBtnText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <InfoRow label="Name"  value={user.name} />
                <InfoRow label="Email" value={user.email} />
              </>
            )}
          </View>

          {/* ── Preferences ── */}
          <View style={s.card}>
            <SectionHeader title="PREFERENCES" />
            <TouchableOpacity style={s.prefRow} onPress={() => navigation.navigate("Notifications")}>
              <Feather name="bell" size={16} color={WHITE} style={s.prefIcon} />
              <Text style={s.prefLabel}>Notifications</Text>
              <Feather name="chevron-right" size={18} color={DIM} />
            </TouchableOpacity>
            <TouchableOpacity style={s.prefRow} onPress={() => navigation.navigate("Streaks")}>
              <MaterialCommunityIcons name="trophy-outline" size={16} color={WHITE} style={s.prefIcon} />
              <Text style={s.prefLabel}>Streaks & Milestones</Text>
              <Feather name="chevron-right" size={18} color={DIM} />
            </TouchableOpacity>
            <TouchableOpacity style={s.prefRow} onPress={() => navigation.navigate("BeginnerGuide")}>
              <Feather name="book-open" size={16} color={WHITE} style={s.prefIcon} />
              <Text style={s.prefLabel}>Beginner Guide</Text>
              <Feather name="chevron-right" size={18} color={DIM} />
            </TouchableOpacity>
          </View>

          {/* ── Sign Out ── */}
          <TouchableOpacity style={s.signOutBtn} onPress={handleLogout}>
            <Text style={s.signOutText}>Sign Out</Text>
          </TouchableOpacity>

          {/* ── Deactivate ── */}
          <TouchableOpacity style={s.deactivateBtn} onPress={() => setDeactivate(true)}>
            <Text style={s.deactivateText}>Deactivate Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Deactivate Modal ── */}
      {showDeactivate && (
        <View style={s.modalOverlay}>
          <View style={s.modal}>
            <View style={s.modalIcon}>
              <Feather name="alert-triangle" size={22} color={RED} />
            </View>
            <Text style={s.modalTitle}>Deactivate Account?</Text>
            <Text style={s.modalBody}>This cannot be undone. All your data will be permanently deleted.</Text>
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.modalCancel} onPress={() => setDeactivate(false)}>
                <Text style={s.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalConfirm} onPress={() => { setDeactivate(false); handleLogout(); }}>
                <Text style={s.modalConfirmText}>Deactivate</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: BG },
  center:      { flex: 1, backgroundColor: BG, alignItems: "center", justifyContent: "center", padding: 20 },
  loadingText: { color: WHITE },
  retryBtn:    { backgroundColor: CARD, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  retryText:   { color: GREEN, fontWeight: "600" },

  headerGradient: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  screenTitle:    { color: WHITE, fontSize: 18, fontWeight: "800", marginBottom: 16 },
  avatarWrap:     { alignItems: "center", marginBottom: 16 },
  avatar:         { width: 80, height: 80, borderRadius: 40, backgroundColor: GREEN, alignItems: "center", justifyContent: "center", marginBottom: 10, borderWidth: 3, borderColor: "rgba(200,255,0,0.3)" },
  avatarText:     { color: "#000", fontSize: 28, fontWeight: "900" },
  name:           { color: WHITE, fontSize: 18, fontWeight: "700", marginBottom: 2 },
  emailText:      { color: MUTED, fontSize: 13 },

  statsRow:  { flexDirection: "row", gap: 8 },
  statCard:  { flex: 1, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 16, padding: 12, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" },
  statValue: { color: WHITE, fontSize: 13, fontWeight: "700", marginBottom: 2 },
  statLabel: { color: "#666", fontSize: 10 },

  content: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },

  card:          { backgroundColor: CARD, borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  sectionLabel:  { color: "#666", fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  sectionAction: { color: GREEN, fontSize: 12, fontWeight: "600" },

  infoRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)" },
  infoLabel: { color: WHITE, fontSize: 14, fontWeight: "500" },
  infoValue: { fontSize: 13 },

  prefRow:   { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)" },
  prefIcon:  { marginRight: 12 },
  prefLabel: { flex: 1, color: WHITE, fontSize: 14 },

  editForm:  { padding: 16, gap: 10 },
  editRow:   { flexDirection: "row" },
  editLabel: { color: MUTED, fontSize: 12, marginBottom: 6 },
  editInput: { backgroundColor: "#111", borderWidth: 1, borderColor: "#2a2a2a", borderRadius: 12, color: WHITE, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, marginBottom: 8 },

  pickerRow:          { flexDirection: "row", gap: 8, marginBottom: 8 },
  pickerBtn:          { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: "#1c1c1e", borderWidth: 1, borderColor: "#2a2a2a", alignItems: "center" },
  pickerBtnActive:    { backgroundColor: "rgba(199,240,0,0.1)", borderColor: GREEN },
  pickerBtnText:      { color: MUTED, fontSize: 12 },
  pickerBtnTextActive:{ color: GREEN, fontWeight: "700" },

  saveBtn:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: GREEN, paddingVertical: 13, borderRadius: 14, marginTop: 4 },
  saveBtnText: { color: "#000", fontWeight: "700", fontSize: 14 },

  signOutBtn:     { backgroundColor: "transparent", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.12)", paddingVertical: 16, borderRadius: 20, alignItems: "center", marginTop: 4 },
  signOutText:    { color: WHITE, fontWeight: "600", fontSize: 14 },
  deactivateBtn:  { alignItems: "center", paddingVertical: 12 },
  deactivateText: { color: RED, fontSize: 13, fontWeight: "500" },

  modalOverlay: { position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.85)", alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  modal:        { width: "100%", backgroundColor: "#1A1A1A", borderRadius: 24, padding: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  modalIcon:    { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,68,68,0.15)", alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: 14 },
  modalTitle:   { color: WHITE, fontSize: 16, fontWeight: "700", textAlign: "center", marginBottom: 8 },
  modalBody:    { color: MUTED, fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 20 },
  modalBtns:    { flexDirection: "row", gap: 12 },
  modalCancel:  { flex: 1, backgroundColor: "#2a2a2a", paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  modalCancelText: { color: WHITE, fontWeight: "500" },
  modalConfirm: { flex: 1, backgroundColor: RED, paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  modalConfirmText: { color: WHITE, fontWeight: "700" },
});
