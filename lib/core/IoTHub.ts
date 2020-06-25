import {Authenticator} from "../interfaces/Authenticator";
import axios from "axios";
import {IoTHubError} from "../errors/iot-hub/IoTHubError";
import {FailedToCreateIoTHubError} from "../errors/iot-hub/FailedToCreateIoTHubError";


export class IoTHub {

    readonly subscriptionId: string;

    readonly auth: Authenticator;

    readonly resourceGroupName: string | undefined;

    readonly isMirrored: boolean;

    public name : string | undefined;

    public connectionString: string | undefined;

    /**
     * don't use constructor for getting an instance
     */
    constructor(subscriptionId: string, auth: Authenticator, name?: string, isMirrored?: boolean, resourceGroupName?: string) {
        this.subscriptionId = subscriptionId;
        this.auth = auth;
        this.name = name;
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
        return new IoTHub(this.subscriptionId, this.auth, name, true, resourceGroupName)
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
        const body = {
            location,
            sku: {
                name: `${tier}-${name}`,
                tier,
                capacity
            }
        }

        const token = await this.auth.getTokenCached()

        const config = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            }
        }

        try {
                const response = await axios.put(`https://management.azure.com/subscriptions/${this.subscriptionId}/resourcegroups/${resourceGroupName}/providers/Microsoft.devices/IotHubs/${name}?api-version=2016-02-03`, body, config);
                if (response.status >= 200 && response.status < 300) {
                    return new IoTHub(this.subscriptionId, this.auth, name, true, resourceGroupName);
                } else {
                    throw new FailedToCreateIoTHubError(response.status, response.data.error.message, this.name);
                }
        } catch (e) {
            if (e instanceof IoTHubError){
                throw e;
            }
            throw new FailedToCreateIoTHubError(500, e.message, this.name);
        }
    }

    /**
     * receive iot-hub connection string
     */
    public generateConnectionString = async () => {
        const config = {
            headers: {
                'Content-Length': 0,
                Authorization: `Bearer ${await this.auth.getTokenCached()}`
            }
        };

        try {
            if(this.isMirrored) {
                const response = await axios.post(`https://management.azure.com/subscriptions/${this.subscriptionId}/resourceGroups/${this.resourceGroupName}/providers/Microsoft.Devices/IotHubs/${this.name}/IotHubKeys/iothubowner/listkeys?api-version=2018-04-01`, null, config);
                if (response.status >= 200 && response.status < 300) {
                    this.connectionString = `HostName=${this.name}.azure-devices.net;SharedAccessKeyName=iothubowner;SharedAccessKey=${response.data.primaryKey}`;
                } else {
                    throw new IoTHubError(response.status, response.data.error.message, this.resourceGroupName);
                }
            }else {
              throw new IoTHubError(500, 'Please, make sure that IoT Hub instance exists', this.resourceGroupName);
            }
        }catch (e) {
            if(e instanceof IoTHubError){
                throw e;
            }
            throw new IoTHubError(500, e.message, this.resourceGroupName);
        }
    }
}