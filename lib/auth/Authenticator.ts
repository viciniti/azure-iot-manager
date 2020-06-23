import {Config} from "../config/Config";
import {AuthResponse} from "../response-types/AuthResponse";
import {AuthenticationError} from "../errors/auth/AuthenticationError";
import qs from "qs";
import axios from "axios";


export class Authenticator {

    private config: Config;

    constructor(config: Config) {
        this.config = config;
    }

    public getToken = async (): Promise<AuthResponse> => {
        const body = {
            grant_type: 'client_credentials',
            client_id: this.config.clientId,
            client_secret: this.config.clientSecret,
            resource: 'https://management.azure.com'
        };

        const config = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };

        try {
            const response = await axios.post(`https://login.microsoftonline.com/${this.config.tenantId}/oauth2/token`, qs.stringify(body), config);
            if (response.status >= 200 && response.status < 300) {
                return new AuthResponse(response.data.access_token, response.data.expires_in);
            } else {
                return new AuthResponse(null, null, new AuthenticationError(response.status, response.data.error.message));
            }
        }catch (e) {
            throw new AuthenticationError(500, e.message);
        }
    }

}