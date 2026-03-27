import { API_BASE_URL } from "@/services/api";
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
  View,
} from "react-native";

interface PendingCollection {
  staffId: number;
  staffName: string;
  staffPhone: string;
  locationId: number;
  locationName: string;
  totalVehicles: number;
  totalAmount: number;
  advanceAmount: number;
  balanceAmount: number;
  refundAmount: number;
  netCollection: number;
  oldestEntry: string;
  latestEntry: string;
}

interface CollectionDetail {
  id: number;
  vehicleNumber: string;
  vehicleType: string;
  checkIn: string;
  checkOut: string;
  totalHours: number;
  advanceAmount: number;
  totalAmount: number;
  balanceAmount: number;
  refundAmount: number;
  isManuallyAdjusted: boolean;
}

interface CollectionSummary {
  totalVehicles: number;
  totalAmount: number;
  advanceAmount: number;
  balanceAmount: number;
  refundAmount: number;
  netCollection: number;
}

export default function Payments() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingCollections, setPendingCollections] = useState<PendingCollection[]>([]);
  
  // Modal states
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<PendingCollection | null>(null);
  const [collectionDetails, setCollectionDetails] = useState<CollectionDetail[]>([]);
  const [collectionSummary, setCollectionSummary] = useState<CollectionSummary | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [notes, setNotes] = useState("");
  const [collecting, setCollecting] = useState(false);

  useEffect(() => {
    loadPendingCollections();
  }, []);

  const loadPendingCollections = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/PaymentCollection/Pending`);
      
      if (response.ok) {
        const data = await response.json();
        setPendingCollections(data);
      } else {
        Alert.alert("Error", "Failed to load pending collections");
      }
    } catch (error) {
      console.error("Error loading pending collections:", error);
      Alert.alert("Error", "Failed to connect to server");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPendingCollections();
  };

  const loadCollectionDetails = async (staffId: number, locationId: number) => {
    try {
      setLoadingDetails(true);
      const response = await fetch(
        `${API_BASE_URL}/PaymentCollection/Details/${staffId}/${locationId}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setCollectionDetails(data.entries);
        setCollectionSummary(data.summary);
      }
    } catch (error) {
      console.error("Error loading details:", error);
      Alert.alert("Error", "Failed to load collection details");
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleViewDetails = async (collection: PendingCollection) => {
    setSelectedCollection(collection);
    setDetailsModalVisible(true);
    await loadCollectionDetails(collection.staffId, collection.locationId);
  };

  const handleCollectPayment = async () => {
    if (!selectedCollection) return;

    Alert.alert(
      "Confirm Collection",
      `Collect ₹${selectedCollection.netCollection.toFixed(2)} from ${selectedCollection.staffName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Collect",
          onPress: async () => {
            try {
              setCollecting(true);
              
              const storedUser = await AsyncStorage.getItem("user");
              if (!storedUser) {
                Alert.alert("Error", "User not found");
                return;
              }

              const user = JSON.parse(storedUser);
              const userId = user.userId || user.id;

              const response = await fetch(
                `${API_BASE_URL}/PaymentCollection/Collect`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    staffId: selectedCollection.staffId,
                    locationId: selectedCollection.locationId,
                    collectedByUserId: userId,
                    notes: notes,
                  }),
                }
              );

              if (response.ok) {
                const result = await response.json();
                Alert.alert(
                  "✅ Collection Successful",
                  `Collected ₹${result.netCollection.toFixed(2)} for ${result.totalVehicles} vehicles`
                );
                setDetailsModalVisible(false);
                setNotes("");
                loadPendingCollections();
              } else {
                const error = await response.json();
                Alert.alert("Error", error.message || "Failed to collect payment");
              }
            } catch (error) {
              console.error("Collection error:", error);
              Alert.alert("Error", "Failed to process collection");
            } finally {
              setCollecting(false);
            }
          },
        },
      ]
    );
  };

  const closeDetailsModal = () => {
    setDetailsModalVisible(false);
    setSelectedCollection(null);
    setCollectionDetails([]);
    setCollectionSummary(null);
    setNotes("");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDaysSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#DC2626" />
        <Text style={styles.loadingText}>Loading collections...</Text>
      </View>
    );
  }

  const totalPending = pendingCollections.reduce((sum, c) => sum + c.netCollection, 0);
  const totalVehicles = pendingCollections.reduce((sum, c) => sum + c.totalVehicles, 0);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Pending Collection</Text>
          <Text style={styles.summaryAmount}>₹{totalPending.toFixed(2)}</Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatValue}>{pendingCollections.length}</Text>
              <Text style={styles.summaryStatLabel}>Staff Members</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatValue}>{totalVehicles}</Text>
              <Text style={styles.summaryStatLabel}>Vehicles</Text>
            </View>
          </View>
        </View>

        {/* Pending Collections List */}
        {pendingCollections.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>💰</Text>
            <Text style={styles.emptyStateText}>No Pending Collections</Text>
            <Text style={styles.emptyStateSubtext}>All payments have been collected</Text>
          </View>
        ) : (
          pendingCollections.map((collection) => (
            <View key={`${collection.staffId}-${collection.locationId}`} style={styles.collectionCard}>
              {/* Header */}
              <View style={styles.cardHeader}>
                <View style={styles.staffInfo}>
                  <Text style={styles.staffName}>{collection.staffName}</Text>
                  <Text style={styles.locationName}>📍 {collection.locationName}</Text>
                  <Text style={styles.staffPhone}>📞 {collection.staffPhone}</Text>
                </View>
                <View style={styles.amountBadge}>
                  <Text style={styles.amountLabel}>To Collect</Text>
                  <Text style={styles.amountValue}>₹{collection.netCollection.toFixed(2)}</Text>
                </View>
              </View>

              {/* Stats */}
              <View style={styles.cardStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{collection.totalVehicles}</Text>
                  <Text style={styles.statLabel}>Vehicles</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>₹{collection.totalAmount.toFixed(0)}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>₹{collection.balanceAmount.toFixed(0)}</Text>
                  <Text style={styles.statLabel}>Balance</Text>
                </View>
                {collection.refundAmount > 0 && (
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, styles.refundValue]}>
                      ₹{collection.refundAmount.toFixed(0)}
                    </Text>
                    <Text style={styles.statLabel}>Refund</Text>
                  </View>
                )}
              </View>

              {/* Period Info */}
              <View style={styles.periodInfo}>
                <Text style={styles.periodText}>
                  {formatDate(collection.oldestEntry)} - {formatDate(collection.latestEntry)}
                </Text>
                <Text style={styles.daysPending}>
                  {getDaysSince(collection.oldestEntry)} days pending
                </Text>
              </View>

              {/* Action Button */}
              <TouchableOpacity
                style={styles.viewDetailsButton}
                onPress={() => handleViewDetails(collection)}
              >
                <Text style={styles.viewDetailsButtonText}>View Details & Collect</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Details Modal */}
      <Modal
        visible={detailsModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeDetailsModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Collection Details</Text>
                {selectedCollection && (
                  <Text style={styles.modalSubtitle}>
                    {selectedCollection.staffName} • {selectedCollection.locationName}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={closeDetailsModal} style={styles.modalCloseButton}>
                <Text style={styles.modalCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Summary */}
              {collectionSummary && (
                <View style={styles.modalSummary}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryRowLabel}>Total Vehicles</Text>
                    <Text style={styles.summaryRowValue}>{collectionSummary.totalVehicles}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryRowLabel}>Total Amount</Text>
                    <Text style={styles.summaryRowValue}>₹{collectionSummary.totalAmount.toFixed(2)}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryRowLabel}>Advance Paid</Text>
                    <Text style={styles.summaryRowValue}>₹{collectionSummary.advanceAmount.toFixed(2)}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryRowLabel}>Balance Collected</Text>
                    <Text style={styles.summaryRowValue}>₹{collectionSummary.balanceAmount.toFixed(2)}</Text>
                  </View>
                  {collectionSummary.refundAmount > 0 && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryRowLabel}>Refunds Given</Text>
                      <Text style={[styles.summaryRowValue, styles.refundText]}>
                        -₹{collectionSummary.refundAmount.toFixed(2)}
                      </Text>
                    </View>
                  )}
                  <View style={[styles.summaryRow, styles.netRow]}>
                    <Text style={styles.netLabel}>Net Collection</Text>
                    <Text style={styles.netValue}>₹{collectionSummary.netCollection.toFixed(2)}</Text>
                  </View>
                </View>
              )}

              {/* Vehicle Details */}
              <Text style={styles.sectionTitle}>Vehicle Details</Text>
              {loadingDetails ? (
                <View style={styles.detailsLoading}>
                  <ActivityIndicator size="small" color="#DC2626" />
                </View>
              ) : (
                collectionDetails.map((detail) => (
                  <View key={detail.id} style={styles.detailCard}>
                    <View style={styles.detailHeader}>
                      <Text style={styles.detailVehicle}>{detail.vehicleNumber}</Text>
                      <Text style={styles.detailType}>{detail.vehicleType}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Check-Out</Text>
                      <Text style={styles.detailValue}>{formatDate(detail.checkOut)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Duration</Text>
                      <Text style={styles.detailValue}>{detail.totalHours}h</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Amount</Text>
                      <Text style={styles.detailValue}>
                        ₹{((detail.totalAmount || 0) + (detail.balanceAmount || 0) - (detail.refundAmount || 0)).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                ))
              )}

              {/* Notes Input */}
              <Text style={styles.sectionTitle}>Notes (Optional)</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Add any notes about this collection..."
                placeholderTextColor="#999"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={closeDetailsModal}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCollectButton}
                onPress={handleCollectPayment}
                disabled={collecting}
              >
                {collecting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalCollectText}>
                    Collect ₹{collectionSummary?.netCollection.toFixed(2)}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  summaryCard: {
    backgroundColor: "#DC2626",
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 40,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },
  summaryStatItem: {
    alignItems: "center",
  },
  summaryStatValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  summaryStatLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.3,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#999",
  },
  collectionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  locationName: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  staffPhone: {
    fontSize: 13,
    color: "#888",
  },
  amountBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "flex-end",
  },
  amountLabel: {
    fontSize: 11,
    color: "#991B1B",
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#DC2626",
  },
  cardStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#f0f0f0",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  refundValue: {
    color: "#ef4444",
  },
  statLabel: {
    fontSize: 12,
    color: "#888",
  },
  periodInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    marginBottom: 16,
  },
  periodText: {
    fontSize: 12,
    color: "#666",
  },
  daysPending: {
    fontSize: 12,
    fontWeight: "600",
    color: "#D97706",
  },
  viewDetailsButton: {
    backgroundColor: "#DC2626",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  viewDetailsButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseIcon: {
    fontSize: 18,
    color: "#666",
  },
  modalBody: {
    padding: 20,
  },
  modalSummary: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  summaryRowLabel: {
    fontSize: 14,
    color: "#666",
  },
  summaryRowValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  refundText: {
    color: "#ef4444",
  },
  netRow: {
    borderTopWidth: 2,
    borderTopColor: "#DC2626",
    marginTop: 8,
    paddingTop: 12,
  },
  netLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  netValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#DC2626",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 12,
    marginTop: 8,
  },
  detailsLoading: {
    padding: 20,
    alignItems: "center",
  },
  detailCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  detailVehicle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  detailType: {
    fontSize: 13,
    color: "#666",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 13,
    color: "#888",
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "500",
    color: "#333",
  },
  notesInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: "#333",
    backgroundColor: "#fafafa",
    textAlignVertical: "top",
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  modalCancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  modalCollectButton: {
    flex: 2,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#DC2626",
    alignItems: "center",
  },
  modalCollectText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});