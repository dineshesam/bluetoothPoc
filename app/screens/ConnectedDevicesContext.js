import React, { createContext, useContext, useState } from 'react';

const ConnectedDevicesContext = createContext();

export const ConnectedDevicesProvider = ({ children }) => {
  const [connectedDevices, setConnectedDevices] = useState([]);

  return (
    <ConnectedDevicesContext.Provider value={{ connectedDevices, setConnectedDevices }}>
      {children}
    </ConnectedDevicesContext.Provider>
  );
};

export const useConnectedDevices = () => useContext(ConnectedDevicesContext);
