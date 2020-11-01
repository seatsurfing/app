import React from 'react';
import { View, Modal } from 'react-native';
import { Styles } from '../types/Styles';

interface Props {
    visible: boolean
}

interface State {
}

export default class ModalDialog extends React.Component<Props, State> {
    render = () => {
        return(
            <Modal transparent={true} animationType="fade" visible={this.props.visible}>
                <View style={Styles.mapOverlay}>
                    <View style={Styles.mapOverlayBox}>
                        {this.props.children}
                    </View>
                </View>
            </Modal>
        );
    }
}
