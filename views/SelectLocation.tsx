import React from 'react';
import { Text, View, SafeAreaView, FlatList, ActivityIndicator } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Styles } from '../types/Styles';
import { Location } from '../commons';
import { RouteProp } from '@react-navigation/native';
import Storage from '../types/Storage';

interface Props {
  navigation: StackNavigationProp<RootStackParamList>
  route: RouteProp<RootStackParamList, "SelectLocation">
}

interface State {
  locationId: string
  locations: Location[]
  loading: boolean
}

export default class SelectLocation extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      locationId: "",
      locations: [],
      loading: true
    }
    this.loadResult();
  }

  loadResult = () => {
    Location.list().then(list => {
      this.setState({
        locations: list,
        loading: false
      });
    });
  }

  onItemSelect = (locationId: string) => {
    Location.get(locationId).then(location => {
      Storage.setLocation(locationId).then(() => {
        this.props.navigation.navigate("Search", {location: {id: locationId, name: location.name}});
      });
    });
  }

  renderItem = (location: Location) => {
    return (
      <View key={location.id}>
        <View style={Styles.tableRow}>
          <Text style={Styles.text} onPress={() => this.onItemSelect(location.id)}>{location.name}</Text>
        </View>
        <View style={Styles.horizontalLine}></View>
      </View>
    );
  }

  render = () => {
    return(
      <SafeAreaView style={Styles.container}>
        {this.state.loading ?
          <ActivityIndicator size="large" style={Styles.activityIndicator} />
        :
          <FlatList data={this.state.locations} renderItem={({item}) => this.renderItem(item)} keyExtractor={item => item.id} style={Styles.list} />
        }
      </SafeAreaView>
    )
  }
}
