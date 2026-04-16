package com.example.CodeSrijan.codesrijan.repository;

import com.example.CodeSrijan.codesrijan.entity.DoctorCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface DoctorCategoryRepository extends JpaRepository<DoctorCategory, Long> {
    Optional<DoctorCategory> findByName(String name);
}
