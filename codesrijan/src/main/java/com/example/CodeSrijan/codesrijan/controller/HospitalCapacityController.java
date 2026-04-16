package com.example.CodeSrijan.codesrijan.controller;

import com.example.CodeSrijan.codesrijan.dto.CapacityRequest;
import com.example.CodeSrijan.codesrijan.dto.InventoryResponse;
import com.example.CodeSrijan.codesrijan.service.HospitalCapacityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/capacity")
@CrossOrigin(origins = "http://localhost:3000")
public class HospitalCapacityController {

    @Autowired
    private HospitalCapacityService capacityService;

    private static final List<String> PREDEFINED_ROOM_TYPES = Arrays.asList(
            "General Ward",
            "Semi-Private Room",
            "Private Room",
            "Intensive Care Unit (ICU)",
            "High Dependency Unit (HDU)",
            "Isolation Room",
            "Recovery Room (Post-Operative)",
            "Pediatric / Neonatal Room"
    );

    @GetMapping("/room-types")
    public ResponseEntity<List<String>> getRoomTypes() {
        return ResponseEntity.ok(PREDEFINED_ROOM_TYPES);
    }

    @PostMapping
    public ResponseEntity<String> addCapacity(@RequestBody CapacityRequest request) {
        capacityService.generateCapacity(request);
        return ResponseEntity.ok("Capacity generated successfully");
    }

    @GetMapping("/inventory")
    public ResponseEntity<List<InventoryResponse>> getInventory() {
        return ResponseEntity.ok(capacityService.getInventory());
    }
}
