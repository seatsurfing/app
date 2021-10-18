import * as SecureStore from 'expo-secure-store';

export default class Storage {
    static PROP_URL = "url";
    static PROP_ACCESS_TOKEN = "accessToken";
    static PROP_REFRESH_TOKEN = "refreshToken";
    static PROP_ACCESS_TOKEN_EXPIRY = "accessTokenExpiry";
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

    static async setAccessToken(value: string): Promise<void> {
        return SecureStore.setItemAsync(Storage.PROP_ACCESS_TOKEN, value);
    }

    static async getAccessToken(): Promise<string | null> {
        return SecureStore.getItemAsync(Storage.PROP_ACCESS_TOKEN);
    }

    static async deleteAccessToken(): Promise<void> {
        return SecureStore.deleteItemAsync(Storage.PROP_ACCESS_TOKEN);
    }

    static async setRefreshToken(value: string): Promise<void> {
        return SecureStore.setItemAsync(Storage.PROP_REFRESH_TOKEN, value);
    }

    static async getRefreshToken(): Promise<string | null> {
        return SecureStore.getItemAsync(Storage.PROP_REFRESH_TOKEN);
    }

    static async deleteRefreshToken(): Promise<void> {
        return SecureStore.deleteItemAsync(Storage.PROP_REFRESH_TOKEN);
    }

    static async setAccessTokenExpiry(value: Date): Promise<void> {
        return SecureStore.setItemAsync(Storage.PROP_ACCESS_TOKEN_EXPIRY, value.getTime().toString());
    }

    static async getAccessTokenExpiry(): Promise<Date> {
        return SecureStore.getItemAsync(Storage.PROP_ACCESS_TOKEN_EXPIRY).then(value => {
            if (!value) {
                value = "0";
            }
            return new Date(parseInt(value));
        });
    }

    static async deleteAccessTokenExpiry(): Promise<void> {
        return SecureStore.deleteItemAsync(Storage.PROP_ACCESS_TOKEN_EXPIRY);
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