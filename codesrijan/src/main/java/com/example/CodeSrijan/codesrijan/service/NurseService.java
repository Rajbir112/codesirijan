package com.example.CodeSrijan.codesrijan.service;

import com.example.CodeSrijan.codesrijan.dto.NurseRequest;
import com.example.CodeSrijan.codesrijan.dto.NurseResponse;
import com.example.CodeSrijan.codesrijan.entity.Nurse;
import com.example.CodeSrijan.codesrijan.repository.NurseRepository;
import com.example.CodeSrijan.codesrijan.repository.PatientAdmissionRepository;
import com.example.CodeSrijan.codesrijan.entity.PatientAdmission;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class NurseService {

    @Autowired
    private NurseRepository nurseRepository;

    @Autowired
    private PatientAdmissionRepository admissionRepository;

    public Nurse addNurse(NurseRequest request) {
        Nurse nurse = new Nurse(request.getName(), request.getExperienceYears());
        return nurseRepository.save(nurse);
    }

    @Transactional
    public void deleteNurse(Long id) {
        Nurse nurse = nurseRepository.findById(id).orElseThrow(() -> new RuntimeException("Nurse not found"));
        
        // Verify if there is an ACTUAL active admission in the database
        boolean hasActiveAdmission = admissionRepository.existsByNurses_IdAndStatus(id, "ACTIVE");
        
        if (hasActiveAdmission) {
             throw new RuntimeException("Cannot delete nurse assigned to an active admission.");
        }
        
        List<PatientAdmission> pastAdmissions = admissionRepository.findByNurses_Id(id);
        for(PatientAdmission a : pastAdmissions) {
            a.getNurses().remove(nurse);
            admissionRepository.save(a);
        }
        
        nurseRepository.delete(nurse);
    }

    public NurseResponse getNurseStats() {
        List<Nurse> nurses = nurseRepository.findAll();
        List<NurseResponse.NurseDetails> detailsList = new ArrayList<>();
        
        for (Nurse n : nurses) {
            detailsList.add(new NurseResponse.NurseDetails(n.getId(), n.getName(), n.getExperienceYears()));
        }
        
        return new NurseResponse(nurses.size(), detailsList);
    }
}
