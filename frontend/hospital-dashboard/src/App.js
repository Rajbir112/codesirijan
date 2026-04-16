import React, { useState } from 'react';
import './index.css';
import CapacityManager from './components/CapacityManager';
import InventoryDashboard from './components/InventoryDashboard';
import DoctorManager from './components/DoctorManager';
import DoctorList from './components/DoctorList';
import AdmissionPage from './components/AdmissionPage';
import EquipmentInventory from './components/EquipmentInventory';

const NAV = [
    { id: 'facility', label: '🏗️ Facility Capacity', color: '#3b82f6' },
    { id: 'personnel', label: '👨‍⚕️ Medical Personnel', color: '#8b5cf6' },
    { id: 'admissions', label: '🔒 Patient Booking', color: '#ef4444' },
];

function App() {
    const [page, setPage] = useState('facility');
    const [refresh, setRefresh] = useState(0);
    const triggerRefresh = () => setRefresh(r => r + 1);

    return (
        <div className="app-container">
            {/* ── Header ── */}
            <div className="header">
                <h1>Hospital Operations Center</h1>
                <p>Resource Management · Medical Personnel · Patient Admissions</p>
            </div>

            {/* ── Navigation Tabs ── */}
            <nav style={{
                display: 'flex', gap: '1rem', marginBottom: '2.5rem',
                background: 'rgba(30,41,59,0.6)', backdropFilter: 'blur(12px)',
                padding: '0.75rem', borderRadius: '14px',
                border: '1px solid rgba(255,255,255,0.08)'
            }}>
                {NAV.map(n => (
                    <button
                        key={n.id}
                        onClick={() => setPage(n.id)}
                        style={{
                            flex: 1, padding: '0.8rem 1rem', borderRadius: '10px',
                            fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer',
                            transition: 'all 0.2s',
                            background: page === n.id
                                ? `linear-gradient(135deg, ${n.color}cc, ${n.color}88)`
                                : 'transparent',
                            color: page === n.id ? '#fff' : '#94a3b8',
                            border: page === n.id
                                ? `1px solid ${n.color}66`
                                : '1px solid transparent',
                            boxShadow: page === n.id ? `0 4px 12px ${n.color}33` : 'none'
                        }}
                    >
                        {n.label}
                    </button>
                ))}
            </nav>

            {/* ── Pages ── */}
            {page === 'facility' && (
                <>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.4rem', color: '#93c5fd', margin: 0 }}>Facility Capacity Management</h2>
                        <p style={{ color: '#64748b', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>Configure room types, number of rooms and beds per room</p>
                    </div>
                    <div className="main-content">
                        <CapacityManager onCapacityAdded={triggerRefresh} />
                        <InventoryDashboard refreshTrigger={refresh} />
                    </div>
                    <EquipmentInventory />
                </>
            )}

            {page === 'personnel' && (
                <>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.4rem', color: '#c4b5fd', margin: 0 }}>Medical Personnel Database</h2>
                        <p style={{ color: '#64748b', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>Register doctors by specialty and nursing staff</p>
                    </div>
                    <div className="main-content">
                        <DoctorManager onDoctorAdded={triggerRefresh} />
                        <DoctorList refreshTrigger={refresh} />
                    </div>
                </>
            )}

            {page === 'admissions' && (
                <>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.4rem', color: '#fca5a5', margin: 0 }}>Patient Admissions & Resource Booking</h2>
                        <p style={{ color: '#64748b', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>Admit patients, assign beds, lock doctors and nurses</p>
                    </div>
                    <AdmissionPage />
                </>
            )}
        </div>
    );
}

export default App;
