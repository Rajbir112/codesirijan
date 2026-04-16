package com.example.CodeSrijan.codesrijan.repository;

import com.example.CodeSrijan.codesrijan.entity.PatientAdmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

public interface PatientAdmissionRepository extends JpaRepository<PatientAdmission, Long> {

    List<PatientAdmission> findByStatus(String status);

    /** Count ALL admissions with createdAt in [start, end] */
    @Query("SELECT COUNT(pa) FROM PatientAdmission pa WHERE pa.createdAt BETWEEN :start AND :end")
    long countByCreatedAtBetween(@Param("start") LocalDateTime start,
                                 @Param("end")   LocalDateTime end);

    /** Count admissions WHERE a specific equipment was locked, createdAt in [start, end] */
    @Query("SELECT COUNT(pa) FROM PatientAdmission pa " +
           "JOIN pa.lockedEquipment eq " +
           "WHERE eq.id = :equipmentId AND pa.createdAt BETWEEN :start AND :end")
    long countByEquipmentAndCreatedAtBetween(@Param("equipmentId") Long equipmentId,
                                             @Param("start")       LocalDateTime start,
                                             @Param("end")         LocalDateTime end);
}
