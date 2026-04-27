import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { BASE_URL } from "../config";

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      alert("Please fill all fields");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const response = await fetch(
        `${BASE_URL}/api/users/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      navigation.navigate("Goal", {
        email: data.email,
      });

    } catch (error) {
      console.log(error);
      alert("Registration failed");
    }
  };

  return (
    <View style={styles.container}>
      
      {/* Back Button */}
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.back}>← Back</Text>
      </TouchableOpacity>

      {/* Header */}
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>
        Start your fitness journey today
      </Text>

      {/* Inputs */}
      <Text style={styles.label}>Full Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter full name"
        placeholderTextColor="#777"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="you@email.com"
        placeholderTextColor="#777"
        value={email}
        onChangeText={setEmail}
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Min. 6 characters"
        placeholderTextColor="#777"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Text style={styles.label}>Confirm Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Re-enter password"
        placeholderTextColor="#777"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      {/* Create Button */}
      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Create Account</Text>
      </TouchableOpacity>

      {/* Footer */}
      <View style={styles.footerRow}>
        <Text style={styles.footerText}>
          Already have an account?
        </Text>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("Goal", {
              email: email,
            })
          }
        >
          <Text style={styles.signIn}> Sign in</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 20,
    justifyContent: "center",
  },

  back: {
    color: "#C7F000",
    marginBottom: 20,
    fontSize: 16,
  },

  title: {
    fontSize: 32,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 5,
  },

  subtitle: {
    color: "#777",
    marginBottom: 30,
  },

  label: {
    color: "#aaa",
    marginBottom: 5,
    marginTop: 10,
  },

  input: {
    backgroundColor: "#1a1a1a",
    padding: 15,
    borderRadius: 14,
    color: "#fff",
  },

  button: {
    backgroundColor: "#C7F000",
    padding: 18,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 30,
  },

  buttonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },

  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },

  footerText: {
    color: "#777",
  },

  signIn: {
    color: "#C7F000",
    fontWeight: "bold",
  },
});