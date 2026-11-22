import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

export type PaymentMode = 'cash' | 'online';

interface CashEntry {
  id: string;
  type: 'in' | 'out'; // 'in' = Money In (આવક), 'out' = Money Out (જાવક)
  mode: PaymentMode;  // 'cash' = Physical Currency (રોકડ), 'online' = UPI/QR/GPay/PhonePe (ઓનલાઇન)
  amount: number;
  description: string;
  time: string;
}

const INITIAL_ENTRIES: CashEntry[] = [
  { id: '1', type: 'in', mode: 'online', amount: 1450, description: 'Ramesh Patel (GPay UPI)', time: '11:30 AM' },
  { id: '2', type: 'in', mode: 'cash', amount: 500, description: 'Counter Cash Sale (રોકડ ગલ્લો)', time: '12:15 PM' },
  { id: '3', type: 'out', mode: 'cash', amount: 350, description: 'Milk Delivery (દૂધવાળાને રોકડા)', time: '01:00 PM' },
  { id: '4', type: 'in', mode: 'online', amount: 800, description: 'Jayeshbhai (PhonePe QR)', time: '02:40 PM' },
  { id: '5', type: 'out', mode: 'online', amount: 1200, description: 'Wholesale Supplier (UPI Transfer)', time: '03:15 PM' },
  { id: '6', type: 'out', mode: 'cash', amount: 120, description: 'Shop Tea & Snacks (ચા-નાસ્તો)', time: '04:10 PM' },
];

export default function CashbookScreen() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<CashEntry[]>(INITIAL_ENTRIES);
  const [showModal, setShowModal] = useState(false);
  const [entryType, setEntryType] = useState<'in' | 'out'>('in');
  const [entryMode, setEntryMode] = useState<PaymentMode>('cash');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [modeFilter, setModeFilter] = useState<'all' | 'cash' | 'online'>('all');

  const loadCashbook = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('cashbook_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data && !error && data.length > 0) {
        const mapped: CashEntry[] = data.map((d: any) => ({
          id: d.id,
          type: d.type,
          mode: d.mode,
          amount: parseFloat(d.amount) || 0,
          description: d.description || '',
          time: d.created_at
            ? new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Today',
        }));
        setEntries(mapped);
      }
    } catch (e) {
      console.log('Error loading cashbook:', e);
    }
  };

  React.useEffect(() => {
    loadCashbook();
  }, [user?.id]);

  // Physical Cash Calculations
  const cashIn = entries
    .filter((e) => e.type === 'in' && e.mode === 'cash')
    .reduce((sum, e) => sum + e.amount, 0);

  const cashOut = entries
    .filter((e) => e.type === 'out' && e.mode === 'cash')
    .reduce((sum, e) => sum + e.amount, 0);

  const netCashInHand = cashIn - cashOut;

  // Online / UPI Calculations
  const onlineIn = entries
    .filter((e) => e.type === 'in' && e.mode === 'online')
    .reduce((sum, e) => sum + e.amount, 0);

  const onlineOut = entries
    .filter((e) => e.type === 'out' && e.mode === 'online')
    .reduce((sum, e) => sum + e.amount, 0);

  const netOnlineBank = onlineIn - onlineOut;

  // Total Net Cash Flow
  const totalIn = cashIn + onlineIn;
  const totalOut = cashOut + onlineOut;
  const grandTotal = totalIn - totalOut;

  const filteredEntries = entries.filter((e) => {
    if (modeFilter === 'cash') return e.mode === 'cash';
    if (modeFilter === 'online') return e.mode === 'online';
    return true;
  });

  const handleAddEntry = async () => {
    const amtNum = parseFloat(amount);
    if (isNaN(amtNum) || amtNum <= 0) return;

    const defaultDesc =
      entryType === 'in'
        ? entryMode === 'cash'
          ? 'રોકડ આવક (Cash In)'
          : 'ઓનલાઇન UPI આવક (Online In)'
        : entryMode === 'cash'
        ? 'રોકડ જાવક (Cash Out)'
        : 'ઓનલાઇન UPI ચૂકવણી (Online Out)';

    const descToSave = description.trim() || defaultDesc;

    if (user?.id) {
      try {
        const { data, error } = await supabase
          .from('cashbook_entries')
          .insert({
            user_id: user.id,
            type: entryType,
            mode: entryMode,
            amount: amtNum,
            description: descToSave,
          })
          .select()
          .single();

        if (data && !error) {
          const newEntry: CashEntry = {
            id: data.id,
            type: data.type,
            mode: data.mode,
            amount: parseFloat(data.amount) || 0,
            description: data.description || descToSave,
            time: 'Just now',
          };
          setEntries([newEntry, ...entries]);
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      const newEntry: CashEntry = {
        id: Date.now().toString(),
        type: entryType,
        mode: entryMode,
        amount: amtNum,
        description: descToSave,
        time: 'Just now',
      };
      setEntries([newEntry, ...entries]);
    }

    setAmount('');
    setDescription('');
    setShowModal(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <View style={styles.titleRow}>
            <Text style={styles.headerTitle}>રોકડમેળ (Daily Cashbook)</Text>
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>રોકડ + ઓનલાઇન</Text>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>
            Cash Drawer & Online UPI Bank Split
          </Text>
        </View>

        <TouchableOpacity
          style={styles.reportBtn}
          onPress={() => alert('Daily Cash & UPI Statement generated and ready to share.')}>
          <Ionicons name="document-text-outline" size={16} color="#78350f" />
          <Text style={styles.reportBtnText}>રિપોર્ટ</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Dual Split Cards: Cash in Hand vs Online UPI */}
        <View style={styles.dualCardRow}>
          {/* Physical Cash Card */}
          <View style={[styles.splitCard, { borderTopColor: '#d97706' }]}>
            <View style={styles.splitCardHeader}>
              <View style={[styles.iconBox, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="cash" size={20} color="#d97706" />
              </View>
              <View style={styles.badgeCash}>
                <Text style={styles.badgeCashText}>રોકડ ગલ્લો</Text>
              </View>
            </View>
            <Text style={styles.splitCardLabel}>CASH IN HAND</Text>
            <Text style={[styles.splitCardAmount, { color: netCashInHand >= 0 ? '#047857' : '#991b1b' }]}>
              ₹{netCashInHand.toLocaleString('en-IN')}
            </Text>
            <View style={styles.splitMiniStats}>
              <Text style={styles.miniGreen}>+₹{cashIn.toLocaleString('en-IN')}</Text>
              <Text style={styles.miniDivider}>|</Text>
              <Text style={styles.miniRed}>-₹{cashOut.toLocaleString('en-IN')}</Text>
            </View>
          </View>

          {/* Online UPI Card */}
          <View style={[styles.splitCard, { borderTopColor: '#2563eb' }]}>
            <View style={styles.splitCardHeader}>
              <View style={[styles.iconBox, { backgroundColor: '#dbeafe' }]}>
                <Ionicons name="qr-code" size={20} color="#2563eb" />
              </View>
              <View style={styles.badgeOnline}>
                <Text style={styles.badgeOnlineText}>ઓનલાઇન UPI</Text>
              </View>
            </View>
            <Text style={styles.splitCardLabel}>ONLINE / BANK</Text>
            <Text style={[styles.splitCardAmount, { color: netOnlineBank >= 0 ? '#2563eb' : '#991b1b' }]}>
              ₹{netOnlineBank.toLocaleString('en-IN')}
            </Text>
            <View style={styles.splitMiniStats}>
              <Text style={styles.miniGreen}>+₹{onlineIn.toLocaleString('en-IN')}</Text>
              <Text style={styles.miniDivider}>|</Text>
              <Text style={styles.miniRed}>-₹{onlineOut.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </View>

        {/* Combined Grand Total Banner */}
        <View style={styles.grandBanner}>
          <View>
            <Text style={styles.grandLabel}>TOTAL NET BALANCE (કુલ બચત/આવક)</Text>
            <Text style={[styles.grandAmount, { color: grandTotal >= 0 ? '#047857' : '#991b1b' }]}>
              ₹{grandTotal.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.grandBreakdownCol}>
            <Text style={styles.grandSubText}>Total In: +₹{totalIn.toLocaleString('en-IN')}</Text>
            <Text style={styles.grandSubTextRed}>Total Out: -₹{totalOut.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {/* Quick Action Buttons: Cash In / Cash Out */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#059669' }]}
            onPress={() => {
              setEntryType('in');
              setShowModal(true);
            }}>
            <Ionicons name="arrow-down-circle" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>+ આવક (Cash / UPI In)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#991b1b' }]}
            onPress={() => {
              setEntryType('out');
              setShowModal(true);
            }}>
            <Ionicons name="arrow-up-circle" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>- જાવક (Cash / UPI Out)</Text>
          </TouchableOpacity>
        </View>

        {/* Mode Filter Pills */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionHeaderTitle}>આજના વ્યવહાર (Today's Entries)</Text>
          <View style={styles.pillsRow}>
            <TouchableOpacity
              style={[styles.pill, modeFilter === 'all' && styles.pillActive]}
              onPress={() => setModeFilter('all')}>
              <Text style={[styles.pillText, modeFilter === 'all' && styles.pillTextActive]}>
                બધા ({entries.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.pill, modeFilter === 'cash' && styles.pillActive]}
              onPress={() => setModeFilter('cash')}>
              <Text style={[styles.pillText, modeFilter === 'cash' && styles.pillTextActive]}>
                💵 રોકડ (Cash)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.pill, modeFilter === 'online' && styles.pillActive]}
              onPress={() => setModeFilter('online')}>
              <Text style={[styles.pillText, modeFilter === 'online' && styles.pillTextActive]}>
                📱 ઓનલાઇન (UPI / Bank)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Transactions Feed */}
        <View style={styles.entriesList}>
          {filteredEntries.map((item) => {
            const isIn = item.type === 'in';
            const isCash = item.mode === 'cash';

            return (
              <View key={item.id} style={styles.entryCard}>
                <View
                  style={[
                    styles.entryIconBox,
                    { backgroundColor: isIn ? '#dcfce7' : '#fee2e2' },
                  ]}>
                  <Ionicons
                    name={isIn ? 'arrow-down' : 'arrow-up'}
                    size={18}
                    color={isIn ? '#059669' : '#991b1b'}
                  />
                </View>

                <View style={styles.entryDetails}>
                  <Text style={styles.entryDesc}>{item.description}</Text>
                  <View style={styles.entryMetaRow}>
                    {/* Payment Mode Tag: Cash vs Online */}
                    <View
                      style={[
                        styles.modeBadge,
                        isCash ? styles.modeBadgeCash : styles.modeBadgeOnline,
                      ]}>
                      <Ionicons
                        name={isCash ? 'cash-outline' : 'qr-code-outline'}
                        size={11}
                        color={isCash ? '#92400e' : '#1e40af'}
                      />
                      <Text
                        style={[
                          styles.modeBadgeText,
                          isCash ? styles.modeBadgeTextCash : styles.modeBadgeTextOnline,
                        ]}>
                        {isCash ? 'રોકડ (Cash)' : 'ઓનલાઇન (UPI)'}
                      </Text>
                    </View>
                    <Text style={styles.entryTime}>• {item.time}</Text>
                  </View>
                </View>

                <Text
                  style={[
                    styles.entryAmount,
                    { color: isIn ? '#059669' : '#991b1b' },
                  ]}>
                  {isIn ? '+' : '-'} ₹{item.amount.toLocaleString('en-IN')}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Modal: Add Entry (With Cash or Online Selector) */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {entryType === 'in' ? 'આવક નોંધણી (+ In)' : 'જાવક નોંધણી (- Out)'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  Choose whether transaction was in Cash or Online UPI
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#78350f" />
              </TouchableOpacity>
            </View>

            {/* Selector 1: Transaction Type (In vs Out) */}
            <Text style={styles.inputLabel}>પ્રકાર (Transaction Direction)</Text>
            <View style={styles.typeSelectorRow}>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  entryType === 'in' && styles.typeBtnInActive,
                ]}
                onPress={() => setEntryType('in')}>
                <Ionicons
                  name="arrow-down-circle"
                  size={18}
                  color={entryType === 'in' ? '#059669' : '#64748b'}
                />
                <Text
                  style={[
                    styles.typeBtnText,
                    entryType === 'in' && styles.typeBtnTextInActive,
                  ]}>
                  આવક (+ In)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  entryType === 'out' && styles.typeBtnOutActive,
                ]}
                onPress={() => setEntryType('out')}>
                <Ionicons
                  name="arrow-up-circle"
                  size={18}
                  color={entryType === 'out' ? '#991b1b' : '#64748b'}
                />
                <Text
                  style={[
                    styles.typeBtnText,
                    entryType === 'out' && styles.typeBtnTextOutActive,
                  ]}>
                  જાવક (- Out)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Selector 2: Mode of Payment (Cash vs Online UPI) */}
            <Text style={styles.inputLabel}>ચૂકવણી મોડ (Payment Mode) *</Text>
            <View style={styles.modeSelectorRow}>
              {/* Cash Option */}
              <TouchableOpacity
                style={[
                  styles.modeOptionBtn,
                  entryMode === 'cash' && styles.modeOptionBtnCashActive,
                ]}
                onPress={() => setEntryMode('cash')}>
                <View style={[styles.modeIconCircle, { backgroundColor: '#fef3c7' }]}>
                  <Ionicons name="cash" size={20} color="#d97706" />
                </View>
                <View>
                  <Text
                    style={[
                      styles.modeOptionTitle,
                      entryMode === 'cash' && styles.modeOptionTitleCashActive,
                    ]}>
                    💵 રોકડ (Cash)
                  </Text>
                  <Text style={styles.modeOptionSub}>ગલ્લામાં રોકડા આવ્યા/ગયા</Text>
                </View>
              </TouchableOpacity>

              {/* Online Option */}
              <TouchableOpacity
                style={[
                  styles.modeOptionBtn,
                  entryMode === 'online' && styles.modeOptionBtnOnlineActive,
                ]}
                onPress={() => setEntryMode('online')}>
                <View style={[styles.modeIconCircle, { backgroundColor: '#dbeafe' }]}>
                  <Ionicons name="qr-code" size={20} color="#2563eb" />
                </View>
                <View>
                  <Text
                    style={[
                      styles.modeOptionTitle,
                      entryMode === 'online' && styles.modeOptionTitleOnlineActive,
                    ]}>
                    📱 ઓનલાઇન (UPI / QR)
                  </Text>
                  <Text style={styles.modeOptionSub}>GPay, PhonePe, Paytm, બેંક</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Amount */}
            <Text style={styles.inputLabel}>રકમ (Amount ₹) *</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="₹ 0"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              autoFocus
            />

            {/* Description */}
            <Text style={styles.inputLabel}>વિગત (Description / Note)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Counter sale, Milk payment, Customer GPay"
              value={description}
              onChangeText={setDescription}
            />

            <TouchableOpacity
              style={[
                styles.submitBtn,
                { backgroundColor: entryType === 'in' ? '#059669' : '#991b1b' },
              ]}
              onPress={handleAddEntry}>
              <Text style={styles.submitBtnText}>
                {entryType === 'in'
                  ? `સેવ કરો: +₹${amount || '0'} આવક (${entryMode === 'cash' ? 'રોકડ' : 'ઓનલાઇન'})`
                  : `સેવ કરો: -₹${amount || '0'} જાવક (${entryMode === 'cash' ? 'રોકડ' : 'ઓનલાઇન'})`}
              </Text>
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
    backgroundColor: '#fffdf8', // Warm parchment tone
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 90,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#7f1d1d',
  },
  headerBadge: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  headerBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400e',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#78350f',
    marginTop: 2,
    fontWeight: '600',
  },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
    gap: 4,
  },
  reportBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#78350f',
  },
  dualCardRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  splitCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#fef3c7',
    borderTopWidth: 4,
    shadowColor: '#78350f',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  splitCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeCash: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeCashText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#92400e',
  },
  badgeOnline: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeOnlineText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1e40af',
  },
  splitCardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.4,
  },
  splitCardAmount: {
    fontSize: 20,
    fontWeight: '900',
    marginVertical: 4,
  },
  splitMiniStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  miniGreen: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  miniDivider: {
    fontSize: 10,
    color: '#cbd5e1',
  },
  miniRed: {
    fontSize: 10,
    fontWeight: '700',
    color: '#991b1b',
  },
  grandBanner: {
    backgroundColor: '#fffbf0',
    borderWidth: 1.5,
    borderColor: '#fde68a',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  grandLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#78350f',
    letterSpacing: 0.3,
  },
  grandAmount: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 2,
  },
  grandBreakdownCol: {
    alignItems: 'flex-end',
  },
  grandSubText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  grandSubTextRed: {
    fontSize: 11,
    fontWeight: '700',
    color: '#991b1b',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
  filterSection: {
    marginBottom: 10,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#7f1d1d',
    marginBottom: 8,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  pillActive: {
    backgroundColor: '#991b1b',
    borderColor: '#991b1b',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#78350f',
  },
  pillTextActive: {
    color: '#ffffff',
  },
  entriesList: {
    gap: 8,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fef3c7',
    shadowColor: '#78350f',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  entryIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  entryDetails: {
    flex: 1,
  },
  entryDesc: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  entryMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  modeBadgeCash: {
    backgroundColor: '#fef3c7',
  },
  modeBadgeOnline: {
    backgroundColor: '#dbeafe',
  },
  modeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  modeBadgeTextCash: {
    color: '#92400e',
  },
  modeBadgeTextOnline: {
    color: '#1e40af',
  },
  entryTime: {
    fontSize: 11,
    color: '#64748b',
  },
  entryAmount: {
    fontSize: 16,
    fontWeight: '900',
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
    maxHeight: '92%',
    borderTopWidth: 3,
    borderTopColor: '#f59e0b',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#7f1d1d',
  },
  modalSubtitle: {
    fontSize: 11,
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
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#fde68a',
    backgroundColor: '#fffbf0',
    gap: 6,
  },
  typeBtnInActive: {
    borderColor: '#059669',
    backgroundColor: '#d1fae5',
  },
  typeBtnOutActive: {
    borderColor: '#991b1b',
    backgroundColor: '#fee2e2',
  },
  typeBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748b',
  },
  typeBtnTextInActive: {
    color: '#065f46',
  },
  typeBtnTextOutActive: {
    color: '#991b1b',
  },
  modeSelectorRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modeOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#fde68a',
    backgroundColor: '#ffffff',
    gap: 8,
  },
  modeOptionBtnCashActive: {
    borderColor: '#d97706',
    backgroundColor: '#fffbeb',
  },
  modeOptionBtnOnlineActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  modeIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeOptionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  modeOptionTitleCashActive: {
    color: '#92400e',
  },
  modeOptionTitleOnlineActive: {
    color: '#1e40af',
  },
  modeOptionSub: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 1,
  },
  amountInput: {
    borderWidth: 1.5,
    borderColor: '#fde68a',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 52,
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    backgroundColor: '#ffffff',
    color: '#7f1d1d',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#fde68a',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    backgroundColor: '#ffffff',
    color: '#0f172a',
  },
  submitBtn: {
    marginTop: 18,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
