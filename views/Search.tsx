import React from 'react';
import { Text, View, TouchableOpacity, ImageBackground, StyleSheet, ActivityIndicator, Animated, FlatList, Pressable } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Styles, PrimaryTextSize, CaptionTextSize } from '../types/Styles';
import DateTimePicker, { DateTimePickerEvent, Event } from '@react-native-community/datetimepicker';
import { Formatting, Location, Ajax, AjaxCredentials, Space, Booking, AjaxError, UserPreference } from '../commons';
import { RouteProp } from '@react-navigation/native';
import { AuthContext } from '../types/AuthContextData';
import { withTranslation } from 'react-i18next';
import { i18n } from 'i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { State as GestureState, ScrollView, Gesture, GestureDetector, GestureUpdateEvent, PanGestureHandlerEventPayload } from 'react-native-gesture-handler';
import { Picker } from '@react-native-picker/picker';
import ModalDialog from './ModalDialog';
import ErrorText from '../types/ErrorText';
import RuntimeInfo from '../types/RuntimeInfo';

interface Props {
  navigation: StackNavigationProp<RootStackParamList>
  route: RouteProp<RootStackParamList, "Search">
  i18n: i18n
}

interface State {
  loading: boolean
  style: any
  showBookingNames: boolean
  selectedSpace: Space | null
  showConfirm: boolean
  showSuccess: boolean
  showError: boolean
  errorText: string
  locationId: string
  enter: Date
  leave: Date
  enterMode: 'date' | 'time' | 'datetime' | 'countdown'
  leaveMode: 'date' | 'time' | 'datetime' | 'countdown'
  showLocationPicker: boolean
  showEnterPicker: boolean
  showLeavePicker: boolean
  canSearch: boolean
  canSearchHint: string
  minDragOffset: number
  showMapOverlay: boolean
  listView: boolean
  mapOffsetX: number
  mapOffsetY: number
  footerHeight: Animated.Value
  footerHeightValue: number
  prefEnterTime: number
  prefWorkdayStart: number
  prefWorkdayEnd: number
  prefWorkdays: number[]
  prefLocationId: string
}

class Search extends React.Component<Props, State> {
  static dragOffset = 25;
  static footerHeightCollapsed = 125;
  static contextType = AuthContext;
  static PreferenceEnterTimeNow: number = 1;
  static PreferenceEnterTimeNextDay: number = 2;
  static PreferenceEnterTimeNextWorkday: number = 3;

  data: Space[];
  locations: Location[];
  mapData: string;
  curBookingCount: number = 0;
  mapOverlayOpacity: Animated.Value
  containerHeight: number
  containerWidth: number

  constructor(props: Props) {
    super(props);
    this.data = [];
    this.locations = [];
    this.mapData = "";
    this.mapOverlayOpacity = new Animated.Value(0);
    this.containerHeight = 0;
    this.containerWidth = 0;
    this.state = {
      loading: true,
      style: StyleSheet.create({
        container: {
          height: 700,
          width: 700
        },
      }),
      showBookingNames: false,
      selectedSpace: null,
      showConfirm: false,
      showSuccess: false,
      showError: false,
      errorText: "",
      locationId: "",
      enter: new Date(),
      leave: new Date(),
      enterMode: "date",
      leaveMode: "date",
      showLocationPicker: false,
      showEnterPicker: false,
      showLeavePicker: false,
      canSearch: false,
      canSearchHint: "",
      minDragOffset: -1 * Search.dragOffset,
      showMapOverlay: false,
      listView: false,
      mapOffsetX: 0,
      mapOffsetY: 0,
      footerHeight: new Animated.Value(Search.footerHeightCollapsed),
      footerHeightValue: Search.footerHeightCollapsed,
      prefEnterTime: 0,
      prefWorkdayStart: 0,
      prefWorkdayEnd: 0,
      prefWorkdays: [],
      prefLocationId: "",
    }
    this.props.navigation.addListener("focus", this.onNavigationFocus);
    //this.state.footerHeight.addListener(this.onFooterHeightChange);
  }

  componentDidMount = () => {
    let promises = [
      this.loadLocations(),
      this.loadPreferences(),
    ];
    Promise.all(promises).then(() => {
      this.initDates();
      if (this.state.locationId === "" && this.locations.length > 0) {
        let defaultLocationId = this.locations[0].id;
        if (this.state.prefLocationId) {
          this.locations.forEach(location => {
            if (location.id === this.state.prefLocationId) {
              defaultLocationId = this.state.prefLocationId;
            }
          })
        }
        this.setState({ locationId: defaultLocationId });
        this.loadMap(this.state.locationId).then(() => {
          this.setState({ loading: false });
        });
      } else {
        this.setState({ loading: false });
      }
    });
  }

  componentWillUnmount = () => {
    this.props.navigation.removeListener("focus", this.onNavigationFocus);
    this.state.footerHeight.removeAllListeners();
  }

  loadPreferences = async (): Promise<void> => {
    let self = this;
    return new Promise<void>(function (resolve, reject) {
      UserPreference.list().then(list => {
        let state: any = {};
        list.forEach(s => {
          if (s.name === "enter_time") state.prefEnterTime = window.parseInt(s.value);
          if (s.name === "workday_start") state.prefWorkdayStart = window.parseInt(s.value);
          if (s.name === "workday_end") state.prefWorkdayEnd = window.parseInt(s.value);
          if (s.name === "workdays") state.prefWorkdays = s.value.split(",").map(val => window.parseInt(val));
          if (s.name === "location_id") state.prefLocationId = s.value;
        });
        if (self.context.dailyBasisBooking) {
          state.prefWorkdayStart = 0;
          state.prefWorkdayEnd = 23;
        }
        self.setState({
          ...state
        }, () => resolve());
      }).catch(e => reject(e));
    });
  }

  onNavigationFocus = () => {
    this.loadPreferences().then(() => {
      this.initDates();
      this.updateCanSearch()
    });
    if (this.state.locationId) {
      let promises = [
        this.initCurrentBookingCount(),
        this.loadSpaces(this.state.locationId),
      ];
      Promise.all(promises).then(() => {
        this.setState({ loading: false });
      });
    }
  }

  initCurrentBookingCount = async () => {
    return Booking.list().then(list => {
      this.curBookingCount = list.length;
      this.updateCanSearch();
    });
  }

  centerMapView = () => {
    this.setState({
      mapOffsetX: this.state.style.container.width / 2 - (this.containerWidth / 2),
      mapOffsetY: this.state.style.container.height / 2 - (this.containerHeight / 2),
    });
  }

  /*
  onFooterHeightChange = (e: any) => {
    if (e) {
      this.setState({ footerHeightValue: e.value });
    }
  }
  */

  initDates = () => {
    let enter = new Date();
    if (this.state.prefEnterTime === Search.PreferenceEnterTimeNow) {
      enter.setHours(enter.getHours() + 1, 0, 0);
      if (enter.getHours() < this.state.prefWorkdayStart) {
        enter.setHours(this.state.prefWorkdayStart, 0, 0, 0);
      }
      if (enter.getHours() >= this.state.prefWorkdayEnd) {
        enter.setDate(enter.getDate() + 1);
        enter.setHours(this.state.prefWorkdayStart, 0, 0, 0);
      }
    } else if (this.state.prefEnterTime === Search.PreferenceEnterTimeNextDay) {
      enter.setDate(enter.getDate() + 1);
      enter.setHours(this.state.prefWorkdayStart, 0, 0, 0);
    } else if (this.state.prefEnterTime === Search.PreferenceEnterTimeNextWorkday) {
      enter.setDate(enter.getDate() + 1);
      let add = 0;
      let nextDayFound = false;
      let lookFor = enter.getDay();
      while (!nextDayFound) {
        if (this.state.prefWorkdays.includes(lookFor) || add > 7) {
          nextDayFound = true;
        } else {
          add++;
          lookFor++;
          if (lookFor > 6) {
            lookFor = 0;
          }
        }
      }
      enter.setDate(enter.getDate() + add);
      enter.setHours(this.state.prefWorkdayStart, 0, 0, 0);
    }

    let leave = new Date(enter);
    leave.setHours(this.state.prefWorkdayEnd, 0, 0);

    if (this.context.dailyBasisBooking) {
      enter.setHours(0, 0, 0, 0);
      leave.setHours(23, 59, 59, 0);
    }

    this.setState({
      enter: enter,
      leave: leave
    });
  }

  loadLocations = async (): Promise<void> => {
    return Location.list().then(list => {
      this.locations = list;
    });
  }

  loadMap = async (locationId: string) => {
    this.setState({ loading: true });
    return Location.get(locationId).then(location => {
      return this.loadSpaces(location.id).then(() => {
        return Ajax.get(location.getMapUrl()).then(mapData => {
          this.mapData = "data:image/" + location.mapMimeType + ";base64," + mapData.json.data;
          this.setState({
            style: StyleSheet.create({
              ...this.state.style,
              container: {
                width: location.mapWidth,
                height: location.mapHeight
              }
            }),
          }, () => this.centerMapView());
        });
      });
    })
  }

  loadSpaces = async (locationId: string) => {
    this.setState({ loading: true });
    return Space.listAvailability(locationId, this.state.enter, this.state.leave).then(list => {
      this.data = list;
    });
  }

  onSpaceSelect = (item: Space) => {
    if (item.available) {
      this.setState({
        selectedSpace: item,
        showConfirm: true
      });
    } else {
      let bookings = Booking.createFromRawArray(item.rawBookings);
      if (!item.available && bookings && bookings.length > 0) {
        this.setState({
          showBookingNames: true,
          selectedSpace: item
        });
      }
    }
  }

  renderListItem = (item: Space) => {
    let text = <Text style={Styles.text} onPress={() => this.onSpaceSelect(item)}>{item.name}</Text>
    if (!item.available) {
      text = <Text style={[Styles.text, { color: "#aaa" }]} onPress={() => this.onSpaceSelect(item)}>{item.name}</Text>
    }
    return (
      <View key={item.id}>
        <View style={Styles.tableRow}>
          {text}
        </View>
        <View style={Styles.horizontalLine}></View>
      </View>
    );
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
        transform: [{ rotate: item.rotation + "deg" }],
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
      },
    });
    if (item.width < item.height) {
      style.text = {
        ...style.text,
        width: item.height,
        transform: [{ rotate: "90deg" }],
      };
    }
    return (
      <TouchableOpacity key={item.id} style={style.box} onPress={() => this.onSpaceSelect(item)}>
        <Text style={style.text} numberOfLines={1}>{item.name}</Text>
      </TouchableOpacity>
    );
  }

  /*
  onFooterStateChange = (e: any) => {
    if (e && e.nativeEvent && e.nativeEvent.state === GestureState.END) {
      this.toggleFooter();
    }
  }
  */

  toggleFooter = () => {
    if (this.state.minDragOffset < 0) {
      this.maximizeFooter();
    } else {
      this.minimizeFooter();
    }
  }

  maximizeFooter = () => {
    this.showMapOverlay();
    this.setState({
      minDragOffset: Search.dragOffset,
    });
    if (RuntimeInfo.isIOS()) {
      Animated.timing(this.state.footerHeight, {
        toValue: this.containerHeight * 0.8,
        duration: 250,
        useNativeDriver: false,
      }).start(() => {
        this.setState({
          footerHeightValue: this.containerHeight * 0.8
        });
      });
    } else {
      this.setState({
        footerHeight: new Animated.Value(this.containerHeight * 0.8),
        footerHeightValue: this.containerHeight * 0.8,
      });
    }
  }

  minimizeFooter = () => {
    this.hideMapOverlay();
    this.setState({
      minDragOffset: -1 * Search.dragOffset,
    });
    if (RuntimeInfo.isIOS()) {
      Animated.timing(this.state.footerHeight, {
        toValue: Search.footerHeightCollapsed,
        duration: (RuntimeInfo.isIOS() ? 250 : 1),
        useNativeDriver: false,
      }).start(() => {
        this.setState({
          footerHeightValue: Search.footerHeightCollapsed
        });
      });
    } else {
      this.setState({
        footerHeight: new Animated.Value(Search.footerHeightCollapsed),
        footerHeightValue: Search.footerHeightCollapsed,
      });
    }
  }

  onFooterGestureEvent = (e: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
    Animated.timing(this.state.footerHeight, {
      toValue: (-1 * e.translationY + this.state.footerHeightValue),
      duration: 0,
      useNativeDriver: false,
    }).start();
  }

  updateCanSearch = async () => {
    let res = true;
    let hint = "";
    if (this.curBookingCount >= this.context.maxBookingsPerUser) {
      res = false;
      hint = this.props.i18n.t("errorBookingLimit", { "num": this.context.maxBookingsPerUser });
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
      hint = this.props.i18n.t("errorDaysAdvance", { "num": this.context.maxDaysInAdvance });
    }
    let bookingDurationHours = Math.floor((this.state.leave.getTime() - this.state.enter.getTime()) / MS_PER_MINUTE) / 60;
    if (bookingDurationHours > this.context.maxBookingDurationHours) {
      res = false;
      hint = this.props.i18n.t("errorBookingDuration", { "num": this.context.maxBookingDurationHours });
    }
    let self = this;
    return new Promise<void>(function (resolve, reject) {
      self.setState({
        canSearch: res,
        canSearchHint: hint
      }, () => resolve());
    });
  }

  startLocationPicking = () => {
    this.setState({ showLocationPicker: !this.state.showLocationPicker });
  }

  startEnterPicking = () => {
    if (this.state.showEnterPicker) {
      this.setState({ showEnterPicker: false });
    } else {
      this.setState({
        enterMode: (RuntimeInfo.isIOS() && !this.context.dailyBasisBooking) ? "datetime" : "date",
        showEnterPicker: true
      });
    }
  }

  startLeavePicking = () => {
    if (this.state.showLeavePicker) {
      this.setState({ showLeavePicker: false });
    } else {
      this.setState({
        leaveMode: (RuntimeInfo.isIOS() && !this.context.dailyBasisBooking) ? "datetime" : "date",
        showLeavePicker: true
      });
    }
  }

  setEnterDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate === undefined) {
      this.setState({
        showEnterPicker: false
      });
      return;
    }
    let dateChangedCb = () => {
      this.updateCanSearch().then(() => {
        if (!this.state.canSearch) {
          this.setState({ loading: false });
        } else {
          let promises = [
            this.initCurrentBookingCount(),
            this.loadSpaces(this.state.locationId),
          ];
          Promise.all(promises).then(() => {
            this.setState({ loading: false });
          });
        }
      });
    };
    let diff = this.state.leave.getTime() - this.state.enter.getTime();
    let newDate = selectedDate || this.state.enter;
    let leave = new Date();
    leave.setTime(newDate.getTime() + diff);
    if (this.state.enterMode === "datetime") {
      this.setState({
        enter: newDate,
        leave: leave
      }, () => dateChangedCb());
    } else if (this.state.enterMode === "date") {
      if (this.context.dailyBasisBooking) {
        selectedDate?.setHours(0, 0, 0);
        leave.setTime(newDate.getTime() + diff);
        this.setState({
          enter: newDate,
          leave: leave,
          showEnterPicker: false
        }, () => dateChangedCb());
      } else {
        this.setState({
          enter: newDate,
          leave: leave,
          enterMode: "time"
        }, () => dateChangedCb());
      }
    } else if (this.state.enterMode === "time") {
      this.setState({
        enter: newDate,
        leave: leave,
        showEnterPicker: false
      }, () => dateChangedCb());
    }
  }

  setLeaveDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate === undefined) {
      this.setState({
        showLeavePicker: false
      });
      return;
    }
    let dateChangedCb = () => {
      this.updateCanSearch().then(() => {
        if (!this.state.canSearch) {
          this.setState({ loading: false });
        } else {
          let promises = [
            this.initCurrentBookingCount(),
            this.loadSpaces(this.state.locationId),
          ];
          Promise.all(promises).then(() => {
            this.setState({ loading: false });
          });
        }
      });
    };
    let newDate = selectedDate || this.state.enter;
    if (this.state.leaveMode === "datetime") {
      this.setState({ leave: newDate }, () => dateChangedCb());
    } else if (this.state.leaveMode === "date") {
      if (this.context.dailyBasisBooking) {
        selectedDate?.setHours(23, 59, 59);
        this.setState({
          leave: newDate,
          showLeavePicker: false
        }, () => dateChangedCb());
      } else {
        this.setState({
          leave: newDate,
          leaveMode: "time"
        }, () => dateChangedCb());
      }
    } else if (this.state.leaveMode === "time") {
      this.setState({
        leave: newDate,
        showLeavePicker: false
      }, () => dateChangedCb());
    }
  }

  formatDateTime = (date: Date) => {
    if (this.context.dailyBasisBooking) {
      return Formatting.getFormatterNoTime(true).format(date);
    }
    return Formatting.getFormatter(true).format(date);
  }

  formatDateTimeShort = (date: Date) => {
    if (this.context.dailyBasisBooking) {
      return Formatting.getFormatterNoTime(true).format(date);
    }
    return Formatting.getFormatterShort(true).format(date);
  }

  logout = async () => {
    Ajax.CREDENTIALS = new AjaxCredentials();
    await Ajax.PERSISTER.deleteCredentialsFromSessionStorage();
    this.context.setDetails("");
  }

  showMapOverlay = () => {
    this.setState({ showMapOverlay: true });
    Animated.timing(this.mapOverlayOpacity, {
      toValue: 0.8,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }

  hideMapOverlay = () => {
    Animated.timing(this.mapOverlayOpacity, {
      toValue: 0.0,
      duration: 250,
      useNativeDriver: true,
    }).start(e => {
      if (e.finished) {
        this.setState({ showMapOverlay: false });
      }
    });
  }

  toggleListView = () => {
    this.setState({ listView: !this.state.listView });
  }

  getStatusBarHeight = (): number => {
    return 0;
  }

  onContainerLayout = (e: any) => {
    if (e && e.nativeEvent && e.nativeEvent.layout) {
      this.containerHeight = e.nativeEvent.layout.height;
      this.containerWidth = e.nativeEvent.layout.width;
    }
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

  getActualTimezone = (): string => {
    let tz: string = this.context.defaultTimezone;
    this.locations.forEach(location => {
      if (this.state.locationId === location.id && location.timezone) {
        tz = location.timezone;
      }
    });
    return tz;
  }

  changeLocation = (id: string) => {
    this.setState({
      locationId: id,
      loading: true,
    });
    this.loadMap(id).then(() => {
      this.setState({ loading: false });
    });
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
    booking.enter = new Date(this.state.enter);
    booking.leave = new Date(this.state.leave);
    booking.space = this.state.selectedSpace;
    booking.save().then(() => {
      this.loadSpaces(this.state.locationId).then(() => {
        this.setState({
          loading: false,
          showSuccess: true
        });
        setTimeout(() => {
          this.setState({ showSuccess: false });
        }, 5000);
      });
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
        this.setState({ showError: false });
      }, 5000);
    });
  }

  renderBookingNameRow = (booking: Booking) => {
    let times = <></>
    if (this.context.dailyBasisBooking) {
      times = (
        <>
          <View style={{ flexDirection: "row" }}>
            <Ionicons name="enter-outline" size={16} color="#555" />
            <Text style={{ marginLeft: 5 }}>{Formatting.getFormatterNoTime().format(booking.enter)}</Text>
          </View>
          <View style={{ flexDirection: "row" }}>
            <Ionicons name="exit-outline" size={16} color="#555" />
            <Text style={{ marginLeft: 5 }}>{Formatting.getFormatterNoTime().format(booking.leave)}</Text>
          </View>
        </>
      );
    } else {
      times = (
        <>
          <View style={{ flexDirection: "row" }}>
            <Ionicons name="enter-outline" size={16} color="#555" />
            <Text style={{ marginLeft: 5 }}>{Formatting.getFormatter().format(booking.enter)}</Text>
          </View>
          <View style={{ flexDirection: "row" }}>
            <Ionicons name="exit-outline" size={16} color="#555" />
            <Text style={{ marginLeft: 5 }}>{Formatting.getFormatter().format(booking.leave)}</Text>
          </View>
        </>
      );
    }
    return (
      <View key={booking.user.id} style={{ marginTop: 10 }}>
        <View style={{ flexDirection: "row" }}>
          <Ionicons name="person-outline" size={16} color="#555" />
          <Text style={{ marginLeft: 5 }}>{booking.user.email}</Text>
        </View>
        {times}
      </View>
    );
  }

  render = () => {
    const style = StyleSheet.create({
      mapContainer: {
        flex: 1,
      },
      dragArea: {
        alignItems: "center",
        paddingTop: 10,
        paddingBottom: 10,
      },
      dragger: {
        height: 5,
        width: 50,
        backgroundColor: "#888",
        borderRadius: 5,
      },
      footerContent: {
        paddingLeft: 20,
        paddingRight: 20,
      },
      iconPrependRow: {
        flexDirection: 'row',
        marginBottom: 5,
      },
      footerText: {
        fontSize: PrimaryTextSize,
        color: "#555",
        paddingLeft: 5,
      },
      overlay: {
        position: "absolute",
        width: "100%",
        height: "100%",
        resizeMode: "cover",
        backgroundColor: "#555",
        zIndex: 999,
      },
      toggleListViewButton: {
        position: "absolute",
        padding: 10,
        right: 10,
        top: 10,
        backgroundColor: "#fff",
        borderRadius: 10,
        zIndex: 100,
        borderWidth: 1,
        borderColor: "#eee",
        shadowColor: "#000",
        shadowRadius: 3,
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 0 },
      },
      footerNav: {
        backgroundColor: "#eee",
        flexGrow: 0,
        shadowColor: "#000",
        shadowRadius: 1,
        shadowOpacity: 0.1,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
      },
      errorText: {
        fontSize: PrimaryTextSize,
        textAlign: "center",
        padding: 25,
      },
      button: {
        marginTop: 15
      },
      searchHint: {
        paddingTop: 10,
        paddingBottom: 10,
        fontSize: PrimaryTextSize,
        color: "red"
      },
    });

    let toggleListViewButton = (
      <TouchableOpacity onPress={this.toggleListView} style={style.toggleListViewButton}><Ionicons name="list-outline" size={20} color="#555" /></TouchableOpacity>
    );
    if (this.state.listView) {
      toggleListViewButton = (
        <TouchableOpacity onPress={this.toggleListView} style={style.toggleListViewButton}><Ionicons name="map-outline" size={20} color="#555" /></TouchableOpacity>
      );
    }

    let overlay = <></>
    if (this.state.showMapOverlay) {
      overlay = (
        <Animated.View style={[style.overlay, { opacity: this.mapOverlayOpacity }]}></Animated.View>
      );
    }

    let listOrMap = <></>
    if (this.state.listView) {
      listOrMap = (
        <FlatList data={this.data} renderItem={({ item }) => this.renderListItem(item)} keyExtractor={item => item.id} style={Styles.list} />
      );
    } else {
      if (RuntimeInfo.isIOS()) {
        listOrMap = (
          <ScrollView contentOffset={{ x: this.state.mapOffsetX, y: this.state.mapOffsetY }} contentContainerStyle={{ width: this.state.style.container.width }} nestedScrollEnabled={true}>
            <View style={this.state.style.container}>
              <ImageBackground style={Styles.mapImg} source={{ uri: this.mapData }}>
                {this.data.map((item) => this.renderItem(item))}
              </ImageBackground>
            </View>
          </ScrollView>
        );
      } else {
        listOrMap = (
          <ScrollView contentOffset={{ x: 0, y: this.state.mapOffsetY }}>
            <ScrollView contentOffset={{ x: this.state.mapOffsetX, y: 0 }} nestedScrollEnabled={true} horizontal={true}>
              <View style={this.state.style.container}>
                <ImageBackground style={Styles.mapImg} source={{ uri: this.mapData }}>
                  {this.data.map((item) => this.renderItem(item))}
                </ImageBackground>
              </View>
            </ScrollView>
          </ScrollView>
        );
      }
    }

    let staticContent = <></>
    let formContent = <></>
    if (this.state.minDragOffset < 0) {
      staticContent = (
        <View style={style.footerContent}>
          <View style={style.iconPrependRow}>
            <Ionicons name="location-outline" size={20} color="#555" />
            <Text style={style.footerText}>{this.getLocationName()}</Text>
          </View>
          <View style={style.iconPrependRow}>
            <Ionicons name="enter-outline" size={20} color="#555" />
            <Text style={style.footerText}>{this.formatDateTime(this.state.enter)}</Text>
          </View>
          <View style={style.iconPrependRow}>
            <Ionicons name="exit-outline" size={20} color="#555" />
            <Text style={style.footerText}>{this.formatDateTime(this.state.leave)}</Text>
          </View>
        </View>
      );
    } else {
      let searchHint = <></>
      if (!this.state.canSearch && this.state.canSearchHint) {
        searchHint = (
          <>
            <View style={Styles.horizontalLine}></View>
            <View>
              <Text style={style.searchHint}>{this.state.canSearchHint}</Text>
            </View>
          </>
        );
      }
      let locationPicker = <></>
      if (RuntimeInfo.isAndroid()) {
        locationPicker = (
          <>
            <View style={Styles.tableRow}>
              <Ionicons name="location-outline" size={20} color="#555" />
              <Picker selectedValue={this.state.locationId} onValueChange={(id) => this.changeLocation(id)} style={Styles.pickerTable}>
                {this.locations.map(location => <Picker.Item key={location.id} label={location.name} value={location.id} />)}
              </Picker>
            </View>
          </>
        );
      } else {
        locationPicker = (
          <>
            <View style={Styles.tableRow}>
              <Ionicons name="location-outline" size={20} color="#555" />
              <Text style={Styles.textTableValue} onPress={() => this.startLocationPicking()}>{this.getLocationName()}</Text>
            </View>
            {this.state.showLocationPicker && (
              <Picker selectedValue={this.state.locationId} onValueChange={(id) => this.changeLocation(id)} style={{ width: '100%' }}>
                {this.locations.map(location => <Picker.Item key={location.id} label={location.name} value={location.id} />)}
              </Picker>
            )}
          </>
        );
      }
      formContent = (
        <ScrollView style={style.footerContent}>
          <View>
            <Text style={Styles.sectionHeader}>{this.props.i18n.t("bookSeat")}</Text>
          </View>
          <View style={Styles.section}>
            {locationPicker}
            <View style={Styles.horizontalLine}></View>
            <View style={Styles.tableRow}>
              <Ionicons name="enter-outline" size={20} color="#555" />
              <Text style={Styles.textTableValue} onPress={() => this.startEnterPicking()}>{this.formatDateTime(this.state.enter)}</Text>
            </View>
            {this.state.showEnterPicker && (
              <DateTimePicker onChange={this.setEnterDate} value={this.state.enter} display="spinner" mode={this.state.enterMode} style={{ width: '100%' }} />
            )}
            <View style={Styles.horizontalLine}></View>
            <View style={Styles.tableRow}>
              <Ionicons name="exit-outline" size={20} color="#555" />
              <Text style={Styles.textTableValue} onPress={() => this.startLeavePicking()}>{this.formatDateTime(this.state.leave)}</Text>
            </View>
            {this.state.showLeavePicker && (
              <DateTimePicker onChange={this.setLeaveDate} value={this.state.leave} display="spinner" mode={this.state.leaveMode} style={{ width: '100%' }} />
            )}
            {searchHint}
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
              <Ionicons name="person-outline" size={20} color="#555" />
              <Text style={Styles.textTableValue}>{this.context.username.toLowerCase()}</Text>
            </View>
            <View style={Styles.horizontalLine}></View>
            <View style={Styles.tableRow}>
              <TouchableOpacity onPress={() => this.props.navigation.navigate("Preferences")}><Text style={Styles.formButtom}>{this.props.i18n.t("preferences")}</Text></TouchableOpacity>
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
      );
    }

    let mapContainer = <></>
    if (this.state.loading) {
      mapContainer = (
        <ActivityIndicator size="large" style={Styles.activityIndicator} color="#555" />
      );
    } else {
      if (this.state.locationId) {
        mapContainer = (
          <>
            {toggleListViewButton}
            {listOrMap}
          </>
        );
      } else {
        mapContainer = (
          <Text style={style.errorText}>{this.props.i18n.t("errorPickArea")}</Text>
        );
      }
    }

    let confirmButtons = [
      { label: this.props.i18n.t("cancel"), onPress: () => { this.setState({ showConfirm: false }) } },
      { label: this.props.i18n.t("book"), onPress: () => { this.onConfirmBooking() } },
    ];
    let confirmModal = (
      <ModalDialog visible={this.state.showConfirm} buttons={confirmButtons}>
        <Text style={Styles.text}>{this.props.i18n.t("confirmBookingText", { space: this.state.selectedSpace?.name })}</Text>
      </ModalDialog>
    );

    let bookings: Booking[] = [];
    if (this.state.selectedSpace) {
      bookings = Booking.createFromRawArray(this.state.selectedSpace.rawBookings);
    }
    let bookingNamesModal = (
      <ModalDialog visible={this.state.showBookingNames} buttons={[{ label: this.props.i18n.t("ok"), onPress: () => { this.setState({ showBookingNames: false }) } }]}>
        <Text style={Styles.subject}>{this.state.selectedSpace?.name}</Text>
        {bookings.map(booking => this.renderBookingNameRow(booking))}
      </ModalDialog>
    );

    let dragArea = <></>;
    if (RuntimeInfo.isIOS()) {
      const gesture = Gesture.Pan()
        .onUpdate(this.onFooterGestureEvent)
        .onEnd(() => this.toggleFooter());
      dragArea = (
        <Animated.View style={[style.footerNav, { height: this.state.footerHeight }]}>
          <GestureDetector gesture={gesture}>
            <View style={style.dragArea}>
              <View style={style.dragger}></View>
            </View>
          </GestureDetector>
          {staticContent}
          {formContent}
        </Animated.View>
      );
    } else {
      dragArea = (
        <View style={[style.footerNav, { height: this.state.footerHeightValue }]}>
          <Pressable style={style.dragArea} onPress={this.toggleFooter}>
            <Ionicons name={this.state.minDragOffset < 0 ? "caret-up-outline" : "caret-down-outline"} size={16} color="#555" />
          </Pressable>
          {staticContent}
          {formContent}
        </View>
      );
    }

    return (
      <SafeAreaView style={Styles.container} edges={['right', 'top', 'left']} onLayout={this.onContainerLayout}>
        {bookingNamesModal}
        {confirmModal}
        <ModalDialog visible={this.state.showSuccess}>
          <Text style={Styles.successIcon}>&#128077;</Text>
          <Text style={Styles.text}>{this.props.i18n.t("bookingConfirmed")}</Text>
        </ModalDialog>
        <ModalDialog visible={this.state.showError}>
          <Text style={Styles.successIcon}>&#129320;</Text>
          <Text style={Styles.text}>{this.state.errorText}</Text>
        </ModalDialog>
        <View style={style.mapContainer}>
          {mapContainer}
          {overlay}
        </View>
        {dragArea}
      </SafeAreaView>
    )
  }
}
export default withTranslation()(Search as any);
