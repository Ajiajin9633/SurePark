import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function SettingsTab() {
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [autoLogout, setAutoLogout] = useState(true);

  const settingItems = [
    { label: "Push Notifications", value: notifications, onChange: setNotifications },
    { label: "Sound Effects", value: soundEnabled, onChange: setSoundEnabled },
    { label: "Auto Logout (30 min)", value: autoLogout, onChange: setAutoLogout },
  ];

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => router.replace("/"),
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>👤 Account</Text>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>S</Text>
          </View>
          <View>
            <Text style={styles.profileName}>Staff Member</Text>
            <Text style={styles.profileRole}>Parking Staff</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🔔 Preferences</Text>
        {settingItems.map((item, index) => (
          <View
            key={item.label}
            style={[styles.settingRow, index < settingItems.length - 1 && styles.settingRowBorder]}
          >
            <Text style={styles.settingLabel}>{item.label}</Text>
            <Switch
              value={item.value}
              onValueChange={item.onChange}
              trackColor={{ false: "#e0e0e0", true: "#DC2626" }}
              thumbColor="#fff"
            />
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>ℹ️ App Info</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Version</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>App</Text>
          <Text style={styles.infoValue}>SafePark</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>🚪 Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tabContent: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#1a1a1a", marginBottom: 4 },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 4 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#DC2626",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#fff", fontSize: 20, fontWeight: "800" },
  profileName: { fontSize: 16, fontWeight: "700", color: "#1a1a1a" },
  profileRole: { fontSize: 13, color: "#888", marginTop: 2 },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  settingRowBorder: { borderBottomWidth: 1, borderBottomColor: "#f5f5f5" },
  settingLabel: { fontSize: 15, color: "#333" },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  infoLabel: { fontSize: 14, color: "#888" },
  infoValue: { fontSize: 14, fontWeight: "600", color: "#333" },
  logoutButton: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#DC2626",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 8,
  },
  logoutButtonText: { color: "#DC2626", fontSize: 16, fontWeight: "700" },
});