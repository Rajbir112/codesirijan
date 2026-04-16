package com.example.CodeSrijan.codesrijan.service;

import com.example.CodeSrijan.codesrijan.dto.CapacityRequest;
import com.example.CodeSrijan.codesrijan.dto.InventoryResponse;
import com.example.CodeSrijan.codesrijan.entity.Bed;
import com.example.CodeSrijan.codesrijan.entity.Room;
import com.example.CodeSrijan.codesrijan.entity.RoomType;
import com.example.CodeSrijan.codesrijan.repository.BedRepository;
import com.example.CodeSrijan.codesrijan.repository.RoomRepository;
import com.example.CodeSrijan.codesrijan.repository.RoomTypeRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class HospitalCapacityService {

    @Autowired
    private RoomTypeRepository roomTypeRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private BedRepository bedRepository;

    @Transactional
    public void generateCapacity(CapacityRequest request) {
        RoomType roomType = roomTypeRepository.findByName(request.getRoomTypeName())
                .orElseGet(() -> roomTypeRepository.save(new RoomType(request.getRoomTypeName())));

        long existingCount = roomRepository.findByRoomTypeId(roomType.getId()).size();

        for (int i = 1; i <= request.getNumberOfRooms(); i++) {
            String roomNumber = getAcronym(request.getRoomTypeName()) + "-" + (existingCount + i);
            Room room = new Room(roomNumber, roomType);
            room = roomRepository.save(room);

            List<Bed> beds = new ArrayList<>();
            for (int j = 1; j <= request.getBedsPerRoom(); j++) {
                String bedNumber = "B" + j;
                beds.add(new Bed(bedNumber, room));
            }
            bedRepository.saveAll(beds);
        }
    }

    public List<InventoryResponse> getInventory() {
        List<InventoryResponse> responses = new ArrayList<>();
        List<RoomType> allTypes = roomTypeRepository.findAll();
        
        for (RoomType rt : allTypes) {
            List<Room> rooms = roomRepository.findByRoomTypeId(rt.getId());
            long totalBeds = 0;
            for (Room r : rooms) {
                totalBeds += bedRepository.findByRoomId(r.getId()).size();
            }
            responses.add(new InventoryResponse(rt.getName(), rooms.size(), totalBeds));
        }
        return responses;
    }

    private String getAcronym(String name) {
        StringBuilder acronym = new StringBuilder();
        for (String word : name.split(" ")) {
            if (!word.isEmpty() && Character.isLetter(word.charAt(0))) {
                acronym.append(Character.toUpperCase(word.charAt(0)));
            }
        }
        return acronym.toString().length() > 0 ? acronym.toString() : "RM";
    }
}
