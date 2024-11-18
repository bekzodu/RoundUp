import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, query, where, getDocs, updateDoc, deleteDoc, doc, addDoc, arrayUnion, increment, getDoc, deleteField, serverTimestamp, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { FaTrash } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import CreateGameForm from '../components/CreateGameForm';
import Modal from '../components/Modal';
import '../styles/AdminConsole.css';

const AdminConsole = () => {
  const [games, setGames] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [loading, setLoading] = useState(true);
  const [activeGames, setActiveGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const gamesRef = collection(db, 'games');
            
      // Fetch both pending and active games
      const pendingQuery = query(gamesRef, where('status', '==', 'pending'));
      const activeQuery = query(gamesRef, where('status', '==', 'active'));
      
      const [pendingSnapshot, activeSnapshot] = await Promise.all([
        getDocs(pendingQuery),
        getDocs(activeQuery)
      ]);
      
      // Combine and set all games
      const allGames = [
        ...pendingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        ...activeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      ];
      
      setGames(allGames);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching games:', error);
      setLoading(false);
    }
  };

  const handlePublish = async (gameId) => {
    try {
      const gameRef = doc(db, 'games', gameId);
      const gameDoc = await getDoc(gameRef);
      const gameData = gameDoc.data();
      
      await updateDoc(gameRef, {
        status: 'pending',
        pendingAt: new Date().toISOString()
      });
      
      fetchGames();
      
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: {
          message: 'Game pended successfully!',
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
        
        // Immediately update all game lists
        setGames(prevGames => prevGames.filter(game => game.id !== gameId));
        
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
      // Create the game
      const gameRef = await addDoc(collection(db, 'games'), {
        ...gameData,
        status: 'draft',
        currentPlayers: 0,
        participants: [],
        prizePool: 0,
        createdAt: new Date().toISOString()
      });

      fetchGames();
      setShowCreateForm(false);
      
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

  const handleDeleteClick = (game) => {
    setSelectedGame(game);
  };

  const handleDeleteConfirm = async () => {
    try {
      // 1. Get all users who are in this game
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      const gameId = selectedGame.id;

      // 2. Process each user
      const userUpdates = usersSnapshot.docs.map(async (userDoc) => {
        const userData = userDoc.data();
        if (userData.currentGames && userData.currentGames[gameId]) {
          // Refund entry fee to user
          const refundAmount = selectedGame.entryFee;
          const currentPoints = userData.points || 0;
          
          // Update user document
          const userRef = doc(db, 'users', userDoc.id);
          await updateDoc(userRef, {
            points: currentPoints + refundAmount,
            [`currentGames.${gameId}`]: deleteField()
          });
        }
      });

      // Wait for all user updates to complete
      await Promise.all(userUpdates);

      // 3. Delete the game document
      const gameRef = doc(db, 'games', gameId);
      await deleteDoc(gameRef);

      // 4. Update all game lists immediately
      setGames(prevGames => prevGames.filter(game => game.id !== gameId));

      // 5. Close modal and reset selected game
      setSelectedGame(null);

      // 6. Show success message
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: {
          message: 'Game deleted successfully!',
          type: 'success'
        }
      }));

    } catch (error) {
      console.error('Error deleting game:', error);
      // Show error message
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: {
          message: 'Error deleting game',
          type: 'error'
        }
      }));
    }
  };

  const renderGamesList = (gamesList, title, showActions = false) => (
    <div className="games-list">
      <h2>{title}</h2>
      <div className="games-grid">
        {gamesList.length > 0 ? (
          gamesList.map(game => (
            <div key={game.id} className="game-card">
              <div className="game-header">
                <h3>{game.title}</h3>
                <span className={`status-badge ${game.status}`}>
                  {game.status}
                </span>
              </div>
              
              <div className="game-details">
                <div className="detail-row">
                  <span className="label">Type:</span>
                  <span className="value">{game.gameType}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Players:</span>
                  <span className="value">{game.participants?.length || 0}/{game.maxPlayers}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Entry Fee:</span>
                  <span className="value highlight-blue">{game.entryFee.toLocaleString()} Points</span>
                </div>
                <div className="detail-row">
                  <span className="label">Prize Pool:</span>
                  <span className="value highlight-green">{game.prizePool.toLocaleString()} Points</span>
                </div>
              </div>

              <div className="game-actions">
                {showActions ? (
                  <>
                    <button 
                      className="action-btn publish"
                      onClick={() => handlePublish(game.id)}
                    >
                      Publish
                    </button>
                    <button 
                      className="action-btn delete"
                      onClick={() => handleDeleteClick(game)}
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  <button 
                    className="action-btn delete"
                    onClick={() => handleDeleteClick(game)}
                  >
                    <FaTrash /> Delete
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="no-games">No {title.toLowerCase()} at the moment.</p>
        )}
      </div>
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
              {renderGamesList(games, 'Games')}
            </div>
          )}
        </main>
      </div>

      {selectedGame && (
        <Modal
          isOpen={selectedGame !== null}
          onClose={() => setSelectedGame(null)}
        >
          <div className="delete-modal-content">
            <h2>Delete Game</h2>
            <p>Are you sure you want to delete this game?</p>
            <p>This will:</p>
            <ul>
              <li>Remove the game completely</li>
              <li>Refund entry fees to all participants</li>
              <li>Remove the game from all users' active games</li>
            </ul>
            <div className="modal-buttons">
              <button 
                className="cancel-button"
                onClick={() => setSelectedGame(null)}
              >
                Cancel
              </button>
              <button 
                className="confirm-button"
                onClick={handleDeleteConfirm}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default AdminConsole; 