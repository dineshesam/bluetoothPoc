import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const SavedDevicesScreen = ({ navigation, route }) => {
  const { savedDevices } = route.params;

  const handleDevicePress = (device) => {
    navigation.navigate('DeviceDetails', { device });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Saved Devices</Text>
      <FlatList
        data={savedDevices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleDevicePress(item)} style={styles.device}>
            <Text>{item.name || 'Unnamed Device'}</Text>
            <Text>{item.id}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  device: { padding: 10, borderBottomWidth: 1, borderColor: '#ccc' },
});

export default SavedDevicesScreen;
