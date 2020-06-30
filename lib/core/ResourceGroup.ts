import {FailedToCreateResourceGroupError} from "../errors/resource-group/FailedToCreateResourceGroupError";
import {Authenticator} from "../interfaces/Authenticator";
import {IoTHub} from "./IoTHub";
import {FailedToCreateIoTHubError} from "../errors/iot-hub/FailedToCreateIoTHubError";
import {ResourceGroupError} from "../errors/resource-group/ResourceGroupError";
import axios from "axios";
import {Requests} from "../services/Requests";


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
        const body = {
            location
        };

        const token = await this.auth.getTokenCached();

        const config = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            }
        };

        let response;

        try {
            response = await axios.put(`https://management.azure.com/subscriptions/${this.subscriptionId}/resourcegroups/${name}?api-version=2019-10-01`, body, config);
            if (response.status >= 200 && response.status < 300) {
                return new ResourceGroup(this.subscriptionId, this.auth, this.requests, name, true);
            } else {
                throw new FailedToCreateResourceGroupError(response.status, response.data.error.message);
            }
        } catch (e) {
            if (e instanceof ResourceGroupError) {
                throw e;
            }
            throw new FailedToCreateResourceGroupError(500, e.message);
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