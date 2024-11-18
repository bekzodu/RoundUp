import React, { useState } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import '../styles/CreateGameForm.css';

const GAME_TYPES = [
  { id: 'squid_glass', name: 'Squid Glass' }
];

const useFormValidation = () => {
  // Centralize validation logic here
};

const CreateGameForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    players: 0,
    gameType: '',
    // ... other form fields
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const gamesRef = collection(db, 'games');
      const gameRef = await addDoc(gamesRef, {
        ...formData,
        createdAt: new Date().toISOString(),
        currentPlayers: 0,
        isActive: false,
        participants: [],
        winners: [],
        prizePool: 0,
        status: 'published'
      });

      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: {
          message: 'Game created successfully!',
          type: 'success'
        }
      }));
      onClose();
    } catch (error) {
      console.error('Error creating game:', error);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: {
          message: 'Error creating game',
          type: 'error'
        }
      }));
    }
  };

  return (
    <div className="create-game-form">
      <h2>Create New Game</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Min Players</label>
            <input
              type="number"
              min="1"
              value={formData.players}
              onChange={(e) => setFormData({ ...formData, players: parseInt(e.target.value) })}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Entry Fee (Points)</label>
            <input
              type="number"
              min="0"
              step="10"
              value={formData.entryFee}
              onChange={(e) => setFormData({ ...formData, entryFee: parseInt(e.target.value) })}
              required
            />
          </div>

          <div className="form-group">
            <label>Rounds</label>
            <input
              type="number"
              min="1"
              value={formData.rounds}
              onChange={(e) => setFormData({ ...formData, rounds: parseInt(e.target.value) })}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Game Type</label>
          <select
            value={formData.gameType}
            onChange={(e) => setFormData({ ...formData, gameType: e.target.value })}
            required
          >
            {GAME_TYPES.map(type => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onClose} className="cancel-btn">
            Cancel
          </button>
          <button type="submit" className="submit-btn">
            Create Game
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateGameForm; 