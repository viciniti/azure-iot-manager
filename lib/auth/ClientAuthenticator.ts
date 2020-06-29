import {AuthenticationError} from "../errors/auth/AuthenticationError";
import {Token} from "../entities/Token";
import {Authenticator} from "../interfaces/Authenticator";
import {ClientConfig} from "../entities/ClientConfig";
import qs from "qs";
import axios from "axios";


export class ClientAuthenticator implements Authenticator {

    readonly config: ClientConfig;

    private token: Token | undefined;

    constructor(config: ClientConfig) {
        this.config = config;
    }

    /**
     * makes authorization request to Azure REST API
     */
    public getToken = async (): Promise<Token> => {
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
                return new Token(response.data.access_token, response.data.expires_on);
            } else {
                throw new AuthenticationError(response.status, response.data.error, response.data.error_description);
            }
        } catch (e) {
            if (e instanceof AuthenticationError) {
                throw e;
            }
            throw new AuthenticationError(500, e.message, 'something went wrong');
        }
    }

    /**
     * returns token, cached, if one is not expired
     */
    public getTokenCached = async (): Promise<string | undefined> => {
        if (!this.token || (this.token && this.isExpired())) {
            this.token = await this.getToken();
        }
        return this.token?.accessToken;
    }

    /**
     * checks if the token is expired or not
     */
    private isExpired = (): boolean => {
        return !!(this.token && this.token.expiresOn < Date.now() + 3000);
    }

}