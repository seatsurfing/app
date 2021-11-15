import React from 'react';
import { View, Modal, Text, Button, Pressable } from 'react-native';
import { Styles } from '../types/Styles';

interface ModalDialogButton {
    label: string
    onPress: Function
}

interface Props {
    visible: boolean
    buttons?: ModalDialogButton[]
}

interface State {
}

export default class ModalDialog extends React.Component<Props, State> {
    render = () => {
        let buttons = <></>
        if (this.props.buttons && this.props.buttons.length > 0) {
            let numButtons = this.props.buttons.length;
            buttons = (
                <View style={Styles.mapOverlayFooter}>
                    {this.props.buttons.map((button, i) => (
                        <Pressable key={"modal-button-"+i} onPress={() => button.onPress()} style={[Styles.mapOverlayFooterButton, {borderRightWidth: (i+1 < numButtons ? 1 : 0), borderRightColor: "#555"}]}>
                            <Text style={Styles.mapOverlayFooterButtonText}>{button.label}</Text>
                        </Pressable>
                    ))}
                </View>
            );
        }
        return(
            <Modal transparent={true} animationType="fade" visible={this.props.visible}>
                <View style={Styles.mapOverlay}>
                    <View style={Styles.mapOverlayBox}>
                        <View style={Styles.mapOverlayContent}>
                            {this.props.children}
                        </View>
                        {buttons}
                    </View>
                </View>
            </Modal>
        );
    }
}
