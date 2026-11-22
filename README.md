# Ughrani (ઉઘરાણી / उघराણી) 📒💼

A lightweight, high-performance cross-platform digital ledger (Khata) app designed for local shopkeepers and retail merchants to track customer dues, credit ("udhar"), payments received ("jama"), and daily cashflow with ease.

Built with **React Native (Expo SDK 58) + React Native Web + TypeScript**. Runs simultaneously on **Android, iOS, and Web**.

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

## ✨ Implemented Features

- **Net Balance Cards**: Real-time summary of **You'll Get (ઉઘરાણી)** and **You'll Give (લેવાના)**.
- **Customer Directory**: Fast search by customer name or phone number, with filters (All / Dues / Settled).
- **Udhar & Jama Entry**: Quick modal to record credit given or payment received.
- **WhatsApp Reminder Integration**: One-click Gujarati/Hindi/English payment reminder sent directly via WhatsApp.
- **Daily Cashbook**: Separate tab for recording daily counter sales, expenses, and cash in hand.
- **TypeScript Data Models**: Defined in `src/types/ledger.ts`.

---

## 📁 Project Structure

```
├── assets/             # App icons, splash screens, and images
├── src/
│   ├── app/            # Expo Router file-based screens
│   │   ├── _layout.tsx # Root theme and navigation provider
│   │   ├── index.tsx   # Customer Khata / Ughrani home screen
│   │   └── explore.tsx # Daily Cashbook & Reports screen
│   ├── components/     # Cross-platform UI components & tab navigation
│   ├── constants/      # App theme & typography
│   └── types/
│       └── ledger.ts   # Core TypeScript interfaces (Customer, Transaction)
├── app.json            # Expo app configuration
└── package.json        # Dependencies & scripts
```

---

## 🗄️ Database Integration (Upcoming)

The schema in `src/types/ledger.ts` is ready to link with:
- **Supabase** (PostgreSQL cloud database with free Auth & row-level security).
- **Expo SQLite** (for local-first, 100% offline mobile usage).

---
Created with ❤️ for local businesses.
