import { Tabs } from "expo-router";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_ICONS: Record<string, { icon: string; active: string }> = {
  reports: { icon: "📊", active: "📈" },
  payments: { icon: "💳", active: "💰" },
  details: { icon: "📋", active: "📝" },
  settings: { icon: "⚙️", active: "🔧" },
};

export default function AdminLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            height: 70 + insets.bottom,
            paddingBottom: insets.bottom > 0 ? insets.bottom - 5 : 5,
          },
        ],
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarActiveTintColor: "#d32f2f",
        tabBarInactiveTintColor: "#8E8E93",
        tabBarIcon: ({ focused, color }) => {
          const icons = TAB_ICONS[route.name];
          if (!icons) return null;

          return (
            <View
              style={[
                styles.iconContainer,
                focused && styles.iconContainerActive,
              ]}
            >
              <Text
                style={[
                  styles.icon,
                  { color: focused ? "#d32f2f" : "#8E8E93" },
                ]}
              >
                {focused ? icons.active : icons.icon}
              </Text>
            </View>
          );
        },
      })}
    >
      {/* Visible Tabs */}
      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
        }}
      />

      <Tabs.Screen
        name="payments"
        options={{
          title: "Collections",
        }}
      />

      <Tabs.Screen
        name="details"
        options={{
          title: "Details",
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
        }}
      />

      {/* Hidden Tabs */}
      <Tabs.Screen name="location/index" options={{ href: null }} />
      <Tabs.Screen name="staff" options={{ href: null }} />
      <Tabs.Screen name="tariff" options={{ href: null }} />
      <Tabs.Screen name="vehicle-type" options={{ href: null }} />
      <Tabs.Screen name="parked" options={{ href: null }} />
      <Tabs.Screen name="collections" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    elevation: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 6,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  iconContainerActive: {
    backgroundColor: "#fbe9e9",
  },
  icon: {
    fontSize: 24,
  },
});
