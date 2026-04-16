package com.example.CodeSrijan.codesrijan.repository;

import com.example.CodeSrijan.codesrijan.entity.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    List<Doctor> findByCategoryId(Long categoryId);
}
