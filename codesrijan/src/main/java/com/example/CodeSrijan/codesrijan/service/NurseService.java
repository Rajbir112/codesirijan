package com.example.CodeSrijan.codesrijan.service;

import com.example.CodeSrijan.codesrijan.dto.NurseRequest;
import com.example.CodeSrijan.codesrijan.dto.NurseResponse;
import com.example.CodeSrijan.codesrijan.entity.Nurse;
import com.example.CodeSrijan.codesrijan.repository.NurseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class NurseService {

    @Autowired
    private NurseRepository nurseRepository;

    public Nurse addNurse(NurseRequest request) {
        Nurse nurse = new Nurse(request.getName(), request.getExperienceYears());
        return nurseRepository.save(nurse);
    }

    public NurseResponse getNurseStats() {
        List<Nurse> nurses = nurseRepository.findAll();
        List<NurseResponse.NurseDetails> detailsList = new ArrayList<>();
        
        for (Nurse n : nurses) {
            detailsList.add(new NurseResponse.NurseDetails(n.getName(), n.getExperienceYears()));
        }
        
        return new NurseResponse(nurses.size(), detailsList);
    }
}
