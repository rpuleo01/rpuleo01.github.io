// Function to display edge data in a table when a node is clicked
function displayEdgeData(connectedEdgeIds, allEdges) {
    var edgeTable = document.getElementById('edgeTable');
    edgeTable.innerHTML = '<tr><th>From</th><th>To</th><th>Date</th><th>Title</th><th>Link</th></tr>'; // Header row

    for (var i = 0; i < connectedEdgeIds.length; i++) {
        var edgeId = connectedEdgeIds[i];
        var edge = allEdges.get(edgeId);
        if (edge) {
            var linkHTML = edge.link ? '<a href="' + edge.link + '" target="_blank">Link</a>' : '';
            var row = '<tr>' +
                        '<td>' + edge.from + '</td>' +
                        '<td>' + edge.to + '</td>' +
                        '<td>' + (edge.standardized_date || '') + '</td>' +
                        '<td>' + (edge.title || '') + '</td>' +
                        '<td>' + linkHTML + '</td>' +
                      '</tr>';
            edgeTable.innerHTML += row;
        }
    }
}

// Fetching data from the Flask server and setting up the network
var container = document.getElementById('network');
var networkData = {
    nodes: new vis.DataSet(),  // Will populate with nodes data later
    edges: new vis.DataSet()  // Will populate with edges data later
};
var options = {
	physics:{enabled: true,
    barnesHut: {
      gravitationalConstant: -3000,
      centralGravity: 0.1,
      springLength: 95,
      springConstant: 0.04,
      damping: 0.5,
      avoidOverlap: 0
    }},
	nodes: {
         color: {
            background: '#000000', // Node background color
            border: '#000000',     // Node border color
            highlight: {
                background: '#333333', // Brighter color when highlighted
                border: '#333333'      // Brighter border color when highlighted
            },
            hover: {
                background: '#333333', // Brighter color when hovered
                border: '#333333'      // Brighter border color when hovered
            }
         },
         font: {
            color: '#FFFFFF',        // Text color
            face: 'Helvetica'   // Font type
        }
    }
};  // Network options can be specified here
var network = new vis.Network(container, networkData, options);

fetch('/data')
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {
        networkData.nodes.add(data.nodes);
        data.edges.forEach(edge => {
            edge.color = {
                color: relationColors[edge.relation] || "#000000" // Default color
            };
        });

        networkData.edges.add(data.edges);
	
	// Filter nodes based on the number of connected edges
        let filteredNodes = data.nodes.filter(node => {
            let connectedEdges = network.getConnectedEdges(node.id);
            return connectedEdges.length > 1;
        });

        // Clear and add filtered nodes
        networkData.nodes.clear();
        networkData.nodes.add(filteredNodes);

        network.on("click", function (params) {
            if (params.nodes.length > 0) {
                var nodeId = params.nodes[0];
                var connectedEdges = network.getConnectedEdges(nodeId);
                displayEdgeData(connectedEdges, networkData.edges);
            }
        });
    })
    .catch(function(error) {
        console.error('Error fetching data:', error);
    });
var relationColors = {
    "Joint Ventures": "#FF0000", // Red
    "Strategic Alliances": "#00FF00", // Green
    "Contract Teaming": "#0000FF",
    "Joint Product Development": "#FFA500",
    "Supplier-Customer Relationships": "#800080",
    "Competitive Dynamics": "#008080",
    "Investment and Financial Partnerships": "#FF00FF",
    "Research and Development Collaborations": "#00FF00", 
    "Legal and Licensing Agreements": "#A52A2A",
    "Mergers and Acquisitions": "#000080",
    "Policy and Standards Influence": "#FF7F50",
    "Cross-Sector and Specialized Partnerships": "#808000",
    "Distribution and Data Sharing": "#FFD700",
    "Technology Demonstration Partnerships": "#800000",
    "Regulatory Relationship": "#00FFFF"
    // Add more relation types and their corresponding colors
};

function populateLegendAndFilters() {
    var container = document.getElementById('legend-filters');
    container.innerHTML = ''; // Clear existing items

    Object.keys(relationColors).forEach(function(relation) {
        var item = document.createElement('div');
        item.className = 'legend-filter-item'; // For styling

        var colorBox = document.createElement('span');
        colorBox.style.backgroundColor = relationColors[relation];
        colorBox.className = 'color-box'; // For styling

        var label = document.createElement('label');
        var checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = true;
        checkbox.value = relation;
        checkbox.onchange = filterEdges;
        
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(relation));
        
        item.appendChild(colorBox);
        item.appendChild(label);

        container.appendChild(item);
    });
}

populateLegendAndFilters();

function filterEdges() {
    // Get a list of checked relation types
    var checkedRelations = Array.from(document.querySelectorAll('#legend-filters input[type="checkbox"]:checked')).map(cb => cb.value);

    // Update each edge's visibility based on whether its relation type is checked
    networkData.edges.forEach(function(edge) {
        edge.hidden = !checkedRelations.includes(edge.relation);
    });

    // Refresh the network to apply the changes
    network.setData(networkData);
}
