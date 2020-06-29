import * as faker from "faker";
import sinon from 'sinon';
import { expect } from 'chai';
import qs from "qs";
import axios from "axios";

import {ClientAuthenticator} from '../../lib/auth/ClientAuthenticator';




describe('authentication test', () => {

    const accessToken = Math.random().toString(36);
    const expiresOn = Date.now() + 3599*1000 ;

    const expectedResponse = {
        accessToken,
        expiresOn
    }


    const clientConfig = {
        tenantId: faker.random.uuid(),
        clientSecret: faker.random.alphaNumeric(10),
        clientId: faker.random.uuid(),
        subscriptionId: faker.random.uuid()
    }

    const serverResponse = {
        data: {
            token_type: 'Bearer',
            expiresIn: '3599',
            ext_expires_in: '3599',
            expires_on: expiresOn,
            not_before: faker.date.future(),
            resource: 'https://management.azure.com',
            access_token: accessToken
        },
        status: 200
    }

    it('get token', async () => {
        sinon.stub(axios, 'post').resolves(Promise.resolve(serverResponse));
        const auth = new ClientAuthenticator(clientConfig);
        const tokenResponse = await auth.getToken();
        expect(tokenResponse).to.equal(expectedResponse);
    });
});