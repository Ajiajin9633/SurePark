import { AdminHeader } from "@/components/AdminHeader";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
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
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { apiFetch } from "../../services/api";

type Location = {
  id: number;
  name: string;
  capacity?: number;
};

type Manager = {
  id: number;
  managerName: string;
  phoneNumber: string;
  createdDate: string;
  isActive: boolean;
  locations: { id: number; name: string }[];
};

export default function ManagerScreen() {
  const [selectedTab, setSelectedTab] = useState<"add" | "list">("add");

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedLocations, setSelectedLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);

  // Dropdown state (Add form only)
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Data
  const [locations, setLocations] = useState<Location[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [fetchingLocations, setFetchingLocations] = useState(true);
  const [fetchingManagers, setFetchingManagers] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── CHANGE 1: Filter state (default "active") ──
  const [filter, setFilter] = useState<"active" | "inactive" | "all">("active");

  // Edit Modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingManager, setEditingManager] = useState<Manager | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editSelectedLocations, setEditSelectedLocations] = useState<Location[]>([]);
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    fetchLocations();
    fetchManagers();
  }, []);

  const fetchLocations = async () => {
    try {
      const res = await apiFetch("/location");
      if (!res.ok) {
        console.warn("Locations fetch failed:", res.status);
        setFetchingLocations(false);
        return;
      }
      const data = await res.json();
      setLocations(data);
    } catch (err) {
      console.error("fetchLocations error:", err);
      Alert.alert("Error", "Failed to load locations. Check your connection.");
    } finally {
      setFetchingLocations(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const res = await apiFetch("/manager/list");
      if (!res.ok) {
        console.warn("Managers fetch failed:", res.status);
        setFetchingManagers(false);
        return;
      }
      const data = await res.json();
      setManagers(data);
    } catch (err) {
      console.error("fetchManagers error:", err);
    } finally {
      setFetchingManagers(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchLocations(), fetchManagers()]);
    setRefreshing(false);
  };

  const toggleLocation = (loc: Location) => {
    setSelectedLocations((prev) =>
      prev.find((l) => l.id === loc.id)
        ? prev.filter((l) => l.id !== loc.id)
        : [...prev, loc]
    );
  };

  const toggleEditLocation = (loc: Location) => {
    setEditSelectedLocations((prev) =>
      prev.find((l) => l.id === loc.id)
        ? prev.filter((l) => l.id !== loc.id)
        : [...prev, loc]
    );
  };

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert("Validation Error", "Please enter manager name");
      return false;
    }
    if (!phone.trim() || phone.length !== 10) {
      Alert.alert("Validation Error", "Phone number must be 10 digits");
      return false;
    }
    if (selectedLocations.length === 0) {
      Alert.alert("Validation Error", "Please assign at least one location");
      return false;
    }
    return true;
  };

  const validateEditForm = () => {
    if (!editName.trim()) {
      Alert.alert("Validation Error", "Please enter manager name");
      return false;
    }
    if (!editPhone.trim() || editPhone.length !== 10) {
      Alert.alert("Validation Error", "Phone number must be 10 digits");
      return false;
    }
    if (editSelectedLocations.length === 0) {
      Alert.alert("Validation Error", "Please assign at least one location");
      return false;
    }
    return true;
  };

  const handleAddManager = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await apiFetch("/manager/create", {
        method: "POST",
        body: JSON.stringify({
          managerName: name.trim(),
          phoneNumber: phone.trim(),
          locationIds: selectedLocations.map((l) => l.id),
        }),
      });

      if (res.ok) {
        Alert.alert("Success", "Manager added successfully", [
          {
            text: "OK",
            onPress: () => {
  setName("");
  setPhone("");
  setSelectedLocations([]);
  setDropdownOpen(false);
  fetchManagers();
  setFilter("active");       // ← add this
  setSelectedTab("list");
},
          },
        ]);
      } else {
        const data = await res.json();
        Alert.alert("Error", data.message || "Failed to add manager");
      }
    } catch {
      Alert.alert("Error", "Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (manager: Manager) => {
    setEditingManager(manager);
    setEditName(manager.managerName);
    setEditPhone(manager.phoneNumber);
    const assigned = locations.filter((loc) =>
      manager.locations.some((ml) => ml.id === loc.id)
    );
    setEditSelectedLocations(assigned);
    setEditModalVisible(true);
  };

  const handleEditManager = async () => {
    if (!validateEditForm() || !editingManager) return;

    setEditLoading(true);
    try {
      const infoRes = await apiFetch(`/manager/${editingManager.id}`, {
        method: "PUT",
        body: JSON.stringify({
          managerName: editName.trim(),
          phoneNumber: editPhone.trim(),
        }),
      });

      if (!infoRes.ok) {
        const data = await infoRes.json();
        Alert.alert("Error", data.message || "Failed to update manager info");
        setEditLoading(false);
        return;
      }

      const locRes = await apiFetch(`/manager/${editingManager.id}/locations`, {
        method: "PUT",
        body: JSON.stringify({
          locationIds: editSelectedLocations.map((l) => l.id),
        }),
      });

      if (!locRes.ok) {
        const data = await locRes.json();
        Alert.alert("Error", data.message || "Failed to update locations");
        setEditLoading(false);
        return;
      }

      setManagers((prev) =>
        prev.map((m) =>
          m.id === editingManager.id
            ? {
                ...m,
                managerName: editName.trim(),
                phoneNumber: editPhone.trim(),
                locations: editSelectedLocations.map((l) => ({
                  id: l.id,
                  name: l.name,
                })),
              }
            : m
        )
      );

      setEditModalVisible(false);
      setEditingManager(null);
      Alert.alert("Success", "Manager updated successfully");
    } catch {
      Alert.alert("Error", "Network error occurred");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = (id: number, managerName: string) => {
    Alert.alert(
      "Delete Manager",
      `Remove "${managerName}" and all their location assignments?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await apiFetch(`/manager/${id}`, {
                method: "DELETE",
              });
              if (res.ok) {
  await fetchManagers();     // ← re-fetch so inactive/deleted state is accurate
  Alert.alert("Success", "Manager removed");
} else {
                Alert.alert("Error", "Failed to delete manager");
              }
            } catch {
              Alert.alert("Error", "Network error");
            }
          },
        },
      ]
    );
  };

  const renderManagerCard = ({ item }: { item: Manager }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>👔</Text>
        </View>
        <View style={styles.cardHeaderInfo}>
          <Text style={styles.managerName}>{item.managerName}</Text>
          <View style={styles.phoneBadge}>
            <Text style={styles.phoneIcon}>📱</Text>
            <Text style={styles.phoneText}>{item.phoneNumber}</Text>
          </View>
        </View>
        <View
          style={[
            styles.statusBadge,
            item.isActive ? styles.activeBadge : styles.inactiveBadge,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              !item.isActive && styles.statusTextInactive,
            ]}
          >
            {item.isActive ? "Active" : "Inactive"}
          </Text>
        </View>
      </View>

      <View style={styles.locationsSection}>
        <Text style={styles.locationsSectionLabel}>
          📍 Assigned Locations ({item.locations.length})
        </Text>
        <View style={styles.locationChipsRow}>
          {item.locations.map((loc) => (
            <View key={loc.id} style={styles.locationChip}>
              <Text style={styles.locationChipText}>{loc.name}</Text>
            </View>
          ))}
          {item.locations.length === 0 && (
            <Text style={styles.noLocationsText}>No locations assigned</Text>
          )}
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.createdDate}>
          Added:{" "}
          {new Date(item.createdDate).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </Text>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => openEditModal(item)}
          >
            <Text style={styles.editIcon}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item.id, item.managerName)}
          >
            <Text style={styles.deleteIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Dropdown label for the trigger button
  const dropdownLabel =
    selectedLocations.length === 0
      ? "Select locations..."
      : selectedLocations.length === 1
      ? selectedLocations[0].name
      : `${selectedLocations.length} locations selected`;

  // ── CHANGE 2: Filtered managers list ──
  const filteredManagers = managers.filter((m) => {
    if (filter === "active") return m.isActive;
    if (filter === "inactive") return !m.isActive;
    return true;
  });

  return (
    <View style={styles.container}>
      <AdminHeader
        title="Managers"
        subtitle="Manage & Assign Locations"
        showBackButton={true}
        onBack={() => router.replace("/admin/details")}
      />

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "add" && styles.activeTab]}
          onPress={() => setSelectedTab("add")}
        >
          <Text style={[styles.tabIcon, selectedTab === "add" && styles.activeTabIcon]}>
            ➕
          </Text>
          <Text style={[styles.tabText, selectedTab === "add" && styles.activeTabText]}>
            Add Manager
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "list" && styles.activeTab]}
          onPress={() => setSelectedTab("list")}
        >
          <Text style={[styles.tabIcon, selectedTab === "list" && styles.activeTabIcon]}>
            👔
          </Text>
          <Text style={[styles.tabText, selectedTab === "list" && styles.activeTabText]}>
            Managers ({managers.length})
          </Text>
        </TouchableOpacity>
      </View>

      {selectedTab === "add" ? (
        /* ─── ADD FORM ─── */
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback
            onPress={() => {
              Keyboard.dismiss();
              setDropdownOpen(false);
            }}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.formCard}>
                <View style={styles.formTitleContainer}>
                  <Text style={styles.formTitle}>Add New Manager</Text>
                  <Text style={styles.formSubtitle}>
                    Fill in details and assign locations
                  </Text>
                </View>

                {/* Name */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>
                    Manager Name <Text style={styles.star}>*</Text>
                  </Text>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputIcon}>👔</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter manager's full name"
                      placeholderTextColor="#999"
                      value={name}
                      onChangeText={setName}
                      returnKeyType="next"
                    />
                  </View>
                </View>

                {/* Phone */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>
                    Phone Number <Text style={styles.star}>*</Text>
                  </Text>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputIcon}>📱</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="10-digit phone number"
                      placeholderTextColor="#999"
                      value={phone}
                      onChangeText={(t) => setPhone(t.replace(/[^0-9]/g, ""))}
                      keyboardType="phone-pad"
                      maxLength={10}
                      returnKeyType="done"
                    />
                  </View>
                  <Text style={styles.inputHint}>Format: 10 digits</Text>
                </View>

                {/* ─── LOCATION DROPDOWN (Add form only) ─── */}
                <View style={styles.inputContainer}>
                  <View style={styles.locationHeaderRow}>
                    <Text style={styles.inputLabel}>
                      Assign Locations <Text style={styles.star}>*</Text>
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setFetchingLocations(true);
                        fetchLocations();
                      }}
                    >
                    </TouchableOpacity>
                  </View>

                  {fetchingLocations ? (
                    <ActivityIndicator
                      size="small"
                      color="#d32f2f"
                      style={{ marginVertical: 10 }}
                    />
                  ) : locations.length === 0 ? (
                    <Text style={styles.inputHint}>
                      No locations available. Please add them first.
                    </Text>
                  ) : (
                    <View style={styles.dropdownContainer}>
                      {/* Dropdown Trigger */}
                      <TouchableOpacity
                        style={[
                          styles.dropdownTrigger,
                          dropdownOpen && styles.dropdownTriggerOpen,
                        ]}
                        onPress={() => setDropdownOpen((prev) => !prev)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.inputIcon}>📍</Text>
                        <Text
                          style={[
                            styles.dropdownTriggerText,
                            selectedLocations.length > 0 &&
                              styles.dropdownTriggerTextSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {dropdownLabel}
                        </Text>
                        <Text style={styles.dropdownChevron}>
                          {dropdownOpen ? "▲" : "▼"}
                        </Text>
                      </TouchableOpacity>

                      {/* Selected chips */}
                      {selectedLocations.length > 0 && (
                        <View style={styles.selectedChipsRow}>
                          {selectedLocations.map((loc) => (
                            <TouchableOpacity
                              key={loc.id}
                              style={styles.selectedChip}
                              onPress={() => toggleLocation(loc)}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.selectedChipText}>
                                {loc.name}
                              </Text>
                              <Text style={styles.selectedChipRemove}>✕</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}

                      {/* Dropdown List */}
                      {dropdownOpen && (
                        <View style={styles.dropdownList}>
                          {locations.map((loc, index) => {
                            const isSelected = !!selectedLocations.find(
                              (l) => l.id === loc.id
                            );
                            return (
                              <TouchableOpacity
                                key={loc.id}
                                style={[
                                  styles.dropdownItem,
                                  isSelected && styles.dropdownItemSelected,
                                  index === locations.length - 1 &&
                                    styles.dropdownItemLast,
                                ]}
                                onPress={() => toggleLocation(loc)}
                                activeOpacity={0.7}
                              >
                                <Text
                                  style={[
                                    styles.dropdownItemText,
                                    isSelected &&
                                      styles.dropdownItemTextSelected,
                                  ]}
                                >
                                  {loc.name}
                                </Text>
                                {isSelected && (
                                  <Text style={styles.dropdownItemCheck}>✓</Text>
                                )}
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  )}
                </View>

                {/* Submit */}
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    loading && styles.submitButtonDisabled,
                  ]}
                  onPress={handleAddManager}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Text style={styles.submitButtonIcon}>✓</Text>
                      <Text style={styles.submitButtonText}>Add Manager</Text>
                    </>
                  )}
                </TouchableOpacity>

                <Text style={styles.formFooterNote}>
                  Manager will be assigned to all selected locations
                </Text>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      ) : (
        /* ─── MANAGER LIST ─── */
        <>
          {/* ── CHANGE 3: Filter buttons ── */}
          <View style={styles.filterRow}>
            {(["active", "inactive", "all"] as const).map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
                onPress={() => setFilter(f)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.filterBtnText,
                    filter === f && styles.filterBtnTextActive,
                  ]}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── CHANGE 4: FlatList uses filteredManagers ── */}
          <FlatList
            data={filteredManagers}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderManagerCard}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={["#d32f2f"]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                {fetchingManagers ? (
                  <ActivityIndicator size="large" color="#d32f2f" />
                ) : (
                  <>
                    <Text style={styles.emptyIcon}>👔</Text>
                    <Text style={styles.emptyText}>No managers found</Text>
                    <Text style={styles.emptySubtext}>
                      {filter === "all"
                        ? 'Tap "Add Manager" to create one'
                        : `No ${filter} managers`}
                    </Text>
                  </>
                )}
              </View>
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}

      {/* ─── EDIT MODAL ─── */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setEditModalVisible(false);
          setEditingManager(null);
        }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.modalSheet}
              >
                <View style={styles.modalHandle} />

                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>Edit Manager</Text>
                    <Text style={styles.modalSubtitle}>
                      Update details for {editingManager?.managerName}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => {
                      setEditModalVisible(false);
                      setEditingManager(null);
                    }}
                  >
                    <Text style={styles.modalCloseIcon}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={styles.modalScrollContent}
                >
                  {/* Edit Name */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>
                      Manager Name <Text style={styles.star}>*</Text>
                    </Text>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputIcon}>👔</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter manager's full name"
                        placeholderTextColor="#999"
                        value={editName}
                        onChangeText={setEditName}
                        returnKeyType="next"
                      />
                    </View>
                  </View>

                  {/* Edit Phone */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>
                      Phone Number <Text style={styles.star}>*</Text>
                    </Text>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputIcon}>📱</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="10-digit phone number"
                        placeholderTextColor="#999"
                        value={editPhone}
                        onChangeText={(t) =>
                          setEditPhone(t.replace(/[^0-9]/g, ""))
                        }
                        keyboardType="phone-pad"
                        maxLength={10}
                        returnKeyType="done"
                      />
                    </View>
                    <Text style={styles.inputHint}>Format: 10 digits</Text>
                  </View>

                  {/* Edit Locations */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>
                      Assign Locations <Text style={styles.star}>*</Text>
                    </Text>
                    {fetchingLocations ? (
                      <ActivityIndicator
                        size="small"
                        color="#d32f2f"
                        style={{ marginVertical: 10 }}
                      />
                    ) : locations.length === 0 ? (
                      <Text style={styles.inputHint}>No locations available.</Text>
                    ) : (
                      <View style={styles.inlineLocationsContainer}>
                        {locations.map((loc) => {
                          const isSelected = !!editSelectedLocations.find(
                            (l) => l.id === loc.id
                          );
                          return (
                            <TouchableOpacity
                              key={loc.id}
                              style={[
                                styles.inlineLocationChip,
                                isSelected
                                  ? styles.inlineLocationChipSelected
                                  : null,
                              ]}
                              onPress={() => toggleEditLocation(loc)}
                              activeOpacity={0.7}
                            >
                              <Text
                                style={[
                                  styles.inlineLocationText,
                                  isSelected
                                    ? styles.inlineLocationTextSelected
                                    : null,
                                ]}
                              >
                                {loc.name}
                              </Text>
                              {isSelected && (
                                <Text style={styles.inlineCheckIcon}>✓</Text>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>

                  {/* Save Button */}
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      editLoading && styles.submitButtonDisabled,
                    ]}
                    onPress={handleEditManager}
                    disabled={editLoading}
                    activeOpacity={0.8}
                  >
                    {editLoading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Text style={styles.submitButtonIcon}>✓</Text>
                        <Text style={styles.submitButtonText}>Save Changes</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {/* Cancel Button */}
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setEditModalVisible(false);
                      setEditingManager(null);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </ScrollView>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },

  /* Tabs */
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 10, 
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
  activeTab: { backgroundColor: "#d32f2f" },
  tabIcon: { fontSize: 16, marginRight: 6 },
  activeTabIcon: { color: "#fff" },
  tabText: { fontSize: 13, fontWeight: "600", color: "#666" },
  activeTabText: { color: "#fff" },

  /* Form */
  scrollContent: { flexGrow: 1, padding: 20 },
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
  formTitleContainer: { marginBottom: 22 },
  formTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  formSubtitle: { fontSize: 14, color: "#666" },
  inputContainer: { marginBottom: 18 },
  inputLabel: { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 8 },
  star: { color: "#d32f2f" },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    paddingHorizontal: 12,
  },
  inputIcon: { fontSize: 18, marginRight: 10, opacity: 0.5 },
  input: { flex: 1, padding: 14, fontSize: 16, color: "#333" },
  inputHint: { fontSize: 12, color: "#999", marginTop: 4, marginLeft: 4 },

  locationHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  refreshIcon: { fontSize: 16 },

  /* Dropdown styles */
  dropdownContainer: { position: "relative", zIndex: 10 },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  dropdownTriggerOpen: {
    borderColor: "#d32f2f",
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    backgroundColor: "#fff",
  },
  dropdownTriggerText: {
    flex: 1,
    fontSize: 16,
    color: "#999",
  },
  dropdownTriggerTextSelected: {
    color: "#333",
  },
  dropdownChevron: {
    fontSize: 10,
    color: "#888",
    marginLeft: 8,
  },
  dropdownList: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "#d32f2f",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownItemLast: { borderBottomWidth: 0 },
  dropdownItemSelected: { backgroundColor: "rgba(211,47,47,0.06)" },
  dropdownItemText: { fontSize: 15, color: "#444" },
  dropdownItemTextSelected: { color: "#d32f2f", fontWeight: "600" },
  dropdownItemCheck: { fontSize: 14, color: "#d32f2f", fontWeight: "bold" },
  selectedChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  selectedChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(211,47,47,0.1)",
    borderWidth: 1,
    borderColor: "rgba(211,47,47,0.3)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  selectedChipText: { fontSize: 13, color: "#d32f2f", fontWeight: "600" },
  selectedChipRemove: {
    fontSize: 11,
    color: "#d32f2f",
    marginLeft: 6,
    fontWeight: "bold",
  },

  /* Inline chips (Edit modal) */
  inlineLocationsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  inlineLocationChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  inlineLocationChipSelected: {
    backgroundColor: "rgba(211,47,47,0.1)",
    borderColor: "rgba(211,47,47,0.4)",
  },
  inlineLocationText: { fontSize: 14, color: "#555", fontWeight: "500" },
  inlineLocationTextSelected: { color: "#d32f2f", fontWeight: "700" },
  inlineCheckIcon: {
    fontSize: 14,
    color: "#d32f2f",
    marginLeft: 6,
    fontWeight: "bold",
  },

  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#d32f2f",
    padding: 17,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 12,
    elevation: 3,
    shadowColor: "#d32f2f",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  submitButtonDisabled: { backgroundColor: "#ffb3b3" },
  submitButtonIcon: {
    fontSize: 18,
    color: "#fff",
    marginRight: 8,
    fontWeight: "bold",
  },
  submitButtonText: { fontSize: 16, color: "#fff", fontWeight: "600" },
  formFooterNote: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginTop: 4,
  },
  cancelButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginBottom: 20,
  },
  cancelButtonText: { fontSize: 15, color: "#666", fontWeight: "500" },

  /* ── CHANGE 5: Filter button styles ── */
  filterRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
  },
  filterBtn: {
    paddingHorizontal: 22,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  filterBtnActive: {
    backgroundColor: "#d32f2f",
    borderColor: "#d32f2f",
  },
  filterBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#888",
  },
  filterBtnTextActive: {
    color: "#fff",
  },

  /* List */
  listContent: { padding: 20, paddingBottom: 30 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(211,47,47,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: { fontSize: 24 },
  cardHeaderInfo: { flex: 1 },
  managerName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  phoneBadge: { flexDirection: "row", alignItems: "center" },
  phoneIcon: { fontSize: 13, marginRight: 4 },
  phoneText: { fontSize: 13, color: "#666" },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  activeBadge: { backgroundColor: "rgba(76,175,80,0.1)" },
  inactiveBadge: { backgroundColor: "rgba(150,150,150,0.1)" },
  statusText: { fontSize: 12, fontWeight: "600", color: "#4CAF50" },
  statusTextInactive: { color: "#999" },

  locationsSection: { marginBottom: 12 },
  locationsSectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555",
    marginBottom: 8,
  },
  locationChipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  locationChip: {
    backgroundColor: "rgba(211,47,47,0.08)",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(211,47,47,0.2)",
  },
  locationChipText: { fontSize: 12, color: "#d32f2f", fontWeight: "500" },
  noLocationsText: { fontSize: 13, color: "#bbb" },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 10,
    marginTop: 4,
  },
  createdDate: { fontSize: 12, color: "#aaa" },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  editButton: { padding: 4 },
  editIcon: { fontSize: 18, opacity: 0.65 },
  deleteButton: { padding: 4 },
  deleteIcon: { fontSize: 20, opacity: 0.55 },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  emptyIcon: { fontSize: 56, marginBottom: 14, opacity: 0.45 },
  emptyText: { fontSize: 18, fontWeight: "600", color: "#666", marginBottom: 4 },
  emptySubtext: { fontSize: 14, color: "#999" },

  /* Edit Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "90%",
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#e0e0e0",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 3,
  },
  modalSubtitle: { fontSize: 13, color: "#888" },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseIcon: { fontSize: 13, color: "#555", fontWeight: "600" },
  modalScrollContent: { paddingBottom: 10 },
});