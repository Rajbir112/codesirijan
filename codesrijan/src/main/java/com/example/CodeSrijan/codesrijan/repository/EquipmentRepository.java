package com.example.CodeSrijan.codesrijan.repository;

import com.example.CodeSrijan.codesrijan.entity.Equipment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface EquipmentRepository extends JpaRepository<Equipment, Long> {
    List<Equipment> findByCategoryName(String categoryName);
    Optional<Equipment> findByCategoryNameAndEquipmentName(String categoryName, String equipmentName);
}
