// An empty array that will hold all the nodes to be displayed.
var stagedNodes = [];
// An array that has the object types that should be loaded from Digital Twins for the graph.
// Currently we can load space, device and sensor objects only.
var objectTypesToLoad = ["space", "device", "sensor"];

// Get a single Digital Twin Object
function getDigitalTwinsObject(object, fComplete) {
    var resource = authContext.getResourceForEndpoint(baseUrl);
    authContext.acquireToken(
        resource,
        function (error, token) {
            if (error || !token) {
                handleTokenError(error);
                return;
            }

            // Let's create the correct API url.
            var url = baseUrl + "api/v1.0/";
            switch (object.type) {
                case "space":
                    url = url + "spaces/" + object.id + "?includes=properties,types,values,fullPath";
                    break;
                case "device": 
                    url = url + "devices/" + object.id + "?includes=properties,types,fullPath";
                    break;
                case "sensor":
                    url = url + "sensors/" + object.id + "?includes=properties,types,fullPath,value";
                    break;
                default:
                    console.log("Unknown object type: "+object.type);
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
                console.log("Error acquiring token: "+err);
            });
        }
    );

}

// Get all the objects of a certain type and add them to the staged nodes var.
// This function is called to load the whole model.
function getDigitalTwinsObjects(type, fComplete) {
    var resource = authContext.getResourceForEndpoint(baseUrl);
    authContext.acquireToken(
        resource,
        function (error, token) {
            if (error || !token) {
                handleTokenError(error);
                return;
            }

            // Create the URL based on which type of object we want to get.
            var url = baseUrl + "api/v1.0/";
            switch (type) {
                case "space":
                    url = url + "spaces?";
                    break;
                case "device":
                    url = url + "devices?";
                    break;
                case "sensor":
                    url = url + "sensors?";
                    break;
                default:
                    return;
            }
            
            // Make the API call.
            $.ajax({
                type: "GET",
                xhrFields: {
                    withCredentials: true
                },
                headers: { "Authorization": 'Bearer ' + token },
                url: url
            }).success(function (data) {
                // Add the type of the object to the array.
                $.each(data, function (k, v) {
                    $.extend(v, { "type": type });
                    // Sensors don't have a name, but we need a name for the visualizer. So let's create a name based on the port value.
                    if (type == "sensor") {
                        $.extend(v, { "name": v.port });
                    }
                });

                // We only want to add objects to the staged nodes that we actually want to visualize in the graph.
                if (objectTypesToLoad.includes(type)) {
                    // We need a single flat array with all the objects, so we concat them to the stagedNodes array.
                    stagedNodes = stagedNodes.concat(data);
                }
                fComplete(data);
            }).error(function (err) {
                console.log("Error acquiring token: "+err);
            });
        }
    );
}

// This function let's you make a patch request to the digital twins model.
function patchDigitalTwins(type, jsonData, fComplete) {
    var resource = authContext.getResourceForEndpoint(baseUrl);

    authContext.acquireToken(
        resource,
        function (error, token) {
            if (error || !token) {
                handleTokenError(error);
                return;
            }

            $.ajax({
                type: "PATCH",
                xhrFields: {
                    withCredentials: true
                },
                headers: { "Authorization": 'Bearer ' + token },
                url: baseUrl + "api/v1.0/" + type,
                data: jsonData,
                contentType: "application/json"
            }).complete(function (xhr, status) {
                fComplete(status);
            });
        }
    );
}

// Function to turn the flat data into a nested json so we can use that for the visualization.
function showGraphData(data) {
    // Make sure we start with a blank slate
    treeDataStaged = [];
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
            (parent.children || (parent.children = [])).push(node);
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
    $("#visualizerLoaderIcon").show();
    stagedNodes = [];

    // We need to make seperate requests for the types of objects we want to load.
    // This array will hold all deffered objects so we can check once they have all been completed.
    var deferreds = [];

    // We check which object types we want to load and create a seperate deffered object and http request for each.
    objectTypesToLoad.forEach(function(objectType) {
        // Create the deferred object
        var deferred = $.Deferred();
        // Fire up the request
        getDigitalTwinsObjects(objectType, function(d) { deferred.resolve(d); });
        // Add the deffered object to the defferds array so we can check when they are all done
        deferreds.push(deferred);
    });

    // when _all_ requests are done, start visualizing
    $.when.apply(null, deferreds).done(function() {
        showGraphData(stagedNodes);
        $("#visualizerLoaderIcon").hide();
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
            "You can't attach a " + node.type + " to a " + target.type + ".", 
            false
        ); 
        fEndDrag(false);
        return;
    }

    // Form the url and the body to send to smart spaces. 
    // This depends on the type of object to change, since they record their parent in a different way.
    var ssBody, ssUrl;
    if (node.type == "device") {
        ssBody = JSON.stringify({ "spaceId": target.id });
        ssUrl = "devices/" + node.id;
    }
    else if (node.type == "space") {
        ssBody = JSON.stringify({ "parentSpaceId": target.id });
        ssUrl = "spaces/" + node.id;
    }

    // Make the call
    $("#visualizerLoaderIcon").show();
    var updateDigitalTwins = $.Deferred();
    patchDigitalTwins(ssUrl, ssBody, function (s) { updateDigitalTwins.resolve(s); });

    // Call is done, let's see the result
    $.when(updateDigitalTwins).done(function (status) {

        // a successful patch request will give 'nocontent' as status
        switch (status) {
            case "nocontent":
                showAlert("success", 
                    "Success", 
                    "<strong>"+node.name+"</strong> was succesfully moved to <strong>"+target.name+"</strong>.", 
                    false
                );
                fEndDrag(true);
                break;
            default:
                showAlert("error", 
                    "Update failed", 
                    "You probably don't have permissions to update the model.", 
                    false
                ); 
                fEndDrag(false);
                break;
        }
        $("#visualizerLoaderIcon").hide();
    });
    
}

function showAlert(type, title, text, action) {
    $("#alert").removeClass().addClass(type);
    $("#alert > h2").text(title);
    $("#alert > p").html(text);
    if (action) {
        $().append("<a>Undo</a>");
    }
    $("#alert").addClass("show");
}