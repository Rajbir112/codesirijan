package com.example.CodeSrijan.codesrijan.controller;

import com.example.CodeSrijan.codesrijan.dto.NurseRequest;
import com.example.CodeSrijan.codesrijan.dto.NurseResponse;
import com.example.CodeSrijan.codesrijan.service.NurseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/nurses")
@CrossOrigin(origins = "http://localhost:3000")
public class NurseController {

    @Autowired
    private NurseService nurseService;

    @PostMapping
    public ResponseEntity<String> addNurse(@RequestBody NurseRequest request) {
        nurseService.addNurse(request);
        return ResponseEntity.ok("Nurse added successfully");
    }

    @GetMapping("/stats")
    public ResponseEntity<NurseResponse> getNurseStats() {
        return ResponseEntity.ok(nurseService.getNurseStats());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteNurse(@PathVariable Long id) {
        try {
            nurseService.deleteNurse(id);
            return ResponseEntity.ok("Nurse deleted successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
