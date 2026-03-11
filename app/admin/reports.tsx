import { Stack, router } from "expo-router";
import {
    Alert,
    Dimensions,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

const { width } = Dimensions.get("window");

// ─── Mini Bar Chart Component ────────────────────────────────────────────────
function BarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map((d) => d.value));

  return (
    <View style={chartStyles.container}>
      {data.map((item) => (
        <View key={item.label} style={chartStyles.barWrapper}>
          <Text style={chartStyles.barValue}>{item.value}</Text>

          <View style={chartStyles.barTrack}>
            <View
              style={[
                chartStyles.bar,
                { height: (item.value / max) * 100, backgroundColor: item.color },
              ]}
            />
          </View>

          <Text style={chartStyles.barLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 140,
    paddingTop: 24,
  },
  barWrapper: { alignItems: "center", flex: 1 },
  barTrack: {
    width: 28,
    height: 100,
    justifyContent: "flex-end",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    overflow: "hidden",
  },
  bar: { width: "100%", borderRadius: 8 },
  barValue: { fontSize: 11, fontWeight: "700", color: "#444", marginBottom: 4 },
  barLabel: { fontSize: 10, color: "#888", marginTop: 6, fontWeight: "500" },
});

// ─── Reports Section ──────────────────────────────────────────────────────────
function ReportsSection() {

  const stats = [
    { label: "Total Vehicles", value: "440", icon: "🚗", bg: "#FEE2E2", color: "#DC2626" },
    { label: "Peak Hour", value: "11 AM", icon: "⏰", bg: "#FEF3C7", color: "#D97706" },
    { label: "Avg/Day", value: "63", icon: "📈", bg: "#D1FAE5", color: "#059669" },
    { label: "Occupancy", value: "78%", icon: "🅿️", bg: "#DBEAFE", color: "#2563EB" },
  ];

  const weekData = [
    { label: "Mon", value: 42, color: "#DC2626" },
    { label: "Tue", value: 58, color: "#DC2626" },
    { label: "Wed", value: 35, color: "#DC2626" },
    { label: "Thu", value: 70, color: "#DC2626" },
    { label: "Fri", value: 85, color: "#DC2626" },
  ];

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>

      {/* Stats */}
      <View style={styles.statsGrid}>
        {stats.map((s) => (
          <View key={s.label} style={[styles.statCard, { backgroundColor: s.bg }]}>
            <Text style={styles.statIcon}>{s.icon}</Text>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Chart */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 Parking Activity</Text>
        <BarChart data={weekData} />
      </View>

    </ScrollView>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
export default function AdminDashboard() {

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: () => router.replace("/") },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>

      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor="#DC2626" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>SafePark</Text>
          <Text style={styles.headerSubtitle}>Admin Dashboard</Text>
        </View>

        <TouchableOpacity style={styles.headerLogout} onPress={handleLogout}>
          <Text style={styles.headerLogoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Dashboard Content */}
      <View style={styles.content}>
        <ReportsSection />
      </View>

    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({

  container:{ flex:1, backgroundColor:"#f4f4f4" },

  header:{
    backgroundColor:"#DC2626",
    paddingHorizontal:20,
    paddingVertical:16,
    flexDirection:"row",
    justifyContent:"space-between",
    alignItems:"center"
  },

  headerTitle:{ color:"#fff", fontSize:20, fontWeight:"800" },

  headerSubtitle:{ color:"rgba(255,255,255,0.65)", fontSize:13 },

  headerLogout:{
    backgroundColor:"rgba(255,255,255,0.15)",
    paddingHorizontal:14,
    paddingVertical:7,
    borderRadius:20
  },

  headerLogoutText:{ color:"#fff", fontSize:13, fontWeight:"600" },

  content:{ flex:1 },

  tabContent:{ padding:16 },

  statsGrid:{ flexDirection:"row", flexWrap:"wrap", gap:10 },

  statCard:{
    width:(width-42)/2,
    borderRadius:14,
    padding:14,
    alignItems:"center"
  },

  statIcon:{ fontSize:22 },

  statValue:{ fontSize:22, fontWeight:"800" },

  statLabel:{ fontSize:12, color:"#555" },

  card:{
    backgroundColor:"#fff",
    borderRadius:16,
    padding:18,
    marginTop:16
  },

  cardTitle:{
    fontSize:15,
    fontWeight:"700",
    marginBottom:14
  }

});