import axios from "axios";
import {ResourceGroupResponse} from "../response-types/ResourceGroupResponse";
import {FailedToCreateResourceGroupError} from "../errors/resource-group/FailedToCreateResourceGroupError";

export class ResourceGroupManager {

    private readonly subscriptionId: string;

    constructor(token: string, subscriptionId: string) {
        this.subscriptionId = subscriptionId;
    }

    public createResourceGroup = async (location: string, name: string, token: string): Promise<ResourceGroupResponse> => {
        const body = {
            location
        };

        const config = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            }
        };

        let response;
        try {
            response = await axios.put(`https://management.azure.com/subscriptions/${this.subscriptionId}/resourcegroups/${name}?api-version=2019-10-01`, body, config);
            if (response.status >= 200 && response.status < 300) {
                return new ResourceGroupResponse(name);
            } else {
                return new ResourceGroupResponse(name, new FailedToCreateResourceGroupError(response.status, response.data.error.message));
            }
        } catch (e) {
            throw new FailedToCreateResourceGroupError(500, e.message);
        }
    }
}