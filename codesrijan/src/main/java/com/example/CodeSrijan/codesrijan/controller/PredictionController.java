package com.example.CodeSrijan.codesrijan.controller;

import com.example.CodeSrijan.codesrijan.dto.PredictionResponseDTO;
import com.example.CodeSrijan.codesrijan.service.PredictionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/predict")
@CrossOrigin(origins = "http://localhost:3000")
public class PredictionController {

    @Autowired
    private PredictionService predictionService;

    @GetMapping("/demand")
    public ResponseEntity<?> getDemandForecast() {
        try {
            List<PredictionResponseDTO> predictions = predictionService.getDemandForecast();
            return ResponseEntity.ok(predictions);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }
}
