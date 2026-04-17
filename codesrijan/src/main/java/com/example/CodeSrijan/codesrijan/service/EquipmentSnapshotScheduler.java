package com.example.CodeSrijan.codesrijan.service;

import com.example.CodeSrijan.codesrijan.entity.Equipment;
import com.example.CodeSrijan.codesrijan.entity.EquipmentUsageSnapshot;
import com.example.CodeSrijan.codesrijan.repository.EquipmentRepository;
import com.example.CodeSrijan.codesrijan.repository.EquipmentUsageSnapshotRepository;
import com.example.CodeSrijan.codesrijan.repository.PatientAdmissionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
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

    private static final String CSV_PATH   = "d:\\codesirijan\\new_data.csv";
    private static final int    BATCH_SIZE = 50;   // Increased so you can observe row accumulation in the DB

    // TODO: change back to 10_800_000 (3 hours) for production
    @Scheduled(fixedRate = 60_000) // 1 minute for testing
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

        // Check if batch is ready to export
        exportAndClearIfReady();
    }

    /**
     * When row count reaches BATCH_SIZE (500):
     *   1. Export all rows to equipment_data.csv at d:\codesirijan\
     *   2. Delete all rows so the next batch starts fresh
     * The notebook detects the CSV and trains / incrementally updates the model.
     */
    private void exportAndClearIfReady() {
        long total = snapshotRepo.count();
        System.out.printf("[Snapshot] Row count: %d / %d%n", total, BATCH_SIZE);

        if (total < BATCH_SIZE) return;

        System.out.println("[Snapshot] ╔════════════════════╗");
        System.out.println("[Snapshot] ║  BATCH READY — exporting  ║");
        System.out.println("[Snapshot] ╚════════════════════╝");

        List<EquipmentUsageSnapshot> rows = snapshotRepo.findAll();

        try (PrintWriter pw = new PrintWriter(new FileWriter(CSV_PATH))) {
            // CSV header
            pw.println("equipment,date,recorded_at," +
                       "total_patients_last_day,total_patients_last_7_days," +
                       "total_usage_last_day,total_usage_last_7_days," +
                       "value,is_holiday,is_weekend");

            for (EquipmentUsageSnapshot r : rows) {
                pw.printf("\"%s\",%s,%s,%d,%d,%d,%d,%d,%b,%b%n",
                    r.getEquipment(),
                    r.getDate(),
                    r.getRecordedAt(),
                    r.getTotalPatientsLastDay(),
                    r.getTotalPatientsLast7Days(),
                    r.getTotalUsageLastDay(),
                    r.getTotalUsageLast7Days(),
                    r.getValue(),
                    r.getIsHoliday(),
                    r.getIsWeekend()
                );
            }

            System.out.println("[Snapshot] ✓ CSV saved  → " + CSV_PATH);
        } catch (IOException e) {
            System.err.println("[Snapshot] ✗ CSV export failed: " + e.getMessage());
            return; // do NOT delete rows if export failed
        }

        snapshotRepo.deleteAll();
        System.out.println("[Snapshot] ✓ Table cleared — fresh batch starting.");

        // Trigger Python training automatically
        triggerPythonTraining();
    }

    /**
     * Launches train.py in the background using the system Python interpreter.
     * Output is streamed to the Spring Boot console so you can see training progress.
     */
    private void triggerPythonTraining() {
        System.out.println("[Snapshot] ► Triggering Python training ...");
        try {
            ProcessBuilder pb = new ProcessBuilder("python", "d:\\codesirijan\\train.py");
            pb.redirectErrorStream(true);   // merge stderr into stdout
            pb.directory(new java.io.File("d:\\codesirijan")); // working directory
            Process process = pb.start();

            // Stream Python output to Spring Boot console in a background thread
            new Thread(() -> {
                try (java.io.BufferedReader reader = new java.io.BufferedReader(
                        new java.io.InputStreamReader(process.getInputStream()))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        System.out.println("[Python] " + line);
                    }
                    int exitCode = process.waitFor();
                    if (exitCode == 0) {
                        System.out.println("[Snapshot] ✓ Model training completed successfully.");
                    } else {
                        System.err.println("[Snapshot] ✗ Python exited with code: " + exitCode);
                    }
                } catch (Exception e) {
                    System.err.println("[Snapshot] ✗ Training stream error: " + e.getMessage());
                }
            }, "python-trainer").start();

        } catch (Exception e) {
            System.err.println("[Snapshot] ✗ Could not start Python process: " + e.getMessage());
            System.err.println("[Snapshot]   Make sure 'python' is in your system PATH.");
        }
    }
}
