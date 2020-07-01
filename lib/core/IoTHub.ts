import {Authenticator} from "../interfaces/Authenticator";
import {IoTHubError} from "../errors/iot-hub/IoTHubError";
import {FailedToCreateIoTHubError} from "../errors/iot-hub/FailedToCreateIoTHubError";
import {DPS} from "./DPS";
import {DPSError} from "../errors/dps/DPSError";
import {Requests} from "../services/Requests";
import {TierCode} from "../enums/TierCode";
import {LocationCode} from "../enums/LocationCode";


export class IoTHub {

    readonly auth: Authenticator;

    readonly requests: Requests;

    readonly subscriptionId: string;

    public name: string;

    readonly resourceGroupName: string | undefined;

    public connectionString: string | undefined;

    readonly isMirrored: boolean;

    /**
     * don't use constructor for getting an instance
     */
    constructor(subscriptionId: string, auth: Authenticator, requests: Requests, name?: string, isMirrored?: boolean, resourceGroupName?: string) {
        this.subscriptionId = subscriptionId;
        this.auth = auth;
        this.requests = requests;
        this.name = name || 'default';
        this.resourceGroupName = resourceGroupName;
        this.isMirrored = isMirrored || false;
    }

    /**
     *
     * use this factory, if you have existing iot-hub instance with associated resource group
     *
     * @param name
     * @param resourceGroupName
     */
    public initExisting = (name: string, resourceGroupName: string): IoTHub => {
        return new IoTHub(this.subscriptionId, this.auth, this.requests, name, true, resourceGroupName)
    }

    /**
     *
     * use this factory, if you have existing resource group and want to create iot-hub instance under it
     *
     * @param location
     * @param capacity
     * @param tier
     * @param name
     * @param resourceGroupName
     */
    public init = async (location: LocationCode, capacity: number, tier: TierCode, name: string, resourceGroupName: string): Promise<IoTHub> => {
        try {
            const token = await this.auth.getTokenCached();
            if (token) {
                await this.requests.createIoTHub(token, location, capacity, tier, name, resourceGroupName);
            } else {
                throw new FailedToCreateIoTHubError(401, `token-${token}`, 'no token received', resourceGroupName)
            }
            return new IoTHub(this.subscriptionId, this.auth, this.requests, name, true, resourceGroupName);
        } catch (e) {
            if (e instanceof IoTHubError) {
                throw e;
            }
            throw new FailedToCreateIoTHubError(500, e.message, this.name);
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
                    this.connectionString = await this.requests.getIoTHubConnectionString(token, this.resourceGroupName, this.name);
                } else {
                    throw new IoTHubError(401, `token-${token}`, 'no token received', this.resourceGroupName);

                }
                return this.connectionString;
            } catch (e) {
                if (e instanceof IoTHubError) {
                    throw e;
                }
                throw new IoTHubError(500, e.message, '', this.resourceGroupName);
            }
        } else {
            throw new IoTHubError(500, 'Please, make sure that IoT Hub instance exists', 'no instance', this.resourceGroupName);
        }
    }

    /**
     *
     * @param location - desired location
     * @param tier - tier for the DPS instance
     * @param capacity -device capacity
     * @param name - desired name
     */
    public createDPS = async (location: LocationCode, tier: TierCode, capacity: number, name: string): Promise<DPS> => {
        if (this.isMirrored && this.resourceGroupName && this.name && this.connectionString) {
            const dps = new DPS(this.subscriptionId, this.auth, this.requests);
            return dps.init(this.connectionString, location, tier, capacity, this.resourceGroupName, this.name, name);
        } else {
            if (!this.connectionString) {
                throw new DPSError(500, 'Please, generate connection string', 'missing IoTHub connection string', name, this.resourceGroupName, this.name);
            }
            throw new DPSError(500, 'Please, create IoT hub instance first', 'no IoT hub instance', name, this.resourceGroupName, this.name);
        }
    }
}