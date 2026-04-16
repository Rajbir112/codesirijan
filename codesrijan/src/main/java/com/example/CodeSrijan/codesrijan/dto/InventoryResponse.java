package com.example.CodeSrijan.codesrijan.dto;

public class InventoryResponse {
    private String roomTypeName;
    private long totalRooms;
    private long totalBeds;

    public InventoryResponse(String roomTypeName, long totalRooms, long totalBeds) {
        this.roomTypeName = roomTypeName;
        this.totalRooms = totalRooms;
        this.totalBeds = totalBeds;
    }

    public String getRoomTypeName() { return roomTypeName; }
    public void setRoomTypeName(String roomTypeName) { this.roomTypeName = roomTypeName; }

    public long getTotalRooms() { return totalRooms; }
    public void setTotalRooms(long totalRooms) { this.totalRooms = totalRooms; }

    public long getTotalBeds() { return totalBeds; }
    public void setTotalBeds(long totalBeds) { this.totalBeds = totalBeds; }
}
