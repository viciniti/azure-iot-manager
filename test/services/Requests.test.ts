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

    const iotHubConnectionStringURL= `https://management.azure.com/subscriptions/${clientConfig.subscriptionId}/resourceGroups/testGroup/providers/Microsoft.Devices/IotHubs/testHub/IotHubKeys/iothubowner/listkeys?api-version=2018-04-01`;

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
        sinon.stub();
        sinon.stub(axios, 'post').withArgs(sinon.match(iotHubConnectionStringURL), sinon.match(qs.stringify(null)), sinon.match(connectionStringRequestConfig)).resolves(Promise.resolve(connectionStringResponse));
        const request = new Requests(clientConfig);
        const response = await request.getIoTHubConnectionString(accessToken,'testGroup', 'testHub');
        expect(response).to.be.eql(expectedConnectionString);
    });

});