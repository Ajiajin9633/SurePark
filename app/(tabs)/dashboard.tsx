import { useEffect, useRef, useState } from "react";
import {
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

export default function EntryTab() {
  // Vehicle number parts
  const [stateCode, setStateCode] = useState("KL");
  const [districtCode, setDistrictCode] = useState("");
  const [seriesCode, setSeriesCode] = useState("");
  const [number, setNumber] = useState("");
  
  const [vehicleType, setVehicleType] = useState("Car");
  const [driverName, setDriverName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  
  // Dropdown state
  const [stateDropdownVisible, setStateDropdownVisible] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const stateButtonRef = useRef<any>(null);
  
  // Advance payment modal states
  const [advanceModalVisible, setAdvanceModalVisible] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [tempVehicleData, setTempVehicleData] = useState<any>(null);

  // Keyboard state
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  const VEHICLE_TYPES = ["Car", "Bike", "Truck", "Van"];
  
  // Only 4 state codes as requested
  const STATE_CODES = ["KL", "TN", "KA", "AP"];

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

  // Measure button position for dropdown - FIXED VERSION
  const measureButtonPosition = () => {
    if (stateButtonRef.current) {
      stateButtonRef.current.measureInWindow((x: number, y: number, width: number, height: number) => {
        setDropdownPosition({
          top: y + height + 2,
          left: x,
          width: width,
        });
      });
    }
  };

  const handleStateButtonPress = () => {
    Keyboard.dismiss();
    // Small delay to ensure keyboard is dismissed before measuring
    setTimeout(() => {
      measureButtonPosition();
      setStateDropdownVisible(true);
    }, 100);
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

    // Validate district and series codes (optional but should be letters if entered)
    if (districtCode && !/^[A-Z]{1,2}$/.test(districtCode)) {
      Alert.alert("Invalid", "District code should contain only letters");
      return;
    }
    if (seriesCode && !/^[A-Z]{1,2}$/.test(seriesCode)) {
      Alert.alert("Invalid", "Series code should contain only letters");
      return;
    }

    // Construct full vehicle number (use placeholder values if empty)
    const finalDistrictCode = districtCode || "XX";
    const finalSeriesCode = seriesCode || "XX";
    
    const fullVehicleNumber = `${stateCode} ${finalDistrictCode} ${finalSeriesCode} ${number}`;
    
    // Store vehicle data temporarily
    setTempVehicleData({
      vehicleNumber: fullVehicleNumber,
      vehicleType,
      driverName: driverName.trim() || undefined,
    });
    
    // Show advance payment modal
    setAdvanceModalVisible(true);
  };

  const handleAdvanceSubmit = () => {
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

    // Here you would call your API with both vehicle data and advance amount
    console.log("Vehicle Data:", tempVehicleData);
    console.log("Advance Amount:", amount);

    setSubmitted(true);
    setTimeout(() => {
      // Reset all fields
      setStateCode("KL");
      setDistrictCode("");
      setSeriesCode("");
      setNumber("");
      setDriverName("");
      setVehicleType("Car");
      setAdvanceAmount("");
      setAdvanceModalVisible(false);
      setTempVehicleData(null);
      setSubmitted(false);
    }, 2000);
  };

  const closeAdvanceModal = () => {
    setAdvanceModalVisible(false);
    setAdvanceAmount("");
    setTempVehicleData(null);
  };

  // Close dropdown when tapping outside
  const handleOutsidePress = () => {
    if (stateDropdownVisible) {
      setStateDropdownVisible(false);
    }
    Keyboard.dismiss();
  };

  // Format input to only allow letters and uppercase
  const formatLetterInput = (text: string) => {
    return text.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
  };

  // Format number input to only allow digits
  const formatNumberInput = (text: string) => {
    return text.replace(/[^0-9]/g, '').slice(0, 4);
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
            
            {/* Vehicle Number Input Row */}
            <View style={styles.vehicleNumberRow}>
              {/* State Code Dropdown Button */}
              <TouchableOpacity 
                ref={stateButtonRef}
                style={styles.vehicleNumberPart}
                onPress={handleStateButtonPress}
                activeOpacity={0.7}
              >
                <Text style={styles.vehicleNumberPartText}>{stateCode}</Text>
                <Text style={styles.dropdownIcon}>▼</Text>
              </TouchableOpacity>

              {/* District Code Input - Only Letters */}
              <TextInput
                style={styles.vehicleNumberPart}
                value={districtCode}
                onChangeText={(text) => setDistrictCode(formatLetterInput(text))}
                maxLength={2}
                placeholder="XX"
                placeholderTextColor="#999"
                autoCapitalize="characters"
                keyboardType="default"
                onFocus={() => setStateDropdownVisible(false)}
              />

              {/* Series Code Input - Only Letters */}
              <TextInput
                style={styles.vehicleNumberPart}
                value={seriesCode}
                onChangeText={(text) => setSeriesCode(formatLetterInput(text))}
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

            {/* State Dropdown - positioned absolutely */}
            {stateDropdownVisible && (
              <>
                {/* Overlay to capture touches outside */}
                <TouchableWithoutFeedback onPress={() => setStateDropdownVisible(false)}>
                  <View style={styles.dropdownOverlay} />
                </TouchableWithoutFeedback>
                
                {/* Dropdown */}
                <View 
                  style={[
                    styles.stateDropdown,
                    {
                      top: dropdownPosition.top,
                      left: dropdownPosition.left,
                      width: dropdownPosition.width,
                    }
                  ]}
                >
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

            <Text style={styles.fieldLabel}>Driver Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter driver name (optional)"
              placeholderTextColor="#aaa"
              value={driverName}
              onChangeText={setDriverName}
              onFocus={() => setStateDropdownVisible(false)}
            />

            <Text style={styles.fieldLabel}>Vehicle Type</Text>
            <View style={styles.typeRow}>
              {VEHICLE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeChip, vehicleType === type && styles.typeChipActive]}
                  onPress={() => {
                    setVehicleType(type);
                    setStateDropdownVisible(false);
                  }}
                >
                  <Text style={[styles.typeChipText, vehicleType === type && styles.typeChipTextActive]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.submitButton, submitted && styles.submitButtonSuccess]}
              onPress={handleCheckIn}
              disabled={submitted}
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
                        <Text style={styles.previewValue}>{tempVehicleData.vehicleType}</Text>
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
  vehicleNumberRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
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
  },
  dropdownIcon: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  // Dropdown overlay
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 999,
  },
  // State Dropdown Styles
  stateDropdown: {
    position: "absolute",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e8e8e8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
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
  summaryRow: { flexDirection: "row", justifyContent: "space-around", paddingTop: 8 },
  summaryItem: { alignItems: "center" },
  summaryNumber: { fontSize: 28, fontWeight: "800", color: "#DC2626" },
  summaryLabel: { fontSize: 12, color: "#888", marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: "#f0f0f0" },

  // Modal Styles
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