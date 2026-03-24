import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

export const API_BASE_URL = "http://10.19.224.224:5123/api";
// 🔥 Common API function
export const apiFetch = async (endpoint: string, options: any = {}) => {
  let token = await AsyncStorage.getItem("token");

  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  // 🔥 If expired → refresh token
  if (response.status === 401) {
    const refreshToken = await AsyncStorage.getItem("refreshToken");

    if (!refreshToken) {
      await AsyncStorage.clear();
      Alert.alert("Session expired", "Please login again");
      return response;
    }

    try {
      const refreshResponse = await fetch(
        `${API_BASE_URL}/auth/refresh-token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          // ✅ IMPORTANT FIX
          body: JSON.stringify({ refreshToken }),
        },
      );

      if (refreshResponse.ok) {
        const data = await refreshResponse.json();

        // ✅ Save new tokens
        await AsyncStorage.setItem("token", data.accessToken);

        if (data.refreshToken) {
          await AsyncStorage.setItem("refreshToken", data.refreshToken);
        }

        // 🔁 Retry original request
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${data.accessToken}`,
            ...(options.headers || {}),
          },
        });
      } else {
        await AsyncStorage.clear();
        Alert.alert("Session expired", "Please login again");
      }
    } catch (error) {
      console.log("Refresh error:", error);
      Alert.alert("Error", "Unable to refresh session");
    }
  }

  return response;
};
