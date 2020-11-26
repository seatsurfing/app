import React from 'react';
import { Text, SafeAreaView, TouchableOpacity, Linking } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Styles } from '../types/Styles';
import { ScrollView } from 'react-native-gesture-handler';
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
      <SafeAreaView style={Styles.containerCenter}>
        <ScrollView contentContainerStyle={Styles.containerCenter}>
          <Text style={Styles.text}>{this.props.i18n.t("providedBy")}</Text>
          <Text style={Styles.text}></Text>
          <Text style={Styles.text}>weweave UG ({this.props.i18n.t("limitedLiability")})</Text>
          <Text style={Styles.text}>Fichtenweg 8d</Text>
          <Text style={Styles.text}>65510 Idstein</Text>
          <Text style={Styles.text}>{this.props.i18n.t("germany")}</Text>
          <Text style={Styles.text}></Text>
          <Text style={Styles.text}>{this.props.i18n.t("contact")}:</Text>
          <Text style={Styles.text}>E-Mail: info@seatsurfing.de</Text>
          <Text style={Styles.text}>Tel: +49 6126 5019798</Text>
          <Text style={Styles.text}>Fax: +49 6126 5019798</Text>
          <Text style={Styles.text}></Text>
          <Text style={Styles.text}>{this.props.i18n.t("representedByDirector")}:</Text>
          <Text style={Styles.text}>Jan Jonas</Text>
          <Text style={Styles.text}></Text>
          <Text style={Styles.text}>{this.props.i18n.t("registerNumber")}:</Text>
          <Text style={Styles.text}>{this.props.i18n.t("localCourt")}, HRB 30164</Text>
          <Text style={Styles.text}></Text>
          <TouchableOpacity onPress={() => Linking.openURL("https://seatsurfing.de/imprint.html")}><Text style={Styles.formButtom}>{this.props.i18n.t("moreInfo")}</Text></TouchableOpacity>
          <Text style={Styles.text}></Text>
          <TouchableOpacity onPress={() => Linking.openURL("https://seatsurfing.de/privacy.html")}><Text style={Styles.formButtom}>{this.props.i18n.t("privacy")}</Text></TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    )
  }
}

export default withTranslation()(About as any);
