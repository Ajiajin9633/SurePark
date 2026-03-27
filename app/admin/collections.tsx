import { API_BASE_URL } from "@/services/api";
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';

const { width, height } = Dimensions.get('window');

interface DailyCollectionDto {
  date: string;
  amount: number;
  vehicles: number;
}

interface CollectionReportDto {
  staffId: number;
  staffName: string;
  totalParkingAmount: number;
  totalVehicles: number;
  totalCollectedAmount: number;
  totalAdvance: number;
  totalBalance: number;
  totalRefund: number;
  totalDeduction: number;
  finalAmount: number;
  dailyDetails: DailyCollectionDto[];
}

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reports, setReports] = useState<CollectionReportDto[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<CollectionReportDto | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [summaryType, setSummaryType] = useState<'collection' | 'parking'>('collection');

  useEffect(() => {
    loadReports();
  }, [selectedMonth, selectedYear]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/Reports/collection-report?month=${selectedMonth}&year=${selectedYear}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setReports(data);
      } else {
        Alert.alert("Error", "Failed to load reports");
      }
    } catch (error) {
      console.error("Error loading reports:", error);
      Alert.alert("Error", "Failed to connect to server");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    let newMonth = selectedMonth;
    let newYear = selectedYear;
    
    if (direction === 'prev') {
      newMonth--;
      if (newMonth < 1) {
        newMonth = 12;
        newYear--;
      }
    } else {
      newMonth++;
      if (newMonth > 12) {
        newMonth = 1;
        newYear++;
      }
    }
    
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  const getMonthName = (month: number) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1];
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const calculateTotals = () => {
    const totals = {
      totalParkingAmount: 0,
      totalCollectedAmount: 0,
      totalVehicles: 0,
      totalAdvance: 0,
      totalBalance: 0,
      totalRefund: 0,
      totalDeduction: 0,
      finalAmount: 0
    };
    
    reports.forEach(report => {
      totals.totalParkingAmount += report.totalParkingAmount || 0;
      totals.totalCollectedAmount += report.totalCollectedAmount || 0;
      totals.totalVehicles += report.totalVehicles || 0;
      totals.totalAdvance += report.totalAdvance || 0;
      totals.totalBalance += report.totalBalance || 0;
      totals.totalRefund += report.totalRefund || 0;
      totals.totalDeduction += report.totalDeduction || 0;
      totals.finalAmount += report.finalAmount || 0;
    });
    
    return totals;
  };

  const getChartData = () => {
    if (!selectedStaff || !selectedStaff.dailyDetails || selectedStaff.dailyDetails.length === 0) return null;
    
    const labels = selectedStaff.dailyDetails.map(d => formatDate(d.date));
    const amounts = selectedStaff.dailyDetails.map(d => d.amount || 0);
    
    return {
      labels,
      datasets: [
        {
          data: amounts,
          color: (opacity = 1) => `rgba(220, 38, 38, ${opacity})`,
          strokeWidth: 2
        }
      ],
      legend: ["Amount (₹)"]
    };
  };

  const getPieChartData = () => {
    const totals = calculateTotals();
    
    const pieData = [
      {
        name: "Collected",
        amount: totals.totalCollectedAmount,
        color: "#10B981",
        legendFontColor: "#333",
        legendFontSize: 12
      },
      {
        name: "Balance",
        amount: totals.totalBalance,
        color: "#F59E0B",
        legendFontColor: "#333",
        legendFontSize: 12
      },
      {
        name: "Deduction",
        amount: totals.totalDeduction,
        color: "#EF4444",
        legendFontColor: "#333",
        legendFontSize: 12
      },
      {
        name: "Refund",
        amount: totals.totalRefund,
        color: "#8B5CF6",
        legendFontColor: "#333",
        legendFontSize: 12
      }
    ].filter(item => item.amount > 0);
    
    return pieData.length > 0 ? pieData : null;
  };

  const totals = calculateTotals();
  const pieData = getPieChartData();

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#DC2626" />
        <Text style={styles.loadingText}>Loading reports...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      
      {/* Top Spacer */}
      <View style={styles.topSpacer} />
      
      {/* Header */}
      <LinearGradient
        colors={['#DC2626', '#B91C1C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerCard}
      >
        <Text style={styles.headerTitle}>Collection Reports</Text>
        <Text style={styles.headerSubtitle}>Monthly analysis & insights</Text>
      </LinearGradient>
      
      {/* Month Selector */}
      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={() => changeMonth('prev')} style={styles.monthNavButton}>
          <Ionicons name="chevron-back" size={24} color="#666" />
        </TouchableOpacity>
        <Text style={styles.monthText}>{getMonthName(selectedMonth)} {selectedYear}</Text>
        <TouchableOpacity onPress={() => changeMonth('next')} style={styles.monthNavButton}>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Ionicons name="car-outline" size={24} color="#DC2626" />
            <Text style={styles.summaryValue}>{totals.totalVehicles}</Text>
            <Text style={styles.summaryLabel}>Total Vehicles</Text>
          </View>
          <View style={styles.summaryCard}>
            <Ionicons name="cash-outline" size={24} color="#10B981" />
            <Text style={styles.summaryValue}>{formatCurrency(totals.totalParkingAmount)}</Text>
            <Text style={styles.summaryLabel}>Parking Amount</Text>
          </View>
          <View style={styles.summaryCard}>
            <Ionicons name="wallet-outline" size={24} color="#F59E0B" />
            <Text style={styles.summaryValue}>{formatCurrency(totals.totalCollectedAmount)}</Text>
            <Text style={styles.summaryLabel}>Collected</Text>
          </View>
          <View style={styles.summaryCard}>
            <Ionicons name="flag-outline" size={24} color="#8B5CF6" />
            <Text style={styles.summaryValue}>{formatCurrency(totals.finalAmount)}</Text>
            <Text style={styles.summaryLabel}>Final Amount</Text>
          </View>
        </View>

        {/* Pie Chart Section */}
        {pieData && pieData.length > 0 && (
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>Payment Breakdown</Text>
            <PieChart
              data={pieData}
              width={width - 40}
              height={200}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
        )}

        {/* Staff Performance Summary */}
        <View style={styles.staffSection}>
          <Text style={styles.sectionTitle}>Staff Performance</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.staffScroll}>
            {reports.map((staff) => (
              <TouchableOpacity
                key={staff.staffId}
                style={styles.staffCard}
                onPress={() => {
                  setSelectedStaff(staff);
                  setModalVisible(true);
                }}
              >
                <Text style={styles.staffName}>{staff.staffName}</Text>
                <Text style={styles.staffAmount}>{formatCurrency(staff.finalAmount)}</Text>
                <View style={styles.staffStats}>
                  <Text style={styles.staffStatText}>{staff.totalVehicles} vehicles</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Detailed Staff List */}
        <View style={styles.detailSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Detailed Report</Text>
            <TouchableOpacity
              style={styles.summaryToggle}
              onPress={() => setSummaryType(summaryType === 'collection' ? 'parking' : 'collection')}
            >
              <Text style={styles.summaryToggleText}>
                Show {summaryType === 'collection' ? 'Parking' : 'Collection'} Details
              </Text>
            </TouchableOpacity>
          </View>
          
          {reports.map((staff) => (
            <View key={staff.staffId} style={styles.detailCard}>
              <View style={styles.detailHeader}>
                <View>
                  <Text style={styles.detailStaffName}>{staff.staffName}</Text>
                  <Text style={styles.detailStaffStats}>
                    {staff.totalVehicles} vehicles • {staff.dailyDetails?.length || 0} days
                  </Text>
                </View>
                <View style={styles.detailAmountContainer}>
                  <Text style={styles.detailAmount}>{formatCurrency(staff.finalAmount)}</Text>
                  <Text style={styles.detailAmountLabel}>Final</Text>
                </View>
              </View>
              
              {summaryType === 'collection' ? (
                <View style={styles.detailStats}>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailStatLabel}>Collected</Text>
                    <Text style={styles.detailStatValue}>{formatCurrency(staff.totalCollectedAmount)}</Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailStatLabel}>Balance</Text>
                    <Text style={styles.detailStatValue}>{formatCurrency(staff.totalBalance)}</Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailStatLabel}>Advance</Text>
                    <Text style={styles.detailStatValue}>{formatCurrency(staff.totalAdvance)}</Text>
                  </View>
                  {staff.totalDeduction > 0 && (
                    <View style={styles.detailStat}>
                      <Text style={styles.detailStatLabel}>Deduction</Text>
                      <Text style={[styles.detailStatValue, styles.deductionText]}>
                        -{formatCurrency(staff.totalDeduction)}
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.detailStats}>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailStatLabel}>Parking Amount</Text>
                    <Text style={styles.detailStatValue}>{formatCurrency(staff.totalParkingAmount)}</Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailStatLabel}>Collection Rate</Text>
                    <Text style={styles.detailStatValue}>
                      {staff.totalParkingAmount > 0 
                        ? ((staff.totalCollectedAmount / staff.totalParkingAmount) * 100).toFixed(1)
                        : 0}%
                    </Text>
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Staff Details Modal with Graph */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{selectedStaff?.staffName}</Text>
                <Text style={styles.modalSubtitle}>
                  Daily Performance - {getMonthName(selectedMonth)} {selectedYear}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Staff Summary Stats */}
              <View style={styles.modalSummaryGrid}>
                <View style={styles.modalSummaryItem}>
                  <Text style={styles.modalSummaryValue}>{selectedStaff?.totalVehicles || 0}</Text>
                  <Text style={styles.modalSummaryLabel}>Vehicles</Text>
                </View>
                <View style={styles.modalSummaryItem}>
                  <Text style={styles.modalSummaryValue}>{formatCurrency(selectedStaff?.totalParkingAmount || 0)}</Text>
                  <Text style={styles.modalSummaryLabel}>Parking</Text>
                </View>
                <View style={styles.modalSummaryItem}>
                  <Text style={styles.modalSummaryValue}>{formatCurrency(selectedStaff?.finalAmount || 0)}</Text>
                  <Text style={styles.modalSummaryLabel}>Collected</Text>
                </View>
              </View>

              {/* Chart Type Toggle */}
              <View style={styles.chartToggle}>
                <TouchableOpacity
                  style={[styles.chartTypeButton, chartType === 'line' && styles.chartTypeActive]}
                  onPress={() => setChartType('line')}
                >
                  <Text style={[styles.chartTypeText, chartType === 'line' && styles.chartTypeTextActive]}>Line Chart</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.chartTypeButton, chartType === 'bar' && styles.chartTypeActive]}
                  onPress={() => setChartType('bar')}
                >
                  <Text style={[styles.chartTypeText, chartType === 'bar' && styles.chartTypeTextActive]}>Bar Chart</Text>
                </TouchableOpacity>
              </View>

              {/* Chart */}
              {selectedStaff && selectedStaff.dailyDetails && selectedStaff.dailyDetails.length > 0 && getChartData() && (
                <View style={styles.chartContainer}>
                  {chartType === 'line' ? (
                    <LineChart
                      data={getChartData()!}
                      width={width - 60}
                      height={220}
                      chartConfig={{
                        backgroundColor: "#fff",
                        backgroundGradientFrom: "#fff",
                        backgroundGradientTo: "#fff",
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(220, 38, 38, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                        style: {
                          borderRadius: 16
                        },
                        propsForDots: {
                          r: "6",
                          strokeWidth: "2",
                          stroke: "#DC2626"
                        }
                      }}
                      bezier
                      style={styles.chart}
                      formatYLabel={(value) => `₹${value}`}
                    />
                  ) : (
                    <BarChart
                      data={getChartData()!}
                      width={width - 60}
                      height={220}
                      yAxisLabel="₹"
                      yAxisSuffix=""
                      chartConfig={{
                        backgroundColor: "#fff",
                        backgroundGradientFrom: "#fff",
                        backgroundGradientTo: "#fff",
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                        style: {
                          borderRadius: 16
                        }
                      }}
                      style={styles.chart}
                      showValuesOnTopOfBars={true}
                      fromZero={true}
                    />
                  )}
                </View>
              )}

              {/* Daily Details Table */}
              <Text style={styles.dailyTitle}>Daily Breakdown</Text>
              {selectedStaff?.dailyDetails && selectedStaff.dailyDetails.length > 0 ? (
                selectedStaff.dailyDetails.map((day, index) => (
                  <View key={index} style={styles.dailyItem}>
                    <View style={styles.dailyLeft}>
                      <Text style={styles.dailyDate}>{formatDate(day.date)}</Text>
                      <Text style={styles.dailyVehicles}>{day.vehicles} vehicles</Text>
                    </View>
                    <Text style={styles.dailyAmount}>{formatCurrency(day.amount)}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>No daily data available</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  topSpacer: {
    height: Platform.OS === 'ios' ? 40 : StatusBar.currentHeight,
    backgroundColor: "#f5f5f5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  headerCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    padding: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
  },
  monthSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  monthNavButton: {
    padding: 8,
  },
  monthText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    minWidth: (width - 56) / 2,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1a1a1a",
    marginTop: 8,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#666",
  },
  chartSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 16,
  },
  staffSection: {
    marginBottom: 20,
  },
  staffScroll: {
    flexDirection: "row",
  },
  staffCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    minWidth: 140,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  staffName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  staffAmount: {
    fontSize: 18,
    fontWeight: "800",
    color: "#10B981",
    marginBottom: 4,
  },
  staffStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  staffStatText: {
    fontSize: 11,
    color: "#666",
  },
  detailSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  summaryToggle: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  summaryToggleText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#666",
  },
  detailCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  detailStaffName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  detailStaffStats: {
    fontSize: 11,
    color: "#666",
  },
  detailAmountContainer: {
    alignItems: "flex-end",
  },
  detailAmount: {
    fontSize: 20,
    fontWeight: "800",
    color: "#10B981",
  },
  detailAmountLabel: {
    fontSize: 10,
    color: "#888",
  },
  detailStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  detailStat: {
    alignItems: "center",
    flex: 1,
  },
  detailStatLabel: {
    fontSize: 11,
    color: "#888",
    marginBottom: 4,
  },
  detailStatValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  deductionText: {
    color: "#ef4444",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBody: {
    padding: 20,
  },
  modalSummaryGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
    paddingVertical: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
  },
  modalSummaryItem: {
    alignItems: "center",
  },
  modalSummaryValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#DC2626",
    marginBottom: 4,
  },
  modalSummaryLabel: {
    fontSize: 12,
    color: "#666",
  },
  chartToggle: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  chartTypeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  chartTypeActive: {
    backgroundColor: "#DC2626",
  },
  chartTypeText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  chartTypeTextActive: {
    color: "#fff",
  },
  chartContainer: {
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
  },
  chart: {
    borderRadius: 16,
  },
  dailyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 12,
  },
  dailyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dailyLeft: {
    flex: 1,
  },
  dailyDate: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 2,
  },
  dailyVehicles: {
    fontSize: 11,
    color: "#888",
  },
  dailyAmount: {
    fontSize: 15,
    fontWeight: "700",
    color: "#10B981",
  },
  noDataContainer: {
    padding: 20,
    alignItems: "center",
  },
  noDataText: {
    fontSize: 14,
    color: "#999",
  },
});