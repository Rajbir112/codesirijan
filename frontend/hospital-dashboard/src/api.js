const API_BASE = 'http://localhost:8080/api/capacity';
const DOC_API_BASE = 'http://localhost:8080/api/doctors';

export const fetchRoomTypes = async () => {
    const res = await fetch(`${API_BASE}/room-types`);
    if (!res.ok) throw new Error('Failed to fetch room types');
    return res.json();
};

export const fetchInventory = async () => {
    const res = await fetch(`${API_BASE}/inventory`);
    if (!res.ok) throw new Error('Failed to fetch inventory');
    return res.json();
};

export const createCapacity = async (capacityData) => {
    const res = await fetch(`${API_BASE}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(capacityData)
    });
    if (!res.ok) throw new Error('Failed to generate capacity');
    return res.text();
};

// DOCTOR API METHODS
export const fetchDoctorCategories = async () => {
    const res = await fetch(`${DOC_API_BASE}/categories`);
    if (!res.ok) throw new Error('Failed to fetch doctor categories');
    return res.json();
};

export const fetchDoctorStats = async () => {
    const res = await fetch(`${DOC_API_BASE}/stats`);
    if (!res.ok) throw new Error('Failed to fetch doctor stats');
    return res.json();
};

export const addDoctorProfile = async (doctorData) => {
    const res = await fetch(`${DOC_API_BASE}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(doctorData)
    });
    if (!res.ok) throw new Error('Failed to add doctor');
    return res.text();
};

const NURSE_API_BASE = 'http://localhost:8080/api/nurses';

export const fetchNurseStats = async () => {
    const res = await fetch(`${NURSE_API_BASE}/stats`);
    if (!res.ok) throw new Error('Failed to fetch nurse stats');
    return res.json();
};

export const addNurseProfile = async (nurseData) => {
    const res = await fetch(`${NURSE_API_BASE}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(nurseData)
    });
    if (!res.ok) throw new Error('Failed to add nurse');
    return res.text();
};
