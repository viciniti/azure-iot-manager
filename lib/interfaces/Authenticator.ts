import {Config} from "../entities/Config";
import {AuthResponse} from "../responses/AuthResponse";

export interface Authenticator {
    config: Config
    getToken: () => Promise<AuthResponse>
    getTokenCached: () => Promise<string|undefined>
}