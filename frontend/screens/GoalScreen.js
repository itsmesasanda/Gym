import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";

export default function GoalScreen({ navigation, route }) {

  const [selectedGoal, setSelectedGoal] = useState("muscle");
  const [targetWeight, setTargetWeight] = useState("");

  const GoalOption = ({ id, title, subtitle }) => {
    const active = selectedGoal === id;

    return (
      <TouchableOpacity
        style={[
          styles.option,
          active && styles.optionActive,
        ]}
        onPress={() => setSelectedGoal(id)}
      >
        <View>
          <Text style={styles.optionTitle}>
            {title}
          </Text>
          <Text style={styles.optionSubtitle}>
            {subtitle}
          </Text>
        </View>

        <View style={active ? styles.radioActive : styles.radio} />
      </TouchableOpacity>
    );
  };

  const handleNext = () => {
    if (!targetWeight) {
      alert("Enter target weight");
      return;
    }

    navigation.navigate("Measurements", {
      email: route.params.email,
      goal: selectedGoal,
      targetWeight: Number(targetWeight),
    });
  };

  return (
    <View style={styles.container}>

      <Text style={styles.step}>Step 1 of 3</Text>
      <Text style={styles.title}>Let's Set Your Goal</Text>
      <Text style={styles.subtitle}>
        Choose what you want to achieve
      </Text>

      <GoalOption
        id="muscle"
        title="Muscle Gain"
        subtitle="Build strength & size"
      />

      <GoalOption
        id="fat"
        title="Fat Loss"
        subtitle="Lean out & get shredded"
      />

      <GoalOption
        id="maintenance"
        title="Maintenance"
        subtitle="Stay fit & healthy"
      />

      <Text style={styles.label}>Target Weight (kg)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={targetWeight}
        onChangeText={setTargetWeight}
        placeholder="Enter target weight"
        placeholderTextColor="#777"
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleNext}
      >
        <Text style={styles.buttonText}>Next →</Text>
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
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },

  subtitle: {
    color: "#777",
    marginBottom: 25,
  },

  option: {
    backgroundColor: "#1a1a1a",
    padding: 20,
    borderRadius: 20,
    marginBottom: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  optionActive: {
    borderColor: "#C7F000",
    borderWidth: 2,
    backgroundColor: "#162000",
  },

  optionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  optionSubtitle: {
    color: "#aaa",
    marginTop: 3,
  },

  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#333",
  },

  radioActive: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#C7F000",
  },

  label: {
    color: "#aaa",
    marginTop: 15,
  },

  input: {
    backgroundColor: "#1a1a1a",
    padding: 15,
    borderRadius: 14,
    color: "#fff",
    marginTop: 5,
  },

  button: {
    backgroundColor: "#C7F000",
    padding: 18,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 40,
  },

  buttonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },
});