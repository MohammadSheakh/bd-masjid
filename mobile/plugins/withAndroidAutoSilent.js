const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Expo Config Plugin for BD Masjid Android Auto-Silent Engine
 * Injects required DND permissions, exact alarm scheduling, and BroadcastReceivers.
 */
function withAndroidAutoSilent(config) {
  return withAndroidManifest(config, (configProps) => {
    const androidManifest = configProps.modResults;
    const mainApplication = androidManifest.manifest.application[0];

    // Ensure permissions array exists
    if (!androidManifest.manifest['uses-permission']) {
      androidManifest.manifest['uses-permission'] = [];
    }

    const permissions = [
      'android.permission.ACCESS_NOTIFICATION_POLICY',
      'android.permission.SCHEDULE_EXACT_ALARM',
      'android.permission.USE_EXACT_ALARM',
      'android.permission.RECEIVE_BOOT_COMPLETED',
      'android.permission.MODIFY_AUDIO_SETTINGS',
    ];

    permissions.forEach((permName) => {
      const exists = androidManifest.manifest['uses-permission'].some(
        (p) => p.$['android:name'] === permName
      );
      if (!exists) {
        androidManifest.manifest['uses-permission'].push({
          $: { 'android:name': permName },
        });
      }
    });

    // Ensure receivers array exists
    if (!mainApplication.receiver) {
      mainApplication.receiver = [];
    }

    const receivers = [
      {
        name: 'org.bdmasjid.autosilent.PrayerSilentReceiver',
        exported: 'false',
      },
      {
        name: 'org.bdmasjid.autosilent.PrayerRestoreReceiver',
        exported: 'false',
      },
      {
        name: 'org.bdmasjid.autosilent.BootCompletedReceiver',
        exported: 'false',
        intentFilters: [
          {
            action: [{ $: { 'android:name': 'android.intent.action.BOOT_COMPLETED' } }],
          },
        ],
      },
    ];

    receivers.forEach((rec) => {
      const exists = mainApplication.receiver.some(
        (r) => r.$['android:name'] === rec.name
      );
      if (!exists) {
        const recObj = {
          $: {
            'android:name': rec.name,
            'android:exported': rec.exported,
          },
        };
        if (rec.intentFilters) {
          recObj['intent-filter'] = rec.intentFilters;
        }
        mainApplication.receiver.push(recObj);
      }
    });

    return configProps;
  });
}

module.exports = withAndroidAutoSilent;
