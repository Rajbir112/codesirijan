import React, { useState, useEffect } from 'react';
import { fetchEquipment, saveEquipment, deleteEquipmentItem } from '../api';

const CATEGORIES = [
    {
        key: 'Life-Saving / Critical Equipment',
        icon: '🚨',
        color: '#ef4444',
        colorBg: 'rgba(239,68,68,0.07)',
        colorBorder: 'rgba(239,68,68,0.25)',
        options: [
            'Ventilators',
            'Defibrillators',
            'Patient Monitors (ECG, BP, SpO2)',
            'Infusion Pumps / Syringe Pumps',
            'Oxygen Cylinders / Central Oxygen Supply',
            'Suction Machines',
            'Crash Carts',
        ],
    },
    {
        key: 'Diagnostic Equipment',
        icon: '🔬',
        color: '#3b82f6',
        colorBg: 'rgba(59,130,246,0.07)',
        colorBorder: 'rgba(59,130,246,0.25)',
        options: [
            'MRI Machines',
            'CT Scanners',
            'X-ray Machines',
            'Ultrasound Machines',
            'ECG Machines',
            'Blood Analysis Machines (CBC, Biochemistry Analyzers)',
        ],
    },
    {
        key: 'General Ward Equipment',
        icon: '🛏️',
        color: '#10b981',
        colorBg: 'rgba(16,185,129,0.07)',
        colorBorder: 'rgba(16,185,129,0.25)',
        options: [
            'Wheelchairs',
            'Stretchers',
            'IV Stands',
            'Bedside Lockers',
        ],
    },
    {
        key: 'Surgical / Operation Theatre Equipment',
        icon: '🔧',
        color: '#8b5cf6',
        colorBg: 'rgba(139,92,246,0.07)',
        colorBorder: 'rgba(139,92,246,0.25)',
        options: [
            'Operation Tables',
            'Surgical Lights',
            'Anesthesia Machines',
            'Surgical Instrument Sets',
            'Electrosurgical Units (Cautery)',
            'Sterilization Equipment (Autoclaves)',
        ],
    },
];

// one empty row
const emptyRow = () => ({ id: null, equipmentName: '', count: '' });

export default function EquipmentInventory() {
    // shape: { [categoryKey]: [ { id, equipmentName, count } ] }
    const [sections, setSections] = useState(() =>
        Object.fromEntries(CATEGORIES.map(c => [c.key, [emptyRow()]]))
    );
    const [saved, setSaved] = useState({});   // track which categories have saveddata
    const [saving, setSaving] = useState({});
    const [msg, setMsg] = useState({});

    useEffect(() => {
        loadAll();
    }, []);

    const loadAll = async () => {
        try {
            const data = await fetchEquipment(); // { category: [ {id, equipmentName, count} ] }
            const next = { ...Object.fromEntries(CATEGORIES.map(c => [c.key, [emptyRow()]])) };
            for (const [cat, items] of Object.entries(data)) {
                if (items.length > 0) next[cat] = items.map(i => ({ id: i.id, equipmentName: i.equipmentName, count: i.count }));
            }
            setSections(next);
            setSaved(Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.length > 0])));
        } catch (e) {
            console.error('Failed to load equipment', e);
        }
    };

    const addRow = (catKey) => {
        setSections(s => ({ ...s, [catKey]: [...s[catKey], emptyRow()] }));
    };

    const removeRow = async (catKey, idx) => {
        const row = sections[catKey][idx];
        if (row.id) {
            try { await deleteEquipmentItem(row.id); } catch (e) { /* ignore */ }
        }
        setSections(s => ({ ...s, [catKey]: s[catKey].filter((_, i) => i !== idx).length === 0 ? [emptyRow()] : s[catKey].filter((_, i) => i !== idx) }));
    };

    const updateRow = (catKey, idx, field, value) => {
        setSections(s => {
            const rows = [...s[catKey]];
            rows[idx] = { ...rows[idx], [field]: value };
            return { ...s, [catKey]: rows };
        });
    };

    const handleSave = async (catKey) => {
        const rows = sections[catKey].filter(r => r.equipmentName && r.count !== '');
        if (rows.length === 0) {
            setMsg(m => ({ ...m, [catKey]: { type: 'error', text: 'Please add at least one equipment item.' } }));
            return;
        }
        // Validate counts
        for (const r of rows) {
            if (parseInt(r.count) < 0) {
                setMsg(m => ({ ...m, [catKey]: { type: 'error', text: 'Count cannot be negative.' } }));
                return;
            }
        }
        setSaving(s => ({ ...s, [catKey]: true }));
        setMsg(m => ({ ...m, [catKey]: null }));
        try {
            const payload = rows.map(r => ({ categoryName: catKey, equipmentName: r.equipmentName, count: parseInt(r.count) }));
            await saveEquipment(payload);
            setMsg(m => ({ ...m, [catKey]: { type: 'success', text: 'Saved successfully!' } }));
            setSaved(sv => ({ ...sv, [catKey]: true }));
            loadAll();
            setTimeout(() => setMsg(m => ({ ...m, [catKey]: null })), 3000);
        } catch (e) {
            setMsg(m => ({ ...m, [catKey]: { type: 'error', text: 'Failed to save. Try again.' } }));
        } finally {
            setSaving(s => ({ ...s, [catKey]: false }));
        }
    };

    // Total count across all categories
    const grandTotal = Object.values(sections).flat().filter(r => r.id).reduce((sum, r) => sum + (parseInt(r.count) || 0), 0);
    const totalTypes = Object.values(sections).flat().filter(r => r.id).length;

    return (
        <div style={{ marginTop: '2.5rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.4rem', color: '#93c5fd', margin: 0 }}>Equipment Inventory</h2>
                    <p style={{ color: '#64748b', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
                        Record and manage hospital equipment counts by category
                    </p>
                </div>
                {totalTypes > 0 && (
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '10px', padding: '0.5rem 1rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#60a5fa' }}>{totalTypes}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Equipment Types</div>
                        </div>
                        <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', padding: '0.5rem 1rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#34d399' }}>{grandTotal}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total Units</div>
                        </div>
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {CATEGORIES.map(cat => {
                    const rows = sections[cat.key] || [emptyRow()];
                    const isSaving = saving[cat.key];
                    const message = msg[cat.key];
                    const isSavedCat = saved[cat.key];

                    return (
                        <div key={cat.key} className="card" style={{ borderColor: cat.colorBorder, background: `linear-gradient(145deg, rgba(15,23,42,0.9), ${cat.colorBg})`, padding: '1.25rem' }}>
                            {/* Category Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: `1px solid ${cat.colorBorder}` }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '1.3rem' }}>{cat.icon}</span>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#e2e8f0' }}>{cat.key}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                            {rows.filter(r => r.id).length} items recorded
                                        </div>
                                    </div>
                                </div>
                                {isSavedCat && (
                                    <span style={{ background: `rgba(16,185,129,0.15)`, color: '#34d399', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '99px', padding: '2px 10px', fontSize: '0.72rem', fontWeight: 600 }}>
                                        ✓ Saved
                                    </span>
                                )}
                            </div>

                            {/* Alert */}
                            {message && (
                                <div style={{
                                    padding: '0.6rem 0.8rem', borderRadius: '8px', marginBottom: '0.75rem', fontSize: '0.85rem',
                                    background: message.type === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                                    color: message.type === 'success' ? '#34d399' : '#f87171',
                                    border: `1px solid ${message.type === 'success' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`
                                }}>
                                    {message.text}
                                </div>
                            )}

                            {/* Rows */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
                                {rows.map((row, idx) => {
                                    // All names selected in other rows of this category
                                    const takenByOthers = rows
                                        .filter((_, i) => i !== idx)
                                        .map(r => r.equipmentName)
                                        .filter(Boolean);

                                    // Options available for this row = not taken by others
                                    const availableOptions = cat.options.filter(
                                        opt => !takenByOthers.includes(opt)
                                    );

                                    return (
                                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 32px', gap: '0.5rem', alignItems: 'center' }}>
                                            <select
                                                className="form-control"
                                                style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                                                value={row.equipmentName}
                                                onChange={e => updateRow(cat.key, idx, 'equipmentName', e.target.value)}
                                            >
                                                <option value="">-- Select --</option>
                                                {availableOptions.map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                            <input
                                                type="number"
                                                className="form-control"
                                                min="0"
                                                placeholder="Total"
                                                title="Total Amount"
                                                style={{ padding: '0.5rem 0.2rem', fontSize: '0.85rem', textAlign: 'center' }}
                                                value={row.count}
                                                onChange={e => updateRow(cat.key, idx, 'count', e.target.value)}
                                            />
                                            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                                                <input
                                                    type="number"
                                                    placeholder="Add"
                                                    title="Amount to add/subtract"
                                                    style={{ width: '60px', border: 'none', background: 'transparent', color: '#e2e8f0', padding: '0.5rem', textAlign: 'center', fontSize: '0.85rem', outline: 'none' }}
                                                    value={row.delta !== undefined ? row.delta : ''}
                                                    onChange={e => updateRow(cat.key, idx, 'delta', e.target.value)}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            const current = parseInt(row.count) || 0;
                                                            const delta = parseInt(row.delta) || 0;
                                                            updateRow(cat.key, idx, 'count', Math.max(0, current + delta));
                                                            updateRow(cat.key, idx, 'delta', '');
                                                        }
                                                    }}
                                                />
                                                <button
                                                    title="Apply Update"
                                                    style={{ width: '40px', border: 'none', borderLeft: '1px solid rgba(255,255,255,0.1)', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', cursor: 'pointer', padding: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold' }}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        const current = parseInt(row.count) || 0;
                                                        const delta = parseInt(row.delta) || 0;
                                                        updateRow(cat.key, idx, 'count', Math.max(0, current + delta));
                                                        updateRow(cat.key, idx, 'delta', '');
                                                    }}
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => removeRow(cat.key, idx)}
                                                disabled={rows.length === 1 && !row.equipmentName}
                                                title="Remove row"
                                                style={{
                                                    width: 32, height: 32, borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)',
                                                    background: 'rgba(239,68,68,0.1)', color: '#f87171', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
                                                    opacity: rows.length === 1 && !row.equipmentName ? 0.4 : 1
                                                }}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Add More - only show if there are still unselected options */}
                            {(() => {
                                const usedNames = rows.map(r => r.equipmentName).filter(Boolean);
                                const allUsed = cat.options.every(opt => usedNames.includes(opt));
                                return !allUsed ? (
                                    <button
                                        onClick={() => addRow(cat.key)}
                                        style={{
                                            width: '100%', padding: '0.5rem', borderRadius: '8px', marginBottom: '0.75rem',
                                            border: `1px dashed ${cat.colorBorder}`, background: 'transparent',
                                            color: cat.color, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600
                                        }}
                                    >
                                        + Add More Equipment
                                    </button>
                                ) : (
                                    <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#64748b', marginBottom: '0.75rem', padding: '0.4rem' }}>
                                        ✓ All equipment types added for this category
                                    </div>
                                );
                            })()}

                            {/* Save */}
                            <button
                                onClick={() => handleSave(cat.key)}
                                disabled={isSaving}
                                style={{
                                    width: '100%', padding: '0.65rem', borderRadius: '8px', border: 'none',
                                    background: `linear-gradient(135deg, ${cat.color}cc, ${cat.color}88)`,
                                    color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem',
                                    opacity: isSaving ? 0.7 : 1, boxShadow: `0 4px 12px ${cat.color}33`
                                }}
                            >
                                {isSaving ? 'Saving...' : `Save ${cat.icon}`}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
