import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../config/firebase';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import GameCard from '../components/GameCard';
import '../styles/Home.css';

const Home = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [activeGames, setActiveGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const gamesRef = collection(db, 'games');
    const q = query(gamesRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const games = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          const timeA = a.createdAt.seconds ? a.createdAt.seconds * 1000 : a.createdAt;
          const timeB = b.createdAt.seconds ? b.createdAt.seconds * 1000 : b.createdAt;
          return timeB - timeA;
        });
      
      setActiveGames(games);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching games:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
      <Navbar />
      <div className="home-container">
        <Sidebar 
          isExpanded={isSidebarExpanded} 
          setIsExpanded={setIsSidebarExpanded}
        />
        <main className={`main-content ${isSidebarExpanded ? 'shifted' : ''}`}>
          <div className="home-content">
            <header className="home-header">
              <h1>All Games</h1>
            </header>
            {loading ? (
              <div className="loading-message">Loading games...</div>
            ) : activeGames.length > 0 ? (
              <div className="games-grid">
                {activeGames.map(game => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            ) : (
              <div className="no-games-message">
                No games available at the moment.
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

export default Home; 