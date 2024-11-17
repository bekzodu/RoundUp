import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, query, where, getDocs, updateDoc, deleteDoc, doc, addDoc, arrayUnion, increment } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import CreateGameForm from '../components/CreateGameForm';
import '../styles/AdminConsole.css';

const AdminConsole = () => {
  const [games, setGames] = useState({
    draft: [],
    active: [],
    ended: []
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const gamesRef = collection(db, 'games');
      
      // Fetch draft games
      const draftQuery = query(gamesRef, where('status', '==', 'draft'));
      const draftSnapshot = await getDocs(draftQuery);
      
      // Fetch active games
      const activeQuery = query(gamesRef, where('status', '==', 'published'));
      const activeSnapshot = await getDocs(activeQuery);
      
      // Fetch ended games
      const endedQuery = query(gamesRef, where('status', '==', 'completed'));
      const endedSnapshot = await getDocs(endedQuery);
      
      setGames({
        draft: draftSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        active: activeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        ended: endedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching games:', error);
      setLoading(false);
    }
  };

  const handlePublish = async (gameId) => {
    try {
      const gameRef = doc(db, 'games', gameId);
      await updateDoc(gameRef, {
        status: 'published',
        publishedAt: new Date().toISOString()
      });
      
      fetchGames();
      
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: {
          message: 'Game published successfully!',
          type: 'success'
        }
      }));
    } catch (error) {
      console.error('Error publishing game:', error);
    }
  };

  const handleDelete = async (gameId) => {
    if (window.confirm('Are you sure you want to delete this game?')) {
      try {
        await deleteDoc(doc(db, 'games', gameId));
        fetchGames();
        
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: {
            message: 'Game deleted successfully!',
            type: 'success'
          }
        }));
      } catch (error) {
        console.error('Error deleting game:', error);
      }
    }
  };

  const handleCreateGame = async (gameData) => {
    try {
      await addDoc(collection(db, 'games'), {
        ...gameData,
        status: 'draft',
        currentPlayers: 0,
        participants: [],
        prizePool: 0,
        createdAt: new Date().toISOString()
      });

      fetchGames();
      
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: {
          message: 'Game created successfully!',
          type: 'success'
        }
      }));
    } catch (error) {
      console.error('Error creating game:', error);
    }
  };

  const renderGamesList = (gamesList, title, showActions = false) => (
    <div className="games-list">
      <h2>{title}</h2>
      {gamesList.length > 0 ? (
        gamesList.map(game => (
          <div key={game.id} className="game-item">
            <div className="game-info">
              <h3>{game.title}</h3>
              <p>Type: {game.gameType}</p>
              <p>Players: {game.currentPlayers}/{game.maxPlayers}</p>
              <p>Entry Fee: {game.entryFee} Points</p>
              <p>Prize Pool: {game.prizePool} Points</p>
            </div>
            {showActions && (
              <div className="game-actions">
                <button 
                  className="publish-btn"
                  onClick={() => handlePublish(game.id)}
                >
                  Publish
                </button>
                <button 
                  className="delete-btn"
                  onClick={() => handleDelete(game.id)}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))
      ) : (
        <p className="no-games">No {title.toLowerCase()} at the moment.</p>
      )}
    </div>
  );

  return (
    <>
      <Navbar />
      <div className="admin-container">
        <Sidebar 
          isExpanded={isSidebarExpanded} 
          setIsExpanded={setIsSidebarExpanded}
          isAdmin={true}
        />
        <main className={`admin-content ${isSidebarExpanded ? 'shifted' : ''}`}>
          <div className="admin-header">
            <h1>Admin Console</h1>
            <button 
              className="create-game-btn"
              onClick={() => setShowCreateForm(true)}
            >
              Create New Game
            </button>
          </div>

          {showCreateForm && (
            <div className="modal-overlay">
              <div className="modal-content">
                <CreateGameForm 
                  onClose={() => {
                    setShowCreateForm(false);
                    fetchGames();
                  }} 
                />
              </div>
            </div>
          )}

          {loading ? (
            <div className="loading-message">Loading games...</div>
          ) : (
            <div className="games-sections">
              {renderGamesList(games.draft, 'Draft Games', true)}
              {renderGamesList(games.active, 'Active Games')}
              {renderGamesList(games.ended, 'Ended Games')}
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default AdminConsole; 