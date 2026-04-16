package com.example.CodeSrijan.codesrijan.repository;

import com.example.CodeSrijan.codesrijan.entity.Bed;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BedRepository extends JpaRepository<Bed, Long> {
    List<Bed> findByRoomId(Long roomId);
}
