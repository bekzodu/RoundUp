import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../config/firebase';
import { doc, getDoc, onSnapshot, updateDoc, arrayUnion, collection, query, where, getDocs } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import '../styles/GamePage.css';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';

const GamePage = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [userPoints, setUserPoints] = useState(0);
  const [showJoinConfirm, setShowJoinConfirm] = useState(false);
  const [showPlayerList, setShowPlayerList] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', auth.currentUser.email));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        setUserPoints(userData.points);
        const currentGames = userData.currentGames || {};
        setHasJoined(!!currentGames[gameId]);
      }
    };

    fetchUserData();

    // Set up real-time listener for game updates
    const gameRef = doc(db, 'games', gameId);
    const unsubscribe = onSnapshot(gameRef, (doc) => {
      if (doc.exists()) {
        setGame({ id: doc.id, ...doc.data() });
      } else {
        navigate('/home');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [gameId, navigate]);

  const handleJoinClick = () => {
    if (game.entryFee > userPoints) {
      navigate('/shop');
      return;
    }
    setShowJoinConfirm(true);
  };

  const handleJoinConfirm = async () => {
    try {
      const gameRef = doc(db, 'games', gameId);
      const userRef = doc(db, 'users', auth.currentUser.email);

      // Create the game entry for user's currentGames
      const gameEntry = {
        gameId: gameId,
        result: 'pending',
        joinedAt: new Date().toISOString(),
        status: 'active'
      };

      // Update user points and add to currentGames
      await updateDoc(userRef, {
        points: userPoints - game.entryFee,
        [`currentGames.${gameId}`]: gameEntry
      });

      // Update game participants
      await updateDoc(gameRef, {
        currentPlayers: game.currentPlayers + 1,
        participants: arrayUnion(auth.currentUser.email)
      });

      setShowJoinConfirm(false);
    } catch (error) {
      console.error('Error joining game:', error);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: {
          message: 'Error joining game. Please try again.',
          type: 'error'
        }
      }));
    }
  };

  const calculatePrizePool = () => {
    return game.currentPlayers * game.entryFee;
  };

  if (loading) {
    return <div className="loading">Loading game...</div>;
  }

  return (
    <>
      <Navbar />
      <div className="game-page-container">
        <Sidebar 
          isExpanded={isSidebarExpanded} 
          setIsExpanded={setIsSidebarExpanded}
        />
        <main className={`game-content ${isSidebarExpanded ? 'shifted' : ''}`}>
          <div className="game-header">
            <h1>{game.title}</h1>
            <div className="game-type">{game.gameType}</div>
          </div>

          <div className="game-info-grid">
            <div className="info-card players-card">
              <h3>Players</h3>
              <div className="info-value">
                {game.currentPlayers}/{game.maxPlayers}
                <button 
                  className="player-list-toggle"
                  onClick={() => setShowPlayerList(!showPlayerList)}
                >
                  {showPlayerList ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                </button>
              </div>
              {showPlayerList && (
                <div className="player-list">
                  {game.participants?.map((participant, index) => (
                    <div key={index} className="player-item">
                      {participant}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="info-card">
              <h3>Prize Pool</h3>
              <div className="info-value highlight">{calculatePrizePool()} Points</div>
            </div>

            <div className="info-card">
              <h3>Rounds</h3>
              <div className="info-value">{game.rounds}</div>
            </div>

            <div className="info-card">
              <h3>Entry Fee</h3>
              <div className="info-value">{game.entryFee} Points</div>
            </div>
          </div>

          {!hasJoined && (
            <button 
              className="join-button"
              onClick={handleJoinClick}
              disabled={game.currentPlayers >= game.maxPlayers}
            >
              {game.currentPlayers >= game.maxPlayers ? 'Game Full' : 'Join Game'}
            </button>
          )}

          {hasJoined && (
            <button 
              className="join-button already-joined"
              onClick={() => navigate('/active-games')}
            >
              Go Back
            </button>
          )}

          {showJoinConfirm && (
            <div className="modal-overlay">
              <div className="confirmation-modal">
                <h2>Confirm Join Game</h2>
                <p>Entry Fee: {game.entryFee} Points</p>
                <p>Your Balance: {userPoints} Points</p>
                <p>Remaining Balance: {userPoints - game.entryFee} Points</p>
                <div className="modal-actions">
                  <button 
                    className="cancel-btn"
                    onClick={() => setShowJoinConfirm(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="confirm-btn"
                    onClick={handleJoinConfirm}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default GamePage; 