import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE_URL } from "../../services/api";

type Location = {
  id: number;
  name: string;
};

type VehicleType = {
  id: number;
  type: string;
  icon: string;
};

type TariffSlot = {
  id?: string;
  fromHour: number;
  toHour: number;
  rate: number;
  isNew?: boolean;
};

type Tariff = {
  id: number;
  vehicleTypeId: number;
  vehicleName: string;
  locationId: number;
  locationName?: string;
  perDayRate: number;
  slots: TariffSlot[];
};

export default function TariffPage() {
  // Form states
  const [vehicleName, setVehicleName] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const [tariffSlots, setTariffSlots] = useState<TariffSlot[]>([
    { id: "1", fromHour: 0, toHour: 1, rate: 0 },
  ]);
  const [perDayRate, setPerDayRate] = useState("");

  // Data states
  const [locations, setLocations] = useState<Location[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [tariffs, setTariffs] = useState<Tariff[]>([]);

  // UI states
  const [loading, setLoading] = useState(false);
  const [fetchingLocations, setFetchingLocations] = useState(true);
  const [fetchingVehicleTypes, setFetchingVehicleTypes] = useState(true);
  const [fetchingTariffs, setFetchingTariffs] = useState(true);
  const [locationDropdownVisible, setLocationDropdownVisible] = useState(false);
  const [vehicleTypeDropdownVisible, setVehicleTypeDropdownVisible] =
    useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"create" | "list">("create");

  // Edit states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTariff, setEditingTariff] = useState<Tariff | null>(null);
  const [editVehicleName, setEditVehicleName] = useState("");
  const [editSelectedLocation, setEditSelectedLocation] =
    useState<Location | null>(null);
  const [editTariffSlots, setEditTariffSlots] = useState<TariffSlot[]>([]);
  const [editPerDayRate, setEditPerDayRate] = useState("");
  const [editLocationDropdownVisible, setEditLocationDropdownVisible] =
    useState(false);
  const [editVehicleTypeDropdownVisible, setEditVehicleTypeDropdownVisible] =
    useState(false);

  // List expand state
  const [expandedVehicle, setExpandedVehicle] = useState<string | null>(null);

  // Derived — show per-day input only when at least one slot has toHour > 96
  const showPerDay = tariffSlots.some((s) => s.toHour > 96);
  const showEditPerDay = editTariffSlots.some((s) => s.toHour > 96);

  useEffect(() => {
    fetchLocations();
    fetchVehicleTypes();
    fetchTariffs();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/location`);
      const data = await response.json();
      setLocations(data);
    } catch (error) {
      Alert.alert("Error", "Failed to load locations");
    } finally {
      setFetchingLocations(false);
    }
  };

  const fetchVehicleTypes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/VehicleTypes/list`);
      const data = await response.json();
      setVehicleTypes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch Vehicle Types Error:", error);
      Alert.alert("Error", "Failed to load vehicle types");
    } finally {
      setFetchingVehicleTypes(false);
    }
  };

  const fetchTariffs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tariff/list`);
      const data = await response.json();

      // Enrich tariff data with location names
      const enrichedTariffs = data.map((tariff: Tariff) => ({
        ...tariff,
        locationName:
          locations.find((l) => l.id === tariff.locationId)?.name || "Unknown",
      }));

      setTariffs(enrichedTariffs);
    } catch (error) {
      Alert.alert("Error", "Failed to load tariffs");
    } finally {
      setFetchingTariffs(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchLocations(), fetchVehicleTypes(), fetchTariffs()]);
    setRefreshing(false);
  };

  // Add new row to tariff slots
  const addTariffRow = () => {
    const lastSlot = tariffSlots[tariffSlots.length - 1];
    const newFromHour = lastSlot ? lastSlot.toHour : 0;
    const newToHour = newFromHour + 1;

    setTariffSlots([
      ...tariffSlots,
      {
        id: Date.now().toString(),
        fromHour: newFromHour,
        toHour: newToHour,
        rate: 0,
        isNew: true,
      },
    ]);
  };

  // Add new row to edit tariff slots
  const addEditTariffRow = () => {
    const lastSlot = editTariffSlots[editTariffSlots.length - 1];
    const newFromHour = lastSlot ? lastSlot.toHour : 0;
    const newToHour = newFromHour + 1;

    setEditTariffSlots([
      ...editTariffSlots,
      {
        id: Date.now().toString(),
        fromHour: newFromHour,
        toHour: newToHour,
        rate: 0,
        isNew: true,
      },
    ]);
  };

  // Remove tariff row
  const removeTariffRow = (index: number) => {
    if (tariffSlots.length > 1) {
      const newSlots = tariffSlots.filter((_, i) => i !== index);
      setTariffSlots(newSlots);
    } else {
      Alert.alert("Error", "At least one tariff slot is required");
    }
  };

  // Remove edit tariff row
  const removeEditTariffRow = (index: number) => {
    if (editTariffSlots.length > 1) {
      const newSlots = editTariffSlots.filter((_, i) => i !== index);
      setEditTariffSlots(newSlots);
    } else {
      Alert.alert("Error", "At least one tariff slot is required");
    }
  };

  // Update tariff slot
  const updateTariffSlot = (
    index: number,
    field: keyof TariffSlot,
    value: string,
  ) => {
    const numericValue = parseFloat(value) || 0;
    const newSlots = [...tariffSlots];

    if (field === "fromHour") {
      newSlots[index].fromHour = numericValue;
      if (index < newSlots.length - 1) {
        newSlots[index + 1].fromHour = numericValue;
      }
    } else if (field === "toHour") {
      newSlots[index].toHour = numericValue;
      if (index < newSlots.length - 1) {
        newSlots[index + 1].fromHour = numericValue;
      }
    } else if (field === "rate") {
      newSlots[index].rate = numericValue;
    }

    setTariffSlots(newSlots);
  };

  // Update edit tariff slot
  const updateEditTariffSlot = (
    index: number,
    field: keyof TariffSlot,
    value: string,
  ) => {
    const numericValue = parseFloat(value) || 0;
    const newSlots = [...editTariffSlots];

    if (field === "fromHour") {
      newSlots[index].fromHour = numericValue;
      if (index < newSlots.length - 1) {
        newSlots[index + 1].fromHour = numericValue;
      }
    } else if (field === "toHour") {
      newSlots[index].toHour = numericValue;
      if (index < newSlots.length - 1) {
        newSlots[index + 1].fromHour = numericValue;
      }
    } else if (field === "rate") {
      newSlots[index].rate = numericValue;
    }

    setEditTariffSlots(newSlots);
  };

  const validateForm = () => {
    if (!vehicleName) {
      Alert.alert("Validation Error", "Please select a vehicle type");
      return false;
    }
    if (!selectedLocation) {
      Alert.alert("Validation Error", "Please select a location");
      return false;
    }

    const hasPerDay =
      showPerDay && perDayRate !== "" && parseFloat(perDayRate) > 0;
    const hasHourlySlots = tariffSlots.some((slot) => slot.rate > 0);

    if (!hasPerDay && !hasHourlySlots) {
      Alert.alert(
        "Validation Error",
        "Please fill either hourly slots or a per-day rate",
      );
      return false;
    }

    if (hasHourlySlots) {
      for (const slot of tariffSlots) {
        if (slot.rate <= 0) {
          Alert.alert("Validation Error", "All rates must be greater than 0");
          return false;
        }
        if (slot.toHour <= slot.fromHour) {
          Alert.alert(
            "Validation Error",
            "To hour must be greater than from hour",
          );
          return false;
        }
      }
    }

    if (
      showPerDay &&
      perDayRate !== "" &&
      (isNaN(parseFloat(perDayRate)) || parseFloat(perDayRate) <= 0)
    ) {
      Alert.alert("Validation Error", "Per-day rate must be a positive number");
      return false;
    }

    return true;
  };

  const validateEditForm = () => {
    if (!editVehicleName) {
      Alert.alert("Validation Error", "Please select a vehicle type");
      return false;
    }
    if (!editSelectedLocation) {
      Alert.alert("Validation Error", "Please select a location");
      return false;
    }

    const hasPerDay =
      showEditPerDay && editPerDayRate !== "" && parseFloat(editPerDayRate) > 0;
    const hasHourlySlots = editTariffSlots.some((slot) => slot.rate > 0);

    if (!hasPerDay && !hasHourlySlots) {
      Alert.alert(
        "Validation Error",
        "Please fill either hourly slots or a per-day rate",
      );
      return false;
    }

    if (hasHourlySlots) {
      for (const slot of editTariffSlots) {
        if (slot.rate <= 0) {
          Alert.alert("Validation Error", "All rates must be greater than 0");
          return false;
        }
        if (slot.toHour <= slot.fromHour) {
          Alert.alert(
            "Validation Error",
            "To hour must be greater than from hour",
          );
          return false;
        }
      }
    }

    if (
      showEditPerDay &&
      editPerDayRate !== "" &&
      (isNaN(parseFloat(editPerDayRate)) || parseFloat(editPerDayRate) <= 0)
    ) {
      Alert.alert("Validation Error", "Per-day rate must be a positive number");
      return false;
    }

    return true;
  };

  const handleCreateTariff = async () => {
    if (!validateForm()) return;

    const maxToHour = Math.max(...tariffSlots.map((s) => s.toHour));

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/tariff/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vehicleName: vehicleName.trim(),
          locationId: selectedLocation?.id,
          tariffs: tariffSlots.map(({ fromHour, toHour, rate }) => ({
            fromHour,
            toHour,
            rate,
          })),
          perDayRate: showPerDay ? parseFloat(perDayRate) || 0 : 0,
          perDayFromHour: maxToHour,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Tariff created successfully", [
          {
            text: "OK",
            onPress: () => {
              resetForm();
              fetchTariffs();
              setSelectedTab("list");
            },
          },
        ]);
      } else {
        Alert.alert("Creation Failed", data.message || "Something went wrong");
      }
    } catch (error) {
      Alert.alert("Error", "Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTariff = async () => {
    if (!validateEditForm() || !editingTariff) return;

    const maxToHour = Math.max(...editTariffSlots.map((s) => s.toHour));

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/tariff/${editingTariff.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            vehicleName: editVehicleName.trim(),
            locationId: editSelectedLocation?.id,
            slots: editTariffSlots.map(({ fromHour, toHour, rate }) => ({
              fromHour,
              toHour,
              rate,
            })),
            perDayRate: showEditPerDay ? parseFloat(editPerDayRate) || 0 : 0,
            perDayFromHour: maxToHour,
          }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Tariff updated successfully", [
          {
            text: "OK",
            onPress: () => {
              setEditModalVisible(false);
              setEditingTariff(null);
              fetchTariffs();
            },
          },
        ]);
      } else {
        Alert.alert("Update Failed", data.message || "Something went wrong");
      }
    } catch (error: any) {
      console.log("UPDATE TARIFF ERROR:", error);
      Alert.alert("Error", error?.message || "Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTariff = (tariff: Tariff) => {
    Alert.alert(
      "Delete Tariff",
      "Are you sure you want to delete this tariff?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(
                `${API_BASE_URL}/tariff/${tariff.vehicleTypeId}/${tariff.locationId}`,
                {
                  method: "DELETE",
                },
              );

              if (response.ok) {
                setTariffs(
                  tariffs.filter(
                    (t) =>
                      !(
                        t.vehicleTypeId === tariff.vehicleTypeId &&
                        t.locationId === tariff.locationId
                      ),
                  ),
                );
                Alert.alert("Success", "Tariff deleted successfully");
              } else {
                Alert.alert("Error", "Failed to delete tariff");
              }
            } catch (error) {
              Alert.alert("Error", "Network error occurred");
            }
          },
        },
      ],
    );
  };

  const openEditModal = (tariff: Tariff) => {
    setEditingTariff(tariff);
    setEditVehicleName(tariff.vehicleName);
    const location = locations.find((l) => l.id === tariff.locationId);
    setEditSelectedLocation(location || null);
    setEditPerDayRate(
      tariff.perDayRate > 0 ? tariff.perDayRate.toString() : "",
    );
    setEditTariffSlots(
      tariff.slots.map((slot) => ({ ...slot, id: slot.id?.toString() })),
    );
    setEditModalVisible(true);
  };

  const resetForm = () => {
    setVehicleName("");
    setSelectedLocation(null);
    setTariffSlots([{ id: "1", fromHour: 0, toHour: 1, rate: 0 }]);
    setPerDayRate("");
  };

  const selectLocation = (location: Location) => {
    setSelectedLocation(location);
    setLocationDropdownVisible(false);
  };

  const selectVehicleType = (vType: VehicleType) => {
    setVehicleName(vType.type);
    setVehicleTypeDropdownVisible(false);
  };

  const selectEditVehicleType = (vType: VehicleType) => {
    setEditVehicleName(vType.type);
    setEditVehicleTypeDropdownVisible(false);
  };

  const selectEditLocation = (location: Location) => {
    setEditSelectedLocation(location);
    setEditLocationDropdownVisible(false);
  };

  // Group tariffs by vehicleName for list display
  const groupedTariffs = tariffs.reduce(
    (acc, t) => {
      if (!acc[t.vehicleName]) acc[t.vehicleName] = [];
      acc[t.vehicleName].push(t);
      return acc;
    },
    {} as Record<string, Tariff[]>,
  );

  const renderTariffCard = (item: Tariff) => {
    return (
      <TouchableOpacity
        key={`${item.vehicleTypeId}-${item.locationId}`}
        style={styles.tariffCard}
        activeOpacity={0.7}
        onPress={() => openEditModal(item)}
        onLongPress={() => handleDeleteTariff(item)}
      >
        <View style={styles.tariffCardHeader}>
          <View style={styles.tariffIconContainer}>
            <Text style={styles.tariffIcon}>💰</Text>
          </View>
          <View style={styles.tariffStatus}>
            <Text style={styles.tariffLocation}>{item.locationName}</Text>
          </View>
        </View>

        <Text style={styles.tariffVehicleName}>{item.vehicleName}</Text>

        <View style={styles.tariffSlotsContainer}>
          <Text style={styles.tariffSlotsTitle}>Rate Slots:</Text>
          {item.slots.map((slot, index) => (
            <View key={index} style={styles.tariffSlotRow}>
              <Text style={styles.tariffSlotText}>
                {slot.fromHour}h - {slot.toHour}h
              </Text>
              <Text style={styles.tariffSlotRate}>₹{slot.rate}</Text>
            </View>
          ))}
        </View>

        {/* Show per-day rate if set */}
        {item.perDayRate > 0 && (
          <View style={styles.perDayRateContainer}>
            <Text style={styles.perDayRateLabel}>📅 Per Day Rate:</Text>
            <Text style={styles.perDayRateValue}>₹{item.perDayRate} / day</Text>
          </View>
        )}

        <View style={styles.tariffActions}>
          <TouchableOpacity
            style={styles.tariffEditButton}
            onPress={() => openEditModal(item)}
          >
            <Text style={styles.tariffEditIcon}>✏️</Text>
            <Text style={styles.tariffEditText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tariffDeleteButton}
            onPress={() => handleDeleteTariff(item)}
          >
            <Text style={styles.tariffDeleteIcon}>🗑️</Text>
            <Text style={styles.tariffDeleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTariffSlots = (slots: TariffSlot[], isEdit: boolean = false) => {
    const currentSlots = isEdit ? editTariffSlots : tariffSlots;
    const setSlot = isEdit ? updateEditTariffSlot : updateTariffSlot;
    const removeRow = isEdit ? removeEditTariffRow : removeTariffRow;
    const addRow = isEdit ? addEditTariffRow : addTariffRow;

    return (
      <View style={styles.slotsContainer}>
        <View style={styles.slotsHeader}>
          <Text style={styles.slotsTitle}>Tariff Slots</Text>
          <TouchableOpacity style={styles.addSlotButton} onPress={addRow}>
            <Text style={styles.addSlotIcon}>+</Text>
            <Text style={styles.addSlotText}>Add Slot</Text>
          </TouchableOpacity>
        </View>

        {currentSlots.map((slot, index) => (
          <View key={slot.id || index} style={styles.slotRow}>
            <View style={styles.slotInputGroup}>
              <Text style={styles.slotLabel}>From</Text>
              <TextInput
                style={styles.slotInput}
                value={slot.fromHour.toString()}
                onChangeText={(value) => setSlot(index, "fromHour", value)}
                keyboardType="numeric"
                placeholder="0"
                editable={index === 0}
              />
            </View>

            <View style={styles.slotInputGroup}>
              <Text style={styles.slotLabel}>To</Text>
              <TextInput
                style={styles.slotInput}
                value={slot.toHour.toString()}
                onChangeText={(value) => setSlot(index, "toHour", value)}
                keyboardType="numeric"
                placeholder="1"
              />
            </View>

            <View style={styles.slotInputGroup}>
              <Text style={styles.slotLabel}>Rate (₹)</Text>
              <TextInput
                style={styles.slotInput}
                value={slot.rate.toString()}
                onChangeText={(value) => setSlot(index, "rate", value)}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>

            {currentSlots.length > 1 && (
              <TouchableOpacity
                style={styles.removeSlotButton}
                onPress={() => removeRow(index)}
              >
                <Text style={styles.removeSlotIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
    );
  };

  // Reusable per-day rate input for both create and edit
  const renderPerDayRateInput = (
    value: string,
    onChange: (v: string) => void,
    maxToHour: number,
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>
        Per-Day Rate (₹) — applied after {maxToHour} hours
      </Text>
      <View style={styles.inputWrapper}>
        <Text style={styles.inputIcon}>📅</Text>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          keyboardType="numeric"
          placeholder="Enter amount per day (optional)"
          placeholderTextColor="#999"
        />
      </View>
      <Text style={styles.perDayRateHint}>
        From hour: {maxToHour} → To hour: 0 (per day)
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#d32f2f" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Tariff Management</Text>
          <Text style={styles.headerSubtitle}>Manage parking rates</Text>
        </View>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "create" && styles.activeTab]}
          onPress={() => setSelectedTab("create")}
        >
          <Text
            style={[
              styles.tabIcon,
              selectedTab === "create" && styles.activeTabIcon,
            ]}
          >
            ➕
          </Text>
          <Text
            style={[
              styles.tabText,
              selectedTab === "create" && styles.activeTabText,
            ]}
          >
            Create Tariff
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "list" && styles.activeTab]}
          onPress={() => setSelectedTab("list")}
        >
          <Text
            style={[
              styles.tabIcon,
              selectedTab === "list" && styles.activeTabIcon,
            ]}
          >
            📋
          </Text>
          <Text
            style={[
              styles.tabText,
              selectedTab === "list" && styles.activeTabText,
            ]}
          >
            Tariff List ({tariffs.length})
          </Text>
        </TouchableOpacity>
      </View>

      {selectedTab === "create" ? (
        /* Create Tariff Form */
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.formCard}>
                {/* Form Title */}
                <View style={styles.formTitleContainer}>
                  <Text style={styles.formTitle}>Create New Tariff</Text>
                  <Text style={styles.formSubtitle}>Set up parking rates</Text>
                </View>

                {/* Vehicle Name Dropdown */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>
                    Vehicle Name <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => setVehicleTypeDropdownVisible(true)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.dropdownContent}>
                      <Text style={styles.dropdownIcon}>🚗</Text>
                      <Text
                        style={[
                          styles.dropdownText,
                          !vehicleName && styles.dropdownPlaceholder,
                        ]}
                      >
                        {vehicleName || "Select vehicle type"}
                      </Text>
                    </View>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                </View>

                {/* Location Dropdown */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>
                    Select Location <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => setLocationDropdownVisible(true)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.dropdownContent}>
                      <Text style={styles.dropdownIcon}>📍</Text>
                      <Text
                        style={[
                          styles.dropdownText,
                          !selectedLocation && styles.dropdownPlaceholder,
                        ]}
                      >
                        {selectedLocation
                          ? selectedLocation.name
                          : "Choose a location"}
                      </Text>
                    </View>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                </View>

                {/* Tariff Slots */}
                {renderTariffSlots(tariffSlots, false)}

                {/* Per-Day Rate — only shown when a slot has toHour > 96 */}
                {showPerDay &&
                  renderPerDayRateInput(
                    perDayRate,
                    setPerDayRate,
                    Math.max(...tariffSlots.map((s) => s.toHour)),
                  )}

                {/* Create Button */}
                <TouchableOpacity
                  style={[
                    styles.createButton,
                    loading && styles.createButtonDisabled,
                  ]}
                  onPress={handleCreateTariff}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Text style={styles.createButtonIcon}>✓</Text>
                      <Text style={styles.createButtonText}>Create Tariff</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      ) : (
        /* Tariff List — grouped by vehicle type */
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#d32f2f"]}
            />
          }
        >
          {Object.keys(groupedTariffs).length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>💰</Text>
              <Text style={styles.emptyText}>No tariffs found</Text>
              <Text style={styles.emptySubtext}>
                Tap the Create tab to add a tariff
              </Text>
            </View>
          ) : (
            Object.entries(groupedTariffs).map(([vName, items]) => (
              <View key={vName}>
                {/* Vehicle type header — tap to expand/collapse */}
                <TouchableOpacity
                  style={styles.vehicleGroupHeader}
                  onPress={() =>
                    setExpandedVehicle(expandedVehicle === vName ? null : vName)
                  }
                  activeOpacity={0.7}
                >
                  <View style={styles.vehicleGroupLeft}>
                    <View style={styles.vehicleGroupIconContainer}>
                      <Text style={styles.vehicleGroupIcon}>🚗</Text>
                    </View>
                    <Text style={styles.vehicleGroupName}>{vName}</Text>
                  </View>
                  <View style={styles.vehicleGroupRight}>
                    <Text style={styles.vehicleGroupCount}>
                      {items.length} location{items.length > 1 ? "s" : ""}
                    </Text>
                    <Text style={styles.vehicleGroupArrow}>
                      {expandedVehicle === vName ? "▲" : "▼"}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Expanded tariff cards for each location */}
                {expandedVehicle === vName &&
                  items.map((item) => renderTariffCard(item))}
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Create Location Selection Modal */}
      <Modal
        visible={locationDropdownVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setLocationDropdownVisible(false)}
      >
        <TouchableWithoutFeedback
          onPress={() => setLocationDropdownVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Location</Text>
                  <TouchableOpacity
                    onPress={() => setLocationDropdownVisible(false)}
                    style={styles.modalCloseButton}
                  >
                    <Text style={styles.modalCloseIcon}>✕</Text>
                  </TouchableOpacity>
                </View>

                {fetchingLocations ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#d32f2f" />
                    <Text style={styles.loadingText}>Loading locations...</Text>
                  </View>
                ) : (
                  <ScrollView style={styles.locationList}>
                    {locations.map((location) => (
                      <TouchableOpacity
                        key={location.id}
                        style={[
                          styles.locationItem,
                          selectedLocation?.id === location.id &&
                            styles.selectedLocationItem,
                        ]}
                        onPress={() => selectLocation(location)}
                      >
                        <Text style={styles.locationItemIcon}>📍</Text>
                        <Text style={styles.locationItemName}>
                          {location.name}
                        </Text>
                        {selectedLocation?.id === location.id && (
                          <Text style={styles.checkIcon}>✓</Text>
                        )}
                      </TouchableOpacity>
                    ))}

                    {locations.length === 0 && (
                      <View style={styles.emptyLocations}>
                        <Text style={styles.emptyIcon}>📍</Text>
                        <Text style={styles.emptyText}>
                          No locations available
                        </Text>
                      </View>
                    )}
                  </ScrollView>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Create Vehicle Type Selection Modal */}
      <Modal
        visible={vehicleTypeDropdownVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setVehicleTypeDropdownVisible(false)}
      >
        <TouchableWithoutFeedback
          onPress={() => setVehicleTypeDropdownVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Vehicle Type</Text>
                  <TouchableOpacity
                    onPress={() => setVehicleTypeDropdownVisible(false)}
                    style={styles.modalCloseButton}
                  >
                    <Text style={styles.modalCloseIcon}>✕</Text>
                  </TouchableOpacity>
                </View>

                {fetchingVehicleTypes ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#d32f2f" />
                    <Text style={styles.loadingText}>
                      Loading vehicle types...
                    </Text>
                  </View>
                ) : (
                  <ScrollView style={styles.locationList}>
                    {vehicleTypes.map((vType) => (
                      <TouchableOpacity
                        key={vType.id}
                        style={[
                          styles.locationItem,
                          vehicleName === vType.type &&
                            styles.selectedLocationItem,
                        ]}
                        onPress={() => selectVehicleType(vType)}
                      >
                        <Text style={styles.locationItemIcon}>
                          {vType.icon}
                        </Text>
                        <Text style={styles.locationItemName}>
                          {vType.type}
                        </Text>
                        {vehicleName === vType.type && (
                          <Text style={styles.checkIcon}>✓</Text>
                        )}
                      </TouchableOpacity>
                    ))}

                    {vehicleTypes.length === 0 && (
                      <View style={styles.emptyLocations}>
                        <Text style={styles.emptyIcon}>🚗</Text>
                        <Text style={styles.emptyText}>
                          No vehicle types available
                        </Text>
                      </View>
                    )}
                  </ScrollView>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Edit Vehicle Type Selection Modal */}
      <Modal
        visible={editVehicleTypeDropdownVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditVehicleTypeDropdownVisible(false)}
      >
        <TouchableWithoutFeedback
          onPress={() => setEditVehicleTypeDropdownVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Vehicle Type</Text>
                  <TouchableOpacity
                    onPress={() => setEditVehicleTypeDropdownVisible(false)}
                    style={styles.modalCloseButton}
                  >
                    <Text style={styles.modalCloseIcon}>✕</Text>
                  </TouchableOpacity>
                </View>

                {fetchingVehicleTypes ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#d32f2f" />
                    <Text style={styles.loadingText}>
                      Loading vehicle types...
                    </Text>
                  </View>
                ) : (
                  <ScrollView style={styles.locationList}>
                    {vehicleTypes.map((vType) => (
                      <TouchableOpacity
                        key={vType.id}
                        style={[
                          styles.locationItem,
                          editVehicleName === vType.type &&
                            styles.selectedLocationItem,
                        ]}
                        onPress={() => selectEditVehicleType(vType)}
                      >
                        <Text style={styles.locationItemIcon}>
                          {vType.icon}
                        </Text>
                        <Text style={styles.locationItemName}>
                          {vType.type}
                        </Text>
                        {editVehicleName === vType.type && (
                          <Text style={styles.checkIcon}>✓</Text>
                        )}
                      </TouchableOpacity>
                    ))}

                    {vehicleTypes.length === 0 && (
                      <View style={styles.emptyLocations}>
                        <Text style={styles.emptyIcon}>🚗</Text>
                        <Text style={styles.emptyText}>
                          No vehicle types available
                        </Text>
                      </View>
                    )}
                  </ScrollView>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Edit Tariff Modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setEditModalVisible(false);
          setEditingTariff(null);
        }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={[styles.modalContent, styles.editModalContent]}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Edit Tariff</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setEditModalVisible(false);
                      setEditingTariff(null);
                    }}
                    style={styles.modalCloseButton}
                  >
                    <Text style={styles.modalCloseIcon}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.modalBody}>
                    {/* Edit Vehicle Name Dropdown */}
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>
                        Vehicle Name <Text style={styles.requiredStar}>*</Text>
                      </Text>
                      <TouchableOpacity
                        style={styles.dropdownButton}
                        onPress={() => setEditVehicleTypeDropdownVisible(true)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.dropdownContent}>
                          <Text style={styles.dropdownIcon}>🚗</Text>
                          <Text
                            style={[
                              styles.dropdownText,
                              !editVehicleName && styles.dropdownPlaceholder,
                            ]}
                          >
                            {editVehicleName || "Select vehicle type"}
                          </Text>
                        </View>
                        <Text style={styles.dropdownArrow}>▼</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Edit Location Dropdown */}
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>
                        Select Location{" "}
                        <Text style={styles.requiredStar}>*</Text>
                      </Text>
                      <TouchableOpacity
                        style={styles.dropdownButton}
                        onPress={() => setEditLocationDropdownVisible(true)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.dropdownContent}>
                          <Text style={styles.dropdownIcon}>📍</Text>
                          <Text
                            style={[
                              styles.dropdownText,
                              !editSelectedLocation &&
                                styles.dropdownPlaceholder,
                            ]}
                          >
                            {editSelectedLocation
                              ? editSelectedLocation.name
                              : "Choose a location"}
                          </Text>
                        </View>
                        <Text style={styles.dropdownArrow}>▼</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Edit Tariff Slots */}
                    {renderTariffSlots(editTariffSlots, true)}

                    {/* Per-Day Rate in edit modal — only shown when a slot has toHour > 96 */}
                    {showEditPerDay &&
                      renderPerDayRateInput(
                        editPerDayRate,
                        setEditPerDayRate,
                        Math.max(...editTariffSlots.map((s) => s.toHour)),
                      )}

                    {/* Update Button */}
                    <TouchableOpacity
                      style={[
                        styles.createButton,
                        loading && styles.createButtonDisabled,
                      ]}
                      onPress={handleUpdateTariff}
                      disabled={loading}
                      activeOpacity={0.8}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <Text style={styles.createButtonIcon}>✓</Text>
                          <Text style={styles.createButtonText}>
                            Update Tariff
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Edit Location Selection Modal */}
      <Modal
        visible={editLocationDropdownVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditLocationDropdownVisible(false)}
      >
        <TouchableWithoutFeedback
          onPress={() => setEditLocationDropdownVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Location</Text>
                  <TouchableOpacity
                    onPress={() => setEditLocationDropdownVisible(false)}
                    style={styles.modalCloseButton}
                  >
                    <Text style={styles.modalCloseIcon}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.locationList}>
                  {locations.map((location) => (
                    <TouchableOpacity
                      key={location.id}
                      style={[
                        styles.locationItem,
                        editSelectedLocation?.id === location.id &&
                          styles.selectedLocationItem,
                      ]}
                      onPress={() => selectEditLocation(location)}
                    >
                      <Text style={styles.locationItemIcon}>📍</Text>
                      <Text style={styles.locationItemName}>
                        {location.name}
                      </Text>
                      {editSelectedLocation?.id === location.id && (
                        <Text style={styles.checkIcon}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
    elevation: 4,
    shadowColor: "#d32f2f",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
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
    marginTop: 2,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: "#d32f2f",
  },
  tabIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  activeTabIcon: {
    color: "#fff",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  activeTabText: {
    color: "#fff",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  formTitleContainer: {
    marginBottom: 25,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  formSubtitle: {
    fontSize: 14,
    color: "#666",
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
  requiredStar: {
    color: "#d32f2f",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    paddingHorizontal: 12,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 10,
    opacity: 0.5,
  },
  input: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: "#333",
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    paddingHorizontal: 12,
    paddingVertical: 15,
  },
  dropdownContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  dropdownIcon: {
    fontSize: 18,
    marginRight: 10,
    opacity: 0.5,
  },
  dropdownText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  dropdownPlaceholder: {
    color: "#999",
  },
  dropdownArrow: {
    fontSize: 14,
    color: "#666",
  },
  slotsContainer: {
    marginBottom: 20,
  },
  slotsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  slotsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  addSlotButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(211, 47, 47, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addSlotIcon: {
    fontSize: 16,
    color: "#d32f2f",
    marginRight: 4,
    fontWeight: "bold",
  },
  addSlotText: {
    fontSize: 12,
    color: "#d32f2f",
    fontWeight: "600",
  },
  slotRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: "#f8f9fa",
    padding: 10,
    borderRadius: 12,
  },
  slotInputGroup: {
    flex: 1,
    marginRight: 8,
  },
  slotLabel: {
    fontSize: 10,
    color: "#666",
    marginBottom: 2,
  },
  slotInput: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  removeSlotButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(211, 47, 47, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 4,
  },
  removeSlotIcon: {
    fontSize: 14,
    color: "#d32f2f",
    fontWeight: "bold",
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#d32f2f",
    padding: 18,
    borderRadius: 12,
    marginTop: 10,
    elevation: 3,
    shadowColor: "#d32f2f",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  createButtonDisabled: {
    backgroundColor: "#ffb3b3",
  },
  createButtonIcon: {
    fontSize: 20,
    color: "#fff",
    marginRight: 10,
    fontWeight: "bold",
  },
  createButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  listContent: {
    padding: 20,
    paddingBottom: 30,
  },
  vehicleGroupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  vehicleGroupLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  vehicleGroupIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(211, 47, 47, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  vehicleGroupIcon: {
    fontSize: 20,
  },
  vehicleGroupName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  vehicleGroupRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  vehicleGroupCount: {
    fontSize: 13,
    color: "#888",
  },
  vehicleGroupArrow: {
    fontSize: 13,
    color: "#d32f2f",
    fontWeight: "bold",
  },
  tariffCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    marginLeft: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: 3,
    borderLeftColor: "#d32f2f",
  },
  tariffCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  tariffIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(211, 47, 47, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  tariffIcon: {
    fontSize: 24,
  },
  tariffStatus: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tariffLocation: {
    fontSize: 12,
    color: "#666",
  },
  tariffVehicleName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  tariffSlotsContainer: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  tariffSlotsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  tariffSlotRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  tariffSlotText: {
    fontSize: 14,
    color: "#333",
  },
  tariffSlotRate: {
    fontSize: 14,
    fontWeight: "600",
    color: "#d32f2f",
  },
  perDayRateContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(211, 47, 47, 0.06)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(211, 47, 47, 0.15)",
  },
  perDayRateLabel: {
    fontSize: 13,
    color: "#555",
    fontWeight: "600",
  },
  perDayRateValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#d32f2f",
  },
  perDayRateHint: {
    fontSize: 11,
    color: "#888",
    marginTop: 6,
    fontStyle: "italic",
  },
  tariffActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 12,
  },
  tariffEditButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(33, 150, 243, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  tariffEditIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  tariffEditText: {
    fontSize: 12,
    color: "#2196F3",
    fontWeight: "600",
  },
  tariffDeleteButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(211, 47, 47, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tariffDeleteIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  tariffDeleteText: {
    fontSize: 12,
    color: "#d32f2f",
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 15,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: "80%",
  },
  editModalContent: {
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseIcon: {
    fontSize: 18,
    color: "#666",
    fontWeight: "bold",
  },
  modalBody: {
    padding: 20,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#666",
  },
  locationList: {
    padding: 20,
  },
  locationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  selectedLocationItem: {
    backgroundColor: "rgba(211, 47, 47, 0.05)",
    borderColor: "#d32f2f",
  },
  locationItemIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  locationItemName: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  checkIcon: {
    fontSize: 18,
    color: "#d32f2f",
    fontWeight: "bold",
    marginLeft: 10,
  },
  emptyLocations: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
});
