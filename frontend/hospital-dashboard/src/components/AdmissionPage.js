import React, { useState, useEffect } from 'react';
import {
    fetchAdmissionRoomTypes,
    fetchAdmissionRooms,
    fetchAdmissionBeds,
    fetchAdmissionDoctorCategories,
    fetchAdmissionDoctors,
    fetchAdmissionNurses,
    lockAdmission,
    fetchActiveAdmissions,
    dischargePatient
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
        background: done ? 'rgba(16,185,129,0.08)' : active ? 'rgba(99,102,241,0.12)' : 'transparent',
        border: `1px solid ${done ? 'rgba(16,185,129,0.3)' : active ? 'rgba(99,102,241,0.4)' : 'transparent'}`,
        transition: 'all 0.2s'
    }}>
        <div style={{
            width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0,
            background: done ? '#10b981' : active ? '#6366f1' : 'rgba(255,255,255,0.1)',
            color: done || active ? '#fff' : '#94a3b8'
        }}>
            {done ? '✓' : num}
        </div>
        <span style={{ fontSize: '0.9rem', color: done ? '#34d399' : active ? '#a5b4fc' : '#94a3b8', fontWeight: active ? 600 : 400 }}>
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
    const [activeAdmissions, setActiveAdmissions] = useState([]);

    const [sel, setSel] = useState({
        patientName: '', illness: '',
        roomType: null, allowsDoctorNurse: false,
        roomId: '', bedId: '',
        docCatId: '', doctorId: '',
        nurseIds: []
    });

    const [submitting, setSubmitting] = useState(false);
    const [msg, setMsg] = useState(null);

    // Load room types on mount / refresh
    useEffect(() => { loadRoomTypes(); loadActiveAdmissions(); }, [refresh]);

    const loadRoomTypes = async () => {
        try { setRoomTypes(await fetchAdmissionRoomTypes()); } catch (e) { console.error(e); }
    };
    const loadActiveAdmissions = async () => {
        try { setActiveAdmissions(await fetchActiveAdmissions()); } catch (e) { console.error(e); }
    };

    const onRoomTypeChange = async (typeName, allowsDN) => {
        setSel({ patientName: sel.patientName, illness: sel.illness, roomType: typeName, allowsDoctorNurse: allowsDN, roomId: '', bedId: '', docCatId: '', doctorId: '', nurseIds: [] });
        setBeds([]); setDocCats([]); setDoctors([]); setNurses([]);
        try { setRooms(await fetchAdmissionRooms(typeName)); } catch (e) { console.error(e); }
    };

    const onRoomChange = async (roomId) => {
        setSel(s => ({ ...s, roomId, bedId: '', docCatId: '', doctorId: '', nurseIds: [] }));
        setDocCats([]); setDoctors([]); setNurses([]);
        try { setBeds(await fetchAdmissionBeds(roomId)); } catch (e) { console.error(e); }
    };

    const onBedChange = async (bedId) => {
        setSel(s => ({ ...s, bedId, docCatId: '', doctorId: '', nurseIds: [] }));
        setDoctors([]); setNurses([]);
        if (sel.allowsDoctorNurse) {
            try {
                const [cats, ns] = await Promise.all([fetchAdmissionDoctorCategories(), fetchAdmissionNurses()]);
                setDocCats(cats);
                setNurses(ns);
            } catch (e) { console.error(e); }
        }
    };

    const onDocCatChange = async (catId) => {
        setSel(s => ({ ...s, docCatId: catId, doctorId: '' }));
        try { setDoctors(await fetchAdmissionDoctors(catId)); } catch (e) { console.error(e); }
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
            await lockAdmission({
                patientName: sel.patientName,
                illness: sel.illness,
                bedId: sel.bedId,
                doctorId: sel.doctorId || null,
                nurseIds: sel.nurseIds
            });
            setMsg({ type: 'success', text: `Patient "${sel.patientName}" admitted successfully!` });
            setSel({ patientName: '', illness: '', roomType: null, allowsDoctorNurse: false, roomId: '', bedId: '', docCatId: '', doctorId: '', nurseIds: [] });
            setRooms([]); setBeds([]); setDocCats([]); setDoctors([]); setNurses([]);
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

    const isHighCare = HIGH_CARE.includes(sel.roomType);

    return (
        <div>
            {/* Sub-tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => setTab('admit')} style={{
                    padding: '0.65rem 1.5rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem',
                    background: tab === 'admit' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'rgba(255,255,255,0.05)',
                    color: '#fff', border: tab === 'admit' ? 'none' : '1px solid rgba(255,255,255,0.1)'
                }}>Admit Patient</button>
                <button onClick={() => setTab('active')} style={{
                    padding: '0.65rem 1.5rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem',
                    background: tab === 'active' ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.05)',
                    color: '#fff', border: tab === 'active' ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    position: 'relative'
                }}>
                    Active Patients
                    {activeAdmissions.length > 0 && (
                        <span style={{ marginLeft: '0.5rem', background: '#ef4444', borderRadius: '99px', padding: '2px 8px', fontSize: '0.78rem' }}>
                            {activeAdmissions.length}
                        </span>
                    )}
                </button>
            </div>

            {tab === 'admit' && (
                <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '2rem' }}>
                    {/* Progress sidebar */}
                    <div className="card" style={{ borderColor: 'rgba(99,102,241,0.3)', alignSelf: 'start' }}>
                        <h3 style={{ fontSize: '0.95rem', color: '#a5b4fc', margin: '0 0 1rem 0' }}>Admission Steps</h3>
                        {step(1, 'Patient Details', !sel.patientName, sel.patientName)}
                        {step(2, 'Select Room Type', sel.patientName && !sel.roomType, !!sel.roomType)}
                        {step(3, 'Select Room', !!sel.roomType && !sel.roomId, !!sel.roomId)}
                        {step(4, 'Select Bed', !!sel.roomId && !sel.bedId, !!sel.bedId)}
                        {isHighCare ? <>
                            {step(5, 'Select Doctor Category', !!sel.bedId && !sel.docCatId, !!sel.docCatId)}
                            {step(6, 'Select Doctor', !!sel.docCatId && !sel.doctorId, !!sel.doctorId)}
                            {step(7, 'Select Nurses', !!sel.doctorId, sel.nurseIds.length > 0)}
                        </> : sel.bedId && (
                            <div style={{ padding: '0.6rem 1rem', marginTop: '0.5rem', borderRadius: '8px', background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)', fontSize: '0.8rem', color: '#fbbf24' }}>
                                Room type: Bed-only assignment. No doctor/nurse locking required.
                            </div>
                        )}
                    </div>

                    {/* Main form */}
                    <div className="card" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
                        <h2 className="card-title" style={{ color: '#fca5a5', borderBottomColor: 'rgba(239,68,68,0.2)' }}>
                            🏥 Admit Patient & Lock Resources
                        </h2>

                        {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

                        <form onSubmit={handleSubmit}>
                            {/* Step 1: Patient Details */}
                            <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
                                <div style={{ fontSize: '0.8rem', color: '#818cf8', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Step 1 — Patient Details</div>
                                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                                    <label>Patient Full Name *</label>
                                    <input type="text" className="form-control" placeholder="e.g. John Doe"
                                        value={sel.patientName} onChange={e => setSel(s => ({ ...s, patientName: e.target.value }))} required />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label>Condition / Illness</label>
                                    <input type="text" className="form-control" placeholder="e.g. Cardiac arrest"
                                        value={sel.illness} onChange={e => setSel(s => ({ ...s, illness: e.target.value }))} />
                                </div>
                            </div>

                            {/* Step 2: Room Type */}
                            {sel.patientName && (
                                <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#818cf8', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Step 2 — Room Type</div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label>Select Room Category</label>
                                        <select className="form-control" value={sel.roomType || ''} onChange={e => {
                                            const found = roomTypes.find(rt => rt.name === e.target.value);
                                            if (found) onRoomTypeChange(found.name, found.allowsDoctorNurse);
                                        }} required>
                                            <option value="">-- Choose Room Type --</option>
                                            {roomTypes.map(rt => (
                                                <option key={rt.name} value={rt.name}>
                                                    {rt.name}{rt.allowsDoctorNurse ? ' ⭐' : ''}
                                                </option>
                                            ))}
                                        </select>
                                        {sel.roomType && (
                                            <small style={{ color: isHighCare ? '#a5b4fc' : '#fbbf24', marginTop: '0.4rem', display: 'block' }}>
                                                {isHighCare ? '⭐ High-care room: Doctor & Nurse assignment available' : '📋 Standard room: Bed assignment only'}
                                            </small>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Room */}
                            {sel.roomType && rooms.length > 0 && (
                                <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#818cf8', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Step 3 — Select Room</div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label>Available Rooms (with vacant beds)</label>
                                        <select className="form-control" value={sel.roomId} onChange={e => onRoomChange(e.target.value)} required>
                                            <option value="">-- Select Room --</option>
                                            {rooms.map(r => (
                                                <option key={r.id} value={r.id}>
                                                    {r.roomNumber} ({r.vacantBeds} bed{r.vacantBeds > 1 ? 's' : ''} free)
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Bed */}
                            {sel.roomId && beds.length > 0 && (
                                <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#f87171', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Step 4 — Assign Bed</div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label>Select Vacant Bed</label>
                                        <select className="form-control" value={sel.bedId} onChange={e => onBedChange(e.target.value)} required>
                                            <option value="">-- Select Bed --</option>
                                            {beds.map(b => <option key={b.id} value={b.id}>{b.bedNumber}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Steps 5-7: Doctor & Nurse (only for high-care rooms) */}
                            {sel.bedId && isHighCare && (
                                <>
                                    <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#60a5fa', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Step 5 & 6 — Assign Doctor</div>
                                        <div className="form-group">
                                            <label>Doctor Specialty / Category</label>
                                            <select className="form-control" value={sel.docCatId} onChange={e => onDocCatChange(e.target.value)}>
                                                <option value="">-- Select Specialty --</option>
                                                {docCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        {sel.docCatId && (
                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                <label>Select Doctor</label>
                                                <select className="form-control" value={sel.doctorId} onChange={e => setSel(s => ({ ...s, doctorId: e.target.value }))}>
                                                    <option value="">-- Select Doctor --</option>
                                                    {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.name}</option>)}
                                                </select>
                                                {doctors.length === 0 && <small style={{ color: '#f87171' }}>No available doctors in this category.</small>}
                                            </div>
                                        )}
                                    </div>

                                    {sel.doctorId !== undefined && sel.bedId && (
                                        <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
                                            <div style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Step 7 — Assign Nurses (Optional)</div>
                                            {nurses.length === 0 ? (
                                                <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>No available nurses in the system.</p>
                                            ) : (
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                                    {nurses.map(n => (
                                                        <label key={n.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#e2e8f0', fontSize: '0.9rem' }}>
                                                            <input type="checkbox" checked={sel.nurseIds.includes(n.id)} onChange={() => toggleNurse(n.id)} />
                                                            {n.name}
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}

                            {sel.bedId && (
                                <button type="submit" className="btn" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }} disabled={submitting}>
                                    {submitting ? 'Admitting...' : '🔒 Confirm Admission & Lock Resources'}
                                </button>
                            )}
                        </form>
                    </div>
                </div>
            )}

            {tab === 'active' && (
                <div>
                    <h2 style={{ fontSize: '1.2rem', color: '#e2e8f0', marginBottom: '1.5rem' }}>
                        Currently Active Patients ({activeAdmissions.length})
                    </h2>
                    {activeAdmissions.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', color: '#94a3b8' }}>
                            <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>🏥</p>
                            <p>No active admissions. All resources are free.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
                            {activeAdmissions.map(a => (
                                <div key={a.id} className="card" style={{ borderColor: 'rgba(239,68,68,0.3)', padding: '1.25rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#f8fafc' }}>{a.patientName}</div>
                                            {a.illness && <div style={{ fontSize: '0.88rem', color: '#fca5a5', marginTop: '2px' }}>{a.illness}</div>}
                                        </div>
                                        <span style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '99px', padding: '3px 10px', fontSize: '0.75rem', fontWeight: 600, flexShrink: 0 }}>
                                            ACTIVE
                                        </span>
                                    </div>

                                    <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                                        <div style={{ background: 'rgba(15,23,42,0.5)', borderRadius: '8px', padding: '0.6rem' }}>
                                            <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '2px', textTransform: 'uppercase' }}>Location</div>
                                            <div style={{ fontSize: '0.9rem', color: '#e2e8f0', fontWeight: 500 }}>{a.roomType}</div>
                                            <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Room {a.roomNumber} · Bed {a.bedNumber}</div>
                                        </div>
                                        <div style={{ background: 'rgba(15,23,42,0.5)', borderRadius: '8px', padding: '0.6rem' }}>
                                            <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '2px', textTransform: 'uppercase' }}>Assigned Staff</div>
                                            {a.doctorName
                                                ? <div style={{ fontSize: '0.9rem', color: '#60a5fa', fontWeight: 500 }}>Dr. {a.doctorName}</div>
                                                : <div style={{ fontSize: '0.85rem', color: '#64748b' }}>No doctor locked</div>
                                            }
                                            {a.nurseCount > 0
                                                ? <div style={{ fontSize: '0.82rem', color: '#34d399' }}>{a.nurseCount} Nurse{a.nurseCount > 1 ? 's' : ''} locked</div>
                                                : <div style={{ fontSize: '0.82rem', color: '#64748b' }}>No nurses locked</div>
                                            }
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleDischarge(a.id, a.patientName)}
                                        style={{ marginTop: '1rem', width: '100%', padding: '0.6rem', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
                                    >
                                        Discharge & Unlock Resources
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
