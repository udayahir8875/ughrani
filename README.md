# Ughrani (ઉઘરાણી / उघराણી) 📒💼

A lightweight, enterprise-grade cross-platform digital ledger (Khata) app designed for local shopkeepers and retail merchants to track customer dues, credit ("udhar"), payments received ("jama"), and daily cashflow with ease.

Built with **React Native (Expo SDK 58) + React Native Web + TypeScript + Supabase (PostgreSQL)**. Runs simultaneously on **Android, iOS, and Web**.

---

## 🚀 Quick Start

### 1. Run in Web Browser
To launch the responsive web application:
```bash
npm run web
```
This opens the app at `http://localhost:8081` in your browser.

### 2. Run on Mobile (Android / iOS)
1. Install **Expo Go** on your Android or iPhone from Google Play / App Store.
2. Start the Metro bundler:
```bash
npm run start
```
3. Scan the QR code displayed in your terminal using the Expo Go app (on Android) or Camera app (on iOS).

---

## 🛡️ SaaS Architecture: Disaster Recovery & Security

Shopkeepers rely on their ledger for their livelihood. If a phone is dropped, water-damaged, stolen, or reset, **zero data is lost**:

1. **Hardware-Backed Session Security**:
   - On Android and iOS, authentication tokens are encrypted using device-level hardware keychains (`expo-secure-store`).
   - On web, sessions use isolated browser storage.
2. **Multi-Device Instant Sync**:
   - Shopkeepers can log in simultaneously on their phone, tablet, and PC. Any entry made on one device appears instantly on the others.
3. **Database-Level Isolation (Row-Level Security)**:
   - Built on PostgreSQL with Row-Level Security (RLS). Shopkeeper A can never view or modify Shopkeeper B's records, enforced at the database kernel level.
4. **Trigger-Based Balance Calculations**:
   - Customer balances are recalculated via a PostgreSQL database trigger whenever an entry is added, edited, or removed. This prevents any mathematical drift or balance corruption.
5. **Continuous Cloud Backups**:
   - Multi-AZ cloud storage with Point-In-Time Recovery (PITR) ensures records can be restored to any exact minute if anything catastrophic happens.

---

## 🗄️ Setting Up Supabase Cloud (Free Tier)

1. Create a free account at [supabase.com](https://supabase.com).
2. Create a new project named `ughrani`.
3. Go to the **SQL Editor** tab in your Supabase dashboard and run the entire SQL script from [`supabase/schema.sql`](supabase/schema.sql).
4. Go to **Project Settings -> API** and copy:
   - Project URL
   - `anon` `public` API key
5. Create a `.env` file in the root directory (based on `.env.example`):
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```
6. Restart the app. The app will automatically connect to live Supabase cloud storage! (Without `.env`, the app automatically runs in interactive Demo Mode for quick review).

---

## ✨ Implemented Features

- **Shop Registration & Authentication**: Multi-device login with shop name, owner name, email, and password.
- **Net Balance Cards**: Real-time summary of **You'll Get (ઉઘરાણી)** and **You'll Give (લેવાના)**.
- **Customer Directory**: Fast search by customer name or phone number, with filter chips (*All*, *Pending Dues*, *Settled*).
- **Udhar & Jama Entry**: Modal to record credit given (*Udhar*) or payment received (*Jama*).
- **One-Tap WhatsApp Reminders**: Direct WhatsApp button sending polite pre-formatted payment reminders with outstanding balance.
- **Daily Cashbook**: Separate tab for recording daily counter sales, expenses, and net cash-in-hand.
- **Shop Profile & Logout**: View account details, cloud sync status, and device logout.

---

## 📁 Project Structure

```
├── assets/                 # App icons, splash screens, and images
├── src/
│   ├── app/                # Expo Router screens
│   │   ├── _layout.tsx     # Theme, splash, and AuthProvider wrapper
│   │   ├── index.tsx       # Customer Khata / Ughrani home screen
│   │   └── explore.tsx     # Daily Cashbook & Reports screen
│   ├── components/
│   │   ├── auth/           # Login & Shop Registration UI
│   │   └── app-tabs.tsx    # Native & Web bottom tabs
│   ├── context/
│   │   └── AuthContext.tsx # SaaS authentication & session state
│   ├── lib/
│   │   └── supabase.ts     # Supabase client with cross-platform secure store
│   └── types/
│       ├── auth.ts         # User & profile types
│       └── ledger.ts       # Customer & Transaction interfaces
├── supabase/
│   └── schema.sql          # Production PostgreSQL RLS & triggers
├── .env.example            # Environment variables template
├── app.json                # Expo app configuration
└── package.json            # Dependencies & scripts
```

---
Created with ❤️ for local businesses.
