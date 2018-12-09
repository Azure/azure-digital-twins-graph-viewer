/*
Copyright (c) 2013-2016, Rob Schmuecker
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* The name Rob Schmuecker may not be used to endorse or promote products
  derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL MICHAEL BOSTOCK BE LIABLE FOR ANY DIRECT,
INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

// Variables that will hold the data of the tree
var treeData, tree, root;
// Set the width and height of the nodes
var nodeWidth = 180;
var nodeHeight = 26;
// variable for more info on the node
var selectedNode, targetNode, draggingNode;
// panning variables
var panSpeed = 200;
var panBoundary = 20; // Within 20px from edges will pan when dragging.
// Misc. variables
var i = 0;
var animationDuration = 750;
var recursiveCounter = 0;

// size of the diagram and basic variables for the SVG elements.
var viewerWidth, viewerHeight;
var baseSVG, svgGroup, zoomSlider;

// define a d3 diagonal projection for use by the node paths later on.
var diagonal = d3.svg.diagonal()
    .source(function(d) {
        return {"x":d.source.x, "y":d.source.y+(nodeWidth/2)};
    })
    .target(function(d) {
        return {"x":d.target.x, "y":d.target.y-(nodeWidth/2)}
    })
    .projection(function (d) {
        return [d.y, d.x];
    });

//Initialization function to be called when data is refreshed.
function initializeGraphVisualizer(data) {
    treeData = data;
    selectedNode, targetNode, draggingNode = null;
    // size of the diagram
    viewerWidth = $("#graphContent").width();
    viewerHeight = $("#graphContent").height();

    // Create the tree object.
    tree = d3.layout.tree()
    .size([viewerHeight, viewerWidth]);

    // define the baseSvg, attaching a class for styling and the zoomListener
    baseSvg = d3.select("#graphContent").append("svg")
    .attr("class", "overlay")
    .call(zoomListener);

    // Create the defs that will hold clipping and shadow paths.
    var svgDefs = baseSvg.append("defs")

    // Create a clippath for the clipping of the nodes so they will have rounded corners
    svgDefs.append("clipPath")
        .attr("id", "nodeClipPath").append("rect")
        .attr("width", nodeWidth)
        .attr("height", nodeHeight)
        .attr('y', (nodeHeight/2) * -1)
        .attr('x', (nodeWidth/2) * -1)
        .attr("rx", 3)
        .attr("ry", 3);

    // Create the clip path for the node text so they don't interfere with the expand/collapse button
    svgDefs.append("clipPath")
        .attr("id", "nodeTextClipPath").append("rect")
            .attr("width", nodeWidth - nodeHeight - 30)
            .attr("height", nodeHeight)
            .attr('y', (nodeHeight/2) * -1)
            .attr("x", nodeHeight+5+(nodeWidth/2) * -1);

    svgDefs.append("clipPath")
        .attr("id", "nodeClipPathLarge").append("rect")
        .attr("width", nodeWidth+50)
        .attr("height", nodeHeight)
        .attr('y', (nodeHeight/2) * -1)
        .attr('x', (nodeWidth/2) * -1)
        .attr("rx", 3)
        .attr("ry", 3);

    // Create the filter for drop shadow
    var shadow = svgDefs.append("filter")
        .attr("id", "dropShadow")
        .attr("height", "130%");

    // stdDeviation is how much to blur
    shadow.append("feGaussianBlur")
        .attr("in", "SourceAlpha")
        .attr("stdDeviation", 4);

    // Blur offset
    shadow.append("feOffset")
        .attr("dy", 2)
        .attr("result", "offsetblur");

    // Opacity of the shadow
    shadow.append("feComponentTransfer").append("feFuncA")
        .attr("type", "linear")
        .attr("slope", 0.5);

    var shadowMerge = shadow.append("feMerge");

    // Offset blurred image
    shadowMerge.append("feMergeNode");
    // this contains the element that the filter is applied to
    shadowMerge.append("feMergeNode")
        .attr("in", "SourceGraphic");

    // Append a group which holds all nodes and which the zoom Listener can act upon.
    svgGroup = baseSvg.append("g");

    // Set the zoom slider and on input change the zoomListener.
    zoomSlider = d3.select("#zoomSlider")
    .attr("min", zoomListener.scaleExtent()[0])
    .attr("max", zoomListener.scaleExtent()[1])
    .attr("step", (zoomListener.scaleExtent()[1] - zoomListener.scaleExtent()[0]) / 100)
    .attr("value", zoomListener.scaleExtent()[1])
    .on("input", function() {
        var center = [viewerWidth / 2, viewerHeight / 2],
        translate = zoomListener.translate(),
        translate0 = [],
        l = [],
        view = {x: translate[0], y: translate[1], k: zoomListener.scale()}

        translate0 = [(center[0] - view.x) / view.k, (center[1] - view.y) / view.k];
        view.k = this.value;
        l = [translate0[0] * view.k + view.x, translate0[1] * view.k + view.y];

        view.x += center[0] - l[0];
        view.y += center[1] - l[1];

        zoomListener.scale(this.value).translate([view.x, view.y]).event(svgGroup);
    });

    // Define the root
    root = treeData;
    root.x0 = viewerHeight / 2;
    root.y0 = 0;

    // Let's sort the tree.
    sortTree();
    // Let's show all the object types that we want to show.
    showObjectTypes();
}

// Helper recursive function that get's all the children of a node.
// Returns a flat array
function getChildren(parent, returnArr) {
    recursiveCounter++;
    var children = (parent.children || (parent.children = [])).concat((parent._children || (parent._children = [])));
    if (children.length) {
        children.forEach(function (child) {
            returnArr.push(child);
            getChildren(child, returnArr);
        })
    }
    recursiveCounter--;
    if (recursiveCounter == 0) {
        return returnArr;
    }
}

// Recursive function to collapse or expand all nodes of a certain type.
function updateChildren(parent, types) {
    recursiveCounter++;
    if (!parent) return;
    // Let's first get all the child nodes (both hidden and visible) and reset the child count.
    var children = (parent.children || (parent.children = [])).concat((parent._children || (parent._children = [])));
    if (children.length) {
        // We clear out all the children of the parent so we can add them later to the correct group.
        parent.children = [];
        parent._children = [];
        children.forEach(function(child) {
            // Check if this is something we want to show..
            if (types.includes(child.type)) {
                parent.children.push(child);
            } else {
                parent._children.push(child);
            }
            // Run the same function for every child.
            updateChildren(child, types);
        });
    }
    recursiveCounter--;
    // If we have looped through all the items, update the view and center on the root node.
    if (recursiveCounter == 0 && root) {
        updateGraphVisualizer(root, false);
        centerNode(root, false);
    }
}

// Function that will check which objects types should be collapsed..
function showObjectTypes() {
    var objectTypesToShow = [];
    $("#showSubMenu").find("li.selected > span").each(function() {
            objectTypesToShow.push($(this).attr("class"));
        });
    updateChildren(treeData, objectTypesToShow);
}

// Toggle children function
function toggleChildren(d) {
    // node has hidden children we want to show. If it has no hidden children, we want to collapse.
    if (d._children.length) {
        d.children = (d.children || (d.children = [])).concat(d._children);
        d._children = [];
    } else { // collapse
        if (d.children.length) {
            d._children = d.children;
            d.children = [];
        }
    }
    return d;
}

// Toggle children on click collpase.
function collapseClicked(d) {
    if (d3.event.defaultPrevented) return; // click suppressed
    d = toggleChildren(d);
    svgGroup.selectAll("g.node").sort(function (a, b) { // select the parent and sort the path's
        if (a.id != d.id) return -1; // a is not the dragged element, send "a" to the back
        else return 1; // a is the dragged element, bring "a" to the front
    });
    updateGraphVisualizer(d, true);
    centerNode(d, true);
}

// Function to sort the tree.
function sortTree() {
    tree.sort(function (a, b) {
        return b.label.toLowerCase() < a.label.toLowerCase() ? 1 : -1;
    });
}

// Adding a new node to the graph
function addNodeToGraph(node) {
    // We first need to find the parent of the new node, so we know where we can add it.
    findParent(treeData);

    function findParent(parent) {
        if (!parent) return;
        // Let's first get all the child nodes (both hidden and visible) and reset the child count.
        var children = (parent.children || (parent.children = [])).concat((parent._children || (parent._children = [])));
        if (children.length) {
            children.forEach(function(child) {
                // Check if this is the parent of the new node
                if (node.parentSpaceId == child.id) {
                    // Add it to the model.
                    (child.children || (child.children = [])).push(node);
                    child.childCount++;
                    sortTree();
                    // Call update of the graph to have the new node added.
                    updateGraphVisualizer(child, true);
                    // Let's select our new node.
                    selectNode(node, false);
                    return;
                } else {
                    // This is not the parent, so let's rerun this function for the child.
                    findParent(child);
                }
            });
        }
    }
}

// Update the nodes for the graph with new data.
function updateNodeInGraph(node, data) {
    $.each(data, function(k,v) {
        node[k] = v;
    })
    var domNode = d3.select('[id="'+node.id+'"]');
    domNode.select("text.nodeText").text(node.label);
    showInfoPanel(node);
}

// Removing a node from the graph after a delete.
function removeNodeFromGraph(node) {
    // Remove the domNode
    var domNode = d3.select('[id="'+node.id+'"]');
    domNode.select("g.scaler").transition().duration(300).attr("transform", "scale(0)").remove();

    // Remove it's children.
    var children = getChildren(node, []);
    if (children.length) {
        children.forEach(function(child) {
            var childDomNode = d3.select('[id="'+child.id+'"]');
            childDomNode.select("g.scaler").transition().duration(300).attr("transform", "scale(0)").remove();
        })
    }

    // Remove from the model.
    var index = node.parent.children.indexOf(node);
    if (index > -1) {
        node.parent.children.splice(index, 1);
        node.parent.childCount--;
    }

    // Update everything.
    if (selectedNode == node) deselectNode(node, true);
    updateGraphVisualizer(node.parent, true);
    hideInfoPanel();
    centerNode(node.parent, true);
}

// This function will redraw the graph.
function updateGraphVisualizer(source, animated) {
    // Compute the new height, function counts total children of root node and sets tree height accordingly.
    // This prevents the layout looking squashed when new nodes are made visible or looking sparse when nodes are removed
    // This makes the layout more consistent.
    var duration = animated ? animationDuration : 0;
    var levelWidth = [1];
    var childCount = function (level, n) {
        if (n.children && n.children.length > 0) {
            if (levelWidth.length <= level + 1) levelWidth.push(0);
            levelWidth[level + 1] += n.children.length;
            n.children.forEach(function (d) {
                childCount(level + 1, d);
            });
        }
    };
    childCount(0, treeData);
    var newHeight = d3.max(levelWidth) * (nodeHeight * 2.25); // add some padding per row
    tree = tree.size([newHeight, viewerWidth]);

    // Compute the new tree layout.
    var nodes = tree.nodes(treeData).reverse(),
        links = tree.links(nodes);

    // Set widths between levels based on maxLabelLength.
    nodes.forEach(function (d) {
        d.y = (d.depth * (nodeWidth+160))
    });

    // Update the nodes…
    node = svgGroup.selectAll("g.node")
        .data(nodes, function (d) {
            return d.id || (d.id = ++i);
        });

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("g")
        .call(dragListener)
        .attr("class", "node")
        .attr("id", function (d) {
            return d.id
        })
        .attr("transform", function (d) {
            return "translate(" + source.y0 + "," + source.x0 + ")";
        });

    var nodeContainer = nodeEnter.append("g")
        .attr("class", "scaler")
        .attr("transform", "scale(1)")
        .attr("style", "clip-path: url(#nodeClipPath);");

    nodeContainer.append("rect")
        .attr("class", "nodeContainer")
        .attr('width', nodeWidth)
        .attr('height', nodeHeight)
        .attr('y', (nodeHeight/2) * -1)
        .attr('x', (nodeWidth/2) * -1)
        .on("click", function (d) {
            nodeClicked(d, this.parentNode);
        })
        .on("mouseover", function(d) {
            nodeMouseOver(d);
        })
        .on("mouseout", function(d) {
            nodeMouseOut(d);
        });

    nodeContainer.append("rect")
        .attr('class', function (d) {
            return 'nodeIndicator '+d.type;
        })
        .attr('width', nodeHeight)
        .attr('height', nodeHeight)
        .attr('y', (nodeHeight/2) * -1)
        .attr('x', (nodeWidth/2) * -1)
        .attr("pointer-events", "none");

    // Add the icon for the indicator based on their type.
    nodeContainer.append("text")
        .attr("class", "nodeIndicatorType")
        .attr("x", ((nodeWidth/2) * -1) + 5)
        .attr("text-anchor", "start")
        .attr("y", 8)
        .attr("pointer-events", "none")
        .text(function (d) {
            switch (d.type) {
                case "space": return "";
                case "device": return "";
                case "sensor": return "";
                default: return "";
            }
        })

    nodeContainer.append("text")
        .attr("x", nodeHeight+5+(nodeWidth/2) * -1)
        .attr("y", 4.5)
        .attr('class', 'nodeText')
        .attr("width", nodeWidth)
        .attr("text-anchor", "start")
        .text(function (d) {
            return d.label;
         })
        .attr("style", "clip-path: url(#nodeTextClipPath);")
        .attr("pointer-events", "none");

    // Create the drag indicator that shows when item can be dragged there..
    // We cannot drag sensors.. so we don't create one if the node is a sensor.
    var nodeDragIndicator = nodeEnter.filter(function(d){
            return (d.type != "sensor");
        })
        .append("g")
        .attr("class", "addIndicator");

    nodeDragIndicator.append("rect")
        .attr("width", 76)
        .attr("height", 16)
        .attr("x", -38)
        .attr("y", -34)
        .attr("rx", 8)
        .attr("ry", 8);

    nodeDragIndicator.append("text")
        .text("MOVE HERE")
        .attr("y", -22)
        .attr("width", 76)
        .attr("text-anchor", "middle");

    // Add a collapse button if the node has children
    // First clear all the nodeCollapse group that holds the elements so we can create new ones.
    node.selectAll("g.nodeCollapse").remove();

    var nodeCollapse = node.filter(function(d) {
            return (d.childCount > 0);
        })
        .select("g.scaler")
        .append("g")
        .attr("class", "nodeCollapse");

    nodeCollapse.append("rect")
        .attr("width", nodeHeight - 10)
        .attr("height", nodeHeight - 10)
        .attr("x", ((nodeWidth/2)-nodeHeight) + 5)
        .attr("y", ((nodeHeight/2) * -1) + 5)
        .attr("rx", 1)
        .attr("ry", 1)
        .attr("class", "collapse")
        .on('click', collapseClicked);

    nodeCollapse.append("text")
        .attr("x", (nodeWidth/2)-13)
        .attr("dy", 4)
        .attr("text-anchor", "middle")
        .attr("class", "collapseText")
        .attr("pointer-events", "none")
        .text(function(d) {
            return d._children.length ? "+" : "–";
        });

    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
        .duration(duration)
        .attr("transform", function (d) {
            return "translate(" + d.y + "," + d.x + ")";
        });

    // Transition exiting nodes to the parent's new position.
    var nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function (d) {
            return "translate(" + source.y + "," + source.x + ")";
        })
        .remove();

    // Update the links…
    var link = svgGroup.selectAll("path.link")
        .data(links, function (d) {
            return d.target.id;
        });

    // Enter any new links at the parent's previous position.
    link.enter().insert("path", "g")
        .attr("class", "link")
        .attr("d", function (d) {
            var o = {
                x: source.x0,
                y: source.y0
            };
            return diagonal({
                source: o,
                target: o
            });
        });

    // Transition links to their new position.
    link.transition()
        .duration(duration)
        .attr("d", diagonal);

    // Transition exiting nodes to the parent's new position.
    link.exit().transition()
        .duration(duration)
        .attr("d", function (d) {
            var o = {
                x: source.x,
                y: source.y
            };
            return diagonal({
                source: o,
                target: o
            });
        })
        .remove();

    // Stash the old positions for transition.
    nodes.forEach(function (d) {
        d.x0 = d.x;
        d.y0 = d.y;
    });
}

function nodeMouseOver(d) {
    var domNode = d3.select('[id="'+d.id+'"]');
    /* domNode.select(".nodeContainer")
        .transition()
        .duration(250)
        .attr("width", nodeWidth+50);
    domNode.select("g.scaler")
        .attr("style", "clip-path: url(#nodeClipPathLarge);");
    domNode.select("g.nodeCollapse")
        .transition()
        .duration(250)
        .attr("transform", "translate(50,0)"); */
}

function nodeMouseOut(d) {
    var domNode = d3.select('[id="'+d.id+'"]');
    /* domNode.select(".nodeContainer")
        .transition()
        .duration(250)
        .attr("width", nodeWidth)
        .each("end", function() {
            domNode.select("g.scaler").attr("style", "clip-path: url(#nodeClipPath);");
        });
    domNode.select("g.nodeCollapse")
        .transition()
        .duration(250)
        .attr("transform", "translate(0,0)"); */
}

// Center node and show info panel when node is clicked
function nodeClicked(d) {
    if (d3.event.defaultPrevented) return; // click suppressed

    // if the current selected node is clicked, deselect it. Otherwise just select the new node.
    if (selectedNode && d == selectedNode) {
        deselectNode(selectedNode, true);
        return;
    } else {
        selectNode(d, true);
    }
}

// Select this node.
function selectNode(d, animated) {
    deselectNode(selectedNode, true);
    centerNode(d, true);
    showInfoPanel(d);
    populateBreadCrumb(d);
    var duration = animated ? 400 : 0;
    d3.select('[id="'+d.id+'"]').select("rect.nodeIndicator").transition().duration(duration).attr("width", nodeWidth);
    selectedNode = d;
}

// Deselect the node.
function deselectNode(d, animated) {
    if (!d) return;
    var duration = animated ? 400 : 0;
    d3.select('[id="'+d.id+'"]').select("rect.nodeIndicator").transition().duration(duration).attr("width", nodeHeight);
    selectedNode = null;
}

// Function that will populate the breadcrumb
function populateBreadCrumb(d) {
    $("#breadCrumbList").empty();
    cycle(d);
    function cycle(d) {
        $("#breadCrumbList").prepend("<li><a>"+ d.label +"</a></li>");
        if (d.parent) {
            cycle(d.parent);
        }
    }
}

// Function to center node when clicked/dropped so node doesn't get lost when collapsing/moving with large amount of children.
function centerNode(node, animated) {
    scale = zoomListener.scale();
    duration = animated ? animationDuration : 0 ;
    x = -node.y0;
    y = -node.x0;
    x = x * scale + viewerWidth / 3;
    y = y * scale + viewerHeight / 2;
    svgGroup.transition()
        .duration(duration)
        .attr("transform", "translate(" + x + "," + y + ")scale(" + scale + ")");
    zoomListener.scale(scale);
    zoomListener.translate([x, y]);
}

// Define the drag listeners for drag/drop behaviour of nodes.
var dragListener = d3.behavior.drag()
    .on("dragstart", function (d) {
        // we cannot drag the root node or a sensor.
        if (d == root || d.type == "sensor") {
            return;
        }
        dragStarted = true;
        nodes = tree.nodes(d);
        d3.event.sourceEvent.stopPropagation();
        // it's important that we suppress the mouseover event on the node being dragged. Otherwise it will absorb the mouseover event and the underlying node will not detect it d3.select(this).attr('pointer-events', 'none');
    })
    .on("drag", function (d) {
        if (d == root || d.type == "sensor") {
            return;
        }
        if (dragStarted) {
            domNode = this;
            initiateDrag(d, domNode);
        }

        // get coords of mouseEvent relative to svg container to allow for panning
        relCoords = d3.mouse($('svg').get(0));
        if (relCoords[0] < panBoundary) {
            panTimer = true;
            pan(this, 'left');
        } else if (relCoords[0] > ($('svg').width() - panBoundary)) {

            panTimer = true;
            pan(this, 'right');
        } else if (relCoords[1] < panBoundary) {
            panTimer = true;
            pan(this, 'up');
        } else if (relCoords[1] > ($('svg').height() - panBoundary)) {
            panTimer = true;
            pan(this, 'down');
        } else {
            try {
                clearTimeout(panTimer);
            } catch (e) {

            }
        }

        d.x0 += d3.event.dy;
        d.y0 += d3.event.dx;
        var node = d3.select(this);
        node.attr("transform", "translate(" + d.y0 + "," + d.x0 + ")");
    }).on("dragend", function (d) {
        if (d == root || d.type == "sensor") {
            return;
        }
        domNode = this;
        // if a node is selected, do the transfer. else just stop dragging.
        if (targetNode) {
            var dragActionComplete = $.Deferred();

            // we need to copy the targeted node into a new variable, because the 'targetNode' variable might be cleared because cursor moved before ajax call was done.
            var newParent = targetNode;
            // we also want to keep track of the previous parent.
            var oldParent = draggingNode.parent;
            objectDragAction(draggingNode, newParent, function (d) { dragActionComplete.resolve(d); });

            $.when(dragActionComplete).done(function (isSuccess) {
                // if the call to Digital Twins was successful, make the transfer:
                if (isSuccess) {
                    // now remove the element from the parent, and insert it into the new elements children
                    var index = draggingNode.parent.children.indexOf(draggingNode);
                    if (index > -1) {
                        draggingNode.parent.children.splice(index, 1);
                    }
                    (newParent.children || (newParent.children = [])).push(draggingNode);
                    newParent.childCount++;
                    oldParent.childCount--;

                    sortTree();
                }

                // end the drag whether there was success or not
                endDrag();
            });

        } else {
            endDrag();
        }
    });

// Handle the UI updates when a drag starts
function initiateDrag(d, domNode) {
    draggingNode = d;

    // Setup everything for all the other nodes, except the one we are dragging.
    d3.selectAll(".node")
        .filter(function(d) {
            if (d != draggingNode && d.type == "space") { // We can only move something to a space.
                return d;
            }
        })
        .attr("pointer-events", "mouseover")
        .on("mouseover", function (node) {
            targetNode = node;
            d3.select(this).select("g.scaler").transition()
                .duration(300)
                .attr("transform", "scale(1.25)");
            d3.select(domNode).select("g.addIndicator")
                .attr("class", "addIndicator visible").select("text")
                    .text("ADD HERE");
        })
        .on("mouseout", function (node) {
            targetNode = null;
            d3.select(this).select("g.scaler").transition()
                .duration(300)
                .attr("transform", "scale(1)");
            d3.select(domNode).select("g.addIndicator").attr("class", "addIndicator");
        });


    // Setup everything for the dragging node..
    d3.select(domNode).attr('pointer-events', 'none')
        .attr('class', 'node activeDrag')
        .attr("style", "filter: url(#dropShadow);");

    svgGroup.selectAll("g.node").sort(function (a, b) { // select the parent and sort the path's
        if (a.id != draggingNode.id) return -1; // a is not the dragged element, send "a" to the back
        else return 1; // a is the dragged element, bring "a" to the front
    });
    // if nodes has children, remove the links and nodes
    if (nodes.length > 1) {
        // remove link paths
        links = tree.links(nodes);
        nodePaths = svgGroup.selectAll("path.link")
            .data(links, function (d) {
                return d.target.id;
            }).remove();
        // remove child nodes
        nodesExit = svgGroup.selectAll("g.node")
            .data(nodes, function (d) {
                return d.id;
            }).filter(function (d, i) {
                if (d.id == draggingNode.id) {
                    return false;
                }
                return true;
            }).remove();
    }

    // remove parent link
    parentLink = tree.links(tree.nodes(draggingNode.parent));
    svgGroup.selectAll('path.link').filter(function (d, i) {
        if (d.target.id == draggingNode.id) {
            return true;
        }
        return false;
    }).remove();

    dragStarted = null;
}

// Helper function when the drag is ended.
function endDrag() {
    // Reset all the nodes to their original status
    d3.selectAll(".node")
        .attr("pointer-events", "")
        .on("mouseover", "")
        .on("mouseout", "")
        .select("g.scaler")
            .transition()
            .duration(300)
            .attr("transform", "scale(1)");
    // now restore the mouseover event or we won't be able to drag a 2nd time
    d3.select(domNode)
        .attr('pointer-events', '')
        .attr('class', 'node')
        .attr("style", "")
        .select("g.addIndicator")
            .attr("class", "addIndicator");
    if (draggingNode !== null) {
        updateGraphVisualizer(draggingNode, true);
        draggingNode = null;
        targetNode = null;
    }
}

 // define the zoomListener which calls the zoom function on the "zoom" event constrained within the scaleExtents
 var zoomListener = d3.behavior.zoom()
    .scaleExtent([0.1, 1])
    .on("zoom", zoom);

// Define the zoom function for the zoomable tree
function zoom() {
    svgGroup.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    zoomSlider.property("value", d3.event.scale);
}

// TODO: Pan function, can be better implemented.
function pan(domNode, direction) {
    var speed = panSpeed;
    if (panTimer) {
        clearTimeout(panTimer);
        translateCoords = d3.transform(svgGroup.attr("transform"));
        if (direction == 'left' || direction == 'right') {
            translateX = direction == 'left' ? translateCoords.translate[0] + speed : translateCoords.translate[0] - speed;
            translateY = translateCoords.translate[1];
        } else if (direction == 'up' || direction == 'down') {
            translateX = translateCoords.translate[0];
            translateY = direction == 'up' ? translateCoords.translate[1] + speed : translateCoords.translate[1] - speed;
        }
        scaleX = translateCoords.scale[0];
        scaleY = translateCoords.scale[1];
        scale = zoomListener.scale();
        svgGroup.transition().attr("transform", "translate(" + translateX + "," + translateY + ")scale(" + scale + ")");
        d3.select(domNode).select('g.node').attr("transform", "translate(" + translateX + "," + translateY + ")");
        zoomListener.scale(zoomListener.scale());
        zoomListener.translate([translateX, translateY]);
        panTimer = setTimeout(function () {
            pan(domNode, speed, direction);
        }, 50);
    }
}

