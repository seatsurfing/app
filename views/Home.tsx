import React from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Styles, PrimaryTextSize } from '../types/Styles';
import { TouchableHighlight, TextInput, ScrollView } from 'react-native-gesture-handler';
import * as WebBrowser from 'expo-web-browser';
import { Ajax, Organization, AuthProvider } from '../commons';
import { AuthContext } from '../types/AuthContextData';
import Storage from '../types/Storage';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  navigation: StackNavigationProp<RootStackParamList>
}

interface State {
  email: string
  password: string
  requirePassword: boolean
  providers: AuthProvider[] | null
  invalid: boolean
  loading: boolean
}

export default class Home extends React.Component<Props, State> {
  static contextType = AuthContext;
  org: Organization | null;

  constructor(props: Props) {
    super(props);
    this.org = null;
    this.state = {
      requirePassword: false,
      password: "",
      email: "",
      providers: null,
      invalid: false,
      loading: false
    };
  }

  finishJwtSetup = (jwt: string, email: string) => {
    Ajax.JWT = jwt;
    Storage.setJWT(jwt).then(() => {
      this.setState({ loading: false });
      this.context.setDetails(jwt, email);
    });
  }

  getJwt = (id: string) => {
    return Ajax.get("/auth/verify/" + id).then(result => {
      if (result.json && result.json.jwt) {
        this.finishJwtSetup(result.json.jwt, this.state.email);
      }
    });
  }

  useProvider = (provider: AuthProvider) => {
    this.setState({ loading: true });
    WebBrowser.openAuthSessionAsync(Ajax.getBackendUrl() + "/auth/" + provider.id + "/login/app", "").then(result => {
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

  onPasswordSubmit = (e: any) => {
    this.setState({
      loading: true,
      invalid: false
    });
    let payload = {
      email: this.state.email,
      password: this.state.password
    };
    Ajax.postData("/auth/login", payload).then((res) => {
      this.finishJwtSetup(res.json.jwt, this.state.email);
    }).catch((e) => {
      this.setState({
        loading: false,
        invalid: true
      });
    });
  }

  submitLoginForm = () => {
    let email = this.state.email.split("@");
    if (email.length !== 2) {
      return;
    }
    this.setState({
      loading: true,
      invalid: false
    });
    let payload = {
      email: this.state.email.trim().toLowerCase()
    };
    Ajax.postData("/auth/preflight", payload).then((res) => {
      this.org = new Organization();
      this.org.deserialize(res.json.organization);
      this.setState({
        loading: false,
        providers: res.json.authProviders,
        requirePassword: res.json.requirePassword
      });
    }).catch((e) => {
      this.setState({
        loading: false,
        invalid: true
      });
    });
  }

  canLogin = () => {
    if (this.state.email && this.state.email.indexOf("@") >= 1 && this.state.email.length >= 6 && this.state.email.split("@").length == 2) {
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
        invalidText = <Text style={style.invalidText}>Ungültiges Kennwort.</Text>;
      }
      return (
        <SafeAreaView style={Styles.containerCenter}>
          <KeyboardAvoidingView contentContainerStyle={Styles.containerCenter} behavior={Platform.OS == "ios" ? "padding" : "height"}>
            <ScrollView contentContainerStyle={Styles.containerCenter}>
              <Text style={style.claim}>Als {this.state.email.toLowerCase()} an {this.org?.name} anmelden:</Text>
              {invalidText}
              <TextInput style={style.textInput} value={this.state.password} onChangeText={text => this.setState({ password: text })} placeholder="Kennwort" secureTextEntry={true} autoFocus={true} />
              <View>
                <TouchableHighlight style={style.button} onPress={this.onPasswordSubmit} disabled={!this.canPasswordLogin()}>
                  <Text style={this.canPasswordLogin() ? style.buttonText : style.buttonTextDisabled}>Anmelden</Text>
                </TouchableHighlight>
              </View>
              <View>
                <TouchableHighlight style={style.buttonSeconday} onPress={() => this.setState({ invalid: false, requirePassword: false, providers: null, loading: false })}>
                  <Text style={style.buttonText}>Zurück</Text>
                </TouchableHighlight>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      );
    }

    if (this.state.providers != null) {
      let buttons = this.state.providers.map(provider => this.renderAuthProviderButton(provider, style));
      let providerSelection = <Text style={style.claim}>Als {this.state.email.toLowerCase()} an {this.org?.name} anmelden mit:</Text>;
      if (buttons.length === 0) {
        providerSelection = <Text style={style.claim}>Für diesen Nutzer stehen keine Anmelde-Möglichkeiten zur Verfügung.</Text>
      }
      return (
        <SafeAreaView style={Styles.containerCenter}>
          <ScrollView contentContainerStyle={Styles.containerCenter}>
            {providerSelection}
            {buttons}
            <View>
              <TouchableHighlight style={style.buttonSeconday} onPress={() => this.setState({ invalid: false, requirePassword: false, providers: null, loading: false })}>
                <Text style={style.buttonText}>Zurück</Text>
              </TouchableHighlight>
            </View>
          </ScrollView>
        </SafeAreaView>
      );
    }

    let invalidText = <></>;
    if (this.state.invalid) {
      invalidText = <Text style={style.invalidText}>Fehler bei der Anmeldung. Möglicherweise ist diese E-Mail-Adresse nicht mit einer Organisation verknüpft.</Text>;
    }
    return (
      <SafeAreaView style={Styles.containerCenter}>
        <KeyboardAvoidingView contentContainerStyle={Styles.containerCenter} behavior={Platform.OS == "ios" ? "padding" : "height"}>
          <ScrollView contentContainerStyle={Styles.containerCenter}>
            <Image source={require("../assets/logo.png")} style={style.logo} />
            <Text style={style.claim}>Finde Deinen Platz.</Text>
            {invalidText}
            <TextInput style={style.textInput} value={this.state.email} onChangeText={text => this.setState({ email: text })} placeholder="max@mustermann.de" keyboardType="email-address" />
            <TouchableHighlight style={style.button} onPress={this.submitLoginForm} disabled={!this.canLogin()}>
              <Text style={this.canLogin() ? style.buttonText : style.buttonTextDisabled}>Loslegen</Text>
            </TouchableHighlight>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    )
  }
}
