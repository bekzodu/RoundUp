import React from 'react';
import GameCard from '../components/GameCard';
import '../styles/Home.css';

const Home = () => {
  // Mock data for available games
  const games = [
    {
      id: 1,
      title: "Weekend Warriors",
      players: 24,
      maxPlayers: 32,
      rounds: 5,
      entryFee: "0.1 ETH",
      startTime: "2024-03-20T15:00:00Z"
    },
    {
      id: 2,
      title: "Quick Tournament",
      players: 8,
      maxPlayers: 16,
      rounds: 3,
      entryFee: "0.05 ETH",
      startTime: "2024-03-20T16:30:00Z"
    },
    // Add more mock games as needed
  ];

  return (
    <div className="home-container">
      <header className="home-header">
        <h1>Available Tournaments</h1>
      </header>
      <div className="games-grid">
        {games.map(game => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </div>
  );
};

export default Home; 