import 'react-native-gesture-handler';
import 'intl';
import 'intl/locale-data/jsonp/de';
import React from 'react';
import './types/i18n';
import { NavigationContainer } from '@react-navigation/native';
import { enableScreens } from 'react-native-screens';
import { createNativeStackNavigator } from 'react-native-screens/native-stack';
import Home from './views/Home';
import { Platform, ActivityIndicator, SafeAreaView } from 'react-native';
import Search from './views/Search';
import SelectLocation from './views/SelectLocation';
import SearchResult from './views/SearchResult';
import MyBookings from './views/MyBookings';
import { AuthContext, AuthContextData } from './types/AuthContextData';
import { Styles } from './types/Styles';
import { User, Ajax, Settings as OrgSettings } from './commons';
import Constants from "expo-constants";
import Storage from './types/Storage';
import { withTranslation } from 'react-i18next';
import { i18n } from 'i18next';

enableScreens();
const Stack = createNativeStackNavigator<RootStackParamList>();

// Workaround for issue "DateTimePicker not working on Android"
if (Platform.OS === 'android') {
  Intl.__disableRegExpRestore();
}

interface Props {
  i18n: i18n
}

class App extends React.Component<Props, AuthContextData> {
  constructor(props: Props) {
    super(props);
    this.state = {
      token: "",
      username: "",
      isLoading: true,
      maxBookingsPerUser: 0,
      maxDaysInAdvance: 0,
      maxBookingDurationHours: 0,
      setDetails: this.setDetails
    };
    Ajax.DEV_MODE = (Constants.appOwnership === "expo");
    if (Ajax.DEV_MODE && Constants.manifest.debuggerHost) {
      Ajax.DEV_URL = "http://" + Constants.manifest.debuggerHost.split(':').shift() + ":8090";
    }
    setTimeout(() => {
      this.verifyToken();
    }, 10);
  }

  loadSettings = async () => {
    OrgSettings.list().then(settings => {
      let state: any = {};
      settings.forEach(s => {
        if (s.name === "max_bookings_per_user") state.maxBookingsPerUser = window.parseInt(s.value);
        if (s.name === "max_days_in_advance") state.maxDaysInAdvance = window.parseInt(s.value);
        if (s.name === "max_booking_duration_hours") state.maxBookingDurationHours = window.parseInt(s.value);
      });
      this.setState({
        ...this.state,
        ...state
      });
    });
  }

  verifyToken = async () => {
    let token = await Storage.getJWT();
    if (token != null) {
      Ajax.JWT = token;
      User.getSelf().then(user => {
        this.loadSettings().then(() => {
          this.setDetails(token != null ? token : "", user.email);
          this.setState({isLoading: false});
        });
      }).catch((e) => {
        Ajax.JWT = "";
        Storage.deleteJWT().then(() => {
          this.setState({isLoading: false});
        });
      });
    } else {
      this.setState({isLoading: false});
    }
  }

  setDetails = (token: string, username: string) => {
    this.loadSettings().then(() => {
      this.setState({
        token: token,
        username: username
      });
    });
  }

  render() {
    if (this.state.isLoading) {
      return (
        <SafeAreaView style={Styles.container}>
          <ActivityIndicator size="large" style={Styles.activityIndicator} />
        </SafeAreaView>
      );
    }
    return(
      <NavigationContainer>
        <AuthContext.Provider value={this.state}>
          <Stack.Navigator>
            {!this.state.token ? (
              <>
                <Stack.Screen name="Home" component={Home} options={{headerShown: false}} />
              </>
            ) : (
              <>
                <Stack.Screen name="Search" component={Search} options={{title: "Seatsurfing", headerLargeTitle: true}} />
                <Stack.Screen name="SelectLocation" component={SelectLocation} options={{title: this.props.i18n.t("area")}} />
                <Stack.Screen name="SearchResult" component={SearchResult} options={{title: this.props.i18n.t("selectSpace")}} />
                <Stack.Screen name="MyBookings" component={MyBookings} options={{title: this.props.i18n.t("myBookings")}} />
              </>
            )}
          </Stack.Navigator>
        </AuthContext.Provider>
      </NavigationContainer>
    )
  }
}

export default withTranslation()(App as any);
