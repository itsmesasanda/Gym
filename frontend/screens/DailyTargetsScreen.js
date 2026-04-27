import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import { setUserEmail } from "../utils/session";
import { BASE_URL } from "../config";

export default function DailyTargetsScreen({ navigation, route }) {

  const {
    email,
    goal,
    targetWeight,
    height,
    weight,
    activityLevel,
  } = route.params;

  setUserEmail(email);


  const age = 21; 
  const BMR = 10 * weight + 6.25 * height - 5 * age + 5;

  let activityMultiplier = 1.55;

  if (activityLevel === "low") activityMultiplier = 1.2;
  if (activityLevel === "moderate") activityMultiplier = 1.55;
  if (activityLevel === "high") activityMultiplier = 1.9;

  let calories = Math.round(BMR * activityMultiplier);

  if (goal === "muscle") calories += 300;
  if (goal === "fat") calories -= 300;

  const protein = Math.round(weight * 2);


  const handleSave = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/users/profile?email=${email}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            goal,
            targetWeight,
            height,
            weight,
            activityLevel,
            calories,
            protein,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      console.log("Profile updated:", data);
      console.log("EMAIL BEING PASSED:", email);

      navigation.replace("Tabs", {
  screen: "Dashboard",
  params: { email },
});

    } catch (error) {
      console.log("Update error:", error);
      alert("Failed to save profile");
    }
  };

  return (
    <View style={styles.container}>

      <Text style={styles.step}>Step 3 of 3</Text>
      <Text style={styles.title}>Your Daily Targets</Text>
      <Text style={styles.subtitle}>
        Calculated based on your data
      </Text>

      {/* MAIN CARD */}
      <View style={styles.mainCard}>
        <Text style={styles.mainText}>
          You should consume approximately
        </Text>

        <Text style={styles.calorieText}>
          {calories.toLocaleString()}
        </Text>

        <Text style={styles.kcalText}>kcal per day</Text>
      </View>

      {/* SMALL CARDS */}
      <View style={styles.row}>
        <View style={styles.smallCard}>
          <Text style={styles.cardTitle}>Daily Protein</Text>
          <Text style={styles.cardBig}>{protein}g</Text>
          <Text style={styles.greenText}>Protein target</Text>
        </View>

        <View style={styles.smallCard}>
          <Text style={styles.cardTitle}>Your Goal</Text>
          <Text style={styles.cardBig}>{goal}</Text>
          <Text style={styles.greenText}>{activityLevel}</Text>
        </View>
      </View>

      {/* SAVE BUTTON */}
      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSave}
      >
        <Text style={styles.saveText}>Save & Continue</Text>
      </TouchableOpacity>

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

  step: {
    color: "#C7F000",
    marginBottom: 5,
  },

  title: {
    color: "white",
    fontSize: 26,
    fontWeight: "bold",
  },

  subtitle: {
    color: "#aaa",
    marginBottom: 30,
  },

  mainCard: {
    backgroundColor: "#111",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    marginBottom: 20,
  },

  mainText: {
    color: "#aaa",
    marginBottom: 10,
  },

  calorieText: {
    fontSize: 40,
    color: "white",
    fontWeight: "bold",
  },

  kcalText: {
    color: "#C7F000",
    marginTop: 5,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },

  smallCard: {
    backgroundColor: "#111",
    padding: 20,
    borderRadius: 15,
    width: "48%",
  },

  cardTitle: {
    color: "#aaa",
  },

  cardBig: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
    marginVertical: 5,
  },

  greenText: {
    color: "#C7F000",
  },

  saveButton: {
    backgroundColor: "#C7F000",
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
  },

  saveText: {
    fontWeight: "bold",
    color: "#000",
  },
});