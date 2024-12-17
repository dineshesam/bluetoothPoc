import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import Header from '../components/Header'


const DeviceDetails = ({navigation,route}) => {
  const {device} = route.params
  return (
    <View>
      <Header text='Device Details' onBack={()=>navigation.goBack()}/>
        <View>
          <Text>{device.name || 'Unnamed'}</Text>
          <Text>{device.id}</Text>
        </View>
    </View>
  )
}

export default DeviceDetails

const styles = StyleSheet.create({
  header:{
    flexDirection:'row',
    alignItems:'center',
    gap:20,
    height:65,
    width:'100%',
    backgroundColor:'#fff',
   
  },
  icon:{
      paddingLeft:20
  },
  headertxt:{
      fontSize:18,
  },
})