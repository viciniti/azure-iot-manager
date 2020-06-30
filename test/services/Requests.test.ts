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

const expect = chai.expect
chai.use(chaiAsPromised)

describe('authentication test', () => {

    const accessToken = faker.random.alphaNumeric(100);
    const expiresOn = Date.now() + 3599 * 1000;

    const expectedResponse = new Token(accessToken, expiresOn);
    const clientConfig = new ClientConfig(faker.random.uuid(), faker.random.uuid(), faker.random.uuid(), faker.random.alphaNumeric(10));
    const wrongClientConfig = new ClientConfig(faker.random.uuid(), faker.random.uuid(), faker.random.uuid(), faker.random.alphaNumeric(10));

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

    const body = {
        grant_type: 'client_credentials',
        client_id: clientConfig.clientId,
        client_secret: clientConfig.clientSecret,
        resource: 'https://management.azure.com'
    };

    const wrongBody = {
        grant_type: 'client_credentials',
        client_id: wrongClientConfig.clientId,
        client_secret: wrongClientConfig.clientSecret,
        resource: 'https://management.azure.com'
    };

    const url = `https://login.microsoftonline.com/${clientConfig.tenantId}/oauth2/token`;
    const wrongUrl = `https://login.microsoftonline.com/${wrongClientConfig.tenantId}/oauth2/token`;

    it('get token', async () => {
        sinon.restore();
        sinon.stub(axios, 'post').withArgs(sinon.match(url), sinon.match(qs.stringify(body)), sinon.match.any).resolves(Promise.resolve(serverResponse));
        const request = new Requests(clientConfig);
        const tokenResponse = await request.getClientToken();
        console.log('a', tokenResponse);
        expect(tokenResponse).to.eql(expectedResponse);
    });

    it('get token errored', async () => {
        sinon.restore();
        sinon.stub(axios, 'post').withArgs(sinon.match(wrongUrl), sinon.match(qs.stringify(wrongBody)), sinon.match.any).resolves(Promise.resolve(serverErrorResponse));
        const request = new Requests(wrongClientConfig);
        expect(request.getClientToken()).to.eventually.be.rejectedWith('unauthorized_client').and.be.instanceOf(AuthenticationError).then((error)=>{
            expect(error).to.have.property('description', serverErrorResponse.data.error_description);
            expect(error).to.have.property('code', 400);
        });
    })
});