import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
} from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import { Buffer } from 'buffer';

const manager = new BleManager();

// UUIDs for Light Control Service and Characteristics
const LIGHT_CONTROL_SVC_UUID = "12345678-1234-5678-1234-56789abcdef0"; // Light Control Service UUID
const LIGHT_SWITCH_CHAR_UUID_ON_OFF = "12345678-1234-5678-1234-56789abcdef1"; // On/Off Characteristic UUID
const LIGHT_SWITCH_CHAR_UUID_COLOR_CHANGE = "12345678-1234-5678-1234-56789abcdef2"; // Color Change Characteristic UUID
const DeviceDetails = ({ navigation, route }) => {
  const { device } = route.params;
  const [deviceServices, setDeviceServices] = useState([]);
  const [deviceCharacteristics, setDeviceCharacteristics] = useState([]);
  const [inputs, setInputs] = useState({}); // Separate input values for each characteristic
  const [notifications, setNotifications] = useState({});

  useEffect(() => {
    const connectToDevice = async () => {
      try {
        const connectedDevice = await manager.connectToDevice(device.id);
        await connectedDevice.discoverAllServicesAndCharacteristics();

        const services = await connectedDevice.services();
        const filteredServices = services.filter(
          (service) =>
            service.uuid !== "00001800-0000-1000-8000-00805f9b34fb" &&
            service.uuid !== "00001801-0000-1000-8000-00805f9b34fb"
        );
        setDeviceServices(filteredServices);

        const characteristics = [];
        for (const service of filteredServices) {
          const serviceCharacteristics = await service.characteristics();
          characteristics.push(...serviceCharacteristics);
        }
        setDeviceCharacteristics(characteristics);
      } catch (err) {
        console.error("Connection Error:", err);
        Alert.alert("Connection Error", err.message);
      }
    };

    connectToDevice();

    return () => {
      manager.cancelDeviceConnection(device.id);
    };
  }, [device.id]);

  const handleRead = async (characteristic) => {
    try {
      const value = await characteristic.read();
      const decodedValue = Buffer.from(value.value, "base64").toString("utf-8");
      Alert.alert(`Read from ${characteristic.uuid}`, decodedValue);
    } catch (err) {
      console.error("Read Error:", err);
      Alert.alert("Read Error", err.message);
    }
  };

  const handleWrite = async (characteristic) => {
    try {
      const encodedValue = Buffer.from(inputs[characteristic.uuid] || "").toString("base64");
      await characteristic.writeWithResponse(encodedValue);
      Alert.alert("Written", `Data sent to ${characteristic.uuid}`);
    } catch (err) {
      console.error("Write Error:", err);
      Alert.alert("Write Error", err.message);
    }
  };

  const handleNotify = async (characteristic) => {
    try {
      await characteristic.monitor((error, char) => {
        if (error) {
          console.error("Notification Error:", error);
          return;
        }
        const value = Buffer.from(char.value, "base64").toString("utf-8");
        setNotifications((prev) => ({ ...prev, [char.uuid]: value }));
      });
    } catch (err) {
      console.error("Notification Error:", err);
      Alert.alert("Notification Error", err.message);
    }
  };

  const handleInputChange = (uuid, value) => {
    setInputs((prev) => ({ ...prev, [uuid]: value }));
  };

  const renderServiceLabel = (uuid) =>
    uuid === LIGHT_CONTROL_SVC_UUID ? "Light Control Service" : `Service: ${uuid}`;

  const renderCharacteristicLabel = (uuid) => {
    if (uuid === LIGHT_SWITCH_CHAR_UUID_ON_OFF) {
      return "On/Off";
    } else if (uuid === LIGHT_SWITCH_CHAR_UUID_COLOR_CHANGE) {
      return "Color Change";
    }
    return `Characteristic: ${uuid}`;
  };

  const renderServiceItem = ({ item }) => (
    <View key={item.uuid} style={styles.service}>
      <Text>{renderServiceLabel(item.uuid)}</Text>
      <FlatList
        data={deviceCharacteristics.filter((char) => char.serviceUUID === item.uuid)}
        keyExtractor={(item) => item.uuid}
        renderItem={renderCharacteristicItem}
      />
    </View>
  );

  const renderCharacteristicItem = ({ item }) => (
    <View style={styles.characteristic}>
      <Text>{renderCharacteristicLabel(item.uuid)}</Text>
      {item.isReadable && <Button title="Read" onPress={() => handleRead(item)} />}
      {item.isWritableWithResponse && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Enter value to write"
            value={inputs[item.uuid] || ""}
            onChangeText={(value) => handleInputChange(item.uuid, value)}
          />
          <Button title="Write" onPress={() => handleWrite(item)} />
        </>
      )}
      {item.isNotifiable && <Button title="Notify" onPress={() => handleNotify(item)} />}
      {notifications[item.uuid] && <Text>Notification: {notifications[item.uuid]}</Text>}
    </View>
  );

  return (
    <FlatList
      data={deviceServices}
      keyExtractor={(item) => item.uuid}
      renderItem={renderServiceItem}
      ListHeaderComponent={
        <>
          <Text style={styles.deviceName}>{device.name || "Unnamed Device"}</Text>
          <Text style={styles.deviceId}>{device.id}</Text>
        </>
      }
    />
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  deviceName: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  deviceId: { fontSize: 16, color: "gray" },
  sectionHeader: { fontSize: 18, fontWeight: "bold", marginVertical: 10 },
  service: { marginVertical: 10 },
  characteristic: { marginVertical: 10 },
  input: { borderColor: "#ccc", borderWidth: 1, padding: 10, marginTop: 10 },
});

export default DeviceDetails;
