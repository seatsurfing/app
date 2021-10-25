import React from 'react';
import { Text, SafeAreaView, TouchableOpacity, ActivityIndicator, Button, View, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Styles } from '../types/Styles';
import { FlatList } from 'react-native-gesture-handler';
import { Booking } from '../commons';
import { Formatting } from '../commons';
import ModalDialog from './ModalDialog';
import { withTranslation } from 'react-i18next';
import { i18n } from 'i18next';

interface Props {
  navigation: StackNavigationProp<RootStackParamList>
  i18n: i18n
}

interface State {
  loading: boolean
  selectedItem: Booking | null
  cancelled: boolean
}

class MyBookings extends React.Component<Props, State> {
  data: Booking[];

  constructor(props: Props) {
    super(props);
    this.data = [];
    this.state = {
      loading: true,
      selectedItem: null,
      cancelled: false
    };
    this.loadResult();
  }

  loadResult = () => {
    Booking.list().then(list => {
      this.data = list;
      this.setState({ loading: false });
    });
  }

  onItemPress = (item: Booking) => {
    this.setState({ selectedItem: item });
  }

  cancelBooking = (item: Booking) => {
    this.setState({
      loading: true
    });
    this.state.selectedItem?.delete().then(() => {
      this.setState({
        selectedItem: null,
      });
      this.loadResult();
    });
  }

  renderItem = (item: Booking) => {
    return (
      <TouchableOpacity style={Styles.listItem} onPress={() => this.onItemPress(item)}>
        <Text style={Styles.subject}>{Formatting.getDateOffsetText(item.enter, item.leave)}</Text>
        <Text style={Styles.content}>{item.space.location.name}, {item.space.name}</Text>
        <Text style={Styles.subContent}>{this.props.i18n.t("enter")}: {Formatting.getFormatter().format(item.enter)}</Text>
        <Text style={Styles.subContent}>{this.props.i18n.t("leave")}: {Formatting.getFormatter().format(item.leave)}</Text>
      </TouchableOpacity>
    );
  }

  render = () => {
    const style = StyleSheet.create({
      button: {
        marginTop: 15
      }
    });

    let loadingIndicator;
    let infoModal;
    let list;
    if (this.state.loading) {
      loadingIndicator = <ActivityIndicator size="large" style={Styles.activityIndicator} />;
    }
    if (this.state.selectedItem) {
      let buttons = [
        { label: this.props.i18n.t("delete"), onPress: () => { this.state.selectedItem ? this.cancelBooking(this.state.selectedItem) : {} } },
        { label: this.props.i18n.t("ok"), onPress: () => this.setState({ selectedItem: null }) },
      ];
      infoModal = (
        <ModalDialog visible={this.state.selectedItem != null} buttons={buttons}>
          <Text style={Styles.text}>{this.props.i18n.t("space")}: {this.state.selectedItem.space.name}</Text>
          <Text style={Styles.text}>{this.props.i18n.t("area")}: {this.state.selectedItem.space.location.name}</Text>
          <Text style={Styles.text}>{this.props.i18n.t("enter")}: {Formatting.getFormatterShort().format(new Date(this.state.selectedItem.enter))}</Text>
          <Text style={Styles.text}>{this.props.i18n.t("leave")}: {Formatting.getFormatterShort().format(new Date(this.state.selectedItem.leave))}</Text>
        </ModalDialog>
      );
    }
    if (!this.state.loading) {
      if (this.data.length > 0) {
        list = <FlatList data={this.data} renderItem={({ item }) => this.renderItem(item)} keyExtractor={item => item.id} style={Styles.list} />;
      } else {
        list = <View style={Styles.containerCenter}><Text style={Styles.text}>{this.props.i18n.t("noBookings")}</Text></View>;
      }
    }
    return (
      <SafeAreaView style={Styles.container}>
        {loadingIndicator}
        {infoModal}
        {list}
      </SafeAreaView>
    );
  }
}

export default withTranslation()(MyBookings as any);
