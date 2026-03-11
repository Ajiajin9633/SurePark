import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
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
import { API_BASE_URL } from "../../../services/api";

type Location = {
  id: number;
  name: string;
  capacity?: string;
};

export default function LocationPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [newLocationName, setNewLocationName] = useState("");
  const [newLocationCapacity, setNewLocationCapacity] = useState("");
  const [editLocationName, setEditLocationName] = useState("");
  const [editLocationCapacity, setEditLocationCapacity] = useState("");
  const [loading, setLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/location`);
      const data = await res.json();
      setLocations(data);
    } catch (error) {
      Alert.alert("Error", "Failed to load locations");
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLocations();
    setRefreshing(false);
  };

  const handleAddLocation = async () => {
    if (!newLocationName.trim()) {
      Alert.alert("Error", "Please enter a location name");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/location`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          name: newLocationName,
          capacity: newLocationCapacity 
        }),
      });

      if (response.ok) {
        const newLocation = await response.json();
        setLocations([...locations, newLocation]);
        setModalVisible(false);
        setNewLocationName("");
        setNewLocationCapacity("");
        Keyboard.dismiss();
        Alert.alert("Success", "Location added successfully");
      } else {
        Alert.alert("Error", "Failed to add location");
      }
    } catch (error) {
      Alert.alert("Error", "Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleEditLocation = async () => {
    if (!editLocationName.trim()) {
      Alert.alert("Error", "Please enter a location name");
      return;
    }

    if (!selectedLocation) return;

    setEditLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/location/${selectedLocation.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          name: editLocationName,
          capacity: editLocationCapacity 
        }),
      });

      if (response.ok) {
        const updatedLocation = await response.json();
        setLocations(locations.map(loc => 
          loc.id === selectedLocation.id ? updatedLocation : loc
        ));
        setEditModalVisible(false);
        setSelectedLocation(null);
        setEditLocationName("");
        setEditLocationCapacity("");
        Keyboard.dismiss();
        Alert.alert("Success", "Location updated successfully");
      } else {
        Alert.alert("Error", "Failed to update location");
      }
    } catch (error) {
      Alert.alert("Error", "Network error occurred");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteLocation = (id: number) => {
    Alert.alert(
      "Delete Location",
      "Are you sure you want to delete this location?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(`${API_BASE_URL}/location/${id}`, {
                method: "DELETE",
              });

              if (response.ok) {
                setLocations(locations.filter(loc => loc.id !== id));
                Alert.alert("Success", "Location deleted successfully");
              } else {
                Alert.alert("Error", "Failed to delete location");
              }
            } catch (error) {
              Alert.alert("Error", "Network error occurred");
            }
          }
        }
      ]
    );
  };

  const openEditModal = (item: Location) => {
    setSelectedLocation(item);
    setEditLocationName(item.name);
    setEditLocationCapacity(item.capacity || "");
    setEditModalVisible(true);
  };

  const renderLocationItem = ({ item }: { item: Location }) => (
    <TouchableOpacity
      style={styles.card}
      onLongPress={() => handleDeleteLocation(item.id)}
      activeOpacity={0.7}
      onPress={() => openEditModal(item)}
    >
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <Text style={styles.locationIcon}>📍</Text>
        </View>
        <View style={styles.locationInfo}>
          <Text style={styles.name}>{item.name}</Text>
          {item.capacity && (
            <Text style={styles.capacityText}>Capacity: {item.capacity}</Text>
          )}
        </View>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => openEditModal(item)}
        >
          <Text style={styles.editIcon}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeleteLocation(item.id)}
        >
          <Text style={styles.deleteIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
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
          <Text style={styles.headerTitle}>Locations</Text>
          <Text style={styles.headerSubtitle}>{locations.length} locations total</Text>
        </View>
      </View>

      {/* Stats Card */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{locations.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {locations.filter(l => l.name?.length > 0).length}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
      </View>

      {/* Location List */}
      <FlatList
        data={locations}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderLocationItem}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📍</Text>
            <Text style={styles.emptyText}>No locations found</Text>
            <Text style={styles.emptySubtext}>Tap the + button to add one</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Add Location Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          Keyboard.dismiss();
        }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.keyboardView}
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Add New Location</Text>
                  <TouchableOpacity 
                    onPress={() => {
                      setModalVisible(false);
                      setNewLocationName("");
                      setNewLocationCapacity("");
                      Keyboard.dismiss();
                    }}
                    style={styles.modalCloseButton}
                  >
                    <Text style={styles.modalCloseIcon}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView 
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={styles.modalBody}>
                    <View style={styles.inputContainer}>
                      <View style={{flexDirection:"row"}}>
                        <Text style={styles.inputLabel}>Location Name</Text>
                        <Text style={styles.requiredStar}> *</Text>
                      </View>
                      <View style={styles.inputWrapper}>
                        <Text style={styles.inputIcon}>📍</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="Enter location name"
                          placeholderTextColor="#999"
                          value={newLocationName}
                          onChangeText={setNewLocationName}
                          returnKeyType="next"
                          blurOnSubmit={false}
                        />
                      </View>
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Capacity</Text>
                      <View style={styles.inputWrapper}>
                        <Text style={styles.inputIcon}>👥</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="Enter capacity (optional)"
                          placeholderTextColor="#999"
                          value={newLocationCapacity}
                          onChangeText={setNewLocationCapacity}
                          keyboardType="numeric"
                          returnKeyType="done"
                          onSubmitEditing={handleAddLocation}
                        />
                      </View>
                    </View>

                    <View style={styles.modalButtons}>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => {
                          setModalVisible(false);
                          setNewLocationName("");
                          setNewLocationCapacity("");
                          Keyboard.dismiss();
                        }}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                        onPress={handleAddLocation}
                        disabled={loading}
                      >
                        {loading ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <>
                            <Text style={styles.submitButtonIcon}>✓</Text>
                            <Text style={styles.submitButtonText}>Add Location</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Edit Location Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => {
          setEditModalVisible(false);
          setSelectedLocation(null);
          Keyboard.dismiss();
        }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.keyboardView}
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Edit Location</Text>
                  <TouchableOpacity 
                    onPress={() => {
                      setEditModalVisible(false);
                      setSelectedLocation(null);
                      setEditLocationName("");
                      setEditLocationCapacity("");
                      Keyboard.dismiss();
                    }}
                    style={styles.modalCloseButton}
                  >
                    <Text style={styles.modalCloseIcon}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView 
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={styles.modalBody}>
                    <View style={styles.inputContainer}>
                      <View style={{flexDirection:"row"}}>
                        <Text style={styles.inputLabel}>Location Name</Text>
                        <Text style={styles.requiredStar}> *</Text>
                      </View>
                      <View style={styles.inputWrapper}>
                        <Text style={styles.inputIcon}>📍</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="Enter location name"
                          placeholderTextColor="#999"
                          value={editLocationName}
                          onChangeText={setEditLocationName}
                          returnKeyType="next"
                          blurOnSubmit={false}
                        />
                      </View>
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Capacity</Text>
                      <View style={styles.inputWrapper}>
                        <Text style={styles.inputIcon}>👥</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="Enter capacity (optional)"
                          placeholderTextColor="#999"
                          value={editLocationCapacity}
                          onChangeText={setEditLocationCapacity}
                          keyboardType="numeric"
                          returnKeyType="done"
                          onSubmitEditing={handleEditLocation}
                        />
                      </View>
                    </View>

                    <View style={styles.modalButtons}>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => {
                          setEditModalVisible(false);
                          setSelectedLocation(null);
                          setEditLocationName("");
                          setEditLocationCapacity("");
                          Keyboard.dismiss();
                        }}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.submitButton, editLoading && styles.submitButtonDisabled]}
                        onPress={handleEditLocation}
                        disabled={editLoading}
                      >
                        {editLoading ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <>
                            <Text style={styles.submitButtonIcon}>✓</Text>
                            <Text style={styles.submitButtonText}>Update Location</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
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
  statsCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: -15,
    borderRadius: 15,
    padding: 15,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#d32f2f",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: "80%",
    backgroundColor: "#e0e0e0",
    alignSelf: "center",
  },
  listContent: {
    padding: 20,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 10,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "rgba(211, 47, 47, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  locationIcon: {
    fontSize: 22,
  },
  locationInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  capacityText: {
    fontSize: 13,
    color: "#666",
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  editButton: {
    padding: 8,
    marginRight: 4,
  },
  editIcon: {
    fontSize: 18,
    opacity: 0.6,
  },
  deleteButton: {
    padding: 8,
  },
  deleteIcon: {
    fontSize: 18,
    opacity: 0.6,
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#d32f2f",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#d32f2f",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  fabIcon: {
    fontSize: 30,
    color: "#fff",
    fontWeight: "bold",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  emptyIcon: {
    fontSize: 50,
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
  keyboardView: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
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
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    marginRight: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#d32f2f",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#ffb3b3",
  },
  submitButtonIcon: {
    color: "#fff",
    fontSize: 18,
    marginRight: 8,
    fontWeight: "bold",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});