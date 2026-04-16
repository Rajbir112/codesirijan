package com.example.CodeSrijan.codesrijan.repository;

import com.example.CodeSrijan.codesrijan.entity.RoomType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface RoomTypeRepository extends JpaRepository<RoomType, Long> {
    Optional<RoomType> findByName(String name);
}
