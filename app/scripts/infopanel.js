// Show the info panel with the info of the selected node.
function showInfoPanel(d) {
    // Reset everything.
    $("#infoPanelContent > div").remove(); // Remove any old info
    $("#infopanel > ul.action-menu").hide();
    $("#panelLoaderIcon").show();
    $("#infoPanel h2").text(d.name).removeClass("space device sensor"); 
    $("#infoPanel").addClass("open"); // Open the panel
    $("#graphContent > svg").attr("width", 500);

    // Based on the object type, we want to style the header of the info panel.
    $("#infoPanel h2").addClass(d.type)

    // Let's get all the info from the selected element by firing a new API request.
    getDigitalTwinsObject(d, function(data) {        
        $("#infoPanelContent").prepend("<div></div>");
        $("#panelLoaderIcon").hide();
        // Let's turn the json into HTML tables. First table we will name "Info"
        jsonToTable(data, "Info");
        
    });
}

// Hide the info panel
function hideInfoPanel() {
    $("#infoPanel").removeClass("open");
    if (selectedNode) {
        centerNode(selectedNode, true);
    }
}

// Recursive function that will tranform json into an HTML table for the side panel.
// We may have nested json or arrays in the result, we want to create a new table for each.
function jsonToTable(json, name) {
    if (!json) return;

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
    $("#infoPanelContent> div").prepend(table);
}

function ucFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}