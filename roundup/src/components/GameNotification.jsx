import React, { useEffect, useState } from 'react';
import { FaBell, FaTrash, FaGamepad } from 'react-icons/fa';
import { db } from '../config/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import '../styles/GameNotification.css';

const GameNotification = ({ message, type, onClose, timestamp }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    const visibilityTimer = setTimeout(() => {
      setIsVisible(false);
    }, 5000);

    const unmountTimer = setTimeout(() => {
      setShouldRender(false);
      onClose();
    }, 5300);

    return () => {
      clearTimeout(visibilityTimer);
      clearTimeout(unmountTimer);
    };
  }, [onClose]);

  if (!shouldRender) return null;

  const getIcon = () => {
    switch (type) {
      case 'created':
        return <FaGamepad className="notification-icon" />;
      case 'deleted':
        return <FaTrash className="notification-icon" />;
      default:
        return <FaBell className="notification-icon" />;
    }
  };

  return (
    <div className={`game-notification ${type} ${isVisible ? 'show' : ''}`}>
      {getIcon()}
      <span className="notification-message">{message}</span>
      <span className="notification-time">
        {new Date(timestamp).toLocaleTimeString()}
      </span>
    </div>
  );
};

export default GameNotification; 