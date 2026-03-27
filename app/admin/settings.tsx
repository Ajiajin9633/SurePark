import { Text, View } from "react-native";
import { AdminHeader } from "@/components/AdminHeader";

export default function Settings(){
  return(
    <View style={{flex:1, backgroundColor: "#f8f9fa"}}>
      <AdminHeader title="Settings" subtitle="App configuration" />
      <View style={{flex:1,justifyContent:"center",alignItems:"center"}}>
        <Text style={{fontSize: 18, color: "#666"}}>Settings Page</Text>
      </View>
    </View>
  )
}