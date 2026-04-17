import React, { useState, useEffect } from 'react';
import {
    fetchAdmissionRoomTypes,
    fetchAdmissionRooms,
    fetchAdmissionBeds,
    fetchAdmissionDoctorCategories,
    fetchAdmissionDoctors,
    fetchAdmissionNurses,
    fetchAdmissionEquipmentCategories,
    fetchAdmissionEquipmentItems,
    lockAdmission,
    fetchActiveAdmissions,
    dischargePatient,
    fetchEquipmentDemandForecast,
    fetchWaitingAdmissions,
    approveDoctor,
    forceAdmit,
    clearWaitingQueue,
    fetchDoctorStats
} from '../api';

const HIGH_CARE = [
    "Intensive Care Unit (ICU)",
    "High Dependency Unit (HDU)",
    "Isolation Room",
    "Recovery Room (Post-Operative)",
    "Pediatric / Neonatal Room"
];

const step = (num, label, active, done) => (
    <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.6rem 1rem', borderRadius: '8px', marginBottom: '0.5rem',
        background: done ? 'rgba(16,185,129,0.08)' : active ? 'rgba(0,102,255,0.08)' : 'transparent',
        border: `1px solid ${done ? 'rgba(16,185,129,0.3)' : active ? 'rgba(0,102,255,0.3)' : 'transparent'}`,
        transition: 'all 0.2s'
    }}>
        <div style={{
            width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0,
            background: done ? '#10B981' : active ? '#0066FF' : '#E2E8F0',
            color: done || active ? '#fff' : '#64748B'
        }}>
            {done ? '✓' : num}
        </div>
        <span style={{ fontSize: '0.9rem', color: done ? '#10B981' : active ? '#0066FF' : '#64748B', fontWeight: active ? 600 : 400 }}>
            {label}
        </span>
    </div>
);

export default function AdmissionPage() {
    const [tab, setTab] = useState('admit'); // 'admit' | 'active'
    const [refresh, setRefresh] = useState(0);

    // Form state
    const [roomTypes, setRoomTypes] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [beds, setBeds] = useState([]);
    const [docCats, setDocCats] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [nurses, setNurses] = useState([]);
    const [equipCats, setEquipCats] = useState([]);
    const [equipItems, setEquipItems] = useState([]);
    const [activeAdmissions, setActiveAdmissions] = useState([]);
    const [waitingAdmissions, setWaitingAdmissions] = useState([]);
    const [pendingDoctors, setPendingDoctors] = useState([]);

    const [sel, setSel] = useState({
        patientName: '', illness: '', criticality: 5,
        roomType: null, allowsDoctorNurse: false,
        roomId: '', bedId: '',
        docCatId: '', doctorId: '',
        nurseIds: [],
        equipmentCount: '',          // how many equipment slots
        equipmentSlots: []           // [{ cat, itemId, items }]
    });

    const [submitting, setSubmitting] = useState(false);
    const [msg, setMsg] = useState(null);

    const [analyzing, setAnalyzing] = useState(false);
    const [predictions, setPredictions] = useState([]);
    const [forecastMsg, setForecastMsg] = useState(null);

    const handleAnalyze = async () => {
        setAnalyzing(true);
        setForecastMsg(null);
        try {
            const data = await fetchEquipmentDemandForecast();
            setPredictions(data);
            setForecastMsg({ type: 'success', text: 'Demand forecast generated successfully!' });
        } catch (e) {
            setForecastMsg({ type: 'error', text: 'Failed to run ML model. Check backend logs.' });
        } finally {
            setAnalyzing(false);
        }
    };

    const loadRoomTypes = async () => {
        try { setRoomTypes(await fetchAdmissionRoomTypes()); } catch (e) { console.error(e); }
    };
    const loadActiveAdmissions = async () => {
        try { setActiveAdmissions(await fetchActiveAdmissions()); } catch (e) { console.error(e); }
    };
    const loadWaitingList = async () => {
        try { setWaitingAdmissions(await fetchWaitingAdmissions()); } catch (e) { console.error(e); }
    };
    const loadPendingDoctors = async () => {
        try {
            const stats = await fetchDoctorStats();
            const pending = [];
            stats.forEach(cat => {
                cat.doctors.forEach(d => {
                    if (d.pendingApproval) pending.push({ ...d, category: cat.categoryName });
                });
            });
            setPendingDoctors(pending);
        } catch (e) { console.error(e); }
    };

    // Auto-refresh queue and pending status
    useEffect(() => {
        const timer = setInterval(() => {
            loadWaitingList();
            loadPendingDoctors();
        }, 5000); // Check every 5s
        return () => clearInterval(timer);
    }, []);

    useEffect(() => { 
        loadRoomTypes(); 
        loadActiveAdmissions(); 
        loadWaitingList();
        loadPendingDoctors();
    }, [refresh]);

    const onRoomTypeChange = async (typeName, allowsDN) => {
        setSel({ patientName: sel.patientName, illness: sel.illness, roomType: typeName, allowsDoctorNurse: allowsDN, roomId: '', bedId: '', docCatId: '', doctorId: '', nurseIds: [], equipmentCount: '', equipmentSlots: [] });
        setBeds([]); setDocCats([]); setDoctors([]); setNurses([]); setEquipCats([]); setEquipItems([]);
        try { setRooms(await fetchAdmissionRooms(typeName)); } catch (e) { console.error(e); }
    };

    const onRoomChange = async (roomId) => {
        setSel(s => ({ ...s, roomId, bedId: '', docCatId: '', doctorId: '', nurseIds: [], equipmentCount: '', equipmentSlots: [] }));
        setDocCats([]); setDoctors([]); setNurses([]); setEquipCats([]); setEquipItems([]);
        try { setBeds(await fetchAdmissionBeds(roomId)); } catch (e) { console.error(e); }
    };

    const onBedChange = async (bedId) => {
        setSel(s => ({ ...s, bedId, docCatId: '', doctorId: '', nurseIds: [], equipmentCount: '', equipmentSlots: [] }));
        setDoctors([]); setNurses([]); setEquipItems([]);
        const fetches = [fetchAdmissionEquipmentCategories()];
        if (sel.allowsDoctorNurse) {
            fetches.push(fetchAdmissionDoctorCategories(), fetchAdmissionNurses());
        }
        try {
            const results = await Promise.all(fetches);
            setEquipCats(results[0]);
            if (sel.allowsDoctorNurse) {
                setDocCats(results[1]);
                setNurses(results[2]);
            }
        } catch (e) { console.error(e); }
    };

    const onDocCatChange = async (catId) => {
        setSel(s => ({ ...s, docCatId: catId, doctorId: '' }));
        try { setDoctors(await fetchAdmissionDoctors(catId)); } catch (e) { console.error(e); }
    };

    // ─── Multi-Equipment helpers ──────────────────────────
    const onEquipmentCountChange = (val) => {
        const n = Math.max(0, parseInt(val) || 0);
        setSel(s => {
            const current = s.equipmentSlots || [];
            const next = Array.from({ length: n }, (_, i) => current[i] || { cat: '', itemId: '', items: [] });
            return { ...s, equipmentCount: val, equipmentSlots: next };
        });
    };

    const onSlotCatChange = async (slotIdx, catName) => {
        setSel(s => {
            const slots = s.equipmentSlots.map((slot, i) => i === slotIdx ? { cat: catName, itemId: '', items: [] } : slot);
            return { ...s, equipmentSlots: slots };
        });
        if (catName) {
            try {
                const items = await fetchAdmissionEquipmentItems(catName);
                setSel(s => {
                    const slots = s.equipmentSlots.map((slot, i) => i === slotIdx ? { ...slot, items } : slot);
                    return { ...s, equipmentSlots: slots };
                });
            } catch (e) { console.error(e); }
        }
    };

    const onSlotItemChange = (slotIdx, itemId) => {
        setSel(s => {
            const slots = s.equipmentSlots.map((slot, i) => i === slotIdx ? { ...slot, itemId } : slot);
            return { ...s, equipmentSlots: slots };
        });
    };

    const toggleNurse = (id) => {
        setSel(s => ({
            ...s,
            nurseIds: s.nurseIds.includes(id) ? s.nurseIds.filter(n => n !== id) : [...s.nurseIds, id]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!sel.patientName || !sel.bedId) return;
        setSubmitting(true); setMsg(null);
        try {
            const resText = await lockAdmission({
                patientName: sel.patientName,
                illness: sel.illness,
                criticality: sel.criticality,
                bedId: sel.bedId,
                doctorId: sel.doctorId || null,
                nurseIds: sel.nurseIds,
                equipmentIds: (sel.equipmentSlots || []).map(s => s.itemId).filter(Boolean)
            });
            setMsg({ type: 'success', text: resText });
            setSel({ patientName: '', illness: '', criticality: 5, roomType: null, allowsDoctorNurse: false, roomId: '', bedId: '', docCatId: '', doctorId: '', nurseIds: [], equipmentCount: '', equipmentSlots: [] });
            setRooms([]); setBeds([]); setDocCats([]); setDoctors([]); setNurses([]); setEquipCats([]); setEquipItems([]);
            setRefresh(r => r + 1);
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to admit patient. Please try again.' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDischarge = async (id, name) => {
        if (!window.confirm(`Discharge ${name} and release all locked resources?`)) return;
        try {
            await dischargePatient(id);
            setRefresh(r => r + 1);
        } catch (e) { alert('Discharge failed.'); }
    };

    const handleForceAdmit = async (id) => {
        try {
            await forceAdmit(id);
            setMsg({ type: 'success', text: 'Patient forced to ACTIVE state!' });
            loadWaitingList();
            loadActiveAdmissions();
        } catch (e) { 
            setMsg({ type: 'danger', text: 'Force admit failed. Resources might still be busy.' });
        }
    };

    const handleClearWaiting = async () => {
        if (!window.confirm("Are you sure you want to clear the entire waiting queue? All reservations will be released.")) return;
        try {
            await clearWaitingQueue();
            setMsg({ type: 'success', text: 'Waiting queue cleared!' });
            loadWaitingList();
        } catch (e) { alert('Failed to clear queue.'); }
    };

    const handleApproveDoctor = async (id, name) => {
        try {
            await approveDoctor(id);
            setMsg({ type: 'success', text: `Dr. ${name} is now available and queue has been processed.` });
            setRefresh(r => r + 1);
        } catch (e) { alert('Approval failed.'); }
    };

    const isWaitlisted = () => {
        // Bed waitlist: if no bed selected or selected bed is not available
        const selBed = beds.find(b => b.id === Number(sel.bedId));
        if (selBed && !selBed.isAvailable) return true;

        // Doctor waitlist: if high care but no doctor selected or selected doctor is not available
        if (isHighCare) {
            const selDoc = doctors.find(d => d.id === Number(sel.doctorId));
            if (!selDoc || !selDoc.isAvailable) return true;
        }

        // Equipment waitlist: if any equipment slot has an item with 0 availability
        if (sel.equipmentSlots && sel.equipmentSlots.some(s => {
            const item = s.items.find(i => i.id === Number(s.itemId));
            return item && item.availableCount <= 0;
        })) return true;

        return false;
    };

    const isHighCare = HIGH_CARE.includes(sel.roomType);

    return (
        <div>
            {/* Sub-tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => setTab('admit')} style={{
                    padding: '0.65rem 1.5rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem',
                    background: tab === 'admit' ? '#0066FF' : '#FFFFFF',
                    color: tab === 'admit' ? '#fff' : '#64748B', border: tab === 'admit' ? '1px solid #0066FF' : '1px solid #E2E8F0',
                    boxShadow: tab === 'admit' ? '0 4px 12px rgba(0,102,255,0.2)' : 'none'
                }}>Admit Patient</button>
                <button onClick={() => setTab('active')} style={{
                    padding: '0.65rem 1.5rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem',
                    background: tab === 'active' ? '#10B981' : '#FFFFFF',
                    color: tab === 'active' ? '#fff' : '#64748B', border: tab === 'active' ? '1px solid #10B981' : '1px solid #E2E8F0',
                    boxShadow: tab === 'active' ? '0 4px 12px rgba(16,185,129,0.2)' : 'none',
                    position: 'relative'
                }}>
                    Active Patients
                    {activeAdmissions.length > 0 && (
                        <span style={{ marginLeft: '0.5rem', background: tab === 'active' ? '#fff' : '#EF4444', color: tab === 'active' ? '#10B981' : '#fff', borderRadius: '99px', padding: '2px 8px', fontSize: '0.78rem' }}>
                            {activeAdmissions.length}
                        </span>
                    )}
                </button>
                <button onClick={() => setTab('forecast')} style={{
                    padding: '0.65rem 1.5rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem',
                    background: tab === 'forecast' ? '#8B5CF6' : '#FFFFFF',
                    color: tab === 'forecast' ? '#fff' : '#64748B', border: tab === 'forecast' ? '1px solid #8B5CF6' : '1px solid #E2E8F0',
                    boxShadow: tab === 'forecast' ? '0 4px 12px rgba(139,92,246,0.2)' : 'none'
                }}>🔮 Demand Forecast</button>
                <button onClick={() => setTab('queue')} style={{
                    padding: '0.65rem 1.5rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem',
                    background: tab === 'queue' ? '#F59E0B' : '#FFFFFF',
                    color: tab === 'queue' ? '#fff' : '#64748B', border: tab === 'queue' ? '1px solid #F59E0B' : '1px solid #E2E8F0',
                    boxShadow: tab === 'queue' ? '0 4px 12px rgba(245,158,11,0.2)' : 'none',
                    position: 'relative'
                }}>
                    📋 Priority Queue
                    {waitingAdmissions.length > 0 && (
                        <span style={{ marginLeft: '0.5rem', background: '#fff', color: '#F59E0B', borderRadius: '99px', padding: '2px 8px', fontSize: '0.78rem' }}>
                            {waitingAdmissions.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Doctor Approval Notifications */}
            {pendingDoctors.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                    {pendingDoctors.map(d => (
                        <div key={d.id} style={{
                            background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: '12px', padding: '1rem',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(245,158,11,0.1)',
                            animation: 'slideDown 0.3s ease-out'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ fontSize: '1.5rem' }}>👨‍⚕️</div>
                                <div>
                                    <div style={{ fontWeight: 700, color: '#92400E' }}>Dr. {d.name} is now free!</div>
                                    <div style={{ fontSize: '0.85rem', color: '#B45309' }}>Specialty: {d.category} • Ready for re-assignment?</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => handleApproveDoctor(d.id, d.name)} style={{
                                    padding: '0.5rem 1rem', borderRadius: '8px', background: '#F59E0B', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer'
                                }}>Approve & Release to Queue</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {tab === 'admit' && (
                <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '2rem' }}>
                    {/* Progress sidebar */}
                    <div className="card" style={{ borderColor: '#E2E8F0', alignSelf: 'start', background: '#FFFFFF' }}>
                        <h3 style={{ fontSize: '1.05rem', color: '#1E293B', margin: '0 0 1rem 0' }}>Admission Steps</h3>
                        {step(1, 'Patient Details', !sel.patientName, sel.patientName)}
                        {step(2, 'Select Room Type', sel.patientName && !sel.roomType, !!sel.roomType)}
                        {step(3, 'Select Room', !!sel.roomType && !sel.roomId, !!sel.roomId)}
                        {step(4, 'Select Bed', !!sel.roomId && !sel.bedId, !!sel.bedId)}
                        {isHighCare ? <>
                            {step(5, 'Select Doctor Category', !!sel.bedId && !sel.docCatId, !!sel.docCatId)}
                            {step(6, 'Select Doctor', !!sel.docCatId && !sel.doctorId, !!sel.doctorId)}
                            {step(7, 'Select Nurses', !!sel.doctorId, sel.nurseIds.length > 0)}
                        </> : sel.bedId && (
                            <div style={{ padding: '0.6rem 1rem', marginTop: '0.5rem', borderRadius: '8px', background: '#FEF3C7', border: '1px solid #FDE68A', fontSize: '0.85rem', color: '#D97706' }}>
                                Room type: Bed-only assignment. No doctor/nurse locking required.
                            </div>
                        )}
                    </div>

                    {/* Main form */}
                    <div className="card" style={{ borderColor: '#E2E8F0', background: '#FFFFFF' }}>
                        <h2 className="card-title" style={{ color: '#1E293B', borderBottomColor: '#E2E8F0' }}>
                            🏥 Admit Patient & Lock Resources
                        </h2>

                        {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

                        <form onSubmit={handleSubmit}>
                            {/* Step 1: Patient Details */}
                            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
                                <div style={{ fontSize: '0.8rem', color: '#0066FF', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Step 1 — Patient Details</div>
                                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                                    <label style={{ color: '#1E293B', fontWeight: 500 }}>Patient Full Name *</label>
                                    <input type="text" className="form-control" placeholder="e.g. John Doe"
                                        value={sel.patientName} onChange={e => setSel(s => ({ ...s, patientName: e.target.value }))} required />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label style={{ color: '#1E293B', fontWeight: 500 }}>Condition / Illness</label>
                                    <input type="text" className="form-control" placeholder="e.g. Cardiac arrest"
                                        value={sel.illness} onChange={e => setSel(s => ({ ...s, illness: e.target.value }))} />
                                </div>
                                <div className="form-group" style={{ marginTop: '1rem', marginBottom: 0 }}>
                                    <label style={{ color: '#1E293B', fontWeight: 500 }}>Patient Criticality (1-10) *</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <input type="range" min="1" max="10" step="1"
                                            value={sel.criticality} onChange={e => setSel(s => ({ ...s, criticality: parseInt(e.target.value) }))}
                                            style={{ flex: 1, accentColor: sel.criticality > 7 ? '#EF4444' : sel.criticality > 4 ? '#F59E0B' : '#10B981' }} />
                                        <div style={{
                                            width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 700, fontSize: '1.2rem', background: sel.criticality > 7 ? '#FEF2F2' : sel.criticality > 4 ? '#FFFBEB' : '#ECFDF5',
                                            color: sel.criticality > 7 ? '#EF4444' : sel.criticality > 4 ? '#D97706' : '#10B981',
                                            border: `1px solid ${sel.criticality > 7 ? '#FECACA' : sel.criticality > 4 ? '#FDE68A' : '#A7F3D0'}`
                                        }}>
                                            {sel.criticality}
                                        </div>
                                    </div>
                                    <small style={{ color: '#64748B' }}>1 = Stable, 10 = Critical / Life Support Required</small>
                                </div>
                            </div>

                            {/* Step 2: Room Type */}
                            {sel.patientName && (
                                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#0066FF', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Step 2 — Room Type</div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label>Select Room Category</label>
                                        <select className="form-control" value={sel.roomType || ''} onChange={e => {
                                            const found = roomTypes.find(rt => rt.name === e.target.value);
                                            if (found) onRoomTypeChange(found.name, found.allowsDoctorNurse);
                                        }} required>
                                            <option value="">-- Choose Room Type --</option>
                                            {roomTypes.map(rt => (
                                                <option key={rt.name} value={rt.name}>
                                                    {rt.name} {rt.vacantBeds <= 0 ? '(Waitlist)' : `(${rt.vacantBeds} free)`}
                                                </option>
                                            ))}
                                        </select>
                                        {sel.roomType && (
                                            <small style={{ color: isHighCare ? '#0066FF' : '#D97706', marginTop: '0.4rem', display: 'block' }}>
                                                {isHighCare ? '⭐ High-care room: Doctor & Nurse assignment available' : '📋 Standard room: Bed assignment only'}
                                            </small>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Room */}
                            {sel.roomType && rooms.length > 0 && (
                                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#0066FF', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Step 3 — Select Room</div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label>Available Rooms (with vacant beds)</label>
                                        <select className="form-control" value={sel.roomId} onChange={e => onRoomChange(e.target.value)} required>
                                            <option value="">-- Select Room --</option>
                                            {rooms.map(r => (
                                                <option key={r.id} value={r.id}>
                                                    Room {r.roomNumber} {r.vacantBeds <= 0 ? '(Waitlist)' : `(${r.vacantBeds} free)`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Bed */}
                            {sel.roomId && beds.length > 0 && (
                                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#EF4444', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Step 4 — Assign Bed</div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label>Select Vacant Bed</label>
                                        <select className="form-control" value={sel.bedId} onChange={e => onBedChange(e.target.value)} required>
                                            <option value="">-- Select Bed --</option>
                                            {beds.map(b => (
                                                <option key={b.id} value={b.id}>
                                                    Bed {b.bedNumber} {!b.isAvailable ? '(Waitlist)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Steps 5-7: Doctor & Nurse (only for high-care rooms) */}
                            {sel.bedId && isHighCare && (
                                <>
                                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#0066FF', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Step 5 & 6 — Assign Doctor</div>
                                        <div className="form-group">
                                            <label>Doctor Specialty / Category</label>
                                            <select className="form-control" value={sel.docCatId} onChange={e => onDocCatChange(e.target.value)}>
                                                <option value="">-- Select Specialty --</option>
                                                {docCats.map(c => (
                                                    <option key={c.id} value={c.id}>
                                                        {c.name} {c.availableCount <= 0 ? '(Waitlist)' : `(${c.availableCount} free)`}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        {sel.docCatId && (
                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                <label>Select Doctor</label>
                                                <select className="form-control" value={sel.doctorId} onChange={e => setSel(s => ({ ...s, doctorId: e.target.value }))}>
                                                    <option value="">-- Select Doctor --</option>
                                                    {doctors.map(d => (
                                                        <option key={d.id} value={d.id}>
                                                            Dr. {d.name} {!d.isAvailable ? '(Waitlist)' : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                                {doctors.length === 0 && <small style={{ color: '#EF4444' }}>No available doctors in this category.</small>}
                                            </div>
                                        )}
                                    </div>

                                    {sel.doctorId !== undefined && sel.bedId && (
                                        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
                                            <div style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Step 7 — Assign Nurses (Optional)</div>
                                            {nurses.length === 0 ? (
                                                <p style={{ color: '#64748B', margin: 0, fontSize: '0.9rem' }}>No available nurses in the system.</p>
                                            ) : (
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                                    {nurses.map(n => (
                                                        <label key={n.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#1E293B', fontSize: '0.9rem' }}>
                                                            <input type="checkbox" checked={sel.nurseIds.includes(n.id)} onChange={() => toggleNurse(n.id)} style={{ accentColor: '#10B981', width: '16px', height: '16px' }} />
                                                            {n.name}
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}

                                    {/* Equipment Section — multi-slot */}
                            {sel.bedId && (
                                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#D97706', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🔧 Equipment Allocation (Optional)</div>

                                    {equipCats.length === 0 ? (
                                        <p style={{ color: '#64748B', margin: 0, fontSize: '0.85rem' }}>No equipment inventory found. Add equipment in Facility Capacity first.</p>
                                    ) : (
                                        <>
                                            {/* Step A: How many? */}
                                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                                <label style={{ color: '#92400E', fontWeight: 600 }}>How many equipment items do you need to allocate?</label>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.4rem' }}>
                                                    <input
                                                        type="number" min="0" max="20"
                                                        value={sel.equipmentCount}
                                                        onChange={e => onEquipmentCountChange(e.target.value)}
                                                        placeholder="e.g. 2"
                                                        style={{ width: '100px', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #FDE68A', fontSize: '1rem', background: '#FFFFFF', color: '#1E293B', outline: 'none' }}
                                                    />
                                                    <span style={{ color: '#92400E', fontSize: '0.88rem' }}>
                                                        {sel.equipmentSlots.length > 0 ? `→ ${sel.equipmentSlots.length} slot${sel.equipmentSlots.length > 1 ? 's' : ''} to fill` : 'Enter 0 to skip equipment'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Step B: Dynamic slots */}
                                            {sel.equipmentSlots.map((slot, idx) => (
                                                <div key={idx} style={{ background: '#FFFFFF', border: '1px solid #FDE68A', borderRadius: '8px', padding: '0.85rem', marginBottom: '0.75rem' }}>
                                                    <div style={{ fontSize: '0.78rem', color: '#D97706', fontWeight: 700, marginBottom: '0.6rem' }}>Equipment #{idx + 1}</div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                                            <label>Category</label>
                                                            <select className="form-control" value={slot.cat} onChange={e => onSlotCatChange(idx, e.target.value)}>
                                                                <option value="">-- Category --</option>
                                                                {equipCats.map(c => (
                                                                    <option key={c.name} value={c.name}>
                                                                        {c.name} {c.availableCount <= 0 ? '(Waitlist)' : `(${c.availableCount} avail)`}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                                            <label>Equipment</label>
                                                            <select className="form-control" value={slot.itemId} onChange={e => onSlotItemChange(idx, e.target.value)} disabled={!slot.cat}>
                                                                <option value="">-- Select --</option>
                                                                {(slot.items || []).map(ei => (
                                                                    <option key={ei.id} value={ei.id}>
                                                                        {ei.equipmentName} {ei.availableCount <= 0 ? '(Waitlist)' : `(${ei.availableCount} avail)`}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            {slot.cat && slot.items && slot.items.length === 0 && (
                                                                <small style={{ color: '#EF4444' }}>No available units.</small>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>
                            )}

                            {sel.bedId && (
                                <button type="submit" className="btn" style={{ background: '#EF4444', color: '#fff', border: 'none' }} disabled={submitting}>
                                    {submitting ? 'Admitting...' : '🔒 Confirm Admission & Lock Resources'}
                                </button>
                            )}
                        </form>
                    </div>
                </div>
            )}

            {tab === 'active' && (
                <div>
                    <h2 style={{ fontSize: '1.2rem', color: '#1E293B', marginBottom: '1.5rem', fontWeight: 600 }}>
                        Currently Active Patients ({activeAdmissions.length})
                    </h2>
                    {activeAdmissions.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', color: '#64748B', background: '#FFFFFF', border: '1px dashed #E2E8F0' }}>
                            <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>🏥</p>
                            <p>No active admissions. All resources are free.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
                            {activeAdmissions.map(a => (
                                <div key={a.id} className="card" style={{ borderColor: '#E2E8F0', padding: '1.25rem', background: '#FFFFFF', boxShadow: '0 2px 15px rgba(0,0,0,0.03)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1E293B' }}>{a.patientName}</div>
                                            {a.illness && <div style={{ fontSize: '0.88rem', color: '#64748B', marginTop: '2px' }}>{a.illness}</div>}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                            <span style={{ background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA', borderRadius: '99px', padding: '3px 10px', fontSize: '0.75rem', fontWeight: 600, flexShrink: 0 }}>
                                                ACTIVE
                                            </span>
                                            {a.criticality && (
                                                <div style={{
                                                    fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px',
                                                    background: a.criticality > 7 ? '#EF4444' : a.criticality > 4 ? '#F59E0B' : '#10B981',
                                                    color: '#fff'
                                                }}>
                                                    CRITICALITY: {a.criticality}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                                        <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '0.8rem', border: '1px solid #F1F5F9' }}>
                                            <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>Location</div>
                                            <div style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 600 }}>{a.roomType}</div>
                                            <div style={{ fontSize: '0.82rem', color: '#64748B' }}>Room {a.roomNumber} · Bed {a.bedNumber}</div>
                                        </div>
                                        <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '0.8rem', border: '1px solid #F1F5F9' }}>
                                            <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>Assigned Staff</div>
                                            {a.doctorName
                                                ? <div style={{ fontSize: '0.9rem', color: '#0066FF', fontWeight: 600 }}>Dr. {a.doctorName}</div>
                                                : <div style={{ fontSize: '0.85rem', color: '#94A3B8' }}>No doctor locked</div>
                                            }
                                            {a.nurseCount > 0
                                                ? <div style={{ fontSize: '0.82rem', color: '#10B981', fontWeight: 500 }}>{a.nurseCount} Nurse{a.nurseCount > 1 ? 's' : ''} locked</div>
                                                : <div style={{ fontSize: '0.82rem', color: '#94A3B8' }}>No nurses locked</div>
                                            }
                                        </div>
                                        {a.equipmentName && (
                                            <div style={{ background: '#FFFBEB', borderRadius: '8px', padding: '0.8rem', gridColumn: '1 / -1', border: '1px solid #FEF3C7' }}>
                                                <div style={{ fontSize: '0.72rem', color: '#D97706', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>Equipment Locked</div>
                                                <div style={{ fontSize: '0.9rem', color: '#B45309', fontWeight: 600 }}>🔧 {a.equipmentName}</div>
                                                <div style={{ fontSize: '0.78rem', color: '#D97706' }}>{a.equipmentCategory}</div>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => handleDischarge(a.id, a.patientName)}
                                        style={{ marginTop: '1rem', width: '100%', padding: '0.7rem', borderRadius: '8px', background: '#FFFFFF', color: '#EF4444', border: '1px solid #EF4444', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s' }}
                                        onMouseEnter={e => { e.target.style.background = '#FEF2F2'; }}
                                        onMouseLeave={e => { e.target.style.background = '#FFFFFF'; }}
                                    >
                                        Discharge & Unlock Resources
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {tab === 'forecast' && (
                <div className="card" style={{ borderColor: '#E2E8F0', padding: '1.5rem', background: '#FFFFFF' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.4rem', color: '#1E293B', margin: '0 0 0.5rem 0' }}>🔮 3-Day Equipment Demand Forecast</h2>
                            <p style={{ color: '#64748B', margin: 0, fontSize: '0.95rem' }}>
                                Analyzes hospital historical data strictly against the Random Forest ML Pipeline to predict future resource needs.
                            </p>
                        </div>
                        <button 
                            onClick={handleAnalyze} 
                            disabled={analyzing}
                            style={{ background: '#8B5CF6', color: '#fff', border: 'none', padding: '0.85rem 1.75rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '1rem', minWidth: '180px' }}>
                            {analyzing ? '⏳ Analyzing Data...' : '📊 Analyze Demand'}
                        </button>
                    </div>

                    {forecastMsg && <div className={`alert alert-${forecastMsg.type}`}>{forecastMsg.text}</div>}

                    {predictions.length > 0 && (
                        <div style={{ marginTop: '1.5rem', background: '#FFFFFF', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#F8FAFC', textAlign: 'left' }}>
                                        <th style={{ padding: '1.25rem', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 600 }}>Equipment Name</th>
                                        <th style={{ padding: '1.25rem', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 600 }}>Currently Available</th>
                                        <th style={{ padding: '1.25rem', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 600 }}>Predicted Demand (Next 3 Days)</th>
                                        <th style={{ padding: '1.25rem', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 600 }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {predictions.map((p, idx) => {
                                        if (p.error) {
                                            return (
                                                <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                                                    <td style={{ padding: '1rem', color: '#1E293B' }}>{p.equipment}</td>
                                                    <td colSpan="3" style={{ padding: '1rem', color: '#EF4444' }}>Error: {p.error}</td>
                                                </tr>
                                            );
                                        }

                                        const available = p.currentlyAvailable || 0;
                                        const demand = p.predictedDemand || 0;
                                        const isShortage = demand > available;
                                        
                                        return (
                                            <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0', background: isShortage ? '#FEF2F2' : 'transparent' }}>
                                                <td style={{ padding: '1.25rem', color: '#1E293B', fontWeight: 500, fontSize: '1.05rem' }}>{p.equipment}</td>
                                                <td style={{ padding: '1.25rem', color: '#64748B', fontSize: '1.05rem' }}>{available} units</td>
                                                <td style={{ padding: '1.25rem', color: isShortage ? '#EF4444' : '#1E293B', fontWeight: 'bold', fontSize: '1.1rem' }}>{demand} units</td>
                                                <td style={{ padding: '1.25rem' }}>
                                                    {isShortage ? (
                                                        <span style={{ background: '#FEE2E2', color: '#B91C1C', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600 }}>⚠️ Shortage Likely</span>
                                                    ) : (
                                                        <span style={{ background: '#D1FAE5', color: '#047857', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600 }}>✅ Sufficient</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {tab === 'queue' && (
                <div>
                    <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ fontSize: '1.3rem', color: '#1E293B', margin: '0 0 0.5rem 0' }}>📋 Resource Priority Queue</h2>
                            <p style={{ color: '#64748B', fontSize: '0.9rem', margin: 0 }}>
                                Patients are ranked by <strong>Urgency (Criticality)</strong> and <strong>Requirement Efficiency</strong>. 
                                Waitlisted patients receive <strong>+1 Criticality every hour</strong>.
                            </p>
                        </div>
                        {waitingAdmissions.length > 0 && (
                            <button 
                                onClick={handleClearWaiting}
                                style={{ background: '#FEE2E2', color: '#EF4444', border: '1px solid #FECACA', borderRadius: '8px', padding: '8px 16px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                                🗑️ Clear All Waiting
                            </button>
                        )}
                    </div>

                    {waitingAdmissions.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', color: '#64748B', border: '1px dashed #E2E8F0', padding: '3rem' }}>
                            <p style={{ fontSize: '3rem', margin: '0 0 1rem 0' }}>🍃</p>
                            <p>The queue is currently empty. No patients are waiting for resources.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {waitingAdmissions.map((a, idx) => (
                                <div key={a.id} className="card" style={{ 
                                    padding: '1.25rem', borderLeft: `6px solid ${a.criticality > 7 ? '#EF4444' : a.criticality > 4 ? '#F59E0B' : '#10B981'}`,
                                    background: a.bedReserved ? 'rgba(245,158,11,0.05)' : '#fff'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                                            <div style={{ 
                                                width: '40px', height: '40px', borderRadius: '50%', background: '#F1F5F9', 
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#64748B' 
                                            }}>#{idx + 1}</div>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1E293B' }}>{a.patientName}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#64748B' }}>
                                                    Waiting since: {a.waitingSince ? new Date(a.waitingSince).toLocaleTimeString() : 'N/A'}
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>Priority Score</div>
                                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1E293B' }}>{a.priorityScore ? a.priorityScore.toFixed(1) : '0.0'}</div>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.8rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                        <div style={{ background: '#F8FAFC', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.88rem' }}>
                                            <span style={{ color: '#64748B' }}>Criticality:</span> <strong style={{ color: a.criticality > 7 ? '#EF4444' : '#1E293B' }}>{a.criticality || '5'}/10</strong>
                                        </div>
                                        
                                        {a.bedReserved && (
                                            <div style={{ background: '#FFFBEB', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #FDE68A', fontSize: '0.88rem', color: '#D97706', fontWeight: 600 }}>
                                                🕒 Bed Reserved (Expires: {a.reservationExpiry ? new Date(a.reservationExpiry).toLocaleTimeString() : 'N/A'})
                                            </div>
                                        )}

                                        {a.awaitingApproval && (
                                            <div style={{ background: '#E0E7FF', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #C7D2FE', fontSize: '0.88rem', color: '#4338CA', fontWeight: 700, animation: 'pulse 2s infinite' }}>
                                                👨‍⚕️ Awaiting Doctor Approval
                                            </div>
                                        )}

                                        <button 
                                            onClick={() => handleForceAdmit(a.id)}
                                            style={{ marginLeft: 'auto', background: '#10B981', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                                        >
                                            ⚡ Force Admit
                                        </button>
                                    </div>

                                    {a.requirements && a.requirements.length > 0 && (
                                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #F1F5F9' }}>
                                            <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Resource Requirements:</div>
                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                {a.requirements.map((req, i) => (
                                                    <span key={i} style={{ 
                                                        background: '#F1F5F9', color: '#475569', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 500
                                                    }}>
                                                        {req}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
