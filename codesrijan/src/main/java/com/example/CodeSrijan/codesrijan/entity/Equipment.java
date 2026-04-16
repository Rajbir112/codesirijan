package com.example.CodeSrijan.codesrijan.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "equipment_inventory")
public class Equipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "category_name", nullable = false)
    private String categoryName;

    @Column(name = "equipment_name", nullable = false)
    private String equipmentName;

    @Column(nullable = false)
    private Integer count = 0;

    public Equipment() {}

    public Equipment(String categoryName, String equipmentName, Integer count) {
        this.categoryName = categoryName;
        this.equipmentName = equipmentName;
        this.count = count;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }
    public String getEquipmentName() { return equipmentName; }
    public void setEquipmentName(String equipmentName) { this.equipmentName = equipmentName; }
    public Integer getCount() { return count; }
    public void setCount(Integer count) { this.count = count; }
}
