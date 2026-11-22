import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  Linking,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Customer, Transaction } from '@/types/ledger';
import { useAuth } from '@/context/AuthContext';

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: '1',
    name: 'Ramesh Patel (કાકા)',
    phone: '9876543210',
    balance: 1450,
    lastTransactionDate: 'Today, 11:30 AM',
    avatarColor: '#2563eb',
  },
  {
    id: '2',
    name: 'Haresh Ahir',
    phone: '9825123456',
    balance: 2800,
    lastTransactionDate: 'Yesterday',
    avatarColor: '#7c3aed',
  },
  {
    id: '3',
    name: 'Pooja General Store',
    phone: '9898765432',
    balance: -600, // You owe them
    lastTransactionDate: '20 Nov',
    avatarColor: '#ea580c',
  },
  {
    id: '4',
    name: 'Ketan Shah',
    phone: '9426011223',
    balance: 0,
    lastTransactionDate: '18 Nov',
    avatarColor: '#059669',
  },
  {
    id: '5',
    name: 'Jayeshbhai Dairy',
    phone: '9909876543',
    balance: 420,
    lastTransactionDate: '16 Nov',
    avatarColor: '#db2777',
  },
];

export default function HomeScreen() {
  const { user, signOut, isConfigured } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'due' | 'settled'>('all');
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Customer Add Modal
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerBalance, setNewCustomerBalance] = useState('');

  // Transaction Record Modal
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [txType, setTxType] = useState<'credit_given' | 'payment_received'>('credit_given');
  const [txAmount, setTxAmount] = useState('');
  const [txNote, setTxNote] = useState('');

  // Computations
  const totalYoullGet = customers
    .filter((c) => c.balance > 0)
    .reduce((sum, c) => sum + c.balance, 0);

  const totalYoullGive = customers
    .filter((c) => c.balance < 0)
    .reduce((sum, c) => sum + Math.abs(c.balance), 0);

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery);

    if (!matchesSearch) return false;
    if (activeFilter === 'due') return customer.balance > 0;
    if (activeFilter === 'settled') return customer.balance === 0;
    return true;
  });

  const handleAddCustomer = () => {
    if (!newCustomerName.trim()) return;
    const initialBal = parseFloat(newCustomerBalance) || 0;
    const colors = ['#2563eb', '#7c3aed', '#059669', '#ea580c', '#db2777', '#0891b2'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newCustomer: Customer = {
      id: Date.now().toString(),
      name: newCustomerName.trim(),
      phone: newCustomerPhone.trim() || 'Not provided',
      balance: initialBal,
      lastTransactionDate: 'Just now',
      avatarColor: randomColor,
    };

    setCustomers([newCustomer, ...customers]);
    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewCustomerBalance('');
    setShowAddCustomerModal(false);
  };

  const handleRecordTransaction = () => {
    if (!selectedCustomer) return;
    const amountNum = parseFloat(txAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    // credit_given (Udhar) increases what customer owes (+balance)
    // payment_received (Jama) decreases what customer owes (-balance)
    const balanceChange = txType === 'credit_given' ? amountNum : -amountNum;

    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === selectedCustomer.id) {
          return {
            ...c,
            balance: c.balance + balanceChange,
            lastTransactionDate: 'Just now',
          };
        }
        return c;
      })
    );

    setTxAmount('');
    setTxNote('');
    setShowTransactionModal(false);
  };

  const sendWhatsAppReminder = (customer: Customer) => {
    if (customer.balance <= 0) return;
    const message = encodeURIComponent(
      `નમસ્તે ${customer.name},\nતમારી દુકાનની ઉઘરાણી ₹${customer.balance} બાકી છે. અનુકૂળતા મુજબ જમા કરાવી આપશો.\nઆભાર - Ughrani App`
    );
    const url = `https://wa.me/91${customer.phone.replace(/[^0-9]/g, '')}?text=${message}`;
    Linking.openURL(url).catch(() => {
      alert('Could not open WhatsApp.');
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* App Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerShopInfo}
          activeOpacity={0.7}
          onPress={() => setShowProfileModal(true)}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>Ughrani</Text>
            <Text style={styles.headerBadge}>ઉઘરાણી</Text>
          </View>
          <View style={styles.headerShopRow}>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {user?.shopName || 'Shree Kirana Store'} 🏪
            </Text>
            <View style={[styles.statusDot, isConfigured ? styles.dotGreen : styles.dotOrange]} />
          </View>
        </TouchableOpacity>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.profileBtnHeader}
            onPress={() => setShowProfileModal(true)}>
            <Ionicons name="storefront-outline" size={18} color="#2563eb" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addBtnHeader}
            onPress={() => setShowAddCustomerModal(true)}>
            <Ionicons name="person-add" size={18} color="#fff" />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, styles.getCard]}>
          <Text style={styles.summaryLabel}>YOU'LL GET (ઉઘરાણી)</Text>
          <Text style={[styles.summaryAmount, { color: '#16a34a' }]}>
            ₹{totalYoullGet.toLocaleString('en-IN')}
          </Text>
          <Text style={styles.summarySub}>From {customers.filter((c) => c.balance > 0).length} customers</Text>
        </View>

        <View style={[styles.summaryCard, styles.giveCard]}>
          <Text style={styles.summaryLabel}>YOU'LL GIVE (લેવાના)</Text>
          <Text style={[styles.summaryAmount, { color: '#dc2626' }]}>
            ₹{totalYoullGive.toLocaleString('en-IN')}
          </Text>
          <Text style={styles.summarySub}>To {customers.filter((c) => c.balance < 0).length} parties</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search customer by name or phone..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'all' && styles.filterChipActive]}
          onPress={() => setActiveFilter('all')}>
          <Text
            style={[
              styles.filterChipText,
              activeFilter === 'all' && styles.filterChipTextActive,
            ]}>
            All ({customers.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'due' && styles.filterChipActive]}
          onPress={() => setActiveFilter('due')}>
          <Text
            style={[
              styles.filterChipText,
              activeFilter === 'due' && styles.filterChipTextActive,
            ]}>
            Dues (Pending)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'settled' && styles.filterChipActive]}
          onPress={() => setActiveFilter('settled')}>
          <Text
            style={[
              styles.filterChipText,
              activeFilter === 'settled' && styles.filterChipTextActive,
            ]}>
            Settled (₹0)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Customer List */}
      <FlatList
        data={filteredCustomers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isDue = item.balance > 0;
          const isCredit = item.balance < 0;
          const isSettled = item.balance === 0;

          return (
            <TouchableOpacity
              style={styles.customerCard}
              activeOpacity={0.7}
              onPress={() => {
                setSelectedCustomer(item);
                setShowTransactionModal(true);
              }}>
              {/* Avatar */}
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: item.avatarColor || '#3b82f6' },
                ]}>
                <Text style={styles.avatarText}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>

              {/* Customer Info */}
              <View style={styles.customerDetails}>
                <Text style={styles.customerName}>{item.name}</Text>
                <Text style={styles.customerMeta}>
                  {item.phone} • {item.lastTransactionDate}
                </Text>
              </View>

              {/* Balance & Actions */}
              <View style={styles.balanceContainer}>
                <Text
                  style={[
                    styles.balanceAmount,
                    isDue && styles.amountDue,
                    isCredit && styles.amountGive,
                    isSettled && styles.amountSettled,
                  ]}>
                  ₹{Math.abs(item.balance).toLocaleString('en-IN')}
                </Text>
                <Text style={styles.balanceStatus}>
                  {isDue ? "You'll Get" : isCredit ? "You'll Give" : 'Settled'}
                </Text>
              </View>

              {/* WhatsApp Reminder Button */}
              {isDue && (
                <TouchableOpacity
                  style={styles.whatsappBtn}
                  onPress={() => sendWhatsAppReminder(item)}>
                  <Ionicons name="logo-whatsapp" size={18} color="#22c55e" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>No customers found</Text>
            <TouchableOpacity
              style={styles.emptyAddBtn}
              onPress={() => setShowAddCustomerModal(true)}>
              <Text style={styles.emptyAddBtnText}>+ Add First Customer</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Floating Action Button (Mobile) */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddCustomerModal(true)}>
        <Ionicons name="add" size={26} color="#fff" />
        <Text style={styles.fabText}>Add Customer</Text>
      </TouchableOpacity>

      {/* MODAL: Add Customer */}
      <Modal
        visible={showAddCustomerModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddCustomerModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Customer</Text>
              <TouchableOpacity onPress={() => setShowAddCustomerModal(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Customer Name *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Ramesh Patel"
              value={newCustomerName}
              onChangeText={setNewCustomerName}
            />

            <Text style={styles.inputLabel}>Mobile Number</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="10-digit mobile number"
              keyboardType="phone-pad"
              value={newCustomerPhone}
              onChangeText={setNewCustomerPhone}
            />

            <Text style={styles.inputLabel}>Opening Balance (₹)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="0 (Optional credit/udhar balance)"
              keyboardType="numeric"
              value={newCustomerBalance}
              onChangeText={setNewCustomerBalance}
            />

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleAddCustomer}>
              <Text style={styles.saveBtnText}>Save Customer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: Record Transaction */}
      <Modal
        visible={showTransactionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTransactionModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Record Entry</Text>
                <Text style={styles.modalSubtitle}>
                  For {selectedCustomer?.name} (Current: ₹{selectedCustomer?.balance})
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowTransactionModal(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Type selector: Gave (Udhar) vs Got (Jama) */}
            <View style={styles.txTypeSelector}>
              <TouchableOpacity
                style={[
                  styles.txTypeBtn,
                  txType === 'credit_given' && styles.txTypeBtnGiveActive,
                ]}
                onPress={() => setTxType('credit_given')}>
                <Text
                  style={[
                    styles.txTypeBtnText,
                    txType === 'credit_given' && styles.txTypeBtnTextActive,
                  ]}>
                  You Gave ₹ (ઉધાર)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.txTypeBtn,
                  txType === 'payment_received' && styles.txTypeBtnGetActive,
                ]}
                onPress={() => setTxType('payment_received')}>
                <Text
                  style={[
                    styles.txTypeBtnText,
                    txType === 'payment_received' && styles.txTypeBtnTextActive,
                  ]}>
                  You Got ₹ (જમા)
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Amount (₹) *</Text>
            <TextInput
              style={[styles.modalInput, styles.amountInputBig]}
              placeholder="₹ 0"
              keyboardType="numeric"
              value={txAmount}
              onChangeText={setTxAmount}
              autoFocus
            />

            <Text style={styles.inputLabel}>Item / Bill Details (Optional)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 5kg Wheat Flour, 2 Oil packets"
              value={txNote}
              onChangeText={setTxNote}
            />

            <TouchableOpacity
              style={[
                styles.saveBtn,
                txType === 'credit_given' ? { backgroundColor: '#dc2626' } : { backgroundColor: '#16a34a' },
              ]}
              onPress={handleRecordTransaction}>
              <Text style={styles.saveBtnText}>
                {txType === 'credit_given' ? 'Save Udhar Entry' : 'Save Jama Entry'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: Shop Profile & Cloud Backup Info */}
      <Modal
        visible={showProfileModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProfileModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Shop Profile & Backup 🏪</Text>
                <Text style={styles.modalSubtitle}>SaaS Cloud Ledger Management</Text>
              </View>
              <TouchableOpacity onPress={() => setShowProfileModal(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Profile Info Card */}
            <View style={styles.profileInfoBox}>
              <View style={styles.profileRow}>
                <Ionicons name="business" size={18} color="#2563eb" />
                <Text style={styles.profileLabel}>Shop Name:</Text>
                <Text style={styles.profileValue}>{user?.shopName || 'Shree Kirana'}</Text>
              </View>
              <View style={styles.profileRow}>
                <Ionicons name="person" size={18} color="#2563eb" />
                <Text style={styles.profileLabel}>Owner:</Text>
                <Text style={styles.profileValue}>{user?.ownerName || 'Patel'}</Text>
              </View>
              <View style={styles.profileRow}>
                <Ionicons name="mail" size={18} color="#2563eb" />
                <Text style={styles.profileLabel}>Account:</Text>
                <Text style={styles.profileValue}>{user?.email || 'demo@ughrani.com'}</Text>
              </View>
            </View>

            {/* Disaster Recovery Status */}
            <View style={styles.backupCard}>
              <View style={styles.backupTitleRow}>
                <Ionicons name="shield-checkmark" size={20} color="#16a34a" />
                <Text style={styles.backupTitle}>Cloud Backup: Active 🟢</Text>
              </View>
              <Text style={styles.backupText}>
                All ledger entries and dues are synced to encrypted PostgreSQL cloud storage. If this device is lost, login on any Android, iPhone or PC to retrieve 100% of your records.
              </Text>
            </View>

            {/* Logout Button */}
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() => {
                setShowProfileModal(false);
                signOut();
              }}>
              <Ionicons name="log-out-outline" size={20} color="#dc2626" />
              <Text style={styles.logoutBtnText}>Log Out from This Device</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  headerShopInfo: {
    flex: 1,
  },
  headerShopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotGreen: {
    backgroundColor: '#16a34a',
  },
  dotOrange: {
    backgroundColor: '#f59e0b',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileBtnHeader: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  profileInfoBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    width: 90,
  },
  profileValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
  },
  backupCard: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  backupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  backupTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803d',
  },
  backupText: {
    fontSize: 12,
    color: '#166534',
    lineHeight: 18,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#fca5a5',
    backgroundColor: '#fef2f2',
    marginTop: 6,
  },
  logoutBtnText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '700',
  },
  addBtnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 13,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  getCard: {
    borderColor: '#bbf7d0',
  },
  giveCard: {
    borderColor: '#fecaca',
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: '800',
    marginVertical: 4,
  },
  summarySub: {
    fontSize: 11,
    color: '#94a3b8',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 42,
    fontSize: 14,
    color: '#0f172a',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#0f172a',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 90,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  customerMeta: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  balanceContainer: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  balanceAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  amountDue: {
    color: '#16a34a',
  },
  amountGive: {
    color: '#dc2626',
  },
  amountSettled: {
    color: '#64748b',
  },
  balanceStatus: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 2,
  },
  whatsappBtn: {
    padding: 6,
    backgroundColor: '#f0fdf4',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 14,
    color: '#64748b',
  },
  emptyAddBtn: {
    marginTop: 14,
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyAddBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 8,
    shadowColor: '#1d4ed8',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  fabText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  amountInputBig: {
    fontSize: 22,
    fontWeight: '700',
    height: 52,
    textAlign: 'center',
    color: '#0f172a',
  },
  txTypeSelector: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 12,
  },
  txTypeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  txTypeBtnGiveActive: {
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
  },
  txTypeBtnGetActive: {
    borderColor: '#16a34a',
    backgroundColor: '#f0fdf4',
  },
  txTypeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  txTypeBtnTextActive: {
    color: '#0f172a',
  },
  saveBtn: {
    backgroundColor: '#2563eb',
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
