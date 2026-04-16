package com.example.CodeSrijan.codesrijan.dto;

public class CapacityRequest {
    private String roomTypeName;
    private int numberOfRooms;
    private int bedsPerRoom;

    public CapacityRequest() {}

    public String getRoomTypeName() { return roomTypeName; }
    public void setRoomTypeName(String roomTypeName) { this.roomTypeName = roomTypeName; }

    public int getNumberOfRooms() { return numberOfRooms; }
    public void setNumberOfRooms(int numberOfRooms) { this.numberOfRooms = numberOfRooms; }

    public int getBedsPerRoom() { return bedsPerRoom; }
    public void setBedsPerRoom(int bedsPerRoom) { this.bedsPerRoom = bedsPerRoom; }
}
