import * as msRest from "@azure/ms-rest-js";
import * as msRestAzure from "@azure/ms-rest-azure-js";
import * as msRestNodeAuth from "@azure/ms-rest-nodeauth";
import { MonitorManagementClient, MonitorManagementModels, MonitorManagementMappers } from "@azure/arm-monitor";



const subscriptionId = "00f87579-7323-499b-bc72-c1fedd43993d";
const authManager = new msAuth.AuthManager({
    clientId: "618d177a-5b57-4820-a73c-164917455355",
    tenant: "72f988bf-86f1-41af-91ab-2d7cd011db47"
});
authManager.finalizeLogin().then((res) => {
    if (!res.isLoggedIn) {
        // may cause redirects
        authManager.login();
    }
    const client = new MonitorManagementClient(res.creds, subscriptionId);
         //console.log("Ayobami");
    const resourceGroupName = "testresourceGroupName";
    client.autoscaleSettings.listByResourceGroup(resourceGroupName).then((result) => {
        console.log("The result is:");
        console.log(result);
    }).catch((err) => {
        console.log("An error occurred:");
        console.error(err);
    });
});