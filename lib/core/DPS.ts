import axios from "axios";
import {Authenticator} from "../interfaces/Authenticator";
import {DPSError} from "../errors/dps/DPSError";
import {Requests} from "../services/Requests";
import {LocationCode} from "../enums/LocationCode";
import {TierCode} from "../enums/TierCode";


export class DPS {

    readonly auth: Authenticator;

    readonly requests: Requests;

    readonly subscriptionId: string;

    public name: string;

    readonly resourceGroupName: string | undefined;

    readonly iotHubName: string | undefined;

    public connectionString: string | undefined;

    public scopeId: string | undefined;

    readonly isMirrored: boolean;

    /**
     * don't use constructor for getting an instance
     */
    constructor(subscriptionId: string, auth: Authenticator, requests: Requests, resourceGroupName?: string, iotHubName?: string, isMirrored?: boolean, name?: string) {
        this.subscriptionId = subscriptionId;
        this.auth = auth;
        this.requests = requests;
        this.name = name || 'default';
        this.resourceGroupName = resourceGroupName;
        this.iotHubName = iotHubName;
        this.isMirrored = isMirrored || false;
    }

    /**
     *
     * use this factory, if you have existing dps instance with associated iot-hub and resource-group
     *
     * @param name
     * @param resourceGroupName
     */
    public initExisting = (name: string, resourceGroupName: string, iotHubName: string): DPS => {
        return new DPS(this.subscriptionId, this.auth, this.requests, resourceGroupName, iotHubName, true, name);
    }

    /**
     *
     * @param iotHubConnectionString
     * @param location
     * @param tier
     * @param capacity
     * @param resourceGroupName
     * @param iotHubName
     * @param name
     */
    public init = async (iotHubConnectionString: string, location: LocationCode, tier: TierCode, capacity: number, resourceGroupName: string, iotHubName: string, name: string): Promise<DPS> => {

        try {
            const token = await this.auth.getTokenCached();
            if (token) {
                await this.requests.createDPS(token, location, iotHubConnectionString, tier, capacity, resourceGroupName, name)
                return new DPS(this.subscriptionId, this.auth, this.requests, resourceGroupName, iotHubName, true, name);
            } else {
                throw new DPSError(400, `token-${token}`, 'no token received', name, resourceGroupName, iotHubName);
            }
        } catch (e) {
            if (e instanceof DPSError) {
                throw e;
            }
            throw new DPSError(500, e.message, '', resourceGroupName);
        }
    }

    /**
     * generates Scope Id, sets as instance property and returns as a response
     */
    public generateScopeId = async (): Promise<string | undefined> => {
        if (this.isMirrored) {
            try {
                const token = await this.auth.getTokenCached();
                if (token) {
                    // @ts-ignore
                    this.scopeId = await this.requests.getDPSScopeID(token, this.resourceGroupName, this.name);
                } else {
                    throw new DPSError(400, `token-${token}`, 'no token received', this.name, this.resourceGroupName, this.iotHubName);
                }
                return this.scopeId;
            } catch (e) {
                if (e instanceof DPSError) {
                    throw e
                }

                throw new DPSError(500, e.message, this.name, '', this.resourceGroupName, this.iotHubName);
            }
        } else {
            throw new DPSError(500, 'Please, create dps first', this.name, 'no dps instance', this.resourceGroupName, this.iotHubName);
        }


    }

    /**
     * generates connection string, sets as instance property and returns as a response
     */
    public generateConnectionString = async (): Promise<string | undefined> => {
        if (this.isMirrored) {
            try {
                const token = await this.auth.getTokenCached();
                if (token) {
                    // @ts-ignore
                    this.connectionString = await this.requests.getDPSConnectionString(token, this.resourceGroupName, this.name);
                } else {
                    throw new DPSError(400, `token-${token}`, 'no token received', this.name, this.resourceGroupName, this.iotHubName);
                }
                return this.connectionString;
            } catch (e) {
                if (e instanceof DPSError) {
                    throw e
                }
                throw new DPSError(500, e.message, this.name, '', this.resourceGroupName, this.iotHubName);
            }
        } else {
            throw new DPSError(500, 'Please, create dps instance first', 'no dps instance', this.name, this.resourceGroupName, this.iotHubName);
        }
    }
}