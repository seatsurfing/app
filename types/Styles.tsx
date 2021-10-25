import { StyleSheet } from "react-native";

export const PrimaryTextSize = 17;
export const SecondaryTextSize = 15;
export const CaptionTextSize = 13;
export const ColorBlue = "rgb(10, 132, 255)";

export const Styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
    },
    containerWithHeader: {
      backgroundColor: ColorBlue,
      flex: 1
    },
    scrollViewCenter: {
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 25,
      flexGrow: 1
    },
    growMax: {
      flexGrow: 1
    },
    containerCenter: {
      flex: 1,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 25
    },
    text: {
      fontSize: PrimaryTextSize,
    },
    textWithTopMargin: {
      fontSize: PrimaryTextSize,
      marginTop: 10,
    },
    header: {
      backgroundColor: ColorBlue,
      height: 75,
      width: "100%",
    },
    headerText: {
      color: "#fff",
      fontSize: 26,
      fontWeight: "bold",
      paddingLeft: 25,
      paddingTop: 20
    },
    subject: {
      fontSize: PrimaryTextSize,
      fontWeight: "bold"
    },
    content: {
      fontSize: SecondaryTextSize,
    },
    subContent: {
      fontSize: SecondaryTextSize,
      color: "gray"
    },
    textInput: {
      fontSize: PrimaryTextSize,
      flex: 1,
      marginRight: 20
    },
    successIcon: {
      fontSize: 70,
      color: "green",
      fontWeight: "bold",
      textAlign: "center"
    },
    errorIcon: {
      fontSize: 70,
      color: "red",
      fontWeight: "bold",
      textAlign: "center"
    },
    switch: {
      position: "absolute",
      right: 20,
      marginTop: -5
    },
    picker: {
      backgroundColor: "red",
      width: 50,
      height: 50
    },
    list: {
      flex: 1,
      paddingLeft: 25,
      paddingRight: 25,
      backgroundColor: "white"
    },
    listItem: {
      borderBottomWidth: 1,
      borderBottomColor: "gray",
      paddingTop: 10,
      paddingBottom: 10
    },
    section: {
      backgroundColor: '#fff',
      borderTopColor: "silver",
      borderTopWidth: 1,
      borderBottomColor: "silver",
      borderBottomWidth: 1,
      paddingLeft: 25,
      alignItems: "flex-start",
    },
    sectionHeader: {
      color: "gray",
      marginLeft: 25,
      marginTop: 25,
      marginBottom: 5,
      fontSize: CaptionTextSize
    },
    tableRow: {
      flexDirection: "row",
      width: "100%",
      marginTop: 15,
      marginBottom: 15
    },
    textTableValue: {
      position: "absolute",
      right: 25,
      fontSize: PrimaryTextSize,
      color: "gray",
      overflow: "hidden",
      maxWidth: 250
    },
    horizontalLine: {
      height: 1,
      backgroundColor: "silver",
      width: "100%"
    },
    grayLink: {
      fontSize: PrimaryTextSize,
      color: "#555"
    },
    formButtom: {
      fontSize: PrimaryTextSize,
      color: ColorBlue
    },
    formButtomWarning: {
      fontSize: PrimaryTextSize,
      color: "red"
    },
    formButtomDisabled: {
      fontSize: PrimaryTextSize,
      color: "gray"
    },
    activityIndicator: {
      marginTop: 50
    },
    mapImg: {
      flex: 1,
      resizeMode: "cover",
    },
    mapOverlay: {
      backgroundColor: "#000000cc",
      justifyContent: "center",
      alignItems: "center",
      flex: 1
    },
    mapOverlayBox: {
      backgroundColor: "#eee",
      borderRadius: 20,
      borderWidth: 1,
      borderColor: "gray",
      width: "80%",
      maxWidth: 300,
    },
    mapOverlayContent: {
      padding: 25
    },
    mapOverlayFooter: {
      flexDirection: "row",
      height: 50,
      borderTopWidth: 1,
      borderTopColor: "#555",
    },
    mapOverlayFooterButton: {
      flex: 1,
    },
    mapOverlayFooterButtonText: {
      textAlign: "center",
      fontSize: PrimaryTextSize,
      fontWeight: "bold",
      paddingTop: 12,
      height: "100%",
    }
  });