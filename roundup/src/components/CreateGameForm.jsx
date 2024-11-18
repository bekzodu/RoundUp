import React, { useState } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc } from 'firebase/firestore';
import '../styles/CreateGameForm.css';

const GAME_TYPES = [
  { id: 'squid_glass', name: 'Squid Glass' }
];

const GAME_MODES = [
  { id: 'solo', name: 'Solo' },
  { id: 'multiplayer', name: 'Multiplayer' }
];

const CreateGameForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    gameType: 'squid_glass',
    gameMode: 'solo',
    minPlayers: 2,
    entryFee: 0
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const gameData = {
        ...formData,
        createdAt: new Date().toISOString(),
        currentPlayers: 0,
        isActive: false,
        participants: [],
        winners: [],
        prizePool: 0,
        status: 'published'
      };

      // If solo mode, set minPlayers to 1
      if (formData.gameMode === 'solo') {
        gameData.minPlayers = 1;
      }

      const gamesRef = collection(db, 'games');
      await addDoc(gamesRef, gameData);

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

        <div className="form-group">
          <label>Game Mode</label>
          <select
            value={formData.gameMode}
            onChange={(e) => setFormData({ ...formData, gameMode: e.target.value })}
            required
          >
            {GAME_MODES.map(mode => (
              <option key={mode.id} value={mode.id}>
                {mode.name}
              </option>
            ))}
          </select>
        </div>

        {formData.gameMode === 'multiplayer' && (
          <div className="form-group">
            <label>Minimum Players</label>
            <input
              type="number"
              min="2"
              value={formData.minPlayers}
              onChange={(e) => setFormData({ ...formData, minPlayers: parseInt(e.target.value) })}
              required
            />
          </div>
        )}

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