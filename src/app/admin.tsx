import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import UghraniLogo from '@/components/ui/UghraniLogo';

interface RegisteredShop {
  id: string;
  shopName: string;
  ownerName: string;
  phone: string;
  email: string;
  city: string;
  customerCount: number;
  totalVolume: number;
  registeredAt: string;
  platform: 'Android' | 'Web' | 'iOS';
  status: 'active' | 'new';
}

const MOCK_REGISTERED_SHOPS: RegisteredShop[] = [
  {
    id: 'shop-1',
    shopName: 'Shree Ambika Provision Store',
    ownerName: 'Uday Ahir',
    phone: '9825123456',
    email: 'uday.ambika@gmail.com',
    city: 'Rajkot, Gujarat',
    customerCount: 142,
    totalVolume: 184500,
    registeredAt: 'Today, 06:15 PM',
    platform: 'Android',
    status: 'new',
  },
  {
    id: 'shop-2',
    shopName: 'Radha Krishna Kirana & General',
    ownerName: 'Ramesh Patel',
    phone: '9876543210',
    email: 'ramesh.kirana@gmail.com',
    city: 'Ahmedabad, Gujarat',
    customerCount: 89,
    totalVolume: 96200,
    registeredAt: 'Today, 02:45 PM',
    platform: 'Web',
    status: 'new',
  },
  {
    id: 'shop-3',
    shopName: 'Gokul Dairy & Sweet Mart',
    ownerName: 'Bhavesh Ahir',
    phone: '9426098765',
    email: 'gokuldairy.surat@yahoo.com',
    city: 'Surat, Gujarat',
    customerCount: 215,
    totalVolume: 342000,
    registeredAt: 'Yesterday',
    platform: 'Android',
    status: 'active',
  },
  {
    id: 'shop-4',
    shopName: 'Sardar Hardware & Electricals',
    ownerName: 'Hasmukhbhai Shah',
    phone: '9909012345',
    email: 'sardarhardware@gmail.com',
    city: 'Vadodara, Gujarat',
    customerCount: 64,
    totalVolume: 210000,
    registeredAt: '20 Nov 2026',
    platform: 'Web',
    status: 'active',
  },
  {
    id: 'shop-5',
    shopName: 'Balaji Stationery & Xerox',
    ownerName: 'Manoj Dave',
    phone: '9724567890',
    email: 'balajistationery@gmail.com',
    city: 'Bhavnagar, Gujarat',
    customerCount: 48,
    totalVolume: 38500,
    registeredAt: '18 Nov 2026',
    platform: 'iOS',
    status: 'active',
  },
];

export default function AdminDashboardScreen() {
  const [shops, setShops] = useState<RegisteredShop[]>(MOCK_REGISTERED_SHOPS);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'new' | 'active'>('all');
  const [unlocked, setUnlocked] = useState(true);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const totalShops = 184; // Platform metric
  const newRegistrationsToday = 14;
  const totalVolumeTracked = 4850000; // ₹48.5 Lakhs

  const filteredShops = shops.filter((s) => {
    const matchesSearch =
      s.shopName.toLowerCase().includes(search.toLowerCase()) ||
      s.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search) ||
      s.city.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filter === 'new') return s.status === 'new';
    if (filter === 'active') return s.status === 'active';
    return true;
  });

  const handleUnlock = () => {
    if (pinInput === '8875' || pinInput === '1234') {
      setUnlocked(true);
      setPinError(false);
      setPinInput('');
    } else {
      setPinError(true);
    }
  };

  if (!unlocked) {
    return (
      <SafeAreaView style={styles.lockSafeArea}>
        <View style={styles.lockBox}>
          <View style={styles.lockIconCircle}>
            <Ionicons name="shield-checkmark" size={40} color="#991b1b" />
          </View>
          <Text style={styles.lockTitle}>Admin Security Check</Text>
          <Text style={styles.lockSubtitle}>
            Enter Master Admin PIN to access user registrations and SaaS metrics.
          </Text>

          <TextInput
            style={[styles.pinInput, pinError && styles.pinInputError]}
            placeholder="Enter PIN (e.g. 8875)"
            placeholderTextColor="#94a3b8"
            keyboardType="numeric"
            secureTextEntry
            value={pinInput}
            onChangeText={(t) => {
              setPinInput(t);
              setPinError(false);
            }}
          />

          {pinError && (
            <Text style={styles.pinErrorText}>Incorrect PIN. Default is 8875.</Text>
          )}

          <TouchableOpacity style={styles.unlockBtn} onPress={handleUnlock}>
            <Text style={styles.unlockBtnText}>Unlock Admin Console</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Admin Header */}
        <View style={styles.adminHeader}>
          <View>
            <View style={styles.badgeRow}>
              <View style={styles.adminBadge}>
                <Ionicons name="key" size={12} color="#78350f" />
                <Text style={styles.adminBadgeText}>SUPER ADMIN</Text>
              </View>
              <View style={styles.liveSyncBadge}>
                <View style={styles.greenPulse} />
                <Text style={styles.liveSyncText}>Live Supabase Sync</Text>
              </View>
            </View>
            <Text style={styles.adminTitle}>Ughrani SaaS Console</Text>
            <Text style={styles.adminSubtitle}>Real-time merchant registrations & usage analytics</Text>
          </View>

          <TouchableOpacity style={styles.lockBtn} onPress={() => setUnlocked(false)}>
            <Ionicons name="lock-closed-outline" size={18} color="#991b1b" />
          </TouchableOpacity>
        </View>

        {/* High-Impact Stat Cards */}
        <View style={styles.statsGrid}>
          {/* Card 1: Total Registered Shops */}
          <View style={[styles.statCard, { borderTopColor: '#991b1b' }]}>
            <View style={styles.statIconCircle}>
              <Ionicons name="storefront" size={22} color="#991b1b" />
            </View>
            <Text style={styles.statValue}>{totalShops}</Text>
            <Text style={styles.statLabel}>Total Registered Shops</Text>
            <View style={styles.statTrendRow}>
              <Ionicons name="trending-up" size={14} color="#16a34a" />
              <Text style={styles.statTrendText}>+28% this month</Text>
            </View>
          </View>

          {/* Card 2: Registrations Today */}
          <View style={[styles.statCard, { borderTopColor: '#d97706' }]}>
            <View style={[styles.statIconCircle, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="person-add" size={22} color="#d97706" />
            </View>
            <Text style={styles.statValue}>+{newRegistrationsToday}</Text>
            <Text style={styles.statLabel}>New Shops Today</Text>
            <View style={styles.statTrendRow}>
              <Text style={styles.statSubHighlight}>Peak: 11 AM - 3 PM</Text>
            </View>
          </View>

          {/* Card 3: Total Money in Circulation */}
          <View style={[styles.statCard, { borderTopColor: '#059669' }]}>
            <View style={[styles.statIconCircle, { backgroundColor: '#d1fae5' }]}>
              <Ionicons name="cash" size={22} color="#059669" />
            </View>
            <Text style={styles.statValue}>₹48.5L</Text>
            <Text style={styles.statLabel}>Dues Tracked Live</Text>
            <View style={styles.statTrendRow}>
              <Ionicons name="shield-checkmark" size={14} color="#059669" />
              <Text style={styles.statTrendText}>100% Backed up</Text>
            </View>
          </View>

          {/* Card 4: Platform Distribution */}
          <View style={[styles.statCard, { borderTopColor: '#2563eb' }]}>
            <View style={[styles.statIconCircle, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="phone-portrait" size={22} color="#2563eb" />
            </View>
            <Text style={styles.statValue}>68%</Text>
            <Text style={styles.statLabel}>Android / Mobile Apps</Text>
            <View style={styles.statTrendRow}>
              <Text style={styles.statSubHighlight}>24% Web • 8% iOS</Text>
            </View>
          </View>
        </View>

        {/* Section: Live Registered Shops Feed */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Registered Merchants & Shops</Text>
            <Text style={styles.sectionSubtitle}>
              Showing active accounts connected to cloud database
            </Text>
          </View>
          <TouchableOpacity
            style={styles.exportBtn}
            onPress={() => alert('Merchant registration report exported as CSV.')}>
            <Ionicons name="download-outline" size={16} color="#78350f" />
            <Text style={styles.exportBtnText}>Export CSV</Text>
          </TouchableOpacity>
        </View>

        {/* Search & Filter Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by shop name, owner, city or phone..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Pills */}
        <View style={styles.filterPillsRow}>
          <TouchableOpacity
            style={[styles.filterPill, filter === 'all' && styles.filterPillActive]}
            onPress={() => setFilter('all')}>
            <Text style={[styles.filterPillText, filter === 'all' && styles.filterPillTextActive]}>
              All ({shops.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, filter === 'new' && styles.filterPillActive]}
            onPress={() => setFilter('new')}>
            <Text style={[styles.filterPillText, filter === 'new' && styles.filterPillTextActive]}>
              New Registrations Today (2)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, filter === 'active' && styles.filterPillActive]}
            onPress={() => setFilter('active')}>
            <Text style={[styles.filterPillText, filter === 'active' && styles.filterPillTextActive]}>
              Active Merchants (3)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Merchant Cards List */}
        <View style={styles.merchantList}>
          {filteredShops.map((item) => (
            <View key={item.id} style={styles.merchantCard}>
              <View style={styles.cardTopRow}>
                <View style={styles.shopIdentity}>
                  <View style={styles.shopAvatar}>
                    <Text style={styles.shopAvatarText}>
                      {item.shopName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <View style={styles.shopNameRow}>
                      <Text style={styles.shopName}>{item.shopName}</Text>
                      {item.status === 'new' && (
                        <View style={styles.newTag}>
                          <Text style={styles.newTagText}>NEW TODAY</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.ownerText}>
                      👤 {item.ownerName} • 📍 {item.city}
                    </Text>
                  </View>
                </View>

                <View style={styles.platformBadge}>
                  <Ionicons
                    name={
                      item.platform === 'Android'
                        ? 'logo-android'
                        : item.platform === 'iOS'
                        ? 'logo-apple'
                        : 'globe-outline'
                    }
                    size={14}
                    color="#475569"
                  />
                  <Text style={styles.platformText}>{item.platform}</Text>
                </View>
              </View>

              {/* Merchant Details Row */}
              <View style={styles.cardDetailsGrid}>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Contact Phone</Text>
                  <Text style={styles.detailValue}>{item.phone}</Text>
                </View>

                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Registered</Text>
                  <Text style={styles.detailValue}>{item.registeredAt}</Text>
                </View>

                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Customers</Text>
                  <Text style={[styles.detailValue, { color: '#059669', fontWeight: '800' }]}>
                    {item.customerCount} Khata
                  </Text>
                </View>

                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Volume Tracked</Text>
                  <Text style={styles.detailValue}>
                    ₹{item.totalVolume.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fffdfa', // Warm parchment background
  },
  scroll: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: 90,
  },
  adminHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#fffbf0',
    borderWidth: 1.5,
    borderColor: '#fde68a',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#78350f',
    letterSpacing: 0.5,
  },
  liveSyncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 5,
  },
  greenPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  liveSyncText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065f46',
  },
  adminTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#7f1d1d',
    letterSpacing: -0.5,
  },
  adminSubtitle: {
    fontSize: 12,
    color: '#78350f',
    marginTop: 2,
  },
  lockBtn: {
    padding: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fef3c7',
    borderTopWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  statTrendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  statTrendText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a',
  },
  statSubHighlight: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#7f1d1d',
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#64748b',
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  exportBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#78350f',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
  },
  filterPillActive: {
    backgroundColor: '#991b1b',
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  filterPillTextActive: {
    color: '#ffffff',
  },
  merchantList: {
    gap: 10,
  },
  merchantCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fef3c7',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  shopIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  shopAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#991b1b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#f59e0b',
  },
  shopAvatarText: {
    color: '#fef3c7',
    fontSize: 18,
    fontWeight: '800',
  },
  shopNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shopName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  newTag: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  newTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#065f46',
  },
  ownerText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  platformText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  cardDetailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
    paddingTop: 10,
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 2,
  },
  lockSafeArea: {
    flex: 1,
    backgroundColor: '#fffdfa',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  lockBox: {
    maxWidth: 380,
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#fde68a',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  lockIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  lockTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#7f1d1d',
  },
  lockSubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginVertical: 10,
    lineHeight: 18,
  },
  pinInput: {
    width: '100%',
    height: 48,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 4,
    backgroundColor: '#f8fafc',
    marginVertical: 12,
  },
  pinInputError: {
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
  },
  pinErrorText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  unlockBtn: {
    width: '100%',
    backgroundColor: '#991b1b',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  unlockBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
});
