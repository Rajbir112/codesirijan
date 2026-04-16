import React, { useState } from 'react';
import './index.css';
import CapacityManager from './components/CapacityManager';
import InventoryDashboard from './components/InventoryDashboard';
import DoctorManager from './components/DoctorManager';
import DoctorList from './components/DoctorList';

function App() {
  const [roomRefreshTrigger, setRoomRefreshTrigger] = useState(0);
  const [docRefreshTrigger, setDocRefreshTrigger] = useState(0);

  const handleCapacityAdded = () => {
    setRoomRefreshTrigger(prev => prev + 1);
  };

  const handleDoctorAdded = () => {
    setDocRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="app-container">
      <div className="header">
        <h1>Hospital Resource Management</h1>
        <p>Dynamic Capacity & Inventory Command Center</p>
      </div>

      {/* Row 1: Room Management */}
      <h2 style={{ fontSize: '1.5rem', color: '#e2e8f0', marginTop: '2rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Facility Management</h2>
      <div className="main-content" style={{ marginBottom: '3rem' }}>
        <div>
          <CapacityManager onCapacityAdded={handleCapacityAdded} />
        </div>
        <div>
          <InventoryDashboard refreshTrigger={roomRefreshTrigger} />
        </div>
      </div>

      {/* Row 2: Doctor Management */}
      <h2 style={{ fontSize: '1.5rem', color: '#e2e8f0', marginTop: '2rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Medical Personnel</h2>
      <div className="main-content">
        <div>
          <DoctorManager onDoctorAdded={handleDoctorAdded} />
        </div>
        <div>
          <DoctorList refreshTrigger={docRefreshTrigger} />
        </div>
      </div>
    </div>
  );
}

export default App;
