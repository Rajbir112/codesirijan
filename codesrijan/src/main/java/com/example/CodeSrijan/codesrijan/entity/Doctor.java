package com.example.CodeSrijan.codesrijan.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "doctor")
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String education;

    @Column(name = "experience_years")
    private Integer experienceYears;

    @ManyToOne
    @JoinColumn(name = "category_id", nullable = false)
    private DoctorCategory category;

    public Doctor() {}

    public Doctor(String name, String education, Integer experienceYears, DoctorCategory category) {
        this.name = name;
        this.education = education;
        this.experienceYears = experienceYears;
        this.category = category;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEducation() { return education; }
    public void setEducation(String education) { this.education = education; }

    public Integer getExperienceYears() { return experienceYears; }
    public void setExperienceYears(Integer experienceYears) { this.experienceYears = experienceYears; }

    public DoctorCategory getCategory() { return category; }
    public void setCategory(DoctorCategory category) { this.category = category; }
}
