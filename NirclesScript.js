// Nircles Main Script
// Copywrite Gwen Protheroe 2026

document.addEventListener("DOMContentLoaded", function () {
  const canvas = document.getElementById("folderViz");
  const ctx = canvas.getContext("2d");
  const tooltip = d3.select("#tooltip");
  const selectedItemDetails = document.getElementById("selectedItemDetails");
  const initialDetailsPrompt = document.getElementById("initialDetailsPrompt");
  const detailName = document.getElementById("detailName");
  const detailType = document.getElementById("detailType");
  const detailChildren = document.getElementById("detailChildren");
  const detailSize = document.getElementById("detailSize");
  const detailLastModified = document.getElementById("detailLastModified");
  const detailPath = document.getElementById("detailPath");
  const searchItems = document.getElementById("searchItems");
  const initialSearchPrompt = document.getElementById("initialSearchPrompt");
  
  // Buttons!! Button for everything!
  const newScanButton = document.getElementById("newScanButton");
  const jsonFileLoad = document.getElementById("jsonFileLoad");
  const loadJsonFileButton = document.getElementById("loadJsonFileButton");
  const saveScanButton = document.getElementById("saveScanButton");
  const zoomOutButton = document.getElementById("zoomOutButton");
  const exportPngButton = document.getElementById("exportPngButton");
  const exportSvgButton = document.getElementById("exportSvgButton");
  const filterButton = document.getElementById("filterButton");
  const filterOutButton = document.getElementById("filterOutButton");
  const copyPathButton = document.getElementById('copyPathButton');
  const showAboutPageButton = document.getElementById("showAboutPageButton");
  const treeMapButton = document.getElementById("treeMapButton");
  const NircleButton = document.getElementById("NircleButton");
  const sunBurstButton = document.getElementById("sunBurstButton");
  const viewSettings = document.getElementById("viewSettings");
  const scanSettingsButton = document.getElementById("scanSettingsButton");
  const resetButton = document.getElementById("resetButton");
  let originalFullData = null; // To store the state for Reset

  const colorBySelect = document.getElementById("colorBy");
  const dateCutoff = document.getElementById("dateCutoff");
  const sortBySelect = document.getElementById("sortBy");
  const paddingFactorslider = document.getElementById("paddingFactor");
  const ignoreSize = document.getElementById("ignoreSize");
  const hideLabels = document.getElementById("hideLabels");
  const hexagonalFiles = document.getElementById("hexagonalFiles");
 
  const folderSummary = document.getElementById("folderSummary"); //Global Folder Summary
  const breadcrumbsDiv = document.getElementById("breadcrumbs"); // New Breadcrumbs div
 
  let searchTerm = ""; // Current search term
  const searchSummary = document.getElementById("searchSummarycontainer"); // Search summary container
  const searchInput = document.getElementById("searchInput"); // New Search input
  const seeResultsButton = document.getElementById("seeResultsButton"); // Button to view search results
  const searchCount = document.getElementById("searchCount"); // Search result count
  const searchSum = document.getElementById("searchSummary"); // Search result size

  const visualizationColumn = document.getElementById("visualizationColumn");

  let currentDataNodes = []; // Store the flattened nodes for event handling
  let rootNodeData = null; // Store the original root data for full zoom out
  let hoveredNode = window.hoveredNode || null; // Track the node currently under the mouse
  let selectedNode = window.selectedNode ||null; // Track the node currently selected by click for details panel
  let currentZoomNode = window.currentZoomNode ||null; // Track the node currently zoomed into
    let filtered = false;   
    let filterString = "";
  let isAnimating = false;
  let isDragging = false;
  let startX, startY;
  const dragThreshold = 5; // Minimum pixels moved to count as a drag

  // D3 Zoom transform state (k for scale, x/y for translate)
  let transform = d3.zoomIdentity;

  // Define color scales
  const categoricalColorScale = d3.scaleOrdinal([
    "#ED6631",
    "#1A845C",
    "#2A73D9",
    "#F3BE0A",
    "#E78F89",
    "#B24D25",
    "#126745",
    "#2056A3",
    "#C08F08",
    "#B55C56",
    "#FBE0D6",
    "#BDE2C7",
    "#CADCF5",
    "#FCEFC2",
    "#FBE7E7",
    "#F9CFBF",
    "#F7B89F",
    "#F28F68", //shades of orange
    "#9AD2A9",
    "#76C38B",
    "#53B36D", //shades of green //(d3.schemeTableau10);
    "#B4CEF1",
    "#94B9EC",
    "#5F96E3", //shades of blue
    "#F5E3A4",
    "#F9DF8A",
    "#F6CE47", //shades of yellow
    "#F7DBDB",
    "#F8D5D5",
    "#F4B5B5", //shades of himalayan salt pink - oh get lost branding people.
  ]);
  const exponentialColorScale = d3
    .scalePow()
    .exponent(1)
    .range(["#030302", "#F2EFEC"]); //d3.scaleSequential(d3.interpolateBlues); // Using interpolateRainbow for all hues
  // const linearRainbowColorScale = d3.scaleLinear().range(['#FBE0D6','#B24D25']); //Shades of orange
  const linearRainbowColorScale = d3
    .scaleLinear()
    .range(["#98edfa", "#f26e6e"])
    .interpolate(d3.interpolateHslLong); // Rainbow for folder depth
  const linearBWColorScale1 = d3
    .scaleLinear()
    .range(["#000000", "#ebebeb"]); // Shades of black white and orange for file and folder date
  const linearBWColorScale2 = d3.scaleLinear().range(["#009900", "#F2EFEC"]); // Shades of green and white for folder depth

  window.categoricalColorScale = categoricalColorScale;
  window.exponentialColorScale = exponentialColorScale;
  window.linearRainbowColorScale = linearRainbowColorScale;
  window.linearBWColorScale1 = linearBWColorScale1;
  window.drawVisualization = drawVisualization;
  window.currentFilterFunction = null;
  window.currentFilterDescription = null;

 // Dummy Data
  const defaultData = {
    path: "C:\\Demo",
    name: "Demo",
    type: "folder",
    value: "0",
    children: [
      {
        path: "C:\\Demo\\Files and Folders",
        name: "Files and Folders",
        type: "folder",
        value: "0",
        children: [
          {
            path: "C:\\Demo\\Files and Folders",
            name: "Email.txt",
            type: "txt",
            value: 56715,
            last_modified_unix: 1754869509.9825919,
            last_modified_iso: "2025-08-11T00:45:09.982592",
          },
          {
            path: "C:\\Demo\\Files and Folders",
            name: "Very simply",
            type: "folder",
            value: 0,
            last_modified_unix: 1753489154.0142784,
            last_modified_iso: "2025-07-26T01:19:14.014278",
            children: [
              {
                path: "C:\\Demo\\Files and Folders\\Very simply",
                name: "_",
                type: "folder",
                value: 0,
                last_modified_unix: 1753489154.0142784,
                last_modified_iso: "2025-07-26T01:19:14.014278",
                children: [
                  {
                    path: "C:\\Demo\\Files and Folders\\Very simply",
                    name: "Plans for World Domination.ppt",
                    type: "ppt",
                    value: 290968,
                    last_modified_unix: 1753489154.0142784,
                    last_modified_iso: "2025-07-26T01:19:14.014278",
                  },
                ],
              },
            ],
          },
        ],
        last_modified_unix: 1754869475.4944975,
        last_modified_iso: "2025-08-11T00:44:35.494498",
      },
      {
        path: "C:\\Demo\\See All",
        name: "See All",
        type: "folder",
        value: "0",
        children: [
          {
            path: "C:\\Demo\\See All\\Project 1",
            name: "Project 1",
            type: "folder",
            value: "0",
            last_modified_unix: 1754869174.2042792,
            last_modified_iso: "2025-08-11T00:39:34.204279",
            children: [
              {
                path: "C:\\Demo\\See All\\Project 1",
                name: "Data - Copy.json",
                type: "json",
                value: 105486,
                last_modified_unix: 1754352061.709732,
                last_modified_iso: "2025-08-05T01:01:01.709732",
              },
              {
                path: "C:\\Demo\\See All\\Project 1",
                name: "Data.json",
                type: "json",
                value: 105486,
                last_modified_unix: 1754352061.709732,
                last_modified_iso: "2025-08-05T01:01:01.709732",
              },
              {
                path: "C:\\Demo\\See All\\Project 1",
                name: "Photo.jpg",
                type: "jpg",
                value: 105486,
                last_modified_unix: 1754352061.709732,
                last_modified_iso: "2025-08-05T01:01:01.709732",
              },
              {
                path: "C:\\Demo\\See All\\Project 1",
                name: "Email.msg",
                type: "msg",
                value: 105486,
                last_modified_unix: 1754352061.709732,
                last_modified_iso: "2025-08-05T01:01:01.709732",
              },
              {
                path: "C:\\Demo\\See All\\Project 1",
                name: "Report.txt",
                type: "txt",
                value: 211468,
                last_modified_unix: 1754691194.7485082,
                last_modified_iso: "2025-08-08T23:13:14.748508",
              },
              {
                path: "C:\\Demo\\See All\\Project 1",
                name: "Report_2.txt",
                type: "txt",
                value: 105486,
                last_modified_unix: 1754352061.709732,
                last_modified_iso: "2025-08-05T01:01:01.709732",
              },
              {
                path: "C:\\Demo\\See All\\Project 1",
                name: "Report.txt",
                type: "txt",
                value: 105486,
                last_modified_unix: 1754352061.709732,
                last_modified_iso: "2025-08-05T01:01:01.709732",
              },
            ],
          },
          {
            path: "C:\\Demo\\See All\\Project 2",
            name: "Project 2",
            type: "folder",
            value: "0",
            last_modified_unix: 1754687388.2418442,
            last_modified_iso: "2025-08-08T22:09:48.241844",
            children: [
              {
                path: "C:\\Demo\\See All\\Project 2",
                name: "Data.jpg",
                type: "jpg",
                value: 105486,
                last_modified_unix: 1754352061.709732,
                last_modified_iso: "2025-08-05T01:01:01.709732",
              },
              {
                path: "C:\\Demo\\See All\\Project 2",
                name: "Email.msg",
                type: "msg",
                value: 105486,
                last_modified_unix: 1754352061.709732,
                last_modified_iso: "2025-08-05T01:01:01.709732",
              },
              {
                path: "C:\\Demo\\See All\\Project 2",
                name: "Report.txt",
                type: "txt",
                value: 105486,
                last_modified_unix: 1754352061.709732,
                last_modified_iso: "2025-08-05T01:01:01.709732",
              },
            ],
          },
          {
            path: "C:\\Demo\\See All\\Project 3",
            name: "Project 3",
            type: "folder",
            value: "0",
            last_modified_unix: 1754687390.5936754,
            last_modified_iso: "2025-08-08T22:09:50.593675",
            children: [
              {
                path: "C:\\Demo\\See All\\Project 3",
                name: "Nircles User Manual.doc",
                type: "doc",
                value: 145486,
                last_modified_unix: 1754352061.709732,
                last_modified_iso: "2025-08-05T01:01:01.709732",
              },
              {
                path: "C:\\Demo\\See All\\Project 3",
                name: "Nircles.msg",
                type: "msg",
                value: 15486,
                last_modified_unix: 1754352061.709732,
                last_modified_iso: "2025-08-05T01:01:01.709732",
              },
              {
                path: "C:\\Demo\\See All\\Project 3",
                name: "Folder Summary.ncl",
                type: "txt",
                value: 105486,
                last_modified_unix: 1754352061.709732,
                last_modified_iso: "2025-08-05T01:01:01.709732",
              },
            ],
          },
          {
            path: "C:\\Demo\\See All",
            name: "New Text Document.txt",
            type: "txt",
            value: 2000,
            last_modified_unix: 1754869366.4957943,
            last_modified_iso: "2025-08-11T00:42:46.495794",
          },
        ],
        last_modified_unix: 1754869366.4957943,
        last_modified_iso: "2025-08-11T00:42:46.495794",
      },
      {
        path: "C:\\Demo\\Of Your",
        name: "Of Your",
        type: "folder",
        value: "0",
        children: [
          {
            path: "C:\\Demo\\Of Your\\Alpha",
            name: "Alpha",
            type: "folder",
            value: "0",
            last_modified_unix: 1754690947.0562656,
            last_modified_iso: "2025-08-08T23:09:07.056266",
            children: [
              {
                path: "C:\\Demo\\Of Your\\Alpha",
                name: "Data.json",
                type: "json",
                value: 125486,
                last_modified_unix: 1754352061.709732,
                last_modified_iso: "2025-08-05T01:01:01.709732",
              },
              {
                path: "C:\\Demo\\Of Your\\Alpha",
                name: "Email.msg",
                type: "msg",
                value: 105486,
                last_modified_unix: 1754352061.709732,
                last_modified_iso: "2025-08-05T01:01:01.709732",
              },
              {
                path: "C:\\Demo\\Of Your\\Alpha",
                name: "Photo.png",
                type: "png",
                value: 105486,
                last_modified_unix: 1754352061.709732,
                last_modified_iso: "2025-08-05T01:01:01.709732",
              },
            ],
          },
          {
            path: "C:\\Demo\\Of Your\\Beta",
            name: "Beta",
            type: "folder",
            value: "0",
            last_modified_unix: 1754687428.2360988,
            last_modified_iso: "2025-08-08T22:10:28.236099",
            children: [
              {
                path: "C:\\Demo\\Of Your\\Beta",
                name: "Data.json",
                type: "json",
                value: 55486,
                last_modified_unix: 1754352061.709732,
                last_modified_iso: "2025-08-05T01:01:01.709732",
              },
              {
                path: "C:\\Demo\\Of Your\\Beta",
                name: "Email.msg",
                type: "msg",
                value: 45486,
                last_modified_unix: 1754352061.709732,
                last_modified_iso: "2025-08-05T01:01:01.709732",
              },
              {
                path: "C:\\Demo\\Of Your\\Beta",
                name: "Report.doc",
                type: "doc",
                value: 35486,
                last_modified_unix: 1754352061.709732,
                last_modified_iso: "2025-08-05T01:01:01.709732",
              },
            ],
          },
        ],
        last_modified_unix: 1754869202.896482,
        last_modified_iso: "2025-08-11T00:40:02.896482",
      },
    ],
    last_modified_unix: 1754869174.2052796,
    last_modified_iso: "2025-08-11T00:39:34.205280",
  };


  // Initial load with dummy data
  rootNodeData = defaultData;
  window.originalFullData = JSON.parse(JSON.stringify(rootNodeData));
  processAndRenderVisualization(rootNodeData);
  // zoomToNode(rootNodeData);
  updateBreadcrumbs();

  // D3 Zoom behavior
  const zoom = d3
    .zoom()
    .scaleExtent([0.005, 1000]) 
    .on("zoom", (event) => {
      transform = event.transform;
      drawVisualization();
      drawHighlights(); // Sync overlay with zoom
    });

  // Apply zoom behavior to the canvas
  //d3.select(canvas).call(zoom);

 
    function filterHierarchy(node, matchesSearch) {
        filtered = true;
    // 1. If the current node matches, we keep it and EVERYTHING inside it
    if (matchesSearch(node)) {
      return JSON.parse(JSON.stringify(node)); // Return a deep copy of the whole branch
    }
    // 2. If the node doesn't match, check if it has children to explore
    if (node.children && node.children.length > 0) {
      // Recursively filter the children
      const filteredChildren = node.children
        .map((child) => filterHierarchy(child, matchesSearch))
        .filter((child) => child !== null);

      // 3. If any children were kept, keep this parent node too
      if (filteredChildren.length > 0) {
        const newNode = { ...node };
        newNode.children = filteredChildren;
        return newNode;
      }
    }
    // 4. No match here and no matching descendants
    return null;
  }
  function filteroutHierarchy(node, mismatchesSearch) {
            filtered = true;
// 1. If the current node matches, we remove it and EVERYTHING inside it
    if (!mismatchesSearch(node)) {
      return null;
    }
    // 2. If the node doesn't match, check if it has children to explore
    if (node.children && node.children.length >= 0) {
      // Recursively filter the children
      const filteredChildren = node.children
        .map((child) => filteroutHierarchy(child, mismatchesSearch))
        .filter((child) => child !== null);

      // 3. If any children were kept, keep this parent node too
      if (filteredChildren.length >= 0) {
        const newNode = { ...node };
        newNode.children = filteredChildren;
        return newNode;
      } else {
        // If no children are kept, we still want to keep this node (as an empty folder)
        return node;
      }
    }

    // 4. No match here and no matching descendants
    return node;
  }
    initiateVisuals(rootNodeData);

  //////////////////////////////////////////////////////////////////////////////
  ///////////////////    Event listeners for everything ////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  //Event listener for "New Scan" button
  // when we have the scanning functionality, this will trigger the scan and then load the resulting JSON, for now it just loads the default data again.
  newScanButton.addEventListener("click", function () {
    // Placeholder for scan functionality
    displayMessageBox("Scan functionality coming soon! For now, this button reloads the default demo data.", "Info");
    resetButton.click();
  });

  // Event listener for the "Load JSON File" button
  loadJsonFileButton.addEventListener("click", function () {
    jsonFileLoad.click(); // Trigger the hidden file input click
      });

  // Event listener for when a file is selected via the input
  jsonFileLoad.addEventListener("change", function (event) {
      resetZoom(); // Reset zoom to fit the new data
    const file = event.target.files[0];
    if (!file) {
      return; // No file selected
    }

    saveScanButton.addEventListener("click", function () {
      // placeholder for save functionality - currently just saves the original data loaded.
     
      // Export the data as a JSON file
      displayMessageBox("Save functionality coming soon! For now, this button will download the original data loaded.", "Info");
    });


    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        window.rootNodeData = JSON.parse(e.target.result); // Store original root data
        rootNodeData = JSON.parse(e.target.result); // Set current root data
        processAndRenderVisualization(rootNodeData);
        window.originalFullData = JSON.parse(JSON.stringify(rootNodeData)); // Update the reset function
        searchInput.value = ""; // Clear search on new load
        searchTerm = "";
        folderSummary.value = ""; //Clear summary
        searchInput.value = "";
        resetButton.classList.add("hidden");
        filtered = false;
        filterString = "";
        window.currentFilterFunction = null; // Clear any graph filters
        window.currentFilterDescription = null; 
        updateBreadcrumbs();
        initiateVisuals(rootNodeData);

      } catch (error) {
        displayMessageBox(
          "Error reading or parsing the JSON file.\nError: " + error.message,
          "Error",
          );
      }
    };
    reader.onerror = function () {
        displayMessageBox("Failed to read the file.", "Error");
    };
    reader.readAsText(file); // Read the file content as text
});

  // Event listener for color selection change
  if (colorBySelect) {
    colorBySelect.addEventListener("change", function () {
      if (currentDataNodes.length > 0) {
        window.currentFilterFunction = null;
        window.currentFilterDescription = null;
        initiateVisuals(rootNodeData);
        processAndRenderVisualization(rootNodeData); // Re-draw with new sort criteria
        drawVisualization(); // Re-draw with new color scheme
      }
    });
  }

  // Event listener for sorting criteria change
  if (sortBySelect) {
    sortBySelect.addEventListener("change", function () {
      processAndRenderVisualization(rootNodeData); // Re-draw with new sort criteria
          initiateVisuals(rootNodeData);
zoomToNode(currentZoomNode); 
    });
  }
  // Event listener for sorting criteria change
  if (hideLabels) {
    hideLabels.addEventListener("change", function () {
      processAndRenderVisualization(rootNodeData); // Re-draw with new sort criteria
      zoomToNode(currentZoomNode);
    });
  }

  // Event listener for hexagonal files  change
  if (hexagonalFiles) {
  hexagonalFiles.addEventListener("change", function () {
    processAndRenderVisualization(rootNodeData); // Re-draw with new sort criteria
    zoomToNode(currentZoomNode);
  });
  }

  // Event listener for padding criteria input
  if (paddingFactorslider) {
  paddingFactorslider.addEventListener("input", function () {
    processAndRenderVisualization(rootNodeData); // Re-draw with new sort criteria
    zoomToNode(currentZoomNode); 
  });
  }

  // Event listener for date colour criteria input
  dateCutoff.addEventListener("input", function () {
    processAndRenderVisualization(rootNodeData); // Re-draw with new sort criteria
    zoomToNode(currentZoomNode); 
  });

  // Event listener for file size criteria change
  if (ignoreSize) {
    ignoreSize.addEventListener("input", function () {
      processAndRenderVisualization(rootNodeData); // Re-draw with new sort criteria
      zoomToNode(currentZoomNode); 
    });
  } else {
    ignoreSize.value = 100;
  } 

  // Event listener for Zoom Out button
  if (zoomOutButton) {
    zoomOutButton.addEventListener("click", function () {
      zoomToNode(currentDataNodes[0]);
    });
  }

   copyPathButton.addEventListener("click", function() {
    // Determine which path to copy: the selected node or the current zoomed node
   const nodeToCopy = selectedNode || currentZoomNode || null;
    // Construct the full path
    const fullPath = nodeToCopy.children ? nodeToCopy.data.path : `${nodeToCopy.data.path}\\${nodeToCopy.data.name}`;

    // Use the Clipboard API
    navigator.clipboard.writeText(fullPath).then(() => {
        // Visual feedback: change button text temporarily
        copyPathButton.textContent = "Copied!";
        setTimeout(() => {copyPathButton.textContent = "Copy Path";}, 2000);
    }).catch(err => {
        displayMessageBox("Failed to copy path: " + err, "Error");
    });
});

  // Event listener for Export PNG button
  exportPngButton.addEventListener("click", function () {
    exportCanvasAsPNG();
  });
  // Event listener for Export SVG button
  exportSvgButton.addEventListener("click", function () {
    exportAsSVG();
  });


  // Event listener for Search input
  searchInput.addEventListener("input", function () {
    searchTerm = this.value.toLowerCase();
        initiateVisuals(rootNodeData);
drawVisualization(); // Redraw to apply search highlighting
  });

   filterButton.addEventListener("click", function () {
    const hasGraphFilter = window.currentFilterFunction !== null;
    if (searchTerm.length < 2 && !hasGraphFilter) {
      displayMessageBox(
        "Please enter a search term to filter.",
        "Filter would remove everything",
      );
      return;
    }
    
    let desc = "";
    if (searchTerm.length >= 2) desc += `"${searchTerm}"`;
    if (hasGraphFilter && window.currentFilterDescription) {
        if (desc) desc += " and ";
        desc += window.currentFilterDescription;
    }
    
    filterString = filterString + (filterString ? " | " : "") + "Filtered with " + desc;
    
    const matchesSearch = (d) => {
        const term = searchTerm.toLowerCase();
        const nameMatch = term.length < 2 || d.name.toLowerCase().includes(term);
        // Allow folders to pass the graph filter check so traversal continues.
        // The drawing loop will hide specific files that don't match.
        const isFolder = d.children && d.children.length > 0;
        const graphMatch = !window.currentFilterFunction || isFolder || window.currentFilterFunction(d);
        return nameMatch && graphMatch;
    };
    // Apply the recursive filter to the current rootNodeData
    const filteredData = filterHierarchy(rootNodeData, matchesSearch);

    if (filteredData) {
      rootNodeData = filteredData;
      processAndRenderVisualization(rootNodeData);
      resetZoom();
    } else {
      displayMessageBox("Filter would remove everything", "Filter removed");
    }

    resetButton.classList.remove("hidden");
    searchTerm = "";  
    searchInput.value = "";
   });
  
  filterOutButton.addEventListener("click", function () {
    const hasGraphFilter = window.currentFilterFunction !== null;
    if (searchTerm.length < 2 && !hasGraphFilter) {
      displayMessageBox( "Filter would remove everything", "Filter removed");
      return;
    }

    let desc = "";
    if (searchTerm.length >= 2) desc += `"${searchTerm}"`;
    if (hasGraphFilter && window.currentFilterDescription) {
        if (desc) desc += " and ";
        desc += window.currentFilterDescription;
    }
    filterString = filterString + (filterString ? " | " : "") + "Filtered without " + desc;

    const mismatchesSearch = (d) => {
        const term = searchTerm.toLowerCase();
        // We want to KEEP things that do NOT match the search term
        // But we must also respect the graph filter (keep things that DO match the graph)
        // Folders must pass the graph filter check to ensure we don't prune the tree root.
        const isFolder = d.children && d.children.length > 0;
        
        if (term.length >= 2) {
             // Standard: Remove text matches, but keep items within the graph selection
             return !d.name.toLowerCase().includes(term) && (!window.currentFilterFunction || isFolder || window.currentFilterFunction(d));
        } else {
             // No text search: Invert the graph selection (Remove what is brushed)
             return isFolder || !window.currentFilterFunction || !window.currentFilterFunction(d);
        }
    };
    // Apply the recursive filter to the current rootNodeData but invert the match to filter out
    const filteredData = filteroutHierarchy(rootNodeData, mismatchesSearch);

    if (filteredData) {
      rootNodeData = filteredData;
      processAndRenderVisualization(rootNodeData);
      resetZoom();
    } else {
      displayMessageBox("No results found to filter out.", "Filter would remove everything");
    }

    resetButton.classList.remove("hidden");
    searchTerm = "";
    searchInput.value = "";
  });
  seeResultsButton.addEventListener("click", function () {
    displaySearchResultsBox();  
  });
  showAboutPageButton.addEventListener("click", function () {
    displayAboutBox();
  });

viewSettings.addEventListener("click", function () {
  displaySettingsBox();
});


  resetButton.addEventListener("click", function () {
    // Restore from the very first loaded dataset
    rootNodeData = JSON.parse(JSON.stringify(window.originalFullData));
    resetButton.classList.add("hidden");
      filtered = false;
      filterString = "";
    searchTerm = "";
    searchInput.value = "";
    processAndRenderVisualization(rootNodeData);
    resetZoom();
  });
  
    // Trigger filter when "Enter" is pressed in the search box
searchInput.addEventListener('keyup', function (event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        
        const currentSearch = searchInput.value.trim();
        
      if (currentSearch.length >= 2) {
        if (event.shiftKey && event.key === 'Enter') {
          filterOutButton.click();
        } else {
          filterButton.click();
        }
      } else if (currentSearch.length === 0 && !window.currentFilterFunction) {
            // If they hit enter on an empty box, reset the view
            resetButton.click();
        } else {
            displayMessageBox("Please enter at least 2 characters to filter.", "Info");
        }
  }
});

// //////////////////////////////////////////////////////////////////////
// //////////////////////////////////////////////////////////////////////
// //////////////////////////////////////////////////////////////////////
// //////////////////////////////////////////////////////////////////////
  function exportAsSVG() {
    const svgWidth = canvas.width;
    const svgHeight = canvas.height;
    const svg = d3.create("svg")
      .attr("width", svgWidth)
      .attr("height", svgHeight);

    const nodesGroup = svg.append("g").attr("class", "nodes");

    currentDataNodes.forEach((node) => {
      const group = nodesGroup.append("g").attr("transform", `translate(${node.x},${node.y})`);

      group.append("circle")
        .attr("r", node.r)
        .attr("fill", getNodeColor(node));

      if (!hideLabels.checked && node.r > 20) {
        group.append("text")
          .attr("text-anchor", "middle")
          .attr("dy", "0.35em")
          .attr("wrap", "wrap")
          .attr("font-size", Math.min(12, node.r / 3))
          .attr("font-family", "Roboto")
          .attr("fill", "#000")
          .text(node.data.name);
      }
    });
    const nodeName = currentZoomNode ? currentZoomNode.data.name : "";
    const rootName = rootNodeData.name;
    const dateStr = new Date().toISOString().split('T')[0];

    const blob = new Blob([svg.node().outerHTML], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const fileName = `${rootName}-${nodeName}-${dateStr}`.replace(/[^a-z0-9 _-]/gi, '-');
    link.href = url;
    link.download = `${fileName}.svg`;
    link.click();
  }

  function initiateVisuals(data) {
    if (typeof InteractionGraphs === 'function') {
      InteractionGraphs(data, '#interaction-graph-container');
    }
    if (typeof createFolderTree === 'function') {
      createFolderTree(data, '#folder-tree-container');
    }
    if (typeof createSunburst === 'function') {
      createSunburst(data, '#sunburst-container');
    }
    if (typeof createTreemap === 'function') {
      createTreemap(data, '#treemap-container');
    }
  }

  //////////////////////////////////////////////////////////////////
  /////////////        Draw                       //////////////////
  //////////////////////////////////////////////////////////////////
  // Function to process data and then draw
  function processAndRenderVisualization(data) {
        const containerWidth = visualizationColumn.offsetWidth;
    // Set canvas height relative to window height, capped by container width for square aspect
    const containerHeight = Math.min(containerWidth, window.innerHeight * 0.9);

    canvas.width = containerWidth;
    canvas.height = containerHeight;

    const oldNodeMap = new Map();
    currentDataNodes.forEach((node) => {
      // Create a unique key using path and name
      const key = node.data.path + (node.data.name || "");
      oldNodeMap.set(key, { x: node.x, y: node.y, r: node.r });
    });
    
    const root = d3
    .hierarchy(data)
    .sum((d) => Math.pow(d.value, ignoreSize.value / 100)) //ignoreSize.checked ?  (d.value / d.value) : +d.value)
    .sort((a, b) => sortItOut(a, b));
    
    const pack = d3
    .pack()
    .size([containerWidth, containerHeight])
    .padding(Math.pow(paddingFactorslider.value / 1200, 2)); //Original value 0.3
    
    currentDataNodes = pack(root).descendants();
    const targetNodes = pack(root).descendants();
    setColorDomains(); 

    targetNodes.forEach((node) => {
      const key = node.data.path + (node.data.name || "");
      const oldState = oldNodeMap.get(key);

      if (oldState) {
        node.sx = oldState.x;
        node.sy = oldState.y;
        node.sr = oldState.r;
      } else {
        // If it's a new node, animate it from its target position but starting at radius 0
          node.sx = canvas.width / 2; //node.x;
          node.sy = canvas.height / 2;  //node.y;
        node.sr = 0;
      }

      // Store target positions to interpolate toward
      node.tx = node.x;
      node.ty = node.y;
      node.tr = node.r;
    });

    // Run the Animation Timer
    const duration = 1750; // milliseconds
    const ease = d3.easeCubicInOut;
    isAnimating = true; // SET FLAG: Stop drawing labels
    const timer = d3.timer((elapsed) => {
      const t = Math.min(1, ease(elapsed / duration));

      targetNodes.forEach((node) => {
        node.x = node.sx + (node.tx - node.sx) * t;
        node.y = node.sy + (node.ty - node.sy) * t;
        node.r = node.sr + (node.tr - node.sr) * t;
      });

      // Update the global reference and draw
      currentDataNodes = targetNodes;
      currentZoomNode = currentDataNodes[0];
      window.currentZoomNode = currentZoomNode; // Ensure global reference is updated during animation
        //processAndRenderVisualization();
      drawVisualization();

      if (t === 1) {
        timer.stop();
        isAnimating = false;
        setColorDomains(); // Refresh legend colors after animation finishes
        updateSummary(); // Update summary after animation finishes
      }
    });
  }

  function isEven(n) {
    return n % 2 == 0;
  }
  function isOdd(n) {
    return Math.abs(n % 2) == 1;
  }
  function isaFolder(d) {
    if (d.data.type === "folder"|| d.data.type === "Folder" || d.data.type === "Directory" || d.data.type === "directory") {
      return true;
    } else {
      return false;
    }
  }
  function applyCurrentZoom() {
    // Apply current zoom transform
    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.k, transform.k);
  }
  function updateSummary() {
    const directories = currentDataNodes.filter((d) => isaFolder(d));
    const files = currentDataNodes.filter((d) => !isaFolder(d));
    const ratio = files.length / directories.length;
    folderSummary.innerHTML = `<div> ${currentDataNodes[0].data.name} contains</div> 
      <div>${directories.length} folders and ${files.length} files. </div>
      <div>Total ${currentDataNodes.length} items. Ratio ${ratio.toFixed(2)}</div> 
      <div>Total size ${formatBytes(currentDataNodes[0].value)} </div>`;
    if (filtered) {
      folderSummary.innerHTML = `<div> ${currentDataNodes[0].data.name} filtered ${filterString} contains ${currentDataNodes.length} items. </div>
      <div>Total size ${formatBytes(currentDataNodes[0].value)} </div>`;
      }
  }
  function searchHelper(d) {
    
  }

  // Function to draw all circles and text on the canvas
  function drawVisualization() {
    const minRadius = 1.2;
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the entire canvas
    updateSummary ();
    applyCurrentZoom();

    // Helper to check if a node matches the search term
    const matchesSearch = (d) => {
        const term = searchTerm.toLowerCase();
        const nameMatch = term.length < 2 || d.data.name.toLowerCase().includes(term);
        const graphMatch = !window.currentFilterFunction || window.currentFilterFunction(d.data);
        return nameMatch && graphMatch;
    };

    searchCount.textContent = "";
    searchSum.textContent = "";

    // Determine if any filtering is active (Search text OR Graph brush)
    const isFiltering = searchTerm.length > 1 || window.currentFilterFunction !== null;

    if (isFiltering) {
      searchLogic(matchesSearch);
      filterButton.classList.remove("hidden");
      filterOutButton.classList.remove("hidden");
      searchSummary.classList.remove("hidden");
    } else {
      searchSummary.classList.remove("hidden");
      filterButton.classList.add("hidden");
      filterOutButton.classList.add("hidden");
      searchResults = "";
      searchCount.textContent = "";
      searchSum.textContent = "";
      updateSearchResults(searchResults);
    }

    // Draw directories first (largest to smallest radius), then files
    const directories = currentDataNodes
      .filter((d) => isaFolder(d))
      .sort((a, b) => b.r - a.r);
    directories.forEach((d) => {
      if ( // Check if the node is within the current viewport before drawing
        d.x - d.r < (canvas.width - transform.x) / transform.k &&
        d.x + d.r > (0 - transform.x) / transform.k &&
        d.y - d.r < (canvas.height - transform.y) / transform.k &&
        d.y + d.r > (0 - transform.y) / transform.k
      ) {
        if ( // Only draw if it's above the minimum radius threshold or matches the search term
          d.r * transform.k > minRadius ||
          (isFiltering && matchesSearch(d))
        ) {
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r, 0, 2 * Math.PI);
          ctx.fillStyle = getNodeColor(d);

          // Highlight for hover, selection, zoom, or search match
          let strokeColor = "#111"; // Default black
          let lineWidth = 0.5 / transform.k;

          if (d === hoveredNode) {
           strokeColor = "#ffa135"; // Orange highlight
            lineWidth = 4 / transform.k;
          }
          if (d === selectedNode ||
              d === currentZoomNode) {
            strokeColor = "#ff7e27"; // Orange for active states
            lineWidth = 5 / transform.k;
          }

          if (isFiltering && matchesSearch(d)) {
            strokeColor = "#ff8800"; // Orange tint for search match
            lineWidth = 2.5 / transform.k;
          }

          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = lineWidth;

          ctx.globalAlpha = 1.0; // Reset opacity
          // Dim non-matching nodes if a search term is active
          if (isFiltering && !matchesSearch(d)) {
            ctx.globalAlpha = 0.12; // Reduce opacity
          }
          ctx.fill();
          ctx.stroke();
        }
      }
    });

    //////////////////////////////////////////////////////////////////////////
    /////////////////////// Draw the Files ///////////////////////////////////
    //////////////////////////////////////////////////////////////////////////

    const files = currentDataNodes.filter((d) => !isaFolder(d));
    files.forEach((d) => {
      if (
        d.x - d.r < (canvas.width - transform.x) / transform.k &&
        d.x + d.r > (0 - transform.x) / transform.k &&
        d.y - d.r < (canvas.height - transform.y) / transform.k &&
        d.y + d.r > (0 - transform.y) / transform.k
      ) {
        if (
          d.r * transform.k > minRadius ||
          (isFiltering && matchesSearch(d))
        ) {

          if (!hexagonalFiles.checked){
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.r, 0, 2 * Math.PI);
          } else {
            const polySides = 6;
            ctx.beginPath();
            for (let i = 0; i < polySides; i++) {
              const angle = (2* Math.PI / polySides) * i;
              const x = d.x + d.r * Math.sin(angle);
              const y = d.y + d.r * Math.cos(angle);
              if (i === 0) {
                ctx.moveTo(x, y);
              } else {
                ctx.lineTo(x, y);
              }
            }
            ctx.closePath();
          }

          ctx.fillStyle = getNodeColor(d);

          // Highlight for hover, selection, zoom, or search match
          let strokeColor = "#fff"; // Default file white
          let lineWidth = 0.5 / transform.k;

          if (d === hoveredNode || d === selectedNode) {
            //strokeColor = "#ffa135"; // Orange for active states
            lineWidth = 2.5 / transform.k;
          }

          if (isFiltering && matchesSearch(d)) {
            strokeColor = "#ED6631"; // Orange tint for search match
            lineWidth = 5 / transform.k;
          }

          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = lineWidth;
          //ctx.stroke();

          ctx.globalAlpha = 1.0; // Reset opacity
          // Dim non-matching nodes if a search term is active
          if (isFiltering && !matchesSearch(d)) {
            ctx.globalAlpha = 0.12; // Reduce opacity
          }
          ctx.fill();
          ctx.stroke();
        }
      }
    });

    ///////////////////////////////////////////////// Draw text labels        ///////////////////////////
    
 currentDataNodes.forEach((d) => {
      const relSize = 2 * d.r * transform.k;
      const isVisibleInZoom =
        (!hideLabels.checked && currentZoomNode === null && d.depth === 0) || // Show root if not zoomed
        (!hideLabels.checked &&
          currentZoomNode !== null &&
          d === currentZoomNode) || // || (d.parent === currentZoomNode)));
        (!hideLabels.checked &&
          d.parent !== null &&
          //d.parent === currentZoomNode &&
          1.3 * Math.min(canvas.width, canvas.height) > relSize &&
          relSize > 100); // Visible size range

      if (isVisibleInZoom && !isAnimating) {
        const text = d.data.name;
        ctx.globalAlpha = 1.0; // Reset opacity
        titleFont = "Roboto, sans-serif";
        // Dim non-matching nodes if a search term is active
        if (isFiltering && !matchesSearch(d)) {
          ctx.globalAlpha = 0.12; // Reduce opacity
        }
        let textangle = 30;
        if (isEven(d.depth)) {
          textangle = -30;
        }
        //Folder Text
        if (d.children) {
          var fontSizeTitle = 18 / (transform.k * 1.2);
          if (d === currentZoomNode) {
            fontSizeTitle = fontSizeTitle * 2;
          }
          var mainTextColor = [74, 74, 74]; //"#4A4A4A",
          ctx.fillStyle = "#00000e";
          drawCircularText(
            ctx,
            text,
            fontSizeTitle,
            titleFont,
            d.x,
            d.y,
            d.r,
            textangle,
            0,
          ); //Text for Folders
        } else {
          var fontSize = 12 / transform.k;
          //if (d.parent === currentZoomNode || d === currentZoomNode) {
          drawFileText(
            ctx,
            text,
            fontSize,
            titleFont,
            d.x,
            d.y,
            d.r * 0.75,
            0,
            0,
          ); //Text for Files
          //}
        }
      }
    });
    ctx.restore(); // Restore context to original state
  }

  // New function to draw ONLY the dynamic highlights on the overlay
  function drawHighlights() {
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    if (!hoveredNode) return;

    overlayCtx.save();
    overlayCtx.translate(transform.x, transform.y);
    overlayCtx.scale(transform.k, transform.k);

    const d = hoveredNode;
    
    // Draw highlight stroke
    overlayCtx.beginPath();
    overlayCtx.arc(d.x, d.y, d.r, 0, 2 * Math.PI);
    overlayCtx.strokeStyle = "#ffa135";
    overlayCtx.lineWidth = 4 / transform.k;
    overlayCtx.stroke();

    // Draw label on top
    const titleFont = "Roboto, sans-serif";
    const text = d.data.name;
    let textangle = 30;
    if (isEven(d.depth)) textangle = -30;

    if (d.children) {
        var fontSizeTitle = 18 / (transform.k * 1.2);
        if (d === currentZoomNode) fontSizeTitle = fontSizeTitle * 2;
        drawCircularText(overlayCtx, text, fontSizeTitle, titleFont, d.x, d.y, d.r, textangle, 0);
    } else {
        var fontSize = 14 / transform.k;
        drawCircularText(overlayCtx, text, fontSize, titleFont, d.x, d.y, d.r * 0.75, 0, 0);
    }

    overlayCtx.restore();
  }

  // Search functionality
  function searchLogic(matchesSearch) {
    const match = currentDataNodes.filter(matchesSearch).length;
    const matchSum = currentDataNodes.filter(matchesSearch);
    let thisSum = 0;
    matchSum.forEach((d) => {
      thisSum = thisSum + d.value;
    });

    searchCount.textContent = match + " items";
    searchSum.textContent = formatBytes(thisSum);
    //White background if searching for something
    ctx.beginPath();
    ctx.arc(
      canvas.width / 2,
      canvas.height / 2,
      canvas.height / 2,
      0,
      2 * Math.PI,
    );
    ctx.fillStyle = "#F2EFEC";
    ctx.fill();
    const searchResults = Array.from(
      new Set(currentDataNodes.filter(matchesSearch)),
    );
    updateSearchResults(searchResults);
  }

  /////////////////////////////////////////////////
  /// Regular text with text wrap and wordwrap ////
  /////////////////////////////////////////////////

  function drawFileText(
    ctx,
    text,
    fontSize,
    titleFont,
    centerX,
    centerY,
    radius,
  ) {
    ctx.strokeStyle = "white";
    ctx.lineJoin = "circle";
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "center"; // Ensure we draw in exact center
    ctx.fillStyle = "rgb(25,25,25)";

    //text = text.toString();
    text = wrapText(ctx, text, radius * 2);
    ctx.font = fontSize + "px " + titleFont;

    ctx.save(); //Save the default state before doing any transformations
    ctx.translate(centerX, centerY); // Move to center
    for (var i = 0; i < text.length; i++) {
      //ctx.strokeText(text[i], 0, i*fontSize);
      ctx.fillText(text[i], 0, (i - text.length / 2 + 1) * fontSize);
    }
    ctx.restore(); //Restore to state as it was before transformations
  }

  function wrapText(ctx, text, maxWidth) {
    var lines = [];
    var letterLines = [];
    var words = text.split(/[-_ ]/);
    var currentLine = words[0];

    for (var i = 1; i < words.length; i++) {
      var word = words[i];
      var width = ctx.measureText(currentLine + " " + word).width;
      if (width < maxWidth) {
        currentLine += " " + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);

  
    return lines;
  }
  //////////////////////////////////////////////////////////////
  ////////////////////  Circular Text  /////////////////////////
  //////////////////////////////////////////////////////////////

  //Adjusted from: http://blog.graphicsgen.com/2015/03/html5-canvas-rounded-text.html
  function drawCircularText(
    ctx,
    text,
    fontSize,
    titleFont,
    centerX,
    centerY,
    radius,
    startAngle,
    kerning,
  ) {
    // startAngle:   In degrees, Where the text will be shown. 0 degrees if the top of the circle
    // kerning:     0 for normal gap between letters. Positive or negative number to expand/compact gap in pixels

    ctx.strokeStyle = "white";
    ctx.miterLimit = 1.6;
    ctx.lineJoin = "circle";

    //Setup letters and positioning
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgb(25,25,25)";

    startAngle = startAngle * (Math.PI / 180); // convert to radians
    text = text.toString().split("").reverse().join(""); // Reverse letters
    ctx.font = fontSize + "px " + titleFont;

    //Rotate 50% of total angle for center alignment
    for (var j = 0; j < text.length; j++) {
      var charWid = ctx.measureText(text[j]).width;
      startAngle +=
        (charWid + (j == text.length - 1 ? 0 : kerning)) / radius / 2;
    } //for j

    ctx.save(); //Save the default state before doing any transformations
    ctx.translate(centerX, centerY); // Move to center
    ctx.rotate(startAngle); //Rotate into final start position

    //Now for the fun bit: draw, rotate, and repeat
    for (var j = 0; j < text.length; j++) {
      var charWid = ctx.measureText(text[j]).width / 2; // half letter
      //Rotate half letter
      ctx.rotate(-charWid / radius);
      //Draw the character at "top" or "bottom" depending on inward or outward facing
      // draw an outline, then filled
      ctx.lineWidth = 0.15 * fontSize;
      ctx.lineJoin = "round";
      ctx.strokeText(text[j], 0, -radius);
      //Rotate half letter
      ctx.rotate(-(charWid + kerning) / radius);
    } //for j

    ctx.restore(); //Restore to state as it was before transformations

    ctx.save(); //Save the default state before doing any transformations
    ctx.translate(centerX, centerY); // Move to center
    ctx.rotate(startAngle); //Rotate into final start position

    //Now for the fun bit: draw, rotate, and repeat
    for (var j = 0; j < text.length; j++) {
      var charWid = ctx.measureText(text[j]).width / 2; // half letter
      //Rotate half letter
      ctx.rotate(-charWid / radius);
      //Draw the character at "top" or "bottom" depending on inward or outward facing
      // draw an outline, then filled
      ctx.lineWidth = 0;
      ctx.fillText(text[j], 0, -radius);
      //Rotate half letter
      ctx.rotate(-(charWid + kerning) / radius);
    } //for j

    ctx.restore(); //
  } //function drawCircularText

  //////////////////////////////////////////////////////////////
  //////////////////  Sorting Options  /////////////////////////
  //////////////////////////////////////////////////////////////
  // Function to sort based on selected option
  function sortItOut(a, b) {
    if (!sortBySelect) {
    return b.value - a.value;
  } else {
    const sortMode = sortBySelect.value;
    if (sortMode === "size") {
      // This is correct as .value is set by D3's .sum()
      return b.value - a.value;
    } else if (sortMode === "type") {
      return d3.descending(a.data.type, b.data.type);
    } else if (sortMode === "reverseSize") {
      return a.value - b.value;
    } else if (sortMode === "date") {
      return b.data.last_modified_unix - a.data.last_modified_unix;
    } else if (sortMode === "name") {
      return d3.descending(a.data.name, b.data.name);
    }
    }
  }

  // --- Bridge Functions for Folder Tree Interaction ---
  
  window.treeHoverNode = (treeNode) => {
      if (!treeNode) {
          hoveredNode = null;
          window.hoveredNode = null;
      } else {
          // Find matching node in the current visualization data
          const match = currentDataNodes.find(d => d.data.path === treeNode.data.path);
          if (match) {
              hoveredNode = match;
              window.hoveredNode = match;
          }
      }
      drawVisualization();
  };

  window.treeSelectNode = (treeNode) => {
      const match = currentDataNodes.find(d => d.data.path === treeNode.data.path);
      if (match) {
           // Trigger selection logic (simulating a click on the bubble)
           window.selectedNode = match;
           selectedNode = match;
           zoomToNode(match);
           selectedNodeDetails(match);
           
           // Sync back to tree (collapses others, highlights this one)
           if(typeof window.highlightNodeInTree === 'function') window.highlightNodeInTree(match);
           
           drawVisualization();
      }
  };

  // Function to sort based on selected option
  function sumItOut(d) {
    const sortMode = sortBySelect.value;
    if (sortMode === "size") {
      return d.value ? +d.value : 1;
    } else if (sortMode === "type") {
      return d.type ? +d.type : 1;
    } else if (sortMode === "reverseSize") {
      return d.value ? -d.value : 1;
    } else if (sortMode === "date") {
      return d.last_modified_unix ? +a.last_modified_unix : 1;
    } else if (sortMode === "name") {
      return d.name ? +d.name : 1;
    }
  }

  //////////////////////////////////////////////////////////////
  //////////////////      Colours      /////////////////////////
  //////////////////////////////////////////////////////////////
  function setColorDomains() {
    // Set domains for color scales
    const fileTypes = Array.from(
      new Set(
        currentDataNodes
          .filter((d) => !isaFolder(d) && d.data.type)
          .map((d) => d.data.type),
      ),
    );
    categoricalColorScale.domain(fileTypes);

    const allDates = currentDataNodes
      .filter((d) => d.data.last_modified_unix)
      .map((d) => d.data.last_modified_unix);
    const minDate = d3.min(allDates);
    const maxDate = d3.max(allDates);
    const dateRange = maxDate - minDate;


    const chosenDate = maxDate - (dateCutoff.value / 100) * dateRange;
    linearBWColorScale2.domain([minDate, maxDate]);
    linearBWColorScale1.domain([chosenDate, maxDate]);

    const allFileSizes = currentDataNodes
      .filter((d) => !isaFolder(d))
      .map((d) => d.value);
    const minFileSize = d3.min(allFileSizes) || 0;
    const maxFileSize = d3.max(allFileSizes) || 1; // Avoid division by zero
    exponentialColorScale.domain([minFileSize, maxFileSize]);

    const allFileDepths = currentDataNodes
      .filter((d) => !isaFolder(d))
      .map((d) => d.depth);
    const minFileDepth = d3.min(allFileDepths);
    const maxFileDepth = d3.max(allFileDepths);
    linearRainbowColorScale.domain([0, 5]);
    updateGraphVisibility();

  }

  // Function to get color based on selected option
  function getNodeColor(d) {
    const colorMode = colorBySelect.value;
    if (colorMode === "depth") {
      return linearRainbowColorScale(d.depth);
    } else if (colorMode === "date") {
      if (d.data.last_modified_unix) {
        return linearBWColorScale1(d.data.last_modified_unix); // Default grey if no date
      }
    } else if (colorMode === "fileSize") {
      return exponentialColorScale(d.value); //Files also show size
    } else {
      if (!isaFolder(d)) {
        // It's a directory (folder)
        return categoricalColorScale(d.data.type);
      }
      return exponentialColorScale(d.value); // Directories always show gradient
    }
    return "#fd4f0aff"; // Fallback default color
  }

  function updateGraphVisibility() {
    const typeLegendItems = document.getElementById("typeLegendItems");
    const dateLegendItems = document.getElementById("dateLegendItems");
    const depthLegendItems = document.getElementById("depthLegendItems");
    const fileSizeLegendItems = document.getElementById("fileSizeLegendItems");
    
    [typeLegendItems, dateLegendItems, depthLegendItems, fileSizeLegendItems].forEach(el => {
      if(el) el.classList.add("hidden");
    });

    if (colorBySelect.value === "type" && typeLegendItems) typeLegendItems.classList.remove("hidden");
    else if (colorBySelect.value === "date" && dateLegendItems) dateLegendItems.classList.remove("hidden");
    else if (colorBySelect.value === "depth" && depthLegendItems) depthLegendItems.classList.remove("hidden");
    else if (colorBySelect.value === "fileSize" && fileSizeLegendItems) fileSizeLegendItems.classList.remove("hidden");
  }

  function zoomToNode(node) {
    const width = canvas.width;
    const height = canvas.height;
    
    const k = Math.min(width, height) / (node.r * 2.125);
    const tx = width / 2 - node.x * k;
    const ty = height / 2 - node.y * k;
    
    const newTransform = d3.zoomIdentity.translate(tx, ty).scale(k);
    
    d3.transition().duration(750).tween("zoom", function () {
        const i = d3.interpolate(transform, newTransform);
        return function (t) {
            transform = i(t);
            drawVisualization();
        };
    }).on("end", () => {
        // VITAL: Update the D3 zoom state so panning starts from THIS position
        d3.select(canvas).property("__zoom", newTransform); 
        updateBreadcrumbs();
    });
    currentZoomNode = node;
}
  function resetZoom() {
    //currentZoomNode = currentDataNodes[0];
    zoomToNode(currentZoomNode);
  }

  //////////////////////////////////////////////////////////////
  /////////////////  Update Breadcrumbs  ///////////////////////
  //////////////////////////////////////////////////////////////
  function updateBreadcrumbs() {
    breadcrumbsDiv.innerHTML = ""; // Clear previous breadcrumbs
    if (!rootNodeData) return;

    let pathNodes = [];
    let currentNode = currentZoomNode || d3.hierarchy(rootNodeData); // Start from zoomed node or root

    while (currentNode) {
      pathNodes.unshift(currentNode); // Add to the beginning to get root first
      currentNode = currentNode.parent;
    }

    pathNodes.forEach((node, i) => {
      const span = document.createElement("span");
      span.textContent = node.data.name;
      span.className = "breadcrumb-item";

      //if (node === currentZoomNode || (currentZoomNode === null && i === pathNodes.length - 1)) {
      //    span.classList.add('current');
      //} else {
      span.addEventListener("click", () => zoomToNode(node));
      //}
      breadcrumbsDiv.appendChild(span);

      if (i < pathNodes.length - 1) {
        const separator = document.createElement("span");
        separator.textContent = "\\";
        separator.className = "mx-1 text-gray-400";
        breadcrumbsDiv.appendChild(separator);
      }
    });
  }

  //////////////////////////////////////////////////////////////
  /////////////////// Animate nodes ////////////////////////////
  //////////////////////////////////////////////////////////////

  function animateTransition(oldNodes, newNodeData) {
    // 1. Calculate the new layout positions
    const containerWidth = canvas.width;
    const containerHeight = canvas.height;

    const root = d3
      .hierarchy(newNodeData)
      .sum((d) => Math.pow(d.value, ignoreSize.value / 100))
      .sort((a, b) => sortItOut(a, b));

      const pack = d3
          .pack()
          .size([containerWidth, containerHeight])
          .padding(Math.log10(d.value));
      //.padding(Math.pow(paddingFactorslider.value / 1200, 2));

    const targetNodes = pack(root).descendants();

    // 2. Map old positions to new ones based on a unique identifier (path + name)
    targetNodes.forEach((target) => {
      const match = oldNodes.find(
        (old) =>
          old.data.path === target.data.path &&
          old.data.name === target.data.name,
      );
      if (match) {
        // Start from where they currently are
        target.startX = match.x;
        target.startY = match.y;
        target.startR = match.r;
      } else {
        // New nodes fade in from the center of their parent or the screen
        target.startX = target.x;
        target.startY = target.y;
        target.startR = 0;
      }
    });

    // 3. Run the animation
    const duration = 800;
    const ease = d3.easeCubicInOut;
    const timer = d3.timer((elapsed) => {
      const t = Math.min(1, ease(elapsed / duration));

      // Update currentDataNodes positions for the draw loop
      targetNodes.forEach((d) => {
        d.x = d.startX + (d.targetX - d.startX) * t; // Use targetX/Y/R to store goals
        d.y = d.startY + (d.targetY - d.startY) * t;
        d.r = d.startR + (d.targetR - d.startR) * t;
      });

      // Temporarily replace currentDataNodes to let drawVisualization use these mid-animation values
      currentDataNodes = targetNodes;
      drawVisualization();

      if (t === 1) {
        timer.stop();
        setColorDomains(); // Refresh legends for the new subset
      }
    });
  }

  //////////////////////////////////////////////////////////////
  /////////////////////// Export PNG  //////////////////////////
  //////////////////////////////////////////////////////////////
function exportCanvasAsPNG() {
    // 1. Get the name of the current zoomed node or root
    const nodeName = currentZoomNode ? currentZoomNode.data.name : "";
    const rootName = rootNodeData.name;
    // 2. Get the current date in YYYY-MM-DD format
    const dateStr = new Date().toISOString().split('T')[0];
    
    // 3. Create a clean filename
    // Result: "Nircles_Documents_2023-10-27.png"
    const fileName = `${rootName}-${nodeName}-${dateStr}`.replace(/[^a-z0-9 _-]/gi, '-');

    const dataURL = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

  //////////////////////////////////////////////////////////////
  /////////////////////// Mouse Events  ////////////////////////
  //////////////////////////////////////////////////////////////
  // Event listener for mouse movement on canvas
  canvas.addEventListener("mousemove", function (event) {
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
      window.hoveredNode = hoveredNode; // Store hovered node in global variable for access in other functions
      drawVisualization();
      // Redraw to update hover highlight  <br/>Sub-items: ${hoveredNode.children.length}
      // <br/>Type: ${hoveredNode.data.type || "Folder"}
      // <br/>Full Path: ${hoveredNode.data.path}
      // <br/>Size: ${formatBytes(hoveredNode.value)}
      // <br/>Last Modified: ${hoveredNode.data.last_modified_iso ? new Date(hoveredNode.data.last_modified_unix * 1000).toLocaleDateString() : "N/A"}`)

      if (hoveredNode) {
        if (colorBySelect.value === "depth") {
        tooltip
          .style("opacity", 0.75)
          .html(
            `<strong> ${hoveredNode.data.name} </strong>
                            <br/><strong>Parent Folder: </strong>${hoveredNode.parent ? hoveredNode.parent.data.name : ""}
                            <br/><strong>Depth: </strong>${hoveredNode.depth}
                            `,
          )
          .style("left", event.pageX + 40 + "px")
          .style("top", event.pageY - 28 + "px");
              } else if (colorBySelect.value === "date") {
                const niceDate = hoveredNode.data.last_modified_iso ? new Date(hoveredNode.data.last_modified_unix * 1000).toLocaleString() : "N/A";
        tooltip
          .style("opacity", 0.75)
          .html(
            `<strong> ${hoveredNode.data.name} </strong>
                            <br/><strong>Date modified: </strong>${niceDate}
                            `,
          )
          .style("left", event.pageX + 40 + "px")
          .style("top", event.pageY - 28 + "px");
              }else if (colorBySelect.value === "type") {
        tooltip
          .style("opacity", 0.75)
          .html(
            `<strong> ${hoveredNode.data.name} </strong>
                            <br/><strong>Type: </strong>${hoveredNode.data.type}
                            `,
          )
          .style("left", event.pageX + 40 + "px")
          .style("top", event.pageY - 28 + "px");
              }else if (colorBySelect.value === "fileSize") {
                const niceSize = formatBytes(hoveredNode.value);
        tooltip
          .style("opacity", 0.75)
          .html(
            `<strong> ${hoveredNode.data.name} </strong>
                            <br/><strong>Size: </strong>${niceSize}
                            `,
          )
          .style("left", event.pageX + 40 + "px")
          .style("top", event.pageY - 28 + "px");
              }
      } else {
        tooltip.style("opacity", 0);
      }
    }
  });

  // Event listener for mouse leaving canvas
  canvas.addEventListener("mouseout", function () {
    if (hoveredNode) {
      window.hoveredNode = null;
      hoveredNode = null;
      drawVisualization(); // Redraw to remove hover highlight
      tooltip.style("opacity", 0);
    }
  });

  // Event listener for click on canvas
  canvas.addEventListener("click", function (event) {
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
        window.selectedNode = d; // Store clicked node in global variable for access in other functions
        clickedNode = d;
        break;
      }
    }

    if (clickedNode) {
      selectedNode = clickedNode; // Update selected node for details panel
      zoomToNode(clickedNode); // Zoom to the clicked node

      selectedNodeDetails(clickedNode); // Update details panel with selected node info

      //Breadcrumbs or full path needs updating
      drawVisualization(); // Redraw to remove selection highlight

      if (typeof window.highlightNodeInTree === 'function') {
        window.highlightNodeInTree(selectedNode);
      }
    } else {
      // If click occurred outside any node, clear selection and zoom out
      //if (selectedNode) {
        selectedNode = currentDataNodes[0]; // Reset to root node
        drawVisualization(); // Redraw to remove selection highlight
      //}
        selectedItemDetails.classList.add("hidden");
        detailPath.textContent = "";
      copyPathButton.classList.add("hidden");
      initialDetailsPrompt.classList.remove("hidden");
      resetZoom(); // Zoom out to full view
    }
  });

  function selectedNodeDetails(node) {
    if(typeof window.selectedNodeInTree === 'function') {
      window.selectedNodeInTree(node);
    }
    selectedNode = node;
    detailName.textContent = selectedNode.data.name;
    detailType.textContent = selectedNode.data.type || "Folder";
    // Display details in the third column
      selectedItemDetails.classList.remove("hidden");
      copyPathButton.classList.remove("hidden");
      initialDetailsPrompt.classList.add("hidden");

      if (selectedNode.data.type === "Folder" || selectedNode.data.type === "folder") {
        detailChildren.textContent =
          selectedNode.descendants().length + " total";
        
    const directories = selectedNode.descendants().filter((d) => isaFolder(d));
    const files = selectedNode.descendants().filter((d) => !isaFolder(d));
    const ratio = files.length / directories.length;
    detailChildren.innerHTML = `${directories.length} folders and ${files.length} files.
      <div>Total ${currentDataNodes.length} items. Ratio ${ratio.toFixed(2)}</div> `;
      } else {
        detailChildren.textContent = "";
      }
      detailSize.textContent = formatBytes(selectedNode.value);
      detailLastModified.textContent = selectedNode.data.last_modified_iso
        ? new Date(selectedNode.data.last_modified_unix * 1000).toLocaleString()
        : "N/A";
      if (selectedNode.data.children) {
        detailPath.textContent = node.data.path;
      } else {
        detailPath.textContent =
          selectedNode.data.path + "\\" + selectedNode.data.name;
      }
  }

  // Function to format bytes into human-readable format
  function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }
  window.formatBytes = formatBytes;

  //Function to create search results
  function updateSearchResults(searchResults) {
    const hasGraphFilter = window.currentFilterFunction !== null;

    // Show results if we have a valid text search OR a graph filter active
    if (searchTerm.length > 1 || hasGraphFilter) {
      searchItems.classList.remove("hidden");
      searchItems.innerHTML = ""; // Clear previous search items

      // Add items for search results
      searchResults.forEach((path) => {
        searchSummary.classList.remove("hidden");
        const resultItem = document.createElement("div");
        resultItem.className = "search-result-item";
        resultItem.innerHTML = `<div> ${path.data.name} </div>`;
        resultItem.addEventListener("click", () => zoomToNode(path));

        searchItems.appendChild(resultItem);
      });
    } else {
      searchSummary.classList.add("hidden");
    }
  }

  // Custom message box function (replaces alert)
  function displayMessageBox(message, type = "Info") {
    const messageBox = document.createElement("div");
    messageBox.className = `message-box-overlay`;
    messageBox.innerHTML = `
                    <div class="message-box-content">
                        <h3 class="${type === "Error" ? "text-error" : "text-info"}">${type}</h3>
                        <p>${message}</p>
                        <button id="closeMessageBox">OK</button>
                    </div>
                `;
    document.body.appendChild(messageBox);

    document
      .getElementById("closeMessageBox")
      .addEventListener("click", function () {
        document.body.removeChild(messageBox);
      });
  }

  function displaySettingsBox() {
    document.getElementById("viewSettingsMenu").classList.remove("hidden");
    
    document
      .getElementById("closeSettingsBox")
      .addEventListener("click", function () {
    document.getElementById("viewSettingsMenu").classList.add("hidden");
      });
  }
  function displayAboutBox() {
    document.getElementById("aboutPopup").classList.remove("hidden");
    
    document
      .getElementById("closeAboutBox")
      .addEventListener("click", function () {
    document.getElementById("aboutPopup").classList.add("hidden");
      });
  }
  function displaySearchResultsBox() {
    document.getElementById("searchPopup").classList.remove("hidden");
    
    document
      .getElementById("closeSearchResultsBox")
      .addEventListener("click", function () {
    document.getElementById("searchPopup").classList.add("hidden");
      });
  }


  // Add a resize observer to redraw the canvas when its container changes size
  const resizeObserver = new ResizeObserver((entries) => {
    for (let entry of entries) {
      if (entry.target === visualizationColumn) {
        const newWidth = entry.contentRect.width;
        // Set new height relative to window height, capped by newWidth for square aspect
        const newHeight =Math.min(newWidth, window.innerHeight * 0.9);

        if (canvas.width !== newWidth || canvas.height !== newHeight) {
          canvas.width = newWidth;
          canvas.height = newHeight;

          if (rootNodeData) {
            // Re-process and redraw with new dimensions if data is loaded
            processAndRenderVisualization(rootNodeData);
            //folderSummary = data.length();
            // Reset zoom after resize to fit new dimensions
            //resetZoom();
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
