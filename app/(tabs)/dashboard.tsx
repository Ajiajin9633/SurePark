import { API_BASE_URL } from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";


// Define the Vehicle Type interface (simplified - no icons)
interface VehicleType {
  id: string;
  name: string;
}

export default function EntryTab() {
  const [user, setUser] = useState<any>(null);
  // Vehicle number parts
  const [stateCode, setStateCode] = useState("KL");
  const [districtCode, setDistrictCode] = useState("");
  const [seriesCode, setSeriesCode] = useState("");
  const [number, setNumber] = useState("");
  
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleType | null>(null);
  const [driverName, setDriverName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dropdown state
  const [stateDropdownVisible, setStateDropdownVisible] = useState(false);
  
  // Advance payment modal states
  const [advanceModalVisible, setAdvanceModalVisible] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [tempVehicleData, setTempVehicleData] = useState<any>(null);

  // Keyboard state
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  const STATE_CODES = ["KL", "TN", "KA", "AP"];
useEffect(() => {
  loadUser();
}, []);

const loadUser = async () => {
  const storedUser = await AsyncStorage.getItem("user");
  if (storedUser) {
    setUser(JSON.parse(storedUser));
  }
};
  // Fetch vehicle types from API
  useEffect(() => {
    fetchVehicleTypes();
  }, []);

  const fetchVehicleTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/VehicleTypes`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch vehicle types');
      }
      
      const data = await response.json();
      
      const transformedData = data.map((item: any) => ({
        id: item.id.toString(),
        name: item.name
      }));
      
      setVehicleTypes(transformedData);
      
      if (transformedData.length > 0) {
        setSelectedVehicleType(transformedData[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching vehicle types:', err);
      
      const fallbackTypes = getDefaultVehicleTypes();
      setVehicleTypes(fallbackTypes);
      setSelectedVehicleType(fallbackTypes[0]);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultVehicleTypes = (): VehicleType[] => {
    return [
      { id: '1', name: 'Car' },
      { id: '2', name: 'Bike' },
      { id: '3', name: 'Truck' },
      { id: '4', name: 'Van' },
      { id: '5', name: 'Bus' },
      { id: '6', name: 'Auto' },
    ];
  };

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        setKeyboardOffset(e.endCoordinates.height);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardOffset(0);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleStateButtonPress = () => {
    Keyboard.dismiss();
    setStateDropdownVisible(!stateDropdownVisible);
  };

  const handleStateSelect = (code: string) => {
    setStateCode(code);
    setStateDropdownVisible(false);
  };

  const handleCheckIn = () => {
    Keyboard.dismiss();
    if (!number.trim()) {
      Alert.alert("Required", "Please enter vehicle number");
      return;
    }

    if (!selectedVehicleType) {
      Alert.alert("Required", "Please select vehicle type");
      return;
    }

    // Updated validation to allow alphanumeric for district and series
    if (districtCode && !/^[A-Z0-9]{1,2}$/.test(districtCode)) {
      Alert.alert("Invalid", "District code should contain only letters and numbers");
      return;
    }
    if (seriesCode && !/^[A-Z0-9]{1,2}$/.test(seriesCode)) {
      Alert.alert("Invalid", "Series code should contain only letters and numbers");
      return;
    }

    const finalDistrictCode = districtCode || "XX";
    const finalSeriesCode = seriesCode || "XX";
    
    const fullVehicleNumber = `${stateCode} ${finalDistrictCode} ${finalSeriesCode} ${number}`;
    
    setTempVehicleData({
      vehicleNumber: fullVehicleNumber,
      vehicleType: selectedVehicleType,
      driverName: driverName.trim() || undefined,
    });
    
    setAdvanceModalVisible(true);
  };

const handleAdvanceSubmit = async () => {
  Keyboard.dismiss();
  
  if (!advanceAmount.trim()) {
    Alert.alert("Required", "Please enter advance amount");
    return;
  }

  const amount = parseFloat(advanceAmount);
  if (isNaN(amount) || amount <= 0) {
    Alert.alert("Invalid", "Please enter a valid amount");
    return;
  }

  if (!user) {
    Alert.alert("Error", "User not found. Please login again.");
    return;
  }

  // ✅ Debug: Log the user object to see what's inside
  console.log("Full User Object:", user);
  console.log("User ID:", user.userId);
  console.log("User ID Type:", typeof user.userId);

  // ✅ Ensure userId is parsed as a number (not string)
  const createdStaffId = parseInt(user.userId) || 0;

  if (createdStaffId === 0) {
    Alert.alert("Error", "Invalid user ID. Please login again.");
    return;
  }

  const apiPayload = {
    vehicleNumber: tempVehicleData.vehicleNumber,
    vehicleOwnerNumber: "",
    vehicleTypeId: parseInt(tempVehicleData.vehicleType.id), // ✅ Parse as int
    advanceAmount: amount, // ✅ Use parsed amount
    createdStaffId: createdStaffId // ✅ Use parsed staff ID
  };

  console.log("API Payload:", apiPayload);

  try {
    const response = await fetch(`${API_BASE_URL}/Parking/CheckIn`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(apiPayload)
    });

    const result = await response.json();

    if (response.ok) {
      Alert.alert("Success", "Vehicle checked in successfully!");
      
      // Reset form
      setSubmitted(true);
      setTimeout(() => {
        setStateCode("KL");
        setDistrictCode("");
        setSeriesCode("");
        setNumber("");
        setDriverName("");
        setAdvanceAmount("");
        setAdvanceModalVisible(false);
        setTempVehicleData(null);
        setSubmitted(false);
      }, 2000);
    } else {
      Alert.alert("Error", result.message || "Check-in failed");
      console.error("API Error:", result);
    }

    console.log("Response:", result);

  } catch (error) {
    console.error("Checkin error:", error);
    Alert.alert("Error", "Failed to connect to server");
  }
};
  const closeAdvanceModal = () => {
    setAdvanceModalVisible(false);
    setAdvanceAmount("");
    setTempVehicleData(null);
  };

  const handleOutsidePress = () => {
    if (stateDropdownVisible) {
      setStateDropdownVisible(false);
    }
    Keyboard.dismiss();
  };

  // Updated to accept both letters and numbers
  const formatAlphanumericInput = (text: string) => {
    return text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 2);
  };

  const formatNumberInput = (text: string) => {
    return text.replace(/[^0-9]/g, '').slice(0, 4);
  };

  const renderVehicleTypeChip = (type: VehicleType) => {
    const isActive = selectedVehicleType?.id === type.id;
    
    return (
      <TouchableOpacity
        key={type.id}
        style={[styles.typeChip, isActive && styles.typeChipActive]}
        onPress={() => {
          setSelectedVehicleType(type);
          setStateDropdownVisible(false);
        }}
      >
        <Text style={[styles.typeChipText, isActive && styles.typeChipTextActive]}>
          {type.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={handleOutsidePress}>
      <View style={{ flex: 1 }}>
        <ScrollView 
          contentContainerStyle={[
            styles.tabContent,
            { paddingBottom: keyboardOffset > 0 ? keyboardOffset + 20 : 32 }
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🚗 Vehicle Entry</Text>
            <Text style={styles.cardSubtitle}>Log a new vehicle entering the parking</Text>

            <Text style={styles.fieldLabel}>Vehicle Number *</Text>
            
            {/* Vehicle Number Input Container with Dropdown */}
            <View style={styles.vehicleNumberContainer}>
              <View style={styles.vehicleNumberRow}>
                {/* State Code Dropdown Button */}
                <TouchableOpacity 
                  style={styles.vehicleNumberPart}
                  onPress={handleStateButtonPress}
                  activeOpacity={0.7}
                >
                  <Text style={styles.vehicleNumberPartText}>{stateCode}</Text>
                  <Text style={styles.dropdownIcon}>▼</Text>
                </TouchableOpacity>

                {/* District Code Input - Now accepts letters AND numbers */}
                <TextInput
                  style={styles.vehicleNumberPart}
                  value={districtCode}
                  onChangeText={(text) => setDistrictCode(formatAlphanumericInput(text))}
                  maxLength={2}
                  placeholder="XX"
                  placeholderTextColor="#999"
                  autoCapitalize="characters"
                  keyboardType="default"
                  onFocus={() => setStateDropdownVisible(false)}
                />

                {/* Series Code Input - Now accepts letters AND numbers */}
                <TextInput
                  style={styles.vehicleNumberPart}
                  value={seriesCode}
                  onChangeText={(text) => setSeriesCode(formatAlphanumericInput(text))}
                  maxLength={2}
                  placeholder="XX"
                  placeholderTextColor="#999"
                  autoCapitalize="characters"
                  keyboardType="default"
                  onFocus={() => setStateDropdownVisible(false)}
                />

                {/* Number Input - Only Numbers */}
                <TextInput
                  style={[styles.vehicleNumberPart, styles.vehicleNumberInput]}
                  value={number}
                  onChangeText={(text) => setNumber(formatNumberInput(text))}
                  placeholder="0000"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  maxLength={4}
                  onFocus={() => setStateDropdownVisible(false)}
                />
              </View>

              {/* State Dropdown - positioned relative to container */}
              {stateDropdownVisible && (
                <>
                  <TouchableWithoutFeedback onPress={() => setStateDropdownVisible(false)}>
                    <View style={styles.dropdownBackdrop} />
                  </TouchableWithoutFeedback>
                  
                  <View style={styles.stateDropdown}>
                    {STATE_CODES.map((code) => (
                      <TouchableOpacity
                        key={code}
                        style={[
                          styles.stateOption,
                          code === stateCode && styles.stateOptionActive
                        ]}
                        onPress={() => handleStateSelect(code)}
                      >
                        <Text style={[
                          styles.stateOptionText,
                          code === stateCode && styles.stateOptionTextActive
                        ]}>
                          {code}
                        </Text>
                        {code === stateCode && (
                          <Text style={styles.checkIcon}>✓</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </View>

            <Text style={styles.fieldLabel}>Driver Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter driver name (optional)"
              placeholderTextColor="#aaa"
              value={driverName}
              onChangeText={setDriverName}
              onFocus={() => setStateDropdownVisible(false)}
            />

            <Text style={styles.fieldLabel}>Vehicle Type *</Text>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#DC2626" />
                <Text style={styles.loadingText}>Loading vehicle types...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Error: {error}</Text>
                <TouchableOpacity onPress={fetchVehicleTypes} style={styles.retryButton}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.typeRow}>
                {vehicleTypes.map((type) => renderVehicleTypeChip(type))}
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitButton, submitted && styles.submitButtonSuccess]}
              onPress={handleCheckIn}
              disabled={submitted || loading || !selectedVehicleType}
            >
              <Text style={styles.submitButtonText}>
                {submitted ? "✅ Checked In!" : "Check In"}
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

        {/* Advance Payment Modal */}
        <Modal
          visible={advanceModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={closeAdvanceModal}
        >
          <TouchableWithoutFeedback onPress={closeAdvanceModal}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={[
                  styles.modalContent,
                  keyboardOffset > 0 && { marginBottom: keyboardOffset / 2 }
                ]}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Advance Payment</Text>
                    <TouchableOpacity onPress={closeAdvanceModal} style={styles.modalCloseButton}>
                      <Text style={styles.modalCloseIcon}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.modalBody}>
                    {tempVehicleData && (
                      <View style={styles.vehiclePreview}>
                        <Text style={styles.previewLabel}>Vehicle Number</Text>
                        <Text style={styles.previewValue}>{tempVehicleData.vehicleNumber}</Text>
                        <View style={styles.previewDivider} />
                        <Text style={styles.previewLabel}>Vehicle Type</Text>
                        <Text style={styles.previewValue}>{tempVehicleData.vehicleType.name}</Text>
                        {tempVehicleData.driverName && (
                          <>
                            <View style={styles.previewDivider} />
                            <Text style={styles.previewLabel}>Driver</Text>
                            <Text style={styles.previewValue}>{tempVehicleData.driverName}</Text>
                          </>
                        )}
                      </View>
                    )}

                    <Text style={styles.modalLabel}>Advance Amount (₹) *</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Enter amount"
                      placeholderTextColor="#999"
                      value={advanceAmount}
                      onChangeText={setAdvanceAmount}
                      keyboardType="numeric"
                      autoFocus={true}
                    />

                    <View style={styles.modalActions}>
                      <TouchableOpacity 
                        style={styles.modalCancelButton}
                        onPress={closeAdvanceModal}
                      >
                        <Text style={styles.modalCancelText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.modalSubmitButton}
                        onPress={handleAdvanceSubmit}
                      >
                        <Text style={styles.modalSubmitText}>Check In</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  tabContent: { 
    padding: 16, 
    paddingBottom: 32,
    flexGrow: 1,
  },
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
  vehicleNumberContainer: {
    position: 'relative',
    marginBottom: 16,
    zIndex: 1000,
  },
  vehicleNumberRow: {
    flexDirection: "row",
    gap: 8,
  },
  vehicleNumberPart: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#e8e8e8",
    borderRadius: 12,
    padding: 13,
    fontSize: 15,
    backgroundColor: "#fafafa",
    color: "#222",
    textAlign: "center",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  vehicleNumberInput: {
    flex: 2,
  },
  vehicleNumberPartText: {
    fontSize: 15,
    color: "#222",
    fontWeight: "600",
  },
  dropdownIcon: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  dropdownBackdrop: {
    position: 'absolute',
    top: 0,
    left: -18,
    right: -18,
    bottom: -1000,
    zIndex: 998,
  },
  stateDropdown: {
    position: "absolute",
    top: 52,
    left: 0,
    width: 80,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e8e8e8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 999,
    overflow: 'hidden',
  },
  stateOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  stateOptionActive: {
    backgroundColor: "rgba(220, 38, 38, 0.05)",
  },
  stateOptionText: {
    fontSize: 16,
    color: "#333",
  },
  stateOptionTextActive: {
    color: "#DC2626",
    fontWeight: "600",
  },
  checkIcon: {
    fontSize: 16,
    color: "#DC2626",
    fontWeight: "bold",
  },
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#DC2626',
    marginBottom: 10,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  typeRow: { 
    flexDirection: "row", 
    gap: 10, 
    flexWrap: "wrap", 
    marginBottom: 4 
  },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    backgroundColor: "#fafafa",
  },
  typeChipActive: { 
    backgroundColor: "#DC2626", 
    borderColor: "#DC2626" 
  },
  typeChipText: { 
    fontSize: 14, 
    color: "#555", 
    fontWeight: "500" 
  },
  typeChipTextActive: { 
    color: "#fff" 
  },
  submitButton: {
    backgroundColor: "#DC2626",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  submitButtonSuccess: { backgroundColor: "#16a34a" },
  submitButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  summaryRow: { flexDirection: "row", justifyContent: "space-around", paddingTop: 8 },
  summaryItem: { alignItems: "center" },
  summaryNumber: { fontSize: 28, fontWeight: "800", color: "#DC2626" },
  summaryLabel: { fontSize: 12, color: "#888", marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: "#f0f0f0" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "90%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
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
  vehiclePreview: {
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  previewLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  previewValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  previewDivider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 8,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: "#e8e8e8",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    backgroundColor: "#fafafa",
    color: "#222",
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },
  modalSubmitButton: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    backgroundColor: "#DC2626",
    alignItems: "center",
  },
  modalSubmitText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
});