import React from 'react';
import { Text, SafeAreaView, ImageBackground, StyleSheet, View, ActivityIndicator, TouchableOpacity, Modal, Button } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Styles, PrimaryTextSize, CaptionTextSize } from '../types/Styles';
import { RouteProp } from '@react-navigation/native';
import { ScrollView } from 'react-native-gesture-handler';
import { Space, Location, Booking, Ajax, AjaxError } from '../commons';
import { Formatting } from '../commons';
import ModalDialog from './ModalDialog';
import { withTranslation } from 'react-i18next';
import { i18n } from 'i18next';
import ErrorText from '../types/ErrorText';
import { AuthContext } from '../types/AuthContextData';

interface Props {
  navigation: StackNavigationProp<RootStackParamList>
  route: RouteProp<RootStackParamList, "SearchResult">
  i18n: i18n
}

interface State {
  style: any
  loading: boolean
  showConfirm: boolean
  showSuccess: boolean
  showError: boolean
  errorText: string
  showBookingNames: boolean
  selectedSpace: Space | null
  mapUrl: string
}

class SearchResult extends React.Component<Props, State> {
  static contextType = AuthContext;
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
      showError: false,
      errorText: "",
      showBookingNames: false,
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
    } else if (!item.available && item.bookings && item.bookings.length > 0) {
      this.setState({
        showBookingNames: true,
        selectedSpace: item
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
    }).catch(e => {
      let code: number = 0;
      if (e instanceof AjaxError) {
        code = e.appErrorCode;
      }
      this.setState({ 
        loading: false,
        showError: true, 
        errorText: ErrorText.getTextForAppCode(code, this.props.i18n, this.context) 
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
        transform: [{rotate: item.rotation + "deg"}],
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      },
      text: {
        width: item.width,
        textAlign: "center",
        fontSize: CaptionTextSize,
        color: "#fff",
        transform: [{ rotate: "0deg" }]
      }
    });
    if (item.width < item.height) {
      style.text = {
        ...style.text,
        width: item.height,
        transform: [{ rotate: "90deg" }],
      };
    }
    return(
      <TouchableOpacity key={item.id} style={style.box} onPress={() => this.onSpaceSelect(item)}>
        <Text style={style.text} numberOfLines={1}>{item.name}</Text>
      </TouchableOpacity>
    );
  }

  renderBookingNameRow = (booking: Booking) => {
    return (
      <View key={booking.user.id}>
        <Text style={Styles.textWithTopMargin}>{booking.user.email}</Text>
        <Text style={Styles.text}>
          {Formatting.getFormatterShort().format(new Date(booking.enter))}
          &nbsp;&mdash;&nbsp;
          {Formatting.getFormatterShort().format(new Date(booking.leave))}
        </Text>
      </View>
    );
  }

  getActualTimezone = (): string => {
    if (this.location && this.location.timezone) {
      return this.location.timezone;
    }
    return this.context.defaultTimezone;
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
          <ModalDialog visible={this.state.showBookingNames}>
            <Text style={Styles.subject}>{this.state.selectedSpace?.name}</Text>
            {this.state.selectedSpace?.bookings.map(booking => this.renderBookingNameRow(booking))}
            <View style={style.button}>
              <Button title={this.props.i18n.t("ok")} onPress={() => {this.setState({showBookingNames: false})}} />
            </View>
          </ModalDialog>
          <ModalDialog visible={this.state.showConfirm}>
            <Text style={Styles.text}>{this.props.i18n.t("space")}: {this.state.selectedSpace?.name}</Text>
            <Text style={Styles.text}>{this.props.i18n.t("area")}: {this.location?.name}</Text>
            <Text style={Styles.text}>{this.props.i18n.t("enter")}: {Formatting.getFormatterShort().format(new Date(this.props.route.params.enter))}</Text>
            <Text style={Styles.text}>{this.props.i18n.t("leave")}: {Formatting.getFormatterShort().format(new Date(this.props.route.params.leave))}</Text>
            <Text style={Styles.text}>{this.props.i18n.t("timezone")}: {this.getActualTimezone()}</Text>
            <View style={style.button}>
              <Button title={this.props.i18n.t("confirmBooking")} onPress={() => {this.onConfirmBooking()}} />
            </View>
            <View style={style.button}>
              <Button title={this.props.i18n.t("cancel")} onPress={() => {this.setState({showConfirm: false})}} />
            </View>
          </ModalDialog>
          <ModalDialog visible={this.state.showSuccess}>
            <Text style={Styles.successIcon}>&#128077;</Text>
            <Text style={Styles.text}>{this.props.i18n.t("bookingConfirmed")}</Text>
          </ModalDialog>
          <ModalDialog visible={this.state.showError}>
            <Text style={Styles.successIcon}>&#129320;</Text>
            <Text style={Styles.text}>{this.state.errorText}</Text>
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

export default withTranslation()(SearchResult as any);
