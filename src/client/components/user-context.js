import React, { useEffect, useState } from 'react';
import firebase from '../../firebase/clientApp';

const UserContext = React.createContext();

function UserProvider({ children }) {
  const [user, setUser] = useState({ loading: true });

  useEffect(() => {
    firebase.auth().onAuthStateChanged((id) => {
      setUser(id);
    });
  }, []);

  const value = { user, setUser };
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

function useUser() {
  const context = React.useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

export { UserProvider, useUser };
