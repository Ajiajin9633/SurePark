import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { Platform, StyleSheet, Text, View } from "react-native";

const TAB_ICONS: Record<string, { icon: string; active: string }> = {
  reports: { icon: "📊", active: "📈" },
  payments: { icon: "💳", active: "💰" },
  details: { icon: "📋", active: "📝" },
  settings: { icon: "⚙️", active: "🔧" },
};

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <BlurView
            tint="light"
            intensity={80}
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarActiveTintColor: "#d32f2f",
        tabBarInactiveTintColor: "rgba(0,0,0,0.5)",
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
                  { color: focused ? "#d32f2f" : "rgba(0,0,0,0.5)" },
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
          title: "Payments",
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
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    height: 70,
    backgroundColor: "transparent",
    borderTopWidth: 0,
    elevation: 0,
    borderRadius: 35,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
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
    backgroundColor: "rgba(211, 47, 47, 0.1)",
    transform: [{ scale: 1.1 }],
  },
  icon: {
    fontSize: 24,
  },
});
