import React, { useState } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc } from 'firebase/firestore';
import '../styles/CreateGameForm.css';

const GAME_TYPES = [
  { id: 'soccer_score', name: 'Soccer Score' },
  { id: 'luck_game', name: 'Luck Game' },
  { id: 'high_low', name: 'High Low' },
  { id: 'number_guess', name: 'Number Guess' },
  { id: 'card_match', name: 'Card Match' },
  { id: 'word_chain', name: 'Word Chain' },
  { id: 'memory_game', name: 'Memory Game' },
  { id: 'squid_glass', name: 'Squid Glass' }
];

const CreateGameForm = ({ onClose }) => {
  const [gameData, setGameData] = useState({
    title: '',
    minPlayers: 2,
    maxPlayers: 10,
    entryFee: 100, // Default entry fee in points
    rounds: 5,
    gameType: 'soccer_score',
    status: 'draft'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const gamesRef = collection(db, 'games');
      await addDoc(gamesRef, {
        ...gameData,
        createdAt: new Date().toISOString(),
        currentPlayers: 0,
        isActive: false,
        participants: [], // Array to store player IDs who joined
        winners: [], // Array to store winners
        prizePool: gameData.entryFee * gameData.maxPlayers // Total possible prize pool
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
            value={gameData.title}
            onChange={(e) => setGameData({ ...gameData, title: e.target.value })}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Min Players</label>
            <input
              type="number"
              min="2"
              value={gameData.minPlayers}
              onChange={(e) => setGameData({ ...gameData, minPlayers: parseInt(e.target.value) })}
              required
            />
          </div>

          <div className="form-group">
            <label>Max Players</label>
            <input
              type="number"
              min="2"
              value={gameData.maxPlayers}
              onChange={(e) => setGameData({ ...gameData, maxPlayers: parseInt(e.target.value) })}
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
              value={gameData.entryFee}
              onChange={(e) => setGameData({ ...gameData, entryFee: parseInt(e.target.value) })}
              required
            />
          </div>

          <div className="form-group">
            <label>Rounds</label>
            <input
              type="number"
              min="1"
              value={gameData.rounds}
              onChange={(e) => setGameData({ ...gameData, rounds: parseInt(e.target.value) })}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Game Type</label>
          <select
            value={gameData.gameType}
            onChange={(e) => setGameData({ ...gameData, gameType: e.target.value })}
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