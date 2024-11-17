import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import GameCard from '../components/GameCard';
import { db } from '../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import '../styles/Home.css';

const Home = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [activeGames, setActiveGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveGames = async () => {
      try {
        const gamesRef = collection(db, 'games');
        const q = query(gamesRef, where('status', '==', 'published'));
        const querySnapshot = await getDocs(q);
        
        const gamesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setActiveGames(gamesData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching games:', error);
        setLoading(false);
      }
    };

    fetchActiveGames();
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
              <h1>Available Tournaments</h1>
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
                No active tournaments available at the moment.
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default Home; 