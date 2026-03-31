import { apiFetch } from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";

interface Vehicle {
  id: number;
  number: string;
  entry: string;
  vehicleType: string;
  advanceAmount?: number;
}

interface ExitPreview {
  vehicleId: number;
  vehicleNumber: string;
  checkIn: string;
  checkOut: string;
  totalHours: number;
  totalAmount: number;
  advance: number;
  balanceToPay: number;
  refundAmount: number;
}

export default function ExitTab() {
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Exit preview modal states
  const [exitPreviewVisible, setExitPreviewVisible] = useState(false);
  const [exitPreview, setExitPreview] = useState<ExitPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [tariffError, setTariffError] = useState<string | null>(null);

  // Editable amount states
  const [editedTotalAmount, setEditedTotalAmount] = useState("");
  const [editedBalanceAmount, setEditedBalanceAmount] = useState("");
  const [editedRefundAmount, setEditedRefundAmount] = useState("");

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

  useEffect(() => {
    if (vehicleNumber.trim() === "") {
      setFilteredVehicles(vehicles.slice(0, 25));
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

      const url = `/Parking/ActiveVehicles/${userId}`;
      const response = await apiFetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch vehicles: ${response.status}`);
      }

      const data = await response.json();
      
      const sortedData = data.sort((a: Vehicle, b: Vehicle) => {
        const dateA = new Date(a.entry).getTime();
        const dateB = new Date(b.entry).getTime();
        return dateB - dateA;
      });
      
      setVehicles(sortedData);
      setFilteredVehicles(sortedData.slice(0, 25));
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

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', { 
        month: 'short',
        day: 'numeric',
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

  const loadExitPreview = async (vehicleId: number) => {
    try {
      setLoadingPreview(true);
      setTariffError(null);

      const storedUser = await AsyncStorage.getItem("user");
      if (!storedUser) {
        Alert.alert("Error", "User not found");
        return;
      }

      const user = JSON.parse(storedUser);
      const userId = user.userId || user.id;

      const response = await apiFetch(
        `/Parking/exit-preview/${vehicleId}/${userId}`
      );

      const data = await response.json();

      if (!response.ok) {
        // Check for tariff not found error
        if (response.status === 404 || data.message?.toLowerCase().includes('tariff') || data.message?.toLowerCase().includes('rate')) {
          setTariffError(data.message || "No tariff configuration found for this vehicle type");
          setExitPreviewVisible(true);
          setExitPreview(null);
        } else {
          throw new Error(data.message || "Failed to load exit preview");
        }
        return;
      }

      setExitPreview(data);
      
      // Initialize edit fields with original values
      setEditedTotalAmount(data.totalAmount.toString());
      setEditedBalanceAmount(data.balanceToPay.toString());
      setEditedRefundAmount(data.refundAmount.toString());
      
      setExitPreviewVisible(true);
    } catch (error) {
      console.error("Exit preview error:", error);
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to load preview");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleExit = (vehicle: Vehicle) => {
    loadExitPreview(vehicle.id);
  };

  const handleTotalAmountChange = (value: string) => {
    setEditedTotalAmount(value);
    if (exitPreview) {
      const total = parseFloat(value) || 0;
      const balance = total - exitPreview.advance;
      
      if (balance < 0) {
        setEditedRefundAmount(Math.abs(balance).toFixed(2));
        setEditedBalanceAmount("0");
      } else {
        setEditedBalanceAmount(balance.toFixed(2));
        setEditedRefundAmount("0");
      }
    }
  };

  const handleBalanceChange = (value: string) => {
    setEditedBalanceAmount(value);
    if (exitPreview) {
      const balance = parseFloat(value) || 0;
      const total = exitPreview.advance + balance;
      setEditedTotalAmount(total.toFixed(2));
      setEditedRefundAmount("0");
    }
  };

  const handleRefundChange = (value: string) => {
    setEditedRefundAmount(value);
    if (exitPreview) {
      const refund = parseFloat(value) || 0;
      const total = exitPreview.advance - refund;
      setEditedTotalAmount(total.toFixed(2));
      setEditedBalanceAmount("0");
    }
  };

  const confirmExit = async () => {
    if (!exitPreview) return;

    try {
      const requestBody: any = {};

      // Always include edited amounts if they differ from original
      const totalAmount = parseFloat(editedTotalAmount);
      const balanceAmount = parseFloat(editedBalanceAmount);
      const refundAmount = parseFloat(editedRefundAmount);

      if (isNaN(totalAmount) || totalAmount < 0) {
        Alert.alert("Invalid Input", "Please enter a valid total amount");
        return;
      }

      // Only send manual amounts if they've been edited
      if (Math.abs(totalAmount - exitPreview.totalAmount) > 0.01) {
        requestBody.manualTotalAmount = totalAmount;
        requestBody.manualBalanceAmount = balanceAmount || 0;
        requestBody.manualRefundAmount = refundAmount || 0;
      }

      const response = await apiFetch(
        `/Parking/CheckOut/${exitPreview.vehicleId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (response.ok) {
        const result = await response.json();
        const successMessage = Object.keys(requestBody).length > 0
          ? `${exitPreview.vehicleNumber} checked out with adjusted amounts`
          : `${exitPreview.vehicleNumber} checked out successfully`;
        
        Alert.alert("✅ Exit Processed", successMessage);
        setExitPreviewVisible(false);
        setExitPreview(null);
        loadVehicles();
        setVehicleNumber('');
      } else {
        const error = await response.json();
        Alert.alert("Error", error.message || "Failed to process exit");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      Alert.alert("Error", "Failed to connect to server");
    }
  };

  const closeExitPreview = () => {
    setExitPreviewVisible(false);
    setExitPreview(null);
    setTariffError(null);
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
    <>
      <ScrollView 
        contentContainerStyle={styles.tabContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Compact Number Input Section */}
        <View style={styles.compactInputSection}>
          <View style={styles.compactDisplay}>
            <Text style={styles.compactDisplayLabel}>Vehicle Number</Text>
            <View style={styles.compactDisplayBox}>
              <Text style={styles.compactDisplayText}>
                {vehicleNumber || '______'}
              </Text>
            </View>
          </View>

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
            {filteredVehicles.length} Vehicle{filteredVehicles.length !== 1 ? 's' : ''}
            {vehicleNumber.trim() === '' && vehicles.length > 25 && (
              <Text style={styles.subtleText}> (showing recent 25 of {vehicles.length})</Text>
            )}
          </Text>
          {vehicleNumber.length > 0 && filteredVehicles.length === 0 && (
            <Text style={styles.noMatchText}>No matches</Text>
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
                disabled={loadingPreview}
              >
                <Text style={styles.exitButtonText}>
                  {loadingPreview ? "..." : "Exit"}
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Exit Preview Modal */}
      <Modal
        visible={exitPreviewVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeExitPreview}
      >
        <TouchableWithoutFeedback onPress={closeExitPreview}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {tariffError ? '⚠️ Tariff Error' : 'Exit Summary'}
                  </Text>
                  <TouchableOpacity onPress={closeExitPreview} style={styles.modalCloseButton}>
                    <Text style={styles.modalCloseIcon}>✕</Text>
                  </TouchableOpacity>
                </View>

                {tariffError ? (
                  <View style={styles.modalBody}>
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorIcon}>🔴</Text>
                      <Text style={styles.errorTitle}>Tariff Not Found</Text>
                      <Text style={styles.errorMessage}>{tariffError}</Text>
                      <Text style={styles.errorSuggestion}>
                        Please contact administrator to configure tariff rates for this vehicle type.
                      </Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.modalConfirmButton}
                      onPress={closeExitPreview}
                    >
                      <Text style={styles.modalConfirmText}>OK</Text>
                    </TouchableOpacity>
                  </View>
                ) : exitPreview && (
                  <ScrollView style={styles.modalScrollView}>
                    <View style={styles.modalBody}>
                      {/* Vehicle Info */}
                      <View style={styles.previewSection}>
                        <Text style={styles.previewVehicleNumber}>{exitPreview.vehicleNumber}</Text>
                      </View>

                      {/* Timing Details */}
                      <View style={styles.previewSection}>
                        <View style={styles.previewRow}>
                          <Text style={styles.previewLabel}>Check-In</Text>
                          <Text style={styles.previewValue}>{formatDateTime(exitPreview.checkIn)}</Text>
                        </View>
                        <View style={styles.previewRow}>
                          <Text style={styles.previewLabel}>Check-Out</Text>
                          <Text style={styles.previewValue}>{formatDateTime(exitPreview.checkOut)}</Text>
                        </View>
                        <View style={styles.previewRow}>
                          <Text style={styles.previewLabel}>Total Hours</Text>
                          <Text style={styles.previewValueBold}>{exitPreview.totalHours} hrs</Text>
                        </View>
                      </View>

                      <View style={styles.previewDivider} />

                      {/* Payment Details - Inline Editing */}
                      <View style={styles.previewSection}>
                        <View style={styles.previewRow}>
                          <Text style={styles.previewLabel}>Total Amount</Text>
                          <View style={styles.editableAmountContainer}>
                            <Text style={styles.currencySymbol}>₹</Text>
                            <TextInput
                              style={styles.inlineEditInput}
                              value={editedTotalAmount}
                              onChangeText={handleTotalAmountChange}
                              keyboardType="numeric"
                              placeholder="0.00"
                              selectTextOnFocus
                            />
                          </View>
                        </View>
                        
                        <View style={styles.previewRow}>
                          <Text style={styles.previewLabel}>Advance Paid</Text>
                          <Text style={styles.previewValueBold}>₹{exitPreview.advance}</Text>
                        </View>

                        {/* Balance/Refund Display - Also Editable */}
                        {parseFloat(editedBalanceAmount) > 0 ? (
                          <View style={[styles.previewRow, styles.balanceRow]}>
                            <Text style={styles.balanceLabel}>Balance to Collect</Text>
                            <View style={styles.editableAmountContainer}>
                              <Text style={styles.currencySymbolLight}>₹</Text>
                              <TextInput
                                style={styles.inlineEditInputLight}
                                value={editedBalanceAmount}
                                onChangeText={handleBalanceChange}
                                keyboardType="numeric"
                                placeholder="0.00"
                                selectTextOnFocus
                              />
                            </View>
                          </View>
                        ) : parseFloat(editedRefundAmount) > 0 ? (
                          <View style={[styles.previewRow, styles.refundRow]}>
                            <Text style={styles.refundLabel}>Refund Amount</Text>
                            <View style={styles.editableAmountContainer}>
                              <Text style={styles.currencySymbolLight}>₹</Text>
                              <TextInput
                                style={styles.inlineEditInputLight}
                                value={editedRefundAmount}
                                onChangeText={handleRefundChange}
                                keyboardType="numeric"
                                placeholder="0.00"
                                selectTextOnFocus
                              />
                            </View>
                          </View>
                        ) : (
                          <View style={[styles.previewRow, styles.paidRow]}>
                            <Text style={styles.paidLabel}>✓ Fully Paid</Text>
                          </View>
                        )}

                        {/* Hint for editing */}
                        <Text style={styles.editHint}>Tap any amount to edit</Text>
                      </View>

                      <View style={styles.modalActions}>
                        <TouchableOpacity 
                          style={styles.modalCancelButton}
                          onPress={closeExitPreview}
                        >
                          <Text style={styles.modalCancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.modalConfirmButton}
                          onPress={confirmExit}
                        >
                          <Text style={styles.modalConfirmText}>Confirm Exit</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </ScrollView>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
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
    flexWrap: 'wrap',
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  subtleText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#999',
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
  // Modal styles
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
    maxHeight: "85%",
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
  modalScrollView: {
    maxHeight: 500,
  },
  modalBody: {
    padding: 20,
  },
  previewSection: {
    marginBottom: 16,
  },
  previewVehicleNumber: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 8,
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  previewLabel: {
    fontSize: 14,
    color: "#666",
  },
  previewValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  previewValueBold: {
    fontSize: 15,
    color: "#1a1a1a",
    fontWeight: "700",
  },
  previewDivider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 16,
  },
  editableAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#DC2626',
    borderRadius: 8,
    paddingHorizontal: 8,
    minWidth: 100,
  },
  currencySymbol: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    marginRight: 2,
  },
  currencySymbolLight: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    marginRight: 2,
  },
  inlineEditInput: {
    paddingVertical: 6,
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    minWidth: 80,
    textAlign: 'right',
  },
  inlineEditInputLight: {
    paddingVertical: 6,
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    minWidth: 80,
    textAlign: 'right',
  },
  editHint: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  balanceRow: {
    backgroundColor: "#FEF3C7",
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  balanceLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#92400E",
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: "800",
    color: "#92400E",
  },
  refundRow: {
    backgroundColor: "#D1FAE5",
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  refundLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#065F46",
  },
  refundAmount: {
    fontSize: 18,
    fontWeight: "800",
    color: "#065F46",
  },
  paidRow: {
    backgroundColor: "#DBEAFE",
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
    justifyContent: "center",
  },
  paidLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E40AF",
    textAlign: "center",
    flex: 1,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
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
  modalConfirmButton: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    backgroundColor: "#DC2626",
    alignItems: "center",
  },
  modalConfirmText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  errorSuggestion: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
  },
});