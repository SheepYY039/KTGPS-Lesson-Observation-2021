import React, { useContext } from 'react';
import './App.scss';
import Nav from './components/nav/Nav';
import CalendarTable from './components/table/CalendarTable';
import UserProvider, { UserContext } from './components/providers/UserProvider';

function App() {
  const user = useContext(UserContext);
  return (
    <UserProvider>
      <div className='App'>
        <Nav />
        {user && <CalendarTable user={user} /> }
      </div>
    </UserProvider>
  );
}

export default App;
