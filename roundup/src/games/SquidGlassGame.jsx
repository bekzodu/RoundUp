import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../config/firebase';
import { doc, updateDoc, getDoc, increment, deleteField, arrayRemove, onSnapshot } from 'firebase/firestore';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth } from '../config/firebase';
import '../styles/SquidGlassGame.css';
import { animatePoints } from '../utils/animatePoints';

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
  const [showHint, setShowHint] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [revealCorrect, setRevealCorrect] = useState(null);
  const [celebrationActive, setCelebrationActive] = useState(false);
  const [gameStatus, setGameStatus] = useState('waiting');
  const [playerCount, setPlayerCount] = useState(0);
  const [minPlayers, setMinPlayers] = useState(0);
  const [countdown, setCountdown] = useState(null);
  const [participants, setParticipants] = useState({});
  const [isReady, setIsReady] = useState(false);
  const [currentTurn, setCurrentTurn] = useState(null);
  const [otherPlayers, setOtherPlayers] = useState([]);
  const TOTAL_ROWS = 10;
  const GLASSES_PER_ROW = 3;
  const BASE_POINTS = 10;
  const [isMultiplayer, setIsMultiplayer] = useState(false);

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

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', auth.currentUser.email));
        const querySnapshot = await getDocs(q);
        const userDoc = querySnapshot.docs[0];
        setIsAdmin(userDoc.data().isAdmin === true);
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };

    checkAdminStatus();
  }, []);

  useEffect(() => {
    const gameRef = doc(db, 'games', gameId);
    
    const unsubscribe = onSnapshot(gameRef, async (snapshot) => {
      if (snapshot.exists()) {
        const gameData = snapshot.data();
        setGameStatus(gameData.status);
        setParticipants(gameData.participants || []);
        setPlayerCount(gameData.participants?.length || 0);
        setMinPlayers(gameData.minPlayers);
        
        // Determine if this is a multiplayer game
        const isMulti = gameData.minPlayers > 1;
        setIsMultiplayer(isMulti);

        try {
          if (isMulti) {
            // Check if current player is ready
            const currentPlayer = gameData.participants?.find(p => p.id === userId);
            setIsReady(currentPlayer?.ready || false);

            // Multiplayer game logic
            if (gameData.participants?.length >= gameData.minPlayers && 
                gameData.participants?.every(p => p.ready) &&
                (gameData.status === 'waiting' || gameData.status === 'published')) {
              await updateDoc(gameRef, {
                status: 'active',
                currentTurn: gameData.participants[0].id
              });
            }
            // If we have players but not enough for active state
            else if (gameData.participants?.length > 0 && 
                     gameData.participants?.length < gameData.minPlayers && 
                     gameData.status === 'published') {
              await updateDoc(gameRef, {
                status: 'waiting'
              });
            }
          } else {
            // Single player game logic
            if (gameData.participants?.length === 1 && 
                gameData.status === 'published') {
              await updateDoc(gameRef, {
                status: 'active'
              });
            }
          }
        } catch (error) {
          console.error('Error updating game status:', error);
        }
      }
    });

    return () => unsubscribe();
  }, [gameId, userId]);

  const handleGlassClick = async (rowIndex, glassIndex) => {
    if (gameStatus !== 'active') return;
    
    // For multiplayer games, check if it's player's turn
    if (isMultiplayer && currentTurn !== userId) {
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: {
          message: "It's not your turn!",
          type: 'warning'
        }
      }));
      return;
    }

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
        setCelebrationActive(true);
        setTimeout(async () => {
          await handleGameComplete(true);
          setCelebrationActive(false);
        }, 4000);
      } else {
        setTimeout(() => {
          setCurrentPosition(prev => prev + 1);
          setSelectedGlass(null);
          setDisabledRow(null);
        }, 1000);
      }
    } else {
      const correctGlassIndex = gameBoard[rowIndex].findIndex(glass => glass === true);
      setRevealCorrect({ row: rowIndex, glass: correctGlassIndex });
      setIsGameOver(true);
      setCanCashout(false);
      await handleGameComplete(false);
    }

    // For multiplayer games, update turn after move
    if (isMultiplayer) {
      const gameRef = doc(db, 'games', gameId);
      const gameDoc = await getDoc(gameRef);
      const playerIds = Object.keys(gameDoc.data().participants);
      const currentIndex = playerIds.indexOf(userId);
      const nextPlayer = playerIds[(currentIndex + 1) % playerIds.length];
      
      await updateDoc(gameRef, {
        currentTurn: nextPlayer,
        [`participants.${userId}.currentPosition`]: currentPosition,
        [`participants.${userId}.isAlive`]: isCorrectGlass
      });
    }
  };

  const handleGameComplete = async (won) => {
    try {
      const gameRef = doc(db, 'games', gameId);
      
      if (won && currentPosition === TOTAL_ROWS - 1) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', auth.currentUser.email));
        const querySnapshot = await getDocs(q);
        const userDoc = querySnapshot.docs[0];
        const username = userDoc.id;
        
        const currentUserPoints = userDoc.data().points || 0;

        await updateDoc(doc(db, 'users', username), {
          points: increment(currentPoints)
        });

        window.dispatchEvent(new CustomEvent('animate-points', {
          detail: {
            startValue: currentUserPoints,
            endValue: currentUserPoints + currentPoints
          }
        }));

        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: {
            message: `Congratulations! You've earned ${currentPoints} points!`,
            type: 'success'
          }
        }));
      }

      await updateDoc(gameRef, {
        [`participants.${userId}.completed`]: true,
        [`participants.${userId}.won`]: won,
        [`participants.${userId}.score`]: won ? currentPosition + 1 : currentPosition,
        [`participants.${userId}.pointsEarned`]: won ? currentPoints : 0
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
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', auth.currentUser.email));
      const querySnapshot = await getDocs(q);
      const userDoc = querySnapshot.docs[0];
      const username = userDoc.id;

      // Get the game data to check if user has played
      const gameRef = doc(db, 'games', gameId);
      const gameDoc = await getDoc(gameRef);
      
      if (gameDoc.exists()) {
        const gameData = gameDoc.data();
        const hasPlayed = gameData.participants?.[username]?.played || false;
        
        // If user hasn't played, refund their entry fee
        if (!hasPlayed) {
          // Refund entry fee to user
          await updateDoc(doc(db, 'users', username), {
            points: increment(gameData.entryFee),
            [`currentGames.${gameId}`]: deleteField()
          });

          // Decrease prize pool by entry fee
          await updateDoc(gameRef, {
            prizePool: increment(-gameData.entryFee),
            participants: arrayRemove(username)
          });
        } else {
          // If user has played, just remove them from the game
          await updateDoc(doc(db, 'users', username), {
            [`currentGames.${gameId}`]: deleteField()
          });

          await updateDoc(gameRef, {
            participants: arrayRemove(username)
          });
        }
      }

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
      
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', auth.currentUser.email));
      const querySnapshot = await getDocs(q);
      const userDoc = querySnapshot.docs[0];
      const username = userDoc.id;
      
      const currentUserPoints = userDoc.data().points || 0;

      await updateDoc(doc(db, 'users', username), {
        points: increment(currentPoints)
      });

      window.dispatchEvent(new CustomEvent('animate-points', {
        detail: {
          startValue: currentUserPoints,
          endValue: currentUserPoints + currentPoints
        }
      }));

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

  const handleShowHint = () => {
    setShowHint(true);
    setTimeout(() => setShowHint(false), 1000); // Hide hint after 1 second
  };

  const handleReadyUp = async () => {
    try {
      const gameRef = doc(db, 'games', gameId);
      const gameDoc = await getDoc(gameRef);
      const currentParticipants = gameDoc.data().participants || [];
      
      // Find the participant's index
      const participantIndex = currentParticipants.findIndex(p => p === userId);
      
      if (participantIndex !== -1) {
        // Create an updated participants array with ready status
        const updatedParticipants = currentParticipants.map(p => {
          if (p === userId) {
            return {
              id: userId,
              ready: true,
              isAlive: true,
              currentPosition: 0
            };
          }
          return p;
        });

        await updateDoc(gameRef, {
          participants: updatedParticipants
        });
        
        setIsReady(true);
      }
    } catch (error) {
      console.error('Error readying up:', error);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: {
          message: 'Error readying up. Please try again.',
          type: 'error'
        }
      }));
    }
  };

  return (
    <div className="squid-glass-game">
      {isMultiplayer && (gameStatus === 'waiting' || gameStatus === 'published') ? (
        <div className="waiting-room">
          <h2>Waiting for Players</h2>
          <div className="players-list">
            {Object.entries(participants).map(([id, data]) => (
              <div key={id} className="player-status">
                <span>{id}</span>
                <span className={data.ready ? 'ready' : 'not-ready'}>
                  {data.ready ? '✅ Ready' : '⏳ Not Ready'}
                </span>
              </div>
            ))}
          </div>
          <p className="players-needed">
            {playerCount < minPlayers 
              ? `Waiting for ${minPlayers - playerCount} more players...`
              : 'All players must ready up to start!'}
          </p>
          {!isReady && (
            <button 
              className="ready-button" 
              onClick={handleReadyUp}
              disabled={playerCount < minPlayers}
            >
              Ready Up
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="game-info">
            <h2>Squid Glass Challenge</h2>
            
            {gameStatus === 'waiting' && (
              <div className="waiting-status">
                <p>
                  Waiting for players<span className="waiting-dots"></span>
                </p>
                <p>Players: {playerCount}/{minPlayers}</p>
              </div>
            )}
            
            {gameStatus === 'active' && (
              <>
                <p>Choose the correct glass to proceed. Be careful - wrong choice means game over!</p>
                <div className="progress">
                  Progress: {currentPosition}/{TOTAL_ROWS}
                </div>
              </>
            )}
            
            <div className="current-points">
              Current Points: {currentPoints}
            </div>
            {canCashout && !isGameOver && (
              <button className="cashout-btn" onClick={handleCashout}>
                Cash Out ({currentPoints} points)
              </button>
            )}
            {isAdmin && !isGameOver && (
              <button className="hint-btn" onClick={handleShowHint}>
                Show Hint
              </button>
            )}
          </div>

          {gameStatus === 'active' && (
            <>
              <div className="game-board">
                {isMultiplayer && (
                  <div className="turn-indicator">
                    {currentTurn === userId ? "Your turn!" : `Waiting for ${currentTurn}'s move...`}
                  </div>
                )}
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
                        } ${
                          rowIndex < currentPosition && isCorrect 
                            ? 'passed-correct' 
                            : ''
                        } ${
                          revealCorrect?.row === rowIndex && 
                          revealCorrect?.glass === glassIndex && 
                          isGameOver && 
                          !hasWon
                            ? 'reveal-correct'
                            : ''
                        } ${
                          showHint && rowIndex === currentPosition && isCorrect ? 'hint' : ''
                        }`}
                        onClick={() => handleGlassClick(rowIndex, glassIndex)}
                      >
                        <div className="glass-surface"></div>
                        <div className="glass-reflection"></div>
                        {selectedGlass?.row === rowIndex && 
                         !isCorrect &&
                         !hasWon && (
                          <div className="x-mark">✕</div>
                        )}
                        {showPoints && 
                         rowIndex === currentPosition && 
                         selectedGlass?.glass === glassIndex && 
                         isCorrect && (
                          <div className="points-popup">+{currentPoints}</div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {currentPoints > 0 && !isGameOver && (
                <div className="multiplier-indicator">
                  <span className="multiply-symbol">×2</span>
                  <span className="potential-win">
                    Potential: {currentPoints * 2}
                  </span>
                </div>
              )}

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

              {celebrationActive && (
                <div className="celebration-container">
                  <div className="celebration-content">
                    <div className="jackpot-text">JACKPOT!</div>
                    <div className="win-amount">+{currentPoints} POINTS!</div>
                    <div className="confetti-container">
                      {[...Array(50)].map((_, i) => (
                        <div key={i} className="confetti"></div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          
          {/* Quit button always visible */}
          <button onClick={handleQuit} className="quit-button">
            Quit Game
          </button>
        </>
      )}
    </div>
  );
};

export default SquidGlassGame; 