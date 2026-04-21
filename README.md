🏥 Predictive Hospital Resource Management System
👉 Predicting Demand. Optimizing Care. Saving Lives.

📌 Overview

In high-pressure healthcare environments, delays in allocating critical resources like ICU beds, oxygen cylinders, and medical equipment can cost lives.
This project presents a Predictive Hospital Resource Management System that combines Machine Learning + Operating System scheduling to make real-time, intelligent allocation decisions.

🚀 Key Idea
Instead of reacting to demand, the system:

✔️ Predicts future resource needs using ML
✔️ Prioritizes patients intelligently
✔️ Allocates resources in real time

🧠 Core Features
📊 Demand Prediction → Random Forest model using recent hospital data
⚡ Real-Time Allocation → Instant decisions under high load
🎯 Priority-Based Scheduling → Critical patients handled first
🔒 Atomic Allocation → No conflicts / no double booking
📈 Efficient Resource Utilization → Reduced delays & wastage
🧩 AI + OS Integration → Unique hybrid approach

⚙️ System Architecture
Frontend: React (Vercel)
Backend: Spring Boot (REST APIs)
Database: PostgreSQL (Supabase)
ML Module: Python (Random Forest)
Deployment: Docker + Railway

⚙️ Smart Allocation (OS-Based Logic)
We implemented a modified Non-Preemptive Priority Scheduling system:

Data Structure: Max Heap / Priority Queue
Scheduling: Non-preemptive (no interruption after allocation)
Ranking Factors:
Criticality (primary)
Resource urgency
Arrival time

📐 Priority Formula
Priority = α(Criticality) + β(Urgency) − γ(Arrival Time)

👉 Higher score = Higher priority

🔄 Allocation Flow
Patient enters priority queue
System checks resource availability
Highest priority patient selected
Resource allocated (non-preemptive)

🔒 Additional Mechanisms
Reservation System → Holds resources for critical patients
Aging Technique → Prevents starvation over time

❓ Why Priority Scheduling (Not HRRN)?
Focuses on severity (life-critical cases)
Enables faster decision-making
More suitable for real-time healthcare systems

🌐 Live Demo
👉 https://codesirijan-gi7l.vercel.app/

📊 Impact
⏱️ Reduced decision-making delays
🏥 Improved handling of multiple patients
📈 Better utilization of limited resources
⚡ Faster, data-driven hospital operations

🔮 Future Improvements
Integration with IoT-based real-time hospital data
Advanced ML models (XGBoost, LSTM)
Multi-hospital resource sharing system
Advanced analytics dashboard


⭐ Support
If you found this project interesting, consider giving it a ⭐ on GitHub!

💭 Final Thought

This system doesn’t just manage resources —
it predicts demand and makes intelligent, real-time decisions that can directly impact patient outcomes.
