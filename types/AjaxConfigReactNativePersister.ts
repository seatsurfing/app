import { AjaxConfigPersister, AjaxCredentials } from "../commons";
import Storage from "./Storage";

export default class AjaxConfigReactNativePersister implements AjaxConfigPersister {
    async persistRefreshTokenInLocalStorage(c: AjaxCredentials): Promise<void> {
        return new Promise<void>(function (resolve, reject) {
            Storage.setRefreshToken(c.refreshToken).then(() => {
                resolve();
            });
        });
    }

    async readRefreshTokenFromLocalStorage(): Promise<AjaxCredentials> {
        return new Promise<AjaxCredentials>(function (resolve, reject) {
            let c: AjaxCredentials = new AjaxCredentials();
            Storage.getRefreshToken().then(value => {
                if (!value) {
                    value = "";
                }
                c.refreshToken = value;
                resolve(c);
            });
        });
    }

    async updateCredentialsSessionStorage(c: AjaxCredentials): Promise<void> {
        return new Promise<void>(function (resolve, reject) {
            let promises = [
                Storage.setAccessToken(c.accessToken),
                Storage.setRefreshToken(c.refreshToken),
                Storage.setAccessTokenExpiry(c.accessTokenExpiry),
            ];
            Promise.all(promises).then(() => {
                resolve();
            });
        });
    }

    async readCredentialsFromSessionStorage(): Promise<AjaxCredentials> {
        return new Promise<AjaxCredentials>(function (resolve, reject) {
            let c: AjaxCredentials = new AjaxCredentials();
            let promises: Promise<any>[] = [
                Storage.getAccessToken(),
                Storage.getRefreshToken(),
                Storage.getAccessTokenExpiry(),
            ];
            Promise.all(promises).then(values => {
                if (values[0] && values[1] && values[2]) {
                    c = {
                        accessToken: values[0],
                        refreshToken: values[1],
                        accessTokenExpiry: values[2]
                    };
                }
                resolve(c);
            });
        });
    }

    async deleteCredentialsFromSessionStorage(): Promise<void> {
        return new Promise<void>(function (resolve, reject) {
            let promises = [
                Storage.deleteAccessToken(),
                Storage.deleteRefreshToken(),
                Storage.deleteAccessTokenExpiry(),
            ];
            Promise.all(promises).then(() => {
                resolve();
            });
        });
    }
}
