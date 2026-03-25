import { router, Slot, usePathname } from "expo-router";
import { Alert, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TAB_ICONS: Record<string, string> = {
  "index": "🚗",
  "exit": "🅿️",
  "settings": "⚙️",
};

const TAB_NAMES: Record<string, string> = {
  "index": "Entry",
  "exit": "Exit",
  "settings": "Settings",
};

const TAB_ROUTES = {
  index: "/(staff)",
  exit: "/(staff)/exit",
  settings: "/(staff)/settings",
};

export default function StaffLayout() {
  const pathname = usePathname();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => router.replace("/"),
      },
    ]);
  };

  const getActiveTab = () => {
    if (pathname === "/(staff)" || pathname === "/") return "index";
    if (pathname.includes("/exit")) return "exit";
    if (pathname.includes("/settings")) return "settings";
    return "index";
  };

  const activeTab = getActiveTab();

  const navigateToTab = (tab: string) => {
    switch (tab) {
      case "index":
        router.push("/(tabs)/dashboard");
        break;
      case "exit":
        router.push("/(tabs)/exit");
        break;
      case "settings":
        router.push("/(tabs)/settings");
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" backgroundColor="#DC2626" />

      {/* Common Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>SafePark</Text>
          <Text style={styles.headerSubtitle}>Staff Dashboard</Text>
        </View>
        <TouchableOpacity style={styles.headerLogout} onPress={handleLogout}>
          <Text style={styles.headerLogoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Page Content */}
      <View style={styles.content}>
        <Slot />
      </View>

      {/* Common Bottom Tab Bar */}
      <View style={styles.tabBar}>
        {(["index", "exit", "settings"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
            onPress={() => navigateToTab(tab)}
          >
            <Text style={styles.tabIcon}>{TAB_ICONS[tab]}</Text>
            <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
              {TAB_NAMES[tab]}
            </Text>
            {activeTab === tab && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f4f4f4" 
  },
  header: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { 
    color: "#fff", 
    fontSize: 20, 
    fontWeight: "800" 
  },
  headerSubtitle: { 
    color: "rgba(255,255,255,0.75)", 
    fontSize: 13, 
    marginTop: 2 
  },
  headerLogout: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  headerLogoutText: { 
    color: "#fff", 
    fontSize: 13, 
    fontWeight: "600" 
  },
  content: { 
    flex: 1 
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 4,
    position: "relative",
  },
  tabItemActive: {
    // Add any active styles if needed
  },
  tabIcon: { 
    fontSize: 22 
  },
  tabLabel: { 
    fontSize: 11, 
    color: "#aaa", 
    marginTop: 3, 
    fontWeight: "500" 
  },
  tabLabelActive: { 
    color: "#DC2626", 
    fontWeight: "700" 
  },
  tabIndicator: {
    position: "absolute",
    top: 0,
    width: 32,
    height: 3,
    backgroundColor: "#DC2626",
    borderRadius: 2,
  },
});