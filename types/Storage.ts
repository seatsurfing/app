import * as SecureStore from 'expo-secure-store';

export default class Storage {
    static PROP_URL = "url";
    static PROP_JWT = "jwt";
    static PROP_LOCATION = "location";

    static async setURL(value: string): Promise<void> {
        return SecureStore.setItemAsync(Storage.PROP_URL, value);
    }

    static async getURL(): Promise<string | null> {
        return SecureStore.getItemAsync(Storage.PROP_URL);
    }

    static async deleteURL(): Promise<void> {
        return SecureStore.deleteItemAsync(Storage.PROP_URL);
    }

    static async setJWT(value: string): Promise<void> {
        return SecureStore.setItemAsync(Storage.PROP_JWT, value);
    }

    static async getJWT(): Promise<string | null> {
        return SecureStore.getItemAsync(Storage.PROP_JWT);
    }

    static async deleteJWT(): Promise<void> {
        return SecureStore.deleteItemAsync(Storage.PROP_JWT);
    }

    static async setLocation(value: string): Promise<void> {
        return SecureStore.setItemAsync(Storage.PROP_LOCATION, value);
    }

    static async getLocation(): Promise<string | null> {
        return SecureStore.getItemAsync(Storage.PROP_LOCATION);
    }

    static async deleteLocation(): Promise<void> {
        return SecureStore.deleteItemAsync(Storage.PROP_LOCATION);
    }
}