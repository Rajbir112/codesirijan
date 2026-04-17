package com.example.CodeSrijan.codesrijan.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "patient_admission")
public class PatientAdmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "patient_name", nullable = false)
    private String patientName;

    private String illness;

    @ManyToOne
    @JoinColumn(name = "bed_id", nullable = false)
    private Bed bed;

    @ManyToOne
    @JoinColumn(name = "doctor_id")
    private Doctor doctor;

    @ManyToMany
    @JoinTable(
        name = "patient_nurse",
        joinColumns = @JoinColumn(name = "admission_id"),
        inverseJoinColumns = @JoinColumn(name = "nurse_id")
    )
    private List<Nurse> nurses;

    @ManyToMany
    @JoinTable(
        name = "patient_equipment",
        joinColumns = @JoinColumn(name = "admission_id"),
        inverseJoinColumns = @JoinColumn(name = "equipment_id")
    )
    private List<Equipment> lockedEquipment;

    @Column(nullable = false)
    private String status = "ACTIVE";

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) this.createdAt = LocalDateTime.now();
    }

    public PatientAdmission() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getPatientName() { return patientName; }
    public void setPatientName(String s) { this.patientName = s; }
    public String getIllness() { return illness; }
    public void setIllness(String s) { this.illness = s; }
    public Bed getBed() { return bed; }
    public void setBed(Bed b) { this.bed = b; }
    public Doctor getDoctor() { return doctor; }
    public void setDoctor(Doctor d) { this.doctor = d; }
    public List<Nurse> getNurses() { return nurses; }
    public void setNurses(List<Nurse> n) { this.nurses = n; }
    public List<Equipment> getLockedEquipment() { return lockedEquipment; }
    public void setLockedEquipment(List<Equipment> e) { this.lockedEquipment = e; }
    public String getStatus() { return status; }
    public void setStatus(String s) { this.status = s; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime t) { this.createdAt = t; }
}
