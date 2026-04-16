package com.example.CodeSrijan.codesrijan.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "doctor_category")
public class DoctorCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String name;

    public DoctorCategory() {}

    public DoctorCategory(String name) {
        this.name = name;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}
