import React, { useEffect, useState } from "react";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { api } from "../../services/adminApi";

export default function ManageCalorieLogsScreen() {
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    try {
      setError("");
      const [logData, summaryData] = await Promise.all([
        api.mealLogs.getAll(),
        api.mealLogs.getSummary(),
      ]);
      setLogs(logData);
      setSummary(summaryData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const deleteLog = async (id) => {
    try {
      await api.mealLogs.delete(id);
      await loadData();
    } catch (err) {
      Alert.alert("Could not delete log", err.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#6366f1" />
        <Text style={styles.muted}>Loading calorie logs...</Text>
      </View>
    );
  }

  const today = summary?.today || { totals: {}, mealCount: 0 };
  const allTime = summary?.allTime || { totals: {}, mealCount: 0, users: 0 };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadData();
          }}
        />
      }
    >
      <Text style={styles.title}>Calorie Logs</Text>
      <Text style={styles.subtitle}>Review user meal logs and daily calorie totals.</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.summaryGrid}>
        <SummaryCard title="Today Meals" value={today.mealCount || 0} />
        <SummaryCard title="Today Calories" value={Math.round(today.totals?.calories || 0)} />
        <SummaryCard title="All Logs" value={allTime.mealCount || 0} />
        <SummaryCard title="Users" value={allTime.users || 0} />
      </View>

      <Text style={styles.sectionTitle}>Recent Logs</Text>
      {logs.length === 0 ? (
        <Text style={styles.muted}>No calorie logs found.</Text>
      ) : (
        logs.map((log) => (
          <View key={log._id} style={styles.logCard}>
            <View style={styles.logTop}>
              <View style={styles.logInfo}>
                <Text style={styles.foodName}>{log.foodName}</Text>
                <Text style={styles.userId}>{log.userId}</Text>
              </View>
              <Text style={styles.calories}>{Math.round(log.calories)} kcal</Text>
            </View>

            <Text style={styles.meta}>
              P {Math.round(log.protein)}g / C {Math.round(log.carbs)}g / F {Math.round(log.fats)}g
            </Text>
            <Text style={styles.meta}>{new Date(log.timestamp).toLocaleString()}</Text>

            <TouchableOpacity style={styles.deleteButton} onPress={() => deleteLog(log._id)}>
              <Text style={styles.deleteText}>Delete Log</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}

function SummaryCard({ title, value }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryTitle}>{title}</Text>
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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#020617",
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    color: "#94a3b8",
    marginTop: 4,
    marginBottom: 18,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 22,
  },
  summaryCard: {
    width: "48%",
    backgroundColor: "#0f172a",
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  summaryValue: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
  },
  summaryTitle: {
    color: "#94a3b8",
    marginTop: 4,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 12,
  },
  logCard: {
    backgroundColor: "#0f172a",
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1e293b",
    marginBottom: 10,
  },
  logTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  logInfo: {
    flex: 1,
  },
  foodName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  userId: {
    color: "#94a3b8",
    marginTop: 3,
  },
  calories: {
    color: "#818cf8",
    fontSize: 16,
    fontWeight: "900",
  },
  meta: {
    color: "#94a3b8",
    marginTop: 6,
  },
  deleteButton: {
    marginTop: 12,
    alignSelf: "flex-start",
    backgroundColor: "#3f1d2a",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  deleteText: {
    color: "#fda4af",
    fontWeight: "800",
  },
  muted: {
    color: "#94a3b8",
  },
  error: {
    color: "#fda4af",
    marginBottom: 12,
  },
});
