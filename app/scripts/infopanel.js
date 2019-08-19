// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

// Show the info panel with the info of the selected node.
function showApiPanel() {
    // Reset everything.
    $("#apiPanelDrawer").addClass("show");
    $("#apiPanel").addClass("open"); // Open the panel
}

// Hide the api panel
function hideApiPanel() {
    $("#apiPanel.open").removeClass("open");
    $("#apiPanelDrawer.show").removeClass("show");
}

// Show the info panel with the info of the selected node.
function showInfoPanel(d) {
    // Reset everything.
    $("#infoPanelContent > div.info").empty(); // Remove any old info
    $("#panelLoaderIcon").show();
    $("#infoPanel > header")
        .removeClass("space device sensor userdefinedfunctions matchers")
        .addClass(d.type);
    $("#infoPanel h2")
        .text(d.label || d.name)
        .removeClass("space device sensor userdefinedfunctions matchers")
        .addClass(d.type);
    $("#infoPanelDrawer.show").removeClass("show");
    $("#infoPanel").addClass("open"); // Open the panel

    if (d.type == "space") {
        $("#infoPanel > header > ul.action-menu > li.addNode").show();
        $("#infoPanel > header > ul.action-menu > li.addNode > ul.addNodeSubMenu > li.add").show();
        $("#infoPanel > header > ul.action-menu > li.addNode > ul.addNodeSubMenu > li.addSensor").hide();
        $("#infoPanel > header > ul.action-menu > li.addNode > ul.addNodeSubMenu > li.addUDF").show();
        $("#infoPanel > header > ul.action-menu > li.addNode > ul.addNodeSubMenu > li.addMatchers").show();
    }
    else if (d.type == "matchers") {
        $("#infoPanel > header > ul.action-menu > li.addNode").hide();
    }
    else if (d.type == "userdefinedfunctions") {
        $("#infoPanel > header > ul.action-menu > li.addNode").show();
        $("#infoPanel > header > ul.action-menu > li.addNode > ul.addNodeSubMenu > li.addUDF").show();
        $("#infoPanel > header > ul.action-menu > li.addNode > ul.addNodeSubMenu > li.addSensor").hide();
        $("#infoPanel > header > ul.action-menu > li.addNode > ul.addNodeSubMenu > li.addMatchers").hide();
        $("#infoPanel > header > ul.action-menu > li.addNode > ul.addNodeSubMenu > li.addDevice").hide();
    }

    else {
        $("#infoPanel > header > ul.action-menu > li.addNode > ul.addNodeSubMenu > li.add").hide();
        $("#infoPanel > header > ul.action-menu > li.addNode > ul.addNodeSubMenu > li.addMatchers").hide();
        $("#infoPanel > header > ul.action-menu > li.addNode > ul.addNdeSubMenu > li.addUDF").hide();
        if (d.type == "device") {
            $("#infoPanel > header > ul.action-menu > li.addNode").show();
            $("#infoPanel > header > ul.action-menu > li.addNode > ul.addNodeSubMenu > li.addSensor").show();
        }
        else {
            $("#infoPanel > header > ul.action-menu > li.addNode").hide();

        }

    }



    // Let's get all the info from the selected element by firing a new API request.
    getDigitalTwinsObject(d.id, d.type, function (data) {
        $("#panelLoaderIcon").hide();
        // The result we get from the API is a single json with nested json/arrays.
        // These differ per object type, so we need to switch and create the right ones.
        jsonToTable(data, "info");
        jsonToTable(data.properties, "properties");
        jsonToTable(data.conditions, "conditions");
        jsonToTable(data.userDefinedFunctions, "userDefinedFunctions");
        jsonToTable(data.matchers, "matchers");
        switch (d.type) {
            case "space":
                jsonToTable(data.values, "values");
                break;
            case "device":
                break;
            case "sensor":
                jsonToTable(data.value, "value");
                break;
            case "matchers":
                jsonToTable(data.value, "value");
                break;
            case "userdefinedfunctions":
                jsonToTable(data.value, "value");
                break;
            default:
                break;
        }
        jsonToTable(data.spacePaths, "spacePaths");
        jsonToTable(data, "JSON");
    });
}

// Hide the info panel
function hideInfoPanel() {
    $("#infoPanel.open").removeClass("open");
    $("#infoPanelDrawer.show").removeClass("show");
    if (selectedNode) {
        deselectNode(selectedNode, true);
    }
}

// Function that shows the Add New Object Form.
function showAddObjectForm(parent, type) {
    // Let's hide all the forms.
    $("#infoPanelDrawer form").hide();
    // Let's get the form we want to show, reset it's content and make it visible.
    var form = $("#infoPanelDrawer form[name='addObject']");
    form.trigger("reset").show();
    // Get the form container.
    var formContainer = form.find("div.form-container");
    formContainer.empty();

    // We only handle creation of space objects for now.
    switch (type) {
        case "space":
            formContainer.append(
                $("<label></label>", { for: "name", text: "Name:" }),
                $("<input />", { type: "text", name: "name" }),
                $("<label></label>", { for: "friendlyName", text: "Friendly Name:" }),
                $("<input />", { type: "text", name: "friendlyName" }),
                $("<label></label>", { for: "description", text: "Description:" }),
                $("<input />", { type: "text", name: "description" }),
                $("<label></label>", { for: "typeId", text: "Type:" }),
                $("<select></select>", { name: "typeId", title: "SpaceType" }).append(
                    "<option>Loading...</option>"
                ),
                $("<label></label>", { for: "subtypeId", text: "Subtype:" }),
                $("<select></select>", {
                    name: "subtypeId",
                    title: "SpaceSubtype"
                }).append("<option>Loading...</option>"),
                $("<label></label>", {
                    for: "parentSpaceId",
                    text: "Parent Space ID:"
                }),
                $("<input />", {
                    type: "text",
                    name: "parentSpaceIdDisabled",
                    disabled: true,
                    val: parent.id
                }),
                // Hidden field is needed since a disabled field is not passed when submitting.
                $("<input />", { name: "parentSpaceId", hidden: true, val: parent.id }),
                // Hidden field to pass type for submit.
                $("<input />", { name: "type", hidden: true, val: type })
            );
            break;
        case "device":
            formContainer.append(
                $("<label></label>", { for: "name", text: "Name:" }),
                $("<input />", { type: "text", name: "name" }),
                $("<label></label>", { for: "hardewareId", text: "Hardware ID:" }),
                $("<input />", { type: "text", name: "hardwareId" }),
                $("<label></label>", { for: "friendlyName", text: "Friendly Name:" }),
                $("<input />", { type: "text", name: "friendlyName" }),
                $("<label></label>", { for: "description", text: "Description:" }),
                $("<input />", { type: "text", name: "description" }),
                $("<label></label>", { for: "typeId", text: "Type:" }),
                $("<select></select>", { name: "typeId", title: "DeviceType" }).append(
                    "<option>Loading...</option>"
                ),
                $("<label></label>", { for: "subtypeId", text: "Subtype:" }),
                $("<select></select>", {
                    name: "subtypeId",
                    title: "DeviceSubtype"
                }).append("<option>Loading...</option>"),
                $("<label></label>", {
                    for: "parentSpaceId",
                    text: "Parent Space ID:"
                }),
                $("<input />", {
                    type: "text",
                    name: "parentSpaceIdDisabled",
                    disabled: true,
                    val: parent.id
                }),
                // Hidden field is needed since a disabled field is not passed when submitting.
                $("<input />", { name: "spaceId", hidden: true, val: parent.id }),
                // Hidden field to pass type for submit.
                $("<input />", { name: "type", hidden: true, val: type })
            );
            break;
        case "sensor":
            formContainer.append(
                $("<label></label>", { for: "hardewareId", text: "Hardware ID:" }),
                $("<input />", { type: "text", name: "hardwareId" }),
                $("<label></label>", { for: "typeId", text: "Type:" }),
                $("<select></select>", { name: "typeId", title: "SensorType" }).append(
                    "<option>Loading...</option>"
                ),
                $("<label></label>", { for: "dataTypeId", text: "Data Type:" }),
                $("<select></select>", {
                    name: "dataTypeId",
                    title: "SensorDataType"
                }).append("<option>Loading...</option>"),
                $("<label></label>", { for: "dataSubtypeId", text: "Data Subtype:" }),
                $("<select></select>", {
                    name: "dataSubtypeId",
                    title: "SensorDataSubtype"
                }).append("<option>Loading...</option>"),
                $("<label></label>", {
                    for: "dataUnitTypeId",
                    text: "Data Unit Type:"
                }),
                $("<select></select>", {
                    name: "dataUnitTypeId",
                    title: "SensorDataUnitType"
                }).append("<option>Loading...</option>"),
                $("<label></label>", {
                    for: "parentSpaceId",
                    text: "Parent Space ID:"
                }),
                $("<input />", {
                    type: "text",
                    name: "parentSpaceIdDisabled",
                    disabled: true,
                    val: parent.id
                }),
                // Hidden field is needed since a disabled field is not passed when submitting.
                $("<input />", { name: "deviceId", hidden: true, val: parent.id }),
                // Hidden field to pass type for submit.
                $("<input />", { name: "type", hidden: true, val: type })
            );
            break;
        case "userdefinedfunctions":
            formContainer.append(
                $("<label></label>", { for: "name", text: "Name:" }),
                $("<input />", { type: "text", name: "name" }),
                $("<label></label>", { for: "metadata", text: "Metadata:" }),
                $("<input />", { type: "text", name: "metadata" }),
                $("<label></label>", { for: "contents", text: "Contents:" }),
                $("<input />", { type: "text", name: "contents" }),
                $("<label></label>", { for: "udfId", text: "Udf Id:" }),
                $("<input />", { type: "text", name: "udfId" }),
                $("<label></label>", {
                    for: "parentSpaceId",
                    text: "Parent Space ID:"
                }),
                $("<input />", {
                    type: "text",
                    name: "parentSpaceIdDisabled",
                    disabled: true,
                    val: parent.id
                }),
                // Hidden field is needed since a disabled field is not passed when submitting.
                $("<input />", { name: "spaceId", hidden: true, val: parent.id }),
                // Hidden field to pass type for submit.
                $("<input />", { name: "type", hidden: true, val: type })
            );
            break;
        case "matchers":
            formContainer.append(
                $("<label></label>", { for: "name", text: "Name:" }),
                $("<input />", { type: "text", name: "name" }),
                $("<label></label>", { for: "friendlyName", text: "Friendly Name:" }),
                $("<input />", { type: "text", name: "friendlyName" }),
                $("<label></label>", { for: "description", text: "Description:" }),
                $("<input />", { type: "text", name: "description" }),
                $("<label></label>", { for: "conditions", text: "Conditions:" }),
                $("<input />", { type: "text", name: "conditions" }),
                $("<label></label>", {
                    for: "parentSpaceId",
                    text: "Parent Space ID:"
                }),
                $("<input />", {
                    type: "text",
                    name: "parentSpaceIdDisabled",
                    disabled: true,
                    val: parent.id
                }),
                // Hidden field is needed since a disabled field is not passed when submitting.
                $("<input />", { name: "spaceId", hidden: true, val: parent.id }),
                // Hidden field to pass type for submit.
                $("<input />", { name: "type", hidden: true, val: type })
            );
            break;
        case "type":
            formContainer.append(
                $("<label></label>", { for: "hardewareId", text: "Hardware ID:" }),
                $("<input />", { type: "text", name: "hardwareId" }),
                $("<label></label>", { for: "typeId", text: "Type:" }),
                $("<select></select>", { name: "typeId", title: "SensorType" }).append(
                    "<option>Loading...</option>"
                ),
                $("<label></label>", { for: "dataTypeId", text: "Data Type:" }),
                $("<select></select>", {
                    name: "dataTypeId",
                    title: "SensorDataType"
                }).append("<option>Loading...</option>"),
                $("<label></label>", { for: "dataSubtypeId", text: "Data Subtype:" }),
                $("<select></select>", {
                    name: "dataSubtypeId",
                    title: "SensorDataSubtype"
                }).append("<option>Loading...</option>"),
                $("<label></label>", {
                    for: "dataUnitTypeId",
                    text: "Data Unit Type:"
                }),
                $("<select></select>", {
                    name: "dataUnitTypeId",
                    title: "SensorDataUnitType"
                }).append("<option>Loading...</option>"),
                $("<label></label>", {
                    for: "parentSpaceId",
                    text: "Parent Space ID:"
                }),
                $("<input />", {
                    type: "text",
                    name: "parentSpaceIdDisabled",
                    disabled: true,
                    val: parent.id
                }),
                // Hidden field is needed since a disabled field is not passed when submitting.
                $("<input />", { name: "deviceId", hidden: true, val: parent.id }),
                // Hidden field to pass type for submit.
                $("<input />", { name: "type", hidden: true, val: type })
            );
            break;
        default:
            return;
    }

    // Let's animate the drawer to show it.
    $("#infoPanelDrawer").addClass("show");

    // We need to understand which data for the select menu's for the Types we need to load.
    var selectTypes = []; // Array of all select elements
    var typesToLoad = []; // Array of all the types we need to load.
    formContainer.find("select").map(function () {
        selectTypes.push($(this));
        typesToLoad.push($(this).attr("title"));
    });

    // Make the API call to get all the types we need.
    getDigitalTwinsTypes(typesToLoad, function (data) {
        formContainer.find("select").empty(); //Empty all the select elements.
        data.forEach(function (type) {
            // Let's see in which select this type needs to be added.
            selectTypes.forEach(function (selectType) {
                if (selectType.attr("title") == type.category) {
                    var name = type.friendlyName ? type.friendlyName : type.name;
                    selectType.append(
                        "<option value=" +
                        type.id +
                        ">" +
                        name +
                        " (ID: " +
                        type.id +
                        ")</option>"
                    );
                }
            });
        });
    });
}

// Function that shows the Edit Object Form.
function showEditObjectForm(object) {
    // Let's hide all the forms.
    $("#infoPanelDrawer form").hide();
    // Let's get the form we want to show, reset it's content and make it visible.
    var form = $("#infoPanelDrawer form[name='editObject']");
    form.trigger("reset").show();
    var formContainer = form.find("div.form-container");
    formContainer.empty();

    switch (object.type) {
        case "space":
            formContainer.append(
                $("<label></label>", { for: "name", text: "Name:" }),
                $("<input />", {
                    type: "text",
                    name: "name",
                    val: "name" in object ? object.name : ""
                }),
                $("<label></label>", { for: "friendlyName", text: "Friendly Name:" }),
                $("<input />", {
                    type: "text",
                    name: "friendlyName",
                    val: "friendlyName" in object ? object.friendlyName : ""
                }),
                $("<label></label>", { for: "description", text: "Description:" }),
                $("<input />", {
                    type: "text",
                    name: "description",
                    val: "description" in object ? object.description : ""
                }),
                $("<label></label>", { for: "typeId", text: "Type:" }),
                $("<select></select>", { name: "typeId", title: "SpaceType" }).append(
                    "<option>Loading...</option>"
                ),
                $("<label></label>", { for: "subtypeId", text: "Subtype:" }),
                $("<select></select>", {
                    name: "subtypeId",
                    title: "SpaceSubtype"
                }).append("<option>Loading...</option>")
            );
            break;
        case "device":
            formContainer.append(
                $("<label></label>", { for: "name", text: "Name:" }),
                $("<input />", {
                    type: "text",
                    name: "name",
                    val: "name" in object ? object.name : ""
                }),
                $("<label></label>", { for: "friendlyName", text: "Friendly Name:" }),
                $("<input />", {
                    type: "text",
                    name: "friendlyName",
                    val: "friendlyName" in object ? object.friendlyName : ""
                }),
                $("<label></label>", { for: "description", text: "Description:" }),
                $("<input />", {
                    type: "text",
                    name: "description",
                    val: "description" in object ? object.description : ""
                }),
                $("<label></label>", { for: "hardwareId", text: "Hardware ID:" }),
                $("<input />", {
                    type: "text",
                    name: "hardwareId",
                    val: "hardwareId" in object ? object.hardwareId : ""
                }),
                $("<label></label>", { for: "gatewayId", text: "Gateway ID:" }),
                $("<input />", {
                    type: "text",
                    name: "gatewayId",
                    val: "gatewayId" in object ? object.gatewayId : ""
                }),
                $("<label></label>", { for: "typeId", text: "Type:" }),
                $("<select></select>", { name: "typeId", title: "DeviceType" }).append(
                    "<option>Loading...</option>"
                ),
                $("<label></label>", { for: "subtypeId", text: "Subtype:" }),
                $("<select></select>", {
                    name: "subtypeId",
                    title: "DeviceSubtype"
                }).append("<option>Loading...</option>")
            );
            break;
        case "sensor":
            formContainer.append(
                $("<label></label>", { for: "port", text: "Port:" }),
                $("<input />", {
                    type: "text",
                    name: "port",
                    val: "port" in object ? object.port : ""
                }),
                $("<label></label>", { for: "hardwareId", text: "Hardware ID:" }),
                $("<input />", {
                    type: "text",
                    name: "hardwareId",
                    val: "hardwareId" in object ? object.hardwareId : ""
                }),
                $("<label></label>", { for: "pollRate", text: "Poll Rate:" }),
                $("<input />", {
                    type: "text",
                    name: "pollRate",
                    val: "pollRate" in object ? object.pollRate : ""
                }),
                $("<label></label>", { for: "typeId", text: "Type:" }),
                $("<select></select>", { name: "typeId", title: "SensorType" }).append(
                    "<option>Loading...</option>"
                ),
                $("<label></label>", { for: "portTypeId", text: "Port Type:" }),
                $("<select></select>", {
                    name: "portTypeId",
                    title: "SensorPortType"
                }).append("<option>Loading...</option>"),
                $("<label></label>", { for: "dataTypeId", text: "Data Type:" }),
                $("<select></select>", {
                    name: "dataTypeId",
                    title: "SensorDataType"
                }).append("<option>Loading...</option>"),
                $("<label></label>", { for: "dataSubtypeId", text: "Data Subtype:" }),
                $("<select></select>", {
                    name: "dataSubtypeId",
                    title: "SensorDataSubtype"
                }).append("<option>Loading...</option>"),
                $("<label></label>", {
                    for: "dataUnitTypeId",
                    text: "Data Unit Type:"
                }),
                $("<select></select>", {
                    name: "dataUnitTypeId",
                    title: "SensorDataUnitType"
                }).append("<option>Loading...</option>")
            );
            break;
        case "userdefinedfunctions":
            formContainer.append(
                $("<label></label>", { for: "name", text: "Name:" }),
                $("<input />", {
                    type: "text",
                    name: "name",
                    val: "name" in object ? object.name : ""
                }),
                $("<label></label>", { for: "metadata", text: "Metadata:" }),
                $("<input />", {
                    type: "text",
                    name: "metadata",
                    val: "metadata" in object ? object.friendlyName : ""
                }),
                $("<label></label>", { for: "contents", text: "Contents:" }),
                $("<input />", {
                    type: "text",
                    name: "contents",
                    val: "contents" in object ? object.description : ""
                }),
                $("<label></label>", { for: "udfId", text: "Udf Id" }),
                $("<input />", {
                    type: "text",
                    name: "udfId",
                    val: "udfId" in object ? object.description : ""
                })
            );
            break;
        case "matchers":
            formContainer.append(
                $("<label></label>", { for: "name", text: "Name:" }),
                $("<input />", {
                    type: "text",
                    name: "name",
                    val: "name" in object ? object.name : ""
                }),
                $("<label></label>", { for: "friendlyName", text: "Friendly Name:" }),
                $("<input />", {
                    type: "text",
                    name: "friendlyName",
                    val: "friendlyName" in object ? object.friendlyName : ""
                }),
                $("<label></label>", { for: "description", text: "Description:" }),
                $("<input />", {
                    type: "text",
                    name: "description",
                    val: "description" in object ? object.description : ""
                }),
                $("<label></label>", { for: "conditions", text: "Conditions:" }),
                $("<input />", {
                    type: "text",
                    name: "conditions",
                    val: "conditions" in object ? object.description : ""
                })
            );
            break;
        default:
            return;
    }

    // Let's animate the drawer to show it.
    $("#infoPanelDrawer").addClass("show");

    // We need to understand which data for the select menu's for the Types we need to load.
    var selectTypes = []; // Array of all select elements
    var typesToLoad = []; // Array of all the types we need to load.
    formContainer.find("select").map(function () {
        selectTypes.push($(this));
        typesToLoad.push($(this).attr("title"));
    });

    // Make the API call to get all the types we need.
    getDigitalTwinsTypes(typesToLoad, function (data) {
        formContainer.find("select").empty(); //Empty all the select elements.
        data.forEach(function (type) {
            // Let's see in which select this type needs to be added.
            selectTypes.forEach(function (selectType) {
                if (selectType.attr("title") == type.category) {
                    var name = type.friendlyName ? type.friendlyName : type.name;
                    selectType.append(
                        "<option value=" +
                        type.id +
                        ">" +
                        name +
                        " (ID: " +
                        type.id +
                        ")</option>"
                    );
                }
            });
        });
        // Let's set the correct value for all the select menu's now that we've loaded all the options.
        selectTypes.forEach(function (selectType) {
            selectType.val(object[selectType.attr("name")]);
        });
    });
}

function showDeleteObjectForm(object) {
    // Let's hide all the forms.
    $("#infoPanelDrawer form").hide();
    // Let's get the form we want to show, reset it's content and make it visible.
    var form = $("#infoPanelDrawer form[name='deleteObject']");
    form.trigger("reset").show();
    form.find("h3").text("Delete " + object.label);
    // Let's animate the drawer to show it.
    $("#infoPanelDrawer").addClass("show");

    var allChildren = getChildren(object, []);
    if (allChildren.length) {
        var tableBody = form.find("tbody").empty();
        allChildren.forEach(function (child) {
            tableBody.append(
                '<tr><td class="glyph ' +
                child.type +
                '">' +
                child.label +
                "</td><td>" +
                child.id +
                "</td></tr>"
            );
        });
        form
            .find("p")
            .html(
                "This action will also delete all <strong>" +
                allChildren.length +
                "</strong> child objects"
            );
        form.find("table").show();
    } else {
        form.find("p").text("This object has no children");
        form.find("table").hide();
    }
}

// Function that submits the object Form for Add, Edit and Delete.
function submitObjectForm(form) {
    $("#panelLoaderIcon").show();

    var deferred = $.Deferred();
    // Make sure we call the right function based on which form is submitted.
    switch (form.attr("name")) {
        case "addObject":
            var json = formDataToJson(form.serializeArray());
            var type = json.type;
            json.type = null;
            addObject(type, json, function (s) {
                deferred.resolve(s);
            });
            var successMessage =
                "<strong>" + json.name ? json.name : json.hardwareId + "</strong> was succesfully created.";
            break;
        case "editObject":
            var json = formDataToJson(form.serializeArray());
            updateObject(selectedNode, json, function (s) {
                deferred.resolve(s);
            });
            var successMessage =
                "<strong>" + selectedNode.label + "</strong> was succesfully updated.";
            break;
        case "deleteObject":
            deleteObject(selectedNode, function (s) {
                deferred.resolve(s);
            });
            var successMessage =
                "<strong>" + selectedNode.label + "</strong> was succesfully deleted.";
            break;
        case "apiForm":
            var json = formDataToJson(form.serializeArray());
            executeApiDigitalTwinJSON(json.apiCall, json.apiMethod, json.apiJSON, function (s) {
                apiJsonToTable(s, "JSON Output");
                apiJSONOutput.value = JSON.stringify(s, undefined, 4);
                if (!(json.apiMethod === "GET")) {
                    refreshData();
                }
                deferred.resolve(s);
            });
            break;
        default:
            console.log("Unknown Form.");
            break;
    }

    // When the call is complete, show the alert message.
    $.when(deferred).done(function (response) {
        if (!response.error) {
            showAlert(
                "success",
                "Success",
                successMessage ? successMessage : "It was successful."
            );
        } else {
            showAlert(
                "error",
                "Error",
                response.error.message
            );
        }
        // Reset the loaded icon and hide the object form drawer.
        $("#panelLoaderIcon").hide();
        $("#infoPanelDrawer").removeClass("show");
    });

    // Helper function to transform the form data into json.
    function formDataToJson(data) {
        var json = {};
        for (var i = 0; i < data.length; i++) {
            if (data[i]["value"]) {
                json[data[i]["name"]] = data[i]["value"];
            }
        }
        return json;
    }
}

function hideObjectForm() {
    $("#infoPanelDrawer").removeClass("show");
}

// Function that will create the tables from the json.
function jsonToTable(json, tableName) {
    
    if (!json || json.length < 1) return;
    // Create the basic elements
    var table = $("<table class='collapsable'></table>");
    var caption = $(
        "<caption>" + ucFirst(tableName.toString()) + "</caption>"
    ).on("click", function () {
        table.toggleClass("collapsed");
    });
    table.append(caption);
    var tableBody = table.append("<tbody></tbody>");

    // Depending on the table we want to show, we handle the data differently.
    switch (tableName) {
        case "info":
            $.each(json, function (k, v) {
                // We don't want to show the nested arrays/json's in this table.
                if (
                    v.constructor != {}.constructor &&
                    v.constructor != [].constructor
                ) {
                    tableBody.append(
                        "<tr><td>" + k + "</td><td>" + v.toString() + "</td></tr>"
                    );
                }
            });
            break;
        case "values": // Used for values of Space objects
            $.each(json, function (k, v) {
                tableBody.append(
                    "<tr><td>" +
                    v.type +
                    "</td><td>" +
                    v.value +
                    "</td><td>" +
                    v.timestamp +
                    "</td></tr>"
                );
            });
            break;
        case "value": // Used for the value of a Sensor
            tableBody.append(
                "<tr><td>" +
                json.type +
                "</td><td>" +
                json.value +
                "</td><td>" +
                json.timestamp +
                "</td></tr>"
            );

            break;
        case "conditions":
            $.each(json, function (k, v) {
                tableBody.append(
                    "<tr><td>" + v.name + "</td><td>" + v.value + "</td></tr>"
                );
            });
            break;
        case "matchers":
            $.each(json, function (k, v) {
                tableBody.append(
                    "<tr><td>" + v.name + "</td><td>" + v.value + "</td></tr>"
                );
            });
            break;
        case "userDefinedFunctions":
            $.each(json, function (k, v) {
                tableBody.append(
                    "<tr><td>" + v.name + "</td><td>" + v.value + "</td></tr>"
                );
            });
            break;
        case "properties":
            $.each(json, function (k, v) {
                tableBody.append(
                    "<tr><td>" + v.name + "</td><td>" + v.value + "</td></tr>"
                );
            });
            break;
        case "spacePaths":
            $.each(json, function (k, v) {
                tableBody.append("<tr><td>" + v + "</td></tr>");
            });
            break;
        case "JSON":
            tableBody.append("<tr><td><textarea rows='10' disabled='true'>" + JSON.stringify(json, undefined, 4) + "</textarea></td></tr>");
            break;
        default:
            break;
    }
    $("#infoPanelContent> div.info").append(table);
}

// Function that will create the API json tables from the json.
function apiJsonToTable(json, tableName) {
    if (!json || json.length < 1) return;
    // Create the basic elements
    var table = $("<table class='collapsable'></table>");
    var caption = $(
        "<caption>" + ucFirst(tableName.toString()) + "</caption>"
    ).on("click", function () {
        table.toggleClass("collapsed");
    });
    table.append(caption);
    var tableBody = table.append("<tbody></tbody>");
    tableBody.append("<tr><td>" + JSON.stringify(json, null, 2) + "</td></tr>");

    $("#apiPanelContent> div.info").append(table);
}


function ucFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
