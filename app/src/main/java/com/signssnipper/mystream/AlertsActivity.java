package com.signssnipper.mystream;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
import android.provider.Settings;
import android.text.InputType;
import android.view.Gravity;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.Spinner;
import android.widget.TextView;
import java.text.DateFormat;
import java.util.Date;
import java.util.List;
import org.json.JSONObject;

/** Alerts settings and status: your list, how often to check, and who is live. */
public class AlertsActivity extends Activity {
    static final int BG = Color.parseColor("#0c1018"), PANEL = Color.parseColor("#131a26"), INK = Color.parseColor("#e3e8f2"),
            MUTED = Color.parseColor("#8d98ad"), ACCENT = Color.parseColor("#4f7dff"), ACCENT2 = Color.parseColor("#7aa2ff"),
            LIVE = Color.parseColor("#ff4d6a"), LINE = Color.parseColor("#2a3549");

    private EditText users;
    private Spinner minutes;
    private CheckBox hideNames;
    private Button toggle;
    private TextView statusView, summary;

    private final BroadcastReceiver updates = new BroadcastReceiver() {
        @Override
        public void onReceive(Context c, Intent i) { renderStatus(); }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        int p = Util.dp(this, 16);
        ScrollView scroll = new ScrollView(this);
        scroll.setBackgroundColor(BG);
        LinearLayout col = new LinearLayout(this);
        col.setOrientation(LinearLayout.VERTICAL);
        col.setPadding(p, p, p, p);
        scroll.addView(col);

        LinearLayout head = new LinearLayout(this);
        head.setGravity(Gravity.CENTER_VERTICAL);
        TextView title = text("MyStream Alerts", 20, INK);
        title.setTypeface(title.getTypeface(), android.graphics.Typeface.BOLD);
        head.addView(title, new LinearLayout.LayoutParams(0, -2, 1));
        summary = text("", 13, MUTED);
        head.addView(summary);
        col.addView(head);

        LinearLayout list = section(col, "BROADCASTERS TO WATCH FOR");
        users = new EditText(this);
        users.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_MULTI_LINE | InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS);
        users.setMinLines(3);
        users.setGravity(Gravity.TOP);
        users.setTextColor(INK);
        users.setHintTextColor(MUTED);
        users.setHint("username1, username2, @username3");
        users.setText(Prefs.sp(this).getString("users", ""));
        users.setBackground(box(BG, LINE));
        users.setPadding(p / 2, p / 2, p / 2, p / 2);
        list.addView(users);
        list.addView(text("Separate with commas, spaces or new lines. You get one alert each time someone goes from offline to live.", 12, MUTED));

        LinearLayout opts = section(col, "ALERTS");
        LinearLayout row = new LinearLayout(this);
        row.setGravity(Gravity.CENTER_VERTICAL);
        row.addView(text("Check every  ", 14, INK));
        minutes = new Spinner(this);
        String[] labels = new String[Prefs.MINUTES.length];
        int sel = 1;
        for (int i = 0; i < Prefs.MINUTES.length; i++) {
            labels[i] = Prefs.MINUTES[i] + (Prefs.MINUTES[i] == 1 ? " minute" : " minutes");
            if (Prefs.MINUTES[i] == Prefs.minutes(this)) sel = i;
        }
        minutes.setAdapter(new ArrayAdapter<>(this, android.R.layout.simple_spinner_dropdown_item, labels));
        minutes.setSelection(sel);
        row.addView(minutes);
        opts.addView(row);
        hideNames = new CheckBox(this);
        hideNames.setText("Hide names in alerts");
        hideNames.setTextColor(INK);
        hideNames.setButtonTintList(ColorStateList.valueOf(ACCENT));
        hideNames.setChecked(Prefs.hideNames(this));
        opts.addView(hideNames);

        toggle = button("", true);
        toggle.setOnClickListener(v -> onToggle());
        opts.addView(toggle);
        Button grid = button("Open the grid", false);
        grid.setOnClickListener(v -> startActivity(new Intent(this, GridActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)));
        opts.addView(grid);
        Button battery = button("Let alerts run in the background", false);
        battery.setOnClickListener(v -> askBattery());
        opts.addView(battery);
        opts.addView(text("Android may delay checks to save battery. Allowing background use keeps alerts on time.", 12, MUTED));

        LinearLayout st = section(col, "STATUS");
        statusView = text("", 14, INK);
        st.addView(statusView);

        setContentView(scroll);
        if (Build.VERSION.SDK_INT >= 33) requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"}, 1);
        renderStatus();
    }

    private void onToggle() {
        boolean on = Prefs.running(this);
        if (on) {
            Prefs.sp(this).edit().putBoolean("running", false).apply();
            AlertService.stop(this);
        } else {
            List<String> list = Prefs.parse(users.getText().toString());
            Prefs.sp(this).edit()
                    .putString("users", String.join(", ", list))
                    .putInt("minutes", Prefs.MINUTES[minutes.getSelectedItemPosition()])
                    .putBoolean("hideNames", hideNames.isChecked())
                    .putBoolean("running", !list.isEmpty())
                    .apply();
            users.setText(String.join(", ", list));
            JSONObject s = Prefs.status(this), keep = new JSONObject();
            for (String u : list) if (s.has(u)) try { keep.put(u, s.get(u)); } catch (Exception ignored) {}
            Prefs.saveStatus(this, keep);
            if (!list.isEmpty()) AlertService.start(this);
        }
        renderStatus();
    }

    private void renderStatus() {
        boolean on = Prefs.running(this);
        toggle.setText(on ? "Stop alerts" : "Save and start alerts");
        List<String> list = Prefs.users(this);
        JSONObject s = Prefs.status(this);
        StringBuilder sb = new StringBuilder();
        int live = 0;
        DateFormat tf = DateFormat.getTimeInstance(DateFormat.SHORT);
        for (String u : list) {
            JSONObject o = s.optJSONObject(u);
            int l = o == null ? -1 : o.optInt("live", -1);
            if (l == 1) live++;
            sb.append(l == 1 ? "●  " : "○  ").append(Prefs.label(this, u)).append("   ")
              .append(l == 1 ? "Live" : l == 0 ? "Offline" : "Not checked yet");
            if (o != null && o.has("t")) sb.append("  ·  ").append(tf.format(new Date(o.optLong("t"))));
            sb.append('\n');
        }
        if (list.isEmpty()) sb.append("No broadcasters yet. Add some above and tap Save and start alerts.");
        statusView.setText(sb.toString().trim());
        summary.setText(on ? live + " of " + list.size() + " live" : "Off");
    }

    private void askBattery() {
        PowerManager pm = getSystemService(PowerManager.class);
        if (pm != null && pm.isIgnoringBatteryOptimizations(getPackageName())) {
            startActivity(new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS));
            return;
        }
        try {
            startActivity(new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.parse("package:" + getPackageName())));
        } catch (Exception e) {
            startActivity(new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS));
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        IntentFilter f = new IntentFilter(AlertService.ACTION_UPDATE);
        if (Build.VERSION.SDK_INT >= 33) registerReceiver(updates, f, Context.RECEIVER_NOT_EXPORTED);
        else registerReceiver(updates, f);
        renderStatus();
    }

    @Override
    protected void onPause() {
        try { unregisterReceiver(updates); } catch (Exception ignored) {}
        super.onPause();
    }

    // ---------- small view helpers ----------
    private TextView text(String s, int sp, int color) {
        TextView t = new TextView(this);
        t.setText(s);
        t.setTextSize(sp);
        t.setTextColor(color);
        t.setPadding(0, Util.dp(this, 4), 0, Util.dp(this, 4));
        return t;
    }

    private LinearLayout section(LinearLayout parent, String heading) {
        LinearLayout s = new LinearLayout(this);
        s.setOrientation(LinearLayout.VERTICAL);
        int p = Util.dp(this, 14);
        s.setPadding(p, p, p, p);
        s.setBackground(box(PANEL, LINE));
        TextView h = text(heading, 11, ACCENT2);
        h.setLetterSpacing(0.14f);
        s.addView(h);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-1, -2);
        lp.topMargin = Util.dp(this, 14);
        parent.addView(s, lp);
        return s;
    }

    private Button button(String label, boolean primary) {
        Button b = new Button(this);
        b.setText(label);
        b.setAllCaps(false);
        b.setTextColor(primary ? Color.WHITE : INK);
        b.setBackground(box(primary ? ACCENT : Color.parseColor("#172031"), primary ? ACCENT : LINE));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-1, -2);
        lp.topMargin = Util.dp(this, 8);
        b.setLayoutParams(lp);
        return b;
    }

    private GradientDrawable box(int fill, int stroke) {
        GradientDrawable g = new GradientDrawable();
        g.setColor(fill);
        g.setCornerRadius(Util.dp(this, 12));
        g.setStroke(Util.dp(this, 1), stroke);
        return g;
    }
}
