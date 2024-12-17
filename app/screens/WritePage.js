import React, { useState } from 'react';
import { Alert, Button, FlatList, StyleSheet, Text, View,TouchableOpacity } from 'react-native';
import { Buffer } from 'buffer';
import { useConnectedDevices } from './ConnectedDevicesContext';

const LIGHT_CONTROL_SVC_UUID = "12345678-1234-5678-1234-56789abcdef0"; // Light Control Service UUID
const LIGHT_SWITCH_CHAR_UUID = "12345678-1234-5678-1234-56789abcdef1"; // On/Off Characteristic UUID
const LIGHT_SWITCH_CHAR_UUID_COLOR_CHANGE = "12345678-1234-5678-1234-56789abcdef2"; // Color Change Characteristic UUID

const WritePage = () => {
  const { connectedDevices } = useConnectedDevices(); // Hook for connected devices
  const [selectedOnOff, setSelectedOnOff] = useState(''); // Selected value for On/Off characteristic
  const [selectedColor, setSelectedColor] = useState(''); // Selected color for Color Change characteristic
  const [writingOnOff, setWritingOnOff] = useState(false); // Writing state for On/Off
  const [writingColor, setWritingColor] = useState(false); // Writing state for Color Change

  // Write characteristic value to all connected devices
  const handleWriteToAllDevices = async (characteristicUuid, inputValue, setWritingState) => {
    if (!inputValue) {
      Alert.alert('Error', 'Please select a value before writing.');
      return;
    }

    setWritingState(true);
    try {
      for (const device of connectedDevices) {
        try {
          const service = await device.discoverAllServicesAndCharacteristics();
          const characteristics = await service.characteristicsForService(LIGHT_CONTROL_SVC_UUID);
          const targetCharacteristic = characteristics.find((char) => char.uuid === characteristicUuid);

          if (targetCharacteristic) {
            const encodedValue = Buffer.from(inputValue).toString('base64');
            await targetCharacteristic.writeWithResponse(encodedValue);
          } else {
            Alert.alert('Error', `Characteristic not found on ${device.name || 'Unnamed Device'}`);
          }
        } catch (err) {
          console.error(`Write Error on device ${device.name || 'Unnamed Device'}:`, err);
          Alert.alert('Write Error', `Failed to write to ${device.name || 'Unnamed Device'}`);
        }
      }
      Alert.alert('Write Complete', 'Values written to all connected devices.');
    } finally {
      setWritingState(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Connected Devices</Text>
      <FlatList
        data={connectedDevices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.deviceContainer}>
            <Text style={styles.deviceText}>{item.name || 'Unnamed Device'}</Text>
            <Text style={styles.deviceText}>mac id: {item.id}</Text>
          </View>
        )}
      />

      {/* Radio buttons for On/Off characteristic */}
      <Text style={styles.label}>Select On/Off Value:</Text>
      <View style={styles.radioGroup}>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => setSelectedOnOff('on')}
        >
          <Text style={styles.radioButtonText}>On</Text>
          {selectedOnOff === 'on' && <View style={styles.radioSelected} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => setSelectedOnOff('off')}
        >
          <Text style={styles.radioButtonText}>Off</Text>
          {selectedOnOff === 'off' && <View style={styles.radioSelected} />}
        </TouchableOpacity>
      </View>

      <Button
        title={writingOnOff ? "Writing On/Off..." : "Write On/Off"}
        onPress={() =>
          handleWriteToAllDevices(LIGHT_SWITCH_CHAR_UUID, selectedOnOff, setWritingOnOff)
        }
        disabled={writingOnOff}
      />

      {/* Radio buttons for Color Change characteristic */}
      <Text style={styles.label}>Select Color:</Text>
      <View style={styles.radioGroup}>
        {['white', 'black', 'red', 'blue', 'orange'].map((color) => (
          <TouchableOpacity
            key={color}
            style={styles.radioButton}
            onPress={() => setSelectedColor(color)}
          >
            <Text style={styles.radioButtonText}>{color.charAt(0).toUpperCase() + color.slice(1)}</Text>
            {selectedColor === color && <View style={styles.radioSelected} />}
          </TouchableOpacity>
        ))}
      </View>

      <Button
        title={writingColor ? "Writing Color Change..." : "Write Color Change"}
        onPress={() =>
          handleWriteToAllDevices(LIGHT_SWITCH_CHAR_UUID_COLOR_CHANGE, selectedColor, setWritingColor)
        }
        disabled={writingColor}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  deviceContainer: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
  },
  deviceText: {
    fontSize: 16,
    marginBottom: 5,
  },
  label: {
    fontSize: 16,
    marginVertical: 10,
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioButtonText: {
    fontSize: 16,
    marginRight: 8,
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007bff',
  },
});

export default WritePage;
