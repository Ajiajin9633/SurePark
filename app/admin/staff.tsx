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
import { AdminHeader } from "@/components/AdminHeader";

type Location = {
  id: number;
  name: string;
  capacity?: string;
};

type Staff = {
  id: number;
  name: string;
  phone: string;
  locationId: number;
  locationName?: string;
  role: string;
  active: boolean;
};

export default function UserRegistration() {
  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  
  // Staff list states
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingLocations, setFetchingLocations] = useState(true);
  const [fetchingStaff, setFetchingStaff] = useState(true);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'register' | 'list'>('register');

  useEffect(() => {
    fetchLocations();
    fetchStaff();
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

  const fetchStaff = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/staff/list`);
      const data = await response.json();
      
      // Enrich staff data with location names
      const enrichedStaff = data.map((staffMember: Staff) => ({
        ...staffMember,
        locationName: locations.find(l => l.id === staffMember.locationId)?.name || 'Unknown'
      }));
      
      setStaff(enrichedStaff);
    } catch (error) {
      Alert.alert("Error", "Failed to load staff list");
    } finally {
      setFetchingStaff(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchLocations(), fetchStaff()]);
    setRefreshing(false);
  };

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert("Validation Error", "Please enter your name");
      return false;
    }
    if (!phone.trim()) {
      Alert.alert("Validation Error", "Please enter your phone number");
      return false;
    }
    if (phone.length !== 10) {
      Alert.alert("Validation Error", "Phone number must be 10 digits");
      return false;
    }
    if (!selectedLocation) {
      Alert.alert("Validation Error", "Please select a location");
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/Staff/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          phoneNumber: phone.trim(),
          locationId: selectedLocation?.id
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          "Success",
          "Staff registered successfully",
          [
            {
              text: "OK",
              onPress: () => {
                setName("");
                setPhone("");
                setSelectedLocation(null);
                fetchStaff(); // Refresh staff list
                setSelectedTab('list'); // Switch to list view
              }
            }
          ]
        );
      } else {
        Alert.alert("Registration Failed", data.message || "Something went wrong");
      }
    } catch (error) {
      Alert.alert("Error", "Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStaff = (id: number) => {
    Alert.alert(
      "Delete Staff",
      "Are you sure you want to delete this staff member?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(`${API_BASE_URL}/users/${id}`, {
                method: "DELETE",
              });

              if (response.ok) {
                setStaff(staff.filter(s => s.id !== id));
                Alert.alert("Success", "Staff deleted successfully");
              } else {
                Alert.alert("Error", "Failed to delete staff");
              }
            } catch (error) {
              Alert.alert("Error", "Network error occurred");
            }
          }
        }
      ]
    );
  };

  const selectLocation = (location: Location) => {
    setSelectedLocation(location);
    setDropdownVisible(false);
  };

  const renderStaffItem = ({ item }: { item: Staff }) => (
    <TouchableOpacity
      style={styles.staffCard}
      activeOpacity={0.7}
      onLongPress={() => handleDeleteStaff(item.id)}
    >
      <View style={styles.staffCardHeader}>
        <View style={styles.staffAvatar}>
          <Text style={styles.staffAvatarText}>👤</Text>
        </View>
        <View style={styles.staffStatus}>
          <View style={[styles.statusDot, item.active ? styles.statusActive : styles.statusInactive]} />
          <Text style={styles.staffStatusText}>{item.active ? 'Active' : 'Inactive'}</Text>
        </View>
      </View>

      <View style={styles.staffInfo}>
        <Text style={styles.staffName}>{item.name}</Text>
        <View style={styles.staffDetailRow}>
          <Text style={styles.staffDetailIcon}>📱</Text>
          <Text style={styles.staffDetailText}>{item.phone}</Text>
        </View>
        <View style={styles.staffDetailRow}>
          <Text style={styles.staffDetailIcon}>📍</Text>
          <Text style={styles.staffDetailText}>{item.locationName || 'Unknown'}</Text>
        </View>
        <View style={styles.staffDetailRow}>
          <Text style={styles.staffDetailIcon}>👑</Text>
          <Text style={styles.staffDetailText}>{item.role}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.staffDeleteButton}
        onPress={() => handleDeleteStaff(item.id)}
      >
        <Text style={styles.staffDeleteIcon}>🗑️</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <AdminHeader 
        title="Staffs" 
        subtitle="Staff Management" 
        showBackButton={true}
        onBack={() => router.replace("/admin/details")}
      />

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'register' && styles.activeTab]}
          onPress={() => setSelectedTab('register')}
        >
          <Text style={[styles.tabIcon, selectedTab === 'register' && styles.activeTabIcon]}>➕</Text>
          <Text style={[styles.tabText, selectedTab === 'register' && styles.activeTabText]}>Register</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'list' && styles.activeTab]}
          onPress={() => setSelectedTab('list')}
        >
          <Text style={[styles.tabIcon, selectedTab === 'list' && styles.activeTabIcon]}>👥</Text>
          <Text style={[styles.tabText, selectedTab === 'list' && styles.activeTabText]}>
            Staff List ({staff.length})
          </Text>
        </TouchableOpacity>
      </View>

      {selectedTab === 'register' ? (
        /* Registration Form */
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
                  <Text style={styles.formTitle}>Register New Staff</Text>
                  <Text style={styles.formSubtitle}>Fill in the information below</Text>
                </View>

                {/* Name Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Full Name <Text style={styles.requiredStar}>*</Text></Text>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputIcon}>👤</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter staff's full name"
                      placeholderTextColor="#999"
                      value={name}
                      onChangeText={setName}
                      returnKeyType="next"
                      blurOnSubmit={false}
                    />
                  </View>
                </View>

                {/* Phone Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Phone Number <Text style={styles.requiredStar}>*</Text></Text>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputIcon}>📱</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter 10-digit phone number"
                      placeholderTextColor="#999"
                      value={phone}
                      onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, ''))}
                      keyboardType="phone-pad"
                      maxLength={10}
                      returnKeyType="done"
                    />
                  </View>
                  <Text style={styles.inputHint}>Format: 10 digits (e.g., 9876543210)</Text>
                </View>

                {/* Location Dropdown */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Select Location <Text style={styles.requiredStar}>*</Text></Text>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => setDropdownVisible(true)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.dropdownContent}>
                      <Text style={styles.dropdownIcon}>📍</Text>
                      <Text style={[
                        styles.dropdownText,
                        !selectedLocation && styles.dropdownPlaceholder
                      ]}>
                        {selectedLocation ? selectedLocation.name : "Choose a location"}
                      </Text>
                    </View>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                </View>

                {/* Register Button */}
                <TouchableOpacity
                  style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                  onPress={handleRegister}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Text style={styles.registerButtonIcon}>✓</Text>
                      <Text style={styles.registerButtonText}>Register Staff</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Form Footer */}
                <View style={styles.formFooter}>
                  <Text style={styles.footerText}>
                    Staff members will have access to parking management
                  </Text>
                </View>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      ) : (
        /* Staff List */
        <FlatList
          data={staff}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderStaffItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#d32f2f"]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyText}>No staff members found</Text>
              <Text style={styles.emptySubtext}>Tap the Register tab to add staff</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Location Selection Modal */}
      <Modal
        visible={dropdownVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setDropdownVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Location</Text>
                  <TouchableOpacity
                    onPress={() => setDropdownVisible(false)}
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
                          selectedLocation?.id === location.id && styles.selectedLocationItem
                        ]}
                        onPress={() => selectLocation(location)}
                      >
                        <Text style={styles.locationItemIcon}>📍</Text>
                        <View style={styles.locationItemInfo}>
                          <Text style={styles.locationItemName}>{location.name}</Text>
                          {location.capacity && (
                            <Text style={styles.locationItemCapacity}>
                              Capacity: {location.capacity}
                            </Text>
                          )}
                        </View>
                        {selectedLocation?.id === location.id && (
                          <Text style={styles.checkIcon}>✓</Text>
                        )}
                      </TouchableOpacity>
                    ))}

                    {locations.length === 0 && (
                      <View style={styles.emptyLocations}>
                        <Text style={styles.emptyIcon}>📍</Text>
                        <Text style={styles.emptyText}>No locations available</Text>
                        <Text style={styles.emptySubtext}>Please contact administrator</Text>
                      </View>
                    )}
                  </ScrollView>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
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
    marginTop: 10,
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
  inputHint: {
    fontSize: 12,
    color: "#999",
    marginTop: 5,
    marginLeft: 5,
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
  registerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#d32f2f",
    padding: 18,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#d32f2f",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  registerButtonDisabled: {
    backgroundColor: "#ffb3b3",
  },
  registerButtonIcon: {
    fontSize: 20,
    color: "#fff",
    marginRight: 10,
    fontWeight: "bold",
  },
  registerButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  formFooter: {
    alignItems: "center",
    marginTop: 10,
  },
  footerText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
  },
  listContent: {
    padding: 20,
    paddingBottom: 30,
  },
  staffCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  staffCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  staffAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(211, 47, 47, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  staffAvatarText: {
    fontSize: 24,
  },
  staffStatus: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusActive: {
    backgroundColor: "#4CAF50",
  },
  statusInactive: {
    backgroundColor: "#999",
  },
  staffStatusText: {
    fontSize: 12,
    color: "#666",
  },
  staffInfo: {
    marginBottom: 8,
  },
  staffName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  staffDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  staffDetailIcon: {
    fontSize: 14,
    marginRight: 8,
    width: 20,
    opacity: 0.6,
  },
  staffDetailText: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  staffDeleteButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    padding: 8,
  },
  staffDeleteIcon: {
    fontSize: 18,
    opacity: 0.5,
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
  locationItemInfo: {
    flex: 1,
  },
  locationItemName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 2,
  },
  locationItemCapacity: {
    fontSize: 12,
    color: "#666",
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