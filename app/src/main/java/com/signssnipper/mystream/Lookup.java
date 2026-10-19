package com.signssnipper.mystream;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

/**
 * HyperionApp's own live lookup by username (the same request the site's profile page makes):
 * 200 with data = live, 404 = not live. Only the answer is used, never the stream.
 *
 * The request runs from inside a page of the site (a hidden WebView on www.tango.me), the same
 * way the Windows app does it, so the site sees the same session the page would use. A plain
 * HTTP request from the app was refused with 401/403.
 */
final class Lookup {
    private Lookup() {}

    /** Last HTTP status from the lookup (401 = the site refused the session). */
    static volatile int lastStatus = 0;

    static final String UA = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36";

    private static final Handler MAIN = new Handler(Looper.getMainLooper());
    private static WebView web;          // lives on the main thread
    private static volatile boolean pageReady;
    private static final Object LOCK = new Object();

    /** @return TRUE live, FALSE not live, null when the site gave no clear answer. */
    static Boolean isLive(Context ctx, String user) {
        if (!user.matches("[\\w.\\-]{1,64}")) return null;
        try {
            String answer = run(ctx, user);
            if (answer == null) return null;
            if (answer.equals("404")) { lastStatus = 404; return Boolean.FALSE; }
            if (answer.startsWith("200")) {
                lastStatus = 200;
                return answer.endsWith("L") ? Boolean.TRUE : null;
            }
            try { lastStatus = Integer.parseInt(answer); } catch (NumberFormatException e) { lastStatus = 0; }
            return null;
        } catch (Exception e) {
            return null;
        }
    }

    /** Runs the lookup script inside the site's page and waits for its answer (max 25 s). */
    private static String run(Context ctx, String user) throws InterruptedException {
        final CountDownLatch done = new CountDownLatch(1);
        final String[] out = {null};
        final String js = "(async()=>{try{const r=await fetch('https://gateway.tango.me/stream-details-provider/public/byAlias?alias="
                + user + "',{credentials:'include',cache:'no-store'});"
                + "if(r.status!==200)return String(r.status);"
                + "const b=new Uint8Array(await r.arrayBuffer());let s='';for(const x of b)s+=String.fromCharCode(x);"
                + "return '200'+(/\\n\\x16[A-Za-z0-9_-]{22}/.test(s)?'L':'N');}catch(e){return 'err';}})()";
        final Context app = ctx.getApplicationContext();
        MAIN.post(() -> {
            synchronized (LOCK) {
                if (web == null) {
                    web = new WebView(app);
                    web.getSettings().setJavaScriptEnabled(true);
                    web.getSettings().setDomStorageEnabled(true);
                    web.getSettings().setUserAgentString(UA);
                    web.setWebViewClient(new WebViewClient() {
                        @Override public void onPageFinished(WebView v, String url) { pageReady = true; }
                    });
                    pageReady = false;
                    web.loadUrl("https://www.tango.me/");
                }
            }
            evaluateWhenReady(js, out, done, System.currentTimeMillis());
        });
        done.await(25, TimeUnit.SECONDS);
        return out[0] == null ? null : out[0].replace("\"", "");
    }

    /** Waits for the page to finish loading, then evaluates the lookup. */
    private static void evaluateWhenReady(String js, String[] out, CountDownLatch done, long started) {
        if (!pageReady) {
            if (System.currentTimeMillis() - started > 20000) { done.countDown(); return; }
            MAIN.postDelayed(() -> evaluateWhenReady(js, out, done, started), 300);
            return;
        }
        web.evaluateJavascript(js, value -> {
            out[0] = value;
            done.countDown();
        });
    }
}
