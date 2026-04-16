package com.example.CodeSrijan.codesrijan.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "nurse")
public class Nurse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "experience_years")
    private Integer experienceYears;

    public Nurse() {}

    public Nurse(String name, Integer experienceYears) {
        this.name = name;
        this.experienceYears = experienceYears;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getExperienceYears() { return experienceYears; }
    public void setExperienceYears(Integer experienceYears) { this.experienceYears = experienceYears; }
}
