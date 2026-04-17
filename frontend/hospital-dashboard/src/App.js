import React, { useState, useEffect } from 'react';
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

/** Send browser GPS coords to backend once so weather is location-accurate. */
function sendLocationToBackend(lat, lon) {
    fetch('http://localhost:8080/api/weather/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lon })
    })
    .then(() => console.log(`[Location] Sent lat=${lat.toFixed(4)} lon=${lon.toFixed(4)} to backend`))
    .catch(err => console.warn('[Location] Could not send location:', err));
}

function App() {
    const [page, setPage] = useState('facility');
    const [refresh, setRefresh] = useState(0);
    const triggerRefresh = () => setRefresh(r => r + 1);

    // Ask for location permission once on app load
    useEffect(() => {
        if (!navigator.geolocation) {
            console.warn('[Location] Geolocation not supported by this browser.');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => sendLocationToBackend(pos.coords.latitude, pos.coords.longitude),
            (err) => console.warn('[Location] Permission denied or error:', err.message)
        );
    }, []); // empty deps = runs once on mount

    return (
        <div className="app-container">
            {/* ── Modern Navigation Bar ── */}
            <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1.5rem' }}>
                <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className="logo-icon" style={{ background: '#0066FF', color: 'white', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', fontSize: '1.5rem', fontWeight: 'bold' }}>
                        C
                    </div>
                    <div className="logo-text">
                        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#1E293B', letterSpacing: '-0.5px' }}>CODESRIJAN</h1>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B', fontWeight: 500, letterSpacing: '1px' }}>HOSPITAL MANAGEMENT</p>
                    </div>
                </div>

                <nav style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    {NAV.map(n => (
                        <button
                            key={n.id}
                            onClick={() => setPage(n.id)}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                fontSize: '1rem', fontWeight: page === n.id ? 700 : 500,
                                color: page === n.id ? '#0066FF' : '#64748B',
                                padding: '0.5rem 0',
                                position: 'relative', transition: 'color 0.2s'
                            }}
                        >
                            {n.label}
                            {page === n.id && (
                                <div style={{ position: 'absolute', bottom: '-26px', left: 0, right: 0, height: '3px', background: '#0066FF', borderRadius: '3px 3px 0 0' }} />
                            )}
                        </button>
                    ))}
                </nav>
            </div>

            {/* ── Pages ── */}
            {page === 'facility' && (
                <>
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '2rem', color: '#1E293B', margin: 0, fontWeight: 700 }}>Facility Capacity Management</h2>
                        <p style={{ color: '#64748B', margin: '0.5rem 0 0', fontSize: '1rem' }}>Configure room types, number of rooms and beds per room.</p>
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
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '2rem', color: '#1E293B', margin: 0, fontWeight: 700 }}>Medical Personnel Database</h2>
                        <p style={{ color: '#64748B', margin: '0.5rem 0 0', fontSize: '1rem' }}>Register doctors by specialty and nursing staff.</p>
                    </div>
                    <div className="main-content">
                        <DoctorManager onDoctorAdded={triggerRefresh} />
                        <DoctorList refreshTrigger={refresh} />
                    </div>
                </>
            )}

            {page === 'admissions' && (
                <>
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '2rem', color: '#1E293B', margin: 0, fontWeight: 700 }}>Patient Admissions & Booking</h2>
                        <p style={{ color: '#64748B', margin: '0.5rem 0 0', fontSize: '1rem' }}>Admit patients, assign beds, lock doctors and nurses securely.</p>
                    </div>
                    <AdmissionPage />
                </>
            )}
        </div>
    );
}

export default App;
