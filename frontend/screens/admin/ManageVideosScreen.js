import React, { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  Alert,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../../services/adminApi";

const GREEN  = "#C7F000";
const BG     = "#0D0D0D";
const CARD   = "#1A1A1A";
const BORDER = "#2A2A2A";
const MUTED  = "#888888";
const WHITE  = "#FFFFFF";
const RED    = "#FF3B30";
const EDIT_GREEN = "#1A3A00";

const CATEGORIES = ["All", "Chest", "Back", "Legs", "Arms"];
const FORM_CATS  = ["Chest", "Back", "Legs", "Arms"];

const extractYouTubeVideoId = (url) => {
  const trimmed = (url || "").trim();
  if (!trimmed) return null;
  const match = trimmed.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return match?.[1] ?? null;
};

const resolveThumbnailUri = (video) => {
  const thumbnail = (video.thumbnail || "").trim();
  if (thumbnail) {
    const tid = extractYouTubeVideoId(thumbnail);
    if (tid) return `https://img.youtube.com/vi/${tid}/hqdefault.jpg`;
    if (/^https?:\/\//i.test(thumbnail)) return thumbnail;
  }
  const yid = extractYouTubeVideoId(video.youtubeUrl || "");
  if (yid) return `https://img.youtube.com/vi/${yid}/hqdefault.jpg`;
  return null;
};

const BLANK_FORM = { title: "", description: "", category: "Chest", thumbnail: "", youtubeUrl: "" };

export default function ManageVideosScreen() {
  const [videos,           setVideos]           = useState([]);
  const [loading,          setLoading]          = useState(false);
  const [searchQuery,      setSearchQuery]      = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [modalVisible,     setModalVisible]     = useState(false);
  const [editingVideo,     setEditingVideo]     = useState(null);
  const [form,             setForm]             = useState(BLANK_FORM);

  const loadVideos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.videos.getAll();
      setVideos(Array.isArray(data.videos) ? data.videos : Array.isArray(data) ? data : []);
    } catch (e) {
      Alert.alert("Error", e.message || "Could not load videos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadVideos(); }, [loadVideos]);

  useFocusEffect(
    useCallback(() => {
      loadVideos();
    }, [loadVideos])
  );

  const openAdd = () => {
    setEditingVideo(null);
    setForm(BLANK_FORM);
    setModalVisible(true);
  };

  const openEdit = (video) => {
    setEditingVideo(video);
    setForm({
      title:      video.title       || "",
      description:video.description || "",
      category:   video.category    || "Chest",
      thumbnail:  video.thumbnail   || "",
      youtubeUrl: video.youtubeUrl  || "",
    });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingVideo(null);
    setForm(BLANK_FORM);
  };

  const handleSave = async () => {
    if (!form.title.trim())      return Alert.alert("Required", "Please enter a video title.");
    if (!form.youtubeUrl.trim()) return Alert.alert("Required", "Please enter the YouTube URL.");
    if (!form.description.trim()) return Alert.alert("Required", "Please enter a description.");
    const thumbnailVal = form.thumbnail.trim() || form.youtubeUrl.trim();
    const payload = {
      title:      form.title.trim(),
      description:form.description.trim(),
      category:   form.category || "Chest",
      thumbnail:  thumbnailVal,
      youtubeUrl: form.youtubeUrl.trim(),
    };
    try {
      if (editingVideo) {
        await api.videos.update(editingVideo._id, payload);
      } else {
        await api.videos.create(payload);
      }
      await loadVideos();
      closeModal();
    } catch (e) {
      Alert.alert("Error", e.message || "Could not save video.");
    }
  };

  const handleDelete = (video) => {
    Alert.alert("Delete Video", `Delete "${video.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await api.videos.delete(video._id);
            await loadVideos();
          } catch (e) {
            Alert.alert("Error", e.message || "Could not delete video.");
          }
        },
      },
    ]);
  };

  const filteredVideos = videos.filter((v) => {
    const catMatch = selectedCategory === "All" || v.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const searchMatch =
      (v.title || "").toLowerCase().includes(q) ||
      (v.description || "").toLowerCase().includes(q);
    return catMatch && searchMatch;
  });

  return (
    <View style={s.container}>
      {/* Add New Video Button */}
      <TouchableOpacity style={s.addBtn} onPress={openAdd}>
        <Text style={s.addBtnText}>⊕  Add New Video</Text>
      </TouchableOpacity>

      {/* Search */}
      <View style={s.searchBox}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput
          placeholder="Search videos..."
          placeholderTextColor={MUTED}
          style={s.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Text style={s.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.categoryRow}>
        {CATEGORIES.map((item) => (
          <TouchableOpacity
            key={item}
            style={[s.pill, selectedCategory === item && s.pillActive]}
            onPress={() => setSelectedCategory(item)}
          >
            <Text style={[s.pillText, selectedCategory === item && s.pillTextActive]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Video List */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {loading && <Text style={s.loadingText}>Loading videos...</Text>}

        {!loading && filteredVideos.length === 0 && (
          <View style={s.emptyContainer}>
            <Text style={s.emptyIcon}>🎬</Text>
            <Text style={s.emptyText}>No videos found</Text>
          </View>
        )}

        {filteredVideos.map((video) => {
          const thumbnailUri = resolveThumbnailUri(video);
          return (
            <View key={video._id} style={s.videoCard}>
              {/* Thumbnail */}
              <View style={s.thumbContainer}>
                {thumbnailUri ? (
                  <Image source={{ uri: thumbnailUri }} style={s.thumbnail} resizeMode="cover" />
                ) : (
                  <View style={[s.thumbnail, s.thumbFallback]}>
                    <Text style={{ fontSize: 36 }}>🎥</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={s.playBtn}
                  onPress={() => video.youtubeUrl && Linking.openURL(video.youtubeUrl)}
                  activeOpacity={0.8}
                >
                  <Text style={s.playIcon}>▶</Text>
                </TouchableOpacity>
              </View>

              {/* Info */}
              <View style={s.videoInfo}>
                <Text style={s.videoTitle}>{video.title}</Text>
                <Text style={s.videoDesc} numberOfLines={2}>{video.description}</Text>
                <View style={s.badge}>
                  <Text style={s.badgeText}>{video.category}</Text>
                </View>
              </View>

              {/* Edit / Delete */}
              <View style={s.cardActions}>
                <TouchableOpacity style={s.editBtn} onPress={() => openEdit(video)}>
                  <Text style={s.editBtnText}>✎  Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(video)}>
                  <Text style={s.deleteBtnText}>🗑  Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add / Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={false}>
        <View style={s.modalContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Modal Header */}
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{editingVideo ? "Edit Video" : "Add New Video"}</Text>
              <TouchableOpacity onPress={closeModal} style={s.closeBtn}>
                <Text style={s.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Video Title */}
            <Text style={s.label}>Video Title</Text>
            <TextInput
              style={s.input}
              placeholder="Enter video title"
              placeholderTextColor={MUTED}
              value={form.title}
              onChangeText={(v) => setForm((p) => ({ ...p, title: v }))}
            />

            {/* Description */}
            <Text style={s.label}>Description</Text>
            <TextInput
              style={[s.input, s.textArea]}
              placeholder="Enter description"
              placeholderTextColor={MUTED}
              multiline
              value={form.description}
              onChangeText={(v) => setForm((p) => ({ ...p, description: v }))}
            />

            {/* Category */}
            <Text style={s.label}>Category</Text>
            <View style={s.catRow}>
              {FORM_CATS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[s.catBtn, form.category === c && s.catBtnActive]}
                  onPress={() => setForm((p) => ({ ...p, category: c }))}
                >
                  <Text style={[s.catBtnText, form.category === c && s.catBtnTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Thumbnail URL */}
            <Text style={s.label}>Thumbnail Image URL</Text>
            <TextInput
              style={s.input}
              placeholder="https://..."
              placeholderTextColor={MUTED}
              autoCapitalize="none"
              value={form.thumbnail}
              onChangeText={(v) => setForm((p) => ({ ...p, thumbnail: v }))}
            />

            {/* YouTube URL */}
            <Text style={s.label}>YouTube URL (required)</Text>
            <TextInput
              style={s.input}
              placeholder="https://www.youtube.com/watch?v=..."
              placeholderTextColor={MUTED}
              autoCapitalize="none"
              value={form.youtubeUrl}
              onChangeText={(v) => setForm((p) => ({ ...p, youtubeUrl: v }))}
            />

            {/* Buttons */}
            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={closeModal}>
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
                <Text style={s.saveBtnText}>{editingVideo ? "Update Video" : "Add Video"}</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG, paddingHorizontal: 16, paddingTop: 12 },

  addBtn:     {
    backgroundColor: GREEN, borderRadius: 12, paddingVertical: 16,
    alignItems: "center", marginBottom: 14,
  },
  addBtnText: { color: "#111", fontSize: 16, fontWeight: "900" },

  searchBox:   {
    flexDirection: "row", backgroundColor: CARD, padding: 12,
    borderRadius: 12, marginBottom: 14, alignItems: "center",
    borderWidth: 1, borderColor: BORDER,
  },
  searchIcon:  { fontSize: 16, marginRight: 8 },
  searchInput: { color: WHITE, flex: 1, fontSize: 15 },
  clearIcon:   { color: MUTED, fontSize: 16, paddingLeft: 8 },

  categoryRow:    { marginBottom: 20 },
  pill:           {
    backgroundColor: CARD, paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: BORDER,
  },
  pillActive:     { backgroundColor: GREEN, borderColor: GREEN },
  pillText:       { color: WHITE, fontSize: 13, fontWeight: "700" },
  pillTextActive: { color: "#111", fontWeight: "800" },

  loadingText: { color: MUTED, textAlign: "center", marginTop: 30, fontSize: 14 },

  emptyContainer: { alignItems: "center", marginTop: 60 },
  emptyIcon:      { fontSize: 48, marginBottom: 12 },
  emptyText:      { color: WHITE, fontSize: 16, fontWeight: "600" },

  videoCard:    {
    backgroundColor: CARD, borderRadius: 16, marginBottom: 16,
    overflow: "hidden", borderWidth: 1, borderColor: BORDER,
  },
  thumbContainer: { width: "100%", height: 200, position: "relative" },
  thumbnail:      { width: "100%", height: "100%" },
  thumbFallback:  { justifyContent: "center", alignItems: "center", backgroundColor: "#111" },

  playBtn: {
    position: "absolute",
    top: "50%", left: "50%",
    marginTop: -28, marginLeft: -28,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: GREEN,
    justifyContent: "center", alignItems: "center",
  },
  playIcon: { color: "#111", fontSize: 20, fontWeight: "900", marginLeft: 4 },

  videoInfo:  { padding: 14 },
  videoTitle: { color: WHITE, fontSize: 16, fontWeight: "800", marginBottom: 6 },
  videoDesc:  { color: MUTED, fontSize: 13, marginBottom: 10, lineHeight: 18 },
  badge:      { alignSelf: "flex-start", backgroundColor: GREEN, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText:  { color: "#111", fontSize: 11, fontWeight: "800" },

  cardActions: {
    flexDirection: "row", borderTopWidth: 1, borderTopColor: BORDER,
  },
  editBtn:     {
    flex: 1, paddingVertical: 14, alignItems: "center",
    backgroundColor: EDIT_GREEN, borderRightWidth: 1, borderRightColor: BORDER,
  },
  editBtnText:   { color: GREEN, fontSize: 14, fontWeight: "800" },
  deleteBtn:     { flex: 1, paddingVertical: 14, alignItems: "center", backgroundColor: "#2A0000" },
  deleteBtnText: { color: RED, fontSize: 14, fontWeight: "800" },

  // Modal
  modalContainer: { flex: 1, backgroundColor: BG, paddingHorizontal: 20, paddingTop: 50 },
  modalHeader:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 28 },
  modalTitle:     { color: WHITE, fontSize: 22, fontWeight: "900" },
  closeBtn:       {
    width: 36, height: 36, borderRadius: 18, backgroundColor: CARD,
    justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: BORDER,
  },
  closeBtnText:   { color: WHITE, fontSize: 16, fontWeight: "700" },

  label:    { color: WHITE, fontSize: 14, fontWeight: "800", marginBottom: 8, marginTop: 16 },
  input:    {
    backgroundColor: CARD, borderRadius: 10, borderWidth: 1,
    borderColor: BORDER, color: WHITE, padding: 14, fontSize: 14,
  },
  textArea: { height: 100, textAlignVertical: "top" },

  catRow:         { flexDirection: "row", gap: 10, marginTop: 4 },
  catBtn:         {
    flex: 1, borderWidth: 1, borderColor: BORDER, borderRadius: 10,
    paddingVertical: 12, alignItems: "center", backgroundColor: CARD,
  },
  catBtnActive:     { backgroundColor: GREEN, borderColor: GREEN },
  catBtnText:       { color: WHITE, fontSize: 13, fontWeight: "700" },
  catBtnTextActive: { color: "#111", fontWeight: "800" },

  modalActions: { flexDirection: "row", gap: 12, marginTop: 28 },
  cancelBtn:    {
    flex: 1, paddingVertical: 16, borderRadius: 12, alignItems: "center",
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
  },
  cancelBtnText: { color: WHITE, fontSize: 15, fontWeight: "700" },
  saveBtn:       { flex: 1, paddingVertical: 16, borderRadius: 12, alignItems: "center", backgroundColor: GREEN },
  saveBtnText:   { color: "#111", fontSize: 15, fontWeight: "900" },
});