package com.signssnipper.mystream;

import android.content.Context;
import android.content.SharedPreferences;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import org.json.JSONObject;

/** Alerts settings and the last known status of each broadcaster. */
final class Prefs {
    private Prefs() {}

    static final int[] MINUTES = {1, 2, 5, 10, 15};

    static SharedPreferences sp(Context c) {
        return c.getSharedPreferences("alerts", Context.MODE_PRIVATE);
    }

    static List<String> users(Context c) {
        return parse(sp(c).getString("users", ""));
    }

    static List<String> parse(String text) {
        LinkedHashSet<String> out = new LinkedHashSet<>();
        for (String raw : text.split("[\\s,;]+")) {
            String u = raw.trim().replaceFirst("^@", "")
                    .replaceFirst("^https?://(www\\.)?tango\\.me/", "")
                    .replaceFirst("/.*$", "");
            if (u.matches("[\\w.\\-]{1,64}")) out.add(u);
        }
        return new ArrayList<>(out);
    }

    static int minutes(Context c) { return sp(c).getInt("minutes", 2); }
    static boolean hideNames(Context c) { return sp(c).getBoolean("hideNames", true); }
    static boolean running(Context c) { return sp(c).getBoolean("running", false); }

    static String label(Context c, String user) {
        List<String> u = users(c);
        return hideNames(c) ? "Broadcaster " + (u.indexOf(user) + 1) : "@" + user;
    }

    /** user -> {"live": 1|0, "t": millis} */
    static JSONObject status(Context c) {
        try { return new JSONObject(sp(c).getString("status", "{}")); } catch (Exception e) { return new JSONObject(); }
    }

    static void saveStatus(Context c, JSONObject s) {
        sp(c).edit().putString("status", s.toString()).apply();
    }
}
