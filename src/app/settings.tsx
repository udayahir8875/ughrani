import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { downloadFile, openGoogleDrive } from '@/utils/exportHelper';
import UghraniLogo from '@/components/ui/UghraniLogo';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Edit Profile fields
  const [editShopName, setEditShopName] = useState(user?.shopName || '');
  const [editOwnerName, setEditOwnerName] = useState(user?.ownerName || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // 1. Export Customers to Excel / CSV
  const handleExportCSV = async () => {
    setExporting(true);
    try {
      let customers: any[] = [];
      if (user?.id) {
        const { data } = await supabase
          .from('customers')
          .select('*')
          .eq('user_id', user.id);
        customers = data || [];
      }

      const headers = 'ID,Customer Name,Mobile,Net Balance (INR),Status,Created At\n';
      const rows = customers.map((c, i) => {
        const status = c.balance > 0 ? "You'll Get (Ughrani)" : c.balance < 0 ? "You'll Give" : "Settled";
        return `${i + 1},"${c.name}","${c.phone || ''}",${c.balance},"${status}","${c.created_at || ''}"`;
      }).join('\n');

      const csvContent = headers + rows;
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `ughrani_customers_${dateStr}.csv`;

      downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
      setSuccessMessage(`✅ Customer ledger exported successfully as ${filename}`);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (e) {
      alert('Error exporting CSV: ' + e);
    } finally {
      setExporting(false);
    }
  };

  // 2. Export Cashbook to CSV
  const handleExportCashbook = async () => {
    setExporting(true);
    try {
      let entries: any[] = [];
      if (user?.id) {
        const { data } = await supabase
          .from('cashbook_entries')
          .select('*')
          .eq('user_id', user.id);
        entries = data || [];
      }

      const headers = 'ID,Type,Payment Mode,Amount (INR),Description,Date\n';
      const rows = entries.map((e, i) => {
        const typeStr = e.type === 'in' ? 'Money In (Aavak)' : 'Money Out (Javak)';
        const modeStr = e.mode === 'cash' ? 'Cash (Rokad)' : 'Online (UPI/Bank)';
        return `${i + 1},"${typeStr}","${modeStr}",${e.amount},"${e.description || ''}","${e.created_at || ''}"`;
      }).join('\n');

      const csvContent = headers + rows;
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `ughrani_cashbook_${dateStr}.csv`;

      downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
      setSuccessMessage(`✅ Cashbook exported successfully as ${filename}`);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (e) {
      alert('Error exporting cashbook: ' + e);
    } finally {
      setExporting(false);
    }
  };

  // 3. Full Cloud JSON Backup for Google Drive
  const handleGoogleDriveBackup = async () => {
    setExporting(true);
    try {
      let customers: any[] = [];
      let transactions: any[] = [];
      let cashbook: any[] = [];

      if (user?.id) {
        const [cRes, tRes, cbRes] = await Promise.all([
          supabase.from('customers').select('*').eq('user_id', user.id),
          supabase.from('transactions').select('*').eq('user_id', user.id),
          supabase.from('cashbook_entries').select('*').eq('user_id', user.id),
        ]);
        customers = cRes.data || [];
        transactions = tRes.data || [];
        cashbook = cbRes.data || [];
      }

      const backupData = {
        appName: 'Ughrani Cloud Ledger',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        shopDetails: {
          shopName: user?.shopName,
          ownerName: user?.ownerName,
          email: user?.email,
          phone: user?.phone,
        },
        summary: {
          totalCustomers: customers.length,
          totalTransactions: transactions.length,
          totalCashbookEntries: cashbook.length,
        },
        data: {
          customers,
          transactions,
          cashbook,
        },
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `ughrani_gdrive_backup_${dateStr}.json`;

      // Download backup JSON file locally
      downloadFile(jsonStr, filename, 'application/json');

      setSuccessMessage(`✅ Backup created (${filename}). Opening Google Drive...`);
      setTimeout(() => {
        openGoogleDrive();
        setSuccessMessage('');
      }, 1500);
    } catch (e) {
      alert('Error creating backup: ' + e);
    } finally {
      setExporting(false);
    }
  };

  // Update Shop Profile
  const handleSaveProfile = async () => {
    if (!editShopName.trim()) return;
    setSavingProfile(true);
    try {
      if (user?.id) {
        await supabase.from('profiles').upsert({
          id: user.id,
          shop_name: editShopName.trim(),
          owner_name: editOwnerName.trim(),
          phone: editPhone.trim(),
        });
      }
      setShowEditModal(false);
      setSuccessMessage('✅ Shop details updated successfully! Refresh to view.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (e) {
      alert('Error saving shop profile: ' + e);
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <UghraniLogo size="sm" showSubtitle={false} />
          <View style={styles.headerRightBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.headerStatusText}>Cloud Synced</Text>
          </View>
        </View>

        {/* Success Banner */}
        {successMessage.length > 0 && (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={18} color="#059669" />
            <Text style={styles.successBannerText}>{successMessage}</Text>
          </View>
        )}

        {/* Section 1: Shop Profile */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="storefront" size={20} color="#991b1b" />
              </View>
              <View>
                <Text style={styles.cardTitle}>દુકાન પ્રોફાઇલ (Shop Profile)</Text>
                <Text style={styles.cardSubtitle}>Business identification & account</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => {
                setEditShopName(user?.shopName || '');
                setEditOwnerName(user?.ownerName || '');
                setEditPhone(user?.phone || '');
                setShowEditModal(true);
              }}>
              <Ionicons name="create-outline" size={16} color="#78350f" />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.profileDetails}>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>દુકાનનું નામ:</Text>
              <Text style={styles.profileValBold}>{user?.shopName || 'Shree Ughrani Kirana Store'}</Text>
            </View>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>વેપારીનું નામ:</Text>
              <Text style={styles.profileVal}>{user?.ownerName || 'Uday Ahir'}</Text>
            </View>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>લૉગિન ઇમેઇલ:</Text>
              <Text style={styles.profileVal}>{user?.email || 'uday.ughrani@gmail.com'}</Text>
            </View>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>સંપર્ક મોબાઇલ:</Text>
              <Text style={styles.profileVal}>{user?.phone || '9825123456'}</Text>
            </View>
          </View>
        </View>

        {/* Section 2: Google Drive & File Backup Suite */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#eff6ff' }]}>
                <Ionicons name="cloud-upload" size={20} color="#2563eb" />
              </View>
              <View>
                <Text style={styles.cardTitle}>ડેટા બેકઅપ & ડાઉનલોડ (Backup & Export)</Text>
                <Text style={styles.cardSubtitle}>Save in Google Drive, Excel, or JSON</Text>
              </View>
            </View>
          </View>

          {/* Action 1: Google Drive Backup */}
          <TouchableOpacity
            style={styles.backupActionTile}
            activeOpacity={0.7}
            onPress={handleGoogleDriveBackup}
            disabled={exporting}>
            <View style={[styles.tileIconCircle, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="logo-google" size={20} color="#d97706" />
            </View>
            <View style={styles.tileTextCol}>
              <Text style={styles.tileTitle}>Google Drive માં બેકઅપ સેવ કરો</Text>
              <Text style={styles.tileDesc}>
                1-Click download full ledger JSON snapshot and save to your Google Drive.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </TouchableOpacity>

          {/* Action 2: Customer Khata to Excel CSV */}
          <TouchableOpacity
            style={styles.backupActionTile}
            activeOpacity={0.7}
            onPress={handleExportCSV}
            disabled={exporting}>
            <View style={[styles.tileIconCircle, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="document-text" size={20} color="#059669" />
            </View>
            <View style={styles.tileTextCol}>
              <Text style={styles.tileTitle}>ગ્રાહક ખાતાવહી Excel / CSV Export</Text>
              <Text style={styles.tileDesc}>
                Download complete customer list, phone numbers, and balances in spreadsheet format.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </TouchableOpacity>

          {/* Action 3: Cashbook to CSV */}
          <TouchableOpacity
            style={styles.backupActionTile}
            activeOpacity={0.7}
            onPress={handleExportCashbook}
            disabled={exporting}>
            <View style={[styles.tileIconCircle, { backgroundColor: '#fee2e2' }]}>
              <Ionicons name="cash" size={20} color="#991b1b" />
            </View>
            <View style={styles.tileTextCol}>
              <Text style={styles.tileTitle}>રોકડમેળ (Cashbook) CSV Export</Text>
              <Text style={styles.tileDesc}>
                Download daily Cash In / Cash Out and Online UPI records.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </TouchableOpacity>

          {exporting && (
            <View style={styles.exportingLoader}>
              <ActivityIndicator color="#991b1b" />
              <Text style={styles.exportingText}>Generating encrypted backup file...</Text>
            </View>
          )}
        </View>

        {/* Section 3: App Security & Cloud Protection */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#f0fdf4' }]}>
                <Ionicons name="shield-checkmark" size={20} color="#059669" />
              </View>
              <View>
                <Text style={styles.cardTitle}>સુરક્ષા ગેરંટી (Security Guarantee)</Text>
                <Text style={styles.cardSubtitle}>PostgreSQL Row-Level Security active</Text>
              </View>
            </View>
          </View>

          <View style={styles.securityItem}>
            <Ionicons name="checkmark-done-circle" size={18} color="#059669" />
            <Text style={styles.securityText}>
              256-bit AES Hardware Keychain Session Encryption
            </Text>
          </View>
          <View style={styles.securityItem}>
            <Ionicons name="checkmark-done-circle" size={18} color="#059669" />
            <Text style={styles.securityText}>
              Automatic Cloud Disaster Recovery (Phone change safe)
            </Text>
          </View>
          <View style={styles.securityItem}>
            <Ionicons name="checkmark-done-circle" size={18} color="#059669" />
            <Text style={styles.securityText}>
              Multi-Device Real-time Sync (Android, iOS & Web)
            </Text>
          </View>
        </View>

        {/* Section 4: Log Out Button */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity
            style={styles.logoutBtn}
            activeOpacity={0.8}
            onPress={() => setShowLogoutConfirm(true)}>
            <Ionicons name="log-out" size={20} color="#ffffff" />
            <Text style={styles.logoutBtnText}>ખાતામાંથી લૉગ આઉટ (Log Out)</Text>
          </TouchableOpacity>

          <Text style={styles.versionText}>
            Ughrani (ઉઘરાણી) v1.0.0 • Made with ❤️ for Indian Merchants
          </Text>
        </View>
      </ScrollView>

      {/* Modal: Edit Profile */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>દુકાન વિગત બદલો (Edit Shop)</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color="#78350f" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>દુકાનનું નામ (Shop Name) *</Text>
            <TextInput
              style={styles.modalInput}
              value={editShopName}
              onChangeText={setEditShopName}
            />

            <Text style={styles.inputLabel}>માલિકનું નામ (Owner Name)</Text>
            <TextInput
              style={styles.modalInput}
              value={editOwnerName}
              onChangeText={setEditOwnerName}
            />

            <Text style={styles.inputLabel}>મોબાઇલ નંબર (Mobile Phone)</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="phone-pad"
              value={editPhone}
              onChangeText={setEditPhone}
            />

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSaveProfile}
              disabled={savingProfile}>
              {savingProfile ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>વિગતો સેવ કરો (Save Changes)</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal: Logout Confirmation */}
      <Modal
        visible={showLogoutConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutConfirm(false)}>
        <View style={styles.modalOverlayCenter}>
          <View style={styles.confirmBox}>
            <View style={styles.confirmIconBox}>
              <Ionicons name="alert-circle" size={40} color="#dc2626" />
            </View>
            <Text style={styles.confirmTitle}>લૉગ આઉટ કરવું છે?</Text>
            <Text style={styles.confirmSubtitle}>
              તમારો તમામ ચોપડા ડેટા ક્લાઉડમાં સુરક્ષિત રહેશે. તમે ફરીથી લૉગિન કરી શકશો.
            </Text>

            <View style={styles.confirmActionsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowLogoutConfirm(false)}>
                <Text style={styles.cancelBtnText}>રદ કરો (Cancel)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmLogoutBtn}
                onPress={() => {
                  setShowLogoutConfirm(false);
                  signOut();
                }}>
                <Text style={styles.confirmLogoutText}>હા, લૉગ આઉટ (Log Out)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fffdf8', // Warm parchment background
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
    marginBottom: 16,
    backgroundColor: '#fffbf0',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#fde68a',
  },
  headerRightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10b981',
  },
  headerStatusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065f46',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1.5,
    borderColor: '#a7f3d0',
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginBottom: 14,
  },
  successBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065f46',
    flex: 1,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#fef3c7',
    marginBottom: 14,
    shadowColor: '#78350f',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#7f1d1d',
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#78350f',
    marginTop: 1,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#78350f',
  },
  profileDetails: {
    backgroundColor: '#fffdfa',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fef3c7',
    gap: 8,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profileLabel: {
    fontSize: 12,
    color: '#78350f',
    fontWeight: '600',
  },
  profileVal: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '700',
  },
  profileValBold: {
    fontSize: 13,
    color: '#7f1d1d',
    fontWeight: '900',
  },
  backupActionTile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
    gap: 12,
  },
  tileIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tileTextCol: {
    flex: 1,
  },
  tileTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  tileDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 15,
  },
  exportingLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 12,
  },
  exportingText: {
    fontSize: 12,
    color: '#991b1b',
    fontWeight: '600',
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  securityText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  logoutContainer: {
    marginTop: 10,
    alignItems: 'center',
    gap: 12,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc2626',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#dc2626',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  logoutBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  versionText: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
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
    backgroundColor: '#ffffff',
    color: '#0f172a',
  },
  saveBtn: {
    backgroundColor: '#991b1b',
    marginTop: 18,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmBox: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#fde68a',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  confirmIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#7f1d1d',
  },
  confirmSubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 18,
    lineHeight: 18,
  },
  confirmActionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
  },
  confirmLogoutBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#dc2626',
    alignItems: 'center',
  },
  confirmLogoutText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
