import {Requests} from "../../lib/services/Requests";
import {ClientConfig} from "../../lib/entities/ClientConfig";
import {Token} from "../../lib/entities/Token";
import {ClientAuthenticator} from "../../lib/auth/ClientAuthenticator";
import { expect } from "chai";
import sinon from "sinon";
import faker from "faker";

describe('auth test', () => {

    const clientConfig = new ClientConfig(faker.random.uuid(), faker.random.uuid(), faker.random.uuid(), faker.random.alphaNumeric(10));

    const freshAccessToken = faker.random.alphaNumeric(100);

    const expiredAccessToken = faker.random.alphaNumeric(100);

    it('get new token', async () => {
        const requests = new Requests(clientConfig);
        const expiredToken = new Token(expiredAccessToken, Date.now() - 10000);
        sinon.stub(requests, 'getClientToken').withArgs().resolves(expiredToken);
        const clientAuthentication = new ClientAuthenticator(requests);
        await clientAuthentication.getTokenCached();
        sinon.restore();
        const expectedToken = new Token(freshAccessToken, Date.now() + 3599 * 1000)
        sinon.stub(requests, 'getClientToken').withArgs().resolves(expectedToken);
        const response = await clientAuthentication.getTokenCached();
        expect(response).to.be.eql(expectedToken.accessToken);
    })

    it('get cached token', async () => {
        const requests = new Requests(clientConfig);
        const normalToken = new Token(expiredAccessToken, Date.now() + 3599 * 1000);
        sinon.stub(requests, 'getClientToken').withArgs().resolves(normalToken);
        const clientAuthentication = new ClientAuthenticator(requests);
        await clientAuthentication.getTokenCached();
        sinon.restore();
        const expectedToken = new Token(freshAccessToken, Date.now() + 3599 * 1000)
        sinon.stub(requests, 'getClientToken').withArgs().resolves(expectedToken);
        const response = await clientAuthentication.getTokenCached();
        expect(response).to.be.eql(normalToken.accessToken);
    });
})