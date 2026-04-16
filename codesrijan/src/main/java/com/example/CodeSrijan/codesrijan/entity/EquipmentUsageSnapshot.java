package com.example.CodeSrijan.codesrijan.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "equipment_usage_snapshot")
public class EquipmentUsageSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** equipment name e.g. "Ventilators" */
    @Column(name = "equipment", nullable = false)
    private String equipment;

    /** minute value = (current_minute - 1), i.e. m-1 in 0-59 range */
    @Column(name = "minute", nullable = false)
    private Integer minute;

    /** exact timestamp when this snapshot was recorded */
    @Column(name = "recorded_at")
    private LocalDateTime recordedAt;

    /** patients admitted in window [now-2min, now-1min] */
    @Column(name = "total_patients_last_1min")
    private Long totalPatientsLast1min;

    /** patients admitted in window [now-6min, now-1min] */
    @Column(name = "total_patients_last_5min")
    private Long totalPatientsLast5min;

    /** times THIS equipment was locked in window [now-2min, now-1min] */
    @Column(name = "total_usage_last_1min")
    private Long totalUsageLast1min;

    /** times THIS equipment was locked in window [now-6min, now-1min] */
    @Column(name = "total_usage_last_5min")
    private Long totalUsageLast5min;

    /**
     * Target / label:
     * times THIS equipment was locked in window [now-1min, now]
     */
    @Column(name = "value")
    private Long value;

    /** Weather at snapshot time e.g. "Partly Cloudy, +34°C" */
    @Column(name = "weather")
    private String weather;

    public EquipmentUsageSnapshot() {}

    // ── Getters & Setters ─────────────────────────────────────
    public Long getId() { return id; }
    public String getEquipment() { return equipment; }
    public void setEquipment(String e) { this.equipment = e; }
    public Integer getMinute() { return minute; }
    public void setMinute(Integer m) { this.minute = m; }
    public LocalDateTime getRecordedAt() { return recordedAt; }
    public void setRecordedAt(LocalDateTime t) { this.recordedAt = t; }
    public Long getTotalPatientsLast1min() { return totalPatientsLast1min; }
    public void setTotalPatientsLast1min(Long v) { this.totalPatientsLast1min = v; }
    public Long getTotalPatientsLast5min() { return totalPatientsLast5min; }
    public void setTotalPatientsLast5min(Long v) { this.totalPatientsLast5min = v; }
    public Long getTotalUsageLast1min() { return totalUsageLast1min; }
    public void setTotalUsageLast1min(Long v) { this.totalUsageLast1min = v; }
    public Long getTotalUsageLast5min() { return totalUsageLast5min; }
    public void setTotalUsageLast5min(Long v) { this.totalUsageLast5min = v; }
    public Long getValue() { return value; }
    public void setValue(Long v) { this.value = v; }
    public String getWeather() { return weather; }
    public void setWeather(String w) { this.weather = w; }
}
