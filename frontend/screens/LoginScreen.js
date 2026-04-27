import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";

import { setUserEmail } from "../utils/session";
import { BASE_URL } from "../config";

export default function LoginScreen({ navigation }) {

  // =========================
  // STATE
  // =========================
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // =========================
  // VIDEO PLAYER
  // =========================
  const player = useVideoPlayer(
    require("../assets/login.mp4"),
    (player) => {
      player.loop = true;
      player.muted = true;
      player.play();
    }
  );

  // =========================
  // LOGIN FUNCTION
  // =========================
  const handleLogin = async () => {

    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    try {
      const response = await fetch(
        `${BASE_URL}/api/users/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Login failed");
        return;
      }

      // 🔥 Store email globally
      setUserEmail(data.email);

      // 🔥 Navigate to main app
      navigation.replace("Tabs");

    } catch (error) {
      console.log("Login error:", error);
      alert("Network error. Check backend connection.");
    }
  };

  // =========================
  // UI (UNCHANGED)
  // =========================
  return (
    <View style={styles.container}>
      
      <VideoView
        style={styles.video}
        player={player}
        contentFit="cover"
        nativeControls={false}
      />

      <View style={styles.overlay} />

      <View style={styles.card}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>
          Sign in to continue your journey
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#aaa"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#aaa"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={styles.outlineButton}
          onPress={handleLogin}
        >
          <Text style={styles.outlineText}>Login</Text>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.line} />
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate("Register")}
        >
          <Text style={styles.primaryText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.adminButton}
          onPress={() => navigation.navigate("AdminLogin")}
        >
          <Text style={styles.adminText}>Admin Panel →</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

// =========================
// STYLES (UNCHANGED)
// =========================

const styles = StyleSheet.create({
  container: { flex: 1 },

  video: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },

  card: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },

  title: {
    fontSize: 30,
    color: "#ffffff",
    textAlign: "center",
    fontWeight: "bold",
  },

  subtitle: {
    fontSize: 12,
    color: "#ffffff",
    textAlign: "center",
    opacity: 0.6,
    marginBottom: 30,
  },

  input: {
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 15,
    borderRadius: 12,
    color: "white",
    marginBottom: 15,
  },

  primaryButton: {
    backgroundColor: "#C7F000",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },

  primaryText: {
    color: "#000",
    fontWeight: "bold",
  },

  outlineButton: {
    borderColor: "#C7F000",
    borderWidth: 2,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },

  outlineText: {
    color: "#ffffff",
    fontWeight: "bold",
  },

  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#444",
  },

  dividerText: {
    marginHorizontal: 10,
    color: "#aaa",
    fontSize: 14,
  },

  adminButton: {
    marginTop: 12,
    alignItems: "center",
    padding: 10,
  },

  adminText: {
    color: "#6366f1",
    fontSize: 13,
    fontWeight: "600",
  },
});