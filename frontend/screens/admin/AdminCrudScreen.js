import React, { useEffect, useState } from "react";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function AdminCrudScreen({ title, subtitle, service, fields, renderItem }) {
  const initialForm = fields.reduce((acc, field) => ({ ...acc, [field.name]: field.defaultValue || "" }), {});
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadItems = useCallback(async () => {
    try {
      setError("");
      const data = await service.getAll();
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [loadItems])
  );

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const createItem = async () => {
    const requiredMissing = fields.find((field) => field.required && !String(form[field.name] || "").trim());
    if (requiredMissing) {
      Alert.alert("Missing details", `${requiredMissing.label} is required.`);
      return;
    }

    setSaving(true);
    try {
      const payload = {};
      fields.forEach((field) => {
        if (field.type === "number") {
          payload[field.name] = Number(form[field.name] || 0);
        } else if (field.type === "boolean") {
          payload[field.name] = form[field.name] === true || form[field.name] === "true";
        } else {
          payload[field.name] = form[field.name];
        }
      });

      await service.create(payload);
      setForm(initialForm);
      await loadItems();
    } catch (err) {
      Alert.alert("Could not save", err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id) => {
    try {
      await service.delete(id);
      await loadItems();
    } catch (err) {
      Alert.alert("Could not delete", err.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#6366f1" />
        <Text style={styles.muted}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadItems();
          }}
        />
      }
    >
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.form}>
        {fields.map((field) => (
          <TextInput
            key={field.name}
            style={styles.input}
            placeholder={field.label}
            placeholderTextColor="#64748b"
            keyboardType={field.type === "number" ? "numeric" : "default"}
            value={String(form[field.name] ?? "")}
            onChangeText={(value) => setField(field.name, value)}
          />
        ))}

        <TouchableOpacity style={styles.button} onPress={createItem} disabled={saving}>
          <Text style={styles.buttonText}>{saving ? "Saving..." : `Add ${title}`}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Records</Text>
      {items.length === 0 ? (
        <Text style={styles.muted}>No records yet.</Text>
      ) : (
        items.map((item) => (
          <View key={item._id} style={styles.card}>
            {renderItem(item)}
            <TouchableOpacity style={styles.deleteButton} onPress={() => deleteItem(item._id)}>
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}

export const AdminText = ({ children, muted }) => (
  <Text style={muted ? styles.mutedLine : styles.itemTitle}>{children}</Text>
);

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
  form: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1e293b",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "#1e293b",
    borderRadius: 8,
    color: "#fff",
    padding: 12,
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#6366f1",
    borderRadius: 8,
    padding: 13,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "900",
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 10,
  },
  card: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1e293b",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  itemTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
  },
  muted: {
    color: "#94a3b8",
  },
  mutedLine: {
    color: "#94a3b8",
    marginTop: 2,
  },
  error: {
    color: "#fda4af",
    marginBottom: 12,
  },
  deleteButton: {
    backgroundColor: "#3f1d2a",
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 10,
  },
  deleteText: {
    color: "#fda4af",
    fontWeight: "800",
  },
});
