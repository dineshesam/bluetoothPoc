import { StyleSheet, Text, View ,TouchableOpacity} from 'react-native'
import React from 'react'
import AntDesign from 'react-native-vector-icons/AntDesign'

const Header = ({text,onBack}) => {
  return (
    <View style={styles.header}>
            <View style={styles.icon}>
                <TouchableOpacity onPress={onBack}>
                    <AntDesign name='arrowleft' size={30} color='#000'/>
                </TouchableOpacity>
            </View>
            <View>
                <Text style={styles.headertxt}>{text}</Text>
            </View>
    </View>
  )
}

export default Header

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
          fontSize:20,
      },
})