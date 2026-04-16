package com.example.CodeSrijan.codesrijan.repository;

import com.example.CodeSrijan.codesrijan.entity.PatientAdmission;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PatientAdmissionRepository extends JpaRepository<PatientAdmission, Long> {
    List<PatientAdmission> findByStatus(String status);
}
