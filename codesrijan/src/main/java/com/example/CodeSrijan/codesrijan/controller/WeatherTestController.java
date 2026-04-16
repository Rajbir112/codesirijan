package com.example.CodeSrijan.codesrijan.controller;

import com.example.CodeSrijan.codesrijan.service.WeatherService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/weather")
@CrossOrigin(origins = "http://localhost:3000")
public class WeatherTestController {

    @Autowired
    private WeatherService weatherService;

    /** Test: http://localhost:8080/api/weather/test */
    @GetMapping("/test")
    public ResponseEntity<Map<String, String>> test() {
        return ResponseEntity.ok(Map.of("weather", weatherService.getCurrentWeather()));
    }

    /**
     * Called once from React when admin grants browser location permission.
     * Body: { "lat": 22.717, "lon": 75.8337 }
     */
    @PostMapping("/location")
    public ResponseEntity<String> setLocation(@RequestBody Map<String, Double> body) {
        double lat = body.getOrDefault("lat", 0.0);
        double lon = body.getOrDefault("lon", 0.0);
        weatherService.setUserLocation(lat, lon);
        System.out.printf("[WeatherService] User location set: lat=%.4f lon=%.4f%n", lat, lon);
        return ResponseEntity.ok("Location updated.");
    }
}
