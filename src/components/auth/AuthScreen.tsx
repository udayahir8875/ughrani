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
import UghraniLogo from '@/components/ui/UghraniLogo';

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
          {/* Header Handmade Brand Logo */}
          <View style={styles.brandHeader}>
            <UghraniLogo size="lg" showSubtitle={true} />
            <Text style={styles.brandTagline}>
              વેપારીઓ માટેનો ૧૦૦% સુરક્ષિત ડિજિટલ લાલ ચોપડો
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
                દુકાન લૉગિન (Login)
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
                નવી દુકાન નોંધણી (Register)
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
                <Text style={styles.inputLabel}>દુકાનનું નામ (Shop / Business Name) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. શ્રી ગણેશ કિરાણા સ્ટોર"
                  placeholderTextColor="#a16207"
                  value={shopName}
                  onChangeText={setShopName}
                />

                <Text style={styles.inputLabel}>વેપારીનું નામ (Owner Name)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. રમેશભાઈ પટેલ"
                  placeholderTextColor="#a16207"
                  value={ownerName}
                  onChangeText={setOwnerName}
                />

                <Text style={styles.inputLabel}>મોબાઇલ નંબર (Mobile Number)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10-digit mobile number"
                  placeholderTextColor="#a16207"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </>
            )}

            <Text style={styles.inputLabel}>ઇમેઇલ એડ્રેસ (Email Address) *</Text>
            <TextInput
              style={styles.input}
              placeholder="shop@example.com"
              placeholderTextColor="#a16207"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.inputLabel}>પાસવર્ડ (Password) *</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#a16207"
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
                  {mode === 'login' ? 'ચોપડામાં પ્રવેશ કરો (Login)' : 'નવું ખાતું શરૂ કરો (Register)'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Instant Demo Button */}
            <TouchableOpacity
              style={styles.demoBtn}
              onPress={loginAsDemo}>
              <Ionicons name="sparkles" size={16} color="#78350f" />
              <Text style={styles.demoBtnText}>ડેમો એકાઉન્ટથી જુઓ (Instant Access)</Text>
            </TouchableOpacity>
          </View>

          {/* Security & Trust Features */}
          <View style={styles.trustContainer}>
            <View style={styles.trustItem}>
              <View style={[styles.trustIconCircle, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="shield-checkmark" size={20} color="#059669" />
              </View>
              <View style={styles.trustTextCol}>
                <Text style={styles.trustTitle}>૧૦૦% ગેરંટીડ ક્લાઉડ બેકઅપ</Text>
                <Text style={styles.trustDesc}>
                  ફોન તૂટે કે ખોવાય, કોઈપણ ફોનમાં લૉગિન કરતાં તમામ ઉઘરાણી ડેટા સુરક્ષિત પાછો મળશે.
                </Text>
              </View>
            </View>

            <View style={styles.trustItem}>
              <View style={[styles.trustIconCircle, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="sync-circle" size={20} color="#d97706" />
              </View>
              <View style={styles.trustTextCol}>
                <Text style={styles.trustTitle}>ફોન અને કમ્પ્યુટર બંનેમાં સિંક</Text>
                <Text style={styles.trustDesc}>
                  એક જ સમયે એન્ડ્રોઇડ, આઇફોન અને કોમ્પ્યુટર બ્રાઉઝર પર એકસાથે વાપરો.
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
    backgroundColor: '#fffdf8',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  brandTagline: {
    fontSize: 12,
    fontWeight: '700',
    color: '#854d0e',
    textAlign: 'center',
    marginTop: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
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
    backgroundColor: '#991b1b',
    shadowColor: '#991b1b',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#78350f',
  },
  tabButtonTextActive: {
    color: '#ffffff',
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
    fontWeight: '600',
    flex: 1,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#fde68a',
    shadowColor: '#78350f',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#78350f',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#fffdfa',
    borderWidth: 1.5,
    borderColor: '#fde68a',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: '#0f172a',
  },
  submitBtn: {
    backgroundColor: '#991b1b', // Traditional Bahi-Khata Red
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#991b1b',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  demoBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  demoBtnText: {
    color: '#78350f',
    fontSize: 13,
    fontWeight: '700',
  },
  trustContainer: {
    marginTop: 24,
    gap: 12,
  },
  trustItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
    gap: 12,
    alignItems: 'center',
  },
  trustIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trustTextCol: {
    flex: 1,
  },
  trustTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#78350f',
  },
  trustDesc: {
    fontSize: 11,
    color: '#854d0e',
    marginTop: 2,
    lineHeight: 16,
  },
});
