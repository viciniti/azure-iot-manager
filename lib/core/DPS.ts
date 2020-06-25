import {Authenticator} from "../interfaces/Authenticator";
import axios from "axios";
import {DPSError} from "../errors/dps/DPSError";

export class DPS {

    readonly subscriptionId: string;

    readonly auth: Authenticator;

    readonly resourceGroupName: string | undefined;

    readonly iotHubName: string | undefined;

    readonly isMirrored: boolean;

    public name: string | undefined;

    private connectionString: string | undefined;

    /**
     * don't use constructor for getting an instance
     */
    constructor(subscriptionId: string, auth: Authenticator, resourceGroupName?: string, iotHubName?: string, isMirrored?: boolean, name?: string) {
        this.subscriptionId = subscriptionId;
        this.auth = auth;
        this.name = name;
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
        return new DPS(this.subscriptionId, this.auth, resourceGroupName, iotHubName, true, name);
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
                return new DPS(this.subscriptionId, this.auth, resourceGroupName, iotHubName, true,  name);
            }else {
                throw new DPSError(response.status, response.data.error.message, resourceGroupName)
            }
        }catch (e) {
            throw new DPSError(500, e.message, resourceGroupName);
        }
    }
}