export default class JwtDecoder {
    static getPayload(jwt: string): any {
        let tokens = jwt.split(".");
        if (tokens.length != 3) {
            return null;
        }
        let payload = window.atob(tokens[1]);
        let json = JSON.parse(payload);
        return json;
    }
}
