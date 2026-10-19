package com.signssnipper.mystream;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/**
 * The stream grid. Loads a tango.me page and injects the same grid script the
 * Windows app uses (assets/grid.js), so every cell is a same-origin Tango frame.
 */
public class GridActivity extends Activity {
    static final String START = "https://www.tango.me/robots.txt";
    static final String EXTRA_OPEN = "mgv_open";

    // Lets the grid's dock open the account and alerts screens. On a phone the
    // dock starts shrunk to one "Controls" button to leave room for the streams.
    static final String SHIM =
            "window.mgvApp={openAccount:function(){MgvAndroid.openAccount()},openAlerts:function(){MgvAndroid.openAlerts()},resetSession:function(s){MgvAndroid.resetSession(s|0)},log:function(){}};"
            + "try{if(localStorage.getItem('sp_dock_small')===null)localStorage.setItem('sp_dock_small','1')}catch(e){}\n";

    private WebView web;
    private String gridJs;
    // A broadcaster handed over by a go-live notification, added once the grid runs.
    private final java.util.ArrayList<String> pendingOpen = new java.util.ArrayList<>();
    private boolean gridReady = false;
    // Space the grid's controls keep clear of: the notch/camera cutout, the system bars
    // when shown, and the gesture bar. In CSS pixels (left, top, right, bottom).
    private final int[] safe = new int[4];

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        // Use the whole screen, including beside a notch in landscape; the grid keeps its
        // controls out of the cutout using the sizes passed in below.
        if (Build.VERSION.SDK_INT >= 28) {
            WindowManager.LayoutParams lp = getWindow().getAttributes();
            lp.layoutInDisplayCutoutMode = Build.VERSION.SDK_INT >= 30
                    ? WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS
                    : WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            getWindow().setAttributes(lp);
        }
        gridJs = Util.asset(this, "grid.js");
        takeOpen(getIntent());

        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#0c1018"));
        setContentView(web);
        web.setOnApplyWindowInsetsListener((v, insets) -> { readSafeArea(insets); pushSafeArea(); return insets; });
        hideSystemBars();

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setUserAgentString(Util.browserUserAgent(s.getUserAgentString()));

        CookieManager cm = CookieManager.getInstance();
        cm.setAcceptCookie(true);
        cm.setAcceptThirdPartyCookies(web, true);

        web.addJavascriptInterface(new Bridge(), "MgvAndroid");
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                gridReady = false;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                if (url != null && url.startsWith(START)) { pushSafeArea(); view.evaluateJavascript(SHIM + gridJs, v -> { gridReady = true; deliverOpen(); }); }
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                // Keep the main view on the grid page; frames navigate freely.
                if (!req.isForMainFrame()) return false;
                return !req.getUrl().toString().startsWith(START);
            }
        });
        web.loadUrl(START);
    }

    @SuppressWarnings("deprecation")
    private void readSafeArea(WindowInsets in) {
        float d = getResources().getDisplayMetrics().density;
        int l, t, r, b;
        if (Build.VERSION.SDK_INT >= 30) {
            android.graphics.Insets c = in.getInsets(WindowInsets.Type.displayCutout() | WindowInsets.Type.systemBars());
            android.graphics.Insets g = in.getInsets(WindowInsets.Type.mandatorySystemGestures());
            l = c.left; t = c.top; r = c.right; b = Math.max(c.bottom, g.bottom);
        } else {
            l = in.getSystemWindowInsetLeft(); t = in.getSystemWindowInsetTop(); r = in.getSystemWindowInsetRight(); b = in.getSystemWindowInsetBottom();
            if (Build.VERSION.SDK_INT >= 28 && in.getDisplayCutout() != null) {
                android.view.DisplayCutout dc = in.getDisplayCutout();
                l = Math.max(l, dc.getSafeInsetLeft()); t = Math.max(t, dc.getSafeInsetTop());
                r = Math.max(r, dc.getSafeInsetRight()); b = Math.max(b, dc.getSafeInsetBottom());
            }
        }
        safe[0] = Math.round(l / d); safe[1] = Math.round(t / d); safe[2] = Math.round(r / d); safe[3] = Math.round(b / d);
    }

    private void pushSafeArea() {
        if (web == null) return;
        web.evaluateJavascript("(function(){var s=document.documentElement.style;"
                + "s.setProperty('--mgv-il','" + safe[0] + "px');s.setProperty('--mgv-it','" + safe[1] + "px');"
                + "s.setProperty('--mgv-ir','" + safe[2] + "px');s.setProperty('--mgv-ib','" + safe[3] + "px');"
                + "window.dispatchEvent(new Event('resize'))})()", null);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        takeOpen(intent);
        deliverOpen();
    }

    private void takeOpen(Intent i) {
        String u = i == null ? null : i.getStringExtra(EXTRA_OPEN);
        if (u != null && u.matches("[\\w.\\-]{1,64}")) pendingOpen.add(u);
        if (i != null) i.removeExtra(EXTRA_OPEN);
    }

    private void deliverOpen() {
        if (!gridReady || web == null) return;
        while (!pendingOpen.isEmpty()) {
            String u = pendingOpen.remove(0);
            web.evaluateJavascript("window.__spAddUser&&window.__spAddUser(" + org.json.JSONObject.quote(u) + ")", null);
        }
    }

    /** Removes any sign-in left from an earlier version; the app runs as a visitor. */
    static void dropSignInCookies() {
        CookieManager cm = CookieManager.getInstance();
        String[] names = {"tt", "ttu", "tte", "Tango-SD"};
        String[] hosts = {"https://gateway.tango.me", "https://www.tango.me", "https://tango.me"};
        for (String h : hosts) for (String n : names) {
            cm.setCookie(h, n + "=; Max-Age=0; Path=/");
            cm.setCookie(h, n + "=; Max-Age=0; Path=/; Domain=.tango.me");
        }
        cm.flush();
    }

    static final int REQ_ACCOUNT = 1;

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        // Back from the Tango account screen: reload so every cell uses the new sign-in.
        if (requestCode == REQ_ACCOUNT && web != null) web.reload();
    }

    class Bridge {
        @JavascriptInterface
        public void openAccount() {
            runOnUiThread(() -> startActivityForResult(new Intent(GridActivity.this, AccountActivity.class), REQ_ACCOUNT));
        }

        @JavascriptInterface
        public void openAlerts() {
            runOnUiThread(() -> startActivity(new Intent(GridActivity.this, AlertsActivity.class)));
        }

        /**
         * The live lookup keeps answering "not authorized" (an expired sign-in the site
         * couldn't renew). Stage 1 removes the sign-in cookies; stage 2 every cookie, so
         * the site starts a fresh visitor session. Then reload the grid.
         */
        @JavascriptInterface
        public void resetSession(int stage) {
            runOnUiThread(() -> {
                CookieManager cm = CookieManager.getInstance();
                if (stage >= 2) {
                    cm.removeAllCookies(ok -> { cm.flush(); if (web != null) web.reload(); });
                } else {
                    dropSignInCookies();
                    if (web != null) web.reload();
                }
            });
        }
    }


    @Override
    protected void onResume() {
        super.onResume();
        if (web != null) web.onResume();
        hideSystemBars();
    }

    @Override
    protected void onPause() {
        if (web != null) web.onPause();
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        if (web != null) web.destroy();
        super.onDestroy();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemBars();
    }

    @SuppressWarnings("deprecation")
    private void hideSystemBars() {
        if (Build.VERSION.SDK_INT >= 30) {
            WindowInsetsController c = getWindow().getInsetsController();
            if (c != null) {
                c.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                c.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            getWindow().getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);
        }
    }
}
