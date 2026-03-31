import { API_BASE_URL, apiFetch } from "@/services/api";
import { Stack, router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

const { width } = Dimensions.get("window");

// Interfaces
interface DashboardStats {
  totalVehicles: number;
  currentlyParked: number;
  totalRevenue: number;
  avgDuration: number;
  peakHour: string;
  occupancyRate: number;
}

interface WeeklyActivity {
  label: string;
  day: string;
  value: number;
  revenue: number;
}

interface LocationReport {
  locationId: number;
  locationName: string;
  totalVehicles: number;
  totalCollection: number;
  advanceAmount: number;
  refundAmount: number;
  netCollection: number;
}

interface StaffReport {
  staffId: number;
  staffName: string;
  totalVehicles: number;
  totalCollection: number;
  advanceAmount: number;
  balanceCollected: number;
  refundGiven: number;
}

interface VehicleTypeReport {
  vehicleTypeId: number;
  vehicleTypeName: string;
  count: number;
  totalRevenue: number;
  avgDuration: number;
}

interface DateRangeReport {
  summary: {
    totalVehicles: number;
    totalRevenue: number;
    totalAdvance: number;
    totalBalance: number;
    totalRefund: number;
    manuallyAdjusted: number;
  };
  entries: Array<{
    id: number;
    vehicleNumber: string;
    vehicleType: string;
    checkIn: string;
    checkOut: string;
    totalHours: number;
    advanceAmount: number;
    totalAmount: number;
    balanceAmount: number;
    refundAmount: number;
    isManuallyAdjusted: boolean;
    locationId?: number;
    locationName?: string;
  }>;
}

interface LocationVehicleTypeBreakdown {
  locationId: number;
  locationName: string;
  vehicleTypes: {
    [key: string]: {
      count: number;
      revenue: number;
      avgDuration: number;
    };
  };
  totalVehicles: number;
  totalRevenue: number;
  totalAdvance: number;
  totalRefund: number;
}

// ─── Custom Date Picker Modal ─────────────────────────────────────────────
function CustomDatePicker({ 
  visible, 
  onClose, 
  onConfirm, 
  initialDate,
  title 
}: any) {
  const [selectedDate, setSelectedDate] = useState(initialDate || new Date());
  const [tempYear, setTempYear] = useState(selectedDate.getFullYear());
  const [tempMonth, setTempMonth] = useState(selectedDate.getMonth());
  const [tempDay, setTempDay] = useState(selectedDate.getDate());

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  
  const daysInMonth = new Date(tempYear, tempMonth + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleConfirm = () => {
    const newDate = new Date(tempYear, tempMonth, tempDay);
    setSelectedDate(newDate);
    onConfirm(newDate);
    onClose();
  };

  const changeYear = (increment: number) => {
    const newYear = tempYear + increment;
    if (newYear >= years[0] && newYear <= years[years.length - 1]) {
      setTempYear(newYear);
      const maxDay = new Date(newYear, tempMonth + 1, 0).getDate();
      if (tempDay > maxDay) {
        setTempDay(maxDay);
      }
    }
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
    
    if (newYear >= years[0] && newYear <= years[years.length - 1]) {
      setTempYear(newYear);
      setTempMonth(newMonth);
      const maxDay = new Date(newYear, newMonth + 1, 0).getDate();
      if (tempDay > maxDay) {
        setTempDay(maxDay);
      }
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={pickerStyles.overlay}>
        <View style={pickerStyles.container}>
          <Text style={pickerStyles.title}>{title}</Text>
          
          <View style={pickerStyles.selectorRow}>
            <TouchableOpacity onPress={() => changeYear(-1)} style={pickerStyles.arrowButton}>
              <Text style={pickerStyles.arrowText}>←</Text>
            </TouchableOpacity>
            <Text style={pickerStyles.valueText}>{tempYear}</Text>
            <TouchableOpacity onPress={() => changeYear(1)} style={pickerStyles.arrowButton}>
              <Text style={pickerStyles.arrowText}>→</Text>
            </TouchableOpacity>
          </View>

          <View style={pickerStyles.selectorRow}>
            <TouchableOpacity onPress={() => changeMonth(-1)} style={pickerStyles.arrowButton}>
              <Text style={pickerStyles.arrowText}>←</Text>
            </TouchableOpacity>
            <Text style={pickerStyles.valueText}>{months[tempMonth]}</Text>
            <TouchableOpacity onPress={() => changeMonth(1)} style={pickerStyles.arrowButton}>
              <Text style={pickerStyles.arrowText}>→</Text>
            </TouchableOpacity>
          </View>

          <View style={pickerStyles.daysGrid}>
            {days.map((day) => (
              <TouchableOpacity
                key={day}
                style={[
                  pickerStyles.dayButton,
                  tempDay === day && pickerStyles.selectedDayButton
                ]}
                onPress={() => setTempDay(day)}
              >
                <Text style={[
                  pickerStyles.dayText,
                  tempDay === day && pickerStyles.selectedDayText
                ]}>
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={pickerStyles.buttonRow}>
            <TouchableOpacity style={pickerStyles.cancelButton} onPress={onClose}>
              <Text style={pickerStyles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={pickerStyles.confirmButton} onPress={handleConfirm}>
              <Text style={pickerStyles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const pickerStyles = StyleSheet.create({
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
    justifyContent: "center",
    marginVertical: 16,
    gap: 8,
  },
  dayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  selectedDayButton: {
    backgroundColor: "#DC2626",
  },
  dayText: {
    fontSize: 16,
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

// ─── Date Range Picker Component ─────────────────────────────────────────────
function DateRangePicker({ 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange, 
  onApply 
}: any) {
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleStartConfirm = (date: Date) => {
    setTempStartDate(date);
    onStartDateChange(date);
    setShowStartPicker(false);
  };

  const handleEndConfirm = (date: Date) => {
    setTempEndDate(date);
    onEndDateChange(date);
    setShowEndPicker(false);
  };

  return (
    <>
      <View style={dateRangeStyles.container}>
        <TouchableOpacity 
          style={dateRangeStyles.dateButton}
          onPress={() => setShowStartPicker(true)}
        >
          <Text style={dateRangeStyles.dateLabel}>From</Text>
          <Text style={dateRangeStyles.dateValue}>
            {formatDate(tempStartDate)}
          </Text>
        </TouchableOpacity>

        <Text style={dateRangeStyles.toText}>→</Text>

        <TouchableOpacity 
          style={dateRangeStyles.dateButton}
          onPress={() => setShowEndPicker(true)}
        >
          <Text style={dateRangeStyles.dateLabel}>To</Text>
          <Text style={dateRangeStyles.dateValue}>
            {formatDate(tempEndDate)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={dateRangeStyles.applyButton} onPress={onApply}>
          <Text style={dateRangeStyles.applyButtonText}>Apply</Text>
        </TouchableOpacity>
      </View>

      <CustomDatePicker
        visible={showStartPicker}
        onClose={() => setShowStartPicker(false)}
        onConfirm={handleStartConfirm}
        initialDate={tempStartDate}
        title="Select Start Date"
      />

      <CustomDatePicker
        visible={showEndPicker}
        onClose={() => setShowEndPicker(false)}
        onConfirm={handleEndConfirm}
        initialDate={tempEndDate}
        title="Select End Date"
      />
    </>
  );
}

const dateRangeStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    marginHorizontal: 16,
    marginTop: 16,
  },
  dateButton: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  dateLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1F2937",
  },
  toText: {
    fontSize: 16,
    color: "#9CA3AF",
    fontWeight: "600",
  },
  applyButton: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  applyButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});

// ─── Quick Date Filters ─────────────────────────────────────────────────────
function QuickDateFilters({ onSelect }: { onSelect: (start: Date, end: Date) => void }) {
  const filters = [
    { label: "Today", getDates: () => {
      const today = new Date();
      return [today, today];
    }},
    { label: "Yesterday", getDates: () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return [yesterday, yesterday];
    }},
    { label: "Last 7 Days", getDates: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 6);
      return [start, end];
    }},
    { label: "This Month", getDates: () => {
      const start = new Date();
      start.setDate(1);
      const end = new Date();
      return [start, end];
    }},
    { label: "Last Month", getDates: () => {
      const start = new Date();
      start.setMonth(start.getMonth() - 1);
      start.setDate(1);
      const end = new Date();
      end.setDate(0);
      return [start, end];
    }},
  ];

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={quickFilterStyles.container}
      contentContainerStyle={quickFilterStyles.contentContainer}
    >
      {filters.map((filter, index) => (
        <TouchableOpacity
          key={index}
          style={quickFilterStyles.filterButton}
          onPress={() => {
            const [start, end] = filter.getDates();
            onSelect(start, end);
          }}
        >
          <Text style={quickFilterStyles.filterText}>{filter.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const quickFilterStyles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  contentContainer: {
    gap: 8,
  },
  filterButton: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterText: {
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "500",
  },
});

// ─── Daily Report Card Component ─────────────────────────────────────────────
function DailyReportCard({ report, onPress }: { report: any; onPress: () => void }) {
  const date = new Date(report.date);
  const isToday = date.toDateString() === new Date().toDateString();
  
  return (
    <TouchableOpacity style={dailyReportStyles.container} onPress={onPress}>
      <View style={dailyReportStyles.header}>
        <View>
          <Text style={dailyReportStyles.date}>
            {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
          {isToday && (
            <View style={dailyReportStyles.todayBadge}>
              <Text style={dailyReportStyles.todayText}>Today</Text>
            </View>
          )}
        </View>
        <Text style={dailyReportStyles.revenue}>₹{report.totalRevenue.toFixed(2)}</Text>
      </View>

      <View style={dailyReportStyles.stats}>
        <View style={dailyReportStyles.statItem}>
          <Text style={dailyReportStyles.statValue}>{report.totalVehicles}</Text>
          <Text style={dailyReportStyles.statLabel}>Vehicles</Text>
        </View>
        <View style={dailyReportStyles.statDivider} />
        <View style={dailyReportStyles.statItem}>
          <Text style={dailyReportStyles.statValue}>{report.peakHour}</Text>
          <Text style={dailyReportStyles.statLabel}>Peak Hour</Text>
        </View>
        <View style={dailyReportStyles.statDivider} />
        <View style={dailyReportStyles.statItem}>
          <Text style={dailyReportStyles.statValue}>{report.avgDuration}h</Text>
          <Text style={dailyReportStyles.statLabel}>Avg Duration</Text>
        </View>
      </View>

      <View style={dailyReportStyles.footer}>
        <Text style={dailyReportStyles.advanceText}>
          Advance: ₹{report.totalAdvance.toFixed(2)}
        </Text>
        {report.manuallyAdjusted > 0 && (
          <Text style={dailyReportStyles.adjustedText}>
            {report.manuallyAdjusted} manual adjustments
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const dailyReportStyles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  date: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  todayBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  todayText: {
    fontSize: 10,
    color: "#DC2626",
    fontWeight: "600",
  },
  revenue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#10B981",
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: "#6B7280",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#E5E7EB",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  advanceText: {
    fontSize: 12,
    color: "#F59E0B",
    fontWeight: "500",
  },
  adjustedText: {
    fontSize: 11,
    color: "#EF4444",
  },
});

// ─── Detailed Daily Report Modal ─────────────────────────────────────────────
function DetailedDailyReportModal({ visible, date, report, onClose }: any) {
  if (!report) return null;

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>Daily Report</Text>
            <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
              <Text style={modalStyles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={modalStyles.date}>{formattedDate}</Text>

            <View style={modalStyles.summaryGrid}>
              <View style={modalStyles.summaryCard}>
                <Text style={modalStyles.summaryValue}>{report.totalVehicles}</Text>
                <Text style={modalStyles.summaryLabel}>Total Vehicles</Text>
              </View>
              <View style={modalStyles.summaryCard}>
                <Text style={[modalStyles.summaryValue, { color: "#10B981" }]}>
                  ₹{report.totalRevenue.toFixed(2)}
                </Text>
                <Text style={modalStyles.summaryLabel}>Total Revenue</Text>
              </View>
              <View style={modalStyles.summaryCard}>
                <Text style={modalStyles.summaryValue}>{report.peakHour}</Text>
                <Text style={modalStyles.summaryLabel}>Peak Hour</Text>
              </View>
              <View style={modalStyles.summaryCard}>
                <Text style={modalStyles.summaryValue}>{report.avgDuration}h</Text>
                <Text style={modalStyles.summaryLabel}>Avg Duration</Text>
              </View>
            </View>

            <View style={modalStyles.section}>
              <Text style={modalStyles.sectionTitle}>Financial Breakdown</Text>
              <View style={modalStyles.financialItem}>
                <Text style={modalStyles.financialLabel}>Total Collection</Text>
                <Text style={modalStyles.financialValue}>₹{report.totalRevenue.toFixed(2)}</Text>
              </View>
              <View style={modalStyles.financialItem}>
                <Text style={modalStyles.financialLabel}>Advance Amount</Text>
                <Text style={modalStyles.financialValue}>₹{report.totalAdvance.toFixed(2)}</Text>
              </View>
              <View style={modalStyles.financialItem}>
                <Text style={modalStyles.financialLabel}>Balance Collected</Text>
                <Text style={modalStyles.financialValue}>₹{report.totalBalance.toFixed(2)}</Text>
              </View>
              <View style={modalStyles.financialItem}>
                <Text style={modalStyles.financialLabel}>Refund Given</Text>
                <Text style={[modalStyles.financialValue, { color: "#EF4444" }]}>
                  -₹{report.totalRefund.toFixed(2)}
                </Text>
              </View>
              {report.manuallyAdjusted > 0 && (
                <View style={modalStyles.adjustmentNote}>
                  <Text style={modalStyles.adjustmentText}>
                    ⚠️ {report.manuallyAdjusted} entries were manually adjusted
                  </Text>
                </View>
              )}
            </View>

            {report.entries && report.entries.length > 0 && (
              <View style={modalStyles.section}>
                <Text style={modalStyles.sectionTitle}>Recent Transactions</Text>
                {report.entries.slice(0, 10).map((entry: any) => (
                  <View key={entry.id} style={modalStyles.transactionItem}>
                    <View style={modalStyles.transactionInfo}>
                      <Text style={modalStyles.vehicleNumber}>{entry.vehicleNumber}</Text>
                      <Text style={modalStyles.vehicleType}>{entry.vehicleType}</Text>
                      <Text style={modalStyles.timeText}>
                        {new Date(entry.checkIn).toLocaleTimeString()} - {new Date(entry.checkOut).toLocaleTimeString()}
                      </Text>
                    </View>
                    <View style={modalStyles.transactionAmount}>
                      <Text style={modalStyles.amount}>₹{entry.totalAmount?.toFixed(2) || 0}</Text>
                      {entry.isManuallyAdjusted && (
                        <Text style={modalStyles.adjustedBadge}>Adjusted</Text>
                      )}
                    </View>
                  </View>
                ))}
                {report.entries.length > 10 && (
                  <Text style={modalStyles.moreText}>
                    +{report.entries.length - 10} more transactions
                  </Text>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  closeText: {
    fontSize: 18,
    color: "#6B7280",
  },
  date: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 20,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    width: (width - 64) / 2,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
  },
  financialItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  financialLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  financialValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  adjustmentNote: {
    backgroundColor: "#FEF3C7",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  adjustmentText: {
    fontSize: 12,
    color: "#D97706",
    textAlign: "center",
  },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  transactionInfo: {
    flex: 1,
  },
  vehicleNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  vehicleType: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 2,
  },
  timeText: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  transactionAmount: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#10B981",
    marginBottom: 4,
  },
  adjustedBadge: {
    fontSize: 10,
    color: "#EF4444",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: "hidden",
  },
  moreText: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 12,
  },
});

// ─── Location Vehicle Type Breakdown Component ─────────────────────────────
function LocationVehicleTypeBreakdown({ report }: { report: DateRangeReport | null }) {
  const [expandedLocation, setExpandedLocation] = useState<number | null>(null);
  
  if (!report || !report.entries) return null;

  const locationBreakdown: { [key: number]: LocationVehicleTypeBreakdown } = {};
  
  report.entries.forEach(entry => {
    const locationId = entry.locationId || 0;
    const locationName = entry.locationName || "Unknown Location";
    const vehicleType = entry.vehicleType;
    
    if (!locationBreakdown[locationId]) {
      locationBreakdown[locationId] = {
        locationId,
        locationName,
        vehicleTypes: {},
        totalVehicles: 0,
        totalRevenue: 0,
        totalAdvance: 0,
        totalRefund: 0
      };
    }
    
    if (!locationBreakdown[locationId].vehicleTypes[vehicleType]) {
      locationBreakdown[locationId].vehicleTypes[vehicleType] = {
        count: 0,
        revenue: 0,
        avgDuration: 0
      };
    }
    
    locationBreakdown[locationId].vehicleTypes[vehicleType].count++;
    locationBreakdown[locationId].vehicleTypes[vehicleType].revenue += entry.totalAmount || 0;
    locationBreakdown[locationId].totalVehicles++;
    locationBreakdown[locationId].totalRevenue += entry.totalAmount || 0;
    locationBreakdown[locationId].totalAdvance += entry.advanceAmount;
    locationBreakdown[locationId].totalRefund += entry.refundAmount || 0;
  });
  
  Object.values(locationBreakdown).forEach(location => {
    Object.keys(location.vehicleTypes).forEach(vt => {
      const typeEntries = report.entries.filter(e => 
        e.vehicleType === vt && (e.locationId === location.locationId)
      );
      const totalHours = typeEntries.reduce((sum, e) => sum + (e.totalHours || 0), 0);
      location.vehicleTypes[vt].avgDuration = typeEntries.length > 0 
        ? totalHours / typeEntries.length 
        : 0;
    });
  });
  
  const locations = Object.values(locationBreakdown).sort((a, b) => b.totalRevenue - a.totalRevenue);
  
  if (locations.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📍 Location-wise Vehicle Type Analysis</Text>
        <Text style={styles.emptyText}>No location data available</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>📍 Location-wise Vehicle Type Analysis</Text>
      {locations.map((location) => (
        <View key={location.locationId} style={locationStyles.container}>
          <TouchableOpacity 
            style={locationStyles.header}
            onPress={() => setExpandedLocation(expandedLocation === location.locationId ? null : location.locationId)}
          >
            <View style={locationStyles.headerLeft}>
              <Text style={locationStyles.locationName}>{location.locationName}</Text>
              <View style={locationStyles.statsRow}>
                <Text style={locationStyles.statText}>{location.totalVehicles} vehicles</Text>
                <Text style={locationStyles.statDivider}>•</Text>
                <Text style={locationStyles.statText}>₹{location.totalRevenue.toFixed(2)}</Text>
              </View>
            </View>
            <Text style={locationStyles.expandIcon}>
              {expandedLocation === location.locationId ? '▼' : '▶'}
            </Text>
          </TouchableOpacity>
          
          {expandedLocation === location.locationId && (
            <View style={locationStyles.details}>
              <View style={locationStyles.financialRow}>
                <View style={locationStyles.financialItem}>
                  <Text style={locationStyles.financialLabel}>Total Revenue</Text>
                  <Text style={locationStyles.financialValue}>₹{location.totalRevenue.toFixed(2)}</Text>
                </View>
                <View style={locationStyles.financialItem}>
                  <Text style={locationStyles.financialLabel}>Total Advance</Text>
                  <Text style={locationStyles.financialValue}>₹{location.totalAdvance.toFixed(2)}</Text>
                </View>
                <View style={locationStyles.financialItem}>
                  <Text style={locationStyles.financialLabel}>Total Refund</Text>
                  <Text style={[locationStyles.financialValue, { color: "#EF4444" }]}>
                    ₹{location.totalRefund.toFixed(2)}
                  </Text>
                </View>
              </View>
              
              <Text style={locationStyles.subtitle}>Vehicle Type Breakdown</Text>
              {Object.entries(location.vehicleTypes).map(([type, data]: [string, any]) => (
                <View key={type} style={locationStyles.vehicleTypeItem}>
                  <View style={locationStyles.vehicleTypeHeader}>
                    <Text style={locationStyles.vehicleTypeName}>{type}</Text>
                    <Text style={locationStyles.vehicleTypeCount}>{data.count} vehicles</Text>
                  </View>
                  <View style={locationStyles.vehicleTypeBar}>
                    <View 
                      style={[
                        locationStyles.vehicleTypeBarFill,
                        { width: `${(data.count / location.totalVehicles) * 100}%` }
                      ]} 
                    />
                  </View>
                  <View style={locationStyles.vehicleTypeDetails}>
                    <Text style={locationStyles.revenueText}>
                      Revenue: ₹{data.revenue.toFixed(2)}
                    </Text>
                    <Text style={locationStyles.durationText}>
                      Avg Duration: {data.avgDuration.toFixed(1)}h
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

const locationStyles = StyleSheet.create({
  container: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  headerLeft: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    fontSize: 12,
    color: "#6B7280",
  },
  statDivider: {
    fontSize: 12,
    color: "#D1D5DB",
  },
  expandIcon: {
    fontSize: 16,
    color: "#9CA3AF",
    padding: 8,
  },
  details: {
    paddingBottom: 12,
    paddingLeft: 8,
  },
  financialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  financialItem: {
    flex: 1,
    alignItems: "center",
  },
  financialLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginBottom: 4,
  },
  financialValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4B5563",
    marginBottom: 12,
  },
  vehicleTypeItem: {
    marginBottom: 12,
  },
  vehicleTypeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  vehicleTypeName: {
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
  },
  vehicleTypeCount: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  vehicleTypeBar: {
    height: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 6,
  },
  vehicleTypeBarFill: {
    height: "100%",
    backgroundColor: "#DC2626",
    borderRadius: 3,
  },
  vehicleTypeDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  revenueText: {
    fontSize: 11,
    color: "#10B981",
    fontWeight: "500",
  },
  durationText: {
    fontSize: 11,
    color: "#6B7280",
  },
});

// ─── Vehicle Type Summary Component ─────────────────────────────────────
function VehicleTypeSummary({ report }: { report: DateRangeReport | null }) {
  if (!report || !report.entries) return null;
  
  const vehicleTypeAgg: { [key: string]: any } = {};
  
  report.entries.forEach(entry => {
    const type = entry.vehicleType;
    if (!vehicleTypeAgg[type]) {
      vehicleTypeAgg[type] = {
        name: type,
        count: 0,
        revenue: 0,
        totalHours: 0,
        entries: []
      };
    }
    vehicleTypeAgg[type].count++;
    vehicleTypeAgg[type].revenue += entry.totalAmount || 0;
    vehicleTypeAgg[type].totalHours += entry.totalHours || 0;
    vehicleTypeAgg[type].entries.push(entry);
  });
  
  const vehicleTypes = Object.values(vehicleTypeAgg)
    .map((vt: any) => ({
      ...vt,
      avgDuration: vt.count > 0 ? vt.totalHours / vt.count : 0,
      avgRevenue: vt.count > 0 ? vt.revenue / vt.count : 0
    }))
    .sort((a: any, b: any) => b.count - a.count);
  
  if (vehicleTypes.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🚙 Vehicle Type Summary</Text>
        <Text style={styles.emptyText}>No vehicle data available</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>🚙 Vehicle Type Summary</Text>
      {vehicleTypes.map((vt: any) => (
        <View key={vt.name} style={vehicleSummaryStyles.container}>
          <View style={vehicleSummaryStyles.header}>
            <View>
              <Text style={vehicleSummaryStyles.vehicleName}>{vt.name}</Text>
              <Text style={vehicleSummaryStyles.countText}>{vt.count} vehicles</Text>
            </View>
            <Text style={vehicleSummaryStyles.revenue}>₹{vt.revenue.toFixed(2)}</Text>
          </View>
          
          <View style={vehicleSummaryStyles.stats}>
            <View style={vehicleSummaryStyles.statItem}>
              <Text style={vehicleSummaryStyles.statValue}>{vt.avgDuration.toFixed(1)}h</Text>
              <Text style={vehicleSummaryStyles.statLabel}>Avg Duration</Text>
            </View>
            <View style={vehicleSummaryStyles.statDivider} />
            <View style={vehicleSummaryStyles.statItem}>
              <Text style={vehicleSummaryStyles.statValue}>₹{vt.avgRevenue.toFixed(0)}</Text>
              <Text style={vehicleSummaryStyles.statLabel}>Avg per Vehicle</Text>
            </View>
            <View style={vehicleSummaryStyles.statDivider} />
            <View style={vehicleSummaryStyles.statItem}>
              <Text style={vehicleSummaryStyles.statValue}>
                {((vt.count / report.entries.length) * 100).toFixed(1)}%
              </Text>
              <Text style={vehicleSummaryStyles.statLabel}>Share</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const vehicleSummaryStyles = StyleSheet.create({
  container: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  vehicleName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 2,
  },
  countText: {
    fontSize: 11,
    color: "#6B7280",
  },
  revenue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#10B981",
  },
  stats: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 10,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: "#6B7280",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#E5E7EB",
  },
});

// ─── Date Range Report Component ─────────────────────────────────────────────
function DateRangeReportComponent() {
  const getDefaultStartDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 2);
    date.setHours(0, 0, 0, 0);
    return date;
  };
  
  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<DateRangeReport | null>(null);
  const [selectedDailyReport, setSelectedDailyReport] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchDateRangeReport = async () => {
    try {
      setLoading(true);
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      const response = await apiFetch(
        `/Reports/DateRange?startDate=${startDateStr}&endDate=${endDateStr}`
      );
      if (response.ok) {
        const data = await response.json();
        setReport(data);
      } else {
        Alert.alert("Error", "Failed to load report");
      }
    } catch (error) {
      console.error("Error fetching date range report:", error);
      Alert.alert("Error", "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDateRangeReport();
  }, []);

  const handleApply = () => {
    fetchDateRangeReport();
  };

  const handleQuickSelect = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
    setTimeout(() => {
      fetchDateRangeReport();
    }, 100);
  };

  const handleDailyPress = (dailyReport: any) => {
    setSelectedDailyReport(dailyReport);
    setModalVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DC2626" />
        <Text style={styles.loadingText}>Loading report...</Text>
      </View>
    );
  }

  const dailyReports = report?.entries.reduce((acc: any, entry) => {
    const date = new Date(entry.checkIn).toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = {
        date,
        totalVehicles: 0,
        totalRevenue: 0,
        totalAdvance: 0,
        totalBalance: 0,
        totalRefund: 0,
        manuallyAdjusted: 0,
        entries: [],
        peakHour: '',
        avgDuration: 0,
      };
    }
    acc[date].totalVehicles++;
    acc[date].totalRevenue += entry.totalAmount || 0;
    acc[date].totalAdvance += entry.advanceAmount;
    acc[date].totalBalance += entry.balanceAmount || 0;
    acc[date].totalRefund += entry.refundAmount || 0;
    if (entry.isManuallyAdjusted) acc[date].manuallyAdjusted++;
    acc[date].entries.push(entry);
    return acc;
  }, {});

  const enhancedDailyReports = Object.values(dailyReports || {}).map((day: any) => {
    const hourlyCount: any = {};
    day.entries.forEach((entry: any) => {
      const hour = new Date(entry.checkIn).getHours();
      hourlyCount[hour] = (hourlyCount[hour] || 0) + 1;
    });
    const peakHour = Object.entries(hourlyCount).sort((a: any, b: any) => b[1] - a[1])[0];
    
    const totalHours = day.entries.reduce((sum: number, entry: any) => sum + (entry.totalHours || 0), 0);
    const avgDuration = day.totalVehicles > 0 ? totalHours / day.totalVehicles : 0;
    
    return {
      ...day,
      peakHour: peakHour ? `${peakHour[0]}:00` : 'N/A',
      avgDuration: avgDuration.toFixed(1),
    };
  }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <View>
      <QuickDateFilters onSelect={handleQuickSelect} />
      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onApply={handleApply}
      />

      {report && (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{report.summary.totalVehicles}</Text>
            <Text style={styles.summaryLabel}>Total Vehicles</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: "#10B981" }]}>
              ₹{report.summary.totalRevenue.toFixed(2)}
            </Text>
            <Text style={styles.summaryLabel}>Total Revenue</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>₹{report.summary.totalAdvance.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>Total Advance</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{report.summary.manuallyAdjusted}</Text>
            <Text style={styles.summaryLabel}>Manual Adjustments</Text>
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>Daily Breakdown</Text>
      {enhancedDailyReports.map((day: any) => (
        <DailyReportCard
          key={day.date}
          report={day}
          onPress={() => handleDailyPress(day)}
        />
      ))}

      <LocationVehicleTypeBreakdown report={report} />
      <VehicleTypeSummary report={report} />

      <DetailedDailyReportModal
        visible={modalVisible}
        date={selectedDailyReport?.date}
        report={selectedDailyReport}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

// ─── Overview Reports Component ─────────────────────────────────────────────
function OverviewReports({ dashboardStats, weeklyActivity, locationReports, staffReports, vehicleTypeReports }: any) {
  const stats = dashboardStats ? [
    { label: "Total Vehicles", value: dashboardStats.totalVehicles.toString(), icon: "🚗", color: "#DC2626" },
    { label: "Peak Hour", value: dashboardStats.peakHour, icon: "⏰", color: "#D97706" },
    { label: "Avg Duration", value: `${dashboardStats.avgDuration}h`, icon: "📈", color: "#059669" },
    { label: "Occupancy", value: `${dashboardStats.occupancyRate}%`, icon: "🅿️", color: "#2563EB" },
  ] : [];

  return (
    <View style={styles.overviewContainer}>
      <View style={styles.statsGrid}>
        {stats.map((s: any) => (
          <View key={s.label} style={[styles.statCard, { backgroundColor: `${s.color}10` }]}>
            <Text style={styles.statIcon}>{s.icon}</Text>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {dashboardStats && (
        <View style={styles.revenueCard}>
          <Text style={styles.revenueLabel}>Today's Revenue</Text>
          <Text style={styles.revenueValue}>₹{dashboardStats.totalRevenue.toFixed(2)}</Text>
          <Text style={styles.revenueSubtext}>
            {dashboardStats.currentlyParked} vehicles currently parked
          </Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📍 Top Locations</Text>
        {locationReports.slice(0, 3).map((loc: any) => (
          <View key={loc.locationId} style={styles.reportRow}>
            <View style={styles.reportInfo}>
              <Text style={styles.reportName}>{loc.locationName}</Text>
              <Text style={styles.reportSubtext}>{loc.totalVehicles} vehicles</Text>
            </View>
            <Text style={styles.reportAmount}>₹{loc.netCollection.toFixed(2)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>👥 Top Performers</Text>
        {staffReports.slice(0, 3).map((staff: any) => (
          <View key={staff.staffId} style={styles.reportRow}>
            <View style={styles.reportInfo}>
              <Text style={styles.reportName}>{staff.staffName}</Text>
              <Text style={styles.reportSubtext}>{staff.totalVehicles} vehicles</Text>
            </View>
            <Text style={styles.reportAmount}>₹{staff.totalCollection.toFixed(2)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🚙 Popular Vehicles</Text>
        {vehicleTypeReports.slice(0, 3).map((vt: any) => (
          <View key={vt.vehicleTypeId} style={styles.reportRow}>
            <View style={styles.reportInfo}>
              <Text style={styles.reportName}>{vt.vehicleTypeName}</Text>
              <Text style={styles.reportSubtext}>{vt.count} vehicles</Text>
            </View>
            <Text style={styles.reportAmount}>₹{vt.totalRevenue.toFixed(2)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Enhanced Reports Section with Tabs ──────────────────────────────────────
function ReportsSection() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'daily' | 'overview'>('daily');
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [weeklyActivity, setWeeklyActivity] = useState<WeeklyActivity[]>([]);
  const [locationReports, setLocationReports] = useState<LocationReport[]>([]);
  const [staffReports, setStaffReports] = useState<StaffReport[]>([]);
  const [vehicleTypeReports, setVehicleTypeReports] = useState<VehicleTypeReport[]>([]);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchDashboardStats(),
        fetchWeeklyActivity(),
        fetchLocationReports(),
        fetchStaffReports(),
        fetchVehicleTypeReports()
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
      Alert.alert("Error", "Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await apiFetch(`/Reports/Dashboard`);
      if (response.ok) {
        const data = await response.json();
        setDashboardStats(data);
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  };

  const fetchWeeklyActivity = async () => {
    try {
      const response = await apiFetch(`/Reports/WeeklyActivity`);
      if (response.ok) {
        const data = await response.json();
        setWeeklyActivity(data);
      }
    } catch (error) {
      console.error("Error fetching weekly activity:", error);
    }
  };

  const fetchLocationReports = async () => {
    try {
      const response = await apiFetch(`/Reports/LocationWise`);
      if (response.ok) {
        const data = await response.json();
        setLocationReports(data);
      }
    } catch (error) {
      console.error("Error fetching location reports:", error);
    }
  };

  const fetchStaffReports = async () => {
    try {
      const response = await apiFetch(`/Reports/StaffWise`);
      if (response.ok) {
        const data = await response.json();
        setStaffReports(data);
      }
    } catch (error) {
      console.error("Error fetching staff reports:", error);
    }
  };

  const fetchVehicleTypeReports = async () => {
    try {
      const response = await apiFetch(`/Reports/VehicleTypeWise`);
      if (response.ok) {
        const data = await response.json();
        setVehicleTypeReports(data);
      }
    } catch (error) {
      console.error("Error fetching vehicle type reports:", error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAllData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DC2626" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'daily' && styles.activeTab]}
          onPress={() => setActiveTab('daily')}
        >
          <Text style={[styles.tabText, activeTab === 'daily' && styles.activeTabText]}>
            Daily Reports
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'daily' ? (
          <DateRangeReportComponent />
        ) : (
          <OverviewReports
            dashboardStats={dashboardStats}
            weeklyActivity={weeklyActivity}
            locationReports={locationReports}
            staffReports={staffReports}
            vehicleTypeReports={vehicleTypeReports}
          />
        )}
      </ScrollView>
    </View>
  );
}

import { AdminHeader } from "@/components/AdminHeader";

// ─── Main Admin Dashboard ────────────────────────────────────────────────────
export default function AdminDashboard() {
  return (
    <View style={styles.mainContainer}>
      <Stack.Screen options={{ headerShown: false }} />
      <AdminHeader 
        title="SafePark" 
        subtitle="Admin Dashboard" 
      />

      <View style={styles.content}>
        <ReportsSection />
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  headerSubtitle: { color: "rgba(255,255,255,0.85)", fontSize: 13, marginTop: 2 },
  headerLogout: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  headerLogoutText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  content: { flex: 1 },
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#DC2626",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  activeTabText: {
    color: "#fff",
  },
  overviewContainer: {
    padding: 16,
  },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 12 },
  statCard: {
    width: (width - 44) / 2,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: { fontSize: 28, marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: "800", marginBottom: 4 },
  statLabel: { fontSize: 12, color: "#6B7280", fontWeight: "500" },
  revenueCard: {
    backgroundColor: "#DC2626",
    borderRadius: 20,
    padding: 20,
    marginTop: 12,
    marginBottom: 12,
  },
  revenueLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 4,
    fontWeight: "500",
  },
  revenueValue: {
    fontSize: 40,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 8,
  },
  revenueSubtext: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginTop: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 14,
  },
  emptyText: {
    textAlign: "center",
    color: "#9CA3AF",
    fontSize: 14,
    paddingVertical: 20,
  },
  reportRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  reportInfo: {
    flex: 1,
  },
  reportName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  reportSubtext: {
    fontSize: 11,
    color: "#6B7280",
  },
  reportAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#10B981",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginHorizontal: 16,
    marginVertical: 12,
  },
  summaryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    minWidth: (width - 56) / 2,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 11,
    color: "#6B7280",
  },
});