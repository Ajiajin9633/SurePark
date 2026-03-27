import { API_BASE_URL } from "@/services/api";
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AdminHeader } from "@/components/AdminHeader";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

const { width } = Dimensions.get('window');

// ─── Interfaces ────────────────────────────────────────────────────────────────

interface PendingCollection {
  staffId: number;
  staffName: string;
  staffPhone: string;
  locationId: number;
  locationName: string;
  totalVehicles: number;
  totalAmount: number;
  advanceAmount: number;
  balanceAmount: number;
  refundAmount: number;
  netCollection: number;
  oldestEntry: string;
  latestEntry: string;
}

interface GroupedStaff {
  staffId: number;
  staffName: string;
  staffPhone: string;
  locations: PendingCollection[];
  totalNet: number;
  totalVehicles: number;
}

interface CollectionDetail {
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
}

interface CollectionSummary {
  totalVehicles: number;
  totalAmount: number;
  advanceAmount: number;
  balanceAmount: number;
  refundAmount: number;
  netCollection: number;
}

interface CollectionHistory {
  id: number;
  staffId: number;
  staffName: string;
  staffPhone: string;
  locationName: string;
  collectionDate: string;
  totalVehicles: number;
  netCollection: number;
  totalAmount: number;
  balanceAmount: number;
  refundAmount: number;
  deductionAmount: number;
  deductionReason: string;
  finalAmount: number;
  collectedBy: string;
  notes: string;
}

interface GroupedHistory {
  staffName: string;
  entries: CollectionHistory[];
  totalFinal: number;
}

// ─── Staff Card with expandable locations ──────────────────────────────────────

function StaffPendingCard({
  group,
  onCollect,
}: {
  group: GroupedStaff;
  onCollect: (loc: PendingCollection) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    const toVal = expanded ? 0 : 1;
    setExpanded(!expanded);
    Animated.timing(anim, { toValue: toVal, duration: 200, useNativeDriver: true }).start();
  };

  const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  const initials = group.staffName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <View style={styles.staffCard}>
      {/* Staff Header Row */}
      <TouchableOpacity style={styles.staffHeader} onPress={toggle} activeOpacity={0.7}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.staffMeta}>
          <Text style={styles.staffName}>{group.staffName}</Text>
          <Text style={styles.staffSub}>
            {group.staffPhone}{'  ·  '}{group.locations.length} location{group.locations.length > 1 ? 's' : ''}
          </Text>
        </View>
        <View style={styles.staffRight}>
          <Text style={styles.staffTotalAmt}>
            ₹{group.totalNet.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <Text style={styles.staffTotalVehicles}>{group.totalVehicles} vehicles</Text>
        </View>
        <Animated.View style={{ transform: [{ rotate }], marginLeft: 8 }}>
          <Ionicons name="chevron-down" size={18} color="#888" />
        </Animated.View>
      </TouchableOpacity>

      {/* Expanded Locations */}
      {expanded && (
        <View style={styles.locationsWrap}>
          {group.locations.map((loc, idx) => (
            <View
              key={`${loc.staffId}-${loc.locationId}`}
              style={[
                styles.locItem,
                idx < group.locations.length - 1 && styles.locItemBorder,
              ]}
            >
              <View style={styles.locHeader}>
                <Text style={styles.locName}>📍 {loc.locationName}</Text>
                <View style={styles.locBadge}>
                  <Text style={styles.locBadgeText}>
                    ₹{loc.netCollection.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>

              <View style={styles.locStats}>
                <View style={styles.locStat}>
                  <Text style={styles.locStatVal}>{loc.totalVehicles}</Text>
                  <Text style={styles.locStatLbl}>Vehicles</Text>
                </View>
                <View style={styles.locStatDivider} />
                <View style={styles.locStat}>
                  <Text style={styles.locStatVal}>
                    ₹{loc.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </Text>
                  <Text style={styles.locStatLbl}>Total</Text>
                </View>
                <View style={styles.locStatDivider} />
                <View style={styles.locStat}>
                  <Text style={styles.locStatVal}>
                    ₹{loc.balanceAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </Text>
                  <Text style={styles.locStatLbl}>Balance</Text>
                </View>
                {loc.refundAmount > 0 && (
                  <>
                    <View style={styles.locStatDivider} />
                    <View style={styles.locStat}>
                      <Text style={[styles.locStatVal, { color: '#EF4444' }]}>
                        ₹{loc.refundAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </Text>
                      <Text style={styles.locStatLbl}>Refund</Text>
                    </View>
                  </>
                )}
              </View>

              <View style={styles.locPeriod}>
                <Text style={styles.locPeriodText}>
                  {formatDate(loc.oldestEntry)} – {formatDate(loc.latestEntry)}
                </Text>
                <Text style={styles.locDaysPending}>
                  {getDaysSince(loc.oldestEntry)} days pending
                </Text>
              </View>

              <TouchableOpacity
                style={styles.collectBtn}
                onPress={() => onCollect(loc)}
                activeOpacity={0.85}
              >
                <Text style={styles.collectBtnText}>View Details &amp; Collect</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── History Staff Card ─────────────────────────────────────────────────────────

function StaffHistoryCard({ group }: { group: GroupedHistory }) {
  const [expanded, setExpanded] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    const toVal = expanded ? 0 : 1;
    setExpanded(!expanded);
    Animated.timing(anim, { toValue: toVal, duration: 200, useNativeDriver: true }).start();
  };

  const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  const initials = group.staffName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <View style={styles.staffCard}>
      <TouchableOpacity style={styles.staffHeader} onPress={toggle} activeOpacity={0.7}>
        <View style={[styles.avatarCircle, styles.avatarGreen]}>
          <Text style={[styles.avatarText, styles.avatarTextGreen]}>{initials}</Text>
        </View>
        <View style={styles.staffMeta}>
          <Text style={styles.staffName}>{group.staffName}</Text>
          <Text style={styles.staffSub}>
            {group.entries.length} collection{group.entries.length > 1 ? 's' : ''}
          </Text>
        </View>
        <View style={styles.staffRight}>
          <Text style={[styles.staffTotalAmt, { color: '#10B981' }]}>
            ₹{group.totalFinal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>
        <Animated.View style={{ transform: [{ rotate }], marginLeft: 8 }}>
          <Ionicons name="chevron-down" size={18} color="#888" />
        </Animated.View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.locationsWrap}>
          {group.entries.map((h, idx) => (
            <View
              key={h.id}
              style={[
                styles.histEntry,
                idx < group.entries.length - 1 && styles.locItemBorder,
              ]}
            >
              <View style={styles.histEntryRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.histLocName}>📍 {h.locationName}</Text>
                  <Text style={styles.histEntryDate}>{formatFullDate(h.collectionDate)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.histFinalAmt}>
                    ₹{h.finalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                  {h.deductionAmount > 0 && (
                    <Text style={styles.histDeduction}>
                      -₹{h.deductionAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })} deducted
                    </Text>
                  )}
                </View>
              </View>
              <View style={styles.histMeta}>
                <Text style={styles.histMetaText}>{h.totalVehicles} vehicles</Text>
                <Text style={styles.histMetaDot}>·</Text>
                <Text style={styles.histMetaText}>By {h.collectedBy}</Text>
              </View>
              {!!h.notes && (
                <Text style={styles.histNotes}>📝 {h.notes}</Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateString: string) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function formatFullDate(dateString: string) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('en-IN', {
    month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function getDaysSince(dateString: string) {
  if (!dateString) return 0;
  const date = new Date(dateString);
  const now = new Date();
  return Math.ceil(Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function groupPendingByStaff(data: PendingCollection[]): GroupedStaff[] {
  const map: Record<number, GroupedStaff> = {};
  data.forEach((c) => {
    if (!map[c.staffId]) {
      map[c.staffId] = {
        staffId: c.staffId,
        staffName: c.staffName,
        staffPhone: c.staffPhone,
        locations: [],
        totalNet: 0,
        totalVehicles: 0,
      };
    }
    map[c.staffId].locations.push(c);
    map[c.staffId].totalNet += c.netCollection;
    map[c.staffId].totalVehicles += c.totalVehicles;
  });
  return Object.values(map);
}

function groupHistoryByStaff(data: CollectionHistory[]): GroupedHistory[] {
  const map: Record<string, GroupedHistory> = {};
  data.forEach((h) => {
    if (!map[h.staffName]) {
      map[h.staffName] = { staffName: h.staffName, entries: [], totalFinal: 0 };
    }
    map[h.staffName].entries.push(h);
    map[h.staffName].totalFinal += h.finalAmount;
  });
  return Object.values(map);
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function Payments() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

  // Raw data
  const [pendingCollections, setPendingCollections] = useState<PendingCollection[]>([]);
  const [collectionHistory, setCollectionHistory] = useState<CollectionHistory[]>([]);

  // Grouped derived state
  const [groupedPending, setGroupedPending] = useState<GroupedStaff[]>([]);
  const [groupedHistory, setGroupedHistory] = useState<GroupedHistory[]>([]);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Modal
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<PendingCollection | null>(null);
  const [collectionDetails, setCollectionDetails] = useState<CollectionDetail[]>([]);
  const [collectionSummary, setCollectionSummary] = useState<CollectionSummary | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [notes, setNotes] = useState('');
  const [collecting, setCollecting] = useState(false);
  const [showDeduction, setShowDeduction] = useState(false);
  const [deductionAmount, setDeductionAmount] = useState('');
  const [deductionReason, setDeductionReason] = useState('');

  useEffect(() => { loadData(); }, [activeTab, selectedMonth, selectedYear]);

  const loadData = () => {
    if (activeTab === 'pending') loadPendingCollections();
    else loadCollectionHistory();
  };

  const loadPendingCollections = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/PaymentCollection/Pending`);
      if (response.ok) {
        const data: PendingCollection[] = await response.json();
        setPendingCollections(data);
        setGroupedPending(groupPendingByStaff(data));
      } else {
        Alert.alert('Error', 'Failed to load pending collections');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadCollectionHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/PaymentCollection/History?month=${selectedMonth + 1}&year=${selectedYear}`
      );
      if (response.ok) {
        const data = await response.json();
        let flat: CollectionHistory[] = [];
        if (Array.isArray(data)) {
          if (data.length > 0 && data[0].hasOwnProperty('dates')) {
            data.forEach((staff: any) => {
              staff.dates.forEach((dateItem: any) => {
                dateItem.collections.forEach((collection: any) => {
                  flat.push({
                    id: Math.random(),
                    staffId: 0,
                    staffName: staff.staffName,
                    staffPhone: '',
                    locationName: collection.locationName,
                    collectionDate: dateItem.date,
                    totalVehicles: 0,
                    netCollection: collection.finalAmount,
                    totalAmount: 0,
                    balanceAmount: 0,
                    refundAmount: 0,
                    deductionAmount: collection.deductionAmount || 0,
                    deductionReason: collection.deductionReason || '',
                    finalAmount: collection.finalAmount,
                    collectedBy: collection.collectedBy || '',
                    notes: collection.notes || '',
                  });
                });
              });
            });
          } else {
            flat = data;
          }
        }
        setCollectionHistory(flat);
        setGroupedHistory(groupHistoryByStaff(flat));
      } else {
        Alert.alert('Error', 'Failed to load collection history');
        setCollectionHistory([]);
        setGroupedHistory([]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to server');
      setCollectionHistory([]);
      setGroupedHistory([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const loadCollectionDetails = async (staffId: number, locationId: number) => {
    try {
      setLoadingDetails(true);
      const response = await fetch(
        `${API_BASE_URL}/PaymentCollection/Details/${staffId}/${locationId}`
      );
      if (response.ok) {
        const data = await response.json();
        setCollectionDetails(data.entries || []);
        setCollectionSummary(data.summary || null);
      } else {
        Alert.alert('Error', 'Failed to load collection details');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load collection details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleViewDetails = async (collection: PendingCollection) => {
    setSelectedCollection(collection);
    setDetailsModalVisible(true);
    setShowDeduction(false);
    setDeductionAmount('');
    setDeductionReason('');
    setNotes('');
    await loadCollectionDetails(collection.staffId, collection.locationId);
  };

  const calculateFinalAmount = () => {
    if (!collectionSummary) return 0;
    return collectionSummary.netCollection - (parseFloat(deductionAmount) || 0);
  };

  const handleCollectPayment = async () => {
    if (!selectedCollection) return;
    const deduction = parseFloat(deductionAmount) || 0;

    Alert.alert(
      'Confirm Collection',
      showDeduction && deduction > 0
        ? `Collect ₹${calculateFinalAmount().toFixed(2)} (after ₹${deduction.toFixed(2)} deduction)?`
        : `Collect ₹${selectedCollection.netCollection.toFixed(2)} from ${selectedCollection.staffName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Collect',
          onPress: async () => {
            try {
              setCollecting(true);
              const storedUser = await AsyncStorage.getItem('user');
              if (!storedUser) { Alert.alert('Error', 'User not found'); return; }
              const user = JSON.parse(storedUser);
              const userId = user.userId || user.id;

              const requestBody: any = {
                staffId: selectedCollection.staffId,
                locationId: selectedCollection.locationId,
                collectedByUserId: userId,
                notes: notes || '',
              };
              if (showDeduction && deduction > 0) {
                requestBody.deductionAmount = deduction;
                if (deductionReason.trim()) requestBody.deductionReason = deductionReason.trim();
              }

              const response = await fetch(`${API_BASE_URL}/PaymentCollection/Collect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
              });

              if (response.ok) {
                const result = await response.json();
                Alert.alert(
                  '✅ Collection Successful',
                  `Collected ₹${result.finalAmount.toFixed(2)} for ${result.totalVehicles} vehicles`
                );
                closeDetailsModal();
                loadPendingCollections();
                loadCollectionHistory();
              } else {
                const errorText = await response.text();
                try {
                  const error = JSON.parse(errorText);
                  Alert.alert('Error', error.message || 'Failed to collect payment');
                } catch {
                  Alert.alert('Error', 'Failed to collect payment');
                }
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to process collection');
            } finally {
              setCollecting(false);
            }
          },
        },
      ]
    );
  };

  const closeDetailsModal = () => {
    setDetailsModalVisible(false);
    setSelectedCollection(null);
    setCollectionDetails([]);
    setCollectionSummary(null);
    setNotes('');
    setDeductionAmount('');
    setDeductionReason('');
    setShowDeduction(false);
  };

  const getMonthName = (month: number) =>
    ['January','February','March','April','May','June','July','August','September','October','November','December'][month];

  const changeMonth = (direction: 'prev' | 'next') => {
    let m = selectedMonth, y = selectedYear;
    if (direction === 'prev') { m--; if (m < 0) { m = 11; y--; } }
    else { m++; if (m > 11) { m = 0; y++; } }
    setSelectedMonth(m);
    setSelectedYear(y);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#DC2626" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const totalPending = groupedPending.reduce((s, g) => s + g.totalNet, 0);
  const totalVehicles = groupedPending.reduce((s, g) => s + g.totalVehicles, 0);
  const totalCollected = collectionHistory.reduce((s, c) => s + (c.finalAmount || 0), 0);
  const totalDeductions = collectionHistory.reduce((s, c) => s + (c.deductionAmount || 0), 0);

  return (
    <View style={styles.container}>
      <AdminHeader title="Collections" subtitle="Staff Payment Collections"/>

      {/* Header Stats */}
      <View style={styles.headerStatsCard}>
        <View style={styles.headerStat}>
          <Text style={styles.headerStatValue}>
            ₹{totalPending.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <Text style={styles.headerStatLabel}>Total Pending</Text>
        </View>
        <View style={styles.headerDivider} />
        <View style={styles.headerStat}>
          <Text style={styles.headerStatValue}>
            ₹{totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <Text style={styles.headerStatLabel}>Collected</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabSelector}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>Pending</Text>
          {groupedPending.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{groupedPending.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>History</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── PENDING TAB ── */}
        {activeTab === 'pending' && (
          <>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Pending Collection</Text>
              <Text style={styles.summaryAmount}>
                ₹{totalPending.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <View style={styles.summaryStats}>
                <View style={styles.summaryStatItem}>
                  <Text style={styles.summaryStatValue}>{groupedPending.length}</Text>
                  <Text style={styles.summaryStatLabel}>Staff Members</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryStatItem}>
                  <Text style={styles.summaryStatValue}>{totalVehicles}</Text>
                  <Text style={styles.summaryStatLabel}>Vehicles</Text>
                </View>
              </View>
            </View>

            {groupedPending.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>💰</Text>
                <Text style={styles.emptyStateText}>No Pending Collections</Text>
                <Text style={styles.emptyStateSubtext}>All payments have been collected</Text>
              </View>
            ) : (
              groupedPending.map((group) => (
                <StaffPendingCard
                  key={group.staffId}
                  group={group}
                  onCollect={handleViewDetails}
                />
              ))
            )}
          </>
        )}

        {/* ── HISTORY TAB ── */}
        {activeTab === 'history' && (
          <>
            {/* Month Selector */}
            <View style={styles.monthSelectorRow}>
              <TouchableOpacity onPress={() => changeMonth('prev')} style={styles.monthNavBtn}>
                <Ionicons name="chevron-back" size={20} color="#666" />
              </TouchableOpacity>
              <Text style={styles.monthText}>{getMonthName(selectedMonth)} {selectedYear}</Text>
              <TouchableOpacity onPress={() => changeMonth('next')} style={styles.monthNavBtn}>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            {/* History Summary */}
            <View style={[styles.summaryCard, styles.summaryCardGreen]}>
              <Text style={styles.summaryLabel}>Total Collected</Text>
              <Text style={styles.summaryAmount}>
                ₹{totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <View style={styles.summaryStats}>
                <View style={styles.summaryStatItem}>
                  <Text style={styles.summaryStatValue}>{collectionHistory.length}</Text>
                  <Text style={styles.summaryStatLabel}>Collections</Text>
                </View>
                {totalDeductions > 0 && (
                  <>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryStatItem}>
                      <Text style={styles.summaryStatValue}>
                        ₹{totalDeductions.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </Text>
                      <Text style={styles.summaryStatLabel}>Deductions</Text>
                    </View>
                  </>
                )}
              </View>
            </View>

            {groupedHistory.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>📋</Text>
                <Text style={styles.emptyStateText}>No Collection History</Text>
                <Text style={styles.emptyStateSubtext}>
                  No collections for {getMonthName(selectedMonth)} {selectedYear}
                </Text>
              </View>
            ) : (
              groupedHistory.map((group) => (
                <StaffHistoryCard key={group.staffName} group={group} />
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* ── COLLECTION DETAILS MODAL ── */}
      <Modal
        visible={detailsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeDetailsModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Collection Details</Text>
                {selectedCollection && (
                  <Text style={styles.modalSubtitle}>
                    {selectedCollection.staffName} • {selectedCollection.locationName}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={closeDetailsModal} style={styles.modalCloseButton}>
                <Text style={styles.modalCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {collectionSummary && (
                <View style={styles.modalSummary}>
                  <SummaryRow label="Total Vehicles" value={String(collectionSummary.totalVehicles)} />
                  <SummaryRow label="Total Amount" value={`₹${collectionSummary.totalAmount.toFixed(2)}`} />
                  <SummaryRow label="Advance Paid" value={`₹${collectionSummary.advanceAmount.toFixed(2)}`} />
                  <SummaryRow label="Balance Collected" value={`₹${collectionSummary.balanceAmount.toFixed(2)}`} />
                  {collectionSummary.refundAmount > 0 && (
                    <SummaryRow label="Refunds Given" value={`-₹${collectionSummary.refundAmount.toFixed(2)}`} valueStyle={styles.refundText} />
                  )}
                  <View style={[styles.summaryRow, styles.netRow]}>
                    <Text style={styles.netLabel}>Net Collection</Text>
                    <Text style={styles.netValue}>₹{collectionSummary.netCollection.toFixed(2)}</Text>
                  </View>

                  {showDeduction && (
                    <View style={styles.deductionSection}>
                      <Text style={styles.deductionTitle}>Deduction (Optional)</Text>
                      <View style={styles.deductionInputRow}>
                        <Text style={styles.deductionLabel}>Amount</Text>
                        <TextInput
                          style={styles.deductionInput}
                          placeholder="0.00"
                          keyboardType="numeric"
                          value={deductionAmount}
                          onChangeText={setDeductionAmount}
                        />
                      </View>
                      {parseFloat(deductionAmount) > 0 && (
                        <TextInput
                          style={styles.deductionReasonInput}
                          placeholder="Reason for deduction (optional)"
                          placeholderTextColor="#999"
                          value={deductionReason}
                          onChangeText={setDeductionReason}
                          multiline
                          numberOfLines={2}
                        />
                      )}
                      <View style={[styles.summaryRow, styles.finalRow]}>
                        <Text style={styles.finalLabel}>Final Amount</Text>
                        <Text style={styles.finalValue}>₹{calculateFinalAmount().toFixed(2)}</Text>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {!showDeduction ? (
                <TouchableOpacity style={styles.addDeductionButton} onPress={() => setShowDeduction(true)}>
                  <Text style={styles.addDeductionText}>➖ Add Deduction (Optional)</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.removeDeductionButton}
                  onPress={() => { setShowDeduction(false); setDeductionAmount(''); setDeductionReason(''); }}
                >
                  <Text style={styles.removeDeductionText}>✕ Remove Deduction</Text>
                </TouchableOpacity>
              )}

              <Text style={styles.sectionTitle}>Vehicle Details ({collectionDetails.length})</Text>
              {loadingDetails ? (
                <View style={styles.detailsLoading}>
                  <ActivityIndicator size="small" color="#DC2626" />
                </View>
              ) : (
                collectionDetails.map((detail) => (
                  <View key={detail.id} style={styles.detailCard}>
                    <View style={styles.detailHeader}>
                      <Text style={styles.detailVehicle}>{detail.vehicleNumber}</Text>
                      <Text style={styles.detailType}>{detail.vehicleType}</Text>
                    </View>
                    <DetailRow label="Check-Out" value={formatDate(detail.checkOut)} />
                    <DetailRow label="Duration" value={`${detail.totalHours}h`} />
                    <DetailRow
                      label="Amount"
                      value={`₹${((detail.totalAmount || 0) + (detail.balanceAmount || 0) - (detail.refundAmount || 0)).toFixed(2)}`}
                    />
                  </View>
                ))
              )}

              <Text style={styles.sectionTitle}>Notes (Optional)</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Add any notes about this collection..."
                placeholderTextColor="#999"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={closeDetailsModal}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCollectButton}
                onPress={handleCollectPayment}
                disabled={collecting}
              >
                {collecting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalCollectText}>Collect ₹{calculateFinalAmount().toFixed(2)}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Small helper components ───────────────────────────────────────────────────

function SummaryRow({ label, value, valueStyle }: { label: string; value: string; valueStyle?: any }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryRowLabel}>{label}</Text>
      <Text style={[styles.summaryRowValue, valueStyle]}>{value}</Text>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  topSpacer: { height: Platform.OS === 'ios' ? 40 : StatusBar.currentHeight, backgroundColor: '#f5f5f5' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#666' },

  // Header
  headerCard: {
    backgroundColor: '#fff', marginHorizontal: 16, marginTop: 8, marginBottom: 12,
    padding: 20, borderRadius: 20, shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 16 },
  headerStats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  headerStat: { flex: 1, alignItems: 'center' },
  headerStatValue: { fontSize: 22, fontWeight: '800', color: '#DC2626', marginBottom: 4 },
  headerStatLabel: { fontSize: 12, color: '#888' },
  headerDivider: { width: 1, height: 40, backgroundColor: '#e0e0e0' },

  // Tabs
  tabSelector: {
    flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 16,
    marginBottom: 16, borderRadius: 12, padding: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10 },
  tabActive: { backgroundColor: '#DC2626' },
  tabText: { fontSize: 15, fontWeight: '600', color: '#666' },
  tabTextActive: { color: '#fff' },
  badge: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 8 },
  badgeText: { color: '#DC2626', fontSize: 10, fontWeight: '700' },

  content: { paddingHorizontal: 16, paddingBottom: 32 },

  // Summary banner
  summaryCard: {
    backgroundColor: '#DC2626', borderRadius: 20, padding: 24, marginBottom: 16,
    alignItems: 'center', shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
  },
  summaryCardGreen: { backgroundColor: '#059669' },
  summaryLabel: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginBottom: 8, fontWeight: '500' },
  summaryAmount: { fontSize: 40, fontWeight: '800', color: '#fff', marginBottom: 16 },
  summaryStats: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  summaryStatItem: { alignItems: 'center' },
  summaryStatValue: { fontSize: 24, fontWeight: '700', color: '#fff' },
  summaryStatLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  summaryDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.3)' },

  // Month selector
  monthSelectorRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 16, marginBottom: 14,
  },
  monthNavBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  monthText: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 80 },
  emptyStateIcon: { fontSize: 64, marginBottom: 16, opacity: 0.4 },
  emptyStateText: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 8 },
  emptyStateSubtext: { fontSize: 14, color: '#999' },

  // Staff grouped card
  staffCard: {
    backgroundColor: '#fff', borderRadius: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    overflow: 'hidden',
  },
  staffHeader: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
  },
  avatarCircle: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 13, fontWeight: '700', color: '#991B1B' },
  avatarGreen: { backgroundColor: '#D1FAE5' },
  avatarTextGreen: { color: '#065F46' },
  staffMeta: { flex: 1, marginLeft: 10 },
  staffName: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  staffSub: { fontSize: 12, color: '#888', marginTop: 2 },
  staffRight: { alignItems: 'flex-end' },
  staffTotalAmt: { fontSize: 16, fontWeight: '800', color: '#DC2626' },
  staffTotalVehicles: { fontSize: 11, color: '#888', marginTop: 2 },

  // Location expanded items
  locationsWrap: { borderTopWidth: 0.5, borderTopColor: '#f0f0f0' },
  headerStatsCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  locItem: { padding: 14 },
  locItemBorder: { borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0' },
  locHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  locName: { fontSize: 13, fontWeight: '600', color: '#1a1a1a', flex: 1 },
  locBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  locBadgeText: { fontSize: 13, fontWeight: '700', color: '#991B1B' },
  locStats: {
    flexDirection: 'row', borderWidth: 0.5, borderColor: '#eee',
    borderRadius: 10, overflow: 'hidden', marginBottom: 10,
  },
  locStat: { flex: 1, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4 },
  locStatDivider: { width: 0.5, backgroundColor: '#eee' },
  locStatVal: { fontSize: 13, fontWeight: '700', color: '#1a1a1a' },
  locStatLbl: { fontSize: 10, color: '#888', marginTop: 2 },
  locPeriod: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  locPeriodText: { fontSize: 11, color: '#888' },
  locDaysPending: { fontSize: 11, fontWeight: '600', color: '#D97706' },
  collectBtn: { backgroundColor: '#DC2626', padding: 11, borderRadius: 10, alignItems: 'center' },
  collectBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  // History entry (inside expanded staff card)
  histEntry: { padding: 14 },
  histEntryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  histLocName: { fontSize: 13, fontWeight: '600', color: '#1a1a1a', marginBottom: 2 },
  histEntryDate: { fontSize: 11, color: '#888' },
  histFinalAmt: { fontSize: 15, fontWeight: '700', color: '#10B981' },
  histDeduction: { fontSize: 11, color: '#EF4444', marginTop: 2, textAlign: 'right' },
  histMeta: { flexDirection: 'row', gap: 6 },
  histMetaText: { fontSize: 11, color: '#888' },
  histMetaDot: { fontSize: 11, color: '#ccc' },
  histNotes: { fontSize: 11, color: '#888', marginTop: 6, fontStyle: 'italic' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  modalTitle: { fontSize: 22, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  modalSubtitle: { fontSize: 14, color: '#666' },
  modalCloseButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  modalCloseIcon: { fontSize: 20, color: '#666' },
  modalBody: { padding: 20 },
  modalSummary: { backgroundColor: '#f8f9fa', borderRadius: 16, padding: 16, marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  summaryRowLabel: { fontSize: 14, color: '#666' },
  summaryRowValue: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  refundText: { color: '#EF4444' },
  netRow: { borderTopWidth: 2, borderTopColor: '#DC2626', marginTop: 8, paddingTop: 12 },
  netLabel: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  netValue: { fontSize: 18, fontWeight: '800', color: '#DC2626' },
  deductionSection: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  deductionTitle: { fontSize: 14, fontWeight: '600', color: '#EF4444', marginBottom: 12 },
  deductionInputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  deductionLabel: { fontSize: 14, color: '#666' },
  deductionInput: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 10, width: 120, fontSize: 14, textAlign: 'right' },
  deductionReasonInput: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 10, fontSize: 14, marginBottom: 12, textAlignVertical: 'top' },
  finalRow: { borderTopWidth: 1, borderTopColor: '#e0e0e0', marginTop: 8, paddingTop: 12 },
  finalLabel: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  finalValue: { fontSize: 18, fontWeight: '800', color: '#DC2626' },
  addDeductionButton: { backgroundColor: '#FEF3C7', padding: 12, borderRadius: 10, alignItems: 'center', marginBottom: 16 },
  addDeductionText: { fontSize: 14, fontWeight: '600', color: '#D97706' },
  removeDeductionButton: { backgroundColor: '#FEE2E2', padding: 12, borderRadius: 10, alignItems: 'center', marginBottom: 16 },
  removeDeductionText: { fontSize: 14, fontWeight: '600', color: '#DC2626' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1a1a1a', marginBottom: 12, marginTop: 8 },
  detailsLoading: { padding: 20, alignItems: 'center' },
  detailCard: { backgroundColor: '#f8f9fa', borderRadius: 12, padding: 12, marginBottom: 8 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  detailVehicle: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  detailType: { fontSize: 13, color: '#666' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  detailLabel: { fontSize: 13, color: '#888' },
  detailValue: { fontSize: 13, fontWeight: '500', color: '#333' },
  notesInput: {
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12, padding: 12,
    fontSize: 14, color: '#333', backgroundColor: '#fafafa',
    textAlignVertical: 'top', marginBottom: 20, minHeight: 80,
  },
  modalActions: { flexDirection: 'row', gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  modalCancelButton: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#f5f5f5', alignItems: 'center' },
  modalCancelText: { fontSize: 16, fontWeight: '600', color: '#666' },
  modalCollectButton: { flex: 2, padding: 16, borderRadius: 12, backgroundColor: '#DC2626', alignItems: 'center' },
  modalCollectText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});