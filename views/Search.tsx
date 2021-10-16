import React from 'react';
import { Text, View, Platform, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Styles } from '../types/Styles';
import DateTimePicker, { Event } from '@react-native-community/datetimepicker';
import { Formatting, Location, Booking, Ajax, AjaxError } from '../commons';
import { RouteProp } from '@react-navigation/native';
import { AuthContext } from '../types/AuthContextData';
import Storage from '../types/Storage';
import { withTranslation } from 'react-i18next';
import { i18n } from 'i18next';
import ErrorText from '../types/ErrorText';

interface Props {
  navigation: StackNavigationProp<RootStackParamList>
  route: RouteProp<RootStackParamList, "Search">
  i18n: i18n
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

class Search extends React.Component<Props, State> {
  static contextType = AuthContext;
  curBookingCount: number = 0;

  constructor(props: Props) {
    super(props);
    this.state = {
      enter: new Date(),
      leave: new Date(),
      locationId: "",
      locationTitle: this.props.i18n.t("none"),
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
    console.log("initializating date selectors...");
    let now = new Date();
    if (now.getHours() > 17) {
      let enter = new Date();
      enter.setDate(enter.getDate() + 1);
      if (this.context.dailyBasisBooking) {
        enter.setHours(0, 0, 0);
      } else {
        enter.setHours(9, 0, 0);
      }
      let leave = new Date(enter);
      if (this.context.dailyBasisBooking) {
        leave.setHours(23, 59, 59);
      } else {
        leave.setHours(17, 0, 0);
      }
      this.setState({
        enter: enter,
        leave: leave
      });
    } else {
      if (this.context.dailyBasisBooking) {
        let enter = new Date();
        enter.setHours(0, 0, 0);
        let leave = new Date(enter);
        leave.setHours(23, 59, 59);
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
        enterMode: (Platform.OS === "ios" && !this.context.dailyBasisBooking) ? "datetime" : "date",
        showEnterPicker: true
      });
    }
  }

  startLeavePicking = () => {
    if (this.state.showLeavePicker) {
      this.setState({ showLeavePicker: false });
    } else {
      this.setState({
        leaveMode: (Platform.OS === "ios" && !this.context.dailyBasisBooking) ? "datetime" : "date",
        showLeavePicker: true
      });
    }
  }

  setEnterDate = (event: Event, selectedDate?: Date) => {
    let diff = this.state.leave.getTime() - this.state.enter.getTime();
    let newDate = selectedDate || this.state.enter;
    let leave = new Date();
    leave.setTime(newDate.getTime() + diff);
    if (this.state.enterMode === "datetime") {
      this.setState({ 
        enter: newDate,
        leave: leave
      }, () => this.updateCanSearch());
    } else if (this.state.enterMode === "date") {
      if (this.context.dailyBasisBooking) {
        selectedDate?.setHours(0, 0, 0);
        leave.setTime(newDate.getTime() + diff);
        this.setState({
          enter: newDate,
          leave: leave,
          showEnterPicker: false
        }, () => this.updateCanSearch());
        return;
      }
      this.setState({
        enter: newDate,
        leave: leave,
        enterMode: "time"
      }, () => this.updateCanSearch());
    } else if (this.state.enterMode === "time") {
      this.setState({
        enter: newDate,
        leave: leave,
        showEnterPicker: false
      }, () => this.updateCanSearch());
    }
  }

  setLeaveDate = (event: Event, selectedDate?: Date) => {
    let newDate = selectedDate || this.state.enter;
    if (this.state.leaveMode === "datetime") {
      this.setState({ leave: newDate }, () => this.updateCanSearch());
    } else if (this.state.leaveMode === "date") {
      if (this.context.dailyBasisBooking) {
        selectedDate?.setHours(23, 59, 59);
        this.setState({
          leave: newDate,
          showLeavePicker: false
        }, () => this.updateCanSearch());
        return;
      }
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
      return this.props.i18n.t("none");
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
      hint = this.props.i18n.t("errorBookingLimit", {"num": this.context.maxBookingsPerUser});
    }
    if (!this.state.locationId) {
      res = false;
      hint = this.props.i18n.t("errorPickArea");
    }
    let now = new Date();
    let enterTime = new Date(this.state.enter);
    if (this.context.dailyBasisBooking) {
      enterTime.setHours(23, 59, 59);
    }
    if (enterTime.getTime() <= now.getTime()) {
      res = false;
      hint = this.props.i18n.t("errorEnterFuture");
    }
    if (this.state.leave.getTime() <= this.state.enter.getTime()) {
      res = false;
      hint = this.props.i18n.t("errorLeaveAfterEnter");
    }
    const MS_PER_MINUTE = 1000 * 60;
    const MS_PER_HOUR = MS_PER_MINUTE * 60;
    const MS_PER_DAY = MS_PER_HOUR * 24;
    let bookingAdvanceDays = Math.floor((this.state.enter.getTime() - new Date().getTime()) / MS_PER_DAY);
    if (bookingAdvanceDays > this.context.maxDaysInAdvance) {
      res = false;
      hint = this.props.i18n.t("errorDaysAdvance", {"num": this.context.maxDaysInAdvance});
    }
    let bookingDurationHours = Math.floor((this.state.leave.getTime() - this.state.enter.getTime()) / MS_PER_MINUTE) / 60;
    if (bookingDurationHours > this.context.maxBookingDurationHours) {
      res = false;
      hint = this.props.i18n.t("errorBookingDuration", {"num": this.context.maxBookingDurationHours});
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

  formatDateTime = (date: Date) => {
    if (this.context.dailyBasisBooking) {
      return Formatting.getFormatterNoTime().format(date);
    }
    return Formatting.getFormatter().format(date);
  }

  onSearchClick = () => {
    this.setState({canSearch: false, canSearchHint: ""});
    let payload = {
      "locationId": this.state.locationId,
      "enter": Formatting.convertToFakeUTCDate(this.state.enter).toISOString(),
      "leave": Formatting.convertToFakeUTCDate(this.state.leave).toISOString(),
    };
    Ajax.postData("/booking/precheck/", payload).then(res => {
      this.setState({ canSearch: true });
      this.props.navigation.navigate("SearchResult", { enter: this.state.enter.getTime(), leave: this.state.leave.getTime(), locationId: this.getSelectedLocationId() })
    }).catch(e => {
      let code: number = 0;
      if (e instanceof AjaxError) {
        code = e.appErrorCode;
      }
      this.setState({ canSearch: false, canSearchHint: ErrorText.getTextForAppCode(code, this.props.i18n, this.context) });
    });
  }

  render = () => {
    return (
      <SafeAreaView style={Styles.container}>
        <ScrollView>
          <View>
            <Text style={Styles.sectionHeader}>{this.props.i18n.t("bookSeat")}</Text>
          </View>
          <View style={Styles.section}>
            <View style={Styles.tableRow}>
              <Text style={Styles.text}>{this.props.i18n.t("enter")}</Text>
              <Text style={Styles.textTableValue} onPress={() => this.startEnterPicking()}>{this.formatDateTime(this.state.enter)}</Text>
            </View>
            {this.state.showEnterPicker && (
              <DateTimePicker onChange={this.setEnterDate} value={this.state.enter} display="spinner" mode={this.state.enterMode} style={{ width: '100%' }} />
            )}
            <View style={Styles.horizontalLine}></View>
            <View style={Styles.tableRow}>
              <Text style={Styles.text}>{this.props.i18n.t("leave")}</Text>
              <Text style={Styles.textTableValue} onPress={() => this.startLeavePicking()}>{this.formatDateTime(this.state.leave)}</Text>
            </View>
            {this.state.showLeavePicker && (
              <DateTimePicker onChange={this.setLeaveDate} value={this.state.leave} display="spinner" mode={this.state.leaveMode} style={{ width: '100%' }} />
            )}
            <View style={Styles.horizontalLine}></View>
            <View style={Styles.tableRow}>
              <Text style={Styles.text}>{this.props.i18n.t("area")}</Text>
              <Text style={Styles.textTableValue} onPress={() => this.props.navigation.navigate("SelectLocation")}>{this.getSelectedLocationName()} &#10217;</Text>
            </View>
            <View style={Styles.horizontalLine}></View>
            <View style={Styles.tableRow}>
              <TouchableOpacity disabled={!this.state.canSearch} onPress={this.onSearchClick}><Text style={this.state.canSearch ? Styles.formButtom : Styles.formButtomDisabled}>{(this.state.canSearch || !this.state.canSearchHint) ? this.props.i18n.t("searchSpace") : this.state.canSearchHint}</Text></TouchableOpacity>
            </View>
          </View>
          <View>
            <Text style={Styles.sectionHeader}>{this.props.i18n.t("myBookings")}</Text>
          </View>
          <View style={Styles.section}>
            <View style={Styles.tableRow}>
              <TouchableOpacity onPress={() => this.props.navigation.navigate("MyBookings")}><Text style={Styles.formButtom}>{this.props.i18n.t("myBookings")}</Text></TouchableOpacity>
            </View>
          </View>
          <View>
            <Text style={Styles.sectionHeader}>{this.props.i18n.t("settings")}</Text>
          </View>
          <View style={Styles.section}>
            <View style={Styles.tableRow}>
              <Text style={Styles.text}>{this.props.i18n.t("user")}</Text>
              <Text style={Styles.textTableValue}>{this.context.username.toLowerCase()}</Text>
            </View>
            <View style={Styles.horizontalLine}></View>
            <View style={Styles.tableRow}>
              <TouchableOpacity onPress={() => this.logout()}><Text style={Styles.formButtomWarning}>{this.props.i18n.t("signout")}</Text></TouchableOpacity>
            </View>
            <View style={Styles.horizontalLine}></View>
            <View style={Styles.tableRow}>
              <TouchableOpacity onPress={() => this.props.navigation.navigate("About")}><Text style={Styles.formButtom}>{this.props.i18n.t("about")}</Text></TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }
}
export default withTranslation()(Search as any);
