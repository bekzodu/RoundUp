import React from 'react';
import '../styles/GameCard.css';

const GameCard = ({ game }) => {
  const handleJoin = () => {
    // Handle tournament join logic
    console.log(`Joining tournament ${game.id}`);
  };

  return (
    <div className="game-card">
      <h2 className="game-title">{game.title}</h2>
      <div className="game-info">
        <p>Players: {game.players}/{game.maxPlayers}</p>
        <p>Rounds: {game.rounds}</p>
        <p>Entry Fee: {game.entryFee}</p>
        <p>Starts: {new Date(game.startTime).toLocaleString()}</p>
      </div>
      <button 
        className="join-button"
        onClick={handleJoin}
        disabled={game.players >= game.maxPlayers}
      >
        {game.players >= game.maxPlayers ? 'Full' : 'Join Tournament'}
      </button>
    </div>
  );
};

export default GameCard; 