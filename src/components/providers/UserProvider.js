import React, { createContext, useState, useEffect } from 'react';
import { auth } from '../services/firebase';
import Nav from '../nav/Nav';
import CalendarTable from '../table/CalendarTable';

export const UserContext = createContext({ user: null });

const UserProvider = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    auth.onAuthStateChanged((userAuth) => {
      setUser(userAuth) ;
    });
    console.log(user);
  }, [user]);

  return (
    <UserContext.Provider value={user}>
    <>
      <Nav/>
      {user&&<CalendarTable user={user} />}
    </>
    </UserContext.Provider>
  );
};
export default UserProvider;
