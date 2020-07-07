import {AuthenticationError} from "../errors/auth/AuthenticationError";
import {Token} from "../entities/Token";
import {Authenticator} from "../interfaces/Authenticator";
import {Requests} from "../services/Requests";


export class ClientAuthenticator implements Authenticator {

    private token: Token | undefined;

    readonly requests: Requests;

    constructor(requests: Requests) {
        this.requests = requests;
    }

    /**
     * makes authorization request to Azure REST API
     */
    public getToken = async (): Promise<Token> => {
        try {
            return await this.requests.getClientToken();
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
        if (!this.token || this.isExpired()) {
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