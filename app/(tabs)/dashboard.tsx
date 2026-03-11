import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Icons as simple text/emoji (no extra libs needed) ───────────────────────
const TAB_ICONS: Record<string, string> = {
  entry: "🚗",
  exit: "🅿️",
  settings: "⚙️",
};

// ─── Entry Tab ────────────────────────────────────────────────────────────────
function EntryTab() {
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("Car");
  const [driverName, setDriverName] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const VEHICLE_TYPES = ["Car", "Bike", "Truck", "Van"];

  const handleSubmit = () => {
    if (!vehicleNumber.trim()) {
      Alert.alert("Required", "Please enter vehicle number");
      return;
    }
    // TODO: call your API here
    setSubmitted(true);
    setTimeout(() => {
      setVehicleNumber("");
      setDriverName("");
      setVehicleType("Car");
      setSubmitted(false);
    }, 2000);
  };

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🚗 Vehicle Entry</Text>
        <Text style={styles.cardSubtitle}>Log a new vehicle entering the parking</Text>

        <Text style={styles.fieldLabel}>Vehicle Number *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. KL 01 AB 1234"
          placeholderTextColor="#aaa"
          value={vehicleNumber}
          onChangeText={setVehicleNumber}
          autoCapitalize="characters"
        />

        <Text style={styles.fieldLabel}>Driver Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter driver name (optional)"
          placeholderTextColor="#aaa"
          value={driverName}
          onChangeText={setDriverName}
        />

        <Text style={styles.fieldLabel}>Vehicle Type</Text>
        <View style={styles.typeRow}>
          {VEHICLE_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.typeChip, vehicleType === type && styles.typeChipActive]}
              onPress={() => setVehicleType(type)}
            >
              <Text style={[styles.typeChipText, vehicleType === type && styles.typeChipTextActive]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, submitted && styles.submitButtonSuccess]}
          onPress={handleSubmit}
          disabled={submitted}
        >
          <Text style={styles.submitButtonText}>
            {submitted ? "✅ Entry Logged!" : "Log Entry"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📋 Today's Summary</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>24</Text>
            <Text style={styles.summaryLabel}>Entries</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>18</Text>
            <Text style={styles.summaryLabel}>Exits</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>6</Text>
            <Text style={styles.summaryLabel}>Parked</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// ─── Exit Tab ─────────────────────────────────────────────────────────────────
function ExitTab() {
  const [search, setSearch] = useState("");

  // Mock data — replace with API call
  const parkedVehicles = [
    { id: 1, number: "KL 01 AB 1234", type: "Car", entry: "09:30 AM", driver: "Rahul" },
    { id: 2, number: "KL 07 CD 5678", type: "Bike", entry: "10:15 AM", driver: "Priya" },
    { id: 3, number: "KL 12 EF 9012", type: "Van", entry: "11:00 AM", driver: "Anil" },
    { id: 4, number: "KL 04 GH 3456", type: "Truck", entry: "11:45 AM", driver: "Suresh" },
  ];

  const filtered = parkedVehicles.filter(
    (v) =>
      v.number.toLowerCase().includes(search.toLowerCase()) ||
      v.driver.toLowerCase().includes(search.toLowerCase())
  );

  const handleExit = (vehicle: typeof parkedVehicles[0]) => {
    Alert.alert(
      "Confirm Exit",
      `Process exit for ${vehicle.number}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm Exit",
          style: "destructive",
          onPress: () => Alert.alert("✅ Exit Processed", `${vehicle.number} has exited`),
        },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <TextInput
        style={[styles.input, { marginBottom: 16 }]}
        placeholder="🔍 Search by vehicle number or driver..."
        placeholderTextColor="#aaa"
        value={search}
        onChangeText={setSearch}
      />

      {filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No vehicles found</Text>
        </View>
      ) : (
        filtered.map((vehicle) => (
          <View key={vehicle.id} style={styles.vehicleCard}>
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleNumber}>{vehicle.number}</Text>
              <View style={styles.vehicleMeta}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{vehicle.type}</Text>
                </View>
                <Text style={styles.vehicleDetail}>👤 {vehicle.driver}</Text>
                <Text style={styles.vehicleDetail}>🕐 {vehicle.entry}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.exitButton} onPress={() => handleExit(vehicle)}>
              <Text style={styles.exitButtonText}>Exit</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────
function SettingsTab({ onLogout }: { onLogout: () => void }) {
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [autoLogout, setAutoLogout] = useState(true);

  const settingItems = [
    { label: "Push Notifications", value: notifications, onChange: setNotifications },
    { label: "Sound Effects", value: soundEnabled, onChange: setSoundEnabled },
    { label: "Auto Logout (30 min)", value: autoLogout, onChange: setAutoLogout },
  ];

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

      <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
        <Text style={styles.logoutButtonText}>🚪 Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function StaffDashboard() {
  const [activeTab, setActiveTab] = useState<"entry" | "exit" | "settings">("entry");

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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#DC2626" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>SafePark</Text>
          <Text style={styles.headerSubtitle}>Staff Dashboard</Text>
        </View>
        <TouchableOpacity style={styles.headerLogout} onPress={handleLogout}>
          <Text style={styles.headerLogoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={styles.content}>
        {activeTab === "entry" && <EntryTab />}
        {activeTab === "exit" && <ExitTab />}
        {activeTab === "settings" && <SettingsTab onLogout={handleLogout} />}
      </View>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        {(["entry", "exit", "settings"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={styles.tabIcon}>{TAB_ICONS[tab]}</Text>
            <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
            {activeTab === tab && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f4f4" },

  // Header
  header: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  headerSubtitle: { color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 2 },
  headerLogout: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  headerLogoutText: { color: "#fff", fontSize: 13, fontWeight: "600" },

  // Content
  content: { flex: 1 },
  tabContent: { padding: 16, paddingBottom: 32 },

  // Cards
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
  cardSubtitle: { fontSize: 13, color: "#888", marginBottom: 16 },

  // Form
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#444", marginBottom: 6, marginTop: 4 },
  input: {
    borderWidth: 1.5,
    borderColor: "#e8e8e8",
    borderRadius: 12,
    padding: 13,
    fontSize: 15,
    backgroundColor: "#fafafa",
    color: "#222",
  },
  typeRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 4 },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    backgroundColor: "#fafafa",
  },
  typeChipActive: { backgroundColor: "#DC2626", borderColor: "#DC2626" },
  typeChipText: { fontSize: 13, color: "#555", fontWeight: "500" },
  typeChipTextActive: { color: "#fff" },
  submitButton: {
    backgroundColor: "#DC2626",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  submitButtonSuccess: { backgroundColor: "#16a34a" },
  submitButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  // Summary
  summaryRow: { flexDirection: "row", justifyContent: "space-around", paddingTop: 8 },
  summaryItem: { alignItems: "center" },
  summaryNumber: { fontSize: 28, fontWeight: "800", color: "#DC2626" },
  summaryLabel: { fontSize: 12, color: "#888", marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: "#f0f0f0" },

  // Vehicle cards
  vehicleCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  vehicleInfo: { flex: 1 },
  vehicleNumber: { fontSize: 16, fontWeight: "700", color: "#1a1a1a", marginBottom: 6 },
  vehicleMeta: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  badge: { backgroundColor: "#FEE2E2", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, color: "#DC2626", fontWeight: "600" },
  vehicleDetail: { fontSize: 12, color: "#777" },
  exitButton: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    marginLeft: 10,
  },
  exitButtonText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyStateText: { color: "#aaa", fontSize: 16 },

  // Settings
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

  // Tab Bar
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 4,
    position: "relative",
  },
  tabItemActive: {},
  tabIcon: { fontSize: 22 },
  tabLabel: { fontSize: 11, color: "#aaa", marginTop: 3, fontWeight: "500" },
  tabLabelActive: { color: "#DC2626", fontWeight: "700" },
  tabIndicator: {
    position: "absolute",
    top: 0,
    width: 32,
    height: 3,
    backgroundColor: "#DC2626",
    borderRadius: 2,
  },
});