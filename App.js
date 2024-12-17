// import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import BluetoothManagerScreen from './app/screens/BluetoothManagerScreen';
import DeviceDetails from './app/screens/DeviceDetails';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WritePage from './app/screens/WritePage';
import { ConnectedDevicesProvider } from './app/screens/ConnectedDevicesContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
    <ConnectedDevicesProvider>
    <NavigationContainer>
      <View style={{flex:1}}>
        
          <Stack.Navigator initialRouteName="BluetoothManagerScreen"
            screenOptions={{
              headerShown: false,
            }}>
            <Stack.Screen name='BluetoothManagerScreen' component={BluetoothManagerScreen}/>
            <Stack.Screen name='DeviceDetails' component={DeviceDetails}/>
            <Stack.Screen name="WritePage" component={WritePage}/>
          </Stack.Navigator>

        {/* <BluetoothManagerScreen/> */}
      </View>
    </NavigationContainer>
    </ConnectedDevicesProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({});


// import React, { useState } from 'react';
// import { View, Text, Button, StyleSheet } from 'react-native';

// const App = () => {
//   const [message, setMessage] = useState('');

//   const handlePress = (buttonNumber) => {
//     setMessage(`You pressed Button ${buttonNumber}`);
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Press a Button</Text>
      
//       <View style={styles.buttonContainer}>
//         <Button title="Button 1" onPress={() => handlePress(1)} />
//         <Button title="Button 2" onPress={() => handlePress(2)} />
//         <Button title="Button 3" onPress={() => handlePress(3)} />
//       </View>

//       {message !== '' && <Text style={styles.message}>{message}</Text>}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f5f5f5',
//   },
//   title: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     marginBottom: 20,
//   },
//   buttonContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     width: '80%',
//     marginVertical: 20,
//   },
//   message: {
//     fontSize: 18,
//     marginTop: 20,
//     color: '#333',
//   },
// });

// export default App;


