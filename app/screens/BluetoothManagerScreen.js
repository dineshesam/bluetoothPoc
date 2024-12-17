import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View, Switch, ActivityIndicator, PermissionsAndroid, Platform } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useConnectedDevices } from './ConnectedDevicesContext';
 
 
const manager = new BleManager();
 
const BluetoothManagerScreen = ({ navigation }) => {
  const [devices, setDevices] = useState([]); // Scanned devices
  //const [connectedDevices, setConnectedDevices] = useState([]); // Connected devices
  const { connectedDevices, setConnectedDevices } = useConnectedDevices();
  const [scanning, setScanning] = useState(false);
  const [connecting, setConnecting] = useState(false); // Spinner state
  const [savedList, setSavedList] = useState([]); // Devices connected for the first time
  const [autoPairing, setAutoPairing] = useState(false); // Auto-pairing mode
  const discoveredDeviceIds = new Set(); // To avoid duplicate devices during scanning
  const [timeoutId, setTimeoutId] = useState(null); // Timeout for auto-pairing
  const attemptedConnections = new Set(); // Track devices that have been attempted to connect
 
  useEffect(() => {
    requestPermissions();
    // Bluetooth state change listener for auto-pairing and disconnecting all devices when Bluetooth is off
    manager.onStateChange((state) => {
      if (state === 'PoweredOn') {
        setAutoPairing(true); // Start auto-pairing when Bluetooth is powered on
      } else {
        setAutoPairing(false); // Stop auto-pairing if Bluetooth is turned off
        disconnectAllDevices(); // Disconnect all devices when Bluetooth is turned off
      }
    }, true);
 
    return () => {
      manager.destroy();
      if (timeoutId) {
        clearTimeout(timeoutId); // Clear timeout on cleanup
      }
    };
  }, []);
 
  useEffect(() => {
    if (autoPairing) {
      startAutoPairing();
    }
    return () => stopScan(); // Stop scanning when auto-pairing is turned off
  }, [autoPairing]);
 
  useEffect(() => {
    const loadSavedList = async () => {
        try {
            const storedList = await AsyncStorage.getItem('SAVED_LIST');
            if (storedList) {
                setSavedList(JSON.parse(storedList));
            }
        } catch (error) {
            console.error('Error loading savedList:', error);
        }
    };
    loadSavedList();
}, []);
 
useEffect(() => {
  const connectToSavedDevices = async () => {
    try {
      if (!savedList.length) return;
 
      // Check if Bluetooth is enabled
      const state = await manager.state();
      if (state !== 'PoweredOn') {
        console.log('Bluetooth is not powered on. Cannot auto-connect to saved devices.');
        return;
      }
 
      for (const device of savedList) {
        // Skip if the device is already connected
        if (connectedDevices.some((d) => d.id === device.id)) continue;
 
        try {
          console.log(`Attempting to connect to saved device: ${device.name || 'Unnamed Device'}`);
          await connectToDevice(device);
        } catch (error) {
          console.error(`Failed to connect to saved device: ${device.name || 'Unnamed Device'}`, error);
        }
      }
    } catch (error) {
      console.error('Error during auto-connect to saved devices:', error);
    }
  };
 
  connectToSavedDevices(); // Attempt connection on app startup
}, [savedList]);
 
  // Request Bluetooth permissions for Android
  const requestPermissions = async () => {
    if (Platform.OS === 'android' && Platform.Version >= 31) {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
    } else if (Platform.OS === 'android') {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADMIN,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
    }
  };
 
  const navigateToWritePage = () => {
    navigation.navigate('WritePage');
  };
 
  // Start scanning for Bluetooth devices
  const startScan = () => {
    manager.state().then((state) => {
      if (state !== 'PoweredOn') {
        Alert.alert('Bluetooth is Off', 'Please turn on Bluetooth to scan for devices');
        return;
      }
 
      setDevices([]); // Clear the list before scanning
      discoveredDeviceIds.clear(); // Reset device ids to avoid duplicates
      setScanning(true);
      manager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.error('Scan Error:', error);
          setScanning(false);
          return;
        }
 
        if (
          device &&
          device.name && // Only scan devices with names
          !discoveredDeviceIds.has(device.id)
        ) {
          discoveredDeviceIds.add(device.id);
          setDevices((prev) => [...prev, device]); // Add new device to the list
        }
      });
    });
  };
 
  // Stop scanning for Bluetooth devices
  const stopScan = () => {
    manager.stopDeviceScan();
    setScanning(false);
  };
 
 
  const saveSavedList = async (list) => {
    try {
        await AsyncStorage.setItem('SAVED_LIST', JSON.stringify(list));
    } catch (error) {
        console.error('Error saving savedList:', error);
    }
};
 
const updateSavedList = (newDevice) => {
    const updatedList = [...savedList, newDevice];
    setSavedList(updatedList);
    saveSavedList(updatedList); // Persist the list
};
 
  // Connect to a selected Bluetooth device
  const connectToDevice = async (device) => {
    try {
      if (connectedDevices.some((d) => d.id === device.id)) {
        Alert.alert('Already Connected', 'This device is already connected.');
        return;
      }
      setConnecting(true); // Show spinner
      const connectedDevice = await manager.connectToDevice(device.id);
      await connectedDevice.discoverAllServicesAndCharacteristics();
 
      setConnectedDevices((prev) => [...prev, connectedDevice]);
 
      // setSavedList((prev) => {
      //   if (!prev.find((d) => d.id === device.id)) {
      //     return [...prev, { id: device.id, name: device.name }];
      //   }
      //   return prev; // Avoid duplicates
      // });
 
      // Update saved list only if the device is not already saved
      if (!savedList.find((d) => d.id === device.id)) {
        updateSavedList({ id: device.id, name: device.name });
    }
 
      console.log('Connected to', device.name || 'Unnamed Device');
    } catch (err) {
      console.error('Connection Error:', err);
      Alert.alert('Connection Error', err.message);
    } finally {
      setConnecting(false); // Hide spinner
    }
  };
 
  // Auto-pairing function: Only connect to saved devices once
  const startAutoPairing = () => {
    console.log('Auto-pairing started...');
    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error('Auto-Pairing Scan Error:', error);
        return;
      }
 
      // Only connect if the device is saved, not already connected, and not attempted yet
      const savedDevice = savedList.find((saved) => saved.id === device.id);
      if (
        savedDevice &&
        !connectedDevices.find((connected) => connected.id === device.id) &&
        !attemptedConnections.has(device.id)
      ) {
        console.log(`Connecting to ${savedDevice.name || 'Unnamed Device'} from saved list.`);
        attemptedConnections.add(device.id); // Mark the device as attempted
        connectToDevice(device);
      }
    });
 
    const id = setTimeout(() => {
      console.log('Auto-pairing timed out');
      stopScan();
      setAutoPairing(false);  // Turn off auto-pairing toggle after timeout
    }, 30000); // 30 seconds timeout
 
    setTimeoutId(id); // Store the timeout ID to clear it later if needed
  };
 
  const toggleAutoPairing = () => {
    if (autoPairing) {
      stopScan(); // Stop scanning when auto-pairing is turned off
    }
    setAutoPairing(!autoPairing);
  };
 
  // Disconnect all devices
  const disconnectAllDevices = async () => {
    try {
      await Promise.all(
        connectedDevices.map(async (device) => {
          await manager.cancelDeviceConnection(device.id);
        })
      );
      setConnectedDevices([]); // Clear the connected devices list
      console.log('All devices disconnected');
    } catch (err) {
      console.error('Disconnection Error:', err);
      Alert.alert('Disconnection Error', err.message);
    }
  };
 
  //Disconnect Individual device
 
  const disconnect = async (deviceId) => {
    try {
      const device = await manager.cancelDeviceConnection(deviceId); // Cancel connection
      console.log(`Disconnected from ${device.name || 'Unnamed Device'}`);
      setConnectedDevices((prev) =>
        prev.filter((d) => d.id !== deviceId) // Remove from connected devices
      );
    } catch (error) {
      console.error(`Error disconnecting from device: ${error.message}`);
      Alert.alert('Disconnection Error', error.message);
    }
  };
 
 
 
  return (
    <View style={styles.container}>
      <View style={styles.scan}>
        <Text style={styles.scanTxt}>
          {scanning ? 'Stop Scanning' : 'Start Scanning'}
        </Text>
        <Switch
          trackColor={{ false: '#767577', true: '#1969fc' }}
          thumbColor={scanning ? '#f4f3f4' : '#f4f3f4'}
          onValueChange={scanning ? stopScan : startScan}
          value={scanning}
        />
      </View>
 
      {/* Scanned Devices List */}
      <Text style={styles.sectionHeader}>Scanned Devices:</Text>
      <View style={styles.scannedDevicesContainer}>
        <FlatList
          data={devices}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => connectToDevice(item)}
              style={styles.device}
              disabled={connectedDevices.some((d) => d.id === item.id)} // Disable button if already connected
            >
              <Text>{item.name || 'Unnamed Device'}</Text>
              <Text>{item.id}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
 
      {connecting && (
        <View style={styles.spinnerContainer}>
          <ActivityIndicator size="large" color="#1969fc" />
        </View>
      )}
 
      {/* Connected Devices */}
      <Text style={styles.sectionHeader}>Connected Devices:</Text>
      {connectedDevices.length > 0 && (
      <TouchableOpacity style={styles.controlBtn} onPress={navigateToWritePage}>
        <Text style={styles.controlTxt}>Controll All</Text>
      </TouchableOpacity>
    )}
    <View style={styles.ConnectedDevicesContainer}>
      <FlatList
        data={connectedDevices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.connectedDevice}>
            <View>
            <TouchableOpacity onPress={() => navigation.navigate('DeviceDetails', { device: { id: item.id, name: item.name } })}>
              <Text>{item.name || 'Unnamed Device'}</Text>
              <Text>{item.id}</Text>
            </TouchableOpacity>
            </View>
            <View>
            <TouchableOpacity
                onPress={()=>disconnect(item.id)}
                style={styles.disconnect}
              >
                <Text style={styles.disconnectAllText}>Disconnect</Text>
              </TouchableOpacity>
              </View>
          </View>
        )}
      />
    </View>
      {/* Saved Devices */}
      <Text style={styles.sectionHeader}>Saved Devices:</Text>
      <View style={styles.savedDevicesContainer}>
        <FlatList
          data={savedList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.savedDevice}>
              <Text>{item.name || 'Unnamed Device'}</Text>
            </View>
          )}
        />
      </View>
      {/* Auto-pairing Toggle */}
      <View style={styles.autoPairingContainer}>
        <Text style={styles.autoPairingText}>Auto Pairing</Text>
        <Switch
          trackColor={{ false: '#767577', true: '#1969fc' }}
          thumbColor={autoPairing ? '#f4f3f4' : '#f4f3f4'}
          onValueChange={toggleAutoPairing}
          value={autoPairing}
        />
      </View>
 
      {/* Disconnect All Button */}
      {connectedDevices.length > 0 && (
        <TouchableOpacity style={styles.disconnectAllButton} onPress={disconnectAllDevices}>
          <Text style={styles.disconnectAllText}>Disconnect All</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
 
const styles = StyleSheet.create({
  container: {flex: 1,padding: 20,},
  scan:{flexDirection: 'row',justifyContent: 'space-between' ,marginTop:20},
  scanTxt:{ fontSize: 16, fontWeight: 'bold' },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', marginVertical: 10 },
  controlBtn:{backgroundColor: '#1969fc',paddingVertical: 6,paddingHorizontal:3,borderRadius: 6,justifyContent: 'center',marginVertical: 2,marginRight:250,},
  controlTxt:{color: '#fff',fontWeight: 'bold',fontSize: 14},
  device: { marginVertical: 8, padding: 15, backgroundColor: '#f0f0f0', borderRadius: 8 },
  connectedDevice: { marginVertical: 8, padding: 15, backgroundColor: '#d0ffd8', borderRadius: 8 ,flexDirection:'row',justifyContent:'space-between',alignItems:'center',width:'99%'},
  savedDevice: { marginVertical: 8, padding: 15, backgroundColor: '#e0e0e0', borderRadius: 8 },
  spinnerContainer: { justifyContent: 'center', alignItems: 'center', flex: 1 },
  scannedDevicesContainer:{height:250,marginBottom:7},
  ConnectedDevicesContainer:{height:120,marginBottom:7},
  savedDevicesContainer:{height:120,marginBottom:7},
  autoPairingContainer: { marginVertical: 20, flexDirection: 'row', alignItems: 'center' },
  autoPairingText: { fontSize: 16, fontWeight: 'bold' },
  disconnectAllButton: {marginVertical: 20,padding: 15,backgroundColor: '#ff4d4d',borderRadius: 8,},
  disconnect:{padding:5,backgroundColor: '#ff4d4d',borderRadius: 8,},
  disconnectAllText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
});
 
export default BluetoothManagerScreen;