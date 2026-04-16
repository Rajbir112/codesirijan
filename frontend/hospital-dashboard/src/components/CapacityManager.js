import React, { useState, useEffect } from 'react';
import { fetchRoomTypes, createCapacity } from '../api';

const CapacityManager = ({ onCapacityAdded }) => {
  const [roomTypes, setRoomTypes] = useState([]);
  const [formData, setFormData] = useState({
    roomTypeName: '',
    numberOfRooms: 1,
    bedsPerRoom: 1
  });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRoomTypes();
  }, []);

  const loadRoomTypes = async () => {
    try {
      const types = await fetchRoomTypes();
      setRoomTypes(types);
      if (types.length > 0) {
        setFormData(prev => ({ ...prev, roomTypeName: types[0] }));
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Failed to load room types. Check if backend is running.' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      await createCapacity({
        roomTypeName: formData.roomTypeName,
        numberOfRooms: parseInt(formData.numberOfRooms, 10),
        bedsPerRoom: parseInt(formData.bedsPerRoom, 10)
      });
      setStatus({ type: 'success', message: 'Hospital resources successfully deployed.' });
      onCapacityAdded();
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Failed to generate capacity.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="card-title">Deploy Capacity</h2>
      
      {status && (
        <div className={`alert alert-${status.type}`}>
          {status.message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Room Category</label>
          <select 
            className="form-control"
            value={formData.roomTypeName}
            onChange={(e) => setFormData({...formData, roomTypeName: e.target.value})}
            required
          >
            {roomTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Number of Rooms</label>
          <input 
            type="number" 
            className="form-control" 
            min="1" max="1000"
            value={formData.numberOfRooms}
            onChange={(e) => setFormData({...formData, numberOfRooms: e.target.value})}
            required
          />
        </div>

        <div className="form-group">
          <label>Beds per Room</label>
          <input 
            type="number" 
            className="form-control" 
            min="1" max="100"
            value={formData.bedsPerRoom}
            onChange={(e) => setFormData({...formData, bedsPerRoom: e.target.value})}
            required
          />
        </div>

        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Deploying...' : 'Deploy Resources'}
        </button>
      </form>
    </div>
  );
};

export default CapacityManager;
