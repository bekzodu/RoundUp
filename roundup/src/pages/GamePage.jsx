import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../config/firebase';
import { doc, getDoc, updateDoc, arrayRemove, deleteField, arrayUnion, increment } from 'firebase/firestore';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import SquidGlassGame from '../games/SquidGlassGame';
import '../styles/GamePage.css';
import { generateBlocks } from '../utils/gameUtils';

const useGameData = (gameId) => {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [username, setUsername] = useState('');

  useEffect(() => {
    const fetchUserAndGame = async () => {
      try {
        // Fetch user's username
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          setUsername(userDoc.data().username);
        }

        // Fetch game data
        const gameRef = doc(db, 'games', gameId);
        const gameDoc = await getDoc(gameRef);
        
        if (gameDoc.exists()) {
          setGame({ id: gameDoc.id, ...gameDoc.data() });
        } else {
          setError('Game not found');
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Error loading game');
        setLoading(false);
      }
    };

    fetchUserAndGame();
  }, [gameId]);

  return { game, loading, error, username };
};

const GamePage = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { game, loading, error, username } = useGameData(gameId);

  const handleGameExit = async () => {
    try {
      // Get user's username from email first
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', auth.currentUser.email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const username = userDoc.id;  // Get correct username
        
        const gameRef = doc(db, 'games', gameId);
        const gameDoc = await getDoc(gameRef);
        
        if (gameDoc.exists()) {
          // Remove the user from participants array
          await updateDoc(gameRef, {
            participants: arrayRemove(username)
          });

          // Remove game from user's currentGames using correct username
          const userRef = doc(db, 'users', username);
          await updateDoc(userRef, {
            [`currentGames.${gameId}`]: deleteField()
          });
        }
        
        navigate('/active-games');
      }
    } catch (error) {
      console.error('Error exiting game:', error);
    }
  };

  const handleGameComplete = (won) => {
    console.log('Game completed:', won ? 'Won!' : 'Lost!');
  };

  if (loading) {
    return <div className="loading">Loading game...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  const renderGame = () => {
    switch (game.gameType) {
      case 'squid_glass':
        return (
          <SquidGlassGame 
            gameId={gameId}
            userId={username}
            onGameComplete={handleGameComplete}
            onGameExit={handleGameExit}
          />
        );
      default:
        return <div>Game type not supported</div>;
    }
  };

  return (
    <div className="game-page">
      <Navbar />
      <div className="game-container">
        {renderGame()}
      </div>
    </div>
  );
};

export default GamePage; 