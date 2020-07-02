import * as faker from 'faker';
import sinon from 'sinon';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import axios from "axios";
import qs from "qs";


import {Token} from "../../lib/entities/Token";
import {ClientConfig} from "../../lib/entities/ClientConfig";
import {AuthenticationError} from "../../lib/errors/auth/AuthenticationError";
import {Requests} from "../../lib/services/Requests";
import {ContentType} from "../../lib/enums/ContentType";
import {LocationCode} from "../../lib/enums/LocationCode";
import {ResourceGroupError} from "../../lib/errors/resource-group/ResourceGroupError";
import {TierCode} from "../../lib/enums/TierCode";
import {IoTHubError} from "../../lib/errors/iot-hub/IoTHubError";
import {DPSError} from "../../lib/errors/dps/DPSError";

const expect = chai.expect
chai.use(chaiAsPromised)

describe('requests test', () => {

    const accessToken = faker.random.alphaNumeric(100);
    const expiresOn = Date.now() + 3599 * 1000;

    const expectedResponse = new Token(accessToken, expiresOn);
    const clientConfig = new ClientConfig(faker.random.uuid(), faker.random.uuid(), faker.random.uuid(), faker.random.alphaNumeric(10));

    const serverResponse = {
        data: {
            token_type: 'Bearer',
            expires_in: '3599',
            ext_expires_in: '3599',
            expires_on: expiresOn,
            not_before: faker.date.future(),
            resource: 'https://management.azure.com',
            access_token: accessToken
        },
        status: 200
    }

    const body = {
        grant_type: 'client_credentials',
        client_id: clientConfig.clientId,
        client_secret: clientConfig.clientSecret,
        resource: 'https://management.azure.com'
    };

    const url = `https://login.microsoftonline.com/${clientConfig.tenantId}/oauth2/token`;

    it('get token', async () => {
        sinon.restore();
        sinon.stub(axios, 'post').withArgs(sinon.match(url), sinon.match(qs.stringify(body)), sinon.match.any).resolves(Promise.resolve(serverResponse));
        const request = new Requests(clientConfig);
        const tokenResponse = await request.getClientToken();
        expect(tokenResponse).to.eql(expectedResponse);
    });

    const wrongClientConfig = new ClientConfig(faker.random.uuid(), faker.random.uuid(), faker.random.uuid(), faker.random.alphaNumeric(10));

    const serverErrorResponse = {
        data: {
            error: 'unauthorized_client',
            error_description: faker.random.alphaNumeric(50),
            error_codes: [700016],
            timestamp: faker.date.past().toUTCString(),
            trace_id: faker.random.uuid,
            correlation_id: faker.random.uuid
        },
        status: 400
    }

    const wrongBody = {
        grant_type: 'client_credentials',
        client_id: wrongClientConfig.clientId,
        client_secret: wrongClientConfig.clientSecret,
        resource: 'https://management.azure.com'
    };

    const wrongUrl = `https://login.microsoftonline.com/${wrongClientConfig.tenantId}/oauth2/token`;

    it('get token errored', async () => {
        sinon.restore();
        sinon.stub(axios, 'post').withArgs(sinon.match(wrongUrl), sinon.match(qs.stringify(wrongBody)), sinon.match.any).resolves(Promise.resolve(serverErrorResponse));
        const request = new Requests(wrongClientConfig);
        expect(request.getClientToken()).to.eventually.be.rejectedWith('unauthorized_client').and.be.instanceOf(AuthenticationError).then((error) => {
            expect(error).to.have.property('description', serverErrorResponse.data.error_description);
            expect(error).to.have.property('code', 400);
        });
    });

    const resourceGroupURL = `https://management.azure.com/subscriptions/${clientConfig.subscriptionId}/resourcegroups/testGroup?api-version=2019-10-01`;

    const resourceGroupBody = {
        location: LocationCode.Central_India
    }

    const resourceGroupResponse = {
        data: {
            id: faker.random.uuid(),
            name: 'testGroup',
            type: 'Microsoft.Resources/resourceGroups',
            location: LocationCode.Central_India,
            properties: {
                provisioningState: 'Succeeded'
            }
        },
        status: 201
    }

    const requestConfig = {
        headers: {
            'Content-Type': ContentType.JSON,
            Authorization: `Bearer ${accessToken}`
        }
    }

    it('create resource group', async () => {
        sinon.restore();
        sinon.stub(axios, 'put').withArgs(sinon.match(resourceGroupURL), sinon.match(qs.stringify(resourceGroupBody)), sinon.match(requestConfig)).resolves(Promise.resolve(resourceGroupResponse));
        const request = new Requests(clientConfig);
        const response = await request.createResourceGroup(accessToken, LocationCode.Central_India, 'testGroup');
        expect(response).to.eql(resourceGroupResponse.data);
    })

    const wrongResourceGroupURL = `https://management.azure.com/subscriptions/${wrongClientConfig.subscriptionId}/resourcegroups/testGroup?api-version=2019-10-01`;

    const erroredResourceGroupResponse = {
        data: {
            error: {
                code: 'SubscriptionNotFound',
                message: `The subscription '${wrongClientConfig.subscriptionId}' could not be found.`
            }
        },
        status: 404
    }

    it('create resource group errored', async () => {
        sinon.restore();
        sinon.stub(axios, 'put').withArgs(sinon.match(wrongResourceGroupURL), sinon.match(qs.stringify(resourceGroupBody)), sinon.match(requestConfig)).resolves(Promise.resolve(erroredResourceGroupResponse))
        const request = new Requests(wrongClientConfig);
        expect(request.createResourceGroup(accessToken, LocationCode.Central_India, 'testGroup')).to.eventually.be.rejectedWith('SubscriptionNotFound').and.be.instanceOf(ResourceGroupError).then((error) => {
            expect(error).to.have.property('description', erroredResourceGroupResponse.data.error.message);
            expect(error).to.have.property('code', 404);
        });
    });

    const createHubUrl = `https://management.azure.com/subscriptions/${clientConfig.subscriptionId}/resourcegroups/testGroup/providers/Microsoft.devices/IotHubs/testHub?api-version=2016-02-03`

    const hubResponse = {
        data: {
            id: faker.random.uuid(),
            name: 'testHub',
            type: 'Microsoft.Resources/resourceGroups',
            location: LocationCode.Central_India,
            properties: {
                provisioningState: 'Succeeded'
            }
        },
        status: 200
    }

    const hubBody = {
        location: LocationCode.Central_India,
        sku: {
            name: `${TierCode.Free}-${'testHub'}`,
            tier: TierCode.Free,
            capacity: 1
        }
    }

    it('create iot hub', async () => {
        sinon.restore();
        sinon.stub(axios, 'put').withArgs(sinon.match(createHubUrl), sinon.match(qs.stringify(hubBody)), sinon.match(requestConfig)).resolves(Promise.resolve(hubResponse));
        const request = new Requests(clientConfig);
        const response = await request.createIoTHub(accessToken, LocationCode.Central_India, 1, TierCode.Free, 'testHub', 'testGroup');
        expect(response).to.eql(hubResponse.data);
    });

    const erroredHubResponse = {
        data: {
            Code: 'ProvisionedUnitsOutOfRange',
            HttpStatusCode: 'BadRequest',
            Message: faker.random.alphaNumeric(50)
        },
        status: 400
    }

    // free tier support capacity 1 only
    const erroredBody = {
        location: LocationCode.Central_India,
        sku: {
            name: `${TierCode.Free}-${'testHub'}`,
            tier: TierCode.Free,
            capacity: 2
        }
    }

    it('create iot hub errored', async () => {
        sinon.restore();
        sinon.stub();
        sinon.stub(axios, 'put').withArgs(sinon.match(createHubUrl), sinon.match(qs.stringify(erroredBody)), sinon.match(requestConfig)).resolves(Promise.resolve(erroredHubResponse));
        const request = new Requests(clientConfig);
        expect(request.createIoTHub(accessToken, LocationCode.Central_India, 2, TierCode.Free, 'testHub', 'testGroup')).to.eventually.be.rejectedWith('ProvisionedUnitsOutOfRange').and.be.instanceOf(IoTHubError).then((error) => {
            expect(error).to.have.property('description', erroredHubResponse.data.Message);
            expect(error).to.have.property('code', 400);
        });
    });

    const iotHubConnectionStringURL = `https://management.azure.com/subscriptions/${clientConfig.subscriptionId}/resourceGroups/testGroup/providers/Microsoft.Devices/IotHubs/testHub/IotHubKeys/iothubowner/listkeys?api-version=2018-04-01`;

    const primaryKey = faker.random.uuid();

    const connectionStringResponse = {
        data: {
            keyName: 'iothubowner',
            primaryKey,
            secondaryKey: faker.random.uuid(),
            rights: 'RegistryWrite, ServiceConnect, DeviceConnect'
        },
        status: 200
    }

    const connectionStringRequestConfig = {
        headers: {
            'Content-Length': 0,
            Authorization: `Bearer ${accessToken}`
        }
    }

    const expectedConnectionString = `HostName=testHub.azure-devices.net;SharedAccessKeyName=iothubowner;SharedAccessKey=${primaryKey}`

    it('get iot hub connection string', async () => {
        sinon.restore();
        sinon.stub(axios, 'post').withArgs(sinon.match(iotHubConnectionStringURL), sinon.match(qs.stringify(null)), sinon.match(connectionStringRequestConfig)).resolves(Promise.resolve(connectionStringResponse));
        const request = new Requests(clientConfig);
        const response = await request.getIoTHubConnectionString(accessToken, 'testGroup', 'testHub');
        expect(response).to.be.eql(expectedConnectionString);
    });

    const iotHubConnectionString = faker.random.alphaNumeric(100);

    const createDPSBody = {
        location: LocationCode.Central_India,
        type: 'Microsoft.Devices/ProvisioningServices',
        properties: {
            state: 'Active',
            iotHubs: [
                {
                    connectionString: iotHubConnectionString,
                    location: LocationCode.Central_India
                }
            ],
            allocationPolicy: 'Hashed'
        },
        sku: {
            name: `${TierCode.Free}-testDPS`,
            tier: TierCode.Free,
            capacity: 1
        }
    }

    const createDPSURL = `https://management.azure.com/subscriptions/${clientConfig.subscriptionId}/resourceGroups/testGroup/providers/Microsoft.Devices/provisioningServices/testDPS?api-version=2018-01-22`;

    const dpsResponse = {
        data: {
            name: 'testDPS',
            location: LocationCode.Central_India,
            properties: {
                state: 'Transitioning',
                provisioningState: 'Accepted',
                iotHubs: [
                    {
                        name: 'testHub',
                        connectionString: iotHubConnectionString,
                        location: LocationCode.Central_India
                    }
                ],
                allocationPolicy: 'Hashed',
                idScope: null
            },
            resourcegroup: 'testGroup',
            type: 'Microsoft.Devices/provisioningServices',
            id: faker.random.uuid(),
            subscriptionid: faker.random.uuid(),
            tags: {},
            sku: {
                name: `${TierCode.Free}-testDPS`,
                tier: TierCode.Free,
                capacity: 1
            }
        },
        status: 201
    }

    it('create dps', async () => {
        sinon.restore();
        sinon.stub(axios, 'put').withArgs(sinon.match(createDPSURL), sinon.match(qs.stringify(createDPSBody)), sinon.match(requestConfig)).resolves(Promise.resolve(dpsResponse));
        const request = new Requests(clientConfig);
        const response = await request.createDPS(accessToken, LocationCode.Central_India, iotHubConnectionString, TierCode.Free, 1, 'testGroup', 'testDPS');
        expect(response).to.be.eql(dpsResponse.data);
    });

    const wrongConnectionString = faker.random.uuid();

    const wrongCreateDPSBody = {
        location: LocationCode.Central_India,
        type: 'Microsoft.Devices/ProvisioningServices',
        properties: {
            state: 'Active',
            iotHubs: [
                {
                    connectionString: wrongConnectionString,
                    location: LocationCode.Central_India
                }
            ],
            allocationPolicy: 'Hashed'
        },
        sku: {
            name: `${TierCode.Free}-testDPS`,
            tier: TierCode.Free,
            capacity: 1
        }
    }

    const dpsErrorResponse = {
        data: {
            code: 400059,
            httpStatusCode: "BadRequest",
            message: faker.random.words(5)
        },
        status: 400
    }

    it('create dps errored', async () => {
        sinon.restore();
        sinon.stub(axios, 'put').withArgs(sinon.match(createDPSURL), sinon.match(qs.stringify(wrongCreateDPSBody)), sinon.match(requestConfig)).resolves(Promise.resolve(dpsErrorResponse));
        const request = new Requests(clientConfig);
        expect(request.createDPS(accessToken, LocationCode.Central_India, wrongConnectionString, TierCode.Free, 1, 'testGroup', 'testDPS')).to.eventually.be.rejectedWith('BadRequest').and.be.instanceOf(DPSError).then((error) => {
            expect(error).to.have.property('description', dpsErrorResponse.data.message);
            expect(error).to.have.property('code', 400);
        });
    });

    const scopeIdURL = `https://management.azure.com/subscriptions/${clientConfig.subscriptionId}/resourceGroups/testGroup/providers/Microsoft.Devices/provisioningServices/testDPS?api-version=2018-01-22`;

    const scopeIdHeader = {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    }

    const scopeId = faker.random.uuid();

    const scopeIdServerResponse = {
        data: {
            etag: faker.random.words(1),
            name: 'testDPS',
            location: LocationCode.Central_India,
            properties: {
                state: 'Transitioning',
                provisioningState: 'Accepted',
                iotHubs: [
                    {
                        name: 'testHub',
                        connectionString: iotHubConnectionString,
                        location: LocationCode.Central_India
                    }
                ],
                allocationPolicy: 'Hashed',
                idScope: scopeId,
                serviceOperationsHostName: "testDPS.azure-devices-provisioning.net",
                deviceProvisioningHostName: 'global.azure-devices-provisioning.net',
            },
            resourcegroup: 'testGroup',
            type: 'Microsoft.Devices/provisioningServices',
            id: faker.random.uuid(),
            subscriptionid: faker.random.uuid(),
            tags: {},
            sku: {
                name: `${TierCode.Free}-testDPS`,
                tier: TierCode.Free,
                capacity: 1
            }
        },
        status: 200
    }

    it('get scope id', async () => {
        sinon.restore();
        sinon.stub(axios, 'get').withArgs(sinon.match(scopeIdURL), sinon.match(scopeIdHeader)).resolves(Promise.resolve(scopeIdServerResponse));
        const request = new Requests(clientConfig);
        const response = await request.getDPSScopeID(accessToken, 'testGroup', 'testDPS');
        expect(response).to.be.eql(scopeId);
    });

    const wrongResourceGroupName = 'testGroup1';

    const dpsScopeIdErrorResponse = {
        data: {
            error: {
                code: 'ResourceGroupNotFound',
                message: `Resource group '${wrongResourceGroupName}' could not be found.`
            }
        },
        status: 404
    };

    const wrongScopeIdURL = `https://management.azure.com/subscriptions/${clientConfig.subscriptionId}/resourceGroups/${wrongResourceGroupName}/providers/Microsoft.Devices/provisioningServices/testDPS?api-version=2018-01-22`;

    it('get scope id errored', async () => {
        sinon.restore();
        sinon.stub(axios, 'get').withArgs(sinon.match(wrongScopeIdURL), sinon.match(scopeIdHeader)).resolves(Promise.resolve(dpsScopeIdErrorResponse));
        const request = new Requests(clientConfig);
        expect(request.getDPSScopeID(accessToken, wrongResourceGroupName, 'testDPS')).to.eventually.be.rejectedWith('ResourceGroupNotFound').and.be.instanceOf(DPSError).then((error) => {
            expect(error).to.have.property('description', dpsScopeIdErrorResponse.data.error.message);
            expect(error).to.have.property('code', 404);
        });

    });

    const dpsConnectionStringURL = `https://management.azure.com/subscriptions/${clientConfig.subscriptionId}/resourceGroups/testGroup/providers/Microsoft.Devices/provisioningServices/testDPS/keys/provisioningserviceowner/listkeys?api-version=2018-01-22`;

    const dpsPrimaryKey = faker.random.uuid();
    const dpsConnectionString = `HostName=testDPS.azure-devices-provisioning.net;SharedAccessKeyName=provisioningserviceowner;SharedAccessKey=${dpsPrimaryKey}`

    const dpsConnectionStringServerResponse = {
        data: {
            keyName: 'provisioningserviceowner',
            primaryKey: dpsPrimaryKey,
            secondaryKey: faker.random.uuid(),
            rights: 'ServiceConfig, DeviceConnect, EnrollmentWrite'
        },
        status: 200
    };

    it('get dps connection string ', async () => {
        sinon.restore();
        sinon.stub(axios, 'post').withArgs(sinon.match(dpsConnectionStringURL), sinon.match(qs.stringify(null)), sinon.match(connectionStringRequestConfig)).resolves(Promise.resolve(dpsConnectionStringServerResponse));
        const request = new Requests(clientConfig);
        const response = await request.getDPSConnectionString(accessToken, 'testGroup', 'testDPS');
        expect(response).to.be.eql(dpsConnectionString);
    });

    const wrongDpsConnectionStringURL = `https://management.azure.com/subscriptions/${clientConfig.subscriptionId}/resourceGroups/${wrongResourceGroupName}/providers/Microsoft.Devices/provisioningServices/testDPS/keys/provisioningserviceowner/listkeys?api-version=2018-01-22`

    const dpsServerConnectionStringErrorResponse = {
        data: {
            code: 404001,
            httpStatusCode: 'ResourceGroupNotFound',
            message: `Resource group '${wrongResourceGroupName}' could not be found.`
        },
        status: 404
    }

    it('get dps connection string errored ', async () => {
        sinon.restore();
        sinon.stub(axios, 'post').withArgs(sinon.match(wrongDpsConnectionStringURL), sinon.match(qs.stringify(null)), sinon.match(connectionStringRequestConfig)).resolves(Promise.resolve(dpsServerConnectionStringErrorResponse));
        const request = new Requests(clientConfig);
        expect(request.getDPSConnectionString(accessToken, wrongResourceGroupName, 'testDPS')).to.eventually.be.rejectedWith('ResourceGroupNotFound').and.be.instanceOf(DPSError).then((error) => {
            expect(error).to.have.property('description', dpsServerConnectionStringErrorResponse.data.message);
            expect(error).to.have.property('code', 404);
        });
    });
});