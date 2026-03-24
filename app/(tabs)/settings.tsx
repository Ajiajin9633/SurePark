import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";
import * as IntentLauncher from "expo-intent-launcher";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  AppStateStatus,
  FlatList,
  Linking,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BleManager, State, Subscription } from "react-native-ble-plx";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BluetoothDevice {
  id: string;
  name: string;
  address: string;
  connected: boolean;
  rssi?: number;
  type?: string;
  serviceUUIDs?: string[];
}

// ─── Singleton BleManager ─────────────────────────────────────────────────────
// Create once outside the component so it survives re-renders.
let bleManager: BleManager | null = null;
try {
  bleManager = new BleManager();
} catch (e) {
  console.warn("BleManager init failed:", e);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SettingsTab() {
  const [notifications, setNotifications] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [bluetoothEnabled, setBluetoothEnabled] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);

  const [notificationPermission, setNotificationPermission] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);
  const [bluetoothPermission, setBluetoothPermission] = useState(false);

  const [bluetoothDevices, setBluetoothDevices] = useState<BluetoothDevice[]>([]);
  const [scanningDevices, setScanningDevices] = useState(false);
  const [showDevicesList, setShowDevicesList] = useState(false);
  const [isBluetoothSupported, setIsBluetoothSupported] = useState(true);

  // Refs — never cause re-renders
  const stateSubscription = useRef<Subscription | null>(null);   // BLE state listener
  const appStateSubscription = useRef<ReturnType<typeof AppState.addEventListener> | null>(null);
  const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Use a ref for device count so the setTimeout closure always reads the latest value
  const deviceCountRef = useRef(0);

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  useEffect(() => {
    configureNotifications();
    checkPermissions();
    loadSoundSetting();
    initBluetooth();
    appStateSubscription.current = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      cleanupScan();
      // Remove the single state-change subscription
      stateSubscription.current?.remove();
      appStateSubscription.current?.remove();
      // Destroy manager only if we own it (safe to call multiple times in dev)
      // bleManager?.destroy();  ← uncomment if you want full teardown on unmount
    };
  }, []);

  useEffect(() => {
    if (notificationPermission) configureNotifications();
  }, [soundEnabled, notificationPermission]);

  // Keep deviceCountRef in sync so setTimeout closures read the latest value
  useEffect(() => {
    deviceCountRef.current = bluetoothDevices.length;
  }, [bluetoothDevices]);

  // ─── App State ──────────────────────────────────────────────────────────────

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === "active") {
      refreshBluetoothState();
    } else if (nextAppState === "background") {
      // Stop scanning to save battery when app is backgrounded
      stopBluetoothScan();
    }
  };

  // ─── Bluetooth init ─────────────────────────────────────────────────────────

  const initBluetooth = async () => {
    if (!bleManager) {
      setIsBluetoothSupported(false);
      return;
    }
    setIsBluetoothSupported(true);
    await refreshBluetoothState();
    await loadBluetoothDevices();
  };

  /**
   * Reads the current adapter state and registers ONE state-change listener.
   * Re-registering is safe because we remove the previous subscription first.
   */
  const refreshBluetoothState = async () => {
    if (!bleManager) return;

    try {
      const state: State = await bleManager.state();
      applyBluetoothState(state);

      // Remove old subscription before adding a new one
      stateSubscription.current?.remove();
      stateSubscription.current = bleManager.onStateChange((newState) => {
        applyBluetoothState(newState);
        if (newState !== State.PoweredOn) {
          stopBluetoothScan();
        }
      }, false); // false = don't emit current state immediately (we already read it above)
    } catch (e) {
      console.error("refreshBluetoothState error:", e);
      setBluetoothEnabled(false);
      setBluetoothPermission(false);
    }
  };

  const applyBluetoothState = (state: State) => {
    const on = state === State.PoweredOn;
    setBluetoothEnabled(on);
    setBluetoothPermission(on);
    AsyncStorage.setItem("bluetooth_enabled", String(on));
  };

  // ─── Android 12+ runtime permissions ────────────────────────────────────────

  const requestAndroidBluetoothPermissions = async (): Promise<boolean> => {
    if (Platform.OS !== "android") return true;

    // Android 12+ (API 31+) needs BLUETOOTH_SCAN and BLUETOOTH_CONNECT
    if (Platform.Version >= 31) {
      const results = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);

      const allGranted = Object.values(results).every(
        (r) => r === PermissionsAndroid.RESULTS.GRANTED
      );
      if (!allGranted) {
        Alert.alert(
          "Permissions Required",
          "Bluetooth Scan, Connect, and Location permissions are needed to discover devices.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: openAppSettings },
          ]
        );
        return false;
      }
      return true;
    }

    // Android < 12 — only location is required for BLE scanning
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Location Permission Required",
        "Android requires location permission to scan for Bluetooth devices.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Grant", onPress: () => Location.requestForegroundPermissionsAsync() },
        ]
      );
      return false;
    }
    return true;
  };

  // ─── Scan ────────────────────────────────────────────────────────────────────

  const startBluetoothScan = async (): Promise<boolean> => {
    if (!bleManager) {
      Alert.alert("Not Supported", "Bluetooth is not supported on this device.");
      return false;
    }

    const state = await bleManager.state();
    if (state !== State.PoweredOn) {
      promptOpenBluetoothSettings();
      return false;
    }

    const hasPermissions = await requestAndroidBluetoothPermissions();
    if (!hasPermissions) return false;

    // Clear list and start fresh
    setBluetoothDevices([]);
    deviceCountRef.current = 0;
    setScanningDevices(true);

    bleManager.startDeviceScan(
      null,   // null = all service UUIDs
      { allowDuplicates: true },  // allowDuplicates keeps RSSI fresh
      (error, device) => {
        if (error) {
          console.error("Scan callback error:", error);
          // Error code 600 = scan already in progress; just ignore it
          if (error.errorCode !== 600) {
            setScanningDevices(false);
          }
          return;
        }

        if (!device?.id) return;

        const newDevice: BluetoothDevice = {
          id: device.id,
          name: device.name || device.localName || "Unknown Device",
          address: device.id,
          connected: false,
          rssi: device.rssi ?? undefined,
          type: "BLE Device",
          serviceUUIDs: device.serviceUUIDs ?? undefined,
        };

        setBluetoothDevices((prev) => {
          const idx = prev.findIndex((d) => d.id === device.id);
          if (idx >= 0) {
            // Update RSSI for already-known device
            const updated = [...prev];
            updated[idx] = { ...updated[idx], rssi: newDevice.rssi };
            return updated;
          }
          return [...prev, newDevice];
        });
      }
    );

    // Auto-stop after 30 s — use ref so closure always reads latest count
    scanTimeoutRef.current = setTimeout(() => {
      stopBluetoothScan();
      Alert.alert("Scan Complete", `Found ${deviceCountRef.current} device(s).`);
    }, 30_000);

    return true;
  };

  const stopBluetoothScan = () => {
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
    try {
      bleManager?.stopDeviceScan();
    } catch (e) {
      console.warn("stopDeviceScan error:", e);
    }
    setScanningDevices(false);
  };

  /** Called from the cleanup in useEffect — synchronous, no state updates. */
  const cleanupScan = () => {
    if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
    try { bleManager?.stopDeviceScan(); } catch (_) {}
  };

  const scanForDevices = async () => {
    if (!bluetoothEnabled) {
      Alert.alert("Bluetooth Disabled", "Please enable Bluetooth first.");
      return;
    }
    if (scanningDevices) {
      stopBluetoothScan();
      return;
    }
    const started = await startBluetoothScan();
    if (started) {
      Alert.alert("Scanning", "Searching for nearby Bluetooth devices…");
    }
  };

  // ─── Connect / Disconnect / Forget ──────────────────────────────────────────

  const connectToDevice = (device: BluetoothDevice) => {
    Alert.alert("Connect", `Connect to ${device.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Connect",
        onPress: async () => {
          try {
            if (scanningDevices) stopBluetoothScan();
            await bleManager?.connectToDevice(device.id);
            updateDeviceState(device.id, { connected: true });
            Alert.alert("✅ Connected", `Connected to ${device.name}`);
          } catch (e) {
            console.error("connect error:", e);
            Alert.alert("Connection Failed", "Could not connect to the device.");
          }
        },
      },
    ]);
  };

  const disconnectDevice = (device: BluetoothDevice) => {
    Alert.alert("Disconnect", `Disconnect from ${device.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Disconnect",
        style: "destructive",
        onPress: async () => {
          try {
            await bleManager?.cancelDeviceConnection(device.id);
            updateDeviceState(device.id, { connected: false });
            Alert.alert("Disconnected", `Disconnected from ${device.name}`);
          } catch (e) {
            console.error("disconnect error:", e);
            Alert.alert("Error", "Failed to disconnect.");
          }
        },
      },
    ]);
  };

  const forgetDevice = (device: BluetoothDevice) => {
    Alert.alert("Forget Device", `Remove ${device.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Forget",
        style: "destructive",
        onPress: async () => {
          try {
            if (device.connected) await bleManager?.cancelDeviceConnection(device.id);
            setBluetoothDevices((prev) => {
              const updated = prev.filter((d) => d.id !== device.id);
              saveBluetoothDevices(updated);
              return updated;
            });
            Alert.alert("Removed", `${device.name} has been forgotten.`);
          } catch (e) {
            console.error("forget error:", e);
            Alert.alert("Error", "Failed to forget device.");
          }
        },
      },
    ]);
  };

  /** Helper to patch a single device in state and persist. */
  const updateDeviceState = (id: string, patch: Partial<BluetoothDevice>) => {
    setBluetoothDevices((prev) => {
      const updated = prev.map((d) => (d.id === id ? { ...d, ...patch } : d));
      saveBluetoothDevices(updated);
      return updated;
    });
  };

  // ─── Persistence ─────────────────────────────────────────────────────────────

  const loadBluetoothDevices = async () => {
    try {
      const raw = await AsyncStorage.getItem("bluetooth_devices");
      if (raw) setBluetoothDevices(JSON.parse(raw));
    } catch (e) {
      console.error("loadBluetoothDevices error:", e);
    }
  };

  const saveBluetoothDevices = async (devices: BluetoothDevice[]) => {
    try {
      await AsyncStorage.setItem("bluetooth_devices", JSON.stringify(devices));
    } catch (e) {
      console.error("saveBluetoothDevices error:", e);
    }
  };

  // ─── Notifications ───────────────────────────────────────────────────────────

  const configureNotifications = () => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: soundEnabled,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      }),
    });
  };

  const loadSoundSetting = async () => {
    const saved = await AsyncStorage.getItem("sound_enabled");
    if (saved !== null) setSoundEnabled(saved === "true");
  };

  const checkPermissions = async () => {
    const { status: notifStatus } = await Notifications.getPermissionsAsync();
    setNotificationPermission(notifStatus === "granted");
    setNotifications(notifStatus === "granted");

    const { status: locStatus } = await Location.getForegroundPermissionsAsync();
    setLocationPermission(locStatus === "granted");
    setLocationEnabled(locStatus === "granted");
  };

  // ─── Toggle handlers ──────────────────────────────────────────────────────────

  const handleNotificationToggle = async (value: boolean) => {
    if (value) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === "granted") {
        setNotificationPermission(true);
        setNotifications(true);
        configureNotifications();
        Alert.alert("✅ Success", "Notifications enabled.");
      } else {
        Alert.alert("Permission Required", "Enable notifications in device settings.", [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: openAppSettings },
        ]);
        setNotifications(false);
      }
    } else {
      setNotifications(false);
      setNotificationPermission(false);
    }
  };

  const handleSoundToggle = async (value: boolean) => {
    setSoundEnabled(value);
    await AsyncStorage.setItem("sound_enabled", String(value));
  };

  const handleLocationToggle = async (value: boolean) => {
    if (value) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        setLocationPermission(true);
        setLocationEnabled(true);
        Alert.alert("✅ Success", "Location access granted.");
      } else {
        Alert.alert("Permission Required", "Enable location access in settings.", [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: openAppSettings },
        ]);
        setLocationEnabled(false);
      }
    } else {
      setLocationEnabled(false);
      setLocationPermission(false);
    }
  };

  /**
   * The toggle is READ-ONLY — it mirrors the real adapter state.
   * Apps cannot programmatically turn Bluetooth on/off on iOS (ever) or
   * Android 13+ (BLUETOOTH_ADMIN was removed). The only valid action is to
   * send the user to the system settings page.
   *
   * We intentionally do NOT call setBluetoothEnabled here — that state is
   * driven solely by the BleManager state-change listener in applyBluetoothState.
   */
  const handleBluetoothToggle = async (_value: boolean) => {
    if (!isBluetoothSupported) {
      Alert.alert("Not Supported", "Bluetooth is not supported on this device.");
      return;
    }
    promptOpenBluetoothSettings();
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  const promptOpenBluetoothSettings = () => {
    const isOn = bluetoothEnabled;
    Alert.alert(
      isOn ? "Bluetooth is On" : "Bluetooth is Off",
      isOn
        ? "Bluetooth is already enabled. Open Settings to manage it."
        : "Please enable Bluetooth in your device settings, then come back.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Open Settings", onPress: openBluetoothSettings },
      ]
    );
  };

  const openBluetoothSettings = () => {
    if (Platform.OS === "ios") {
      // App-Prefs:Bluetooth is blocked on iOS 16+.
      // Linking.openSettings() is the only Apple-approved path.
      Linking.openSettings();
    } else {
      IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.BLUETOOTH_SETTINGS
      );
    }
  };

  const openAppSettings = () => {
    if (Platform.OS === "ios") {
      Linking.openURL("app-settings:");
    } else {
      IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,
        { data: `package:${Application.applicationId}` }
      );
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          stopBluetoothScan();
          await AsyncStorage.removeItem("user");
          router.replace("/");
        },
      },
    ]);
  };

  // ─── Signal helpers ───────────────────────────────────────────────────────────

  const getSignalStrengthLabel = (rssi?: number): string => {
    if (rssi === undefined) return "Unknown";
    if (rssi > -50) return "Excellent";
    if (rssi > -60) return "Good";
    if (rssi > -70) return "Fair";
    return "Weak";
  };

  // ─── Render helpers ───────────────────────────────────────────────────────────

  const renderBluetoothDevice = ({ item }: { item: BluetoothDevice }) => (
    <View style={styles.deviceCard}>
      <View style={styles.deviceHeader}>
        <View style={styles.deviceIconContainer}>
          <Text style={styles.deviceIcon}>🔵</Text>
        </View>
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName}>{item.name}</Text>
          <Text style={styles.deviceAddress}>{item.address}</Text>
          {item.rssi !== undefined && (
            <Text style={styles.signalText}>
              Signal: {getSignalStrengthLabel(item.rssi)} ({item.rssi} dBm)
            </Text>
          )}
        </View>
        <View style={styles.deviceStatus}>
          <View style={item.connected ? styles.connectedBadge : styles.disconnectedBadge}>
            <Text style={item.connected ? styles.connectedText : styles.disconnectedText}>
              {item.connected ? "Connected" : "Not Connected"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.deviceActions}>
        {item.connected ? (
          <TouchableOpacity style={styles.disconnectButton} onPress={() => disconnectDevice(item)}>
            <Text style={styles.disconnectButtonText}>Disconnect</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.connectButton} onPress={() => connectToDevice(item)}>
            <Text style={styles.connectButtonText}>Connect</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.forgetButton} onPress={() => forgetDevice(item)}>
          <Text style={styles.forgetButtonText}>Forget</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ─── Settings list data ───────────────────────────────────────────────────────

  const settingItems = [
    {
      label: "Push Notifications",
      value: notifications,
      onChange: handleNotificationToggle,
      description: "Receive alerts for vehicle entries/exits",
    },
    {
      label: "Sound Effects",
      value: soundEnabled,
      onChange: handleSoundToggle,
      description: "Play sounds for notifications",
    },
    {
      label: "Bluetooth",
      value: bluetoothEnabled,
      onChange: handleBluetoothToggle,
      description: isBluetoothSupported
        ? "Connect to Bluetooth devices"
        : "Bluetooth not supported on this device",
      disabled: !isBluetoothSupported,
    },
    {
      label: "Location Access",
      value: locationEnabled,
      onChange: handleLocationToggle,
      description: "Required for accurate parking detection",
    },
  ];

  // ─── JSX ─────────────────────────────────────────────────────────────────────

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      {/* Account */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>👤 Account</Text>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>S</Text>
          </View>
          <View>
            <Text style={styles.profileName}>Staff Member</Text>
            <Text style={styles.profileRole}>Parking Staff</Text>
          </View>
        </View>
      </View>

      {/* Permissions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>⚙️ Permissions & Features</Text>
        {settingItems.map((item, index) => (
          <View
            key={item.label}
            style={[
              styles.settingRow,
              index < settingItems.length - 1 && styles.settingRowBorder,
            ]}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{item.label}</Text>
              {item.description && (
                <Text style={styles.settingDescription}>{item.description}</Text>
              )}
            </View>
            <Switch
              value={item.value}
              onValueChange={item.onChange}
              trackColor={{ false: "#e0e0e0", true: "#DC2626" }}
              thumbColor="#fff"
              disabled={item.disabled}
            />
          </View>
        ))}
      </View>

      {/* Bluetooth Devices */}
      {bluetoothEnabled && (
        <View style={styles.card}>
          <View style={styles.bluetoothHeader}>
            <Text style={styles.cardTitle}>📱 Bluetooth Devices</Text>
            <TouchableOpacity
              style={styles.toggleDevicesButton}
              onPress={() => setShowDevicesList((v) => !v)}
            >
              <Text style={styles.toggleDevicesText}>
                {showDevicesList ? "▼ Hide" : "▶ Show"}
              </Text>
            </TouchableOpacity>
          </View>

          {showDevicesList && (
            <>
              <View style={styles.scanButtonContainer}>
                <TouchableOpacity
                  style={styles.scanButton}
                  onPress={scanForDevices}
                >
                  {scanningDevices ? (
                    <>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={styles.scanButtonText}>  Scanning…</Text>
                    </>
                  ) : (
                    <Text style={styles.scanButtonText}>🔍 Scan for Devices</Text>
                  )}
                </TouchableOpacity>
                {scanningDevices && (
                  <TouchableOpacity style={styles.stopScanButton} onPress={stopBluetoothScan}>
                    <Text style={styles.stopScanButtonText}>Stop</Text>
                  </TouchableOpacity>
                )}
              </View>

              {bluetoothDevices.length === 0 ? (
                <View style={styles.emptyDevices}>
                  <Text style={styles.emptyDevicesIcon}>📡</Text>
                  <Text style={styles.emptyDevicesText}>No devices found</Text>
                  <Text style={styles.emptyDevicesSubtext}>Tap scan to find nearby devices</Text>
                </View>
              ) : (
                <FlatList
                  data={bluetoothDevices}
                  renderItem={renderBluetoothDevice}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  contentContainerStyle={styles.devicesList}
                />
              )}
            </>
          )}
        </View>
      )}

      {/* Status */}
      <View style={styles.statusCard}>
        <Text style={styles.cardTitle}>📊 Current Status</Text>
        {[
          { label: "Notifications", active: notificationPermission },
          { label: "Location", active: locationPermission },
          { label: "Bluetooth", active: bluetoothPermission },
        ].map((row) => (
          <View key={row.label} style={styles.statusRow}>
            <Text style={styles.statusLabel}>{row.label}</Text>
            <Text style={[styles.statusValue, row.active ? styles.statusActive : styles.statusInactive]}>
              {row.active ? "✅ Active" : "❌ Inactive"}
            </Text>
          </View>
        ))}
        {bluetoothEnabled && bluetoothDevices.length > 0 && (
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Connected Devices</Text>
            <Text style={[styles.statusValue, styles.statusActive]}>
              {bluetoothDevices.filter((d) => d.connected).length} / {bluetoothDevices.length}
            </Text>
          </View>
        )}
      </View>

      {/* App Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>ℹ️ App Info</Text>
        {[
          { label: "Version", value: "1.0.0" },
          { label: "App", value: "SafePark" },
          { label: "Device", value: Platform.OS === "ios" ? "iPhone" : "Android" },
        ].map((row) => (
          <View key={row.label} style={styles.infoRow}>
            <Text style={styles.infoLabel}>{row.label}</Text>
            <Text style={styles.infoValue}>{row.value}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>🚪 Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  tabContent: { padding: 16, paddingBottom: 32 },
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
  statusCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#1a1a1a", marginBottom: 12 },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 4 },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: "#DC2626", justifyContent: "center", alignItems: "center",
  },
  avatarText: { color: "#fff", fontSize: 20, fontWeight: "800" },
  profileName: { fontSize: 16, fontWeight: "700", color: "#1a1a1a" },
  profileRole: { fontSize: 13, color: "#888", marginTop: 2 },
  settingRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingVertical: 14,
  },
  settingInfo: { flex: 1, marginRight: 12 },
  settingRowBorder: { borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  settingLabel: { fontSize: 15, color: "#333", fontWeight: "500" },
  settingDescription: { fontSize: 12, color: "#999", marginTop: 2 },
  bluetoothHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 12,
  },
  toggleDevicesButton: {
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: "#f5f5f5", borderRadius: 8,
  },
  toggleDevicesText: { fontSize: 12, fontWeight: "600", color: "#666" },
  scanButtonContainer: { marginBottom: 16, flexDirection: "row", gap: 10 },
  scanButton: {
    flex: 1, backgroundColor: "#DC2626", padding: 14, borderRadius: 10,
    alignItems: "center", flexDirection: "row", justifyContent: "center",
  },
  scanButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  stopScanButton: {
    backgroundColor: "#6B7280", padding: 14, borderRadius: 10,
    alignItems: "center", justifyContent: "center", paddingHorizontal: 20,
  },
  stopScanButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  devicesList: { gap: 12 },
  deviceCard: {
    backgroundColor: "#f8f9fa", borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: "#e9ecef", marginBottom: 8,
  },
  deviceHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 12 },
  deviceIconContainer: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: "#fff",
    justifyContent: "center", alignItems: "center", marginRight: 12,
  },
  deviceIcon: { fontSize: 22 },
  deviceInfo: { flex: 1 },
  deviceName: { fontSize: 15, fontWeight: "600", color: "#1a1a1a", marginBottom: 4 },
  deviceAddress: { fontSize: 12, color: "#666", marginBottom: 4 },
  signalText: { fontSize: 11, color: "#888", fontWeight: "500", marginTop: 4 },
  deviceStatus: { marginLeft: 8 },
  connectedBadge: {
    backgroundColor: "#D1FAE5", paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 12,
  },
  connectedText: { fontSize: 11, fontWeight: "600", color: "#065F46" },
  disconnectedBadge: {
    backgroundColor: "#FEE2E2", paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 12,
  },
  disconnectedText: { fontSize: 11, fontWeight: "600", color: "#991B1B" },
  deviceActions: { flexDirection: "row", gap: 8 },
  connectButton: {
    flex: 1, backgroundColor: "#DC2626", padding: 10,
    borderRadius: 8, alignItems: "center",
  },
  connectButtonText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  disconnectButton: {
    flex: 1, backgroundColor: "#6B7280", padding: 10,
    borderRadius: 8, alignItems: "center",
  },
  disconnectButtonText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  forgetButton: {
    flex: 1, backgroundColor: "#F3F4F6", padding: 10, borderRadius: 8,
    alignItems: "center", borderWidth: 1, borderColor: "#D1D5DB",
  },
  forgetButtonText: { color: "#374151", fontSize: 13, fontWeight: "600" },
  emptyDevices: { alignItems: "center", paddingVertical: 40 },
  emptyDevicesIcon: { fontSize: 48, marginBottom: 12, opacity: 0.3 },
  emptyDevicesText: { fontSize: 16, color: "#666", fontWeight: "600", marginBottom: 4 },
  emptyDevicesSubtext: { fontSize: 13, color: "#999" },
  statusRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#e9ecef",
  },
  statusLabel: { fontSize: 14, color: "#666" },
  statusValue: { fontSize: 14, fontWeight: "600" },
  statusActive: { color: "#10b981" },
  statusInactive: { color: "#ef4444" },
  infoRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f5f5f5",
  },
  infoLabel: { fontSize: 14, color: "#888" },
  infoValue: { fontSize: 14, fontWeight: "600", color: "#333" },
  logoutButton: {
    backgroundColor: "#fff", borderWidth: 2, borderColor: "#DC2626",
    padding: 15, borderRadius: 12, alignItems: "center", marginTop: 4, marginBottom: 8,
  },
  logoutButtonText: { color: "#DC2626", fontSize: 16, fontWeight: "700" },
});