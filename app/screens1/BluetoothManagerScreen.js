import React, { useEffect, useState } from 'react';
import {Alert,FlatList,StyleSheet,Text,TouchableOpacity,View,Switch,ActivityIndicator} from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform } from 'react-native';


const manager = new BleManager();

const BluetoothManagerScreen = ({navigation}) => {
  const [devices, setDevices] = useState([]); // Scanned devices
  const [connectedDevices, setConnectedDevices] = useState([]); // Connected devices
  const [scanning, setScanning] = useState(false);
  const [connecting, setConnecting] = useState(false); // Spinner state

  const discoveredDeviceIds = new Set();

  useEffect(() => {
    requestPermissions();
    return () => {
      manager.destroy();
    };
  }, []);

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
          !discoveredDeviceIds.has(device.id) &&
          (device.name || device.id === 'B8:27:EB:80:3B:99')
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

  // Connect to a selected Bluetooth device
  const connectToDevice = async (device) => {
    try {
      // Check if device is already connected
      if (connectedDevices.some((d) => d.id === device.id)) {
        Alert.alert('Already Connected', 'This device is already connected.');
        return;
      }
      setConnecting(true); // Show spinner
      // Connect to the device
      const connectedDevice = await manager.connectToDevice(device.id);
      await connectedDevice.discoverAllServicesAndCharacteristics();

      // Add to connected devices list
      setConnectedDevices((prev) => [...prev, connectedDevice]);

      console.log('Connected to', device.name || 'Unnamed Device');
    } catch (err) {
      console.error('Connection Error:', err);
      Alert.alert('Connection Error', err.message);
    }finally {
      setConnecting(false); // Hide spinner
    }
  };

  

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

  return (
    <View style={styles.container}>
        <View style={{flexDirection:'row', justifyContent:'space-between'}}>
            <View>
                <Text style={{fontSize:16,fontWeight:'bold'}}>{scanning ? 'Stop Scanning' : 'Start Scanning'}</Text>
            </View>
            <View>
                <Switch
                    trackColor={{ false: '#767577', true: '#1969fc' }}
                    thumbColor={scanning ? '#f4f3f4' : '#f4f3f4'}
                    onValueChange={scanning ? stopScan : startScan}
                    value={scanning}
                />
            </View>    
        </View>
        
      {/* Scanned Devices List */}
      <Text style={styles.sectionHeader}>Scanned Devices:</Text>
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

        {/* Connecting Spinner */}
      {connecting && (
        <View style={styles.spinnerContainer}>
          <ActivityIndicator size="large" color="#1969fc" />
        </View>
      )}

      {/* Connected Devices */}
      <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
        <View >
      <Text style={styles.sectionHeader}>Connected Devices:</Text>
      </View>
      <View>
      {connectedDevices.length > 0 && (
        <TouchableOpacity
            onPress={()=>disconnectAllDevices()}
            style={{borderWidth:1,borderColor:'gray',borderRadius:10,padding:5,backgroundColor:'#3983fa'}}
        >
            <Text style={{fontWeight:'bold',fontSize:12}}>Disconnect All</Text>
            {/* <Button title="Disconnect All Devices" onPress={disconnectAllDevices} /> */}
        </TouchableOpacity> 
      )}
      </View>
      </View>
      <FlatList
        data={connectedDevices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.connectedDevice}>
            <TouchableOpacity onPress={()=>navigation.navigate('DeviceDetails',{device:item})}>
              <Text>{item.name || 'Unnamed Device'}</Text>
              <Text>{item.id}</Text>
            </TouchableOpacity>
            {/* <Button title="Disconnect" onPress={() => disconnectDevice(item)} /> */}
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', marginTop: 20 },
  device: { padding: 10, borderBottomWidth: 1, borderColor: '#ccc' },
  connectedDevice: { marginVertical: 10, padding: 10, borderWidth: 1, borderColor: '#ccc' },
  spinnerContainer: { alignItems: 'center', marginVertical: 20 },
});

export default BluetoothManagerScreen;

