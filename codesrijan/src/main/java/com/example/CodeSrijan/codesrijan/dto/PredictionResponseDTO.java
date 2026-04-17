package com.example.CodeSrijan.codesrijan.dto;

public class PredictionResponseDTO {
    private String equipment;
    private Integer predictedDemand;
    private Integer currentlyAvailable;
    private String error;

    public PredictionResponseDTO() {}

    public PredictionResponseDTO(String equipment, Integer predictedDemand, Integer currentlyAvailable, String error) {
        this.equipment = equipment;
        this.predictedDemand = predictedDemand;
        this.currentlyAvailable = currentlyAvailable;
        this.error = error;
    }

    public String getEquipment() { return equipment; }
    public void setEquipment(String equipment) { this.equipment = equipment; }
    public Integer getPredictedDemand() { return predictedDemand; }
    public void setPredictedDemand(Integer predictedDemand) { this.predictedDemand = predictedDemand; }
    public Integer getCurrentlyAvailable() { return currentlyAvailable; }
    public void setCurrentlyAvailable(Integer currentlyAvailable) { this.currentlyAvailable = currentlyAvailable; }
    public String getError() { return error; }
    public void setError(String error) { this.error = error; }
}
