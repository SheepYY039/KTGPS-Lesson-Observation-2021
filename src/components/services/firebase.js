import React, { useState, useEffect, createContext } from 'react';
import dotenv from 'dotenv';
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore'
import UserProvider from '../providers/UserProvider';

dotenv.config();

firebase.initializeApp({
  apiKey: 'AIzaSyBsGkiousZK5huGrq3mlR_qVo1ybj_wjUA',
  authDomain: 'guan-ke-shi-jian-biao.firebaseapp.com',
  databaseURL: 'https://guan-ke-shi-jian-biao-default-rtdb.firebaseio.com',
  projectId: 'guan-ke-shi-jian-biao',
  storageBucket: 'guan-ke-shi-jian-biao.appspot.com',
  messagingSenderId: '308786760354',
  appId: '1:308786760354:web:2c35f81a9863026a2c25fb',
  measurementId: 'G-TMHTL1XGMC',
});

export const auth = firebase.auth();

export const db = firebase.firestore();
// export const UserContext = createContext({ user: null });

export const googleProvider = new firebase.auth.GoogleAuthProvider();

