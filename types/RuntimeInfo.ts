import { Platform } from "react-native";

export default class RuntimeInfo {
    static isAndroid(): boolean {
        return (Platform.OS === "android");
    }

    static isIOS(): boolean {
        return (Platform.OS === "ios");
    }
}