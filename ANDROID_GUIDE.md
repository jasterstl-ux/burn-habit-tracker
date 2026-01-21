# 🔥 Burn - Android Porting Guide

Your Burn habit tracker is a Progressive Web App (PWA) and can be converted to a native Android app through multiple methods.

## Option 1: Simple PWA Install (Easiest - No Coding Required)

Your app already works as a PWA! Users can:

1. Open the app in Chrome
2. Click the install button that appears
3. App installs directly to home screen
4. Works offline and feels like a native app

**Pros**: Zero development effort, automatic updates
**Cons**: Limited to Android 5.0+, not in Play Store

---

## Option 2: Capacitor (Recommended - Best Balance)

Convert your PWA to a native Android app with Capacitor by Ionic.

### Step 1: Install Dependencies

```bash
npm install -g @capacitor/cli
npm init -y
npm install @capacitor/core @capacitor/cli
npx cap init burn com.burn.habittracker
```

### Step 2: Add Android Platform

```bash
npm install @capacitor/android
npx cap add android
```

### Step 3: Copy Web Files

```bash
# Copy all your HTML/CSS/JS files to www folder
mkdir www
# Copy: index.html, script.js, style.css, manifest.json, sw.js to www/
```

### Step 4: Build for Android

```bash
npx cap build android
```

This generates an Android Studio project ready to deploy to Play Store!

### Step 5: Customize Android App (Optional)

Open `android/app/src/main/AndroidManifest.xml` to add:

- App icon
- Permissions (notifications, camera if needed)
- App theme

**Pros**: True native app, Play Store distribution, offline-first
**Cons**: Need Node.js and Android SDK

---

## Option 3: Apache Cordova (Alternative)

Similar to Capacitor, older but more established.

```bash
npm install -g cordova
cordova create burn com.burn.habittracker Burn
cd burn
cordova platform add android
# Copy www files
cordova build android
```

---

## Option 4: React Native (If You Rewrite)

If you want to rewrite in React Native for maximum native performance:

```bash
npx react-native init BurnApp
# Rewrite your app logic in React Native
# Compile to Android
```

**Pros**: Best performance, full native features
**Cons**: Significant rewrite required

---

## Option 5: Flutter (Modern Alternative)

If starting fresh with a high-performance app:

```bash
flutter create burn
# Rewrite in Dart + Flutter
flutter build apk
```

---

## Quick Start: Capacitor Setup (Recommended)

### Full Step-by-Step for Your App:

1. **Install Node.js** from nodejs.org if you haven't

2. **In your habit-tracker folder:**

```bash
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/android
```

3. **Initialize Capacitor:**

```bash
npx cap init burn com.jaste.burn
```

4. **Create www folder and copy files:**

```bash
mkdir www
# Copy index.html, script.js, style.css, manifest.json, sw.js to www/
```

5. **Add Android:**

```bash
npx cap add android
```

6. **Build APK:**

```bash
npx cap build android
```

7. **Open in Android Studio:**

```bash
cd android
# Open in Android Studio to run emulator or build release APK
```

---

## Adding Android-Specific Features

Once you have the native app, you can add:

### Push Notifications

```javascript
import { PushNotifications } from "@capacitor/push-notifications";

async function setupNotifications() {
  const permStatus = await PushNotifications.requestPermissions();
  if (permStatus.receive === "granted") {
    await PushNotifications.register();
  }
}
```

### Device Storage Optimization

```javascript
import { Storage } from "@capacitor/storage";

// Already using localStorage, but can use native storage for more space
```

### Habit Reminders at Specific Times

```javascript
import { LocalNotifications } from "@capacitor/local-notifications";

async function scheduleReminder(habitName, time) {
  await LocalNotifications.schedule({
    notifications: [
      {
        title: "Time for your habit!",
        body: habitName,
        id: 1,
        schedule: { on: { hour: parseInt(time.split(":")[0]) } },
      },
    ],
  });
}
```

---

## Signing & Publishing to Play Store

### 1. Generate Keystore (One-time)

```bash
keytool -genkey -v -keystore ~/my-release-key.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias
```

### 2. Build Release APK

In Android Studio:

- Build > Generate Signed Bundle/APK
- Select your keystore
- Choose release build type

### 3. Upload to Play Store

- Create Google Play Developer account ($25 one-time)
- Go to Play Console
- Create new app
- Upload your signed APK
- Fill in store listing (description, screenshots, etc.)
- Submit for review (24-48 hours)

---

## Cool Features to Add for Android

### 1. Widget on Home Screen

Show quick habit status right on Android homescreen
Requires: `@capacitor/local-notifications`

### 2. Share Achievements

Let users share their streak on social media

```javascript
import { Share } from "@capacitor/share";

await Share.share({
  title: "My Burn Streaks!",
  text: "🔥 I have a 30-day streak on Meditation!",
  dialogTitle: "Share your achievement",
});
```

### 3. Backup to Cloud

Auto-sync habits to cloud storage
Requires: Firebase or similar backend

### 4. Wearable Integration

Show habit reminders on Android Wear smartwatch

### 5. Health App Integration

Connect with Google Fit for fitness habits

---

## Estimated Time & Difficulty

| Method       | Time    | Difficulty | Result               |
| ------------ | ------- | ---------- | -------------------- |
| PWA Install  | 0 min   | Easy       | Mobile web app       |
| Capacitor    | 30 min  | Easy       | Play Store app       |
| Cordova      | 45 min  | Medium     | Play Store app       |
| React Native | 4-8 hrs | Hard       | High-performance app |
| Flutter      | 4-8 hrs | Hard       | Very performant app  |

---

## My Recommendation

**Start with Capacitor** because:
✅ Your PWA works perfectly as-is
✅ 30 minute setup
✅ Publishes to Play Store
✅ Can add native features later
✅ Smaller app size
✅ Automatic web updates still possible

---

## Questions?

For Capacitor docs: https://capacitorjs.com/docs
For building APKs: https://developer.android.com/studio
For Play Store: https://play.google.com/console

---

## Your App is Already Perfect for Mobile!

- ✅ Responsive design
- ✅ Offline-first with Service Worker
- ✅ Fast load times
- ✅ Touch-optimized
- ✅ Dark/Light mode
- ✅ PWA manifest configured

You're ready to go native whenever you want! 🚀
