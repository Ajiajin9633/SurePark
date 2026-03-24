import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE_URL } from "../../services/api";

type VehicleType = {
  id: number;
  type: string;
  icon: string;
};

const ICON_OPTIONS = [
  { label: "Car", value: "🚗" },
  { label: "Bike", value: "🏍️" },
  { label: "Auto", value: "🛺" },
  { label: "Truck", value: "🚚" },
  { label: "Bus", value: "🚌" },
  { label: "Bicycle", value: "🚲" },
];

export default function VehicleTypeManagement() {
  const [type, setType] = useState("");
  const [selectedIcon, setSelectedIcon] = useState(ICON_OPTIONS[0]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"create" | "list">("create");

  useEffect(() => {
    fetchVehicleTypes();
  }, []);

  const fetchVehicleTypes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/VehicleTypes/list`);
      if (!response.ok) throw new Error("Server error");
      const data = await response.json();
      setVehicleTypes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch Vehicle Types Error:", error);
      Alert.alert("Error", "Failed to load vehicle types");
    } finally {
      setFetching(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchVehicleTypes();
    setRefreshing(false);
  };

  const validateForm = () => {
    if (!type.trim()) {
      Alert.alert("Validation Error", "Please enter vehicle type");
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/VehicleTypes/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: type.trim(),
          icon: selectedIcon.value,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Vehicle type added successfully", [
          {
            text: "OK",
            onPress: () => {
              setType("");
              setSelectedIcon(ICON_OPTIONS[0]);
              fetchVehicleTypes();
              setSelectedTab("list");
            },
          },
        ]);
      } else {
        Alert.alert("Failed", data.message || "Something went wrong");
      }
    } catch (error) {
      Alert.alert("Error", "Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      "Delete Vehicle Type",
      "Are you sure you want to delete this vehicle type?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(
                `${API_BASE_URL}/VehicleTypes/${id}`,
                {
                  method: "DELETE",
                },
              );

              if (response.ok) {
                setVehicleTypes(vehicleTypes.filter((v) => v.id !== id));
                Alert.alert("Success", "Deleted successfully");
              } else {
                Alert.alert("Error", "Failed to delete");
              }
            } catch (error) {
              Alert.alert("Error", "Network error occurred");
            }
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: VehicleType }) => (
    <View style={styles.card}>
      <View style={styles.cardIconContainer}>
        <Text style={styles.cardIcon}>{item.icon}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardType}>{item.type}</Text>
        <Text style={styles.cardId}>ID: {item.id}</Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(item.id)}
      >
        <Text style={styles.deleteIcon}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#d32f2f" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Vehicle Type</Text>
          <Text style={styles.headerSubtitle}>Manage vehicle categories</Text>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "create" && styles.activeTab]}
          onPress={() => setSelectedTab("create")}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "create" && styles.activeTabText,
            ]}
          >
            Add New
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "list" && styles.activeTab]}
          onPress={() => setSelectedTab("list")}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "list" && styles.activeTabText,
            ]}
          >
            List ({vehicleTypes.length})
          </Text>
        </TouchableOpacity>
      </View>

      {fetching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#d32f2f" />
          <Text style={styles.loadingText}>Loading vehicle types...</Text>
        </View>
      ) : selectedTab === "create" ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.formPadding}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formCard}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Vehicle Type Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. SUV, Heavy Bike, etc."
                  value={type}
                  onChangeText={setType}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Select Icon</Text>
                <View style={styles.iconGrid}>
                  {ICON_OPTIONS.map((item) => (
                    <TouchableOpacity
                      key={item.value}
                      style={[
                        styles.iconItem,
                        selectedIcon.value === item.value &&
                          styles.selectedIconItem,
                      ]}
                      onPress={() => setSelectedIcon(item)}
                    >
                      <Text style={styles.iconItemEmoji}>{item.value}</Text>
                      <Text
                        style={[
                          styles.iconItemLabel,
                          selectedIcon.value === item.value &&
                            styles.selectedIconItemLabel,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.disabledButton]}
                onPress={handleCreate}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Add Vehicle Type</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        <FlatList
          data={vehicleTypes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listPadding}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#d32f2f"]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No vehicle types found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#d32f2f",
    paddingTop: 20,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  backIcon: {
    fontSize: 24,
    color: "#fff",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: -15,
    borderRadius: 12,
    padding: 4,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: "#d32f2f",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  activeTabText: {
    color: "#fff",
  },
  formPadding: {
    padding: 20,
    paddingTop: 30,
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    elevation: 4,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  iconItem: {
    width: "30%",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginBottom: 5,
  },
  selectedIconItem: {
    backgroundColor: "rgba(211, 47, 47, 0.1)",
    borderColor: "#d32f2f",
  },
  iconItemEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  iconItemLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  selectedIconItemLabel: {
    color: "#d32f2f",
    fontWeight: "bold",
  },
  submitButton: {
    backgroundColor: "#d32f2f",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.6,
  },
  listPadding: {
    padding: 20,
    paddingTop: 30,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
  },
  cardIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: "rgba(211, 47, 47, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  cardIcon: {
    fontSize: 24,
  },
  cardContent: {
    flex: 1,
  },
  cardType: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  cardId: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  deleteButton: {
    padding: 10,
  },
  deleteIcon: {
    fontSize: 20,
    opacity: 0.6,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 50,
  },
  emptyText: {
    color: "#999",
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#666",
  },
});
