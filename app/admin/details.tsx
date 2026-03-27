import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

const menuItems = [
  {
    id: 1,
    name: "Location",
    icon: "📍",
    route: "/admin/location",
    count: 12,
    color: "#FF6B6B",
  },
  {
    id: 2,
    name: "Staff Registration",
    icon: "👨‍💼",
    route: "/admin/staff",
    count: 8,
    color: "#4ECDC4",
  },
  {
    id: 3,
    name: "Tariff",
    icon: "💰",
    route: "/admin/tariff",
    count: 6,
    color: "#FFD93D",
  },
  { id: 4, name: "Collections", icon: "🅿️", route: "/admin/collections", count: 24, color: "#6C5CE7" },
  {
    id: 5,
    name: "Vehicle Type",
    icon: "🚗",
    route: "/admin/vehicle-type",
    count: 5,
    color: "#FF9F43",
  },
];

export default function Details() {
  // Calculate total items
  const totalItems = menuItems.reduce(
    (acc, item) => acc + (item.count || 0),
    0,
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Welcome Section - Simplified */}
        <View style={styles.welcomeSection}>
          <View>
            <Text style={styles.welcomeTitle}>Dashboard</Text>
            <Text style={styles.welcomeSubtitle}>
              Manage your parking system
            </Text>
          </View>
          <View style={styles.statsBadge}>
            <Text style={styles.statsBadgeText}>{totalItems} total items</Text>
          </View>
        </View>

        {/* Menu Items Grid */}
        <View style={styles.menuGrid}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={["#ffffff", "#f8f9fa"]}
                style={styles.cardGradient}
              >
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: `${item.color}15` },
                  ]}
                >
                  <Text style={styles.icon}>{item.icon}</Text>
                </View>

                <View style={styles.cardContent}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View style={styles.countBadge}>
                    <Text style={styles.count}>{item.count}</Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.cardFooterText}>View Details</Text>
                  <View style={styles.arrowCircle}>
                    <Text style={styles.arrow}>→</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Activity Section */}
        <View style={styles.activitySection}>
          <Text style={styles.activityTitle}>Recent Activity</Text>

          <View style={styles.activityCard}>
            <View style={styles.activityItem}>
              <View style={styles.activityIconContainer}>
                <Text style={styles.activityIcon}>📍</Text>
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>New location added</Text>
                <Text style={styles.activityTime}>2 hours ago</Text>
              </View>
            </View>

            <View style={styles.activityDivider} />

            <View style={styles.activityItem}>
              <View style={styles.activityIconContainer}>
                <Text style={styles.activityIcon}>👨‍💼</Text>
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>New staff registered</Text>
                <Text style={styles.activityTime}>5 hours ago</Text>
              </View>
            </View>

            <View style={styles.activityDivider} />

            <View style={styles.activityItem}>
              <View style={styles.activityIconContainer}>
                <Text style={styles.activityIcon}>💰</Text>
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>Tariff updated</Text>
                <Text style={styles.activityTime}>Yesterday</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Stats Footer */}
        <View style={styles.quickStats}>
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatValue}>85%</Text>
            <Text style={styles.quickStatLabel}>Occupancy</Text>
          </View>
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatValue}>₹12.5k</Text>
            <Text style={styles.quickStatLabel}>Today's Revenue</Text>
          </View>
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatValue}>42</Text>
            <Text style={styles.quickStatLabel}>Active Vehicles</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 30,
  },
  welcomeSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  statsBadge: {
    backgroundColor: "rgba(211, 47, 47, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statsBadgeText: {
    fontSize: 12,
    color: "#d32f2f",
    fontWeight: "600",
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  card: {
    width: (width - 50) / 2,
    marginBottom: 15,
    borderRadius: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardGradient: {
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  icon: {
    fontSize: 24,
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  countBadge: {
    backgroundColor: "#d32f2f",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  count: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "bold",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardFooterText: {
    fontSize: 12,
    color: "#999",
  },
  arrowCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(211, 47, 47, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  arrow: {
    fontSize: 16,
    color: "#d32f2f",
    fontWeight: "bold",
  },
  activitySection: {
    marginBottom: 25,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 15,
  },
  activityCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(211, 47, 47, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  activityIcon: {
    fontSize: 20,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: "#999",
  },
  activityDivider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 5,
  },
  quickStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 15,
    marginTop: 5,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickStatItem: {
    flex: 1,
    alignItems: "center",
  },
  quickStatValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#d32f2f",
    marginBottom: 2,
  },
  quickStatLabel: {
    fontSize: 10,
    color: "#999",
    textAlign: "center",
  },
});
