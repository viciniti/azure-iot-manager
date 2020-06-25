import axios from "axios";
import {FailedToCreateResourceGroupError} from "../errors/resource-group/FailedToCreateResourceGroupError";
import {Authenticator} from "../interfaces/Authenticator";
import {IoTHub} from "./IoTHub";
import {FailedToCreateIoTHubError} from "../errors/iot-hub/FailedToCreateIoTHubError";
import {IoTHubError} from "../errors/iot-hub/IoTHubError";
import {ResourceGroupError} from "../errors/resource-group/ResourceGroupError";

export class ResourceGroup {

    readonly subscriptionId: string;

    readonly auth : Authenticator;

    public name : string | undefined;

    private isMirrored: boolean


    /**
     * don't use this constructor, get ResourceGroup instance through init function
     */
    constructor(subscriptionId: string, auth: Authenticator, name?: string, isMirrored?: boolean) {
        this.subscriptionId = subscriptionId;
        this.auth = auth;
        this.name = name;
        this.isMirrored = isMirrored || false;
    }

    /**
     *
     * @param location - code for desired location
     * @param name - name for the resource group
     * @returns new ResourceGroup instance
     */
    public init = async (location: LocationCode, name: string): Promise<ResourceGroup> => {
        const body = {
            location
        };

        const config = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${await this.auth.getTokenCached()}`
            }
        };

        let response;
        try {
            response = await axios.put(`https://management.azure.com/subscriptions/${this.subscriptionId}/resourcegroups/${name}?api-version=2019-10-01`, body, config);
            if (response.status >= 200 && response.status < 300) {
                return new ResourceGroup(this.subscriptionId, this.auth, name, true);
            } else {
                throw new FailedToCreateResourceGroupError(response.status, response.data.error.message);
            }
        } catch (e) {
            if(e instanceof  ResourceGroupError){
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
        const body = {
            location,
            sku: {
                name: `${tier}-${name}`,
                tier,
                capacity
            }
        }

        const config = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${await this.auth.getTokenCached()}`
            }
        }

        try {
            if(this.isMirrored) {
                const response = await axios.put(`https://management.azure.com/subscriptions/${this.subscriptionId}/resourcegroups/${this.name}/providers/Microsoft.devices/IotHubs/${name}?api-version=2016-02-03`, body, config);
                if (response.status >= 200 && response.status < 300) {
                    return new IoTHub(this.subscriptionId, this.auth, name, true);
                } else {
                    throw new FailedToCreateIoTHubError(response.status, response.data.error.message, this.name);
                }
            }else {
                throw new FailedToCreateIoTHubError(500, 'Please, init resource group first', this.name);
            }
        } catch (e) {
            if (e instanceof IoTHubError){
                throw e;
            }
            throw new FailedToCreateIoTHubError(500, e.message, this.name);
        }
    }


}