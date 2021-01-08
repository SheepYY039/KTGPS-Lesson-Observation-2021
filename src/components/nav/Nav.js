import React, { useState, useContext } from 'react';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import Modal from '@material-ui/core/Modal';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import { makeStyles } from '@material-ui/core/styles';
import { googleProvider, auth } from '../services/firebase';
import { UserContext } from '../providers/UserProvider';

const Nav = () => {
  const user = useContext(UserContext);
  const useStyles = makeStyles((theme) => ({
    root: {
      flexGrow: 1,
    },
    menuButton: {
      marginRight: theme.spacing(2),
    },
    title: {
      flexGrow: 1,
    },
  }));

  googleProvider.setCustomParameters({
  login_hint: 'xxxxx@ktgps.edu.hk',
  prompt: 'select_account',
  hd:'ktgps.edu.hk'
  });

  const signInWithGoogle = async () => {
    const result = await auth
      .signInWithPopup(googleProvider)
      .then((res) => {
        console.log(res.user);
        return res.user;
      })
      // .disconnect()
      .catch((error) => {
        console.log(error.message);
      });
  };

  const logOut = () => {
    auth
      .signOut()
      .then(() => {
        console.log('logged out');
        // window.location.reload();
      })
      .catch((error) => {
        console.log(error.message);
      });
  };

  const classes = useStyles();
  return (
    <>
      <AppBar position='static'>
        <Toolbar>
          <IconButton
            edge='start'
            className={classes.menuButton}
            color='inherit'
            aria-label='menu'
          >
            <MenuIcon />
          </IconButton>
          <Typography variant='h6' className={classes.title}>
            考績觀課時間表 {!user && '（請先於右上角登入 \u2192）' }
          </Typography>
          <div
            id='firebaseui-auth-container'
            className='g-signin2'
            data-onsuccess='onSignIn'
          ></div>
          {user ? (
            <Button
              color='inherit'
              variant='outlined'
              key='info-button'
              type='text'
              onClick={logOut}
            >
            <Typography>
              登出  {user.displayName}</Typography>
            </Button>
          ) : (
            <Button
              color='inherit'
              variant='outlined'
              key='info-button'
              type='text'
              onClick={signInWithGoogle}
            >
              登入
            </Button>
          )}
        </Toolbar>
      </AppBar>
    </>
  );
};

export default Nav;
