import { useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function ExitTab() {
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
        style={[styles.searchInput]}
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

const styles = StyleSheet.create({
  tabContent: { padding: 16, paddingBottom: 32 },
  searchInput: {
    borderWidth: 1.5,
    borderColor: "#e8e8e8",
    borderRadius: 12,
    padding: 13,
    fontSize: 15,
    backgroundColor: "#fafafa",
    color: "#222",
    marginBottom: 16,
  },
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
});