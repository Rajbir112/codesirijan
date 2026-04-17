package com.example.CodeSrijan.codesrijan.service;

import com.example.CodeSrijan.codesrijan.dto.PredictionRequestDTO;
import com.example.CodeSrijan.codesrijan.dto.PredictionResponseDTO;
import com.example.CodeSrijan.codesrijan.entity.Equipment;
import com.example.CodeSrijan.codesrijan.repository.EquipmentRepository;
import com.example.CodeSrijan.codesrijan.repository.PatientAdmissionRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PredictionService {

    @Autowired private EquipmentRepository equipmentRepo;
    @Autowired private PatientAdmissionRepository admissionRepo;
    @Autowired private HolidayService holidayService;

    public List<PredictionResponseDTO> getDemandForecast() {
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();

        // Time Windows
        LocalDateTime dateMinus1Start = now.minusDays(1);
        LocalDateTime dateMinus7Start = now.minusDays(7);
        LocalDate plus3Days = today.plusDays(3);

        // Patients (Global Feature)
        long patientsLastDay = admissionRepo.countByCreatedAtBetween(dateMinus1Start, now);
        long patientsLast7Days = admissionRepo.countByCreatedAtBetween(dateMinus7Start, now);

        // Calendar Flags
        DayOfWeek dow = today.getDayOfWeek();
        boolean isWeekend = (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY);
        boolean isHoliday = holidayService.hasHolidayInRange(today, plus3Days); // Any holiday in next 3 days

        // Get Active Equipment
        List<Equipment> activeEq = equipmentRepo.findAll().stream()
                .filter(e -> e.getCount() > 0)
                .collect(Collectors.toList());

        List<PredictionRequestDTO> requests = new ArrayList<>();
        
        for (Equipment eq : activeEq) {
            long usageLastDay = admissionRepo.countByEquipmentAndCreatedAtBetween(
                    eq.getId(), dateMinus1Start, now);
            long usageLast7Days = admissionRepo.countByEquipmentAndCreatedAtBetween(
                    eq.getId(), dateMinus7Start, now);

            requests.add(new PredictionRequestDTO(
                    eq.getEquipmentName(),
                    isHoliday,
                    isWeekend,
                    patientsLast7Days,
                    patientsLastDay,
                    usageLast7Days,
                    usageLastDay
            ));
        }

        if (requests.isEmpty()) {
            return new ArrayList<>();
        }

        // Call Python
        try {
            ObjectMapper mapper = new ObjectMapper();
            String jsonInput = mapper.writeValueAsString(requests);

            // Smart resolve path to predict.py
            String userDir = System.getProperty("user.dir");
            java.io.File scriptFile = new java.io.File(userDir, "predict.py");
            java.io.File projectRoot = new java.io.File(userDir);

            if (!scriptFile.exists()) {
                // If not in current dir, check parent (common if running from backend subfolder)
                java.io.File parent = new java.io.File(userDir).getParentFile();
                java.io.File fallback = new java.io.File(parent, "predict.py");
                if (fallback.exists()) {
                    scriptFile = fallback;
                    projectRoot = parent;
                }
            }
            
            // Try to use 'python3' (standard in Linux/Railway) or just 'python'
            String pythonPath = "python3";
            String os = System.getProperty("os.name").toLowerCase();
            
            if (os.contains("win")) {
                pythonPath = "python";
                // Local Windows fallback for your specific machine
                java.io.File localWinPath = new java.io.File("C:\\Users\\HP\\AppData\\Local\\Programs\\Python\\Python311\\python.exe");
                if (localWinPath.exists()) {
                    pythonPath = localWinPath.getAbsolutePath();
                }
            }

            ProcessBuilder pb = new ProcessBuilder(pythonPath, scriptFile.getAbsolutePath());
            pb.directory(projectRoot);
            Process process = pb.start();

            try (java.io.OutputStreamWriter writer = new java.io.OutputStreamWriter(process.getOutputStream())) {
                writer.write(jsonInput);
                writer.flush();
            }

            // Read output (wait for result)
            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line);
                }
            }

            int exitCode = process.waitFor();
            if (exitCode != 0) {
                // Read errors
                StringBuilder errorOutput = new StringBuilder();
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getErrorStream()))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        errorOutput.append(line).append("\n");
                    }
                }
                throw new RuntimeException("Python inference failed with exit code " + exitCode + ": " + errorOutput.toString());
            }

            // Parse response
            List<PredictionResponseDTO> responses = mapper.readValue(output.toString(), new TypeReference<List<PredictionResponseDTO>>() {});
            
            // Map currentlyAvailable stock to the response
            for (PredictionResponseDTO resp : responses) {
                activeEq.stream()
                        .filter(e -> e.getEquipmentName().equals(resp.getEquipment()))
                        .findFirst()
                        .ifPresent(e -> resp.setCurrentlyAvailable(e.getAvailableCount()));
            }

            return responses;

        } catch (Exception e) {
            throw new RuntimeException("Error during prediction pipeline: " + e.getMessage(), e);
        }
    }
}
