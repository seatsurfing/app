import React from 'react';
import { Text, SafeAreaView, TouchableOpacity, ActivityIndicator, Button, View, StyleSheet, ScrollView, Switch } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Styles } from '../types/Styles';
import { FlatList } from 'react-native-gesture-handler';
import { Booking, UserPreference, Location } from '../commons';
import { Formatting } from '../commons';
import ModalDialog from './ModalDialog';
import { withTranslation } from 'react-i18next';
import { i18n } from 'i18next';
import { Picker } from '@react-native-picker/picker';

interface Props {
  navigation: StackNavigationProp<RootStackParamList>
  i18n: i18n
}

interface State {
  loading: boolean
  submitting: boolean
  saved: boolean
  error: boolean
  showNoticePicker: boolean
  showLocationPicker: boolean
  showWorkingHoursPicker: boolean
  enterTime: number
  workdayStart: number
  workdayEnd: number
  workdays: boolean[]
  locationId: string
}

class Preferences extends React.Component<Props, State> {
  locations: Location[];

  constructor(props: Props) {
    super(props);
    this.locations = [];
    this.state = {
      loading: true,
      submitting: false,
      saved: false,
      error: false,
      showNoticePicker: false,
      showLocationPicker: false,
      showWorkingHoursPicker: false,
      enterTime: 0,
      workdayStart: 0,
      workdayEnd: 0,
      workdays: [],
      locationId: "",
    };
    this.loadResult();
  }

  loadResult = () => {
    let promises = [
      this.loadPreferences(),
      this.loadLocations(),
    ];
    Promise.all(promises).then(() => {
      this.setState({ loading: false });
    });
  }

  loadPreferences = async (): Promise<void> => {
    let self = this;
    return new Promise<void>(function (resolve, reject) {
      UserPreference.list().then(list => {
        let state: any = {};
        list.forEach(s => {
          if (s.name === "enter_time") state.enterTime = window.parseInt(s.value);
          if (s.name === "workday_start") state.workdayStart = window.parseInt(s.value);
          if (s.name === "workday_end") state.workdayEnd = window.parseInt(s.value);
          if (s.name === "workdays") {
            state.workdays = [];
            for (let i = 0; i <= 6; i++) {
              state.workdays[i] = false;
            }
            s.value.split(",").forEach(val => state.workdays[val] = true)
          }
          if (s.name === "location_id") state.locationId = s.value;
        });
        self.setState({
          ...self.state,
          ...state
        }, () => resolve());
      }).catch(e => reject(e));
    });
  }

  loadLocations = async (): Promise<void> => {
    let self = this;
    return new Promise<void>(function (resolve, reject) {
      Location.list().then(list => {
        self.locations = list;
        resolve();
      }).catch(e => reject(e));
    });
  }

  startNoticePicking = () => {
    this.setState({ showNoticePicker: !this.state.showNoticePicker });
  }

  startLocationPicking = () => {
    this.setState({ showLocationPicker: !this.state.showLocationPicker });
  }

  startWorkingHoursPicking = () => {
    this.setState({ showWorkingHoursPicker: !this.state.showWorkingHoursPicker });
  }

  getNoticeName = (): string => {
    if (this.state.enterTime === 1) return this.props.i18n.t("earliestPossible");
    if (this.state.enterTime === 2) return this.props.i18n.t("nextDay");
    if (this.state.enterTime === 3) return this.props.i18n.t("nextWorkday");
    return "";
  }

  getLocationName = (): string => {
    let name: string = this.props.i18n.t("none");
    this.locations.forEach(location => {
      if (this.state.locationId === location.id) {
        name = location.name;
      }
    });
    return name;
  }

  getWorkingHours = (): string => {
    return this.state.workdayStart.toString() + " " + this.props.i18n.t("to") + " " + this.state.workdayEnd.toString();
  }

  onWorkdayCheck = (day: number, checked: boolean) => {
    let workdays = this.state.workdays.map((val, i) => (i === day) ? checked : val);
    this.setState({
      workdays: workdays
    }, () => this.savePreferences());
  }

  savePreferences = () => {
    this.setState({
      submitting: true,
      saved: false,
      error: false
    });
    let workdays: string[] = [];
    this.state.workdays.forEach((val, day) => {
      if (val) {
        workdays.push(day.toString());
      }
    });
    let payload = [
      new UserPreference("enter_time", this.state.enterTime.toString()),
      new UserPreference("workday_start", this.state.workdayStart.toString()),
      new UserPreference("workday_end", this.state.workdayEnd.toString()),
      new UserPreference("workdays", workdays.join(",")),
      new UserPreference("location_id", this.state.locationId),
    ];
    UserPreference.setAll(payload).then(() => {
      this.setState({
        submitting: false,
        saved: true
      });
    }).catch(() => {
      this.setState({
        submitting: false,
        error: true
      });
    });
  }

  render = () => {
    let loadingIndicator;
    let list;
    if (this.state.loading) {
      loadingIndicator = <ActivityIndicator size="large" style={Styles.activityIndicator} color="#555" />;
    }
    if (!this.state.loading) {
      list = (
        <ScrollView>
          <View>
            <Text style={Styles.sectionHeader}>{this.props.i18n.t("preferences")}</Text>
          </View>
          <View style={Styles.section}>
            <View style={Styles.tableRow}>
              <Text style={Styles.text}>{this.props.i18n.t("notice")}</Text>
              <Text style={Styles.textTableValue} onPress={() => this.startNoticePicking()}>{this.getNoticeName()}</Text>
            </View>
            {this.state.showNoticePicker && (
              <Picker selectedValue={this.state.enterTime} onValueChange={(val) => this.setState({ enterTime: val }, () => this.savePreferences())} style={{ width: '100%' }}>
                <Picker.Item label={this.props.i18n.t("earliestPossible")} value={1} />
                <Picker.Item label={this.props.i18n.t("nextDay")} value={2} />
                <Picker.Item label={this.props.i18n.t("nextWorkday")} value={3} />
              </Picker>
            )}
            <View style={Styles.horizontalLine}></View>
            <View style={Styles.tableRow}>
              <Text style={Styles.text}>{this.props.i18n.t("workingHours")}</Text>
              <Text style={Styles.textTableValue} onPress={() => this.startWorkingHoursPicking()}>{this.getWorkingHours()}</Text>
            </View>
            {this.state.showWorkingHoursPicker && (
              <View style={Styles.row}>
                <Picker selectedValue={this.state.workdayStart} onValueChange={(val) => this.setState({ workdayStart: val }, () => this.savePreferences())} style={{ width: '30%' }}>
                  {[...Array(this.state.workdayEnd).keys()].map(hour => <Picker.Item key={hour} label={hour.toString()} value={hour} />)}
                </Picker>
                <Text style={Styles.text}>{this.props.i18n.t("to")}</Text>
                <Picker selectedValue={this.state.workdayEnd} onValueChange={(val) => this.setState({ workdayEnd: val }, () => this.savePreferences())} style={{ width: '30%' }}>
                  {[...Array(24).keys()].slice(this.state.workdayStart+1, 24).map(hour => <Picker.Item key={hour} label={hour.toString()} value={hour} />)}
                </Picker>
              </View>
            )}
            <View style={Styles.horizontalLine}></View>
            <View style={Styles.tableRow}>
              <Text style={Styles.text}>{this.props.i18n.t("preferredLocation")}</Text>
              <Text style={Styles.textTableValue} onPress={() => this.startLocationPicking()}>{this.getLocationName()}</Text>
            </View>
            {this.state.showLocationPicker && (
              <Picker selectedValue={this.state.locationId} onValueChange={(id) => this.setState({ locationId: id }, () => this.savePreferences())} style={{ width: '100%' }}>
                <Picker.Item label={"(" + this.props.i18n.t("none") + ")"} value={""} />
                {this.locations.map(location => <Picker.Item key={location.id} label={location.name} value={location.id} />)}
              </Picker>
            )}
          </View>
          <View>
            <Text style={Styles.sectionHeader}>{this.props.i18n.t("workdays")}</Text>
          </View>
          <View style={Styles.section}>
            {[...Array(7).keys()].map(day => (
              <React.Fragment key={"day-toggler-" + day}>
                <View style={Styles.tableRow}>
                  <Text style={Styles.text}>{this.props.i18n.t("workday-" + day)}</Text>
                  <View style={Styles.switchInTable}>
                    <Switch key={"workday-" + day} value={this.state.workdays[day]} onValueChange={(checked: boolean) => this.onWorkdayCheck(day, checked)} />
                  </View>
                </View>
                {day < 6 && <View style={Styles.horizontalLine}></View>}
              </React.Fragment>
            ))}
          </View>
        </ScrollView >
      );
    }
    return (
      <SafeAreaView style={Styles.container}>
        {loadingIndicator}
        {list}
      </SafeAreaView>
    );
  }
}

export default withTranslation()(Preferences as any);
