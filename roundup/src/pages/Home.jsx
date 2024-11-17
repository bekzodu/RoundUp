import React, { useEffect } from 'react';
import GameCard from '../components/GameCard';
import Navbar from '../components/Navbar';
import '../styles/Home.css';

const Home = () => {
  // Prevent back navigation when logged in
  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

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
    {
      id: 3,
      title: "Night Owls",
      players: 12,
      maxPlayers: 20,
      rounds: 4,
      entryFee: "0.08 ETH",
      startTime: "2024-03-20T18:00:00Z"
    },
    {
      id: 4,
      title: "Morning Glory",
      players: 10,
      maxPlayers: 15,
      rounds: 3,
      entryFee: "0.07 ETH",
      startTime: "2024-03-21T08:00:00Z"
    },
    {
      id: 5,
      title: "Lunchtime Legends",
      players: 16,
      maxPlayers: 24,
      rounds: 5,
      entryFee: "0.09 ETH",
      startTime: "2024-03-21T12:00:00Z"
    },
    {
      id: 6,
      title: "Afternoon Delight",
      players: 14,
      maxPlayers: 18,
      rounds: 4,
      entryFee: "0.06 ETH",
      startTime: "2024-03-21T15:00:00Z"
    },
    {
      id: 7,
      title: "Evening Showdown",
      players: 20,
      maxPlayers: 30,
      rounds: 6,
      entryFee: "0.12 ETH",
      startTime: "2024-03-21T19:00:00Z"
    },
    {
      id: 8,
      title: "Midnight Madness",
      players: 18,
      maxPlayers: 25,
      rounds: 5,
      entryFee: "0.11 ETH",
      startTime: "2024-03-21T23:00:00Z"
    },
    {
      id: 9,
      title: "Dawn Patrol",
      players: 22,
      maxPlayers: 28,
      rounds: 4,
      entryFee: "0.1 ETH",
      startTime: "2024-03-22T05:00:00Z"
    }
  ];

  return (
    <div className="home-container">
      <Navbar />
      <div className="home-content">
        <header className="home-header">
          <h1>Available Tournaments</h1>
        </header>
        <div className="games-grid">
          {games.map(game => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home; 