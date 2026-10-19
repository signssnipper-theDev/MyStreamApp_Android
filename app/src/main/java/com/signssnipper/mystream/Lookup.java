package com.signssnipper.mystream;

import android.webkit.CookieManager;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;

/**
 * Tango's own live lookup by username (the same request Tango's profile page makes):
 * 200 with data = live, 404 = not live. Only the answer is used, never the stream.
 * Uses the visitor session the grid's web view keeps (no sign-in).
 */
final class Lookup {
    private Lookup() {}

    /** Last HTTP status from the lookup (401 = the site refused the session). */
    static volatile int lastStatus = 0;

    /** Diagnostics: the last response code and the start of the site's reply. */
    static volatile String lastDetail = "no check yet";

    private static String readSnippet(InputStream in) {
        if (in == null) return "(no body)";
        try (InputStream i = in) {
            byte[] b = new byte[120];
            int n = i.read(b);
            return n <= 0 ? "(empty body)" : new String(b, 0, n, "UTF-8").replaceAll("[\\r\\n]+", " ");
        } catch (Exception e) {
            return "(unreadable: " + e.getMessage() + ")";
        }
    }

    /** Diagnostics: the WebView version on this phone. */
    static String webViewVersion() {
        try {
            return android.webkit.WebView.getCurrentWebViewPackage().versionName;
        } catch (Exception e) {
            return "unknown";
        }
    }

    static final String UA = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36";

    /** @return TRUE live, FALSE not live, null when Tango gave no clear answer. */
    static Boolean isLive(String user) {
        HttpURLConnection c = null;
        try {
            URL url = new URL("https://gateway.tango.me/stream-details-provider/public/byAlias?alias=" + URLEncoder.encode(user, "UTF-8"));
            c = (HttpURLConnection) url.openConnection();
            c.setConnectTimeout(15000);
            c.setReadTimeout(15000);
            c.setUseCaches(false);
            c.setRequestProperty("User-Agent", UA);
            c.setRequestProperty("Origin", "https://www.tango.me");
            c.setRequestProperty("Referer", "https://www.tango.me/");
            try {
                String cookies = CookieManager.getInstance().getCookie("https://gateway.tango.me/");
                if (cookies != null && !cookies.isEmpty()) c.setRequestProperty("Cookie", cookies);
            } catch (Exception ignored) {}
            int code = c.getResponseCode();
            lastStatus = code;
            lastDetail = code == 200 ? "200 OK" : code + ": " + readSnippet(c.getErrorStream());
            if (code == 404) return Boolean.FALSE;
            if (code == 200) {
                try (InputStream in = c.getInputStream()) {
                    return in.read() >= 0 ? Boolean.TRUE : null;
                }
            }
            return null;
        } catch (Exception e) {
            return null;
        } finally {
            if (c != null) c.disconnect();
        }
    }
}
