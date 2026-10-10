# ADR-041: Mobile EAS Production Build Pipeline and App Bundle Optimization

## Status
Accepted

## Date
2026-10-10

## Context
Preparing the BD Masjid mobile application for production distribution across the Google Play Store (Android) and Apple App Store / TestFlight (iOS) requires automated, reproducible build definitions via Expo Application Services (EAS).

In low-bandwidth markets such as Bangladesh, user acquisition and update retention heavily correlate with the download size of the application. Furthermore, release stability across diverse low-end hardware ($\le 3$ GB RAM) demands:
1. **Compact Download Footprint ($< 18$ MB)**: Enforcing Hermes AOT bytecode compilation, dead code elimination, and R8/ProGuard resource shrinking.
2. **Three-Tiered Release Profiles**:
   - `development`: Builds with Expo Dev Client for internal debugging and native module testing.
   - `preview`: Generates direct-install APKs for rapid internal QA and field testing without Play Store approval latency.
   - `production`: Generates optimized, release-signed Android App Bundles (`.aab`) and iOS App Store archives (`.ipa`).
3. **Enterprise Compliance & Permissions**: Explicit configuration of Android permissions (`SCHEDULE_EXACT_ALARM`, `ACCESS_NOTIFICATION_POLICY`, `RECEIVE_BOOT_COMPLETED`, location) and iOS usage descriptions conforming to Play Store and App Store privacy guidelines.

## Decision

1. **EAS Configuration Specification (`eas.json`)**:
   - Define three distinct build environments:
     - `development`: `developmentClient: true`, `distribution: "internal"`.
     - `preview`: `android: { buildType: "apk" }`, `distribution: "internal"`.
     - `production`: `android: { buildType: "app-bundle" }`, `ios: { simulator: false }`, `autoIncrement: true`.
   - Configure channel-based deployment (`production`, `preview`, `development`).

2. **Metadata & Manifest Hardening (`app.json`)**:
   - Package name: `org.bdmasjid.app`.
   - Bundle identifier: `org.bdmasjid.app`.
   - Display name: `BD Masjid` (Bengali localized support: `বিডি মসজিদ`).
   - Deep linking scheme: `bdmasjid://`.
   - Target SDK: Android SDK 35 (Android 15 ready).
   - Permission declarations:
     - `android.permission.SCHEDULE_EXACT_ALARM`
     - `android.permission.USE_EXACT_ALARM`
     - `android.permission.ACCESS_NOTIFICATION_POLICY`
     - `android.permission.RECEIVE_BOOT_COMPLETED`
     - `android.permission.VIBRATE`
     - `android.permission.ACCESS_COARSE_LOCATION`
     - `android.permission.ACCESS_FINE_LOCATION`
   - Privacy descriptions:
     - `NSLocationWhenInUseUsageDescription`: *"BD Masjid uses your location to discover nearby mosques and calculate walking distances."*

3. **Bundle Size & Engine Governance**:
   - Enforce Hermes JavaScript Engine for both Android and iOS (precompiled bytecode at build time, eliminating runtime JIT memory footprint and reducing cold launch time below 1.2s).

## Consequences

### Positive
- **Guaranteed Download Efficiency**: Optimized `.aab` delivers dynamic splits, keeping the download size under 15 MB on target devices.
- **Reproducible Cloud Builds**: EAS Build builds identical binaries on clean macOS and Linux runner instances without local machine variance.
- **Streamlined QA**: Preview APKs can be distributed directly to field testers and mosque volunteers across Bangladesh.

### Trade-offs
- Production builds require valid Google Play Service Account keys and Apple Developer Program credentials configured in EAS secrets.
