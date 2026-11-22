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
import { supabase } from '@/lib/supabase';
import UghraniLogo from '@/components/ui/UghraniLogo';

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: '1',
    name: 'Ramesh Patel (કાકા)',
    phone: '9876543210',
    balance: 1450,
    lastTransactionDate: 'Today, 11:30 AM',
    avatarColor: '#991b1b',
  },
  {
    id: '2',
    name: 'Haresh Ahir',
    phone: '9825123456',
    balance: 2800,
    lastTransactionDate: 'Yesterday',
    avatarColor: '#d97706',
  },
  {
    id: '3',
    name: 'Pooja General Store',
    phone: '9898765432',
    balance: -600, // You owe them
    lastTransactionDate: '20 Nov',
    avatarColor: '#c2410c',
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
    avatarColor: '#7f1d1d',
  },
];

export default function HomeScreen() {
  const { user, signOut, isConfigured } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'due' | 'settled'>('all');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadCustomers = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data && !error && data.length > 0) {
        const mapped: Customer[] = data.map((d: any) => ({
          id: d.id,
          name: d.name,
          phone: d.phone || '',
          balance: parseFloat(d.balance) || 0,
          lastTransactionDate: d.last_transaction_date
            ? new Date(d.last_transaction_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Today',
          avatarColor: d.avatar_color || '#991b1b',
        }));
        setCustomers(mapped);
      } else if (data && data.length === 0) {
        setCustomers([]);
      }
    } catch (e) {
      console.log('Error loading customers:', e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadCustomers();
  }, [user?.id]);

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

  const handleAddCustomer = async () => {
    if (!newCustomerName.trim()) return;
    const initialBal = parseFloat(newCustomerBalance) || 0;
    const colors = ['#991b1b', '#d97706', '#059669', '#b45309', '#7f1d1d', '#047857'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    if (user?.id) {
      try {
        const { data, error } = await supabase
          .from('customers')
          .insert({
            user_id: user.id,
            name: newCustomerName.trim(),
            phone: newCustomerPhone.trim(),
            balance: initialBal,
            avatar_color: randomColor,
          })
          .select()
          .single();

        if (data && !error) {
          const newCust: Customer = {
            id: data.id,
            name: data.name,
            phone: data.phone || 'Not provided',
            balance: parseFloat(data.balance) || 0,
            lastTransactionDate: 'Just now',
            avatarColor: data.avatar_color || randomColor,
          };
          setCustomers([newCust, ...customers]);
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      const newCustomer: Customer = {
        id: Date.now().toString(),
        name: newCustomerName.trim(),
        phone: newCustomerPhone.trim() || 'Not provided',
        balance: initialBal,
        lastTransactionDate: 'Just now',
        avatarColor: randomColor,
      };
      setCustomers([newCustomer, ...customers]);
    }

    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewCustomerBalance('');
    setShowAddCustomerModal(false);
  };

  const handleRecordTransaction = async () => {
    if (!selectedCustomer) return;
    const amountNum = parseFloat(txAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    if (user?.id) {
      try {
        await supabase.from('transactions').insert({
          user_id: user.id,
          customer_id: selectedCustomer.id,
          type: txType,
          amount: amountNum,
          note: txNote.trim(),
        });
        await loadCustomers();
      } catch (err) {
        console.error(err);
      }
    } else {
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
    }

    setTxAmount('');
    setTxNote('');
    setShowTransactionModal(false);
  };

  const sendWhatsAppReminder = (customer: Customer) => {
    if (customer.balance <= 0) return;
    const message = encodeURIComponent(
      `નમસ્તે ${customer.name} જી,\n${user?.shopName || 'અમારી દુકાન'} માંથી તમારી ઉઘરાણી ₹${customer.balance} બાકી છે. અનુકૂળતા મુજબ જમા કરાવી આપશો.\nઆભાર - Ughrani Khata`
    );
    const url = `https://wa.me/91${customer.phone.replace(/[^0-9]/g, '')}?text=${message}`;
    Linking.openURL(url).catch(() => {
      alert('Could not open WhatsApp.');
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Traditional Indian Merchant Header Banner */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerShopInfo}
          activeOpacity={0.7}
          onPress={() => setShowProfileModal(true)}>
          <UghraniLogo size="sm" showSubtitle={false} />
          <View style={styles.headerShopRow}>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {user?.shopName || 'Shree Kirana Store'} 🏪
            </Text>
            <View style={[styles.statusDot, isConfigured ? styles.dotGreen : styles.dotOrange]} />
            <Text style={styles.syncStatusText}>
              {isConfigured ? 'Cloud Live' : 'Demo Mode'}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.profileBtnHeader}
            onPress={() => setShowProfileModal(true)}>
            <Ionicons name="storefront" size={17} color="#78350f" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addBtnHeader}
            onPress={() => setShowAddCustomerModal(true)}>
            <Ionicons name="person-add" size={16} color="#fff" />
            <Text style={styles.addBtnText}>+ ગ્રાહક</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Traditional Bahi-Khata Financial Dues Summary Cards */}
      <View style={styles.summaryContainer}>
        {/* You'll Get Card (ઉઘરાણી) */}
        <View style={[styles.summaryCard, styles.getCard]}>
          <View style={styles.cardHeaderSmall}>
            <Text style={styles.summaryLabel}>YOU'LL GET • ઉઘરાણી</Text>
            <View style={styles.sealBadgeGreen}>
              <Text style={styles.sealBadgeText}>આવક</Text>
            </View>
          </View>
          <Text style={[styles.summaryAmount, { color: '#047857' }]}>
            ₹{totalYoullGet.toLocaleString('en-IN')}
          </Text>
          <Text style={styles.summarySub}>
            {customers.filter((c) => c.balance > 0).length} ગ્રાહકો પાસેથી લેવાના
          </Text>
        </View>

        {/* You'll Give Card (લેવાના) */}
        <View style={[styles.summaryCard, styles.giveCard]}>
          <View style={styles.cardHeaderSmall}>
            <Text style={styles.summaryLabel}>YOU'LL GIVE • ચૂકવવાના</Text>
            <View style={styles.sealBadgeRed}>
              <Text style={styles.sealBadgeText}>જાવક</Text>
            </View>
          </View>
          <Text style={[styles.summaryAmount, { color: '#991b1b' }]}>
            ₹{totalYoullGive.toLocaleString('en-IN')}
          </Text>
          <Text style={styles.summarySub}>
            {customers.filter((c) => c.balance < 0).length} વેપારીઓને આપવાના
          </Text>
        </View>
      </View>

      {/* Search Bar with Parchment Style */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#78350f" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="ગ્રાહક શોધો / Search customer by name or phone..."
          placeholderTextColor="#a16207"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#a16207" />
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
            બધા ખાતા ({customers.length})
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
            બાકી ઉઘરાણી (Dues)
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
            ચૂકતે (₹0 Settled)
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
              {/* Traditional Red Bahi-Khata Avatar */}
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: item.avatarColor || '#991b1b' },
                ]}>
                <Text style={styles.avatarText}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>

              {/* Customer Info */}
              <View style={styles.customerDetails}>
                <Text style={styles.customerName}>{item.name}</Text>
                <Text style={styles.customerMeta}>
                  📞 {item.phone} • {item.lastTransactionDate}
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
                  {isDue ? 'લેવાના (Due)' : isCredit ? 'આપવાના (Pay)' : 'ચૂકતે'}
                </Text>
              </View>

              {/* WhatsApp Reminder Button */}
              {isDue && (
                <TouchableOpacity
                  style={styles.whatsappBtn}
                  onPress={() => sendWhatsAppReminder(item)}>
                  <Ionicons name="logo-whatsapp" size={18} color="#15803d" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="book-outline" size={36} color="#d97706" />
            </View>
            <Text style={styles.emptyTitle}>કોઈ ખાતું મળ્યું નથી</Text>
            <Text style={styles.emptyText}>Add your first customer to start tracking udhar</Text>
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
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.fabText}>નવું ખાતું ઉમેરો</Text>
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
              <View>
                <Text style={styles.modalTitle}>નવું ગ્રાહક ખાતું (New Khata)</Text>
                <Text style={styles.modalSubtitle}>Enter customer details to track ledger</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddCustomerModal(false)}>
                <Ionicons name="close" size={24} color="#78350f" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>ગ્રાહકનું નામ (Customer Name) *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Ramesh Patel"
              value={newCustomerName}
              onChangeText={setNewCustomerName}
            />

            <Text style={styles.inputLabel}>મોબાઇલ નંબર (Mobile Number)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="10-digit mobile number"
              keyboardType="phone-pad"
              value={newCustomerPhone}
              onChangeText={setNewCustomerPhone}
            />

            <Text style={styles.inputLabel}>જૂની બાકી રકમ (Opening Balance ₹)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="0 (Optional credit balance)"
              keyboardType="numeric"
              value={newCustomerBalance}
              onChangeText={setNewCustomerBalance}
            />

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleAddCustomer}>
              <Text style={styles.saveBtnText}>ખાતું સેવ કરો (Save Khata)</Text>
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
                <Text style={styles.modalTitle}>ખાતામાં નોંધણી (Record Entry)</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedCustomer?.name} • વર્તમાન બાકી: ₹{selectedCustomer?.balance}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowTransactionModal(false)}>
                <Ionicons name="close" size={24} color="#78350f" />
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
                  ઉધાર આપ્યા ₹ (You Gave)
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
                  જમા મળ્યા ₹ (You Got)
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>રકમ (Amount ₹) *</Text>
            <TextInput
              style={[styles.modalInput, styles.amountInputBig]}
              placeholder="₹ 0"
              keyboardType="numeric"
              value={txAmount}
              onChangeText={setTxAmount}
              autoFocus
            />

            <Text style={styles.inputLabel}>સામાનની વિગત (Item description / Note)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 5kg તેલ, લોટ, કરિયાણું"
              value={txNote}
              onChangeText={setTxNote}
            />

            <TouchableOpacity
              style={[
                styles.saveBtn,
                txType === 'credit_given' ? { backgroundColor: '#991b1b' } : { backgroundColor: '#059669' },
              ]}
              onPress={handleRecordTransaction}>
              <Text style={styles.saveBtnText}>
                {txType === 'credit_given' ? 'ઉધાર નોંધ સેવ કરો' : 'જમા નોંધ સેવ કરો'}
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
                <Text style={styles.modalTitle}>દુકાન પ્રોફાઇલ & બેકઅપ 🏪</Text>
                <Text style={styles.modalSubtitle}>SaaS Cloud Ledger Management</Text>
              </View>
              <TouchableOpacity onPress={() => setShowProfileModal(false)}>
                <Ionicons name="close" size={24} color="#78350f" />
              </TouchableOpacity>
            </View>

            {/* Profile Info Card */}
            <View style={styles.profileInfoBox}>
              <View style={styles.profileRow}>
                <Ionicons name="business" size={18} color="#991b1b" />
                <Text style={styles.profileLabel}>દુકાનનું નામ:</Text>
                <Text style={styles.profileValue}>{user?.shopName || 'Shree Kirana'}</Text>
              </View>
              <View style={styles.profileRow}>
                <Ionicons name="person" size={18} color="#991b1b" />
                <Text style={styles.profileLabel}>માલિકનું નામ:</Text>
                <Text style={styles.profileValue}>{user?.ownerName || 'Patel'}</Text>
              </View>
              <View style={styles.profileRow}>
                <Ionicons name="mail" size={18} color="#991b1b" />
                <Text style={styles.profileLabel}>એકાઉન્ટ:</Text>
                <Text style={styles.profileValue}>{user?.email || 'demo@ughrani.com'}</Text>
              </View>
            </View>

            {/* Disaster Recovery Status */}
            <View style={styles.backupCard}>
              <View style={styles.backupTitleRow}>
                <Ionicons name="shield-checkmark" size={20} color="#059669" />
                <Text style={styles.backupTitle}>Cloud Backup: Active 🟢</Text>
              </View>
              <Text style={styles.backupText}>
                તમામ ચોપડા ડેટા Supabase PostgreSQL ક્લાઉડ સ્ટોરેજમાં સુરક્ષિત છે. જો ફોન ખોવાઈ જાય તો પણ નવો ફોન લેતાની સાથે ૧૦૦% રેકોર્ડ પાછો મળી જશે.
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
              <Text style={styles.logoutBtnText}>લૉગ આઉટ (Log Out)</Text>
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
    backgroundColor: '#fffdf8', // Warm Indian parchment paper tone
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fffbf0',
    borderBottomWidth: 1.5,
    borderBottomColor: '#fde68a',
  },
  headerShopInfo: {
    flex: 1,
  },
  headerShopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#78350f',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  dotGreen: {
    backgroundColor: '#10b981',
  },
  dotOrange: {
    backgroundColor: '#f59e0b',
  },
  syncStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400e',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileBtnHeader: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  addBtnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#991b1b', // Traditional Bahi-Khata Red
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
    shadowColor: '#991b1b',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  addBtnText: {
    color: '#ffffff',
    fontWeight: '700',
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
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    shadowColor: '#78350f',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  getCard: {
    borderColor: '#a7f3d0',
    borderTopWidth: 4,
    borderTopColor: '#059669',
  },
  giveCard: {
    borderColor: '#fecaca',
    borderTopWidth: 4,
    borderTopColor: '#991b1b',
  },
  cardHeaderSmall: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sealBadgeGreen: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  sealBadgeRed: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  sealBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0f172a',
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#78350f',
    letterSpacing: 0.3,
  },
  summaryAmount: {
    fontSize: 22,
    fontWeight: '900',
    marginVertical: 4,
  },
  summarySub: {
    fontSize: 10,
    color: '#854d0e',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: '#fde68a',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 42,
    fontSize: 13,
    color: '#78350f',
    fontWeight: '500',
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
    borderRadius: 18,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  filterChipActive: {
    backgroundColor: '#991b1b',
    borderColor: '#991b1b',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#78350f',
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
    borderColor: '#fef3c7',
    shadowColor: '#78350f',
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: '#f59e0b',
  },
  avatarText: {
    color: '#fef3c7',
    fontSize: 18,
    fontWeight: '900',
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1e293b',
  },
  customerMeta: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  balanceContainer: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: '900',
  },
  amountDue: {
    color: '#047857',
  },
  amountGive: {
    color: '#991b1b',
  },
  amountSettled: {
    color: '#64748b',
  },
  balanceStatus: {
    fontSize: 10,
    fontWeight: '700',
    color: '#78350f',
    marginTop: 2,
  },
  whatsappBtn: {
    padding: 7,
    backgroundColor: '#ecfdf5',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#78350f',
  },
  emptyText: {
    marginTop: 4,
    fontSize: 13,
    color: '#854d0e',
  },
  emptyAddBtn: {
    marginTop: 14,
    backgroundColor: '#991b1b',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyAddBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#991b1b',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 8,
    shadowColor: '#991b1b',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1.5,
    borderColor: '#f59e0b',
  },
  fabText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fffdf8',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
    borderTopWidth: 3,
    borderTopColor: '#f59e0b',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#7f1d1d',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#78350f',
    marginTop: 2,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#78350f',
    marginBottom: 6,
    marginTop: 10,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: '#fde68a',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  amountInputBig: {
    fontSize: 24,
    fontWeight: '900',
    height: 54,
    textAlign: 'center',
    color: '#7f1d1d',
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
    borderColor: '#fde68a',
    alignItems: 'center',
    backgroundColor: '#fffbf0',
  },
  txTypeBtnGiveActive: {
    borderColor: '#991b1b',
    backgroundColor: '#fee2e2',
  },
  txTypeBtnGetActive: {
    borderColor: '#059669',
    backgroundColor: '#d1fae5',
  },
  txTypeBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#78350f',
  },
  txTypeBtnTextActive: {
    color: '#0f172a',
  },
  saveBtn: {
    backgroundColor: '#991b1b',
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#991b1b',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  profileInfoBox: {
    backgroundColor: '#fffbf0',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#fde68a',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#78350f',
    width: 100,
  },
  profileValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    flex: 1,
  },
  backupCard: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1.5,
    borderColor: '#a7f3d0',
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
    fontWeight: '800',
    color: '#047857',
  },
  backupText: {
    fontSize: 12,
    color: '#065f46',
    lineHeight: 18,
    fontWeight: '500',
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
    fontWeight: '800',
  },
});
