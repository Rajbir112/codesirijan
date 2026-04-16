package com.example.CodeSrijan.codesrijan.service;

import com.example.CodeSrijan.codesrijan.dto.DoctorRequest;
import com.example.CodeSrijan.codesrijan.dto.DoctorResponse;
import com.example.CodeSrijan.codesrijan.entity.Doctor;
import com.example.CodeSrijan.codesrijan.entity.DoctorCategory;
import com.example.CodeSrijan.codesrijan.repository.DoctorCategoryRepository;
import com.example.CodeSrijan.codesrijan.repository.DoctorRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class DoctorService {

    @Autowired
    private DoctorCategoryRepository categoryRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Transactional
    public Doctor addDoctor(DoctorRequest request) {
        DoctorCategory category = categoryRepository.findByName(request.getCategoryName())
                .orElseGet(() -> categoryRepository.save(new DoctorCategory(request.getCategoryName())));

        Doctor doctor = new Doctor(request.getName(), request.getEducation(), request.getExperienceYears(), category);
        return doctorRepository.save(doctor);
    }

    public List<DoctorResponse> getDoctorStats() {
        List<DoctorResponse> responses = new ArrayList<>();
        List<DoctorCategory> allCategories = categoryRepository.findAll();

        for (DoctorCategory category : allCategories) {
            List<Doctor> doctors = doctorRepository.findByCategoryId(category.getId());
            
            List<DoctorResponse.DoctorDetails> detailsList = new ArrayList<>();
            for (Doctor d : doctors) {
                detailsList.add(new DoctorResponse.DoctorDetails(d.getName(), d.getEducation(), d.getExperienceYears()));
            }

            responses.add(new DoctorResponse(category.getName(), doctors.size(), detailsList));
        }

        return responses;
    }
}
