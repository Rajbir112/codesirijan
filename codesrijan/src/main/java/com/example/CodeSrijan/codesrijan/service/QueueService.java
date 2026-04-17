package com.example.CodeSrijan.codesrijan.service;

import com.example.CodeSrijan.codesrijan.entity.*;
import com.example.CodeSrijan.codesrijan.repository.*;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class QueueService {

    @Autowired private PatientAdmissionRepository admissionRepo;
    @Autowired private EquipmentRepository equipmentRepo;
    @Autowired private BedRepository bedRepo;
    @Autowired private DoctorRepository doctorRepo;

    private static final double ALPHA = 100.0; // Criticality weight
    private static final double BETA = 10.0;   // Efficiency weight (1/units)
    private static final int RESERVATION_WINDOW_MINUTES = 15;

    /**
     * Calculate priority score for a waiting patient.
     * Score = (ALPHA * Criticality) + (BETA * (1 / unitsNeeded))
     */
    public double calculatePriorityScore(PatientAdmission a) {
        int criticality = a.getCriticality() != null ? a.getCriticality() : 5;
        int unitsNeeded = (a.getLockedEquipment() != null ? a.getLockedEquipment().size() : 0) + 1; // +1 to avoid div by zero
        
        return (ALPHA * criticality) + (BETA * (1.0 / unitsNeeded));
    }

    /**
     * Escalates criticality by +1 every hour for waiting patients (max 10).
     */
    @Scheduled(fixedRate = 3600000) // 1 hour
    @Transactional
    public void escalateCriticality() {
        List<PatientAdmission> waiting = admissionRepo.findByStatus("WAITING");
        for (PatientAdmission a : waiting) {
            int current = a.getCriticality() != null ? a.getCriticality() : 5;
            if (current < 10) {
                a.setCriticality(current + 1);
                admissionRepo.save(a);
            }
        }
    }

    /**
     * Periodically check for expired reservations.
     */
    @Scheduled(fixedRate = 60000) // 1 minute
    @Transactional
    public void checkReservationTimeouts() {
        List<PatientAdmission> waiting = admissionRepo.findByStatus("WAITING");
        LocalDateTime now = LocalDateTime.now();

        for (PatientAdmission a : waiting) {
            if (a.getReservationExpiresAt() != null && a.getReservationExpiresAt().isBefore(now)) {
                releaseReservation(a);
            }
        }
    }

    @Transactional
    public void releaseReservation(PatientAdmission a) {
        // Release held beds
        if (a.getBed() != null) {
            a.getBed().setIsReserved(false);
            bedRepo.save(a.getBed());
        }

        // Release held equipment
        if (a.getReservedEquipment() != null) {
            for (Equipment eq : a.getReservedEquipment()) {
                eq.setLockedCount(Math.max(0, eq.getLockedCount() - 1));
                equipmentRepo.save(eq);
            }
            a.getReservedEquipment().clear();
        }

        a.setReservationExpiresAt(null);
        admissionRepo.save(a);
    }

    /**
     * Core logic to try and allocate resources to waiting patients.
     * Triggered whenever a resource is freed.
     */
    @Transactional
    public void processQueue() {
        List<PatientAdmission> waiting = admissionRepo.findByStatus("WAITING");
        if (waiting.isEmpty()) return;

        // Sort by priority score DESC, then by waitingSince ASC
        waiting.sort((a, b) -> {
            double scoreA = calculatePriorityScore(a);
            double scoreB = calculatePriorityScore(b);
            if (scoreB != scoreA) return Double.compare(scoreB, scoreA);
            return a.getWaitingSince().compareTo(b.getWaitingSince());
        });

        for (PatientAdmission a : waiting) {
            tryAllocation(a);
        }
    }

    private void tryAllocation(PatientAdmission a) {
        // 1. Check Bed
        // If bed is not available AND it's not reserved specifically for this admission, we can't allocate.
        if (a.getBed() != null) {
            boolean bedIsAvailable = Boolean.TRUE.equals(a.getBed().getIsAvailable());
            // A bed is okay if it's either available OR it was reserved specifically for this admission
            boolean bedIsReservedForMe = Boolean.TRUE.equals(a.getBed().getIsReserved()) && 
                                        a.getBed().getIsReserved(); // In a real app, track reservation owner
            
            if (!bedIsAvailable && !bedIsReservedForMe) return; 
        }

        // 2. Check Doctor (High Care only)
        if (a.getDoctor() != null) {
            if (!Boolean.TRUE.equals(a.getDoctor().getIsAvailable()) || Boolean.TRUE.equals(a.getDoctor().getPendingApproval())) {
                return; 
            }
        }

        // 3. Check Equipment
        List<Equipment> needed = a.getLockedEquipment();
        if (needed == null) needed = new ArrayList<>();
        
        List<Equipment> reservedForMe = a.getReservedEquipment();
        if (reservedForMe == null) reservedForMe = new ArrayList<>();

        boolean allEquipmentAvailable = true;
        for (Equipment eq : needed) {
            // It's available if (availableCount > 0) OR (it's already reserved for me)
            if (eq.getAvailableCount() <= 0 && !reservedForMe.contains(eq)) {
                allEquipmentAvailable = false;
                break;
            }
        }

        if (allEquipmentAvailable) {
            finalizeAdmission(a);
        } else {
            // See if we can reserve anything new
            startReservation(a);
        }
    }

    private void finalizeAdmission(PatientAdmission a) {
        a.setStatus("ACTIVE");
        a.setWaitingSince(null);
        a.setReservationExpiresAt(null);
        
        // Finalize Bed
        a.getBed().setIsAvailable(false);
        a.getBed().setIsReserved(false);
        bedRepo.save(a.getBed());

        // Finalize Equipment
        // (Assuming they were already marked as reserved or we mark them now)
        for (Equipment eq : a.getLockedEquipment()) {
            // If it was already reserved, it's already counted in lockedCount
            if (a.getReservedEquipment() == null || !a.getReservedEquipment().contains(eq)) {
                eq.setLockedCount(eq.getLockedCount() + 1);
                equipmentRepo.save(eq);
            }
        }
        if (a.getReservedEquipment() != null) a.getReservedEquipment().clear();

        admissionRepo.save(a);
    }

    private void startReservation(PatientAdmission a) {
        List<Equipment> reserved = a.getReservedEquipment();
        if (reserved == null) reserved = new ArrayList<>();
        
        boolean newlyReserved = false;
        for (Equipment eq : a.getLockedEquipment()) {
            // If not already reserved by me, and a unit is free
            if (!reserved.contains(eq) && eq.getAvailableCount() > 0) {
                eq.setLockedCount(eq.getLockedCount() + 1);
                equipmentRepo.save(eq);
                reserved.add(eq);
                newlyReserved = true;
            }
        }
        
        if (newlyReserved || a.getReservationExpiresAt() == null) {
            a.setReservedEquipment(reserved);
            a.setReservationExpiresAt(LocalDateTime.now().plusMinutes(15));
            admissionRepo.save(a);
        }
    }
}
