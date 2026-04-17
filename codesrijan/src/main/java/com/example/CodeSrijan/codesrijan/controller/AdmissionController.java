package com.example.CodeSrijan.codesrijan.controller;

import com.example.CodeSrijan.codesrijan.entity.*;
import com.example.CodeSrijan.codesrijan.repository.*;
import com.example.CodeSrijan.codesrijan.service.QueueService;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
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
    @Autowired private RoomTypeRepository roomTypeRepo;
    @Autowired private DoctorCategoryRepository docCategoryRepo;
    @Autowired private EquipmentRepository equipmentRepo;
    @Autowired private QueueService queueService;

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
        List<RoomType> allTypes = roomTypeRepo.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        for (RoomType rt : allTypes) {
            long vacantCount = 0;
            List<Room> rooms = roomRepo.findByRoomTypeId(rt.getId());
            for (Room r : rooms) {
                vacantCount += bedRepo.findByRoomId(r.getId()).stream()
                    .filter(b -> Boolean.TRUE.equals(b.getIsAvailable())).count();
            }
            Map<String, Object> m = new HashMap<>();
            m.put("name", rt.getName());
            m.put("allowsDoctorNurse", HIGH_CARE_ROOMS.contains(rt.getName()));
            m.put("vacantBeds", vacantCount);
            result.add(m);
        }
        return ResponseEntity.ok(result);
    }

    // GET rooms with at least 1 vacant bed for a given room type
    @GetMapping("/rooms")
    public ResponseEntity<List<Map<String, Object>>> getRoomsForType(@RequestParam String roomTypeName) {
        RoomType rt = roomTypeRepo.findByName(roomTypeName).orElseThrow();
        List<Room> rooms = roomRepo.findByRoomTypeId(rt.getId());
        List<Map<String, Object>> result = new ArrayList<>();
        for (Room r : rooms) {
            long vacantCount = bedRepo.findByRoomId(r.getId()).stream()
                .filter(b -> Boolean.TRUE.equals(b.getIsAvailable())).count();
            Map<String, Object> m = new HashMap<>();
            m.put("id", r.getId());
            m.put("roomNumber", r.getRoomNumber());
            m.put("vacantBeds", vacantCount);
            result.add(m);
        }
        return ResponseEntity.ok(result);
    }

    // GET all beds for a specific room
    @GetMapping("/beds")
    public ResponseEntity<List<Map<String, Object>>> getBedsForRoom(@RequestParam Long roomId) {
        List<Map<String, Object>> result = bedRepo.findByRoomId(roomId).stream()
            .map(b -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", b.getId());
                m.put("bedNumber", b.getBedNumber());
                m.put("isAvailable", b.getIsAvailable());
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
            long availableCount = doctorRepo.findByCategoryId(dc.getId()).stream()
                .filter(d -> Boolean.TRUE.equals(d.getIsAvailable())).count();
            Map<String, Object> m = new HashMap<>();
            m.put("id", dc.getId());
            m.put("name", dc.getName());
            m.put("availableCount", availableCount);
            result.add(m);
        }
        return ResponseEntity.ok(result);
    }

    // GET available doctors for a specific category
    @GetMapping("/doctors")
    public ResponseEntity<List<Map<String, Object>>> getAvailableDoctors(@RequestParam Long categoryId) {
        List<Map<String, Object>> result = doctorRepo.findByCategoryId(categoryId).stream()
            .map(d -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", d.getId());
                m.put("name", d.getName());
                m.put("isAvailable", d.getIsAvailable());
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
    public ResponseEntity<List<Map<String, Object>>> getAvailableEquipmentCategories() {
        List<Equipment> all = equipmentRepo.findAll();
        Map<String, Long> catCounts = all.stream()
            .collect(Collectors.groupingBy(Equipment::getCategoryName, 
                     Collectors.summingLong(Equipment::getAvailableCount)));
        
        List<Map<String, Object>> result = new ArrayList<>();
        for (String cat : catCounts.keySet()) {
            Map<String, Object> m = new HashMap<>();
            m.put("name", cat);
            m.put("availableCount", catCounts.get(cat));
            result.add(m);
        }
        return ResponseEntity.ok(result);
    }

    // GET available equipment items for a category
    @GetMapping("/equipment-items")
    public ResponseEntity<List<Map<String, Object>>> getAvailableEquipmentItems(@RequestParam String category) {
        List<Map<String, Object>> result = equipmentRepo.findByCategoryName(category).stream()
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
        Integer criticality = body.get("criticality") != null ? Integer.valueOf(body.get("criticality").toString()) : null;

        Bed bed = bedRepo.findById(bedId).orElseThrow();
        
        PatientAdmission admission = new PatientAdmission();
        admission.setPatientName(patientName);
        admission.setIllness(illness);
        admission.setCriticality(criticality);
        admission.setBed(bed);
        admission.setStatus("ACTIVE");

        if (body.get("doctorId") != null && !body.get("doctorId").toString().isBlank()) {
            Long doctorId = Long.valueOf(body.get("doctorId").toString());
            Doctor doc = doctorRepo.findById(doctorId).orElseThrow();
            admission.setDoctor(doc);
        }

        @SuppressWarnings("unchecked")
        List<Integer> nurseIds = body.get("nurseIds") != null ? (List<Integer>) body.get("nurseIds") : new ArrayList<>();
        if (!nurseIds.isEmpty()) {
            List<Nurse> nurses = new ArrayList<>();
            for (Integer nId : nurseIds) {
                Nurse n = nurseRepo.findById(Long.valueOf(nId)).orElseThrow();
                nurses.add(n);
            }
            admission.setNurses(nurses);
        }

        // Check equipment
        @SuppressWarnings("unchecked")
        List<Object> equipIdObjs = (List<Object>) body.get("equipmentIds");
        if (equipIdObjs != null && !equipIdObjs.isEmpty()) {
            List<Equipment> requestedEq = new ArrayList<>();
            for (Object eqIdObj : equipIdObjs) {
                if (eqIdObj != null && !eqIdObj.toString().isBlank()) {
                    Long equipId = Long.valueOf(eqIdObj.toString());
                    requestedEq.add(equipmentRepo.findById(equipId).orElseThrow());
                }
            }
            admission.setLockedEquipment(requestedEq);
        }

        // Check if we should be in WAITING state
        boolean resourcesAvailable = true;
        if (!bed.getIsAvailable() && !Boolean.TRUE.equals(bed.getIsReserved())) resourcesAvailable = false;
        
        if (admission.getDoctor() != null && !admission.getDoctor().getIsAvailable()) resourcesAvailable = false;

        if (admission.getLockedEquipment() != null) {
            for (Equipment eq : admission.getLockedEquipment()) {
                if (eq.getAvailableCount() <= 0) { resourcesAvailable = false; break; }
            }
        }

        if (!resourcesAvailable) {
            admission.setStatus("WAITING");
            admission.setWaitingSince(LocalDateTime.now());
            
            // Release what we just tentatively locked so the QueueService can handle it properly
            bed.setIsAvailable(true); 
            bedRepo.save(bed);
            if (admission.getDoctor() != null) {
                admission.getDoctor().setIsAvailable(true);
                doctorRepo.save(admission.getDoctor());
            }
            // (Equipment count is handled by availability check, we don't increment yet)
            
            admissionRepo.save(admission);
            // Trigger queue processing to handle reservations if applicable
            queueService.processQueue();
            return ResponseEntity.ok("Resource unavailable. Patient added to WAITING LIST.");
        }

        // Resources are available, finalize locks
        bed.setIsAvailable(false);
        bedRepo.save(bed);
        if (admission.getDoctor() != null) {
            admission.getDoctor().setIsAvailable(false);
            doctorRepo.save(admission.getDoctor());
        }
        if (admission.getLockedEquipment() != null) {
            for (Equipment eq : admission.getLockedEquipment()) {
                eq.setLockedCount(eq.getLockedCount() + 1);
                equipmentRepo.save(eq);
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
            m.put("criticality", a.getCriticality());
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
            a.getDoctor().setPendingApproval(true); // Requires Admin to re-assign
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
        // IMPORTANT: Also release reservations!
        if (a.getReservedEquipment() != null) {
            for (Equipment eq : a.getReservedEquipment()) {
                eq.setLockedCount(Math.max(0, eq.getLockedCount() - 1));
                equipmentRepo.save(eq);
            }
            a.getReservedEquipment().clear();
        }

        admissionRepo.save(a);
        
        // Trigger queue processing to see who gets the freed resources
        queueService.processQueue();
        
        return ResponseEntity.ok("Patient discharged successfully.");
    }

    @PostMapping("/force-admit/{id}")
    @Transactional
    public ResponseEntity<String> forceAdmit(@PathVariable Long id) {
        PatientAdmission a = admissionRepo.findById(id).orElseThrow();
        // Check if doctor approval is the only thing left
        if (a.getDoctor() != null && Boolean.TRUE.equals(a.getDoctor().getPendingApproval())) {
            a.getDoctor().setPendingApproval(false);
            a.getDoctor().setIsAvailable(false);
            doctorRepo.save(a.getDoctor());
        }
        
        queueService.processQueue(); // Try to allocate normally first
        
        // Re-check
        PatientAdmission updated = admissionRepo.findById(id).orElseThrow();
        if ("ACTIVE".equals(updated.getStatus())) {
            return ResponseEntity.ok("Patient admitted successfully!");
        } else {
            return ResponseEntity.status(400).body("Cannot force admit: Resources still missing or Doctor not approved.");
        }
    }
    @PostMapping("/clear-waiting")
    @Transactional
    public ResponseEntity<String> clearWaiting() {
        List<PatientAdmission> waiting = admissionRepo.findByStatus("WAITING");
        for (PatientAdmission a : waiting) {
            queueService.releaseReservation(a);
            admissionRepo.delete(a);
        }
        return ResponseEntity.ok("Waiting queue cleared.");
    }

    @GetMapping("/waiting")
    public ResponseEntity<List<Map<String, Object>>> getWaitingAdmissions() {
        List<PatientAdmission> waiting = admissionRepo.findByStatus("WAITING");
        List<Map<String, Object>> result = new ArrayList<>();
        for (PatientAdmission a : waiting) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", a.getId());
            m.put("patientName", a.getPatientName());
            m.put("criticality", a.getCriticality());
            m.put("waitingSince", a.getWaitingSince());
            m.put("priorityScore", queueService.calculatePriorityScore(a));
            m.put("bedReserved", a.getBed() != null && Boolean.TRUE.equals(a.getBed().getIsReserved()));
            m.put("reservationExpiry", a.getReservationExpiresAt());
            
            // Add resource requirement info
            List<String> requirements = new ArrayList<>();
            boolean awaitingApproval = false;
            
            if (a.getBed() != null) {
                requirements.add("Bed in " + a.getBed().getRoom().getRoomType().getName());
            }
            if (a.getDoctor() != null) {
                requirements.add("Dr. " + a.getDoctor().getName() + " (" + a.getDoctor().getCategory().getName() + ")");
                if (Boolean.TRUE.equals(a.getDoctor().getIsAvailable()) && Boolean.TRUE.equals(a.getDoctor().getPendingApproval())) {
                    awaitingApproval = true;
                }
            }
            if (a.getLockedEquipment() != null) {
                for (Equipment eq : a.getLockedEquipment()) {
                    requirements.add(eq.getEquipmentName());
                }
            }
            m.put("requirements", requirements);
            m.put("awaitingApproval", awaitingApproval);
            
            result.add(m);
        }
        return ResponseEntity.ok(result);
    }

    // POST approve doctor re-assignment
    @PostMapping("/approve-doctor/{doctorId}")
    @Transactional
    public ResponseEntity<String> approveDoctor(@PathVariable Long doctorId) {
        Doctor doc = doctorRepo.findById(doctorId).orElseThrow();
        doc.setPendingApproval(false);
        doctorRepo.save(doc);
        
        // Now that the doctor is actually free, process the queue
        queueService.processQueue();
        
        return ResponseEntity.ok("Doctor approved and ready for re-assignment.");
    }
}
