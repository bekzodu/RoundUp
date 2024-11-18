import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../config/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import '../styles/ActiveGames.css';

const ActiveGames = () => {
  const navigate = useNavigate();
  const [activeGames, setActiveGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  useEffect(() => {
    const fetchActiveGames = async () => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', auth.currentUser.email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const userData = userDoc.data();
          const username = userDoc.id;
          const currentGames = userData.currentGames || {};
          
          console.log('Current Games Object:', currentGames);

          const gamesPromises = Object.entries(currentGames).map(async ([gameId, gameEntry]) => {
            const gameDoc = await getDoc(doc(db, 'games', gameId));
            console.log('Game Doc:', gameId, gameDoc.data());
            
            if (gameDoc.exists()) {
              return {
                id: gameId,
                ...gameDoc.data(),
                userGameStatus: gameEntry.status,
                joinedAt: gameEntry.joinedAt,
                result: gameEntry.result,
                prizePool: gameDoc.data().currentPlayers * gameDoc.data().entryFee
              };
            }
            return null;
          });

          const resolvedGames = (await Promise.all(gamesPromises))
            .filter(game => game !== null);
          
          console.log('Resolved Games:', resolvedGames);
          setActiveGames(resolvedGames);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching games:', error);
        setLoading(false);
      }
    };

    fetchActiveGames();
  }, []);

  if (loading) {
    return <div className="loading">Loading active games...</div>;
  }

  return (
    <>
      <Navbar />
      <div className="active-games-container">
        <Sidebar 
          isExpanded={isSidebarExpanded} 
          setIsExpanded={setIsSidebarExpanded}
        />
        <main className={`active-games-content ${isSidebarExpanded ? 'shifted' : ''}`}>
          <h1>My Games</h1>
          
          <div className="active-games-grid">
            {activeGames.length === 0 ? (
              <div className="no-games">
                <p>You haven't joined any games yet.</p>
                <button 
                  className="browse-games-btn"
                  onClick={() => navigate('/home')}
                >
                  Browse Games
                </button>
              </div>
            ) : (
              activeGames.map(game => (
                <div key={game.id} className="active-game-card">
                  <div className="game-status">
                    <span className={`status-badge ${game.userGameStatus}`}>{game.userGameStatus}</span>
                    <span className="joined-date">
                      Joined {new Date(game.joinedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3>{game.title}</h3>
                  <div className="game-info">
                    <div className="info-row">
                      <span>Type:</span>
                      <span>{game.gameType}</span>
                    </div>
                    <div className="info-row">
                      <span>Players:</span>
                      <span>{game.currentPlayers}/{game.maxPlayers}</span>
                    </div>
                    <div className="info-row">
                      <span>Prize Pool:</span>
                      <span className="highlight">{game.prizePool.toLocaleString()} Points</span>
                    </div>
                    <div className="info-row">
                      <span>Entry Fee:</span>
                      <span>{game.entryFee.toLocaleString()} Points</span>
                    </div>
                  </div>
                  <button 
                    className="go-button"
                    onClick={() => navigate(`/game/${game.id}`)}
                  >
                    GO
                  </button>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default ActiveGames; 