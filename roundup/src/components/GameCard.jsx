import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../config/firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, deleteField, increment } from 'firebase/firestore';
import { Close } from '@mui/icons-material';
import { collection, query, where, getDocs } from 'firebase/firestore';
import '../styles/GameCard.css';

const GameCard = ({ game }) => {
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => {
    const checkIfJoined = async () => {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', auth.currentUser.email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        const currentGames = userData.currentGames || {};
        setHasJoined(!!currentGames[game.id]);
      }
    };

    checkIfJoined();
  }, [game.id]);

  const handleJoinClick = async () => {
    if (hasJoined) {
      if (game.status === 'active') {
        navigate(`/game/${game.id}`);
      } else {
        await handleQuitGame();
      }
      return;
    }

    // Fetch user's current points
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', auth.currentUser.email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userData = querySnapshot.docs[0].data();
      setUserPoints(userData.points);
      setShowConfirm(true);
    }
  };

  const handleConfirmJoin = async () => {
    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', auth.currentUser.email));
      const querySnapshot = await getDocs(q);
      const userDoc = querySnapshot.docs[0];
      const username = userDoc.id;
      
      const gameEntry = {
        gameId: game.id,
        result: 'pending',
        joinedAt: new Date().toISOString(),
        status: 'active'
      };

      // Update user points and currentGames
      await updateDoc(doc(db, 'users', username), {
        points: userPoints - game.entryFee,
        [`currentGames.${game.id}`]: gameEntry
      });

      // Update game participants and prize pool
      await updateDoc(doc(db, 'games', game.id), {
        participants: arrayUnion(username),
        prizePool: increment(game.entryFee)
      });

      navigate(`/game/${game.id}`);
    } catch (error) {
      console.error('Error joining game:', error);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: {
          message: 'Error joining game. Please try again.',
          type: 'error'
        }
      }));
    }
    setLoading(false);
  };

  const handleQuitGame = async () => {
    setLoading(true);
    try {
      // Get user's username from the users collection
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', auth.currentUser.email));
      const querySnapshot = await getDocs(q);
      const userDoc = querySnapshot.docs[0];
      const username = userDoc.id;

      // Remove the game from user's currentGames
      await updateDoc(doc(db, 'users', username), {
        [`currentGames.${game.id}`]: deleteField()
      });

      // Update game document to remove the user and decrease player count
      await updateDoc(doc(db, 'games', game.id), {
        participants: arrayRemove(username)
      });

      // Navigate back to home page
      navigate('/');
      
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: {
          message: 'Successfully quit the game',
          type: 'success'
        }
      }));

    } catch (error) {
      console.error('Error quitting game:', error);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: {
          message: 'Error quitting game. Please try again.',
          type: 'error'
        }
      }));
    }
    setLoading(false);
  };

  const calculatePrizePool = () => {
    return game.currentPlayers * game.entryFee;
  };

  return (
    <>
      <div className="game-card">
        <h3>{game.title}</h3>
        <div className="game-details">
          <p>Type: {game.gameType}</p>
          <p>Players: {game.currentPlayers}/{game.maxPlayers}</p>
          <p>Entry Fee: {game.entryFee.toLocaleString()} Points</p>
          <p>Prize Pool: {calculatePrizePool().toLocaleString()} Points</p>
        </div>
        <button 
          className={`join-btn ${game.currentPlayers >= game.maxPlayers ? 'disabled' : ''}`}
          onClick={handleJoinClick}
          disabled={!hasJoined && game.currentPlayers >= game.maxPlayers}
        >
          <span className="btn-text">
            {hasJoined ? 'Go Back' : 
              game.currentPlayers >= game.maxPlayers ? 'Full' : 'Join Game'}
          </span>
          <span className="btn-icon">→</span>
        </button>
      </div>

      {showConfirm && (
        <div className="confirm-overlay">
          <div className="confirm-modal">
            <button 
              className="close-btn"
              onClick={() => setShowConfirm(false)}
            >
              <Close />
            </button>
            
            <h2>Join Game</h2>
            <h3>{game.title}</h3>
            
            <div className="confirm-details">
              <div className="detail-row">
                <span>Entry Fee:</span>
                <span className="value">{game.entryFee.toLocaleString()} Points</span>
              </div>
              <div className="detail-row">
                <span>Your Balance:</span>
                <span className="value">{userPoints.toLocaleString()} Points</span>
              </div>
              <div className="detail-row">
                <span>Remaining Balance:</span>
                <span className={`value ${userPoints - game.entryFee < 0 ? 'negative' : ''}`}>
                  {(userPoints - game.entryFee).toLocaleString()} Points
                </span>
              </div>
            </div>

            {userPoints < game.entryFee ? (
              <div className="insufficient-funds">
                <p>Insufficient funds to join this game.</p>
                <button 
                  className="deposit-btn"
                  onClick={() => navigate('/shop')}
                >
                  Get More Points
                </button>
              </div>
            ) : (
              <button 
                className="confirm-btn"
                onClick={handleConfirmJoin}
                disabled={loading}
              >
                {loading ? 'Joining...' : 'Confirm Join'}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default GameCard; 