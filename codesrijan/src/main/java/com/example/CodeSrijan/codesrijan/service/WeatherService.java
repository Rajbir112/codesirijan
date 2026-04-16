package com.example.CodeSrijan.codesrijan.service;

import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.util.stream.Collectors;

/**
 * Weather via WeatherAPI.com  (free tier, working key).
 *
 * Step 1 : ip-api.com/json      → lat, lon  (cached 1 hour)
 * Step 2 : weatherapi.com       → condition text + temp_c
 *
 * Result  : "Sunny, 34°C"
 */
@Service
public class WeatherService {

    private static final String WEATHER_API_KEY = "08b5f60c6dca4c4a978222450261604";
    private static final String WEATHER_API_URL =
            "https://api.weatherapi.com/v1/current.json?key=%s&q=%.6f,%.6f";

    // User-supplied coords (highest priority — set from browser geolocation)
    private double userLat = 0;
    private double userLon = 0;

    // IP-based fallback coords (cached 1 hour)
    private double cachedLat    = 0;
    private double cachedLon    = 0;
    private long   locFetchedMs = 0;
    private static final long CACHE_MS = 60 * 60 * 1000;

    /** Called by the controller when the browser sends the admin's GPS coords. */
    public void setUserLocation(double lat, double lon) {
        this.userLat = lat;
        this.userLon = lon;
        System.out.printf("[WeatherService] User location stored: lat=%.4f lon=%.4f%n", lat, lon);
    }

    /** Returns e.g. "Sunny, 34°C" or "Unavailable" on failure. */
    public String getCurrentWeather() {
        try {
            // Prefer GPS coords from browser; fall back to IP-based detection
            double lat, lon;
            if (userLat != 0) {
                lat = userLat;
                lon = userLon;
            } else {
                fetchLocationIfNeeded();
                lat = cachedLat;
                lon = cachedLon;
            }
            return fetchWeatherApi(lat, lon);
        } catch (Exception e) {
            System.err.println("[WeatherService] FAILED: " + e.getMessage());
            return "Unavailable";
        }
    }

    // ── Step 1: ip-api.com → lat / lon ───────────────────────────────────
    private void fetchLocationIfNeeded() throws Exception {
        long now = System.currentTimeMillis();
        if (cachedLat != 0 && (now - locFetchedMs) < CACHE_MS) return;

        String json = httpGet("http://ip-api.com/json");
        System.out.println("[WeatherService] ip-api: " + json);

        cachedLat    = Double.parseDouble(extractDouble(json, "lat"));
        cachedLon    = Double.parseDouble(extractDouble(json, "lon"));
        locFetchedMs = now;
        System.out.printf("[WeatherService] Location: lat=%.4f lon=%.4f%n", cachedLat, cachedLon);
    }

    // ── Step 2: WeatherAPI.com current weather ───────────────────────────
    // Response: { "current": { "temp_c": 34.2, "condition": { "text": "Sunny" } } }
    private String fetchWeatherApi(double lat, double lon) throws Exception {
        String url = String.format(WEATHER_API_URL, WEATHER_API_KEY, lat, lon);
        System.out.println("[WeatherService] Calling WeatherAPI: " + url);

        String json = httpGet(url);
        System.out.println("[WeatherService] Response: " + json);

        String conditionText = extractString(json, "text");           // condition.text
        String tempRaw       = extractDouble(json, "temp_c");         // current.temp_c
        int    tempInt       = (int) Math.round(Double.parseDouble(tempRaw));

        String result = conditionText + ", " + tempInt + "\u00b0C";
        System.out.println("[WeatherService] Result: " + result);
        return result;
    }

    // ── HTTP helper ───────────────────────────────────────────────────────
    private String httpGet(String urlStr) throws Exception {
        URL url = URI.create(urlStr).toURL();
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");
        conn.setConnectTimeout(8000);
        conn.setReadTimeout(8000);
        conn.setRequestProperty("User-Agent", "HospitalSystem/1.0");

        int code = conn.getResponseCode();
        try (BufferedReader r = new BufferedReader(new InputStreamReader(
                code >= 400 ? conn.getErrorStream() : conn.getInputStream()))) {
            String body = r.lines().collect(Collectors.joining());
            if (code != 200) throw new IOException("HTTP " + code + " | " + body);
            return body;
        }
    }

    // ── JSON helpers (no extra deps) ─────────────────────────────────────

    /** Extracts first quoted string value: "key":"value" */
    private String extractString(String json, String key) {
        String search = "\"" + key + "\"";
        int idx   = json.indexOf(search);
        if (idx == -1) return "Unknown";
        int colon = json.indexOf(':', idx + search.length());
        int open  = json.indexOf('"', colon + 1);
        int close = json.indexOf('"', open + 1);
        return json.substring(open + 1, close);
    }

    /** Extracts first numeric (unquoted) value: "key":34.2 */
    private String extractDouble(String json, String key) {
        String search = "\"" + key + "\"";
        int idx = json.indexOf(search);
        if (idx == -1) return "0";
        int colon = json.indexOf(':', idx + search.length());
        int s = colon + 1;
        while (s < json.length() && json.charAt(s) == ' ') s++;
        int e = s;
        while (e < json.length() &&
               (Character.isDigit(json.charAt(e)) || json.charAt(e) == '.' || json.charAt(e) == '-')) e++;
        return json.substring(s, e);
    }
}
