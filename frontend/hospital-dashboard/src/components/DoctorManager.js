import React, { useState, useEffect } from 'react';
import { fetchDoctorCategories, addDoctorProfile, addNurseProfile } from '../api';

const DoctorManager = ({ onDoctorAdded }) => {
  const [role, setRole] = useState('Doctor');
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    categoryName: '',
    name: '',
    education: '',
    experienceYears: ''
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const cats = await fetchDoctorCategories();
      setCategories(cats);
      if (cats.length > 0) {
        setFormData(prev => ({ ...prev, categoryName: cats[0] }));
      }
    } catch (err) {
      console.error("Failed to load doctor categories", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      if (role === 'Doctor') {
        await addDoctorProfile({
          categoryName: formData.categoryName,
          name: formData.name,
          education: formData.education,
          experienceYears: parseInt(formData.experienceYears, 10)
        });
      } else {
        await addNurseProfile({
          name: formData.name,
          experienceYears: parseInt(formData.experienceYears, 10)
        });
      }
      
      setStatus({ type: 'success', message: `${role} successfully added into the system.` });
      setFormData(prev => ({ ...prev, name: '', education: '', experienceYears: '' }));
      onDoctorAdded();
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: `Failed to add ${role.toLowerCase()}.` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ borderColor: '#8b5cf6' }}>
      <h2 className="card-title" style={{ color: '#c4b5fd', borderBottomColor: 'rgba(139, 92, 246, 0.2)' }}>
        Add to Medical Personnel Directory
      </h2>
      
      {status && (
        <div className={`alert alert-${status.type}`}>
          {status.message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group" style={{ marginBottom: '1.5rem', backgroundColor: 'rgba(139, 92, 246, 0.1)', padding: '0.8rem', borderRadius: '8px' }}>
          <label style={{ color: '#e2e8f0' }}>Select Personnel Role</label>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
             <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', cursor: 'pointer' }}>
               <input type="radio" value="Doctor" checked={role === 'Doctor'} onChange={() => setRole('Doctor')} />
               Doctor
             </label>
             <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', cursor: 'pointer' }}>
               <input type="radio" value="Nurse" checked={role === 'Nurse'} onChange={() => setRole('Nurse')} />
               Nurse
             </label>
          </div>
        </div>

        {role === 'Doctor' && (
            <div className="form-group">
                <label>Medical Specialty (Category)</label>
                <select 
                    className="form-control"
                    value={formData.categoryName}
                    onChange={(e) => setFormData({...formData, categoryName: e.target.value})}
                    required
                >
                    {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>
        )}

        <div className="form-group">
          <label>Full Name</label>
          <input 
            type="text" 
            className="form-control" 
            placeholder={role === 'Doctor' ? "Dr. John Doe" : "Jane Doe, RN"}
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
        </div>

        {role === 'Doctor' && (
            <div className="form-group">
                <label>Education & Degrees</label>
                <input 
                    type="text" 
                    className="form-control" 
                    placeholder="MBBS, MD"
                    value={formData.education}
                    onChange={(e) => setFormData({...formData, education: e.target.value})}
                    required
                />
            </div>
        )}

        <div className="form-group">
          <label>Years of Experience</label>
          <input 
            type="number" 
            className="form-control" 
            min="0" max="70"
            value={formData.experienceYears}
            onChange={(e) => setFormData({...formData, experienceYears: e.target.value})}
            required
          />
        </div>

        <button type="submit" className="btn" style={{ backgroundColor: '#8b5cf6' }} disabled={loading}>
          {loading ? 'Adding...' : `Add ${role} Profile`}
        </button>
      </form>
    </div>
  );
};

export default DoctorManager;
