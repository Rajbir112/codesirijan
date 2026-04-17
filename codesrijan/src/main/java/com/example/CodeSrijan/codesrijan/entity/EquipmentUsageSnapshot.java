package com.example.CodeSrijan.codesrijan.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "equipment_usage_snapshot")
public class EquipmentUsageSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Equipment name e.g. "Ventilators" */
    @Column(name = "equipment", nullable = false)
    private String equipment;

    /**
     * Reference date = recorded_at - 3 days.
     * All historical windows are relative to this date.
     */
    @Column(name = "date", nullable = false)
    private LocalDate date;

    /** Exact timestamp when this snapshot row was saved */
    @Column(name = "recorded_at")
    private LocalDateTime recordedAt;

    /** Total patient admissions in [date-1, date] */
    @Column(name = "total_patients_last_day")
    private Long totalPatientsLastDay;

    /** Total patient admissions in [date-7, date] */
    @Column(name = "total_patients_last_7_days")
    private Long totalPatientsLast7Days;

    /** Times THIS equipment was locked in [date-1, date] */
    @Column(name = "total_usage_last_day")
    private Long totalUsageLastDay;

    /** Times THIS equipment was locked in [date-7, date] */
    @Column(name = "total_usage_last_7_days")
    private Long totalUsageLast7Days;

    /**
     * TARGET / LABEL:
     * Times THIS equipment was locked in [date, recorded_at] (forward 3-day window).
     */
    @Column(name = "value")
    private Long value;

    /** True if any Indian public holiday falls in [date, recorded_at] */
    @Column(name = "is_holiday")
    private Boolean isHoliday;

    /** True if the reference date is Saturday or Sunday */
    @Column(name = "is_weekend")
    private Boolean isWeekend;

    public EquipmentUsageSnapshot() {}

    // ── Getters & Setters ──────────────────────────────────────────────
    public Long getId() { return id; }
    public String getEquipment() { return equipment; }
    public void setEquipment(String e) { this.equipment = e; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate d) { this.date = d; }
    public LocalDateTime getRecordedAt() { return recordedAt; }
    public void setRecordedAt(LocalDateTime t) { this.recordedAt = t; }
    public Long getTotalPatientsLastDay() { return totalPatientsLastDay; }
    public void setTotalPatientsLastDay(Long v) { this.totalPatientsLastDay = v; }
    public Long getTotalPatientsLast7Days() { return totalPatientsLast7Days; }
    public void setTotalPatientsLast7Days(Long v) { this.totalPatientsLast7Days = v; }
    public Long getTotalUsageLastDay() { return totalUsageLastDay; }
    public void setTotalUsageLastDay(Long v) { this.totalUsageLastDay = v; }
    public Long getTotalUsageLast7Days() { return totalUsageLast7Days; }
    public void setTotalUsageLast7Days(Long v) { this.totalUsageLast7Days = v; }
    public Long getValue() { return value; }
    public void setValue(Long v) { this.value = v; }
    public Boolean getIsHoliday() { return isHoliday; }
    public void setIsHoliday(Boolean h) { this.isHoliday = h; }
    public Boolean getIsWeekend() { return isWeekend; }
    public void setIsWeekend(Boolean w) { this.isWeekend = w; }
}
