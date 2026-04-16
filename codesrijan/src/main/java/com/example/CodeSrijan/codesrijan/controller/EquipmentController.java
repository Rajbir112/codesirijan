package com.example.CodeSrijan.codesrijan.controller;

import com.example.CodeSrijan.codesrijan.entity.Equipment;
import com.example.CodeSrijan.codesrijan.repository.EquipmentRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/equipment")
@CrossOrigin(origins = "http://localhost:3000")
public class EquipmentController {

    @Autowired
    private EquipmentRepository equipmentRepo;

    // GET all equipment grouped by category
    @GetMapping
    public ResponseEntity<Map<String, List<Map<String, Object>>>> getAllEquipment() {
        List<Equipment> all = equipmentRepo.findAll();
        Map<String, List<Map<String, Object>>> grouped = new LinkedHashMap<>();
        for (Equipment e : all) {
            grouped.computeIfAbsent(e.getCategoryName(), k -> new ArrayList<>())
                .add(Map.of("id", e.getId(), "equipmentName", e.getEquipmentName(), "count", e.getCount()));
        }
        return ResponseEntity.ok(grouped);
    }

    // POST save/update a list of equipment entries (upsert by category+name)
    @PostMapping("/save")
    @Transactional
    public ResponseEntity<String> saveEquipment(@RequestBody List<Map<String, Object>> entries) {
        for (Map<String, Object> entry : entries) {
            String category = entry.get("categoryName").toString();
            String name = entry.get("equipmentName").toString();
            int count = Integer.parseInt(entry.get("count").toString());
            if (count < 0) count = 0;

            Optional<Equipment> existing = equipmentRepo.findByCategoryNameAndEquipmentName(category, name);
            if (existing.isPresent()) {
                existing.get().setCount(count);
                equipmentRepo.save(existing.get());
            } else {
                equipmentRepo.save(new Equipment(category, name, count));
            }
        }
        return ResponseEntity.ok("Equipment saved successfully.");
    }

    // DELETE a single equipment entry
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteEquipment(@PathVariable Long id) {
        equipmentRepo.deleteById(id);
        return ResponseEntity.ok("Deleted.");
    }
}
