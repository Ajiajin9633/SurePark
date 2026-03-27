import React, { useState } from "react";
import {
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

interface CustomDatePickerProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (date: Date) => void;
  initialDate?: Date;
  title: string;
}

export function CustomDatePicker({
  visible,
  onClose,
  onConfirm,
  initialDate,
  title,
}: CustomDatePickerProps) {
  const [tempDate, setTempDate] = useState(initialDate || new Date());
  const [tempYear, setTempYear] = useState(tempDate.getFullYear());
  const [tempMonth, setTempMonth] = useState(tempDate.getMonth());
  const [tempDay, setTempDay] = useState(tempDate.getDate());

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  const daysInMonth = new Date(tempYear, tempMonth + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleConfirm = () => {
    const newDate = new Date(tempYear, tempMonth, tempDay);
    onConfirm(newDate);
    onClose();
  };

  const changeYear = (increment: number) => {
    setTempYear(prev => {
      const next = prev + increment;
      // Adjust day if it exceeds days in the new month/year
      const maxDay = new Date(next, tempMonth + 1, 0).getDate();
      if (tempDay > maxDay) setTempDay(maxDay);
      return next;
    });
  };

  const changeMonth = (increment: number) => {
    let newMonth = tempMonth + increment;
    let newYear = tempYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }
    
    setTempYear(newYear);
    setTempMonth(newMonth);
    const maxDay = new Date(newYear, newMonth + 1, 0).getDate();
    if (tempDay > maxDay) setTempDay(maxDay);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>{title}</Text>
          
          <View style={styles.selectorRow}>
            <TouchableOpacity onPress={() => changeYear(-1)} style={styles.arrowButton}>
              <Text style={styles.arrowText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.valueText}>{tempYear}</Text>
            <TouchableOpacity onPress={() => changeYear(1)} style={styles.arrowButton}>
              <Text style={styles.arrowText}>→</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.selectorRow}>
            <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.arrowButton}>
              <Text style={styles.arrowText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.valueText}>{months[tempMonth]}</Text>
            <TouchableOpacity onPress={() => changeMonth(1)} style={styles.arrowButton}>
              <Text style={styles.arrowText}>→</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.daysGrid}>
            {days.map((day) => (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayButton,
                  tempDay === day && styles.selectedDayButton
                ]}
                onPress={() => setTempDay(day)}
              >
                <Text style={[
                  styles.dayText,
                  tempDay === day && styles.selectedDayText
                ]}>
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: width - 48,
    maxWidth: 320,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 20,
  },
  selectorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  arrowButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  arrowText: {
    fontSize: 20,
    color: "#DC2626",
    fontWeight: "600",
  },
  valueText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    minWidth: 80,
    textAlign: "center",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    marginVertical: 16,
    gap: 8,
    paddingHorizontal: 5,
  },
  dayButton: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  selectedDayButton: {
    backgroundColor: "#DC2626",
  },
  dayText: {
    fontSize: 14,
    color: "#4B5563",
    fontWeight: "500",
  },
  selectedDayText: {
    color: "#fff",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#6B7280",
    fontWeight: "600",
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#DC2626",
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
