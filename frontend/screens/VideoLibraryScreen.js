import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Linking,
  StyleSheet,
} from "react-native";
import { BASE_URL } from "../config";

const GREEN  = "#C7F000";
const BG     = "#0D0D0D";
const CARD   = "#1A1A1A";
const BORDER = "#2A2A2A";
const MUTED  = "#888888";
const WHITE  = "#FFFFFF";

const CATEGORIES = ["All", "Chest", "Back", "Legs", "Arms"];

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

export default function VideoLibraryScreen() {
  const [videos,           setVideos]           = useState([]);
  const [searchQuery,      setSearchQuery]      = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading,          setLoading]          = useState(false);

  useEffect(() => { loadVideos(); }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/api/videos`);
      if (!response.ok) throw new Error("Failed to fetch videos");
      const data = await response.json();
      setVideos(Array.isArray(data.videos) ? data.videos : []);
    } catch (e) {
      Alert.alert("Error", e.message || "Could not load videos from server.");
    } finally {
      setLoading(false);
    }
  };

  const handlePlayVideo = (url) => {
    if (!url) return Alert.alert("No Link", "This video has no YouTube link yet.");
    Linking.openURL(url);
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
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Search Bar */}
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
              <Text style={[s.pillText, selectedCategory === item && s.pillTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading && (
          <Text style={s.loadingText}>Loading videos...</Text>
        )}

        {!loading && filteredVideos.length === 0 && (
          <View style={s.emptyContainer}>
            <Text style={s.emptyIcon}>🎬</Text>
            <Text style={s.emptyText}>No videos found</Text>
            <Text style={s.emptySubtext}>
              {videos.length === 0
                ? "Videos added by the admin will appear here."
                : "Try a different search or category."}
            </Text>
          </View>
        )}

        {filteredVideos.map((video) => {
          const thumbnailUri = resolveThumbnailUri(video);
          return (
            <View key={video._id} style={s.videoCard}>
              {/* Thumbnail with centered play button */}
              <View style={s.thumbnailContainer}>
                {thumbnailUri ? (
                  <Image source={{ uri: thumbnailUri }} style={s.thumbnail} resizeMode="cover" />
                ) : (
                  <View style={[s.thumbnail, s.thumbnailFallback]}>
                    <Text style={s.fallbackIcon}>🎥</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={s.playBtn}
                  onPress={() => handlePlayVideo(video.youtubeUrl)}
                  activeOpacity={0.8}
                >
                  <Text style={s.playIcon}>▶</Text>
                </TouchableOpacity>
              </View>

              {/* Info */}
              <View style={s.videoInfo}>
                <Text style={s.videoTitle}>{video.title}</Text>
                <Text style={s.videoDesc} numberOfLines={2}>
                  {video.description}
                </Text>
                <View style={s.badge}>
                  <Text style={s.badgeText}>{video.category}</Text>
                </View>
              </View>
            </View>
          );
        })}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: BG, paddingHorizontal: 16, paddingTop: 12 },

  searchBox:   {
    flexDirection: "row", backgroundColor: CARD, padding: 12,
    borderRadius: 12, marginBottom: 14, alignItems: "center",
    borderWidth: 1, borderColor: BORDER,
  },
  searchIcon:  { fontSize: 16, marginRight: 8 },
  searchInput: { color: WHITE, flex: 1, fontSize: 15 },
  clearIcon:   { color: MUTED, fontSize: 16, paddingLeft: 8 },

  categoryRow: { marginBottom: 20 },
  pill:        {
    backgroundColor: CARD, paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: BORDER,
  },
  pillActive:     { backgroundColor: GREEN, borderColor: GREEN },
  pillText:       { color: WHITE, fontSize: 13, fontWeight: "700" },
  pillTextActive: { color: "#111", fontWeight: "800" },

  loadingText: { color: MUTED, textAlign: "center", marginTop: 30, fontSize: 14 },

  emptyContainer: { alignItems: "center", marginTop: 60 },
  emptyIcon:      { fontSize: 48, marginBottom: 12 },
  emptyText:      { color: WHITE, fontSize: 16, fontWeight: "600", marginBottom: 6 },
  emptySubtext:   { color: MUTED, fontSize: 13, textAlign: "center", paddingHorizontal: 20 },

  videoCard:      { backgroundColor: CARD, borderRadius: 16, marginBottom: 20, overflow: "hidden", borderWidth: 1, borderColor: BORDER },

  thumbnailContainer: { width: "100%", height: 210, position: "relative" },
  thumbnail:          { width: "100%", height: "100%" },
  thumbnailFallback:  { justifyContent: "center", alignItems: "center", backgroundColor: "#111" },
  fallbackIcon:       { fontSize: 40 },

  playBtn: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -28,
    marginLeft: -28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: GREEN,
    justifyContent: "center",
    alignItems: "center",
  },
  playIcon: { color: "#111", fontSize: 20, fontWeight: "900", marginLeft: 4 },

  videoInfo:  { padding: 14 },
  videoTitle: { color: WHITE, fontSize: 16, fontWeight: "800", marginBottom: 6 },
  videoDesc:  { color: MUTED, fontSize: 13, marginBottom: 10, lineHeight: 18 },
  badge:      { alignSelf: "flex-start", backgroundColor: GREEN, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText:  { color: "#111", fontSize: 11, fontWeight: "800" },
});