import React, { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { collection, onSnapshot, query, orderBy, limit, doc, deleteDoc } from 'firebase/firestore';
import GameNotification from './GameNotification';

const NotificationListener = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const notificationsRef = collection(db, 'notifications');
    const q = query(notificationsRef, orderBy('timestamp', 'desc'), limit(5));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotifications(newNotifications);

      // Set up deletion timers for each notification
      newNotifications.forEach(notification => {
        setTimeout(async () => {
          try {
            const notificationRef = doc(db, 'notifications', notification.id);
            await deleteDoc(notificationRef);
          } catch (error) {
            console.error('Error deleting notification:', error);
          }
        }, 30000); // 30 seconds
      });
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
      {notifications.map(notification => (
        <GameNotification
          key={notification.id}
          message={notification.message}
          type={notification.type}
          timestamp={notification.timestamp?.toDate()}
          onClose={() => {}}
        />
      ))}
    </>
  );
};

export default NotificationListener; 