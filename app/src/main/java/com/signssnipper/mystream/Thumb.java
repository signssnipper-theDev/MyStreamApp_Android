package com.signssnipper.mystream;

import android.annotation.SuppressLint;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Handler;
import android.os.Looper;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.function.Consumer;

/**
 * Preview picture for a go-live notification: the same picture Tango shows on its
 * live tiles and while a stream loads. A hidden web view opens the broadcaster's
 * stream the way the grid does, reads that picture's address, and is thrown away.
 * Only the small picture is kept, in memory, for the notification.
 */
final class Thumb {
    private Thumb() {}

    private static final String START = "https://www.tango.me/";
    private static final String FIND =
            "(function(){var i=document.querySelector('[data-testid^=\"stream-ph-\"] img');return i?i.getAttribute('src'):''})()";

    /** Calls done (on a background thread) with the picture, or null after about 30 seconds. */
    static void fetch(Context ctx, String user, Consumer<Bitmap> done) {
        new Handler(Looper.getMainLooper()).post(() -> start(ctx.getApplicationContext(), user, done));
    }

    @SuppressLint("SetJavaScriptEnabled")
    private static void start(Context ctx, String user, Consumer<Bitmap> done) {
        Handler h = new Handler(Looper.getMainLooper());
        WebView web;
        try {
            web = new WebView(ctx);
        } catch (Exception e) {
            new Thread(() -> done.accept(null)).start();
            return;
        }
        final boolean[] finished = {false};
        final long[] navAt = {0};
        Consumer<String> finish = src -> {
            if (finished[0]) return;
            finished[0] = true;
            h.removeCallbacksAndMessages(null);
            try { web.stopLoading(); web.destroy(); } catch (Exception ignored) {}
            new Thread(() -> done.accept(src == null ? null : download(src))).start();
        };

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(true);   // never play sound in the background
        s.setUserAgentString(Util.browserUserAgent(s.getUserAgentString()));
        web.measure(420, 760);
        web.layout(0, 0, 420, 760);

        Runnable[] poll = new Runnable[1];
        poll[0] = () -> {
            if (finished[0]) return;
            web.evaluateJavascript(FIND, v -> {
                String src = v == null ? "" : v.replaceAll("^\"|\"$", "");
                if (src.startsWith("https://cget.tango.me/contentserver/download/")) {
                    int q = src.indexOf('?');
                    finish.accept((q > 0 ? src.substring(0, q) : src) + "?resize=240%3A240");
                } else if (System.currentTimeMillis() - navAt[0] > 15000) {
                    finish.accept(null);
                } else {
                    h.postDelayed(poll[0], 700);
                }
            });
        };
        web.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                if (navAt[0] != 0 || finished[0]) return;
                // Let Tango's app start, then move to the profile in-app, which
                // takes a live broadcaster straight to their stream.
                h.postDelayed(() -> {
                    if (finished[0]) return;
                    String js = "try{history.pushState({},'','/'+" + org.json.JSONObject.quote(user)
                            + ");dispatchEvent(new PopStateEvent('popstate',{state:{}}))}catch(e){}";
                    view.evaluateJavascript(js, null);
                    navAt[0] = System.currentTimeMillis();
                    h.postDelayed(poll[0], 1500);
                }, 3000);
            }
        });
        h.postDelayed(() -> finish.accept(null), 30000);
        web.loadUrl(START);
    }

    private static Bitmap download(String src) {
        HttpURLConnection c = null;
        try {
            c = (HttpURLConnection) new URL(src).openConnection();
            c.setConnectTimeout(15000);
            c.setReadTimeout(15000);
            c.setRequestProperty("User-Agent", Lookup.UA);
            c.setRequestProperty("Referer", "https://www.tango.me/");
            if (c.getResponseCode() != 200) return null;
            try (InputStream in = c.getInputStream()) {
                Bitmap b = BitmapFactory.decodeStream(in);
                if (b == null) return null;
                int max = Math.max(b.getWidth(), b.getHeight());
                if (max > 256) {
                    float k = 256f / max;
                    b = Bitmap.createScaledBitmap(b, Math.round(b.getWidth() * k), Math.round(b.getHeight() * k), true);
                }
                return b;
            }
        } catch (Exception e) {
            return null;
        } finally {
            if (c != null) c.disconnect();
        }
    }
}
