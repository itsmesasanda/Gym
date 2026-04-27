import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";

export default function MeasurementsScreen({ navigation, route }) {
  const { email, goal, targetWeight } = route.params ?? {};

  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [activity, setActivity] = useState("moderate");

  const handleNext = () => {
  if (!height || !weight) {
    alert("Enter height and weight");
    return;
  }

  navigation.navigate("DailyTargets", {
    email,
    goal,
    targetWeight,
    height: Number(height),
    weight: Number(weight),
    activityLevel: activity,
  });
};;

  return (
    <View style={styles.container}>
      <Text style={styles.step}>Step 2 of 3</Text>
      <Text style={styles.title}>Your Measurements</Text>

      <TextInput
        style={styles.input}
        placeholder="Height (cm)"
        keyboardType="numeric"
        placeholderTextColor="#777"
        value={height}
        onChangeText={setHeight}
      />

      <TextInput
        style={styles.input}
        placeholder="Weight (kg)"
        keyboardType="numeric"
        placeholderTextColor="#777"
        value={weight}
        onChangeText={setWeight}
      />

      <Text style={styles.label}>Activity Level</Text>

      <TouchableOpacity
        style={[
          styles.option,
          activity === "low" && styles.optionActive,
        ]}
        onPress={() => setActivity("low")}
      >
        <Text style={styles.optionText}>Low</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.option,
          activity === "moderate" && styles.optionActive,
        ]}
        onPress={() => setActivity("moderate")}
      >
        <Text style={styles.optionText}>Moderate</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.option,
          activity === "high" && styles.optionActive,
        ]}
        onPress={() => setActivity("high")}
      >
        <Text style={styles.optionText}>High</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>Next →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 20, justifyContent: "center" },
  step: { color: "#C7F000", marginBottom: 5 },
  title: { color: "#fff", fontSize: 28, marginBottom: 20 },
  input: {
    backgroundColor: "#1a1a1a",
    padding: 15,
    borderRadius: 14,
    color: "#fff",
    marginBottom: 15,
  },
  label: { color: "#aaa", marginBottom: 10 },
  option: {
    backgroundColor: "#1a1a1a",
    padding: 15,
    borderRadius: 20,
    marginBottom: 10,
  },
  optionActive: {
    borderColor: "#C7F000",
    borderWidth: 2,
    backgroundColor: "#162000",
  },
  optionText: { color: "#fff" },
  button: {
    backgroundColor: "#C7F000",
    padding: 18,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: { color: "#000", fontWeight: "bold" },
});