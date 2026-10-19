package com.signssnipper.mystream;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;
import java.text.DateFormat;
import java.util.Date;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import org.json.JSONObject;

/**
 * Runs while alerts are on. Every few minutes it asks Tango's live lookup about each
 * broadcaster and posts a notification when one goes from offline to live.
 * Android requires the small "running" notification for a service like this.
 */
public class AlertService extends Service {
    static final String ACTION_UPDATE = "com.signssnipper.mystream.STATUS";
    static final String CH_RUNNING = "running";
    static final String CH_LIVE = "live";
    static final int ID_RUNNING = 1;

    private ScheduledExecutorService exec;

    static void start(Context c) {
        c.startForegroundService(new Intent(c, AlertService.class));
    }

    static void stop(Context c) {
        c.stopService(new Intent(c, AlertService.class));
    }

    @Override
    public void onCreate() {
        super.onCreate();
        NotificationManager nm = getSystemService(NotificationManager.class);
        nm.createNotificationChannel(new NotificationChannel(CH_RUNNING, "Alerts running", NotificationManager.IMPORTANCE_MIN));
        NotificationChannel live = new NotificationChannel(CH_LIVE, "Go-live alerts", NotificationManager.IMPORTANCE_HIGH);
        live.setDescription("A notification when someone on your list goes live");
        nm.createNotificationChannel(live);
        Notification n = runningNotification("Starting…");
        if (Build.VERSION.SDK_INT >= 34) startForeground(ID_RUNNING, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
        else startForeground(ID_RUNNING, n);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (exec != null) exec.shutdownNow();
        exec = Executors.newSingleThreadScheduledExecutor();
        exec.scheduleWithFixedDelay(this::checkAll, 0, Prefs.minutes(this), TimeUnit.MINUTES);
        return START_STICKY;
    }

    private void checkAll() {
        try {
            List<String> users = Prefs.users(this);
            JSONObject status = Prefs.status(this);
            int live = 0;
            for (String u : users) {
                Boolean r = Lookup.isLive(u);
                JSONObject prev = status.optJSONObject(u);
                int was = prev == null ? -1 : prev.optInt("live", -1);
                if (r != null) {
                    JSONObject now = new JSONObject();
                    now.put("live", r ? 1 : 0);
                    now.put("t", System.currentTimeMillis());
                    status.put(u, now);
                    if (r && was != 1) notifyLive(u, users.indexOf(u));
                    if (r) live++;
                } else if (was == 1) {
                    live++;
                }
            }
            Prefs.saveStatus(this, status);
            String time = DateFormat.getTimeInstance(DateFormat.SHORT).format(new Date());
            String runText = "DIAG " + Lookup.lastDetail + " | WebView " + Lookup.webViewVersion()
                    + " | " + live + " of " + users.size() + " live · " + time;
            getSystemService(NotificationManager.class).notify(ID_RUNNING, runningNotification(runText));
            sendBroadcast(new Intent(ACTION_UPDATE).setPackage(getPackageName()));
        } catch (Exception ignored) {}
    }

    private void notifyLive(String user, int index) {
        int id = 1000 + Math.max(0, index);
        NotificationManager nm = getSystemService(NotificationManager.class);
        nm.notify(id, liveNotification(user, index, null));
        // Add the stream's preview picture when it has loaded (quietly, same notification).
        Thumb.fetch(this, user, pic -> {
            if (pic == null) return;
            try { nm.notify(id, liveNotification(user, index, pic)); } catch (Exception ignored) {}
        });
    }

    private Notification liveNotification(String user, int index, android.graphics.Bitmap pic) {
        Notification.Builder b = new Notification.Builder(this, CH_LIVE)
                .setSmallIcon(R.drawable.ic_stat)
                .setContentTitle("Live now")
                .setContentText(Prefs.label(this, user) + " just went live. Tap to open in MyStream.")
                .setAutoCancel(true)
                .setOnlyAlertOnce(true)
                .setContentIntent(openGrid(user, index));
        if (pic != null) b.setLargeIcon(pic);
        return b.build();
    }

    private Notification runningNotification(String text) {
        return new Notification.Builder(this, CH_RUNNING)
                .setSmallIcon(R.drawable.ic_stat)
                .setContentTitle("MyStream alerts are on")
                .setContentText(text)
                .setOngoing(true)
                .setContentIntent(PendingIntent.getActivity(this, 1,
                        new Intent(this, AlertsActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
                        PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT))
                .build();
    }

    /** Opens the grid with this broadcaster added (to the streams already showing, if it's open). */
    private PendingIntent openGrid(String user, int index) {
        Intent i = new Intent(this, GridActivity.class)
                .putExtra(GridActivity.EXTRA_OPEN, user)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        return PendingIntent.getActivity(this, 1000 + Math.max(0, index), i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    @Override
    public void onDestroy() {
        if (exec != null) exec.shutdownNow();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
