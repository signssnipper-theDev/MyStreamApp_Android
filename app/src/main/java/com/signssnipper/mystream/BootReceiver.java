package com.signssnipper.mystream;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Turns alerts back on after the phone restarts, if they were on before. */
public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction()) && Prefs.running(context)) {
            try { AlertService.start(context); } catch (Exception ignored) {}
        }
    }
}
