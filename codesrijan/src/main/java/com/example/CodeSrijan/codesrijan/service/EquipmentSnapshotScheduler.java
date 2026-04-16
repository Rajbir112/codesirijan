package com.example.CodeSrijan.codesrijan.service;

import com.example.CodeSrijan.codesrijan.entity.Equipment;
import com.example.CodeSrijan.codesrijan.entity.EquipmentUsageSnapshot;
import com.example.CodeSrijan.codesrijan.repository.EquipmentRepository;
import com.example.CodeSrijan.codesrijan.repository.EquipmentUsageSnapshotRepository;
import com.example.CodeSrijan.codesrijan.repository.PatientAdmissionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Fires every 3 minutes.
 * At fire time  m  (current minute):
 *   - stored minute      = m - 1
 *   - patients_last_1min = admissions in [m-2, m-1]
 *   - patients_last_5min = admissions in [m-6, m-1]
 *   - usage_last_1min    = this-equipment locks in [m-2, m-1]
 *   - usage_last_5min    = this-equipment locks in [m-6, m-1]
 *   - value              = this-equipment locks in [m-1, m]   ← label/target
 *
 * One row is written per equipment item that has count > 0.
 */
@Service
public class EquipmentSnapshotScheduler {

    @Autowired private EquipmentRepository            equipmentRepo;
    @Autowired private EquipmentUsageSnapshotRepository snapshotRepo;
    @Autowired private PatientAdmissionRepository     admissionRepo;
    @Autowired private WeatherService                 weatherService;

    // Every 3 minutes  (3 * 60 * 1000 ms)
    @Scheduled(fixedRate = 180_000)
    public void collectSnapshot() {

        LocalDateTime now     = LocalDateTime.now();

        // Window boundaries
        LocalDateTime mMinus1 = now.minusMinutes(1);   // m-1
        LocalDateTime mMinus2 = now.minusMinutes(2);   // m-2
        LocalDateTime mMinus6 = now.minusMinutes(6);   // m-6

        // Stored minute value = current_minute - 1  (0-59 wrap)
        int storedMinute = now.getMinute() - 1;
        if (storedMinute < 0) storedMinute = 59;

        // ── Patient admission counts (same for every equipment row) ──
        long patientsLast1min = admissionRepo.countByCreatedAtBetween(mMinus2, mMinus1);
        long patientsLast5min = admissionRepo.countByCreatedAtBetween(mMinus6, mMinus1);

        // ── Fetch weather once per cycle ──
        String weather = weatherService.getCurrentWeather();
        System.out.println("[Snapshot] Weather: " + weather);

        // ── Only equipment items that exist in inventory (count > 0) ──
        List<Equipment> active = equipmentRepo.findAll().stream()
                .filter(e -> e.getCount() > 0)
                .collect(Collectors.toList());

        if (active.isEmpty()) {
            System.out.println("[Snapshot] No active equipment found – skipping.");
            return;
        }

        for (Equipment eq : active) {

            long usageLast1min = admissionRepo.countByEquipmentAndCreatedAtBetween(
                    eq.getId(), mMinus2, mMinus1);

            long usageLast5min = admissionRepo.countByEquipmentAndCreatedAtBetween(
                    eq.getId(), mMinus6, mMinus1);

            // label: how many times was this equipment locked in [m-1, now]
            long labelValue = admissionRepo.countByEquipmentAndCreatedAtBetween(
                    eq.getId(), mMinus1, now);

            EquipmentUsageSnapshot snap = new EquipmentUsageSnapshot();
            snap.setEquipment(eq.getEquipmentName());
            snap.setMinute(storedMinute);
            snap.setRecordedAt(now);
            snap.setTotalPatientsLast1min(patientsLast1min);
            snap.setTotalPatientsLast5min(patientsLast5min);
            snap.setTotalUsageLast1min(usageLast1min);
            snap.setTotalUsageLast5min(usageLast5min);
            snap.setValue(labelValue);
            snap.setWeather(weather);

            snapshotRepo.save(snap);

            System.out.printf("[Snapshot] %-40s | min=%-2d | pts1m=%d pts5m=%d | use1m=%d use5m=%d | val=%d%n",
                    eq.getEquipmentName(), storedMinute,
                    patientsLast1min, patientsLast5min,
                    usageLast1min, usageLast5min, labelValue);
        }

        System.out.printf("[Snapshot] Done at %s – %d rows written.%n", now, active.size());
    }
}
