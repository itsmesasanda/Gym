import React, { useEffect, useState } from "react";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { api } from "../../services/adminApi";

export default function ReportsScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
  const loadReports = useCallback(async () => {
    try {
      const [summary, usersOverTime, mealsCalories, mealLogs] = await Promise.all([
        api.reports.getSummary(),
        api.reports.getUsersOverTime(),
        api.reports.getMealsCalories(),
        api.mealLogs.getSummary(),
      ]);
      setData({ summary, usersOverTime, mealsCalories, mealLogs });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [loadReports])
  );
      try {
        const [summary, usersOverTime, mealsCalories, mealLogs] = await Promise.all([
          api.reports.getSummary(),
          api.reports.getUsersOverTime(),
          api.reports.getMealsCalories(),
          api.mealLogs.getSummary(),
        ]);
        setData({ summary, usersOverTime, mealsCalories, mealLogs });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#6366f1" />
        <Text style={styles.muted}>Loading reports...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Reports</Text>
      <Text style={styles.subtitle}>Summary analytics for the admin panel.</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <ReportBlock title="Summary" data={data?.summary} />
      <ReportBlock title="Users Over Time" data={data?.usersOverTime} />
      <ReportBlock title="Meals Calories" data={data?.mealsCalories} />
      <ReportBlock title="Calorie Logs" data={data?.mealLogs} />
    </ScrollView>
  );
}

function ReportBlock({ title, data }) {
  return (
    <View style={styles.block}>
      <Text style={styles.blockTitle}>{title}</Text>
      <Text style={styles.json}>{JSON.stringify(data || {}, null, 2)}</Text>
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
    fontWeight: "900",
  },
  subtitle: {
    color: "#94a3b8",
    marginTop: 4,
    marginBottom: 16,
  },
  block: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1e293b",
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  blockTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 8,
  },
  json: {
    color: "#cbd5e1",
    fontFamily: "monospace",
  },
  muted: {
    color: "#94a3b8",
  },
  error: {
    color: "#fda4af",
    marginBottom: 12,
  },
});
