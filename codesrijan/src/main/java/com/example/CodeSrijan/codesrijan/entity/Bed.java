package com.example.CodeSrijan.codesrijan.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "bed")
public class Bed {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bed_number", nullable = false)
    private String bedNumber;

    @ManyToOne
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    public Bed() {}

    public Bed(String bedNumber, Room room) {
        this.bedNumber = bedNumber;
        this.room = room;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getBedNumber() { return bedNumber; }
    public void setBedNumber(String bedNumber) { this.bedNumber = bedNumber; }

    public Room getRoom() { return room; }
    public void setRoom(Room room) { this.room = room; }
}
