package com.example.CodeSrijan.codesrijan.service;

import com.example.CodeSrijan.codesrijan.entity.Equipment;
import com.example.CodeSrijan.codesrijan.entity.EquipmentUsageSnapshot;
import com.example.CodeSrijan.codesrijan.repository.EquipmentRepository;
import com.example.CodeSrijan.codesrijan.repository.EquipmentUsageSnapshotRepository;
import com.example.CodeSrijan.codesrijan.repository.PatientAdmissionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Fires every 3 hours.
 *
 * When the job fires at  recorded_at = R:
 *
 *   date  = R.toLocalDate() - 3 days        ← reference date
 *
 *   Historical windows (features):
 *     total_patients_last_day     = admissions in [date-1, date]
 *     total_patients_last_7_days  = admissions in [date-7, date]
 *     total_usage_last_day        = eq locked  in [date-1, date]
 *     total_usage_last_7_days     = eq locked  in [date-7, date]
 *
 *   Forward window (label / target):
 *     value  = eq locked in [date, R]   ← what the ML model should predict
 *
 *   Calendar features:
 *     is_weekend = is [date] Saturday or Sunday?
 *     is_holiday = does [date → R] contain any Indian public holiday?
 *
 * One row is written per equipment item with count > 0.
 */
@Service
public class EquipmentSnapshotScheduler {

    @Autowired private EquipmentRepository              equipmentRepo;
    @Autowired private EquipmentUsageSnapshotRepository snapshotRepo;
    @Autowired private PatientAdmissionRepository       admissionRepo;
    @Autowired private HolidayService                   holidayService;

    // Every 3 hours = 3 * 60 * 60 * 1000 ms
    @Scheduled(fixedRate = 10_800_000)
    public void collectSnapshot() {

        LocalDateTime recordedAt = LocalDateTime.now();
        LocalDate     refDate    = recordedAt.toLocalDate().minusDays(3);

        System.out.printf("%n[Snapshot] ═══════ Starting cycle ═══════%n");
        System.out.printf("[Snapshot] recorded_at = %s%n", recordedAt);
        System.out.printf("[Snapshot] date        = %s%n", refDate);

        // ── Date/time boundaries ──────────────────────────────────────────
        LocalDateTime dateStart      = refDate.atStartOfDay();                   // Mar 12 00:00
        LocalDateTime dateMinus1Start = refDate.minusDays(1).atStartOfDay();     // Mar 11 00:00
        LocalDateTime dateMinus7Start = refDate.minusDays(7).atStartOfDay();     // Mar 05 00:00

        // ── Patient counts (same for all equipment rows) ─────────────────
        long patientsLastDay    = admissionRepo.countByCreatedAtBetween(dateMinus1Start, dateStart);
        long patientsLast7Days  = admissionRepo.countByCreatedAtBetween(dateMinus7Start, dateStart);

        // ── Calendar flags ────────────────────────────────────────────────
        DayOfWeek dow       = refDate.getDayOfWeek();
        boolean isWeekend   = (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY);
        boolean isHoliday   = holidayService.hasHolidayInRange(refDate, recordedAt.toLocalDate());

        System.out.printf("[Snapshot] is_weekend=%b  is_holiday=%b  patients_day=%d  patients_7d=%d%n",
                isWeekend, isHoliday, patientsLastDay, patientsLast7Days);

        // ── Equipment rows ────────────────────────────────────────────────
        List<Equipment> active = equipmentRepo.findAll().stream()
                .filter(e -> e.getCount() > 0)
                .collect(Collectors.toList());

        if (active.isEmpty()) {
            System.out.println("[Snapshot] No active equipment – skipping.");
            return;
        }

        for (Equipment eq : active) {

            // Historical usage (features)
            long usageLastDay   = admissionRepo.countByEquipmentAndCreatedAtBetween(
                    eq.getId(), dateMinus1Start, dateStart);
            long usageLast7Days = admissionRepo.countByEquipmentAndCreatedAtBetween(
                    eq.getId(), dateMinus7Start, dateStart);

            // Forward usage (label) — [date → recorded_at]
            long labelValue = admissionRepo.countByEquipmentAndCreatedAtBetween(
                    eq.getId(), dateStart, recordedAt);

            EquipmentUsageSnapshot snap = new EquipmentUsageSnapshot();
            snap.setEquipment(eq.getEquipmentName());
            snap.setDate(refDate);
            snap.setRecordedAt(recordedAt);
            snap.setTotalPatientsLastDay(patientsLastDay);
            snap.setTotalPatientsLast7Days(patientsLast7Days);
            snap.setTotalUsageLastDay(usageLastDay);
            snap.setTotalUsageLast7Days(usageLast7Days);
            snap.setValue(labelValue);
            snap.setIsHoliday(isHoliday);
            snap.setIsWeekend(isWeekend);

            snapshotRepo.save(snap);

            System.out.printf("[Snapshot] %-40s | use_day=%d use_7d=%d | val=%d%n",
                    eq.getEquipmentName(), usageLastDay, usageLast7Days, labelValue);
        }

        System.out.printf("[Snapshot] Done — %d rows written.%n%n", active.size());
    }
}
