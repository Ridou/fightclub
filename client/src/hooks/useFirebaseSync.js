// useFirebaseSync.js
import { useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { rtdb } from '../firebase';

const useFirebaseSync = (draftRoomId, user, handlePickOrBan) => {
  useEffect(() => {
    const draftRoomRef = ref(rtdb, `draftRooms/${draftRoomId}`);

    const unsubscribe = onValue(draftRoomRef, (snapshot) => {
      const data = snapshot.val();
      // Update local states based on Firebase data
      // You can dispatch actions or set states here
    });

    return () => unsubscribe();
  }, [draftRoomId, user.uid, handlePickOrBan]);
};

export default useFirebaseSync;
