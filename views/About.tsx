import React from 'react';
import { Text, SafeAreaView, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Styles } from '../types/Styles';
import { withTranslation } from 'react-i18next';
import { i18n } from 'i18next';

interface Props {
  navigation: StackNavigationProp<RootStackParamList>
  i18n: i18n
}

interface State {
}

class About extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);
    this.state = {
    };
  }

  render = () => {
    return(
      <SafeAreaView style={Styles.container}>
        <ScrollView contentContainerStyle={Styles.scrollViewCenter}>
          <Text style={Styles.text}>{this.props.i18n.t("providedBy")}</Text>
          <Text style={Styles.text}></Text>
          <Text style={Styles.text}>Heinrich Beck</Text>
          <Text style={Styles.text}>Wilhelm-Busch-Str. 59</Text>
          <Text style={Styles.text}>60431 Frankfurt</Text>
          <Text style={Styles.text}>{this.props.i18n.t("germany")}</Text>
          <Text style={Styles.text}></Text>
          <Text style={Styles.text}>{this.props.i18n.t("contact")}:</Text>
          <Text style={Styles.text}>info@seatsurfing.app</Text>
          <Text style={Styles.text}></Text>
          <TouchableOpacity onPress={() => Linking.openURL("https://seatsurfing.app/contact/")}><Text style={Styles.formButtom}>{this.props.i18n.t("moreInfo")}</Text></TouchableOpacity>
          <Text style={Styles.text}></Text>
          <TouchableOpacity onPress={() => Linking.openURL("https://seatsurfing.app/privacy-policy/")}><Text style={Styles.formButtom}>{this.props.i18n.t("privacy")}</Text></TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    )
  }
}

export default withTranslation()(About as any);
