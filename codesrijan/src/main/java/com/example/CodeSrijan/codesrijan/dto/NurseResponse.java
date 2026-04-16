package com.example.CodeSrijan.codesrijan.dto;

import java.util.List;

public class NurseResponse {
    private long totalNurses;
    private List<NurseDetails> nurses;

    public NurseResponse(long totalNurses, List<NurseDetails> nurses) {
        this.totalNurses = totalNurses;
        this.nurses = nurses;
    }

    public long getTotalNurses() { return totalNurses; }
    public void setTotalNurses(long totalNurses) { this.totalNurses = totalNurses; }

    public List<NurseDetails> getNurses() { return nurses; }
    public void setNurses(List<NurseDetails> nurses) { this.nurses = nurses; }

    public static class NurseDetails {
        private String name;
        private Integer experienceYears;

        public NurseDetails(String name, Integer experienceYears) {
            this.name = name;
            this.experienceYears = experienceYears;
        }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public Integer getExperienceYears() { return experienceYears; }
        public void setExperienceYears(Integer experienceYears) { this.experienceYears = experienceYears; }
    }
}
