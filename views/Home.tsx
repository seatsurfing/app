import React from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Image, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Styles, PrimaryTextSize } from '../types/Styles';
import { TouchableHighlight, TextInput, ScrollView } from 'react-native-gesture-handler';
import * as WebBrowser from 'expo-web-browser';
import { Ajax, Organization, AuthProvider, AjaxCredentials } from '../commons';
import { AuthContext } from '../types/AuthContextData';
import Storage from '../types/Storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { withTranslation } from 'react-i18next';
import { i18n } from 'i18next';
import Constants from 'expo-constants';

interface Props {
  navigation: StackNavigationProp<RootStackParamList>
  i18n: i18n
}

interface State {
  url: string
  email: string
  password: string
  requirePassword: boolean
  providers: AuthProvider[] | null
  invalid: boolean
  loading: boolean
  backendVersion: string
}

class Home extends React.Component<Props, State> {
  static contextType = AuthContext;
  org: Organization | null;

  constructor(props: Props) {
    super(props);
    this.org = null;
    this.state = {
      url: (Ajax.URL ? Ajax.URL : "https://"),
      requirePassword: false,
      password: "",
      email: "",
      providers: null,
      invalid: false,
      loading: false,
      backendVersion: ""
    };
    this.initUrl();
  }

  initUrl = () => {
    let devMode = (Constants.appOwnership === "expo");
    if (devMode && Constants.manifest && Constants.manifest.debuggerHost) {
      this.state = {
        ...this.state,
        url: "http://" + Constants.manifest.debuggerHost.split(':').shift() + ":8080",
      };
    }
  }

  finishJwtSetup = (credentials: AjaxCredentials, email: string) => {
    Ajax.CREDENTIALS = credentials;
    Ajax.PERSISTER.updateCredentialsSessionStorage(Ajax.CREDENTIALS).then(() => {
      Ajax.PERSISTER.persistRefreshTokenInLocalStorage(Ajax.CREDENTIALS).then(() => {
        this.setState({ loading: false });
        this.context.setDetails(email);
      });
    });
  }

  getCredentialsFromJson = (json: any): AjaxCredentials => {
    let credentials: AjaxCredentials;
    if (json.accessToken) {
      credentials = {
        accessToken: json.accessToken,
        refreshToken: json.refreshToken,
        accessTokenExpiry: new Date(new Date().getTime() + Ajax.ACCESS_TOKEN_EXPIRY_OFFSET)
      };
    } else {
      credentials = {
        accessToken: json.jwt,
        refreshToken: "",
        accessTokenExpiry: new Date(0)
      };
    }
    return credentials;
  }

  getJwt = (id: string) => {
    return Ajax.get("/auth/verify/" + id).then(res => {
      if (res.json) {
        let credentials = this.getCredentialsFromJson(res.json);
        this.finishJwtSetup(credentials, this.state.email);
      }
    });
  }

  useProvider = (provider: AuthProvider) => {
    this.setState({ loading: true });
    let url = Ajax.getBackendUrl() + "/auth/" + provider.id + "/login/app";
    if (!this.state.backendVersion.startsWith("1.6.")) {
      url += "/1";
    }
    WebBrowser.openAuthSessionAsync(url, "").then(result => {
      if (result.type === "success") {
        let urlParts = result.url.split("/");
        let id = urlParts[urlParts.length - 1];
        this.getJwt(id);
      } else {
        this.setState({
          providers: null,
          loading: false,
          invalid: true
        });
      }
    });
  }

  onPasswordSubmit = () => {
    if (!this.canPasswordLogin()) {
      return;
    }
    this.setState({
      loading: true,
      invalid: false
    });
    let payload = {
      email: this.state.email,
      password: this.state.password,
      longLived: true
    };
    Ajax.postData("/auth/login", payload).then((res) => {
      let credentials = this.getCredentialsFromJson(res.json);
      this.finishJwtSetup(credentials, this.state.email);
    }).catch((e) => {
      this.setState({
        loading: false,
        invalid: true
      });
    });
  }

  submitLoginForm = () => {
    if (!this.canLogin()) {
      return;
    }
    let email = this.state.email.split("@");
    if (email.length !== 2) {
      return;
    }
    let url = this.state.url;
    if (!(url.toLowerCase().startsWith("https://") || url.toLowerCase().startsWith("http://"))) {
      url = "https://" + url;
    }
    this.setState({
      loading: true,
      invalid: false,
      url: url
    });
    Ajax.URL = url;
    let payload = {
      email: this.state.email.trim().toLowerCase()
    };
    Ajax.postData("/auth/preflight", payload).then((res) => {
      Storage.setURL(url);
      this.org = new Organization();
      this.org.deserialize(res.json.organization);
      this.setState({
        loading: false,
        providers: res.json.authProviders,
        requirePassword: res.json.requirePassword,
        backendVersion: (res.json.backendVersion ? res.json.backendVersion : "1.6.0")
      });
    }).catch((e) => {
      this.setState({
        loading: false,
        invalid: true
      });
    });
  }

  canLogin = () => {
    if (this.state.email &&
      this.state.email.indexOf("@") >= 1 &&
      this.state.email.length >= 6 &&
      this.state.email.split("@").length == 2) {
      return true;
    }
    return false;
  }

  canPasswordLogin = () => {
    if (this.state.password && this.state.password.length >= 8) {
      return true;
    }
    return false;
  }

  renderAuthProviderButton = (provider: AuthProvider, style: any) => {
    return (
      <View key={provider.id}>
        <TouchableHighlight style={style.button} onPress={() => this.useProvider(provider)}>
          <Text style={style.buttonText}>{provider.name}</Text>
        </TouchableHighlight>
      </View>
    );
  }

  render = () => {
    const style = StyleSheet.create({
      button: {
        backgroundColor: "rgb(10, 132, 255)",
        padding: 15,
        width: 200,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#fff"
      },
      buttonSeconday: {
        backgroundColor: "silver",
        padding: 15,
        width: 200,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#fff"
      },
      buttonText: {
        textAlign: "center",
        color: "white",
        fontSize: PrimaryTextSize
      },
      buttonTextDisabled: {
        textAlign: "center",
        color: "silver",
        fontSize: PrimaryTextSize,
      },
      claim: {
        fontSize: PrimaryTextSize,
        color: "gray",
        marginBottom: 25,
        textAlign: "center"
      },
      invalidText: {
        fontSize: PrimaryTextSize,
        color: "red",
        marginBottom: 25,
        textAlign: "center"
      },
      textInput: {
        ...Styles.textInput,
        flex: 0,
        marginRight: 0,
        backgroundColor: "#fff",
        padding: 15,
        width: 300,
        borderColor: "#ced4da",
        borderRadius: 10,
        borderWidth: 1,
        marginBottom: 15
      },
      logo: {
        marginBottom: 25,
        width: 300,
        height: (223 / 1024) * 300
      },
      linkBottom: {
        marginTop: 25
      }
    });

    if (this.state.loading) {
      return (
        <SafeAreaView style={Styles.containerCenter}>
          <ActivityIndicator size="large" style={Styles.activityIndicator} />
        </SafeAreaView>
      );
    }

    if (this.state.requirePassword) {
      let invalidText = <></>;
      if (this.state.invalid) {
        invalidText = <Text style={style.invalidText}>{this.props.i18n.t("errorInvalidPassword")}</Text>;
      }
      return (
        <SafeAreaView style={Styles.containerCenter}>
          <KeyboardAvoidingView contentContainerStyle={Styles.containerCenter} behavior={Platform.OS == "ios" ? "padding" : "height"}>
            <ScrollView contentContainerStyle={Styles.containerCenter}>
              <Text style={style.claim}>{this.props.i18n.t("signinAsAt", { "user": this.state.email.toLowerCase(), "org": this.org?.name })}</Text>
              {invalidText}
              <TextInput style={style.textInput} value={this.state.password} onChangeText={text => this.setState({ password: text })} placeholder={this.props.i18n.t("password")} secureTextEntry={true} autoFocus={true} onSubmitEditing={this.onPasswordSubmit} />
              <View>
                <TouchableHighlight style={style.button} onPress={this.onPasswordSubmit} disabled={!this.canPasswordLogin()}>
                  <Text style={this.canPasswordLogin() ? style.buttonText : style.buttonTextDisabled}>{this.props.i18n.t("signin")}</Text>
                </TouchableHighlight>
              </View>
              <View>
                <TouchableHighlight style={style.buttonSeconday} onPress={() => this.setState({ invalid: false, requirePassword: false, providers: null, loading: false })}>
                  <Text style={style.buttonText}>{this.props.i18n.t("back")}</Text>
                </TouchableHighlight>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      );
    }

    if (this.state.providers != null) {
      let buttons = this.state.providers.map(provider => this.renderAuthProviderButton(provider, style));
      let providerSelection = <Text style={style.claim}>{this.props.i18n.t("signinAsAt", { "user": this.state.email.toLowerCase(), "org": this.org?.name })}</Text>;
      if (buttons.length === 0) {
        providerSelection = <Text style={style.claim}>{this.props.i18n.t("errorNoAuthProviders")}</Text>
      }
      return (
        <SafeAreaView style={Styles.containerCenter}>
          <ScrollView contentContainerStyle={Styles.containerCenter}>
            {providerSelection}
            {buttons}
            <View>
              <TouchableHighlight style={style.buttonSeconday} onPress={() => this.setState({ invalid: false, requirePassword: false, providers: null, loading: false })}>
                <Text style={style.buttonText}>{this.props.i18n.t("back")}</Text>
              </TouchableHighlight>
            </View>
          </ScrollView>
        </SafeAreaView>
      );
    }

    let invalidText = <></>;
    if (this.state.invalid) {
      invalidText = <Text style={style.invalidText}>{this.props.i18n.t("errorLogin")}</Text>;
    }
    return (
      <SafeAreaView style={Styles.container}>
        <KeyboardAvoidingView style={Styles.container} behavior={Platform.OS == "ios" ? "padding" : "height"}>
          <ScrollView contentContainerStyle={Styles.scrollViewCenter}>
            <View style={Styles.growMax}></View>
            <Image source={require("../assets/logo.png")} style={style.logo} />
            <Text style={style.claim}>{this.props.i18n.t("findYourPlace")}</Text>
            {invalidText}
            <TextInput style={style.textInput} value={this.state.url} onChangeText={text => this.setState({ url: text })} placeholder={this.props.i18n.t("urlPlaceholder")} keyboardType="url" />
            <TextInput style={style.textInput} value={this.state.email} onChangeText={text => this.setState({ email: text })} placeholder={this.props.i18n.t("emailPlaceholder")} keyboardType="email-address" onSubmitEditing={this.submitLoginForm} />
            <TouchableHighlight style={style.button} onPress={this.submitLoginForm} disabled={!this.canLogin()}>
              <Text style={this.canLogin() ? style.buttonText : style.buttonTextDisabled}>{this.props.i18n.t("getStarted")}</Text>
            </TouchableHighlight>
            <View style={Styles.growMax}></View>
            <TouchableOpacity style={style.linkBottom} onPress={() => this.props.navigation.navigate("About")}><Text style={Styles.formButtom}>{this.props.i18n.t("about")}</Text></TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    )
  }
}

export default withTranslation()(Home as any);
