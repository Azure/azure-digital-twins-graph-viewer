// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

// Show the info panel with the info of the selected node.
function showInfoPanel(d) {
    // Reset everything.
    $("#infoPanelContent > div.info").empty(); // Remove any old info
    $("#panelLoaderIcon").show();
    $("#infoPanel > header").removeClass("space device sensor").addClass(d.type);
    $("#infoPanel h2").text(d.label).removeClass("space device sensor").addClass(d.type);
    $("#infoPanelDrawer.show").removeClass("show");
    $("#infoPanel").addClass("open"); // Open the panel

    if (d.type == "space") {
        $("#infoPanel > header > ul.action-menu > li.add").show();
    } else {
        $("#infoPanel > header > ul.action-menu > li.add").hide();
    }

    // Let's get all the info from the selected element by firing a new API request.
    getDigitalTwinsObject(d.id, d.type, function(data) {        
        $("#panelLoaderIcon").hide();
        // Let's turn the json into HTML tables. First table we will name "Info"
        jsonToTable(data, "Info");
        
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
    if (parent.type != "space") return;
    // Let's hide all the forms.
    $("#infoPanelDrawer form").hide();
    // Let's get the form we want to show, reset it's content and make it visible.
    var form = $("#infoPanelDrawer form[name='addObject']")
    form.trigger("reset").show();
    // Get the form container.
    var formContainer = form.find("div.form-container");
    formContainer.empty();
    
    // We only handle creation of space objects for now.
    switch (type) {
        case "space":
            formContainer.append(
                $("<label></label>", { for: 'name', text: 'Name:'}),
                $("<input />", { type: 'text', name: 'name' }),
                $("<label></label>", { for: 'friendlyName', text: 'Friendly Name:'}),
                $("<input />", { type: 'text', name: 'friendlyName' }),
                $("<label></label>", { for: 'description', text: 'Description:'}),
                $("<input />", { type: 'text', name: 'description' }),
                $("<label></label>", { for: 'typeId', text: 'Type:'}),
                $("<select></select>", {name: 'typeId', title: 'SpaceType'}).append("<option>Loading...</option>"),
                $("<label></label>", { for: 'subtypeId', text: 'Subtype:'}),
                $("<select></select>", {name: 'subtypeId', title: 'SpaceSubtype'}).append("<option>Loading...</option>"),
                $("<label></label>", { for: 'parentSpaceId', text: 'Parent Space ID:'}),
                $("<input />", { type: 'text', name: 'parentSpaceIdDisabled', disabled: true, val: parent.id }),
                // Hidden field is needed since a disabled field is not passed when submitting.
                $("<input />", { name: 'parentSpaceId', hidden: true, val: parent.id })
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
    formContainer.find("select").map(function() {
        selectTypes.push($(this));
        typesToLoad.push($(this).attr("title"));
    });

    // Make the API call to get all the types we need.
    getDigitalTwinsTypes(typesToLoad, function (data) {
        formContainer.find("select").empty(); //Empty all the select elements.
        data.forEach(function (type) {
            // Let's see in which select this type needs to be added.
            selectTypes.forEach(function (selectType) {
                if (selectType.attr('title') == type.category) {
                    var name = type.friendlyName ? type.friendlyName : type.name;
                    selectType.append("<option value="+type.id+">"+name+" (ID: "+type.id+")</option>");
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
    var form = $("#infoPanelDrawer form[name='editObject']")
    form.trigger("reset").show();
    var formContainer = form.find("div.form-container");
    formContainer.empty();

    switch (object.type) {
        case "space":
            formContainer.append(
                $("<label></label>", { for: 'name', text: 'Name:'}),
                $("<input />", { type: 'text', name: 'name', val: ("name" in object) ? object.name : ''}),
                $("<label></label>", { for: 'friendlyName', text: 'Friendly Name:'}),
                $("<input />", { type: 'text', name: 'friendlyName', val: ("friendlyName" in object) ? object.friendlyName : ''}),
                $("<label></label>", { for: 'description', text: 'Description:'}),
                $("<input />", { type: 'text', name: 'description', val: ("description" in object) ? object.description : ''}),
                $("<label></label>", { for: 'typeId', text: 'Type:'}),
                $("<select></select>", {name: 'typeId', title: 'SpaceType'}).append("<option>Loading...</option>"),
                $("<label></label>", { for: 'subtypeId', text: 'Subtype:'}),
                $("<select></select>", {name: 'subtypeId', title: 'SpaceSubtype'}).append("<option>Loading...</option>")
            );
            break;
        case "device":
            formContainer.append(
                $("<label></label>", { for: 'name', text: 'Name:'}),
                $("<input />", { type: 'text', name: 'name', val: ("name" in object) ? object.name : ''}),
                $("<label></label>", { for: 'friendlyName', text: 'Friendly Name:'}),
                $("<input />", { type: 'text', name: 'friendlyName', val: ("friendlyName" in object) ? object.friendlyName : ''}),
                $("<label></label>", { for: 'description', text: 'Description:'}),
                $("<input />", { type: 'text', name: 'description', val: ("description" in object) ? object.description : ''}),
                $("<label></label>", { for: 'hardwareId', text: 'Hardware ID:'}),
                $("<input />", { type: 'text', name: 'hardwareId', val: ("hardwareId" in object) ? object.hardwareId : ''}),
                $("<label></label>", { for: 'gatewayId', text: 'Gateway ID:'}),
                $("<input />", { type: 'text', name: 'gatewayId', val: ("gatewayId" in object) ? object.gatewayId : ''}),
                $("<label></label>", { for: 'typeId', text: 'Type:'}),
                $("<select></select>", {name: 'typeId', title: 'DeviceType'}).append("<option>Loading...</option>"),
                $("<label></label>", { for: 'subtypeId', text: 'Subtype:'}),
                $("<select></select>", {name: 'subtypeId', title: 'DeviceSubtype'}).append("<option>Loading...</option>")
            );
            break;
        case "sensor":
            formContainer.append(
                $("<label></label>", { for: 'port', text: 'Port:'}),
                $("<input />", { type: 'text', name: 'port', val: ("port" in object) ? object.port : ''}),
                $("<label></label>", { for: 'hardwareId', text: 'Hardware ID:'}),
                $("<input />", { type: 'text', name: 'hardwareId', val: ("hardwareId" in object) ? object.hardwareId : ''}),
                $("<label></label>", { for: 'pollRate', text: 'Poll Rate:'}),
                $("<input />", { type: 'text', name: 'pollRate', val: ("pollRate" in object) ? object.pollRate : ''}),
                $("<label></label>", { for: 'typeId', text: 'Type:'}),
                $("<select></select>", {name: 'typeId', title: 'SensorType'}).append("<option>Loading...</option>"),
                $("<label></label>", { for: 'portTypeId', text: 'Port Type:'}),
                $("<select></select>", {name: 'portTypeId', title: 'SensorPortType'}).append("<option>Loading...</option>"),
                $("<label></label>", { for: 'dataTypeId', text: 'Data Type:'}),
                $("<select></select>", {name: 'dataTypeId', title: 'SensorDataType'}).append("<option>Loading...</option>"),
                $("<label></label>", { for: 'dataSubtypeId', text: 'Data Subtype:'}),
                $("<select></select>", {name: 'dataSubtypeId', title: 'SensorDataSubtype'}).append("<option>Loading...</option>"),
                $("<label></label>", { for: 'dataUnitTypeId', text: 'Data Unit Type:'}),
                $("<select></select>", {name: 'dataUnitTypeId', title: 'SensorDataUnitType'}).append("<option>Loading...</option>")
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
    formContainer.find("select").map(function() {
        selectTypes.push($(this));
        typesToLoad.push($(this).attr("title"));
    });

    // Make the API call to get all the types we need.
    getDigitalTwinsTypes(typesToLoad, function (data) {
        formContainer.find("select").empty(); //Empty all the select elements.
        data.forEach(function (type) {
            // Let's see in which select this type needs to be added.
            selectTypes.forEach(function (selectType) {
                if (selectType.attr('title') == type.category) {
                    var name = type.friendlyName ? type.friendlyName : type.name;
                    selectType.append("<option value="+type.id+">"+name+" (ID: "+type.id+")</option>");
                }
            });
        });
        // Let's set the correct value for all the select menu's now that we've loaded all the options.
        selectTypes.forEach(function (selectType) {
            selectType.val(object[selectType.attr('name')]);
        }); 
    }); 
}

function showDeleteObjectForm(object) {
    // Let's hide all the forms.
    $("#infoPanelDrawer form").hide();
    // Let's get the form we want to show, reset it's content and make it visible.
    var form = $("#infoPanelDrawer form[name='deleteObject']")
    form.trigger("reset").show();
    form.find("h3").text("Delete "+object.label);
    // Let's animate the drawer to show it.
    $("#infoPanelDrawer").addClass("show");

    var allChildren = getChildren(object, []);
    if (allChildren.length) {
        var tableBody = form.find("tbody").empty();
        allChildren.forEach(function(child) {
            tableBody.append('<tr><td class="glyph '+child.type+'">'+child.label+'</td><td>'+child.id+'</td></tr>')
        })
        form.find("p").html("This action will also delete all <strong>"+allChildren.length+"</strong> child objects")
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
            addObject("space", json, function(s) { deferred.resolve(s); });
            var successMessage = "<strong>"+json.name+"</strong> was succesfully created.";
            break;
        case "editObject":
            var json = formDataToJson(form.serializeArray());
            updateObject(selectedNode, json, function(s) { deferred.resolve(s); });
            var successMessage = "<strong>"+selectedNode.label+"</strong> was succesfully updated.";
            break;
        case "deleteObject":
            deleteObject(selectedNode, function(s) { deferred.resolve(s); });
            var successMessage = "<strong>"+selectedNode.label+"</strong> was succesfully deleted."; 
            break;
        default:
            console.log("Unknown Form.");
            break;
    }

    // When the call is complete, show the alert message.
    $.when(deferred).done(function (success) {
        if (success === true) {
            showAlert("success", 
                "Success", 
                successMessage ? successMessage : "It was successful."
            );
        } else {
            showAlert("error", 
                "Error", 
                "You probably don't have permissions to update the model."
            );
        }
        // Reset the loaded icon and hide the object form drawer.
        $("#panelLoaderIcon").hide();
        $("#infoPanelDrawer").removeClass("show");
    });

    // Helper function to transform the form data into json.
    function formDataToJson(data) {
        var json = {};
        for (var i = 0; i < data.length; i++){
            if (data[i]['value']) {
                json[data[i]['name']] = data[i]['value'];
            }
        }
        return json;
    }
}

function hideObjectForm() {
    $("#infoPanelDrawer").removeClass("show");
}

// Recursive function that will tranform json into an HTML table for the side panel.
// We may have nested json or arrays in the result, we want to create a new table for each.
function jsonToTable(json, name) {
    if (!json || json.length < 1) return;

    // Create the basic elements
    var table = $("<table class='collapsable'></table>");
    var caption = $("<caption>"+name+"</caption>").on("click", function() {
        table.toggleClass("collapsed");
    });
    table.append(caption);
    var tableBody = table.append("<tbody></tbody>");

    // Iterate trough the json so we can create a new row for each element in the json.
    $.each(json, function(k,v) {
        // Filtering out the historical values for now.
        if (k != "historicalValues") {
            k = ucFirst(k.toString());
            // If the value is a nested json or array, call this function again to create a new table.
            if (v.constructor === {}.constructor || v.constructor === [].constructor) {
                jsonToTable(v, k);
            } else {
                // Let's create a new row.
                tableBody.append("<tr><td>"+k+"</td><td>"+v.toString()+"</td></tr>");
            }
        }
    });
    // Finally, add the table to the content div of the info panel.
    $("#infoPanelContent> div.info").prepend(table);
}

function ucFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
