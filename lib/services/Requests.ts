import axios from "axios";
import qs from "qs";
import {ClientConfig} from "../entities/ClientConfig";
import {Token} from "../entities/Token";
import {RequestType} from "../enums/RequestType";
import {ContentType} from "../enums/ContentType";
import {AuthenticationError} from "../errors/auth/AuthenticationError";
import {FailedToCreateResourceGroupError} from "../errors/resource-group/FailedToCreateResourceGroupError";
import {LocationCode} from "../enums/LocationCode";
import {TierCode} from "../enums/TierCode";
import {FailedToCreateIoTHubError} from "../errors/iot-hub/FailedToCreateIoTHubError";
import {IoTHubError} from "../errors/iot-hub/IoTHubError";
import {DPSError} from "../errors/dps/DPSError";


export class Requests {

    readonly config: ClientConfig;

    constructor(config: ClientConfig) {
        this.config = config;
    }

    /**
     * returns JWT token
     */
    public getClientToken = async (): Promise<Token> => {

        const body = {
            grant_type: 'client_credentials',
            client_id: this.config.clientId,
            client_secret: this.config.clientSecret,
            resource: 'https://management.azure.com'
        };

        const response = await this.makeRequest(
            RequestType.POST,
            ContentType.URLENCODED,
            `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/token`,
            qs.stringify(body)
        );

        if (response.status >= 200 && response.status < 300) {
            return new Token(response.data.access_token, response.data.expires_on);
        } else {
            throw new AuthenticationError(response.status, response.data.error, response.data.error_description);
        }
    }

    /**
     *
     * @param token - client jwt token
     * @param location - resource group location
     * @param name - resource group name
     */
    public createResourceGroup = async (token: string, location: LocationCode, name: string): Promise<any> => {

        const body = {
            location
        };

        const response = await this.makeRequest(
            RequestType.PUT,
            ContentType.JSON,
            `https://management.azure.com/subscriptions/${this.config.subscriptionId}/resourcegroups/${name}?api-version=2019-10-01`,
            body,
            token
        );

        if (response.status >= 200 && response.status < 300) {
            return response.data;
        } else {
            throw new FailedToCreateResourceGroupError(response.status, response.data.error.code, response.data.error.message);
        }
    }

    /**
     *
     * @param token - client jwt token
     * @param location - hub location
     * @param capacity - hub capacity
     * @param tier - hub tier
     * @param name - hub name
     * @param resourceGroupName - associated resource group name
     */
    public createIoTHub = async (token: string, location: LocationCode, capacity: number, tier: TierCode, name: string, resourceGroupName: string): Promise<any> => {

        const body = {
            location,
            sku: {
                name: `${tier}`,
                tier,
                capacity
            }
        };

        const response = await this.makeRequest(
            RequestType.PUT,
            ContentType.JSON,
            `https://management.azure.com/subscriptions/${this.config.subscriptionId}/resourcegroups/${resourceGroupName}/providers/Microsoft.devices/IotHubs/${name}?api-version=2016-02-03`,
            body,
            token
        )

        if (response.status >= 200 && response.status < 300) {
            return response.data;
        } else {
            // as you noticed, Code and Message attributes are capitalized as responses returned from Microsoft.devices have capitalized keys (which is not the case for the rest of resources :) )
            throw new FailedToCreateIoTHubError(response.status, response.data.Code, response.data.Message, resourceGroupName);
        }
    }

    /**
     *
     * @param token - client jwt token
     * @param resourceGroupName - associated resource group name
     * @param iotHubName - hub name
     */
    public getIoTHubConnectionString = async (token: string, resourceGroupName: string, iotHubName: string): Promise<string> => {

        const response = await this.makeRequest(
            RequestType.POST,
            ContentType.EMPTY,
            `https://management.azure.com/subscriptions/${this.config.subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Devices/IotHubs/${iotHubName}/IotHubKeys/iothubowner/listkeys?api-version=2018-04-01`,
            null,
            token
        )

        if (response.status >= 200 && response.status < 300) {
            return `HostName=${iotHubName}.azure-devices.net;SharedAccessKeyName=iothubowner;SharedAccessKey=${response.data.primaryKey}`;
        } else {
            throw new IoTHubError(response.status, response.data.error.code, response.data.error.message, resourceGroupName);
        }
    }

    /**
     *
     * @param token - client jwt token
     * @param location - desired location code
     * @param iotHubConnectionString - iot hub connection string
     * @param tier - tier
     * @param capacity - dps capacity
     * @param resourceGroupName - associated resource group name
     * @param name - name for the dps
     */
    public createDPS = async (token: string, location: LocationCode, iotHubConnectionString: string, tier: TierCode, capacity: number, resourceGroupName: string, name: string): Promise<any> => {

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
                name: `${tier}`,
                tier,
                capacity
            }
        }

        const response = await this.makeRequest(
            RequestType.PUT,
            ContentType.JSON,
            `https://management.azure.com/subscriptions/${this.config.subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Devices/provisioningServices/${name}?api-version=2018-01-22`,
            body,
            token
        )
        if (response.status >= 200 && response.status < 300) {
            return response.data;
        } else {
            throw new DPSError(response.status, response.data.httpStatusCode, response.data.message, name, resourceGroupName, iotHubConnectionString.substr(8, iotHubConnectionString.length - 101));
        }
    }

    /**
     *
     * @param token - client jwt token
     * @param resourceGroupName - resource group name
     * @param dpsName - dps instance name
     */
    public getDPSScopeID = async (token: string, resourceGroupName: string, dpsName: string): Promise<string> => {

        const response = await this.makeRequest(
            RequestType.GET,
            ContentType.JSON,
            `https://management.azure.com/subscriptions/${this.config.subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Devices/provisioningServices/${dpsName}?api-version=2018-01-22`,
            null,
            token
        )
        if (response.status >= 200 && response.status < 300) {
            return response.data.properties.idScope;
        } else {
            throw new DPSError(response.status, response.data.error.code, response.data.error.message, dpsName, resourceGroupName, '');
        }
    }

    /**
     *
     * @param token - client jwt token
     * @param resourceGroupName - associated resource group name
     * @param dpsName - dps instance name
     */
    public getDPSConnectionString = async (token: string, resourceGroupName: string, dpsName: string): Promise<string> => {

        const response = await this.makeRequest(
            RequestType.POST,
            ContentType.EMPTY,
            `https://management.azure.com/subscriptions/${this.config.subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Devices/provisioningServices/${dpsName}/keys/provisioningserviceowner/listkeys?api-version=2018-01-22`,
            null,
            token
        )

        if (response.status >= 200 && response.status < 300) {
            return `HostName=${dpsName}.azure-devices-provisioning.net;SharedAccessKeyName=provisioningserviceowner;SharedAccessKey=${response.data.primaryKey}`
        } else {
            throw new DPSError(response.status, response.data.httpStatusCode, response.data.message, dpsName, resourceGroupName, '')
        }
    }


    /**
     *
     * @param requestType - corresponding request Type
     * @param contentType - content type header
     * @param url - url of the request
     * @param body - body for the request
     * @param token - pass if required for the request
     */
    private makeRequest = async (requestType: RequestType, contentType: ContentType, url: string, body: any, token?: string): Promise<any> => {
        const requestFunction = axios[requestType];
        let config;

        if (body === null) {
            config = {
                headers: {
                    'Content-Length': 0,
                    Authorization: `Bearer ${token}`
                }
            };
            if (requestType === RequestType.GET) {
                config = {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            }
        } else if (token) {
            config = {
                headers: {
                    'Content-Type': contentType,
                    Authorization: `Bearer ${token}`
                }
            };
        } else {
            config = {
                headers: {
                    'Content-Type': contentType
                }
            }
        }
        // @ts-ignore
        return requestType === RequestType.GET ? await requestFunction(url, config) : await requestFunction(url, body, config);
    }
}