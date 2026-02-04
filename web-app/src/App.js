import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [ticket, setTicket] = useState('');
  const [error, setError] = useState('');
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // YOUR SPECIFIC CONFIGURATION
  const MY_GOOGLE_CLIENT_ID = "505819282429-hp3nhqnfun35rma9qlphh1818iek9meq.apps.googleusercontent.com";
  const BASE_URL = "https://gjltb-45-64-227-250.a.free.pinggy.link";

  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptLoaded(true);
    document.head.appendChild(script);
  }, []);

  const handleCallbackResponse = useCallback(async (response) => {
    try {
      const res = await axios.post(`${BASE_URL}/api/auth/verify`, {
        idToken: response.credential
      });
      if (res.data.success) {
        setUser(res.data.user);
        setError('');
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login Failed");
    }
  }, [BASE_URL]);

  const getNewTicket = useCallback(async () => {
    if (!user) return;
    try {
      const res = await axios.post(`${BASE_URL}/api/auth/generate-ticket`, { 
        email: user.email 
      });
      if(res.data.success) setTicket(res.data.ticketToken);
    } catch (err) {
      console.error("Ticket refresh failed.");
    }
  }, [user, BASE_URL]);

  useEffect(() => {
    if (scriptLoaded && !user) {
      const initializeGoogle = () => {
        const btnDiv = document.getElementById("signInDiv");
        if (window.google && btnDiv) {
          window.google.accounts.id.initialize({
            client_id: MY_GOOGLE_CLIENT_ID,
            callback: handleCallbackResponse,
            hd: "iiserkol.ac.in"
          });
          window.google.accounts.id.renderButton(btnDiv, { theme: "outline", size: "large" });
        }
      };
      initializeGoogle();
    }
  }, [scriptLoaded, handleCallbackResponse, MY_GOOGLE_CLIENT_ID, user]);

  useEffect(() => {
    if (user) {
      getNewTicket();
      const interval = setInterval(getNewTicket, 30000);
      return () => clearInterval(interval);
    }
  }, [user, getNewTicket]);

  return (
    <div className="App" key={user ? 'in' : 'out'}>
      <div className="neo-container">
        <div className="dept-header">
          IISER KOLKATA <br/> 
          DEPT. OF EARTH SCIENCES
        </div>
        
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>DES DAY 2026</h1>
        <p className="convergence-tag">CONVERGENCE 2026</p>

        {!user ? (
          <div className="login-section">
            <p>Please authenticate with your IISER email.</p>
            {!scriptLoaded && <p>Loading Security Modules...</p>}
            <div id="signInDiv"></div>
            {error && <div className="error-card">{error}</div>}
          </div>
        ) : (
          <div className="ticket-section">
            <h2 style={{ textTransform: 'uppercase' }}>{user.name}</h2>
            <div className="qr-box">
              <div className="liveness-bar"></div>
              {ticket ? (
                <QRCodeSVG value={ticket} size={200} includeMargin={true} />
              ) : (
                <p>Generating Ticket...</p>
              )}
            </div>
            <p className="warning-text">QR REFRESHES EVERY 30S</p>
            <button className="neo-button logout-red" onClick={() => window.location.reload()}>
              LOGOUT
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;