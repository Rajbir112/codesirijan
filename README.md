🏥 Smart Hospital Resource Allocation System
🚀 Overview

This project presents an intelligent system for allocating hospital resources (ICU beds, ventilators, etc.) efficiently using advanced data structures and scheduling techniques. It ensures that critical patients receive timely care while maintaining fairness across all patients.

⚡ Key Features
Priority-Based Scheduling
Patients are managed using a max-heap (priority queue) based on criticality, urgency, and arrival time.
Dynamic Priority Formula
A continuously updated priority system ensures fair and accurate decision-making.
Non-Preemptive Allocation
Once resources are assigned to a patient, they are not interrupted, ensuring stability in treatment.
Reservation Mechanism
Critical patients can have resources reserved in advance to avoid delays.
Aging (Anti-Starvation)
Prevents long waiting times by gradually increasing the priority of waiting patients.

🧠 Problem Statement
During crises like COVID-19, many lives were lost due to delayed access to critical resources such as ICU beds and oxygen. Hospitals often lacked an efficient system to prioritize patients dynamically.

👉 This project aims to solve that problem by optimizing resource allocation in real-time.

🛠️ Tech/Concepts Used
Data Structures: Priority Queue (Max Heap)
Algorithms: Greedy + Scheduling + Aging Technique
Concepts:
Non-preemptive scheduling
Fair resource allocation
Dynamic prioritization
🔄 How It Works
Patients enter the system with attributes like:
Criticality
Urgency
Arrival time
A priority score is computed dynamically.
Patients are inserted into a max heap.
Resources are allocated based on highest priority.
Aging ensures long-waiting patients eventually get priority.
🎯 Advantages
Reduces patient waiting time
Ensures fairness in allocation
Handles emergency cases effectively
Scalable for real-world hospital systems
📌 Future Improvements
Integration with real-time hospital databases
AI-based prediction for resource demand
Dashboard for hospital administrators
IoT integration for live resource tracking
👥 Team

Team Name: AVATAR
Team Leader: Sourav Kumar

💡 Tagline

“Saving lives through smarter resource allocation.”
