import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../config/firebase';
import { doc, updateDoc, getDoc, increment, deleteField, arrayRemove } from 'firebase/firestore';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth } from '../config/firebase';
import '../styles/SquidGlassGame.css';

const SquidGlassGame = ({ gameId, userId, onGameComplete, onGameExit }) => {
  const navigate = useNavigate();
  const [gameBoard, setGameBoard] = useState([]);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [selectedGlass, setSelectedGlass] = useState(null);
  const [highlightCurrent, setHighlightCurrent] = useState(false);
  const [currentPoints, setCurrentPoints] = useState(0);
  const [showPoints, setShowPoints] = useState(false);
  const [canCashout, setCanCashout] = useState(false);
  const [disabledRow, setDisabledRow] = useState(null);
  const [showCashoutAnimation, setShowCashoutAnimation] = useState(false);
  const TOTAL_ROWS = 10;
  const GLASSES_PER_ROW = 3;
  const BASE_POINTS = 10;

  const initializeGame = () => {
    const board = [];
    for (let i = 0; i < TOTAL_ROWS; i++) {
      const correctGlass = Math.floor(Math.random() * GLASSES_PER_ROW);
      const row = Array(GLASSES_PER_ROW).fill(false);
      row[correctGlass] = true;
      board.push(row);
    }
    setGameBoard(board);
    setCurrentPosition(0);
    setIsGameOver(false);
    setHasWon(false);
    setSelectedGlass(null);
  };

  useEffect(() => {
    initializeGame();
  }, []);

  const handleGlassClick = async (rowIndex, glassIndex) => {
    if (isGameOver || disabledRow === rowIndex) return;

    if (rowIndex !== currentPosition) {
      setHighlightCurrent(true);
      setTimeout(() => setHighlightCurrent(false), 1000);
      return;
    }

    setDisabledRow(rowIndex);
    setSelectedGlass({ row: rowIndex, glass: glassIndex });
    const isCorrectGlass = gameBoard[rowIndex][glassIndex];

    if (isCorrectGlass) {
      const newPoints = currentPoints === 0 ? BASE_POINTS : currentPoints * 2;
      setCurrentPoints(newPoints);
      setShowPoints(true);
      setCanCashout(true);
      
      setTimeout(() => {
        setShowPoints(false);
      }, 1000);

      if (currentPosition === TOTAL_ROWS - 1) {
        setHasWon(true);
        setIsGameOver(true);
        await handleGameComplete(true);
      } else {
        setTimeout(() => {
          setCurrentPosition(prev => prev + 1);
          setSelectedGlass(null);
          setDisabledRow(null);
        }, 1000);
      }
    } else {
      setIsGameOver(true);
      setCanCashout(false);
      await handleGameComplete(false);
    }
  };

  const handleGameComplete = async (won) => {
    try {
      const gameRef = doc(db, 'games', gameId);
      await updateDoc(gameRef, {
        [`participants.${userId}.completed`]: true,
        [`participants.${userId}.won`]: won,
        [`participants.${userId}.score`]: won ? currentPosition + 1 : currentPosition
      });
      
      if (onGameComplete) {
        onGameComplete(won);
      }
    } catch (error) {
      console.error('Error updating game status:', error);
    }
  };

  const handlePlayAgain = () => {
    initializeGame();
    setCurrentPoints(0);
    setCanCashout(false);
    setShowPoints(false);
    setDisabledRow(null);
    setShowCashoutAnimation(false);
  };

  const handleQuit = async () => {
    try {
      // Get user's username from the users collection
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', auth.currentUser.email));
      const querySnapshot = await getDocs(q);
      const userDoc = querySnapshot.docs[0];
      const username = userDoc.id;

      // Remove the game from user's currentGames
      await updateDoc(doc(db, 'users', username), {
        [`currentGames.${gameId}`]: deleteField()
      });

      // Update game document to remove the user and decrease player count
      const gameRef = doc(db, 'games', gameId);
      const gameDoc = await getDoc(gameRef);
      
      if (gameDoc.exists()) {
        await updateDoc(gameRef, {
          currentPlayers: increment(-1),
          participants: arrayRemove(username)
        });
      }

      // Navigate back to home page
      navigate('/home');
      
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
  };

  const handleCashout = async () => {
    try {
      setShowCashoutAnimation(true);
      
      // Get user's username
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', auth.currentUser.email));
      const querySnapshot = await getDocs(q);
      const userDoc = querySnapshot.docs[0];
      const username = userDoc.id;

      // Update user's points balance
      await updateDoc(doc(db, 'users', username), {
        points: increment(currentPoints)
      });

      // Show animation and reset game
      setTimeout(() => {
        setShowCashoutAnimation(false);
        // Reset game (same as handlePlayAgain)
        initializeGame();
        setCurrentPoints(0);
        setCanCashout(false);
        setShowPoints(false);
        setDisabledRow(null);
        
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: {
            message: `Successfully cashed out ${currentPoints} points!`,
            type: 'success'
          }
        }));
      }, 2000);

    } catch (error) {
      console.error('Error cashing out:', error);
      setShowCashoutAnimation(false);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: {
          message: 'Error cashing out. Please try again.',
          type: 'error'
        }
      }));
    }
  };

  return (
    <div className="squid-glass-game">
      <div className="game-info">
        <h2>Squid Glass Challenge</h2>
        <p>Choose the correct glass to proceed. Be careful - wrong choice means game over!</p>
        <div className="progress">
          Progress: {currentPosition}/{TOTAL_ROWS}
        </div>
        <div className="current-points">
          Current Points: {currentPoints}
        </div>
        {canCashout && !isGameOver && (
          <button className="cashout-btn" onClick={handleCashout}>
            Cash Out ({currentPoints} points)
          </button>
        )}
      </div>

      <div className="game-board">
        {gameBoard.map((row, rowIndex) => (
          <div 
            key={rowIndex} 
            className={`glass-row ${
              rowIndex === currentPosition 
                ? `active ${highlightCurrent ? 'highlight-current' : ''}` 
                : rowIndex > currentPosition 
                  ? 'locked' 
                  : ''
            } ${disabledRow === rowIndex ? 'disabled' : ''}`}
          >
            {row.map((isCorrect, glassIndex) => (
              <div
                key={glassIndex}
                className={`glass ${
                  selectedGlass?.row === rowIndex && selectedGlass?.glass === glassIndex
                    ? isCorrect 
                      ? 'correct' 
                      : 'broken'
                    : ''
                } ${rowIndex < currentPosition ? 'passed' : ''}`}
                onClick={() => handleGlassClick(rowIndex, glassIndex)}
              >
                <div className="glass-surface"></div>
                <div className="glass-reflection"></div>
                {showPoints && 
                 rowIndex === currentPosition && 
                 selectedGlass?.glass === glassIndex && 
                 isCorrect && (
                  <div className="points-popup">+{currentPoints}</div>
                )}
              </div>
            ))}
            {rowIndex === currentPosition + 1 && currentPoints > 0 && !isGameOver && (
              <div className="multiplier-indicator">
                <span className="multiply-symbol">×2</span>
                <span className="potential-win">
                  Potential: {currentPoints * 2}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {showCashoutAnimation && (
        <div className="cashout-animation">
          <div className="points-collector">
            +{currentPoints} POINTS!
          </div>
        </div>
      )}

      {isGameOver && (
        <div className={`game-over ${hasWon ? 'won' : 'lost'}`}>
          <h2>{hasWon ? 'Congratulations!' : 'Game Over!'}</h2>
          <p>
            {hasWon 
              ? `You successfully crossed all the glass panels!`
              : `You made it across ${currentPosition} rows!`}
          </p>
          <div className="game-over-buttons">
            <button className="play-again-btn" onClick={handlePlayAgain}>
              Play Again
            </button>
            <button className="quit-btn" onClick={handleQuit}>
              Quit
            </button>
          </div>
        </div>
      )}
      <button onClick={handleQuit} className="quit-button">
        Quit Game
      </button>
    </div>
  );
};

export default SquidGlassGame; 