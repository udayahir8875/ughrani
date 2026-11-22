import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface CashEntry {
  id: string;
  type: 'in' | 'out';
  amount: number;
  description: string;
  time: string;
}

const INITIAL_ENTRIES: CashEntry[] = [
  { id: '1', type: 'in', amount: 1450, description: 'Ramesh Patel (Jama)', time: '11:30 AM' },
  { id: '2', type: 'in', amount: 500, description: 'Counter Cash Sale', time: '12:15 PM' },
  { id: '3', type: 'out', amount: 350, description: 'Milk Delivery Payment', time: '01:00 PM' },
  { id: '4', type: 'in', amount: 800, description: 'Jayeshbhai payment', time: '02:40 PM' },
  { id: '5', type: 'out', amount: 120, description: 'Shop Tea & Snacks', time: '04:10 PM' },
];

export default function CashbookScreen() {
  const [entries, setEntries] = useState<CashEntry[]>(INITIAL_ENTRIES);
  const [showModal, setShowModal] = useState(false);
  const [entryType, setEntryType] = useState<'in' | 'out'>('in');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const totalCashIn = entries
    .filter((e) => e.type === 'in')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalCashOut = entries
    .filter((e) => e.type === 'out')
    .reduce((sum, e) => sum + e.amount, 0);

  const netBalance = totalCashIn - totalCashOut;

  const handleAddEntry = () => {
    const amtNum = parseFloat(amount);
    if (isNaN(amtNum) || amtNum <= 0) return;

    const newEntry: CashEntry = {
      id: Date.now().toString(),
      type: entryType,
      amount: amtNum,
      description: description.trim() || (entryType === 'in' ? 'Cash In' : 'Cash Out'),
      time: 'Just now',
    };

    setEntries([newEntry, ...entries]);
    setAmount('');
    setDescription('');
    setShowModal(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Daily Cashbook 💵</Text>
          <Text style={styles.headerSubtitle}>Today's Cash In & Cash Out</Text>
        </View>
        <TouchableOpacity
          style={styles.reportBtn}
          onPress={() => alert('PDF statement generated and ready to share.')}>
          <Ionicons name="document-text-outline" size={16} color="#0f172a" />
          <Text style={styles.reportBtnText}>Reports</Text>
        </TouchableOpacity>
      </View>

      {/* Net Summary */}
      <View style={styles.netCard}>
        <View style={styles.netRow}>
          <View>
            <Text style={styles.netLabel}>NET CASH IN HAND</Text>
            <Text style={[styles.netAmount, { color: netBalance >= 0 ? '#16a34a' : '#dc2626' }]}>
              ₹{netBalance.toLocaleString('en-IN')}
            </Text>
          </View>
          <Ionicons
            name={netBalance >= 0 ? 'wallet-outline' : 'warning-outline'}
            size={36}
            color={netBalance >= 0 ? '#16a34a' : '#dc2626'}
          />
        </View>

        <View style={styles.breakdownRow}>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Total Cash In (+)</Text>
            <Text style={[styles.breakdownValue, { color: '#16a34a' }]}>
              ₹{totalCashIn.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Total Cash Out (-)</Text>
            <Text style={[styles.breakdownValue, { color: '#dc2626' }]}>
              ₹{totalCashOut.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons: Cash In / Cash Out */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#16a34a' }]}
          onPress={() => {
            setEntryType('in');
            setShowModal(true);
          }}>
          <Ionicons name="arrow-down-circle" size={20} color="#fff" />
          <Text style={styles.actionBtnText}>+ Cash In (આવક)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#dc2626' }]}
          onPress={() => {
            setEntryType('out');
            setShowModal(true);
          }}>
          <Ionicons name="arrow-up-circle" size={20} color="#fff" />
          <Text style={styles.actionBtnText}>- Cash Out (જાવક)</Text>
        </TouchableOpacity>
      </View>

      {/* Transactions List */}
      <View style={styles.listHeader}>
        <Text style={styles.listSectionTitle}>Today's Entries ({entries.length})</Text>
      </View>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isIn = item.type === 'in';
          return (
            <View style={styles.entryCard}>
              <View
                style={[
                  styles.entryIconBox,
                  { backgroundColor: isIn ? '#dcfce7' : '#fee2e2' },
                ]}>
                <Ionicons
                  name={isIn ? 'arrow-down' : 'arrow-up'}
                  size={18}
                  color={isIn ? '#16a34a' : '#dc2626'}
                />
              </View>

              <View style={styles.entryDetails}>
                <Text style={styles.entryDesc}>{item.description}</Text>
                <Text style={styles.entryTime}>{item.time}</Text>
              </View>

              <Text
                style={[
                  styles.entryAmount,
                  { color: isIn ? '#16a34a' : '#dc2626' },
                ]}>
                {isIn ? '+' : '-'} ₹{item.amount.toLocaleString('en-IN')}
              </Text>
            </View>
          );
        }}
      />

      {/* Modal: Add Cash In/Out */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {entryType === 'in' ? 'Record Cash In (+)' : 'Record Cash Out (-)'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Amount (₹) *</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="₹ 0"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              autoFocus
            />

            <Text style={styles.inputLabel}>Remark / Description</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Counter sale, Vendor payment"
              value={description}
              onChangeText={setDescription}
            />

            <TouchableOpacity
              style={[
                styles.submitBtn,
                { backgroundColor: entryType === 'in' ? '#16a34a' : '#dc2626' },
              ]}
              onPress={handleAddEntry}>
              <Text style={styles.submitBtnText}>
                {entryType === 'in' ? 'Save Cash In' : 'Save Cash Out'}
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    gap: 4,
  },
  reportBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  netCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  netRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  netLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  netAmount: {
    fontSize: 26,
    fontWeight: '800',
    marginTop: 4,
  },
  breakdownRow: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  breakdownItem: {
    flex: 1,
  },
  divider: {
    width: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 12,
  },
  breakdownLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  breakdownValue: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
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
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  actionBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 8,
  },
  listSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
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
    fontWeight: '600',
    color: '#0f172a',
  },
  entryTime: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  entryAmount: {
    fontSize: 15,
    fontWeight: '700',
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
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 50,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    backgroundColor: '#f8fafc',
    color: '#0f172a',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    backgroundColor: '#f8fafc',
    color: '#0f172a',
  },
  submitBtn: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
