package com.example.CodeSrijan.codesrijan.controller;

import com.example.CodeSrijan.codesrijan.dto.DoctorRequest;
import com.example.CodeSrijan.codesrijan.dto.DoctorResponse;
import com.example.CodeSrijan.codesrijan.service.DoctorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/doctors")
@CrossOrigin(origins = "http://localhost:3000")
public class DoctorController {

    @Autowired
    private DoctorService doctorService;

    private static final List<String> PREDEFINED_DOCTOR_CATEGORIES = Arrays.asList(
            "General Physician (Internal Medicine)",
            "Emergency Medicine Doctor",
            "Cardiologist (Heart Specialist)",
            "Neurologist (Brain & Nervous System)",
            "Orthopedic Doctor (Bones & Joints)",
            "Pediatrician (Child Specialist)",
            "Gynecologist / Obstetrician",
            "Surgeon (General Surgery)",
            "Anesthesiologist",
            "Radiologist (Medical Imaging)",
            "Dermatologist (Skin Specialist)",
            "Psychiatrist (Mental Health)",
            "Oncologist (Cancer Specialist)",
            "Pulmonologist (Lung Specialist)",
            "Nephrologist (Kidney Specialist)",
            "Gastroenterologist (Digestive System)",
            "ENT Specialist (Ear, Nose, Throat)",
            "Ophthalmologist (Eye Specialist)",
            "Urologist (Urinary System)",
            "Endocrinologist (Hormones & Diabetes)",
            "Dentist",
            "Pathologist"
    );

    @GetMapping("/categories")
    public ResponseEntity<List<String>> getCategories() {
        return ResponseEntity.ok(PREDEFINED_DOCTOR_CATEGORIES);
    }

    @PostMapping
    public ResponseEntity<String> addDoctor(@RequestBody DoctorRequest request) {
        doctorService.addDoctor(request);
        return ResponseEntity.ok("Doctor added successfully");
    }

    @GetMapping("/stats")
    public ResponseEntity<List<DoctorResponse>> getDoctorStats() {
        return ResponseEntity.ok(doctorService.getDoctorStats());
    }
}
