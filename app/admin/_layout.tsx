import { Tabs } from "expo-router";
import { Text } from "react-native";

const TAB_ICONS: Record<string, string> = {
  reports: "📊",
  payments: "💳",
  details: "📋",
  settings: "⚙️",
};

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { height: 80, backgroundColor: "#d2cdcd", borderTopWidth: 0 },
      }}
    >

      {/* Visible Tabs */}

      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
          tabBarIcon: () => <Text>{TAB_ICONS.reports}</Text>,
        }}
      />

      <Tabs.Screen
        name="payments"
        options={{
          title: "Payments",
          tabBarIcon: () => <Text>{TAB_ICONS.payments}</Text>,
        }}
      />

      <Tabs.Screen
        name="details"
        options={{
          title: "Details",
          tabBarIcon: () => <Text>{TAB_ICONS.details}</Text>,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: () => <Text>{TAB_ICONS.settings}</Text>,
        }}
      />
      
      <Tabs.Screen name="location/index" options={{ href: null }} />
      <Tabs.Screen name="staff" options={{ href: null }} />
    </Tabs>
  );
}