import { AdminHeader } from "@/components/AdminHeader";
import { API_BASE_URL, apiFetch } from "@/services/api";
import { router } from "expo-router";
import React, { useEffect, useState, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { CustomDatePicker } from "../../components/CustomDatePicker";

interface ActiveVehicle {
  id: number;
  number: string;
  entry: string;
  vehicleType: string;
  vehicleTypeIcon: string;
  advanceAmount: number;
  locationId: number;
  locationName: string;
  ownerNumber: string;
}

export default function ParkedVehicles() {
  const [vehicles, setVehicles] = useState<ActiveVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [expandedLocations, setExpandedLocations] = useState<Record<number, boolean>>({});

  const fetchData = async () => {
    try {
      const response = await apiFetch("/Parking/Admin/ActiveVehicles");
      if (response.ok) {
        const data = await response.json();
        setVehicles(data);
      }
    } catch (error) {
      console.error("Error fetching active vehicles:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-expand locations when searching
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const newExpanded: Record<number, boolean> = { ...expandedLocations };
      vehicles.forEach(v => {
        if (v.number.toLowerCase().includes(searchQuery.toLowerCase())) {
          newExpanded[v.locationId] = true;
        }
      });
      setExpandedLocations(newExpanded);
    }
  }, [searchQuery]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const calculateDaysParked = (entryDate: string) => {
    const start = new Date(entryDate);
    const now = new Date();
    
    // Set both to start of day for accurate day difference if needed,
    // but the user asked for days between.
    const diffTime = now.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    return `${diffDays} Day${diffDays > 1 ? "s" : ""}`;
  };

  const handleDateConfirm = (date: Date) => {
    // Format date as locale string or similar to match the entry date string check
    setDateFilter(date.toLocaleDateString());
    setShowDatePicker(false);
  };

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const matchesSearch = v.number.toLowerCase().includes(searchQuery.toLowerCase());
      const entryDateStr = new Date(v.entry).toLocaleDateString();
      const matchesDate = !dateFilter || entryDateStr === dateFilter;
      return matchesSearch && matchesDate;
    });
  }, [vehicles, searchQuery, dateFilter]);

  const groupedByLocation = useMemo(() => {
    const groups: Record<number, { name: string; vehicles: ActiveVehicle[] }> = {};
    filteredVehicles.forEach((v) => {
      if (!groups[v.locationId]) {
        groups[v.locationId] = { name: v.locationName, vehicles: [] };
      }
      groups[v.locationId].vehicles.push(v);
    });
    return Object.entries(groups).map(([id, group]) => ({
      id: parseInt(id),
      ...group,
    }));
  }, [filteredVehicles]);

  const toggleLocation = (id: number) => {
    setExpandedLocations((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#d32f2f" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AdminHeader
        title="Parked Vehicles"
        subtitle="Current active vehicles"
        showBackButton={true}
        onBack={() => router.back()}
      />

      <View style={styles.filterSection}>
        <View style={styles.searchWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search Vehicle Number"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <View style={styles.datePickerContainer}>
          <TouchableOpacity 
            style={styles.datePickerButton} 
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.searchIcon}>📅</Text>
            <Text style={[styles.dateText, !dateFilter && styles.placeholderText]}>
              {dateFilter || "Filter by Date"}
            </Text>
          </TouchableOpacity>
          {dateFilter ? (
            <TouchableOpacity onPress={() => setDateFilter("")} style={styles.clearDate}>
              <Text style={styles.clearDateText}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <CustomDatePicker
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onConfirm={handleDateConfirm}
        initialDate={dateFilter ? new Date(dateFilter) : new Date()}
        title="Select Filter Date"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {groupedByLocation.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No vehicles found</Text>
          </View>
        ) : (
          groupedByLocation.map((location) => (
            <View key={location.id} style={styles.locationSection}>
              <TouchableOpacity
                style={styles.locationHeader}
                onPress={() => toggleLocation(location.id)}
                activeOpacity={0.7}
              >
                <View style={styles.locationInfo}>
                  <Text style={styles.locationIcon}>📍</Text>
                  <Text style={styles.locationName}>{location.name}</Text>
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>{location.vehicles.length}</Text>
                  </View>
                </View>
                <Text style={styles.expandIcon}>
                  {expandedLocations[location.id] ? "▼" : "▶"}
                </Text>
              </TouchableOpacity>

              {expandedLocations[location.id] && (
                <View style={styles.vehicleList}>
                  {location.vehicles.map((vehicle) => (
                    <View key={vehicle.id} style={styles.vehicleCard}>
                      <View style={styles.vehicleMajorInfo}>
                        <View style={styles.vehicleTypeContainer}>
                          <Text style={styles.vTypeIcon}>{vehicle.vehicleTypeIcon || "🚗"}</Text>
                          <Text style={styles.vTypeText}>{vehicle.vehicleType}</Text>
                        </View>
                        <Text style={styles.vehicleNumber}>{vehicle.number}</Text>
                      </View>

                      <View style={styles.divider} />

                      <View style={styles.vehicleDetails}>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Check-in:</Text>
                          <Text style={styles.detailValue}>
                            {new Date(vehicle.entry).toLocaleString()}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Days Parked:</Text>
                          <Text style={styles.daysParkedText}>
                            {calculateDaysParked(vehicle.entry)}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Advance:</Text>
                          <Text style={styles.advanceText}>₹{vehicle.advanceAmount}</Text>
                        </View>
                        {vehicle.ownerNumber ? (
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Owner:</Text>
                            <Text style={styles.detailValue}>{vehicle.ownerNumber}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  filterSection: {
    padding: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f3f5",
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  dateWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f3f5",
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: "#333",
  },
  datePickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f3f5",
    borderRadius: 10,
    paddingRight: 10,
  },
  datePickerButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    height: 40,
  },
  dateText: {
    fontSize: 14,
    color: "#333",
  },
  placeholderText: {
    color: "#999",
  },
  clearDate: {
    padding: 5,
  },
  clearDateText: {
    fontSize: 16,
    color: "#999",
  },
  scrollContent: {
    padding: 15,
  },
  locationSection: {
    marginBottom: 15,
    backgroundColor: "#fff",
    borderRadius: 15,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "#fff",
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  locationName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#333",
    marginRight: 10,
  },
  countBadge: {
    backgroundColor: "#d32f2f",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  expandIcon: {
    fontSize: 14,
    color: "#666",
  },
  vehicleList: {
    padding: 10,
    backgroundColor: "#f8f9fa",
  },
  vehicleCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  vehicleMajorInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  vehicleTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  vTypeIcon: {
    fontSize: 20,
    marginRight: 6,
  },
  vTypeText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  vehicleNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#d32f2f",
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginBottom: 10,
  },
  vehicleDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 13,
    color: "#888",
  },
  detailValue: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
  },
  daysParkedText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2e7d32",
  },
  advanceText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  emptyContainer: {
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
});
