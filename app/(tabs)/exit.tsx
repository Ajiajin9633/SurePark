import { API_BASE_URL } from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

interface Vehicle {
  id: number;
  number: string;
  entry: string;
  vehicleType: string;
  advanceAmount?: number;
}

export default function ExitTab() {
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Number pad buttons
  const numberPad = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['C', '0', '⌫']
  ];

  useEffect(() => {
    loadVehicles();
  }, []);

  // Filter vehicles whenever vehicleNumber changes
  useEffect(() => {
    if (vehicleNumber.trim() === "") {
      setFilteredVehicles(vehicles);
    } else {
      const filtered = vehicles.filter((v) => 
        v.number.toLowerCase().includes(vehicleNumber.toLowerCase())
      );
      setFilteredVehicles(filtered);
    }
  }, [vehicleNumber, vehicles]);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      setError(null);

      const storedUser = await AsyncStorage.getItem("user");

      if (!storedUser) {
        setError("User not found. Please login again.");
        setLoading(false);
        return;
      }

      const user = JSON.parse(storedUser);
      
      const userId = user.userId || user.id;

      if (!userId) {
        setError("Invalid user ID");
        setLoading(false);
        return;
      }

      const url = `${API_BASE_URL}/Parking/ActiveVehicles/${userId}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch vehicles: ${response.status}`);
      }

      const data = await response.json();
      
      setVehicles(data);
      setFilteredVehicles(data);
    } catch (err) {
      console.error("Error loading vehicles:", err);
      setError(err instanceof Error ? err.message : "Failed to load vehicles");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadVehicles();
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } catch {
      return dateString;
    }
  };

  const handleNumberPress = (value: string) => {
    if (value === 'C') {
      setVehicleNumber('');
    } else if (value === '⌫') {
      setVehicleNumber(prev => prev.slice(0, -1));
    } else {
      setVehicleNumber(prev => prev + value);
    }
  };

  const handleExit = (vehicle: Vehicle) => {
    Alert.alert(
      "Confirm Exit",
      `Process exit for ${vehicle.number}?${vehicle.advanceAmount ? `\n\nAdvance Amount: ₹${vehicle.advanceAmount}` : ''}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm Exit",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(
                `${API_BASE_URL}/Parking/CheckOut/${vehicle.id}`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json"
                  }
                }
              );

              if (response.ok) {
                Alert.alert("✅ Exit Processed", `${vehicle.number} has exited`);
                loadVehicles();
                setVehicleNumber('');
              } else {
                const error = await response.json();
                Alert.alert("Error", error.message || "Failed to process exit");
              }
            } catch (error) {
              console.error("Exit error:", error);
              Alert.alert("Error", "Failed to connect to server");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#DC2626" />
        <Text style={styles.loadingText}>Loading vehicles...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>❌ {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadVehicles}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      contentContainerStyle={styles.tabContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Compact Number Input Section */}
      <View style={styles.compactInputSection}>
        {/* Vehicle Number Display */}
        <View style={styles.compactDisplay}>
          <Text style={styles.compactDisplayLabel}>Vehicle Number</Text>
          <View style={styles.compactDisplayBox}>
            <Text style={styles.compactDisplayText}>
              {vehicleNumber || '______'}
            </Text>
          </View>
        </View>

        {/* Compact Number Pad */}
        <View style={styles.compactNumberPad}>
          {numberPad.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.compactPadRow}>
              {row.map((key) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.compactPadButton,
                    key === 'C' && styles.compactClearButton,
                    key === '⌫' && styles.compactBackspaceButton,
                  ]}
                  onPress={() => handleNumberPress(key)}
                >
                  <Text style={[
                    styles.compactPadButtonText,
                    (key === 'C' || key === '⌫') && styles.compactSpecialText,
                  ]}>
                    {key}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      </View>

      {/* Results count */}
      <View style={styles.headerRow}>
        <Text style={styles.headerText}>
          {filteredVehicles.length} Vehicle{filteredVehicles.length !== 1 ? 's' : ''} Found
        </Text>
        {vehicleNumber.length > 0 && filteredVehicles.length === 0 && (
          <Text style={styles.noMatchText}>No matches for "{vehicleNumber}"</Text>
        )}
      </View>

      {filteredVehicles.length === 0 && vehicleNumber.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>🚗</Text>
          <Text style={styles.emptyStateText}>No parked vehicles</Text>
        </View>
      ) : (
        filteredVehicles.map((vehicle) => (
          <View key={vehicle.id} style={styles.vehicleCard}>
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleNumber}>{vehicle.number}</Text>
              <View style={styles.vehicleMeta}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{vehicle.vehicleType}</Text>
                </View>
                <Text style={styles.vehicleDetail}>🕐 {formatTime(vehicle.entry)}</Text>
                {vehicle.advanceAmount ? (
                  <Text style={styles.vehicleDetail}>💰 ₹{vehicle.advanceAmount}</Text>
                ) : null}
              </View>
            </View>
            <TouchableOpacity 
              style={styles.exitButton} 
              onPress={() => handleExit(vehicle)}
            >
              <Text style={styles.exitButtonText}>Exit</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tabContent: { 
    padding: 16, 
    paddingBottom: 32,
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Compact Input Section
  compactInputSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  // Compact Display Styles
  compactDisplay: {
    marginBottom: 10,
  },
  compactDisplayLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  compactDisplayBox: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  compactDisplayText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#222',
    textAlign: 'center',
    letterSpacing: 1,
  },
  // Compact Number Pad Styles
  compactNumberPad: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 8,
  },
  compactPadRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 6,
  },
  compactPadButton: {
    flex: 1,
    aspectRatio: 1.8,
    backgroundColor: '#fff',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    elevation: 1,
  },
  compactClearButton: {
    backgroundColor: '#ffebee',
  },
  compactBackspaceButton: {
    backgroundColor: '#fff3e0',
  },
  compactPadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  compactSpecialText: {
    color: '#DC2626',
    fontSize: 15,
  },
  headerRow: {
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  noMatchText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '500',
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
  vehicleNumber: { 
    fontSize: 16, 
    fontWeight: "700", 
    color: "#1a1a1a", 
    marginBottom: 6 
  },
  vehicleMeta: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 8, 
    flexWrap: "wrap" 
  },
  badge: { 
    backgroundColor: "#FEE2E2", 
    paddingHorizontal: 8, 
    paddingVertical: 3, 
    borderRadius: 8 
  },
  badgeText: { 
    fontSize: 11, 
    color: "#DC2626", 
    fontWeight: "600" 
  },
  vehicleDetail: { 
    fontSize: 12, 
    color: "#777" 
  },
  exitButton: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    marginLeft: 10,
  },
  exitButtonText: { 
    color: "#fff", 
    fontSize: 13, 
    fontWeight: "700" 
  },
  emptyState: { 
    alignItems: "center", 
    paddingVertical: 60 
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.3,
  },
  emptyStateText: { 
    color: "#aaa", 
    fontSize: 16,
    marginBottom: 8,
  },
});