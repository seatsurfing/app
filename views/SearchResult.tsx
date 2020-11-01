import React from 'react';
import { Text, SafeAreaView, ImageBackground, StyleSheet, View, ActivityIndicator, TouchableOpacity, Modal, Button } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Styles, PrimaryTextSize } from '../types/Styles';
import { RouteProp } from '@react-navigation/native';
import { ScrollView } from 'react-native-gesture-handler';
import { Space, Location, Booking, Ajax } from '../commons';
import { Formatting } from '../commons';
import ModalDialog from './ModalDialog';

interface Props {
  navigation: StackNavigationProp<RootStackParamList>;
  route: RouteProp<RootStackParamList, "SearchResult">;
}

interface State {
  style: any
  loading: boolean
  showConfirm: boolean
  showSuccess: boolean
  selectedSpace: Space | null
  mapUrl: string
}

export default class SearchResult extends React.Component<Props, State> {
  data: Space[];
  location: Location | null;
  mapData: string;

  constructor(props: Props) {
    super(props);
    this.data = [];
    this.location = null;
    this.mapData = "";
    this.state = {
      loading: true,
      showConfirm: false,
      showSuccess: false,
      selectedSpace: null,
      mapUrl: "",
      style: StyleSheet.create({
        container: {
          height: 700,
          width: 700
        }
      })
    };
   this.loadResult();
  }

  loadResult = () => {
    Location.get(this.props.route.params.locationId).then(location => {
      let enter = new Date(this.props.route.params.enter);
      let leave = new Date(this.props.route.params.leave);
      Space.listAvailability(location.id, enter, leave).then(list => {
        Ajax.get(location.getMapUrl()).then(mapData => {
          this.data = list;
          this.location = location;
          this.mapData = "data:image/" + location.mapMimeType + ";base64," + mapData.json.data;
          this.props.navigation.setOptions({title: location.name});
          this.setState({
            mapUrl: location.getMapUrl(),
            style: StyleSheet.create({
              container: {
                width: location.mapWidth,
                height: location.mapHeight
              }
            }),
            loading: false
          });
        });
      });
    })
  }

  onSpaceSelect = (item: Space) => {
    if (item.available) {
      this.setState({
        selectedSpace: item,
        showConfirm: true
      });
    }
  }

  onConfirmBooking = () => {
    if (this.state.selectedSpace == null) {
      return;
    }
    this.setState({
      showConfirm: false,
      loading: true
    });
    let booking: Booking = new Booking();
    booking.enter = new Date(this.props.route.params.enter);
    booking.leave = new Date(this.props.route.params.leave);
    booking.space = this.state.selectedSpace;
    booking.save().then(() => {
      this.setState({
        loading: false,
        showSuccess: true
      });
      setTimeout(() => {
        this.props.navigation.goBack();
      }, 5000);
    });
  }

  renderItem = (item: Space) => {
    const style = StyleSheet.create({
      box: {
        backgroundColor: item.available ? "rgba(48, 209, 88, 0.9)" : "rgba(255, 69, 58, 0.9)",
        position: "absolute",
        left: item.x,
        top: item.y,
        width: item.width,
        height: item.height,
        transform: [{rotate: item.rotation + "deg"}]
      },
      text: {
        position: "absolute",
        marginTop: 5,
        alignSelf: "center",
        fontSize: PrimaryTextSize
      }
    });
    return(
      <TouchableOpacity key={item.id} style={style.box} onPress={() => this.onSpaceSelect(item)}>
        <Text style={style.text}>{item.name}</Text>
      </TouchableOpacity>
    );
  }

  render = () => {
    const style = StyleSheet.create({
      button: {
        marginTop: 15
      }
    });

    return(
      <SafeAreaView style={Styles.container}>
        {this.state.loading ?
          <ActivityIndicator size="large" style={Styles.activityIndicator} />
        :
        <ScrollView>
          <ModalDialog visible={this.state.showConfirm}>
            <Text style={Styles.text}>Platz: {this.state.selectedSpace?.name}</Text>
            <Text style={Styles.text}>Bereich: {this.location?.name}</Text>
            <Text style={Styles.text}>Beginn: {Formatting.getFormatterShort().format(new Date(this.props.route.params.enter))}</Text>
            <Text style={Styles.text}>Ende: {Formatting.getFormatterShort().format(new Date(this.props.route.params.leave))}</Text>
            <View style={style.button}>
              <Button title="Buchung bestätigen" onPress={() => {this.onConfirmBooking()}} />
            </View>
            <View style={style.button}>
              <Button title="Abbrechen" onPress={() => {this.setState({showConfirm: false})}} />
            </View>
          </ModalDialog>
          <ModalDialog visible={this.state.showSuccess}>
            <Text style={Styles.successIcon}>&#128077;</Text>
            <Text style={Styles.text}>Deine Buchung wurde bestätigt!</Text>
          </ModalDialog>
          <ScrollView horizontal={true}>
            <View style={this.state.style.container}>
              <ImageBackground style={Styles.mapImg} source={{uri: this.mapData}}>
                {this.data.map((item) => this.renderItem(item))}
              </ImageBackground>
            </View>
          </ScrollView>
        </ScrollView>
      }
      </SafeAreaView>
    )
  }
}
