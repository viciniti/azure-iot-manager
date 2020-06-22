import axios from "axios";
import {FailedToCreateResourceGroupError} from "../errors/error";
import {CreateResourceGroupResponse} from "../response-types/resource-group/response";

export class ResourceGroupManager {

    private readonly token: string;

    private readonly subscriptionId: string;

    constructor(token: string, subscriptionId: string) {
        this.token = token;
        this.subscriptionId = subscriptionId;
    }

    public createResourceGroup = async (location: string, name: string): Promise<CreateResourceGroupResponse> => {
        const body = {
            location
        };

        const config = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.token}`
            }
        };

        let response;
        try {
            response = await axios.put(`https://management.azure.com/subscriptions/${this.subscriptionId}/resourcegroups/${name}?api-version=2019-10-01`, body, config);
            if (response.status >= 200 && response.status < 300) {
                return new CreateResourceGroupResponse(name);
            } else {
                return new CreateResourceGroupResponse(name, new FailedToCreateResourceGroupError(response.status, response.data.error.message));
            }
        } catch (e) {
            throw new FailedToCreateResourceGroupError(500, e.message);
        }
    }
}