// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

// An empty array that will hold all the nodes to be displayed.
var stagedNodes = [];
// An array that has the object types that should be loaded from Digital Twins for the graph.
var objectTypesToLoad = ["space", "device", "sensor"];
var oDataTop = 999;
// Dictionary to keep track of oDataSkip count for each object type
var oDataSkips = {}

// Get a Digital Twin JSON using command
function executeApiDigitalTwinJSON(api, command, json, fComplete) {
    var resource = authContext.getResourceForEndpoint(getBaseUrl());
    authContext.acquireToken(
        resource,
        function (error, token) {
            if (error || !token) {
                handleTokenError(error);
                return;
            }

            // Let's create the correct API url.
            var url = getBaseUrl() + "api/v1.0/" + api;

            var ajaxJSON = {
                type: command,
                xhrFields: {
                    withCredentials: true
                },
                headers: { "Authorization": 'Bearer ' + token },
                url: url
            }

            switch (command) {
                case "PUT":
                    ajaxJSON.data = json;
                    ajaxJSON.contentType = "application/json";
                break;
                case "PATCH":
                    ajaxJSON.data = json;
                    ajaxJSON.contentType = "application/json";
                break;
                case "POST":
                    ajaxJSON.data = json;
                    ajaxJSON.contentType = "application/json";
                break;
                case "DELETE":
                    ajaxJSON.contentType = "application/json";
                break;
            }

            // Make the call.
            $.ajax( ajaxJSON ).success(function (data) {
                fComplete(data);
            }).error(function (err) {
                showAlert("error",
                "API Execution",
                "API error: " + JSON.stringify(err),
                false);
            });
        }
    );

}

// Get a single Digital Twin Object
function getDigitalTwinsObject(id, type, fComplete) {
    var resource = authContext.getResourceForEndpoint(getBaseUrl());
    authContext.acquireToken(
        resource,
        function (error, token) {
            if (error || !token) {
                handleTokenError(error);
                return;
            }

            // Let's create the correct API url.
            var url = getBaseUrl() + "api/v1.0/";
            switch (type) {
                case "space":
                    url = url + "spaces/" + id + "?includes=properties,types,values,fullPath,location";
                    break;
                case "resource":
                    url = url + "resources/" + id + "?includes=properties,types,values,fullPath";
                    break;
                case "device":
                    url = url + "devices/" + id + "?includes=properties,types,fullPath,location,iothub";
                    break;
                case "sensor":
                    url = url + "sensors/" + id + "?includes=properties,types,fullPath,value";
                    break;
                default:
                    console.log("Unknown object type: " + type);
                    return;
            }

            // Make the call.
            $.ajax({
                type: "GET",
                xhrFields: {
                    withCredentials: true
                },
                headers: { "Authorization": 'Bearer ' + token },
                url: url
            }).success(function (data) {
                fComplete(data);
            }).error(function (err) {
                console.log("Error acquiring token: " + err);
            });
        }
    );

}

// Get all the objects of a certain type and add them to the staged nodes var.
// This function is called to load the whole model.
function getDigitalTwinsObjects(type, fComplete) {
    var resource = authContext.getResourceForEndpoint(getBaseUrl());
    authContext.acquireToken(
        resource,
        function (error, token) {
            if (error || !token) {
                handleTokenError(error);
                return;
            }
            //Setting the initial oData Skip value for the object type to zero
            oDataSkips[type] = 0;

            // Make the API call.
            executeDigitalTwinsRequest(token, type, fComplete);
        }
    );
}

//Execute call to retrieve Digital Twins to get all Digital Twins Object nodes, accounting for the Digital Twins limit of 1000 nodes per request
function executeDigitalTwinsRequest(token, type, fComplete) {

    $.ajax({
        type: "GET",
        xhrFields: {
            withCredentials: true
        },
        headers: { "Authorization": 'Bearer ' + token },
        url: getRequestUrlWithoDataSkip(type)
    }).success(function (data) {

        $.each(data, function (k, v) {
            // Add some extra properties we will need to display it correct in the graph viewer.
            var node = extendNodeProperties(v, type);
            // We need a single flat array with all the objects, so we add them to the stagedNodes array.
            stagedNodes.push(node);
        });

        //If the returned array from Digital Twins still has nodes in it, adjust the oData skip and recall the executeDigitalTwinsRequest function
        if (data.length > 0) {
            oDataSkips[type] = oDataSkips[type] + oDataTop;
            executeDigitalTwinsRequest(token, type, fComplete);
        }
        else {
            fComplete(data);
        }

    }).error(function (err) {
        console.log("Error acquiring token: " + err);
    });
}

//Generates the request url for the getDigitalTwinsObjects function
function getRequestUrlWithoDataSkip(type) {

    // Create the URL based on which type of object we want to get.
    var url = getBaseUrl() + "api/v1.0/";
    switch (type) {
        case "space":
            url = url + "spaces" + "?$top=" + oDataTop + "&$skip=" + oDataSkips[type];
            break;
        case "device":
            url = url + "devices" + "?$top=" + oDataTop + "&$skip=" + oDataSkips[type];
            break;
        case "sensor":
            url = url + "sensors" + "?$top=" + oDataTop + "&$skip=" + oDataSkips[type];
            break;
        default:
            return;
    }

    return url;
}

// Function that adds a couple of new properties to a node that we would need for displaying it correctly.
function extendNodeProperties(node, type) {
    // We want to add a label property to display on the nodes in the graph viewer.
    // Space Types have different fields, so we need to get the right one based on the type.
    var label;
    switch (type) {
        case "space": label = node.friendlyName ? node.friendlyName : node.name; break;
        case "device": label = node.friendlyName ? node.friendlyName : node.name; break;
        case "sensor": label = node.friendlyName ? node.friendlyName : node.hardwareId; break;
        default: return;
    }
    $.extend(node, {
        "label": label ? label : "", // Add the label
        "type": type, // Add the type to the node.
        "childCount": 0, // Set initial child count to 0;
        "children": [], // Create empty array for children
        "_children": [] // Create empty array for hidden children.
    });
    return node;
}

// Get all the objects of a certain type and add them to the staged nodes var.
// This function is called to load the whole model.
function getDigitalTwinsTypes(categories, fComplete) {
    var resource = authContext.getResourceForEndpoint(getBaseUrl());
    authContext.acquireToken(
        resource,
        function (error, token) {
            if (error || !token) {
                handleTokenError(error);
                return;
            }

            // Create the URL based on which type of object we want to get.
            var url = getBaseUrl() + "api/v1.0/types?disabled=false&categories=" + categories.join();

            // Make the API call.
            $.ajax({
                type: "GET",
                xhrFields: {
                    withCredentials: true
                },
                headers: { "Authorization": 'Bearer ' + token },
                url: url
            }).success(function (data) {
                fComplete(data);
            }).error(function (err) {
                console.log("Error acquiring token: " + err);
            });
        }
    );
}

// Create a new Digital Twins Object
function postDigitalTwinsObject(objectType, jsonData, fComplete) {
    var resource = authContext.getResourceForEndpoint(getBaseUrl());

    authContext.acquireToken(
        resource,
        function (error, token) {
            if (error || !token) {
                handleTokenError(error);
                return;
            }

            // Create the URL based on which type of object we want to get.
            var url = getBaseUrl() + "api/v1.0/";
            switch (objectType) {
                case "space":
                    url = url + "spaces";
                    break;
                case "resource":
                    url = url + "resources";
                    break;
                case "device":
                    url = url + "devices";
                    break;
                case "sensor":
                    url = url + "sensors";
                    break;
                default:
                    return;
            }

            $.ajax({
                type: "POST",
                xhrFields: {
                    withCredentials: true
                },
                headers: { "Authorization": 'Bearer ' + token },
                url: url,
                data: jsonData,
                contentType: "application/json"
            }).complete(function (xhr, status) {
                fComplete(xhr, status);
            });
        }
    );
}

// This function let's you make a patch request to the digital twins model.
function patchDigitalTwins(objectId, objectType, jsonData, fComplete) {
    var resource = authContext.getResourceForEndpoint(getBaseUrl());

    authContext.acquireToken(
        resource,
        function (error, token) {
            if (error || !token) {
                handleTokenError(error);
                return;
            }

            // Create the URL based on which type of object we want to delete.
            var url = getBaseUrl() + "api/v1.0/";
            switch (objectType) {
                case "space":
                    url = url + "spaces/";
                    break;
                case "device":
                    url = url + "devices/";
                    break;
                case "sensor":
                    url = url + "sensors/";
                    break;
                default:
                    return;
            }

            url = url + objectId;
            console.log(url)
            console.log(jsonData)

            $.ajax({
                type: "PATCH",
                xhrFields: {
                    withCredentials: true
                },
                headers: { "Authorization": 'Bearer ' + token },
                url: url,
                data: jsonData,
                contentType: "application/json"
            }).complete(function (xhr, status) {
                console.log(status);
                console.log(xhr);
                fComplete(status, xhr.responseJSON);
            });
        }
    );
}

function deleteDigitalTwinsObject(objectId, objectType, fComplete) {
    var resource = authContext.getResourceForEndpoint(getBaseUrl());

    authContext.acquireToken(
        resource,
        function (error, token) {
            if (error || !token) {
                handleTokenError(error);
                return;
            }

            // Create the URL based on which type of object we want to delete.
            var url = getBaseUrl() + "api/v1.0/";
            switch (objectType) {
                case "space":
                    url = url + "spaces/";
                    break;
                case "device":
                    url = url + "devices/";
                    break;
                case "sensor":
                    url = url + "sensors/";
                    break;
                default:
                    return;
            }

            url = url + objectId;

            $.ajax({
                type: "DELETE",
                xhrFields: {
                    withCredentials: true
                },
                headers: { "Authorization": 'Bearer ' + token },
                url: url,
                contentType: "application/json"
            }).complete(function (xhr, status) {
                fComplete(status, xhr.responseJSON);
            });
        }
    );
}

// Function to turn the flat data into a nested json so we can use that for the visualization.
function showGraphData(data) {
    // Make sure we start with a blank slate
    var treeDataStaged = [];
    $("#graphContent > svg").remove();

    // Turn the array into an object containing all the nodes
    dataMap = data.reduce(function (map, node) {
        map[node.id] = node;
        return map;
    }, {});

    data.forEach(function (node) {

        // Spaces, devices and sensors show their parent in a different way.
        switch (node.type) {
            case "space":
                var parent = dataMap[node.parentSpaceId];
                break;
            case "device":
                var parent = dataMap[node.spaceId];
                break;
            case "sensor":
                var parent = dataMap[node.deviceId];
                break;
            default:
                break;
        }

        // we get a flat list of nodes, which we want to turn in to a hierarchy so we can use a D3 tree to visualize it
        if (parent) {
            // Push the current node to parent.children. We may need to init that to an empty array first in case it does not have children yet. 
            parent.children.push(node);
            // Increase the child count of the parent.
            parent.childCount++;
        } else {
            treeDataStaged.push(node);
        }
    });

    // Create a tree starting from the root node
    // Note that this can only deal with a single root, so if there would be multiple unparented nodes we would need to add a second tree.
    initializeGraphVisualizer(treeDataStaged[0]);
}

function refreshData() {
    // Reset everything
    $("#graphLoaderIcon").show();
    stagedNodes = [];

    // We need to make seperate requests for the types of objects we want to load.
    // This array will hold all deffered objects so we can check once they have all been completed.
    var deferreds = [];

    // We check which object types we want to load and create a seperate deffered object and http request for each.
    objectTypesToLoad.forEach(function (objectType) {
        // Create the deferred object
        var deferred = $.Deferred();
        // Fire up the request
        getDigitalTwinsObjects(objectType, function (d) { deferred.resolve(d); });
        // Add the deffered object to the defferds array so we can check when they are all done
        deferreds.push(deferred);
    });

    // when _all_ requests are done, start visualizing
    $.when.apply(null, deferreds).done(function () {
        if (stagedNodes.length > 0) {
            showGraphData(stagedNodes);
        }
        else {
            showAlert("error",
                "No data loaded",
                "No data was returned from Digital Twins. Make sure you have added at least one space and have authorization to view it.",
                false);
            $("#addRootButton").show();
        }
        $("#graphLoaderIcon").hide();
    });
}

function addRootSpace() {
    // Define root space
    var rootspace = {
        "Name": "Root Space",
        "Type": null,
        "ParentSpaceId": "",
        "Subtype": null
    }

    $("#addRootButton").hide();

    // Create the deferred object
    var deferred = $.Deferred();

    addObject("space", rootspace, function(data) {
        if (data){
            alert(JSON.stringify(data));
            var resource = {
                "Type": "IoTHub",
                "SpaceId": data.id
            }
            addObject("resource", resource, function(s) {
                refreshData();
                deferred.resolve(s);
            });
        }
        else {
            deferred.resolve(data);
        }
    });
}

function addObject(type, data, fComplete) {
    // Let's make the call
    postDigitalTwinsObject(type, JSON.stringify(data), function (xhr, status) {
        switch (status) {
            case "success":
                // Succesfully added.. now get the new object so we can add it to the graph.
                getDigitalTwinsObject(xhr.responseJSON, type, function (node) {
                    // Extend the node with some additional properties for correctly showing the in graph
                    node = extendNodeProperties(node, type);
                    // Add it to the graph
                    addNodeToGraph(node);
                    refreshData();
                    fComplete(node);
                });
                break;
            default:
                fComplete(xhr.responseJSON);
                break;
        }
    });
}


function updateObject(object, data, fComplete) {
    patchDigitalTwins(object.id, object.type, JSON.stringify(data), function (status, response) {
        switch (status) {
            case "nocontent":
                // We may need to update the label if the names have changed..
                var label;
                switch (object.type) {
                    case "space": label = data.friendlyName ? data.friendlyName : data.name; break;
                    case "device": label = data.friendlyName ? data.friendlyName : data.name; break;
                    case "sensor": label = data.friendlyName ? data.friendlyName : data.port; break;
                    default: return;
                }
                $.extend(data, {
                    "label": label ? label : "" // Add the label
                });
                // Let's call the function to update the node in the graph.
                updateNodeInGraph(object, data);
                refreshData();
                fComplete(response);
                break;
            default:
                fComplete(response);
                break;
        }
    });
}

function deleteObject(object, fComplete) {
    // Let's make the call..
    deleteDigitalTwinsObject(object.id, object.type, function (status, response) {
        switch (status) {
            case "nocontent":
                removeNodeFromGraph(object);
                refreshData();
                fComplete(response);
                break;
            default:
                fComplete(response);
                break;
        }

    });
}

function objectDragAction(node, target, fEndDrag) {

    // The user attempted to drag _node_ to _target_.
    // If the Digital Twins backend says that's ok, call fEndDrag(true) to allow the UI to complete the drag
    // To abort the drag (and return to the previous state), call fEndDrag(false) and nothing changes.

    // we cannot drag a sensor and only add something to a space.
    if (node.type == "sensor" || target.type != "space") {
        showAlert("error",
            "Update failed",
            "You can't attach a " + node.type + " to a " + target.type + "."
        );
        fEndDrag(false);
        return;
    }

    // Form the url and the body to send to smart spaces. 
    // This depends on the type of object to change, since they record their parent in a different way.
    var jsonData;
    if (node.type == "device") {
        jsonData = JSON.stringify({ "spaceId": target.id });
    }
    else if (node.type == "space") {
        jsonData = JSON.stringify({ "parentSpaceId": target.id });
    }

    // Make the call
    $("#graphLoaderIcon").show();
    var updateDigitalTwins = $.Deferred();
    patchDigitalTwins(node.id, node.type, jsonData, function (status, response) { 
        if (response)
            updateDigitalTwins.resolve(response.error.message); 
        else
            updateDigitalTwins.resolve(status); 
    });

    // Call is done, let's see the result
    $.when(updateDigitalTwins).done(function (status) {

        // a successful patch request will give 'nocontent' as status
        switch (status) {
            case "nocontent":
                showAlert("success",
                    "Success",
                    "<strong>" + node.name + "</strong> was succesfully moved to <strong>" + target.name + "</strong>."
                );
                refreshData();
                fEndDrag(true);
                break;
            default:
                showAlert("error",
                    "Update failed",
                    status
                );
                fEndDrag(false);
                break;
        }
        $("#graphLoaderIcon").hide();
    });

}

function showAlert(type, title, text) {
    $("#alert").attr("class", "");
    $("#alert").addClass(type);
    $("#alert > h2").text(title);
    $("#alert > p").html(text);
    $("#alert").addClass("show");
}