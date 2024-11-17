exports.updatePlayerCount = functions.firestore
  .document('games/{gameId}')
  .onWrite(async (change, context) => {
    const newData = change.after.data();
    if (!newData) return; // Document was deleted
    
    const participants = newData.participants || [];
    const currentPlayers = participants.length;
    
    // Only update if currentPlayers is different
    if (newData.currentPlayers !== currentPlayers) {
      await change.after.ref.update({
        currentPlayers: currentPlayers
      });
    }
  }); 