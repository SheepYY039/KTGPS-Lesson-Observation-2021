import React from 'react';

export default React.createContext({
  token: null,
  userId: null,
  username: null,
  buffer: null,
  email: null,
  password: null,
  updateUserInfo: (username, email, password) => {},
  login: (token, userId, username, email, password, tokenExpiration) => {},
  uploadProfileImage: (buffer) => {},
  logout: () => {},
});
