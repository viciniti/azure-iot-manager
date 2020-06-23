import {Config} from "../types/Config";
import {AuthResponse} from "../response-types/AuthResponse";
import {AuthenticationError} from "../errors/auth/AuthenticationError";
import {Token} from "../types/Token";
import qs from "qs";
import axios from "axios";


export class Authenticator {

    private config: Config;

    private token: Token | undefined;

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
                return new AuthResponse(new Token(response.data.access_token, Date.now() +  response.data.expires_in));
            } else {
                return new AuthResponse(undefined, new AuthenticationError(response.status, response.data.error.message));
            }
        }catch (e) {
            throw new AuthenticationError(500, e.message);
        }
    }

    public getTokenCached = async (): Promise<string | undefined> => {
          if(!this.token || (this.token && this.isExpired())) {
               const authResponse = await this.getToken();
               if(authResponse.success){
                   this.token = authResponse.token;
               }else {
                   // @ts-ignore
                   throw new AuthenticationError(500, authResponse.error.message);
               }
          }
        return this.token?.accessToken;
    }

    private isExpired = () : boolean => {
        return !!(this.token && this.token.expiresOn < Date.now() + 3000);
    }

}