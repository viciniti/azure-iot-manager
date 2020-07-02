import {FailedToCreateResourceGroupError} from "../errors/resource-group/FailedToCreateResourceGroupError";
import {Authenticator} from "../interfaces/Authenticator";
import {IoTHub} from "./IoTHub";
import {FailedToCreateIoTHubError} from "../errors/iot-hub/FailedToCreateIoTHubError";
import {ResourceGroupError} from "../errors/resource-group/ResourceGroupError";
import {Requests} from "../services/Requests";
import {TierCode} from "../enums/TierCode";
import {LocationCode} from "../enums/LocationCode";


export class ResourceGroup {

    readonly auth: Authenticator;

    readonly requests: Requests;

    readonly subscriptionId: string;

    public name: string;

    readonly isMirrored: boolean

    /**
     * don't use constructor for getting an instance
     */
    constructor(subscriptionId: string, auth: Authenticator, requests: Requests, name?: string, isMirrored?: boolean) {
        this.subscriptionId = subscriptionId;
        this.auth = auth;
        this.requests = requests;
        this.name = name || 'default';
        this.isMirrored = isMirrored || false;
    }

    /**
     *
     * use this factory, if you have existing resource group
     *
     * @param name
     */
    public initExisting = (name: string): ResourceGroup => {
        return new ResourceGroup(this.subscriptionId, this.auth, this.requests, name, true)
    }

    /**
     *
     * use this factory for creating new resource group
     *
     * @param location - code for desired location
     * @param name - name for the resource group
     * @returns new ResourceGroup instance
     */
    public init = async (location: LocationCode, name: string): Promise<ResourceGroup> => {
        try {
            const token = await this.auth.getTokenCached();

            if (token) {
                await this.requests.createResourceGroup(token, location, name);
            } else {
                throw new FailedToCreateResourceGroupError(401, `token-${token}`, 'no token received');
            }
            return new ResourceGroup(this.subscriptionId, this.auth, this.requests, name, true);
        } catch (e) {
            console.log(e);
            if (e instanceof ResourceGroupError) {
                throw e;
            }
            throw new FailedToCreateResourceGroupError(500, e.message, '');
        }
    }

    /**
     *
     * @param location - code for desired location
     * @param capacity - iot-hub capacity
     * @param tier - iot-hub tier
     * @param name - iot-hub name
     */
    public createIoTHub = async (location: LocationCode, capacity: number, tier: TierCode, name: string): Promise<IoTHub> => {
        if (this.isMirrored && this.name) {
            const iotHub = new IoTHub(this.subscriptionId, this.auth, this.requests);
            return iotHub.init(location, capacity, tier, name, this.name);
        } else {
            throw  new FailedToCreateIoTHubError(500, 'Please create resource group first', '');
        }
    }
}