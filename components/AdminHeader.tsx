import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Alert, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  onLogout?: () => void;
  hideLogout?: boolean;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  title,
  subtitle,
  showBackButton = false,
  onBack,
  onLogout,
  hideLogout = false,
}) => {
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      Alert.alert("Logout", "Are you sure you want to logout?", [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: () => router.replace("/") },
      ]);
    }
  };

  return (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <StatusBar barStyle="light-content" backgroundColor="#d32f2f" />
      <View style={styles.content}>
        {showBackButton && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        )}
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>{title}</Text>
          {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
        </View>
        {!hideLogout && (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#d32f2f",
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 8,
    shadowColor: "#d32f2f",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 100,
    marginBottom: 10,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
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
  titleContainer: {
    flex: 1,
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
  logoutButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  logoutText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
