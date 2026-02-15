// Nircles Main Script

document.addEventListener('DOMContentLoaded', function () {
            const canvas = document.getElementById('folderViz');
            const ctx = canvas.getContext('2d');
            const tooltip = d3.select("#tooltip");
            const selectedItemDetails = document.getElementById('selectedItemDetails');
            const initialDetailsPrompt = document.getElementById('initialDetailsPrompt');
            const detailName = document.getElementById('detailName');
            const detailType = document.getElementById('detailType');
            const detailChildren = document.getElementById('detailChildren');
            const detailSize = document.getElementById('detailSize');
            const detailLastModified = document.getElementById('detailLastModified');
            const detailPath = document.getElementById('detailPath');
            const searchItems = document.getElementById('searchItems');
            const initialSearchPrompt = document.getElementById('initialSearchPrompt');

            const colorBySelect = document.getElementById('colorBy');
            const dateCutoff = document.getElementById('dateCutoff');
            const sortBySelect = document.getElementById('sortBy');
            const paddingFactorslider = document.getElementById('paddingFactor');
            const ignoreSize = document.getElementById('ignoreSize');
            const hideLabels = document.getElementById('hideLabels');
            const typeLegendItems = document.getElementById('typeLegendItems');
            const dateLegendItems = document.getElementById('dateLegendItems');
            const depthLegendItems = document.getElementById('depthLegendItems');
            const fileSizeLegendItems = document.getElementById('fileSizeLegendItems');
            const minDateLabel = document.getElementById('minDateLabel');
            const midDateLabel = document.getElementById('midDateLabel');
            const maxDateLabel = document.getElementById('maxDateLabel');
            const minFileSizeLabel = document.getElementById('minFileSizeLabel');
            const maxFileSizeLabel = document.getElementById('maxFileSizeLabel');

            const jsonFileLoad = document.getElementById('jsonFileLoad');
            const loadJsonFileButton = document.getElementById('loadJsonFileButton');
            const zoomOutButton = document.getElementById('zoomOutButton');
            const goUpButton = document.getElementById('goUpButton'); // New Go Up button
            const exportPngButton = document.getElementById('exportPngButton'); // New Export PNG button
            const searchInput = document.getElementById('searchInput'); // New Search input
            const folderSummary = document.getElementById('folderSummary');  //Global Folder Summary
            const searchCount = document.getElementById('searchCount'); // Search result count
            const searchSum = document.getElementById('searchSummary'); // Search result size
            const breadcrumbsDiv = document.getElementById('breadcrumbs'); // New Breadcrumbs div

            const visualizationColumn = document.getElementById('visualizationColumn');

            let currentDataNodes = []; // Store the flattened nodes for event handling
            let rootNodeData = null; // Store the original root data for full zoom out
            let hoveredNode = null; // Track the node currently under the mouse
            let selectedNode = null; // Track the node currently selected by click for details panel
            let currentZoomNode = null; // Track the node currently zoomed into
            let searchTerm = ''; // Current search term

            // D3 Zoom transform state (k for scale, x/y for translate)
            let transform = d3.zoomIdentity;

            // Define color scales
            const fileTypeColorScale = d3.scaleOrdinal(['#ED6631','#1A845C','#2A73D9','#F3BE0A','#E78F89',
                '#B24D25','#126745','#2056A3','#C08F08','#B55C56',
                '#FBE0D6','#BDE2C7','#CADCF5','#FCEFC2','#FBE7E7',
                                                        '#F9CFBF','#F7B89F','#F28F68', //shades of orange
                                                        '#9AD2A9','#76C38B','#53B36D', //shades of green //(d3.schemeTableau10);
                                                        '#B4CEF1','#94B9EC','#5F96E3', //shades of blue
                                                        '#F5E3A4','#F9DF8A','#F6CE47', //shades of yellow
                                                        '#F7DBDB','#F8D5D5','#F4B5B5'    //shades of himalayan salt pink - oh get lost branding people.
                                                    ]); 
            const fileSizeColorScale = d3.scalePow().exponent(0.1).range(["#2B2A28","#F2EFEC"]); //d3.scaleSequential(d3.interpolateBlues); // Using interpolateRainbow for all hues
            // const fileDepthColorScale = d3.scaleLinear().range(['#FBE0D6','#B24D25']); //Shades of orange 
            const fileDepthColorScale = d3.scaleLinear().range(["#98edfa","#f26e6e"]).interpolate(d3.interpolateHslLong); // Rainbow for folder depth
            const dateColorScale1 = d3.scaleLinear().range(["#000000","#888888","#ee7a06"]); // Shades of black and white for folder depth
            const dateColorScale2 = d3.scaleLinear().range(["#009900","#F2EFEC"]); // Shades of black and white for folder depth

            // Dummy Data
            const defaultData = {
  "path": "C:\\Demo",
  "name": "Demo",
  "type": "folder",
  "value": "0",
  "children": [
    {
      "path": "C:\\Demo\\Files and Folders",
      "name": "Files and Folders",
      "type": "folder",
      "value": "0",
      "children": [
        {
          "path": "C:\\Demo\\Files and Folders",
          "name": "Email.txt",
          "type": "txt",
          "value": 56715,
          "last_modified_unix": 1754869509.9825919,
          "last_modified_iso": "2025-08-11T00:45:09.982592"
        },
        {
          "path": "C:\\Demo\\Files and Folders",
          "name": "Very simply",
          "type": "folder",
          "value": 0,
          "last_modified_unix": 1753489154.0142784,
          "last_modified_iso": "2025-07-26T01:19:14.014278",
          "children":[
            {
          "path": "C:\\Demo\\Files and Folders\\Very simply",
          "name": "Rick Deckards Blade Runner Blaster.mp4",
          "type": "mp4",
          "value": 290968,
          "last_modified_unix": 1753489154.0142784,
          "last_modified_iso": "2025-07-26T01:19:14.014278"
        }
          ]
        }
      ],
      "last_modified_unix": 1754869475.4944975,
      "last_modified_iso": "2025-08-11T00:44:35.494498"
    },
    {
      "path": "C:\\Demo\\See All",
      "name": "See All",
      "type": "folder",
      "value": "0",
      "children": [
        {
          "path": "C:\\Demo\\See All\\Project 1",
          "name": "Project 1",
          "type": "folder",
          "value": "0",
          "last_modified_unix": 1754869174.2042792,
          "last_modified_iso": "2025-08-11T00:39:34.204279",
          "children": [
            {
              "path": "C:\\Demo\\See All\\Project 1",
              "name": "Data - Copy.json",
              "type": "json",
              "value": 105486,
              "last_modified_unix": 1754352061.709732,
              "last_modified_iso": "2025-08-05T01:01:01.709732"
            },
            {
              "path": "C:\\Demo\\See All\\Project 1",
              "name": "Data.json",
              "type": "json",
              "value": 105486,
              "last_modified_unix": 1754352061.709732,
              "last_modified_iso": "2025-08-05T01:01:01.709732"
            },
            {
              "path": "C:\\Demo\\See All\\Project 1",
              "name": "Photo.jpg",
              "type": "jpg",
              "value": 105486,
              "last_modified_unix": 1754352061.709732,
              "last_modified_iso": "2025-08-05T01:01:01.709732"
            },
            {
              "path": "C:\\Demo\\See All\\Project 1",
              "name": "Email.msg",
              "type": "msg",
              "value": 105486,
              "last_modified_unix": 1754352061.709732,
              "last_modified_iso": "2025-08-05T01:01:01.709732"
            },
            {
              "path": "C:\\Demo\\See All\\Project 1",
              "name": "Report.txt",
              "type": "txt",
              "value": 211468,
              "last_modified_unix": 1754691194.7485082,
              "last_modified_iso": "2025-08-08T23:13:14.748508"
            },
            {
              "path": "C:\\Demo\\See All\\Project 1",
              "name": "Report_2.txt",
              "type": "txt",
              "value": 105486,
              "last_modified_unix": 1754352061.709732,
              "last_modified_iso": "2025-08-05T01:01:01.709732"
            },
            {
              "path": "C:\\Demo\\See All\\Project 1",
              "name": "Report.txt",
              "type": "txt",
              "value": 105486,
              "last_modified_unix": 1754352061.709732,
              "last_modified_iso": "2025-08-05T01:01:01.709732"
            }
          ]
        },
        {
          "path": "C:\\Demo\\See All\\Project 2",
          "name": "Project 2",
          "type": "folder",
          "value": "0",
          "last_modified_unix": 1754687388.2418442,
          "last_modified_iso": "2025-08-08T22:09:48.241844",
          "children": [
            {
              "path": "C:\\Demo\\See All\\Project 2",
              "name": "Data.jpg",
              "type": "jpg",
              "value": 105486,
              "last_modified_unix": 1754352061.709732,
              "last_modified_iso": "2025-08-05T01:01:01.709732"
            },
            {
              "path": "C:\\Demo\\See All\\Project 2",
              "name": "Email.msg",
              "type": "msg",
              "value": 105486,
              "last_modified_unix": 1754352061.709732,
              "last_modified_iso": "2025-08-05T01:01:01.709732"
            },
            {
              "path": "C:\\Demo\\See All\\Project 2",
              "name": "Report.txt",
              "type": "txt",
              "value": 105486,
              "last_modified_unix": 1754352061.709732,
              "last_modified_iso": "2025-08-05T01:01:01.709732"
            }
          ]
        },
        {
          "path": "C:\\Demo\\See All\\Project 3",
          "name": "Project 3",
          "type": "folder",
          "value": "0",
          "last_modified_unix": 1754687390.5936754,
          "last_modified_iso": "2025-08-08T22:09:50.593675",
          "children": [
            {
              "path": "C:\\Demo\\See All\\Project 3",
              "name": "World Domination.doc",
              "type": "doc",
              "value": 145486,
              "last_modified_unix": 1754352061.709732,
              "last_modified_iso": "2025-08-05T01:01:01.709732"
            },
            {
              "path": "C:\\Demo\\See All\\Project 3",
              "name": "Nircles.msg",
              "type": "msg",
              "value": 15486,
              "last_modified_unix": 1754352061.709732,
              "last_modified_iso": "2025-08-05T01:01:01.709732"
            },
            {
              "path": "C:\\Demo\\See All\\Project 3",
              "name": "Report.txt",
              "type": "txt",
              "value": 105486,
              "last_modified_unix": 1754352061.709732,
              "last_modified_iso": "2025-08-05T01:01:01.709732"
            }
          ]
        },
        {
          "path": "C:\\Demo\\See All",
          "name": "New Text Document.txt",
          "type": "txt",
          "value": 2000,
          "last_modified_unix": 1754869366.4957943,
          "last_modified_iso": "2025-08-11T00:42:46.495794"
        }
      ],
      "last_modified_unix": 1754869366.4957943,
      "last_modified_iso": "2025-08-11T00:42:46.495794"
    },
    {
      "path": "C:\\Demo\\Of Your",
      "name": "Of Your",
      "type": "folder",
      "value": "0",
      "children": [
        {
          "path": "C:\\Demo\\Of Your\\Alpha",
          "name": "Alpha",
          "type": "folder",
          "value": "0",
          "last_modified_unix": 1754690947.0562656,
          "last_modified_iso": "2025-08-08T23:09:07.056266",
          "children": [
            {
              "path": "C:\\Demo\\Of Your\\Alpha",
              "name": "Data.json",
              "type": "json",
              "value": 125486,
              "last_modified_unix": 1754352061.709732,
              "last_modified_iso": "2025-08-05T01:01:01.709732"
            },
            {
              "path": "C:\\Demo\\Of Your\\Alpha",
              "name": "Email.msg",
              "type": "msg",
              "value": 105486,
              "last_modified_unix": 1754352061.709732,
              "last_modified_iso": "2025-08-05T01:01:01.709732"
            },
            {
              "path": "C:\\Demo\\Of Your\\Alpha",
              "name": "Photo.png",
              "type": "png",
              "value": 105486,
              "last_modified_unix": 1754352061.709732,
              "last_modified_iso": "2025-08-05T01:01:01.709732"
            }
          ]
        },
        {
          "path": "C:\\Demo\\Of Your\\Beta",
          "name": "Beta",
          "type": "folder",
          "value": "0",
          "last_modified_unix": 1754687428.2360988,
          "last_modified_iso": "2025-08-08T22:10:28.236099",
          "children": [
            {
              "path": "C:\\Demo\\Of Your\\Beta",
              "name": "Data.json",
              "type": "json",
              "value": 55486,
              "last_modified_unix": 1754352061.709732,
              "last_modified_iso": "2025-08-05T01:01:01.709732"
            },
            {
              "path": "C:\\Demo\\Of Your\\Beta",
              "name": "Email.msg",
              "type": "msg",
              "value": 45486,
              "last_modified_unix": 1754352061.709732,
              "last_modified_iso": "2025-08-05T01:01:01.709732"
            },
            {
              "path": "C:\\Demo\\Of Your\\Beta",
              "name": "Report.doc",
              "type": "doc",
              "value": 35486,
              "last_modified_unix": 1754352061.709732,
              "last_modified_iso": "2025-08-05T01:01:01.709732"
            }
          ]
        }
      ],
      "last_modified_unix": 1754869202.896482,
      "last_modified_iso": "2025-08-11T00:40:02.896482"
    }
  ],
  "last_modified_unix": 1754869174.2052796,
  "last_modified_iso": "2025-08-11T00:39:34.205280"
};

            // Initial load with dummy data
            rootNodeData = defaultData;
            processAndRenderVisualization(rootNodeData);
            updateBreadcrumbs();


            // D3 Zoom behavior
            const zoom = d3.zoom()
                .scaleExtent([0.01, 1000]) // Allow zooming from 10% to 10000%
                .on("zoom", (event) => {
                    transform = event.transform;
                    drawVisualization();
                });

            // Apply zoom behavior to the canvas
            d3.select(canvas).call(zoom);


            //////////////////////////////////////////////////////////////////////////////
            ///////////////////    Event listeners for everything ////////////////////////
            //////////////////////////////////////////////////////////////////////////////
            // Event listener for the "Load JSON File" button
            loadJsonFileButton.addEventListener('click', function () {
                jsonFileLoad.click(); // Trigger the hidden file input click
            });

            // Event listener for when a file is selected via the input
            jsonFileLoad.addEventListener('change', function (event) {
                const file = event.target.files[0];
                if (!file) {
                    return; // No file selected
                }

                const reader = new FileReader();
                reader.onload = function (e) {
                    try {
                        rootNodeData = JSON.parse(e.target.result); // Store original root data
                        processAndRenderVisualization(rootNodeData);
                        resetZoom(); // Reset zoom to fit the new data
                        searchInput.value = ''; // Clear search on new load
                        searchTerm = '';
                        folderSummary.value = ''; //Clear summary
                        updateBreadcrumbs();
                    } catch (error) {
                        displayMessageBox("Error reading or parsing the JSON file.\nError: " + error.message, "Error");
                    }
                };
                reader.onerror = function () {
                    displayMessageBox("Failed to read the file.", "Error");
                };
                reader.readAsText(file); // Read the file content as text
            });

            // Event listener for color selection change
            colorBySelect.addEventListener('change', function () {
                if (currentDataNodes.length > 0) {
                    processAndRenderVisualization(rootNodeData); // Re-draw with new sort criteria
                    drawVisualization(); // Re-draw with new color scheme
                }
            });
           
            // Event listener for sorting criteria change
            sortBySelect.addEventListener('change', function () {
                processAndRenderVisualization(rootNodeData); // Re-draw with new sort criteria
                zoomToNode(currentZoomNode); // Reset zoom to fit the new data
            });
            // Event listener for sorting criteria change
            hideLabels.addEventListener('change', function () {
                processAndRenderVisualization(rootNodeData); // Re-draw with new sort criteria
                zoomToNode(currentZoomNode); // Reset zoom to fit the new data
            });
                        
            // Event listener for padding criteria input
            paddingFactorslider.addEventListener('input', function () {
                processAndRenderVisualization(rootNodeData); // Re-draw with new sort criteria
                zoomToNode(currentZoomNode); // Reset zoom to fit the new data
            });
                        
            // Event listener for date colour criteria input
            dateCutoff.addEventListener('input', function () {
                processAndRenderVisualization(rootNodeData); // Re-draw with new sort criteria
                zoomToNode(currentZoomNode); // Reset zoom to fit the new data
            });

            // Event listener for file size criteria change
            ignoreSize.addEventListener('input', function () {
                processAndRenderVisualization(rootNodeData); // Re-draw with new sort criteria
                zoomToNode(currentZoomNode); // Reset zoom to fit the new data
            });

            // Event listener for Zoom Out button
            zoomOutButton.addEventListener('click', function () {
                zoomToNode(currentZoomNode);
            });

            // Event listener for Go Up button
            goUpButton.addEventListener('click', function () {
                if (currentZoomNode && currentZoomNode.parent) {
                    zoomToNode(currentZoomNode.parent);
                } else {
                    resetZoom(); // If no parent, go to root
                }
            });

            // Event listener for Export PNG button
            exportPngButton.addEventListener('click', function () {
                exportCanvasAsPNG();
            });

            // Event listener for Search input
            searchInput.addEventListener('input', function () {
                searchTerm = this.value.toLowerCase();
                drawVisualization(); // Redraw to apply search highlighting
            });


            //////////////////////////////////////////////////////////////////
            /////////////        Draw                       //////////////////
            //////////////////////////////////////////////////////////////////
            // Function to process data and then draw
            function processAndRenderVisualization(data) {
                const containerWidth = visualizationColumn.offsetWidth;
                // Set canvas height relative to window height, capped by container width for square aspect
                const containerHeight = Math.min(containerWidth, window.innerHeight*0.9);

                canvas.width = containerWidth;
                canvas.height = containerHeight;

                const root = d3.hierarchy(data)
                    .sum(d => Math.pow(d.value, ignoreSize.value /100))  //ignoreSize.checked ?  (d.value / d.value) : +d.value)
                    .sort((a, b) => sortItOut(a,b));

                const pack = d3.pack()
                    .size([containerWidth,containerHeight])
                    .padding(Math.sqrt(paddingFactorslider.value) / 20);  //Original value 0.3

                currentDataNodes = pack(root).descendants();
                setColorDomains();
                drawVisualization();
            }

            function isEven(n) {return n % 2 == 0;}
            function isOdd(n) {return Math.abs(n % 2) == 1}
            function applyCurrentZoom(){
                // Apply current zoom transform
                ctx.save();
                ctx.translate(transform.x, transform.y);
                ctx.scale(transform.k, transform.k);
            }


            // Function to draw all circles and text on the canvas
            function drawVisualization() {
                const minRadius = 1.2;
                ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the entire canvas

                applyCurrentZoom();
                folderSummary.textContent = currentDataNodes[0].data.name + " contains " + currentDataNodes.length + " items. Total size " + formatBytes(currentDataNodes[0].value);
                
                // Helper to check if a node matches the search term
                const matchesSearch = (d) => d.data.name.toLowerCase().includes(searchTerm);
                searchCount.textContent = "";
                searchSum.textContent = "";
                
                if (searchTerm.length > 1) {
                   searchLogic(matchesSearch);
                } else {
                    searchResults = "";
                    updateSearchResults(searchResults);
                }

                
                // Draw directories first (largest to smallest radius), then files
                const directories = currentDataNodes.filter(d => d.children).sort((a, b) => b.r - a.r);
                directories.forEach(d => {
                    if (d.x - (d.r) < (canvas.width - transform.x) / transform.k &&
                        d.x + (d.r) > (0 - transform.x) / transform.k  &&
                        d.y - (d.r) < (canvas.height - transform.y) / transform.k &&
                        d.y + (d.r) > (0 - transform.y) / transform.k
                    ){if (d.r * transform.k > minRadius || searchTerm.length > 1 && matchesSearch(d)){
                    ctx.beginPath();
                    ctx.arc(d.x, d.y, d.r, 0, 2 * Math.PI);
                    ctx.fillStyle = getNodeColor(d);
                    //ctx.fill();
                    
                    // Highlight for hover, selection, zoom, or search match
                    let strokeColor = "#272730"; // Default black
                    let lineWidth = 0.5 / transform.k;
                    
                    if (d === hoveredNode || d === selectedNode || d === currentZoomNode) {
                        strokeColor = "#ED6631"; // Orange for active states
                        lineWidth = 2.5 / transform.k;
                    }

                    if (searchTerm.length > 1 && matchesSearch(d)) {
                        strokeColor = "#F28F68"; // Orange tint for search match
                        lineWidth = 5 / transform.k;
                    }

                    ctx.strokeStyle = strokeColor;
                    ctx.lineWidth = lineWidth;
                    //ctx.stroke();
                    
                    ctx.globalAlpha = 1.0; // Reset opacity
                    // Dim non-matching nodes if a search term is active
                    if (searchTerm.length > 1 && !matchesSearch(d)) {
                        ctx.globalAlpha = 0.12; // Reduce opacity
                    }
                    ctx.fill();
                    ctx.stroke();
                }}
                });


/////////////////////// Draw the Files ///////////////////////////////////

                const files = currentDataNodes.filter(d => !d.children);
                files.forEach(d => {
                    if (d.x - (d.r) < (canvas.width - transform.x) / transform.k &&
                        d.x + (d.r) > (0 - transform.x) / transform.k  &&
                        d.y - (d.r) < (canvas.height - transform.y) / transform.k &&
                        d.y + (d.r) > (0 - transform.y) / transform.k
                    ){if (d.r * transform.k > minRadius || searchTerm.length > 1 && matchesSearch(d)){
                        ctx.beginPath();
                    ctx.arc(d.x, d.y, d.r, 0, 2 * Math.PI);
                    ctx.fillStyle = getNodeColor(d);
                    //ctx.fill();

                    // Highlight for hover, selection, zoom, or search match
                    let strokeColor = "#ffffff"; // Default file white
                    let lineWidth = 0.4 / transform.k;

                    if (d === hoveredNode || d === selectedNode) {
                        strokeColor = "#ED6631"; // Orange for active states
                        lineWidth = 2.5 / transform.k;
                        
                    }

                    if (searchTerm.length > 1 && matchesSearch(d)) {
                        strokeColor = "#F28F68";  // Orange tint for search match
                        lineWidth = 5 / transform.k;
                    }

                    ctx.strokeStyle = strokeColor;
                    ctx.lineWidth = lineWidth;
                    //ctx.stroke();

                    ctx.globalAlpha = 1.0; // Reset opacity
                    // Dim non-matching nodes if a search term is active
                    if (searchTerm.length > 1 && !matchesSearch(d)) {
                        ctx.globalAlpha = 0.12; // Reduce opacity
                    }
                        ctx.fill();
                        ctx.stroke();
                }}
                });
               // drawFiles();

                    ///////////////////////////////////////////////// Draw text labels        ///////////////////////////
                    currentDataNodes.forEach(d => {
            // Text visibility: only show if the node itself is the currentZoomNode,
            // or if its parent is the currentZoomNode, or if no node is zoomed (root view).
            const relSize = 2* d.r * transform.k;
            const isVisibleInZoom = (!hideLabels.checked && currentZoomNode === null && d.depth === 0) || // Show root if not zoomed
                            (!hideLabels.checked && currentZoomNode !== null && d === currentZoomNode) ||// || (d.parent === currentZoomNode)));
                            !hideLabels.checked && d.parent !== null && d.parent === currentZoomNode && 
                            ( 1.3 * Math.min(canvas.width,canvas.height) > relSize) && ( relSize > 100); // Visible size range

            if (isVisibleInZoom) {
                const text = d.data.name;
                ctx.globalAlpha = 1.0; // Reset opacity
                titleFont = "Roboto, sans-serif";
                // Dim non-matching nodes if a search term is active
                if (searchTerm.length > 1 && !matchesSearch(d)) {
                    ctx.globalAlpha = 0.12; // Reduce opacity
                }
                let textangle = 30;
                if (isEven(d.depth)) {
                    textangle = -30;
                }
                //Folder Text
                if (d.children){
                    var fontSizeTitle = 18 / (transform.k*1.2)
                    if (d === currentZoomNode){
                        fontSizeTitle = fontSizeTitle *2;
                    }
                    var mainTextColor = [74, 74, 74]//"#4A4A4A",
                    ctx.fillStyle = "#00000e";
                drawCircularText( ctx, text, fontSizeTitle, titleFont, d.x, d.y, d.r, textangle, 0);//drawCircularText
                // drawCircularText( ctx, d.data.last_modified_unix, fontSizeTitle, titleFont, d.x, d.y, d.r, -textangle, 0);//drawCircularText
                } else {
                    var fontSize = 14 / (transform.k)
                    // ctx.fillStyle = 'rgb(25,25,25)'
                    // ctx.textAlign = 'center' // Ensure we draw in exact center
                    // ctx.fillText(text, d.x, d.y);
                    if (d.parent === currentZoomNode){
                        drawCircularText( ctx, text, fontSize, titleFont, d.x, d.y, d.r*0.75, 0, 0);//drawCircularText
                    }
                }
            }
        });
                 ctx.restore(); // Restore context to original state
            }

            // Search functionality
            function searchLogic(matchesSearch){
                 const match = currentDataNodes.filter(matchesSearch).length ;
                 const matchSum = currentDataNodes.filter(matchesSearch);
                 let thisSum = 0;
                 matchSum.forEach(d => {
                    thisSum = thisSum + d.value
                });

                    searchCount.textContent = match;
                    searchSum.textContent = formatBytes(thisSum);
                    //White background if searching for something
                    ctx.beginPath();
                    ctx.arc(canvas.width / 2, canvas.height / 2, canvas.height / 2, 0, 2 * Math.PI);
                    ctx.fillStyle = "#F2EFEC";
                    ctx.fill();
                    const searchResults = Array.from(new Set(currentDataNodes.filter(matchesSearch)));
                    updateSearchResults(searchResults);
            }

            ////////////////////////////////////////////////////////////// 
            ////////////////////  Circular Text  /////////////////////////
            ////////////////////////////////////////////////////////////// 

            //Adjusted from: http://blog.graphicsgen.com/2015/03/html5-canvas-rounded-text.html
            function drawCircularText(ctx, text, fontSize, titleFont, centerX, centerY, radius, startAngle, kerning) {
                // startAngle:   In degrees, Where the text will be shown. 0 degrees if the top of the circle
                // kerning:     0 for normal gap between letters. Positive or negative number to expand/compact gap in pixels

                ctx.strokeStyle = 'white';
                // setup these to match Of Your needs
                ctx.miterLimit = 2;
                ctx.lineJoin = 'circle';
                
                //Setup letters and positioning
                ctx.textBaseline = 'alphabetic'
                ctx.textAlign = 'center' // Ensure we draw in exact center
                ctx.fillStyle = 'rgb(25,25,25)'
                
                startAngle = startAngle * (Math.PI / 180) // convert to radians
                text = text.toString().split('').reverse().join('') // Reverse letters
                ctx.font = fontSize  + 'px ' + titleFont;
                
                //Rotate 50% of total angle for center alignment
                for (var j = 0; j < text.length; j++) {
                    var charWid = ctx.measureText(text[j]).width
                    startAngle += (charWid + (j == text.length - 1 ? 0 : kerning)) / radius / 2
                } //for j

                ctx.save() //Save the default state before doing any transformations
                ctx.translate(centerX, centerY) // Move to center
                ctx.rotate(startAngle) //Rotate into final start position
                
                //Now for the fun bit: draw, rotate, and repeat
                for (var j = 0; j < text.length; j++) {
                    var charWid = ctx.measureText(text[j]).width / 2 // half letter
                    //Rotate half letter
                    ctx.rotate(-charWid / radius)
                    //Draw the character at "top" or "bottom" depending on inward or outward facing
                    // draw an outline, then filled
                    ctx.lineWidth = 0.15* fontSize ;
                    ctx.lineJoin = "round";
                    ctx.strokeText(text[j], 0, -radius);
                    //Rotate half letter
                    ctx.rotate(-(charWid + kerning) / radius)
                } //for j

                ctx.restore() //Restore to state as it was before transformations

                ctx.save() //Save the default state before doing any transformations
                ctx.translate(centerX, centerY) // Move to center
                ctx.rotate(startAngle) //Rotate into final start position
                
                //Now for the fun bit: draw, rotate, and repeat
                for (var j = 0; j < text.length; j++) {
                    var charWid = ctx.measureText(text[j]).width / 2 // half letter
                    //Rotate half letter
                    ctx.rotate(-charWid / radius)
                    //Draw the character at "top" or "bottom" depending on inward or outward facing
                    // draw an outline, then filled
                    ctx.lineWidth = 0;
                    ctx.fillText(text[j], 0, -radius)
                    //Rotate half letter
                    ctx.rotate(-(charWid + kerning) / radius)
                } //for j

                ctx.restore()//
            } //function drawCircularText


	////////////////////////////////////////////////////////////// 
	//////////////////  Sorting Options  /////////////////////////
	////////////////////////////////////////////////////////////// 
            // Function to sort based on selected option
            function sortItOut (a,b){
               const sortMode = sortBySelect.value;
                if (sortMode === "size"){
                    // This is correct as .value is set by D3's .sum()
                    return b.value - a.value; 
                } else if (sortMode === "type"){
                    return d3.descending(a.data.type, b.data.type); 
                } else if (sortMode === "reverseSize"){
                    return a.value - b.value;
                } else if (sortMode === "date"){
                    return b.data.last_modified_unix - a.data.last_modified_unix; 
                } else  if (sortMode === "name"){
                    return d3.descending(a.data.name, b.data.name); 
                }
            }
            // Function to sort based on selected option
            function sumItOut (d){
                const sortMode = sortBySelect.value;
                if (sortMode === "size"){
                    return d.value ? +d.value : 1;
                } else if (sortMode === "type"){
                    return d.type  ? +d.type : 1;
                } else if (sortMode === "reverseSize"){
                    return d.value ? -d.value : 1;
                } else if (sortMode === "date"){
                    return d.last_modified_unix ? + a.last_modified_unix : 1;
                } else  if (sortMode === "name"){
                    return d.name  ? +d.name : 1;
                }
            }

	////////////////////////////////////////////////////////////// 
	//////////////////      Colours      /////////////////////////
	//////////////////////////////////////////////////////////////
            function setColorDomains() {
                // Set domains for color scales
                const fileTypes = Array.from(new Set(currentDataNodes.filter(d => !d.children && d.data.type).map(d => d.data.type)));
                fileTypeColorScale.domain(fileTypes);

                const allDates = currentDataNodes.filter(d => d.data.last_modified_unix).map(d => d.data.last_modified_unix);
                const minDate = d3.min(allDates);
                const maxDate = d3.max(allDates);
                const dateRange = maxDate - minDate;
                //minDate = 0;
                const chosenDate = maxDate - (dateCutoff.value / 100 * dateRange);
                dateColorScale2.domain([minDate, maxDate]);
                dateColorScale1.domain([chosenDate, maxDate]);

                const allFileSizes = currentDataNodes.filter(d => !d.children).map(d => d.value);
                const minFileSize = d3.min(allFileSizes) || 0;
                const maxFileSize = d3.max(allFileSizes) || 1; // Avoid division by zero
                fileSizeColorScale.domain([minFileSize, maxFileSize]);

                const allFileDepths = currentDataNodes.filter(d => !d.children).map(d => d.depth);
                const minFileDepth = d3.min(allFileDepths);
                const maxFileDepth = d3.max(allFileDepths);
                fileDepthColorScale.domain([0, 5]);

                // Update legend labels
                minDateLabel.textContent = minDate ? new Date(minDate * 1000).toLocaleDateString() : '';
                maxDateLabel.textContent = maxDate ? new Date(maxDate * 1000).toLocaleDateString() : '';
                minFileSizeLabel.textContent = minFileSize ? formatBytes(minFileSize) : 'Smallest';
                maxFileSizeLabel.textContent = maxFileSize ? formatBytes(maxFileSize) : 'Largest';
                maxDepthLabel.textContent = maxFileDepth;

                updateColorLegend(fileTypes);
            }

            // Function to get color based on selected option
            function getNodeColor(d) {
                const colorMode = colorBySelect.value;
                //} else { // It's a file
                if (colorMode === "depth") {
                    return fileDepthColorScale(d.depth); 
                } else if (colorMode === "date") {
                    if (d.data.last_modified_unix){
                    return dateColorScale1(d.data.last_modified_unix); // Default grey if no date
                    
                }
                } else if (colorMode === "fileSize") {
                    return fileSizeColorScale(d.value); //Files also show size
                } else {
                    if (!d.children) { // It's a directory (folder)
                    return fileTypeColorScale(d.data.type);
                }
                return fileSizeColorScale(d.value); // Directories always show gradient
                }
                return "#fd4f0aff"; // Fallback default color
            }

            // Zoom functionality
            function zoomToNode(node) {
                const width = canvas.width;
                const height = canvas.height;
                
                // Calculate new scale (k) and translation (tx, ty)
                const k = Math.min(width, height) / (node.r * 2.4); // Add a little padding
                const tx = width / 2 - node.x * k;
                const ty = height / 2 - node.y * k;
                
                // Use D3 transition for smooth zoom
                d3.transition().duration(750).tween("zoom", function () {
                    const i = d3.interpolate(transform, d3.zoomIdentity.translate(tx, ty).scale(k));
                    return function (t) {
                        transform = i(t);
                        drawVisualization();
                    };
                }).on("end", () => {
                    updateBreadcrumbs(); // Update breadcrumbs after zoom transition ends
                });
                currentZoomNode = node;
            }

            function resetZoom() {
                currentZoomNode = currentDataNodes[0];
                zoomToNode(currentZoomNode);
            }

	////////////////////////////////////////////////////////////// 
	/////////////////  Update Breadcrumbs  ///////////////////////
	////////////////////////////////////////////////////////////// 
            function updateBreadcrumbs() {
                breadcrumbsDiv.innerHTML = ''; // Clear previous breadcrumbs
                if (!rootNodeData) return;

                let pathNodes = [];
                let currentNode = currentZoomNode || d3.hierarchy(rootNodeData); // Start from zoomed node or root

                while (currentNode) {
                    pathNodes.unshift(currentNode); // Add to the beginning to get root first
                    currentNode = currentNode.parent;
                }

                pathNodes.forEach((node, i) => {
                    const span = document.createElement('span');
                    span.textContent = node.data.name;
                    span.className = 'breadcrumb-item';

                    //if (node === currentZoomNode || (currentZoomNode === null && i === pathNodes.length - 1)) {
                    //    span.classList.add('current');
                    //} else {
                        span.addEventListener('click', () => zoomToNode(node));
                    //}
                    breadcrumbsDiv.appendChild(span);

                    if (i < pathNodes.length - 1) {
                        const separator = document.createElement('span');
                        separator.textContent = '\\';
                        separator.className = 'mx-1 text-gray-400';
                        breadcrumbsDiv.appendChild(separator);
                    }
                });
            }


	////////////////////////////////////////////////////////////// 
	/////////////////////// Export PNG  //////////////////////////
	////////////////////////////////////////////////////////////// 
            function exportCanvasAsPNG() {
                const dataURL = canvas.toDataURL('image/png');
                const a = document.createElement('a');
                a.href = dataURL;
                a.download = 'folder_visualization.png';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }

            
	////////////////////////////////////////////////////////////// 
	/////////////////////// Mouse Events  ////////////////////////
	////////////////////////////////////////////////////////////// 
            // Event listener for mouse movement on canvas
            canvas.addEventListener('mousemove', function (event) {
                const rect = canvas.getBoundingClientRect();
                // Transform mouse coordinates based on current zoom
                const mouseX = (event.clientX - rect.left - transform.x) / transform.k;
                const mouseY = (event.clientY - rect.top - transform.y) / transform.k;

                let foundNode = null;
                // Iterate through nodes in reverse order to detect smaller, top-most circles first
                for (let i = currentDataNodes.length - 1; i >= 0; i--) {
                    const d = currentDataNodes[i];
                    const dx = mouseX - d.x;
                    const dy = mouseY - d.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < d.r) {
                        foundNode = d;
                        break;
                    }
                }

                if (foundNode !== hoveredNode) {
                    hoveredNode = foundNode;
                    drawVisualization(); 
                    // Redraw to update hover highlight  <br/>Sub-items: ${hoveredNode.children.length}
                    // <br/>Type: ${hoveredNode.data.type || "Folder"}
                    // <br/>Full Path: ${hoveredNode.data.path}
                    // <br/>Size: ${formatBytes(hoveredNode.value)}
                    // <br/>Last Modified: ${hoveredNode.data.last_modified_iso ? new Date(hoveredNode.data.last_modified_unix * 1000).toLocaleDateString() : "N/A"}`)

                    if (hoveredNode) {
                        tooltip.style("opacity", 0.75)
                            .html(`<strong> Item: </strong>${hoveredNode.data.name}
                            <br/><strong>Parent Folder: </strong>${hoveredNode.parent ? hoveredNode.parent.data.name : ""}
                            `)
                            .style("left", (event.pageX + 40) + "px")
                            .style("top", (event.pageY - 28) + "px");
                    } else {
                        tooltip.style("opacity", 0);
                    }
                }
            });

            // Event listener for mouse leaving canvas
            canvas.addEventListener('mouseout', function () {
                if (hoveredNode) {
                    hoveredNode = null;
                    drawVisualization(); // Redraw to remove hover highlight
                    tooltip.style("opacity", 0);
                }
            });

            // Event listener for click on canvas
            canvas.addEventListener('click', function (event) {
                const rect = canvas.getBoundingClientRect();
                // Transform mouse coordinates based on current zoom
                const mouseX = (event.clientX - rect.left - transform.x) / transform.k;
                const mouseY = (event.clientY - rect.top - transform.y) / transform.k;

                let clickedNode = null;
                // Iterate through nodes in reverse order to detect smaller, top-most circles first
                for (let i = currentDataNodes.length - 1; i >= 0; i--) {
                    const d = currentDataNodes[i];
                    const dx = mouseX - d.x;
                    const dy = mouseY - d.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < d.r) {
                        clickedNode = d;
                        break;
                    }
                }

                if (clickedNode) {
                    selectedNode = clickedNode; // Update selected node for details panel
                    zoomToNode(clickedNode); // Zoom to the clicked node

                    // Display details in the third column
                    selectedItemDetails.classList.remove('hidden');
                    initialDetailsPrompt.classList.add('hidden');

                    detailName.textContent = selectedNode.data.name;
                    detailType.textContent = selectedNode.data.type || "Folder";
                    if (selectedNode.data.children){
                    detailChildren.textContent = selectedNode.data.children.length + " Children";
                    } else {
                        detailChildren.textContent = "";
                    }
                    detailSize.textContent = formatBytes(selectedNode.value);
                    detailLastModified.textContent = selectedNode.data.last_modified_iso ? new Date(selectedNode.data.last_modified_unix * 1000).toLocaleString() : "N/A";
                    if (selectedNode.data.children){
                        detailPath.textContent = selectedNode.data.path;
                    } else {
                        detailPath.textContent = selectedNode.data.path + "\\" + selectedNode.data.name;
                    }
                    
                    //Breadcrumbs or full path needs updating
                    drawVisualization(); // Redraw to remove selection highlight
                } else {
                    // If click occurred outside any node, clear selection and zoom out
                    if (selectedNode) {
                        selectedNode = null;
                        drawVisualization(); // Redraw to remove selection highlight
                    }
                    selectedItemDetails.classList.add('hidden');
                    initialDetailsPrompt.classList.remove('hidden');
                    resetZoom(); // Zoom out to full view
                }
            });


            // Function to format bytes into human-readable format
            function formatBytes(bytes, decimals = 2) {
                if (bytes === 0) return '0 Bytes';
                const k = 1024;
                const dm = decimals < 0 ? 0 : decimals;
                const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
            }


            //Function to create search results
            function updateSearchResults(searchResults){
                searchItems.classList.add('hidden');
                let searchArray = [];

                if (searchTerm.length > 1){
                    //initialSearchPrompt.classlist.add('hidden');
                    searchItems.classList.remove('hidden');
                    searchItems.innerHTML = ''; // Clear previous search items
                    
                    // Add items for search results
                            searchResults.forEach(path => {
                                const resultItem = document.createElement('div');
                                // FIX: Removed 'flex items-center space-x-2' and added 'mb-1' for vertical spacing
                                resultItem.className = 'breadcrumb-item cursor-pointer hover:bg-gray-200 p-1 rounded mb-1'; 
                                resultItem.innerHTML = `<div> ${path.data.name} </div>`;
                                resultItem.addEventListener('click', () => zoomToNode(path));
                                
                                searchItems.appendChild(resultItem);
                                        });
                                    } else{
                                        //initialSearchPrompt.classlist.remove('hidden');
                                        searchItems.classList.add('hidden');
                                    }
            }

            // Create the legend containing all file types
            function updateColorLegend(fileTypes) {
                const colorMode = colorBySelect.value;

                // Hide all legends initially
                typeLegendItems.classList.add('hidden');
                dateLegendItems.classList.add('hidden');
                depthLegendItems.classList.add('hidden');
                fileSizeLegendItems.classList.add('hidden');

                if (colorMode === "type") {
                    typeLegendItems.classList.remove('hidden');
                    typeLegendItems.innerHTML = ''; // Clear previous legend items

                    // Add legend item for folders (default gray)
                    const folderLegendItem = document.createElement('div');
                    folderLegendItem.className = 'flex items-center space-x-2';
                    folderLegendItem.innerHTML = `
                        <span class="w-4 h-4 rounded-full" style="background-color: #cbd5e1;"></span>
                        <span>Folder</span>
                    `;
                    typeLegendItems.appendChild(folderLegendItem);

                    // Add legend items for file types
                    fileTypes.forEach(type => {
                        const legendItem = document.createElement('div');
                        legendItem.className = 'flex items-center space-x-2';
                        legendItem.innerHTML = `
                        <span class="w-4 h-4 rounded-full" style="background-color: ${fileTypeColorScale(type)};"></span>
                            <span>.${type}</span>
                        `;
                        typeLegendItems.appendChild(legendItem);
                    });
                } else if (colorMode === "date") {
                    dateLegendItems.classList.remove('hidden');
                } else if (colorMode === "depth") {
                    depthLegendItems.classList.remove('hidden');
                } else if (colorMode === "fileSize") {
                    fileSizeLegendItems.classList.remove('hidden');
                }
            }

            // Custom message box function (replaces alert)
            function displayMessageBox(message, type = "Info") {
                const messageBox = document.createElement('div');
                messageBox.className = `message-box-overlay`;
                messageBox.innerHTML = `
                    <div class="message-box-content">
                        <h3 class="text-xl font-bold mb-4 ${type === 'Error' ? 'text-red-600' : 'text-blue-600'}">${type}</h3>
                        <p class="text-gray-700 mb-6">${message}</p>
                        <button id="closeMessageBox" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">OK</button>
                    </div>
                `;
                document.body.appendChild(messageBox);

                document.getElementById('closeMessageBox').addEventListener('click', function () {
                    document.body.removeChild(messageBox);
                });
            }

            // Add a resize observer to redraw the canvas when its container changes size
            const resizeObserver = new ResizeObserver(entries => {
                for (let entry of entries) {
                    if (entry.target === visualizationColumn) {
                        const newWidth = entry.contentRect.width;
                        // Set new height relative to window height, capped by newWidth for square aspect
                        const newHeight = Math.min(newWidth, window.innerHeight * 0.8);

                        if (canvas.width !== newWidth || canvas.height !== newHeight) {
                            canvas.width = newWidth;
                            canvas.height = newHeight;

                            if (rootNodeData) {
                                // Re-process and redraw with new dimensions if data is loaded
                                processAndRenderVisualization(rootNodeData);
                                //folderSummary = data.length();
                                // Reset zoom after resize to fit new dimensions
                                resetZoom();
                            } else {
                                ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear if no data
                            }
                        }
                    }
                }
            });

            // Start observing the visualization column for size changes
            resizeObserver.observe(visualizationColumn);
        });