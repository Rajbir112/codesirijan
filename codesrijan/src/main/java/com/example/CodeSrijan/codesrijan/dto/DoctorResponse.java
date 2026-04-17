package com.example.CodeSrijan.codesrijan.dto;

import java.util.List;

public class DoctorResponse {
    private String categoryName;
    private long totalDoctors;
    private List<DoctorDetails> doctors;

    public DoctorResponse(String categoryName, long totalDoctors, List<DoctorDetails> doctors) {
        this.categoryName = categoryName;
        this.totalDoctors = totalDoctors;
        this.doctors = doctors;
    }

    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

    public long getTotalDoctors() { return totalDoctors; }
    public void setTotalDoctors(long totalDoctors) { this.totalDoctors = totalDoctors; }

    public List<DoctorDetails> getDoctors() { return doctors; }
    public void setDoctors(List<DoctorDetails> doctors) { this.doctors = doctors; }

    public static class DoctorDetails {
        private Long id;
        private String name;
        private String education;
        private Integer experienceYears;

        public DoctorDetails(Long id, String name, String education, Integer experienceYears) {
            this.id = id;
            this.name = name;
            this.education = education;
            this.experienceYears = experienceYears;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getEducation() { return education; }
        public void setEducation(String education) { this.education = education; }

        public Integer getExperienceYears() { return experienceYears; }
        public void setExperienceYears(Integer experienceYears) { this.experienceYears = experienceYears; }
    }
}
