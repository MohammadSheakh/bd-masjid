package org.bdmasjid.autosilent

import android.app.AlarmManager
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class AndroidAutoSilentModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "AndroidAutoSilentManager"

    @ReactMethod
    fun checkDndPermission(promise: Promise) {
        val notificationManager =
            reactApplicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        promise.resolve(notificationManager.isNotificationPolicyAccessGranted)
    }

    @ReactMethod
    fun requestDndPermission() {
        val intent = Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        reactApplicationContext.startActivity(intent)
    }

    @ReactMethod
    fun getCurrentRingerMode(promise: Promise) {
        val audioManager =
            reactApplicationContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager
        val mode = when (audioManager.ringerMode) {
            AudioManager.RINGER_MODE_SILENT -> "SILENT"
            AudioManager.RINGER_MODE_VIBRATE -> "VIBRATE"
            else -> "NORMAL"
        }
        promise.resolve(mode)
    }

    @ReactMethod
    fun schedulePrayerSilence(
        prayerName: String,
        triggerEpochMs: Double,
        durationMinutes: Int,
        promise: Promise
    ) {
        val context = reactApplicationContext
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

        val intent = Intent(context, PrayerSilentReceiver::class.java).apply {
            putExtra("PRAYER_NAME", prayerName)
            putExtra("DURATION_MINUTES", durationMinutes)
        }

        val pendingIntent = PendingIntent.getBroadcast(
            context,
            prayerName.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val triggerTime = triggerEpochMs.toLong()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent)
        } else {
            alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent)
        }

        promise.resolve(true)
    }
}

/**
 * BroadcastReceiver triggered at Jammat time to silence device
 */
class PrayerSilentReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
        val notificationManager =
            context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val prefs = context.getSharedPreferences("BDMasjidAutoSilent", Context.MODE_PRIVATE)

        // Capture and persist current ringer mode before muting
        val initialMode = audioManager.ringerMode
        prefs.edit().putInt("PREV_RINGER_MODE", initialMode).apply()

        // Activate Silent / DND mode if granted
        if (notificationManager.isNotificationPolicyAccessGranted) {
            notificationManager.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_NONE)
            audioManager.ringerMode = AudioManager.RINGER_MODE_SILENT
        }

        // Schedule restore alarm
        val duration = intent.getIntExtra("DURATION_MINUTES", 10)
        val prayerName = intent.getStringExtra("PRAYER_NAME") ?: "PRAYER"
        val restoreTime = System.currentTimeMillis() + (duration * 60 * 1000L)

        val restoreIntent = Intent(context, PrayerRestoreReceiver::class.java)
        val pendingRestore = PendingIntent.getBroadcast(
            context,
            prayerName.hashCode() + 1000,
            restoreIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, restoreTime, pendingRestore)
    }
}

/**
 * BroadcastReceiver triggered upon Jammat duration expiry to restore prior state
 */
class PrayerRestoreReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
        val notificationManager =
            context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val prefs = context.getSharedPreferences("BDMasjidAutoSilent", Context.MODE_PRIVATE)

        val prevMode = prefs.getInt("PREV_RINGER_MODE", AudioManager.RINGER_MODE_NORMAL)

        // State Preservation Invariant:
        // If phone was ALREADY in Silent or Vibrate mode prior to prayer, NEVER force to Normal!
        if (notificationManager.isNotificationPolicyAccessGranted) {
            notificationManager.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_ALL)
        }

        audioManager.ringerMode = prevMode
    }
}
