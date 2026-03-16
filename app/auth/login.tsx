import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");


  
  const login = async () => {
  try {
    setMessage("Connecting...");

    const response = await fetch("http://172.20.10.3:5123/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true"
      },
      body: JSON.stringify({
        phoneNumber: email,
        password: password
      })
    });

    const text = await response.text();
    console.log("Status:", response.status);
    console.log("Response:", text);

    if (response.ok) {
      const data = JSON.parse(text);
      setMessage("Login Successful ✅");
      console.log("User ID:", data.userId);
      console.log("Role:", data.role);

      // Redirect based on role
      if (data.role === "Admin") {
        router.replace("/admin/reports");
      } else {
        router.replace("/(tabs)/dashboard");
      }

    } else {
      const text2 = text;
      switch (response.status) {
        case 401:
          if (text2.toLowerCase().includes("user not found")) {
            setMessage("Phone number not registered ❌");
          } else if (text2.toLowerCase().includes("password")) {
            setMessage("Incorrect password ❌");
          } else {
            setMessage(text2 || "Login Failed ❌");
          }
          break;
        case 400:
          setMessage("Invalid input ❌");
          break;
        case 500:
          setMessage("Server error, try again ❌");
          break;
        default:
          setMessage(text2 || "Login Failed ❌");
      }
    }

  } catch (error) {
    console.log("ERROR:", error);
    setMessage("API Connection Failed ❌");
  }
};
  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <StatusBar barStyle="dark-content" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.formContainer}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              placeholder="Enter your Phone Number"
              placeholderTextColor="#999"
              style={styles.input}
              onChangeText={setEmail}
              value={email}
              keyboardType="phone-pad"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              placeholder="Enter your password"
              placeholderTextColor="#999"
              secureTextEntry
              style={styles.input}
              onChangeText={setPassword}
              value={password}
            />
          </View>

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginButton} onPress={login}>
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
{message !== "" && (
  <Text style={styles.message}>{message}</Text>
)}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingTop: 60,
    paddingBottom: 20,
  },
  formContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    padding: 25,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 25,
  },
  forgotPasswordText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: "#DC2626",
    padding: 16,
    alignItems: "center",
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#DC2626',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    color: '#666',
    fontSize: 14,
  },
  signupLink: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '700',
  },
  message: {
  textAlign: "center",
  marginTop: 10,
  fontSize: 16,
  fontWeight: "600",
  color: "green"
}
});