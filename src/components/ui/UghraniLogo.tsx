import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export default function UghraniLogo({ size = 'md', showSubtitle = true }: LogoProps) {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  const imgSize = isSm ? 40 : isLg ? 80 : 54;

  return (
    <View style={styles.container}>
      {/* Handmade Bahi-Khata Logo Emblem */}
      <View style={[styles.imageWrapper, { width: imgSize, height: imgSize }]}>
        <Image
          source={require('@/assets/images/ughrani-logo.png')}
          style={[styles.logoImage, { width: imgSize, height: imgSize }]}
          resizeMode="contain"
        />
      </View>

      {/* Brand Typography */}
      <View style={styles.textColumn}>
        <View style={styles.brandRow}>
          <Text
            style={[
              styles.brandName,
              isSm ? styles.fontSm : isLg ? styles.fontLg : styles.fontMd,
            ]}>
            Ughrani
          </Text>
          <View style={styles.gujaratiStamp}>
            <Text style={styles.gujaratiStampText}>ઉઘરાણી</Text>
          </View>
        </View>

        {showSubtitle && (
          <Text style={styles.brandTagline}>
            લાલ ચોપડો • Cloud Ledger & Udhar
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  imageWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#991b1b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: '#f59e0b',
  },
  logoImage: {
    borderRadius: 10,
  },
  textColumn: {
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandName: {
    fontWeight: '900',
    color: '#7f1d1d',
    letterSpacing: -0.5,
  },
  fontSm: { fontSize: 18 },
  fontMd: { fontSize: 24 },
  fontLg: { fontSize: 30 },
  gujaratiStamp: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#d97706',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    transform: [{ rotate: '-2deg' }],
  },
  gujaratiStampText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400e',
  },
  brandTagline: {
    fontSize: 11,
    fontWeight: '700',
    color: '#b45309',
    marginTop: 2,
    letterSpacing: 0.2,
  },
});
