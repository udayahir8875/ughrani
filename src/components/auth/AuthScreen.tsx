import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';

export default function AuthScreen() {
  const { signIn, signUp, loginAsDemo, isConfigured } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');

  const handleAuth = async () => {
    setErrorMessage('');
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter email and password.');
      return;
    }

    if (mode === 'register' && !shopName.trim()) {
      setErrorMessage('Please enter your shop or business name.');
      return;
    }

    setLoading(true);
    if (mode === 'login') {
      const { error } = await signIn(email.trim(), password);
      if (error) setErrorMessage(error);
    } else {
      const { error } = await signUp({
        email: email.trim(),
        password,
        shopName: shopName.trim(),
        ownerName: ownerName.trim() || 'Owner',
        phone: phone.trim(),
      });
      if (error) setErrorMessage(error);
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Header Brand */}
          <View style={styles.brandHeader}>
            <View style={styles.logoBadge}>
              <Ionicons name="book" size={32} color="#2563eb" />
            </View>
            <View style={styles.titleRow}>
              <Text style={styles.brandTitle}>Ughrani</Text>
              <Text style={styles.brandSubBadge}>ઉઘરાણી</Text>
            </View>
            <Text style={styles.brandTagline}>
              Secure Cloud Ledger for Shopkeepers & Small Businesses
            </Text>
          </View>

          {/* Mode Switcher */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, mode === 'login' && styles.tabButtonActive]}
              onPress={() => {
                setMode('login');
                setErrorMessage('');
              }}>
              <Text
                style={[
                  styles.tabButtonText,
                  mode === 'login' && styles.tabButtonTextActive,
                ]}>
                Shop Login
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, mode === 'register' && styles.tabButtonActive]}
              onPress={() => {
                setMode('register');
                setErrorMessage('');
              }}>
              <Text
                style={[
                  styles.tabButtonText,
                  mode === 'register' && styles.tabButtonTextActive,
                ]}>
                Register Shop
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error Message */}
          {errorMessage.length > 0 && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color="#dc2626" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Form Card */}
          <View style={styles.card}>
            {mode === 'register' && (
              <>
                <Text style={styles.inputLabel}>Shop / Business Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Shree Ganesha Kirana Store"
                  placeholderTextColor="#94a3b8"
                  value={shopName}
                  onChangeText={setShopName}
                />

                <Text style={styles.inputLabel}>Owner Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Ramesh Patel"
                  placeholderTextColor="#94a3b8"
                  value={ownerName}
                  onChangeText={setOwnerName}
                />

                <Text style={styles.inputLabel}>Mobile Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10-digit mobile number"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </>
            )}

            <Text style={styles.inputLabel}>Email Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="shop@example.com"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.inputLabel}>Password *</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleAuth}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {mode === 'login' ? 'Login to My Shop' : 'Create Shop & Start Khata'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Instant Demo Button */}
            <TouchableOpacity
              style={styles.demoBtn}
              onPress={loginAsDemo}>
              <Ionicons name="sparkles" size={16} color="#475569" />
              <Text style={styles.demoBtnText}>Try Demo Account (Instant Access)</Text>
            </TouchableOpacity>
          </View>

          {/* Security & Multi-Device Trust Features */}
          <View style={styles.trustContainer}>
            <View style={styles.trustItem}>
              <Ionicons name="shield-checkmark" size={20} color="#16a34a" />
              <View style={styles.trustTextCol}>
                <Text style={styles.trustTitle}>100% Disaster Proof Backup</Text>
                <Text style={styles.trustDesc}>
                  Lost or broken phone? Login on any device to restore all customer balances instantly.
                </Text>
              </View>
            </View>

            <View style={styles.trustItem}>
              <Ionicons name="sync-circle" size={20} color="#2563eb" />
              <View style={styles.trustTextCol}>
                <Text style={styles.trustTitle}>Multi-Device Sync</Text>
                <Text style={styles.trustDesc}>
                  Works seamlessly across Android, iPhone, tablet, and PC browser simultaneously.
                </Text>
              </View>
            </View>

            <View style={styles.trustItem}>
              <Ionicons name="lock-closed" size={20} color="#7c3aed" />
              <View style={styles.trustTextCol}>
                <Text style={styles.trustTitle}>Bank-Grade Data Privacy</Text>
                <Text style={styles.trustDesc}>
                  PostgreSQL Row-Level Security ensures only you have access to your shop's accounts.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
  },
  brandSubBadge: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563eb',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  brandTagline: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  tabButtonTextActive: {
    color: '#0f172a',
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    gap: 8,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: '#0f172a',
  },
  submitBtn: {
    backgroundColor: '#2563eb',
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
  demoBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  demoBtnText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
  },
  trustContainer: {
    marginTop: 28,
    gap: 16,
  },
  trustItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 12,
    alignItems: 'flex-start',
  },
  trustTextCol: {
    flex: 1,
  },
  trustTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  trustDesc: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 17,
  },
});
