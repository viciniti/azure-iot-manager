import axios from "axios";
import qs from "qs";
import {ClientConfig} from "../entities/ClientConfig";
import {Token} from "../entities/Token";
import {AuthenticationError} from "../errors/auth/AuthenticationError";


import {RequestType} from "../enums/RequestType";
import {ContentType} from "../enums/ContentType";

export class Requests {

    readonly config: ClientConfig;

    constructor(config: ClientConfig) {
        this.config = config;
    }

    /**
     * returns JWT token
     */
    public getClientToken = async (): Promise<Token> => {

        const body = {
            grant_type: 'client_credentials',
            client_id: this.config.clientId,
            client_secret: this.config.clientSecret,
            resource: 'https://management.azure.com'
        };

        const response = await this.makeRequest(
            RequestType.POST,
            ContentType.URLENCODED,
            `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/token`,
            body
        );

        if (response.status >= 200 && response.status < 300) {
            return new Token(response.data.access_token, response.data.expires_on);
        } else {
            throw new AuthenticationError(response.status, response.data.error, response.data.error_description);
        }
    }

    /**
     *
     * @param requestType - corresponding request Type
     * @param contentType - content type header
     * @param url - url of the request
     * @param body - body for the request
     * @param token - pass if required for the request
     */
    private makeRequest = async (requestType: RequestType, contentType: ContentType, url: string, body: any, token?: string): Promise<any> => {
        const requestFunction = axios[requestType];
        let config;

        if (token) {
            config = {
                headers: {
                    'Content-Type': contentType,
                    Authorization: `Bearer ${token}`
                }
            };
        } else {
            config = {
                headers: {
                    'Content-Type': contentType
                }
            }
        }

        // @ts-ignore
        return requestType === RequestType.GET ? await requestFunction(url, config) : await requestFunction(url, qs.stringify(body), config);
    }
}