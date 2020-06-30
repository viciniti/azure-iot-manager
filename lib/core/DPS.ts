import {Authenticator} from "../interfaces/Authenticator";
import {DPSError} from "../errors/dps/DPSError";
import axios from "axios";
import {Requests} from "../services/Requests";


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

        const body = {
            location,
            type: 'Microsoft.Devices/ProvisioningServices',
            properties: {
                state: 'Active',
                iotHubs: [
                    {
                        connectionString: iotHubConnectionString,
                        location
                    }
                ],
                allocationPolicy: 'Hashed'
            },
            sku: {
                name: `${tier}-${name}`,
                tier,
                capacity
            }
        };

        const token = await this.auth.getTokenCached();

        const config = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            }
        };

        try {
            const response = await axios.put(`https://management.azure.com/subscriptions/${this.subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Devices/provisioningServices/${name}?api-version=2018-01-22`, body, config);
            if (response.status >= 200 && response.status < 300) {
                return new DPS(this.subscriptionId, this.auth, this.requests, resourceGroupName, iotHubName, true, name);
            } else {
                throw new DPSError(response.status, response.data.error.message, resourceGroupName)
            }
        } catch (e) {
            if (e instanceof DPSError) {
                throw e;
            }
            throw new DPSError(500, e.message, resourceGroupName);
        }
    }

    /**
     * generates Scope Id, sets as instance property and returns as a response
     */
    public generateScopeId = async (): Promise<string | undefined> => {
        if (this.isMirrored) {
            const token = await this.auth.getTokenCached();

            const config = {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };

            try {
                const response = await axios.get(`https://management.azure.com/subscriptions/${this.subscriptionId}/resourceGroups/${this.resourceGroupName}/providers/Microsoft.Devices/provisioningServices/${this.name}?api-version=2018-01-22`, config);
                if (response.status >= 200 && response.status < 300) {
                    this.scopeId = response.data.properties.idScope;
                    return this.scopeId;
                } else {
                    throw new DPSError(response.status, response.data.error.message, this.name, this.resourceGroupName, this.iotHubName);
                }
            } catch (e) {

                if (e instanceof DPSError) {
                    throw e
                }

                throw new DPSError(500, e.message, this.name, this.resourceGroupName, this.iotHubName);
            }


        } else {
            throw new DPSError(500, 'Please, create dps first', this.name, this.resourceGroupName, this.iotHubName);
        }


    }

    /**
     * generates connection string, sets as instance property and returns as a response
     */
    public generateConnectionString = async (): Promise<string | undefined> => {
        if (this.isMirrored) {

            const token = await this.auth.getTokenCached();

            const config = {
                headers: {
                    'Content-Length': 0,
                    Authorization: `Bearer ${token}`
                }
            };

            const response = await axios.post(`https://management.azure.com/subscriptions/${this.subscriptionId}/resourceGroups/${this.resourceGroupName}/providers/Microsoft.Devices/provisioningServices/${this.name}/keys/provisioningserviceowner/listkeys?api-version=2018-04-01`, null, config);
            if (response.status >= 200 && response.status < 300) {
                this.connectionString = `HostName=${this.name}.azure-devices-provisioning.net;SharedAccessKeyName=provisioningserviceowner;SharedAccessKey=${response.data.primaryKey}`;
                return this.connectionString;
            } else {
                throw new DPSError(response.status, response.data.error.message, this.name, this.resourceGroupName, this.iotHubName);
            }
        } else {
            throw new DPSError(500, 'Please, create dps instance first', this.name, this.resourceGroupName, this.iotHubName);
        }
    }
}