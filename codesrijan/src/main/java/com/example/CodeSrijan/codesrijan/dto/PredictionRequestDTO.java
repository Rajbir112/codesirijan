package com.example.CodeSrijan.codesrijan.dto;

public class PredictionRequestDTO {
    private String equipment;
    private Boolean isHoliday;
    private Boolean isWeekend;
    private Long totalPatientsLast7Days;
    private Long totalPatientsLastDay;
    private Long totalUsageLast7Days;
    private Long totalUsageLastDay;

    public PredictionRequestDTO() {}

    public PredictionRequestDTO(String equipment, Boolean isHoliday, Boolean isWeekend, Long totalPatientsLast7Days, Long totalPatientsLastDay, Long totalUsageLast7Days, Long totalUsageLastDay) {
        this.equipment = equipment;
        this.isHoliday = isHoliday;
        this.isWeekend = isWeekend;
        this.totalPatientsLast7Days = totalPatientsLast7Days;
        this.totalPatientsLastDay = totalPatientsLastDay;
        this.totalUsageLast7Days = totalUsageLast7Days;
        this.totalUsageLastDay = totalUsageLastDay;
    }

    public String getEquipment() { return equipment; }
    public void setEquipment(String equipment) { this.equipment = equipment; }
    public Boolean getIsHoliday() { return isHoliday; }
    public void setIsHoliday(Boolean isHoliday) { this.isHoliday = isHoliday; }
    public Boolean getIsWeekend() { return isWeekend; }
    public void setIsWeekend(Boolean isWeekend) { this.isWeekend = isWeekend; }
    public Long getTotalPatientsLast7Days() { return totalPatientsLast7Days; }
    public void setTotalPatientsLast7Days(Long totalPatientsLast7Days) { this.totalPatientsLast7Days = totalPatientsLast7Days; }
    public Long getTotalPatientsLastDay() { return totalPatientsLastDay; }
    public void setTotalPatientsLastDay(Long totalPatientsLastDay) { this.totalPatientsLastDay = totalPatientsLastDay; }
    public Long getTotalUsageLast7Days() { return totalUsageLast7Days; }
    public void setTotalUsageLast7Days(Long totalUsageLast7Days) { this.totalUsageLast7Days = totalUsageLast7Days; }
    public Long getTotalUsageLastDay() { return totalUsageLastDay; }
    public void setTotalUsageLastDay(Long totalUsageLastDay) { this.totalUsageLastDay = totalUsageLastDay; }
}
