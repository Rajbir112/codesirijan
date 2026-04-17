package com.example.CodeSrijan.codesrijan.controller;

import com.example.CodeSrijan.codesrijan.entity.*;
import com.example.CodeSrijan.codesrijan.repository.*;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admissions")
@CrossOrigin(origins = "http://localhost:3000")
public class AdmissionController {

    @Autowired private PatientAdmissionRepository admissionRepo;
    @Autowired private BedRepository bedRepo;
    @Autowired private DoctorRepository doctorRepo;
    @Autowired private NurseRepository nurseRepo;
    @Autowired private RoomRepository roomRepo;
    @Autowired private DoctorCategoryRepository docCategoryRepo;
    @Autowired private EquipmentRepository equipmentRepo;

    // Room types that allow Doctor + Nurse locking
    private static final Set<String> HIGH_CARE_ROOMS = new HashSet<>(Arrays.asList(
        "Intensive Care Unit (ICU)",
        "High Dependency Unit (HDU)",
        "Isolation Room",
        "Recovery Room (Post-Operative)",
        "Pediatric / Neonatal Room"
    ));

    // GET all room types that have at least 1 available bed
    @GetMapping("/room-types")
    public ResponseEntity<List<Map<String, Object>>> getAvailableRoomTypes() {
        List<Room> allRooms = roomRepo.findAll();
        Map<String, List<Room>> byType = new LinkedHashMap<>();
        for (Room r : allRooms) {
            byType.computeIfAbsent(r.getRoomType().getName(), k -> new ArrayList<>()).add(r);
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Map.Entry<String, List<Room>> entry : byType.entrySet()) {
            String typeName = entry.getKey();
            boolean hasVacantRoom = false;
            for (Room r : entry.getValue()) {
                boolean hasVacantBed = bedRepo.findByRoomId(r.getId()).stream()
                    .anyMatch(b -> Boolean.TRUE.equals(b.getIsAvailable()));
                if (hasVacantBed) { hasVacantRoom = true; break; }
            }
            if (hasVacantRoom) {
                Map<String, Object> typeMap = new HashMap<>();
                typeMap.put("name", typeName);
                typeMap.put("allowsDoctorNurse", HIGH_CARE_ROOMS.contains(typeName));
                result.add(typeMap);
            }
        }
        return ResponseEntity.ok(result);
    }

    // GET rooms with at least 1 vacant bed for a given room type
    @GetMapping("/rooms")
    public ResponseEntity<List<Map<String, Object>>> getRoomsForType(@RequestParam String roomTypeName) {
        List<Room> allRooms = roomRepo.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Room r : allRooms) {
            if (!r.getRoomType().getName().equals(roomTypeName)) continue;
            long vacantCount = bedRepo.findByRoomId(r.getId()).stream()
                .filter(b -> Boolean.TRUE.equals(b.getIsAvailable())).count();
            if (vacantCount > 0) {
                Map<String, Object> m = new HashMap<>();
                m.put("id", r.getId());
                m.put("roomNumber", r.getRoomNumber());
                m.put("vacantBeds", vacantCount);
                result.add(m);
            }
        }
        return ResponseEntity.ok(result);
    }

    // GET vacant beds for a specific room
    @GetMapping("/beds")
    public ResponseEntity<List<Map<String, Object>>> getVacantBeds(@RequestParam Long roomId) {
        List<Map<String, Object>> result = bedRepo.findByRoomId(roomId).stream()
            .filter(b -> Boolean.TRUE.equals(b.getIsAvailable()))
            .map(b -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", b.getId());
                m.put("bedNumber", b.getBedNumber());
                return m;
            }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // GET doctor categories that have at least 1 available doctor
    @GetMapping("/doctor-categories")
    public ResponseEntity<List<Map<String, Object>>> getAvailableDoctorCategories() {
        List<DoctorCategory> cats = docCategoryRepo.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        for (DoctorCategory dc : cats) {
            List<Doctor> available = doctorRepo.findByCategoryId(dc.getId()).stream()
                .filter(d -> Boolean.TRUE.equals(d.getIsAvailable())).collect(Collectors.toList());
            if (!available.isEmpty()) {
                Map<String, Object> m = new HashMap<>();
                m.put("id", dc.getId());
                m.put("name", dc.getName());
                result.add(m);
            }
        }
        return ResponseEntity.ok(result);
    }

    // GET available doctors for a specific category
    @GetMapping("/doctors")
    public ResponseEntity<List<Map<String, Object>>> getAvailableDoctors(@RequestParam Long categoryId) {
        List<Map<String, Object>> result = doctorRepo.findByCategoryId(categoryId).stream()
            .filter(d -> Boolean.TRUE.equals(d.getIsAvailable()))
            .map(d -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", d.getId());
                m.put("name", d.getName());
                return m;
            }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // GET all available nurses
    @GetMapping("/nurses")
    public ResponseEntity<List<Map<String, Object>>> getAvailableNurses() {
        List<Map<String, Object>> result = nurseRepo.findAll().stream()
            .filter(n -> Boolean.TRUE.equals(n.getIsAvailable()))
            .map(n -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", n.getId());
                m.put("name", n.getName());
                return m;
            }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // GET available equipment categories (those with at least 1 available unit)
    @GetMapping("/equipment-categories")
    public ResponseEntity<List<String>> getAvailableEquipmentCategories() {
        List<Equipment> all = equipmentRepo.findAll();
        List<String> categories = all.stream()
            .filter(e -> e.getAvailableCount() > 0)
            .map(Equipment::getCategoryName)
            .distinct()
            .collect(Collectors.toList());
        return ResponseEntity.ok(categories);
    }

    // GET available equipment items for a category
    @GetMapping("/equipment-items")
    public ResponseEntity<List<Map<String, Object>>> getAvailableEquipmentItems(@RequestParam String category) {
        List<Map<String, Object>> result = equipmentRepo.findByCategoryName(category).stream()
            .filter(e -> e.getAvailableCount() > 0)
            .map(e -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", e.getId());
                m.put("equipmentName", e.getEquipmentName());
                m.put("availableCount", e.getAvailableCount());
                return m;
            }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // POST lock resources
    @PostMapping("/lock")
    @Transactional
    public ResponseEntity<String> lockResources(@RequestBody Map<String, Object> body) {
        Long bedId = Long.valueOf(body.get("bedId").toString());
        String patientName = body.get("patientName").toString();
        String illness = body.get("illness") != null ? body.get("illness").toString() : "";

        Bed bed = bedRepo.findById(bedId).orElseThrow();
        bed.setIsAvailable(false);
        bedRepo.save(bed);

        PatientAdmission admission = new PatientAdmission();
        admission.setPatientName(patientName);
        admission.setIllness(illness);
        admission.setBed(bed);
        admission.setStatus("ACTIVE");

        if (body.get("doctorId") != null && !body.get("doctorId").toString().isBlank()) {
            Long doctorId = Long.valueOf(body.get("doctorId").toString());
            Doctor doc = doctorRepo.findById(doctorId).orElseThrow();
            doc.setIsAvailable(false);
            doctorRepo.save(doc);
            admission.setDoctor(doc);
        }

        @SuppressWarnings("unchecked")
        List<Integer> nurseIds = body.get("nurseIds") != null ? (List<Integer>) body.get("nurseIds") : new ArrayList<>();
        if (!nurseIds.isEmpty()) {
            List<Nurse> nurses = new ArrayList<>();
            for (Integer nId : nurseIds) {
                Nurse n = nurseRepo.findById(Long.valueOf(nId)).orElseThrow();
                n.setIsAvailable(false);
                nurseRepo.save(n);
                nurses.add(n);
            }
            admission.setNurses(nurses);
        }

        // Lock equipment if provided
        @SuppressWarnings("unchecked")
        List<Object> equipIdObjs = (List<Object>) body.get("equipmentIds");
        if (equipIdObjs != null && !equipIdObjs.isEmpty()) {
            List<Equipment> lockedEq = new ArrayList<>();
            for (Object eqIdObj : equipIdObjs) {
                if (eqIdObj != null && !eqIdObj.toString().isBlank()) {
                    Long equipId = Long.valueOf(eqIdObj.toString());
                    Equipment eq = equipmentRepo.findById(equipId).orElseThrow();
                    if (eq.getAvailableCount() > 0) {
                        eq.setLockedCount(eq.getLockedCount() + 1);
                        equipmentRepo.save(eq);
                        lockedEq.add(eq);
                    }
                }
            }
            if (!lockedEq.isEmpty()) {
                admission.setLockedEquipment(lockedEq);
            }
        }

        admissionRepo.save(admission);
        return ResponseEntity.ok("Patient admitted successfully.");
    }

    // GET active admissions
    @GetMapping("/active")
    public ResponseEntity<List<Map<String, Object>>> getActiveAdmissions() {
        List<PatientAdmission> active = admissionRepo.findByStatus("ACTIVE");
        List<Map<String, Object>> result = new ArrayList<>();
        for (PatientAdmission a : active) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", a.getId());
            m.put("patientName", a.getPatientName());
            m.put("illness", a.getIllness());
            m.put("roomType", a.getBed().getRoom().getRoomType().getName());
            m.put("roomNumber", a.getBed().getRoom().getRoomNumber());
            m.put("bedNumber", a.getBed().getBedNumber());
            m.put("doctorName", a.getDoctor() != null ? a.getDoctor().getName() : null);
            m.put("doctorCategory", a.getDoctor() != null ? a.getDoctor().getCategory().getName() : null);
            m.put("nurseCount", a.getNurses() != null ? a.getNurses().size() : 0);
            if (a.getNurses() != null) {
                m.put("nurseNames", a.getNurses().stream().map(Nurse::getName).collect(Collectors.toList()));
            }
            if (a.getLockedEquipment() != null && !a.getLockedEquipment().isEmpty()) {
                String equipNames = a.getLockedEquipment().stream()
                        .map(Equipment::getEquipmentName)
                        .collect(Collectors.joining(", "));
                String equipCats = a.getLockedEquipment().stream()
                        .map(Equipment::getCategoryName)
                        .distinct()
                        .collect(Collectors.joining(", "));
                m.put("equipmentCategory", equipCats);
                m.put("equipmentName", equipNames);
            }
            result.add(m);
        }
        return ResponseEntity.ok(result);
    }

    // POST discharge (unlock)
    @PostMapping("/discharge/{id}")
    @Transactional
    public ResponseEntity<String> discharge(@PathVariable Long id) {
        PatientAdmission a = admissionRepo.findById(id).orElseThrow();
        a.setStatus("DISCHARGED");

        a.getBed().setIsAvailable(true);
        bedRepo.save(a.getBed());

        if (a.getDoctor() != null) {
            a.getDoctor().setIsAvailable(true);
            doctorRepo.save(a.getDoctor());
        }
        if (a.getNurses() != null) {
            for (Nurse n : a.getNurses()) {
                n.setIsAvailable(true);
                nurseRepo.save(n);
            }
        }
        // Unlock equipment
        if (a.getLockedEquipment() != null) {
            for (Equipment eq : a.getLockedEquipment()) {
                eq.setLockedCount(Math.max(0, eq.getLockedCount() - 1));
                equipmentRepo.save(eq);
            }
        }

        admissionRepo.save(a);
        return ResponseEntity.ok("Patient discharged successfully.");
    }
}
