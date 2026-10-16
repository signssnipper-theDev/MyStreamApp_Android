package com.signssnipper.mystream;

import android.webkit.CookieManager;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;

/**
 * Tango's own live lookup by username (the same request Tango's profile page makes):
 * 200 with data = live, 404 = not live. Only the answer is used, never the stream.
 * Sends your Tango sign-in (if any) so it sees what your account can see.
 */
final class Lookup {
    private Lookup() {}

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
