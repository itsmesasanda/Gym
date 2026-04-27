import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useAdminAuth } from "../../context/AdminAuthContext";
import { api } from "../../services/adminApi";

export default function AdminDashboardScreen({ navigation }) {
  const { admin, logout } = useAdminAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const loadSummary = useCallback(async () => {
    try {
      const [reportSummary, mealLogSummary] = await Promise.all([
        api.reports.getSummary(),
        api.mealLogs.getSummary(),
      ]);
      setSummary({ ...reportSummary, mealLogSummary });
    } catch (err) {
      console.log("Admin summary error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useFocusEffect(
    useCallback(() => {
      loadSummary();
    }, [loadSummary])
  );
      try {
        const [reportSummary, mealLogSummary] = await Promise.all([
          api.reports.getSummary(),
          api.mealLogs.getSummary(),
        ]);
        setSummary({ ...reportSummary, mealLogSummary });
      } catch (err) {
        console.log("Admin summary error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, [];

  const handleLogout = async () => {
    await logout();
    navigation.replace("AdminLogin");
  };

  const mealLogs = summary?.mealLogSummary?.allTime || {};

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Admin</Text>
          <Text style={styles.subtitle}>{admin?.email}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#6366f1" />
      ) : (
        <View style={styles.grid}>
          <Metric title="Users" value={summary?.users || summary?.totalUsers || 0} />
          <Metric title="Meals" value={summary?.meals || summary?.totalMeals || 0} />
          <Metric title="Workouts" value={summary?.workouts || summary?.totalWorkouts || 0} />
          <Metric title="Calorie Logs" value={mealLogs.mealCount || 0} />
        </View>
      )}

      <Text style={styles.sectionTitle}>Manage</Text>
      {[
        ["ManageUsers", "Users"],
        ["ManageMeals", "Meals"],
        ["CalorieLogs", "Calorie Logs"],
        ["ManageWorkouts", "Workouts"],
        ["ManageVideos", "Videos"],
        ["Reports", "Reports"],
      ].map(([route, label]) => (
        <TouchableOpacity key={route} style={styles.link} onPress={() => navigation.navigate(route)}>
          <Text style={styles.linkText}>{label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function Metric({ title, value }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricTitle}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
  },
  content: {
    padding: 18,
    paddingBottom: 36,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  title: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "900",
  },
  subtitle: {
    color: "#94a3b8",
    marginTop: 3,
  },
  logoutButton: {
    backgroundColor: "#1e293b",
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "800",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metric: {
    width: "48%",
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1e293b",
    borderRadius: 8,
    padding: 14,
  },
  metricValue: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "900",
  },
  metricTitle: {
    color: "#94a3b8",
    marginTop: 3,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 24,
    marginBottom: 12,
  },
  link: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1e293b",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  linkText: {
    color: "#fff",
    fontWeight: "800",
  },
});
