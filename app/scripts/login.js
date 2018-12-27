// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.


var pageUrl = window.location.href;
var user, authContext, message, errorMessage, loginButton, logoutButton;

function authenticate() {
    var endpoints = {};
    endpoints[getTwinsInstanceRoot()] = "0b07f429-9f4b-4714-9392-cc5e8e80c8b0";
    var config = {
        tenant: getTwinsTenantId(),
        clientId: getTwinsClientId(),
        postLogoutRedirectUri: pageUrl,
        redirectUri: pageUrl,
        endpoints: endpoints,
        cacheLocation: 'localStorage' // enable this for IE, as sessionStorage does not work for localhost.
    };

    console.log("URL: " + getTwinsInstanceRoot());
    console.log("Tenant: " + config.tenant);
    console.log("Client: " + config.clientId);

    var localAuthContext = new AuthenticationContext(config);
    // When a previous AuthenticationContext has already been created in this session the
    // config seems to be cached and reused, even when creating a new object with a new config
    localAuthContext.config = config;

    // Check For & Handle Redirect From AAD After Login
    var isCallback = localAuthContext.isCallback(window.location.hash);
    if (isCallback) {
        localAuthContext.handleWindowCallback();
    }
    var loginError = localAuthContext.getLoginError();

    if (isCallback && !loginError) {
        window.location = localAuthContext._getItem(localAuthContext.CONSTANTS.STORAGE.LOGIN_REQUEST);
    }
    else {
        $("#errorMessage").text(loginError);
    }
    user = localAuthContext.getCachedUser();
    // Doing this here, so it's already in the token cache when the 3 simultaneous ajax calls go out:
    var resource = localAuthContext.getResourceForEndpoint(getBaseUrl());
    localAuthContext.acquireToken(resource, function(error, token) {
        if(error || !token){
            handleTokenError(error);
        }
        else {
            console.log("Succesfully retrieved token")}
        }
    );
    if(user){
        // only store the config and the context if we've authenticated the user
        window.config = config;
        authContext = localAuthContext;
    }

    return localAuthContext;
}

function getBaseUrl(){
    return getTwinsInstanceRoot() + "management/";
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
        console.log("A silent sign-in request was sent but no user is signed in. Setting UI to logged out state.");
        $("#notSignedInMessage").show();
        $("#loginContainer").removeClass("signed-in");
        $("#loginContainer").click(function(){login();});
        $("#visualizer").hide();
        $("#graphLoaderIcon").hide();
        $("#username").text("Sign in");
    }
    else {
        console.log("Other token error: " + error);
    }
}

function login() {
    // try to store fields for easier access next time
    saveStateToStorage($("#twinsUrl").val(), $("#twinsTenantId").val(), $("#twinsClientId").val());
    var localAuthContext = authenticate();
    localAuthContext.login();
}

function logout() {
    authContext.logOut();
}