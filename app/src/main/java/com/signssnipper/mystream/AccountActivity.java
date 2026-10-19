package com.signssnipper.mystream;

import android.app.Activity;
import android.app.AlertDialog;
import android.graphics.Color;
import android.os.Bundle;
import android.view.Gravity;
import android.webkit.CookieManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

/**
 * Tango's own website, so you can sign in or out yourself. The sign-in cookie is
 * shared with the grid and the alerts. The app never sees your password.
 */
public class AccountActivity extends Activity {
    private WebView web;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.parseColor("#0c1018"));

        LinearLayout bar = new LinearLayout(this);
        bar.setOrientation(LinearLayout.HORIZONTAL);
        bar.setGravity(Gravity.CENTER_VERTICAL);
        int p = Util.dp(this, 10);
        bar.setPadding(p, p, p, p);
        bar.setBackgroundColor(Color.parseColor("#131a26"));
        TextView title = new TextView(this);
        title.setText("Tango account");
        title.setTextColor(Color.parseColor("#e3e8f2"));
        title.setTextSize(16);
        bar.addView(title, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1));
        Button done = new Button(this);
        done.setText("Done");
        done.setOnClickListener(v -> finishAndReturn());
        bar.addView(done);
        root.addView(bar);

        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setSupportMultipleWindows(false); // sign-in pop-ups open in this same view
        s.setUserAgentString(Util.browserUserAgent(s.getUserAgentString()));
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(web, true);
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                // Google blocks its sign-in inside apps ("This browser or app may not be
                // secure"). Stop before Google's error page and explain what works instead.
                String host = req.getUrl().getHost();
                if (host != null && (host.equals("accounts.google.com") || host.endsWith(".accounts.google.com"))) {
                    showGoogleNotice();
                    return true;
                }
                return false;
            }
        });
        root.addView(web, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1));
        setContentView(root);
        web.loadUrl("https://www.tango.me/");
    }

    private long noticeAt = 0;

    private void showGoogleNotice() {
        if (System.currentTimeMillis() - noticeAt < 3000) return;
        noticeAt = System.currentTimeMillis();
        new AlertDialog.Builder(this)
                .setTitle("Use Email or Phone sign-in")
                .setMessage("Google blocks its sign-in inside apps like this one, so please choose \"Continue with Email\" or \"Continue with Phone\" instead.\n\n"
                        + "If your Tango account was created with Google only, add an email address or phone number to it first in the Tango app (in its account settings, if it offers that), then sign in here with that.")
                .setPositiveButton("OK", null)
                .show();
    }

    private void finishAndReturn() {
        CookieManager.getInstance().flush();
        setResult(RESULT_OK);
        finish();
    }

    @SuppressWarnings("deprecation")
    @Override
    public void onBackPressed() {
        if (web != null && web.canGoBack()) web.goBack();
        else finishAndReturn();
    }

    @Override
    protected void onDestroy() {
        if (web != null) web.destroy();
        super.onDestroy();
    }
}
