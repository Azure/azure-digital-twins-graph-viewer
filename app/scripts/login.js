var endpoints = {};
// No need to change this value, it belongs to the Azure DigitalTwins service
endpoints[twinsInstanceRoot] = "0b07f429-9f4b-4714-9392-cc5e8e80c8b0";

var pageUrl = window.location.href;
var user, authContext, message, errorMessage, loginButton, logoutButton;
var baseUrl = twinsInstanceRoot + "management/";

window.config = {
    tenant: tenant,
    clientId: clientId,
    postLogoutRedirectUri: pageUrl,
    redirectUri: pageUrl,
    endpoints: endpoints,
    cacheLocation: 'localStorage' // enable this for IE, as sessionStorage does not work for localhost.
};

function authenticate() {
    authContext = new AuthenticationContext(config);

    // Check For & Handle Redirect From AAD After Login
    var isCallback = authContext.isCallback(window.location.hash);
    if (isCallback) {
        authContext.handleWindowCallback();
    }
    var loginError = authContext.getLoginError();

    if (isCallback && !loginError) {
        window.location = authContext._getItem(authContext.CONSTANTS.STORAGE.LOGIN_REQUEST);
    }
    else {
        $("#errorMessage").text(loginError);
    }
    user = authContext.getCachedUser();

}

function handleTokenError(error) {
    // Try to catch some common stuff that can go wrong
    if (error.startsWith("AADSTS50076")) {
        // In this case, the user likely signed in on a location that did not require MFA and then move. 
        console.log("MFA required but not used. Logging out.");
        logout();
    }
    else if (error.startsWith("AADSTS50058")) {
        // A user appeared to be logged in but is not. Set the UI to signed out mode.
        console.log("A silent sign-in request was sent but no user is signed in. Logging out.");
        $("#loginButton").show();
        $("#logoutButton").hide();
        $("#helloMessage").hide();
        $("#refreshButton").hide();
        $("#loaderIcon").hide();
    }
    else {
        console.log("Other token error: " + error);
    }
}

function login() {
    authContext.login();
}

function logout() {
    authContext.logOut();
}