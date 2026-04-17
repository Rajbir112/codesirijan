package com.example.CodeSrijan.codesrijan.service;

import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.time.LocalDate;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Fetches Indian public holidays from date.nager.at (free, no API key).
 *
 * API: GET https://date.nager.at/api/v3/PublicHolidays/{year}/IN
 * Response: JSON array of { "date": "2026-01-26", "localName": "Republic Day", ... }
 *
 * Holidays are cached per year in memory.
 */
@Service
public class HolidayService {

    // Exact API URL — year 2026, Austria (AT)
    private static final String HOLIDAY_URL = "https://date.nager.at/api/v3/publicholidays/2026/AT";

    // Holidays loaded once at startup
    private Set<LocalDate> holidays = null;

    /**
     * Returns true if ANY Indian public holiday falls within [from, to] inclusive.
     * Used to flag the 3-day forward window [date → recorded_at].
     */
    public boolean hasHolidayInRange(LocalDate from, LocalDate to) {
        if (holidays == null) loadHolidays();
        for (LocalDate holiday : holidays) {
            if (!holiday.isBefore(from) && !holiday.isAfter(to)) {
                System.out.printf("[HolidayService] Holiday found in range [%s, %s]: %s%n", from, to, holiday);
                return true;
            }
        }
        return false;
    }

    // ── Internal ──────────────────────────────────────────────────────────
    private void loadHolidays() {
        try {
            String json = httpGet(HOLIDAY_URL);
            holidays = parseHolidayDates(json);
            System.out.printf("[HolidayService] Loaded %d holidays from %s%n", holidays.size(), HOLIDAY_URL);
        } catch (Exception e) {
            System.err.println("[HolidayService] Failed to load holidays: " + e.getMessage());
            holidays = Collections.emptySet();
        }
    }

    /**
     * Parses all "date":"YYYY-MM-DD" entries from the JSON array response.
     * Uses regex to avoid adding a JSON library dependency.
     */
    private Set<LocalDate> parseHolidayDates(String json) {
        Set<LocalDate> dates = new HashSet<>();
        Pattern pattern = Pattern.compile("\"date\"\\s*:\\s*\"(\\d{4}-\\d{2}-\\d{2})\"");
        Matcher matcher = pattern.matcher(json);
        while (matcher.find()) {
            dates.add(LocalDate.parse(matcher.group(1)));
        }
        return dates;
    }

    private String httpGet(String urlStr) throws Exception {
        URL url = URI.create(urlStr).toURL();
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");
        conn.setConnectTimeout(8000);
        conn.setReadTimeout(8000);
        conn.setRequestProperty("Accept", "application/json");
        conn.setRequestProperty("User-Agent", "HospitalSystem/1.0");

        int code = conn.getResponseCode();
        try (BufferedReader r = new BufferedReader(new InputStreamReader(
                code >= 400 ? conn.getErrorStream() : conn.getInputStream()))) {
            String body = r.lines().collect(Collectors.joining());
            if (code != 200) throw new IOException("HTTP " + code + " | " + body);
            return body;
        }
    }
}
