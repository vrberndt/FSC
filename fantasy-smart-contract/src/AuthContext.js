// src/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import jwt_decode from 'jwt-decode';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);
      setIsAuthenticated(true);
    }
  }, []);


  const login = async (email, password) => {
    try {
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
  
      if (response.ok) {
        const data = await response.json();
        try {
          const userData = jwt_decode(data.token);
          const userWithToken = { ...userData, email, token: data.token };
          setCurrentUser(userWithToken);
          setIsAuthenticated(true);
          localStorage.setItem('user', JSON.stringify(userWithToken)); // Store token and user data in localStorage
          return true;
        } catch (decodeError) {
          console.error('Error during token decoding:', decodeError.message, decodeError);
        }        
      } else {
        // Log the response status and text when the response is not ok
        console.error('Login failed:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Error during login:', error);
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user'); // Remove token and user data from localStorage
  };

  const signup = async (username, email, password) => {
    // Implement signup logic here, e.g., make an API call to create a new user
    try {
      console.log('Attempting signup with:', { username, email, password });

      const response = await fetch('http://localhost:5001/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });
  
      if (response.ok) {
        await response.json();
        // Call the login function using the email and password, not the token
        return await login(email, password);  
      }else {
        // Log the response status and text when the response is not ok
        console.error('Signup failed:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Error during signup:', error);
    }
    return false;
  };

  const createLeague = async (name, invitations) => {
    try {
      const response = await fetch('http://localhost:5001/api/leagues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': currentUser.token,
        },
        body: JSON.stringify({ name, invitations }),
      });
  
      if (response.ok) {
        return await response.json();
      } else {
        console.error('League creation failed:', response.status, await response.text());
        return null;
      }
    } catch (error) {
      console.error('Error during league creation:', error);
      return null;
    }
  };  

  const inviteToLeague = async (leagueId, userId) => {
    try {
      const response = await fetch(`http://localhost:5001/api/leagues/${leagueId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': currentUser.token,
        },
      });
  
      if (response.ok) {
        return await response.json();
      } else {
        console.error('Invite failed:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Error during invite:', error);
    }
    return false;
  };  

  const getPendingInvites = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/leagues/invitations', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': currentUser.token,
        },
      });
  
      if (response.ok) {
        const invites = await response.json();
        console.log("Fetched pending invites in AuthContext:", invites); // Add this line
        return invites;
      } else {
        console.error('Get pending invites failed:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Error during fetching pending invites:', error);
    }
    return [];
  };
  

  const joinLeague = async (leagueId) => {
    console.log('joinLeague leagueId:', leagueId);
    console.log('joinLeague currentUser:', currentUser);    try {
      const response = await fetch(`http://localhost:5001/api/leagues/${leagueId}/join`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': currentUser.token,
        },
        body: JSON.stringify({ email: currentUser.email }),
      });
  
      if (response.ok) {
        return await response.json();
      } else {
        console.error('Join league failed:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Error during joining league:', error);
    }
    return false;
  };

  const declineLeague = async (leagueId) => {
    console.log('declineLeague leagueId:', leagueId);
    console.log('declineLeague currentUser:', currentUser);
      try {
      const response = await fetch(`http://localhost:5001/api/leagues/${leagueId}/decline`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': currentUser.token,
        },
        body: JSON.stringify({ email: currentUser.email }),
      });
  
      if (response.ok) {
        return await response.json();
      } else {
        console.error('Decline league failed:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Error during declining league:', error);
    }
    return false;
  };

  const getLeaguesByStatus = async (status) => {
    try {
      const response = await fetch(`http://localhost:5001/api/leagues?status=${status}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': currentUser.token,
        },
      });
  
      if (response.ok) {
        const allLeagues = await response.json();
        console.log(`Fetched all leagues for status '${status}':`, allLeagues);
  
        if (status === "accepted") {
          return allLeagues.filter((league) =>
            league.admin._id === currentUser._id ||
            league.invitations.some(
              (invitation) =>
                invitation.user._id === currentUser._id &&
                (invitation.status === "accepted" || invitation.role === "Admin")
            )
          );
        } else {
          return allLeagues.filter((league) =>
            league.invitations.some(
              (invitation) =>
                invitation.user._id === currentUser._id && invitation.status === status
            )
          );
        }
      } else {
        console.error(`Get ${status} leagues failed:`, response.status, await response.text());
      }
    } catch (error) {
      console.error(`Error during fetching ${status} leagues:`, error);
    }
    return [];
  };  

  const value = {
    currentUser,
    isAuthenticated,
    login,
    logout,
    signup,
    createLeague,
    inviteToLeague,
    getPendingInvites,
    joinLeague,
    declineLeague,
    getLeaguesByStatus
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContext, AuthProvider };
