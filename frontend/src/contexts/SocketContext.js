import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [sensorData, setSensorData] = useState({});
  const [relayData, setRelayData] = useState({});

  useEffect(() => {
    // Connect to Socket.IO server
    // In production (Docker), connect to current host; nginx proxies to backend
    // In development, connect to localhost:5000
    const socketUrl = process.env.NODE_ENV === 'production'
      ? window.location.origin
      : 'http://localhost:5000';

    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      path: '/socket.io/'
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    newSocket.on('sensor_update', (data) => {
      console.log('Sensor update received:', data);
      // Trigger re-fetch of sensor data in components
    });

    newSocket.on('relay_update', (data) => {
      console.log('Relay update received:', data);
      setRelayData(prev => ({
        ...prev,
        [data.unit_id]: data
      }));
    });

    newSocket.on('connected', (data) => {
      console.log('Server message:', data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const joinUnit = (unitId) => {
    if (socket) {
      socket.emit('join_unit', { unit_id: unitId });
    }
  };

  const leaveUnit = (unitId) => {
    if (socket) {
      socket.emit('leave_unit', { unit_id: unitId });
    }
  };

  const value = {
    socket,
    connected,
    sensorData,
    relayData,
    joinUnit,
    leaveUnit
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};