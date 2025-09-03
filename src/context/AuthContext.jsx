import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [authUser, setAuthUser] = useState(undefined); // undefined = still loading
  const [userDoc, setUserDoc] = useState(undefined);

  useEffect(() => {
    let unsubscribeDoc;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubscribeDoc) unsubscribeDoc();

      if (!user) {
        setAuthUser(null);
        setUserDoc(null);
        return;
      }

      // Reload to get latest emailVerified
      await user.reload();
      setAuthUser(auth.currentUser);

      // Listen to Firestore user doc
      const ref = doc(db, "users", user.uid);
      unsubscribeDoc = onSnapshot(ref, (snap) => {
        if (snap.exists()) {
          setUserDoc(snap.data());
        } else {
          setUserDoc(null);
        }
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ authUser, userDoc }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
