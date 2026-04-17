// Central API file

const BASE = 'http://localhost:8080/api';

// ─── Room / Bed / Capacity ────────────────────────────────
export const fetchRoomTypes = async () => {
    const res = await fetch(`${BASE}/capacity/room-types`);
    if (!res.ok) throw new Error('Failed to fetch room types');
    return res.json();
};

export const deployCapacity = async (payload) => {
    const res = await fetch(`${BASE}/capacity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to deploy capacity');
    return res.text();
};

// Alias used by CapacityManager.js
export const createCapacity = deployCapacity;

export const fetchInventory = async () => {
    const res = await fetch(`${BASE}/capacity/inventory`);
    if (!res.ok) throw new Error('Failed to fetch inventory');
    return res.json();
};

// ─── Doctor ───────────────────────────────────────────────
const DOC_API = `${BASE}/doctors`;

export const fetchDoctorCategories = async () => {
    const res = await fetch(`${DOC_API}/categories`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
};

export const fetchDoctorStats = async () => {
    const res = await fetch(`${DOC_API}/stats`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
};

export const addDoctorProfile = async (data) => {
    const res = await fetch(DOC_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to add doctor');
    return res.text();
};

export const deleteDoctorProfile = async (id) => {
    const res = await fetch(`${DOC_API}/${id}`, { method: 'DELETE' });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to delete doctor');
    }
    return res.text();
};

// ─── Nurse ────────────────────────────────────────────────
const NURSE_API = `${BASE}/nurses`;

export const fetchNurseStats = async () => {
    const res = await fetch(`${NURSE_API}/stats`);
    if (!res.ok) throw new Error('Failed to fetch nurse stats');
    return res.json();
};

export const addNurseProfile = async (data) => {
    const res = await fetch(NURSE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to add nurse');
    return res.text();
};

export const deleteNurseProfile = async (id) => {
    const res = await fetch(`${NURSE_API}/${id}`, { method: 'DELETE' });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to delete nurse');
    }
    return res.text();
};

// ─── Equipment Inventory ──────────────────────────────────
const EQ_API = `${BASE}/equipment`;

export const fetchEquipment = async () => {
    const res = await fetch(EQ_API);
    if (!res.ok) throw new Error('Failed to fetch equipment');
    return res.json();
};

export const saveEquipment = async (entries) => {
    const res = await fetch(`${EQ_API}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entries)
    });
    if (!res.ok) throw new Error('Failed to save equipment');
    return res.text();
};

export const deleteEquipmentItem = async (id) => {
    const res = await fetch(`${EQ_API}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete equipment');
    return res.text();
};

// ─── Admissions (hierarchical) ────────────────────────────────
const ADM_API = `${BASE}/admissions`;

export const fetchAdmissionRoomTypes = async () => {
    const res = await fetch(`${ADM_API}/room-types`);
    if (!res.ok) throw new Error('Failed to fetch room types');
    return res.json();
};

export const fetchAdmissionRooms = async (roomTypeName) => {
    const res = await fetch(`${ADM_API}/rooms?roomTypeName=${encodeURIComponent(roomTypeName)}`);
    if (!res.ok) throw new Error('Failed to fetch rooms');
    return res.json();
};

export const fetchAdmissionBeds = async (roomId) => {
    const res = await fetch(`${ADM_API}/beds?roomId=${roomId}`);
    if (!res.ok) throw new Error('Failed to fetch beds');
    return res.json();
};

export const fetchAdmissionDoctorCategories = async () => {
    const res = await fetch(`${ADM_API}/doctor-categories`);
    if (!res.ok) throw new Error('Failed to fetch doctor categories');
    return res.json();
};

export const fetchAdmissionDoctors = async (categoryId) => {
    const res = await fetch(`${ADM_API}/doctors?categoryId=${categoryId}`);
    if (!res.ok) throw new Error('Failed to fetch doctors');
    return res.json();
};

export const fetchAdmissionNurses = async () => {
    const res = await fetch(`${ADM_API}/nurses`);
    if (!res.ok) throw new Error('Failed to fetch nurses');
    return res.json();
};

export const fetchAdmissionEquipmentCategories = async () => {
    const res = await fetch(`${ADM_API}/equipment-categories`);
    if (!res.ok) throw new Error('Failed to fetch equipment categories');
    return res.json();
};

export const fetchAdmissionEquipmentItems = async (category) => {
    const res = await fetch(`${ADM_API}/equipment-items?category=${encodeURIComponent(category)}`);
    if (!res.ok) throw new Error('Failed to fetch equipment items');
    return res.json();
};

export const lockAdmission = async (payload) => {
    const res = await fetch(`${ADM_API}/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to lock admission');
    return res.text();
};

export const fetchActiveAdmissions = async () => {
    const res = await fetch(`${ADM_API}/active`);
    if (!res.ok) throw new Error('Failed to fetch admissions');
    return res.json();
};

export const dischargePatient = async (id) => {
    const res = await fetch(`${ADM_API}/discharge/${id}`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to discharge patient');
    return res.text();
};

export const fetchWaitingAdmissions = async () => {
    const res = await fetch(`${ADM_API}/waiting`);
    if (!res.ok) throw new Error('Failed to fetch waiting list');
    return res.json();
};

export const approveDoctor = async (doctorId) => {
    const res = await fetch(`${ADM_API}/approve-doctor/${doctorId}`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to approve doctor');
    return res.text();
};

export const forceAdmit = async (admissionId) => {
    const res = await fetch(`${ADM_API}/force-admit/${admissionId}`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to force admit');
    return res.text();
};

export const clearWaitingQueue = async () => {
    const res = await fetch(`${ADM_API}/clear-waiting`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to clear waiting queue');
    return res.text();
};

// ─── Machine Learning ─────────────────────────────────────────

export const fetchEquipmentDemandForecast = async () => {
    const res = await fetch(`${BASE}/predict/demand`);
    if (!res.ok) throw new Error('Failed to fetch equipment demand forecast');
    return res.json();
};
