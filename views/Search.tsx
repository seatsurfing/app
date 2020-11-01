import React from 'react';
import { Text, View, Platform, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Styles } from '../types/Styles';
import DateTimePicker, { Event } from '@react-native-community/datetimepicker';
import { Formatting, Location, Booking } from '../commons';
import { RouteProp } from '@react-navigation/native';
import { AuthContext } from '../types/AuthContextData';
import Storage from '../types/Storage';

interface Props {
  navigation: StackNavigationProp<RootStackParamList>
  route: RouteProp<RootStackParamList, "Search">;
}

interface State {
  enter: Date
  leave: Date
  locationId: string
  locationTitle: string;
  enterMode: 'date' | 'time' | 'datetime' | 'countdown'
  leaveMode: 'date' | 'time' | 'datetime' | 'countdown'
  showEnterPicker: boolean
  showLeavePicker: boolean
  canSearch: boolean
  canSearchHint: string
}

export default class Search extends React.Component<Props, State> {
  static contextType = AuthContext;
  curBookingCount: number = 0;

  constructor(props: Props) {
    super(props);
    this.state = {
      enter: new Date(),
      leave: new Date(),
      locationId: "",
      locationTitle: "Keine",
      enterMode: "date",
      leaveMode: "date",
      showEnterPicker: false,
      showLeavePicker: false,
      canSearch: false,
      canSearchHint: ""
    }
    this.props.navigation.addListener("focus", this.onNavigationFocus);
  }

  componentDidMount = () => {
    this.initDates();
    this.propsToState();
    this.initLocation();
    this.initCurrentBookingCount();
  }

  componentDidUpdate = (prevProps: Props) => {
    if (JSON.stringify(this.props.route.params) !== JSON.stringify(prevProps.route.params)) {
      this.propsToState();
    }
  }

  componentWillUnmount = () => {
    this.props.navigation.removeListener("focus", this.onNavigationFocus);
  }

  onNavigationFocus = () => {
    this.initCurrentBookingCount();
  }

  initCurrentBookingCount = () => {
    Booking.list().then(list => {
      this.curBookingCount = list.length;
      this.updateCanSearch();
    });
  }

  initDates = () => {
    let now = new Date();
    if (now.getHours() > 17) {
      let enter = new Date();
      enter.setDate(enter.getDate() + 1);
      enter.setHours(9, 0, 0);
      let leave = new Date(enter);
      leave.setHours(17, 0, 0);
      this.setState({
        enter: enter,
        leave: leave
      });
    } else {
      let enter = new Date();
      enter.setHours(enter.getHours() + 1, 0, 0);
      let leave = new Date(enter);
      if (leave.getHours() < 17) {
        leave.setHours(17, 0, 0);
      } else {
        leave.setHours(leave.getHours() + 1, 0, 0);
      }
      this.setState({
        enter: enter,
        leave: leave
      });
    }
  }

  initLocation = () => {
    if (this.props.route.params && this.props.route.params.location && this.props.route.params.location.id && this.props.route.params.location.name) {
      return;
    }
    Storage.getLocation().then(locationId => {
      if (locationId) {
        Location.get(locationId).then(location => {
          this.setState({
            locationId: location.id,
            locationTitle: location.name
          });
          this.updateCanSearch();
        }).catch(() => {
          // Ignore
        });
      }
    });
  }

  propsToState = () => {
    if (this.props.route.params && this.props.route.params.location && this.props.route.params.location.id && this.props.route.params.location.name) {
      this.setState({
        locationId: this.props.route.params.location.id,
        locationTitle: this.props.route.params.location.name
      });
      this.updateCanSearch();
    }
  }

  startEnterPicking = () => {
    if (this.state.showEnterPicker) {
      this.setState({ showEnterPicker: false });
    } else {
      this.setState({
        enterMode: Platform.OS === "ios" ? "datetime" : "date",
        showEnterPicker: true
      });
    }
  }

  startLeavePicking = () => {
    if (this.state.showLeavePicker) {
      this.setState({ showLeavePicker: false });
    } else {
      this.setState({
        leaveMode: Platform.OS === "ios" ? "datetime" : "date",
        showLeavePicker: true
      });
    }
  }

  setEnterDate = (event: Event, selectedDate?: Date) => {
    let newDate = selectedDate || this.state.enter;
    if (this.state.enterMode === "datetime") {
      this.setState({ enter: newDate }, () => this.updateCanSearch());
    } else if (this.state.enterMode === "date") {
      this.setState({
        enter: newDate,
        enterMode: "time"
      }, () => this.updateCanSearch());
    } else if (this.state.enterMode === "time") {
      this.setState({
        enter: newDate,
        showEnterPicker: false
      }, () => this.updateCanSearch());
    }
  }

  setLeaveDate = (event: Event, selectedDate?: Date) => {
    let newDate = selectedDate || this.state.enter;
    if (this.state.leaveMode === "datetime") {
      this.setState({ leave: newDate }, () => this.updateCanSearch());
    } else if (this.state.leaveMode === "date") {
      this.setState({
        leave: newDate,
        leaveMode: "time"
      }, () => this.updateCanSearch());
    } else if (this.state.leaveMode === "time") {
      this.setState({
        leave: newDate,
        showLeavePicker: false
      }, () => this.updateCanSearch());
    }
  }

  getSelectedLocationName = () => {
    if (this.state.locationTitle) {
      return this.state.locationTitle;
    } else {
      return "Keiner";
    }
  }

  getSelectedLocationId = () => {
    return this.state.locationId;
  }

  updateCanSearch = () => {
    let res = true;
    let hint = "";
    if (this.curBookingCount >= this.context.maxBookingsPerUser) {
      res = false;
      hint = "Das Limit von " + this.context.maxBookingsPerUser + " Buchungen wurde erreicht.";
    }
    if (!this.state.locationId) {
      res = false;
      hint = "Bitte einen Bereich auswählen.";
    }
    let now = new Date();
    if (this.state.enter.getTime() <= now.getTime()) {
      res = false;
      hint = "Der Beginn muss in der Zukunft liegen.";
    }
    if (this.state.leave.getTime() <= this.state.enter.getTime()) {
      res = false;
      hint = "Das Ende muss nach dem Beginn liegen.";
    }
    const MS_PER_MINUTE = 1000 * 60;
    const MS_PER_HOUR = MS_PER_MINUTE * 60;
    const MS_PER_DAY = MS_PER_HOUR * 24;
    let bookingAdvanceDays = Math.floor((this.state.enter.getTime() - new Date().getTime()) / MS_PER_DAY);
    if (bookingAdvanceDays > this.context.maxDaysInAdvance) {
      res = false;
      hint = "Die Buchung darf maximal " + this.context.maxDaysInAdvance + " Tage in der Zukunft liegen.";
    }
    let bookingDurationHours = Math.floor((this.state.leave.getTime() - this.state.enter.getTime()) / MS_PER_MINUTE) / 60;
    if (bookingDurationHours > this.context.maxBookingDurationHours) {
      res = false;
      hint = "Die maximale Buchungsdauer beträgt " + this.context.maxBookingDurationHours + " Stunden.";
    }
    this.setState({
      canSearch: res,
      canSearchHint: hint
    });
  }

  logout = async () => {
    await Storage.deleteJWT();
    this.context.setDetails("", "");
  }

  render = () => {
    return (
      <SafeAreaView style={Styles.container}>
        <ScrollView>
          <View>
            <Text style={Styles.sectionHeader}>Platz buchen</Text>
          </View>
          <View style={Styles.section}>
            <View style={Styles.tableRow}>
              <Text style={Styles.text}>Beginn</Text>
              <Text style={Styles.textTableValue} onPress={() => this.startEnterPicking()}>{Formatting.getFormatter().format(this.state.enter)}</Text>
            </View>
            {this.state.showEnterPicker && (
              <DateTimePicker onChange={this.setEnterDate} value={this.state.enter} mode={this.state.enterMode} style={{ width: '100%' }} />
            )}
            <View style={Styles.horizontalLine}></View>
            <View style={Styles.tableRow}>
              <Text style={Styles.text}>Ende</Text>
              <Text style={Styles.textTableValue} onPress={() => this.startLeavePicking()}>{Formatting.getFormatter().format(this.state.leave)}</Text>
            </View>
            {this.state.showLeavePicker && (
              <DateTimePicker onChange={this.setLeaveDate} value={this.state.leave} mode={this.state.leaveMode} style={{ width: '100%' }} />
            )}
            <View style={Styles.horizontalLine}></View>
            <View style={Styles.tableRow}>
              <Text style={Styles.text}>Bereich</Text>
              <Text style={Styles.textTableValue} onPress={() => this.props.navigation.navigate("SelectLocation")}>{this.getSelectedLocationName()} &#10217;</Text>
            </View>
            <View style={Styles.horizontalLine}></View>
            <View style={Styles.tableRow}>
              <TouchableOpacity disabled={!this.state.canSearch} onPress={() => this.props.navigation.navigate("SearchResult", { enter: this.state.enter.getTime(), leave: this.state.leave.getTime(), locationId: this.getSelectedLocationId() })}><Text style={this.state.canSearch ? Styles.formButtom : Styles.formButtomDisabled}>{this.state.canSearch ? "Plätze suchen" : this.state.canSearchHint}</Text></TouchableOpacity>
            </View>
          </View>
          <View>
            <Text style={Styles.sectionHeader}>Meine Buchungen</Text>
          </View>
          <View style={Styles.section}>
            <View style={Styles.tableRow}>
              <TouchableOpacity onPress={() => this.props.navigation.navigate("MyBookings")}><Text style={Styles.formButtom}>Meine Buchungen</Text></TouchableOpacity>
            </View>
          </View>
          <View>
            <Text style={Styles.sectionHeader}>Einstellungen</Text>
          </View>
          <View style={Styles.section}>
            <View style={Styles.tableRow}>
              <Text style={Styles.text}>Benutzer</Text>
              <Text style={Styles.textTableValue}>{this.context.username.toLowerCase()}</Text>
            </View>
            <View style={Styles.horizontalLine}></View>
            <View style={Styles.tableRow}>
              <TouchableOpacity onPress={() => this.logout()}><Text style={Styles.formButtomWarning}>Abmelden</Text></TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }
}
