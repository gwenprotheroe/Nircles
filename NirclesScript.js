// Nircles Main Script
// Copywrite Gwen Protheroe 2026

document.addEventListener("DOMContentLoaded", function () {
  const canvas = document.getElementById("folderViz");
  const ctx = canvas.getContext("2d");
  const tooltip = d3.select("#tooltip");
  const visualizationColumn = document.getElementById("visualizationColumn");
  const overlayCanvas = document.createElement("canvas");
  overlayCanvas.id = "overlayCanvas";
  visualizationColumn.appendChild(overlayCanvas);
  const overlayCtx = overlayCanvas.getContext("2d");

  const selectedItemDetails = document.getElementById("selectedItemDetails");
  const initialDetailsPrompt = document.getElementById("initialDetailsPrompt");
  const detailName = document.getElementById("detailName");
  const detailType = document.getElementById("detailType");
  const detailChildren = document.getElementById("detailChildren");
  const detailSize = document.getElementById("detailSize");
  const detailLastModified = document.getElementById("detailLastModified");
  const detailPath = document.getElementById("detailPath");
  const itemContextActions = document.getElementById("itemContextActions");
  const contextMenu = document.getElementById("contextMenu");
  const ctxRename = document.getElementById("ctxRename");
  const ctxNewFolder = document.getElementById("ctxNewFolder");
  const ctxDelete = document.getElementById("ctxDelete");

  const searchItems = document.getElementById("searchItems");
  const initialSearchPrompt = document.getElementById("initialSearchPrompt");
  
  const newScanButton = document.getElementById("newScanButton"); // Buttons! Button for everything!
  const jsonFileLoad = document.getElementById("jsonFileLoad");
  const loadJsonFileButton = document.getElementById("loadJsonFileButton");
  const saveScanButton = document.getElementById("saveScanButton");
  const newFolderButton = document.getElementById("newFolderButton");
  const closeAppButton = document.getElementById("closeApp");
  const panModeBtn = document.getElementById("panModeBtn");
  const orgModeBtn = document.getElementById("orgModeBtn");
  const orgMenu = document.querySelector(".orgMenu");
  const zoomOutButton = document.getElementById("zoomOutButton");
  const exportPngButton = document.getElementById("exportPngButton");
  const exportSvgButton = document.getElementById("exportSvgButton");
  const filterButton = document.getElementById("filterButton");
  const folderFilterButton = document.getElementById("folderFilterButton");
  const folderFilterOutButton = document.getElementById("folderFilterOutButton");
  const folderSpecificActions = document.getElementById("folderSpecificActions");
  const emptyFolderSelectButton = document.getElementById("emptyFolderSelectButton");
  const deleteMatchButton = document.getElementById("deleteMatchButton");
  const filterOutButton = document.getElementById("filterOutButton");
  const copyPathButton = document.getElementById('copyPathButton');
  const showAboutPageButton = document.getElementById("showAboutPageButton");
  const treeMapButton = document.getElementById("treeMapButton");
  const NircleButton = document.getElementById("NircleButton");
  const sunBurstButton = document.getElementById("sunBurstButton");
  const viewSettings = document.getElementById("viewSettings");
  const visStyle = document.getElementById("visStyle");
  const scanSettingsButton = document.getElementById("scanSettingsButton");
  const resetButton = document.getElementById("resetButton");
  const resetButton2 = document.getElementById("resetButton2");

  const changesMadeContainer = document.getElementById("changesMadeContainer");
  const changesList = document.getElementById("changesList");
  const applyChangesBtn = document.getElementById("applyChangesBtn");
  const revertChangesBtn = document.getElementById("revertChangesBtn");

  let originalFullData = null; // To store the state for Reset
  let immutableRawData = null; // VITAL: The true backup for Revert All

  window.topFileTypes = []; // Track top 10 extensions globally
  const colorBySelect = document.getElementById("colorBy"); // Single color selection dropdown
  const relativeDate = document.getElementById("relativeDate");
  const minDateLabel = document.getElementById("minDateLabel");
  const maxDateLabel = document.getElementById("maxDateLabel");
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
  const searchCriteria = document.getElementById("searchCriteria"); // Search criteria display

  const toggleTreeBtn = document.getElementById("toggleTreeBtn");
  const toggleGraphBtn = document.getElementById("toggleGraphBtn");
  const folderTreeColumn = document.getElementById("folder-tree-column");
  const interactionGraphColumn = document.getElementById("interaction-graph-container");
  const mainGrid = document.querySelector(".main-grid");

  let currentDataNodes = []; // Store the flattened nodes for event handling
  let rootNodeData = null; // Store the original root data for full zoom out
  let hoveredNode = window.hoveredNode || null; // Track the node currently under the mouse
  let selectedNode = window.selectedNode || null; // Primary selected node
  let selectedNodes = new Set(); // For multi-selection
  let currentZoomNode = window.currentZoomNode ||null; // Track the node currently zoomed into
  let visualZoomDepth = 0; // Interpolated depth for smooth alpha transitions
  let maxVisibleDepthRelative = 3.2; // Default 3.2 levels deep

  let userSelectedMode = false; // Tracks the button-selected mode (Navigate/Org)
  let isOrganizeMode = false;
  let draggedNode = null; // Track the node currently being dragged
  let isMovingSearchSet = false; // Track if we are moving multiple items via search
  let activeFilters = [];
  let pendingChanges = [];
  let hasUnsavedChanges = false;
  let filtered = false;
  let filterString = "";
  let isAnimating = false;
  let isDragging = false;
  let startX, startY;
  const dragThreshold = 5; // Minimum pixels moved to count as a drag

  // Get references to the depth slider elements (now assumed to be in HTML)
  const depthSliderContainer = document.getElementById("depthSliderContainer");
  const depthVisibilitySlider = document.getElementById("depthVisibilitySlider");
  const depthLabel = document.getElementById("depthLabel");


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
    "#53B36D", //shades of green
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
    .scaleLog()
    .range(["#030302", "#F2EFEC"]);
  // const linearRainbowColorScale = d3.scaleLinear().range(['#FBE0D6','#B24D25']); //Shades of orange
  const linearRainbowColorScale = d3
    .scaleLinear()
    .range(["#98edfa", "#f26e6e"])
    .interpolate(d3.interpolateHslLong); // Rainbow for folder depth
  let linearBWColorScale1 = d3.scaleLinear().range(["#eee","#222"]); // Black and white for date modified
  const linearBWColorScale2 = d3.scaleLinear().range(["#009900", "#F2EFEC"]); // Shades of green and white for folder depth

  // New color scale for folder ratio
  const folderRatioColorScale = d3.scaleLinear()
    .domain([0, 7, 20, 100]) // Black for empty (0), Green for 7, Black for 15+
    .range(["black", "green", "yellow", "red"])
    .clamp(true); // Clamp values outside the domain to the nearest range value
  window.categoricalColorScale = categoricalColorScale;
  window.exponentialColorScale = exponentialColorScale;
  window.linearRainbowColorScale = linearRainbowColorScale;
  window.linearBWColorScale1 = linearBWColorScale1;
  window.drawVisualization = drawVisualization;
  window.drawHighlights = drawHighlights;
  window.currentFilterFunction = null;
  window.folderRatioColorScale = folderRatioColorScale; // Expose for potential legend
  window.currentFilterDescription = null;
  window.formatAge = formatAge; // Expose for use in Interaction Graphs

 // Dummy Data
  const defaultData = {
    path: "C:\\Demo",
    name: "Demo",
    type: "folder",
    value: "0",
    children: [
      {
        path: "C:\\Demo\\Empty Staging",
        name: "Empty Staging",
        type: "folder",
        value: "1000",
        children: []
      },
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
                type: "ncl",
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
  window.immutableRawData = JSON.parse(JSON.stringify(rootNodeData));
  processAndRenderVisualization(rootNodeData);
  // zoomToNode(rootNodeData);
  updateBreadcrumbs();

  // D3 Zoom behavior
  const zoom = d3
    .zoom()
    .scaleExtent([0.005, 1000]) 
    .filter(event => {
        // Disable zoom/pan behavior entirely when in Organize mode
        // This allows the drag behavior to receive the events instead
        return !isOrganizeMode && !event.button;
    })
    .on("zoom", (event) => {
      isAnimating = true;
      transform = event.transform;
      drawVisualization();
      drawHighlights(); // Sync overlay with zoom
    })
    .on("end", (event) => {
      isAnimating = false;
      drawHighlights(); // Sync overlay with zoom
    });

  // Apply zoom behavior to the canvas
  d3.select(canvas).call(zoom);

  // Helper to get current search/filter state
  const getMatchesSearch = () => {
      const term = searchTerm.toLowerCase();
      const hasGraphFilter = window.currentFilterFunction !== null;
      if (term.length < 2 && !hasGraphFilter) return null;

      return (d) => {
          const nameMatch = term.length < 2 || (d.data && d.data.name.toLowerCase().includes(term));
          const graphMatch = !window.currentFilterFunction || window.currentFilterFunction(d.data || d, d.depth);
          return nameMatch && graphMatch;
      };
  };

  // Drag behavior for Organisation
  const drag = d3.drag()
    .on("start", (event) => {
        if (!isOrganizeMode) return;
        // Use the currently hovered node or find the node at the mouse position
        const node = hoveredNode || findNodeAt(event.sourceEvent.clientX, event.sourceEvent.clientY);
        if (node) {
            event.subject.node = node;
            canvas.style.cursor = "grabbing";
            draggedNode = node; // Store the dragged node
            // Store original position in data space
            draggedNode.originalX = node.x;
            draggedNode.originalY = node.y;
            // Initialize current position in data space
            draggedNode.currentX = draggedNode.originalX;
            draggedNode.currentY = draggedNode.originalY;

            // Determine if we are moving the whole search set
            const isMatch = getMatchesSearch();
            isMovingSearchSet = isMatch && isMatch(node);

            drawHighlights(); // Draw the ghost immediately
        }
    })
    .on("drag", (event) => {
        if (!isOrganizeMode || !event.subject.node) return;
        const rect = canvas.getBoundingClientRect();
        // Update current position in data space
        draggedNode.currentX = (event.sourceEvent.clientX - rect.left - transform.x) / transform.k;
        draggedNode.currentY = (event.sourceEvent.clientY - rect.top - transform.y) / transform.k;

        // Detect if we are hovering over a potential target folder during the drag
        hoveredNode = findNodeAt(event.sourceEvent.clientX, event.sourceEvent.clientY);

        drawHighlights(); // Redraw ghost and line
    })
    .on("end", (event) => {
        if (!isOrganizeMode || !event.subject.node) return;
        canvas.style.cursor = "grab";
        
        let targetNode = findNodeAt(event.sourceEvent.clientX, event.sourceEvent.clientY);
        const sourceNode = event.subject.node;

        // Improvement: If the target is a file, redirect the drop to its parent folder
        if (targetNode && !isaFolder(targetNode)) {
            targetNode = targetNode.parent;
        }

        if (targetNode && targetNode !== sourceNode && isaFolder(targetNode)) {
            // Sync changes to Master Data to preserve across filter resets
            const sourceMaster = findInMaster(sourceNode.data);
            const sourceParentMaster = sourceNode.parent ? findInMaster(sourceNode.parent.data) : null;
            const targetMaster = findInMaster(targetNode.data);
            
            if (sourceMaster && sourceParentMaster && targetMaster) {
                if (isMovingSearchSet) {
                const isMatch = getMatchesSearch();
                const results = currentDataNodes.filter(isMatch);
                
                const topLevelResults = results.filter(n => {
                    let p = n.parent;
                    while(p) {
                        if (results.includes(p)) return false;
                        p = p.parent;
                    }
                    return true;
                });

                topLevelResults.forEach(node => {
                    const sMaster = findInMaster(node.data);
                    const pMaster = node.parent ? findInMaster(node.parent.data) : null;
                    if (sMaster && pMaster) {
                        pMaster.children = pMaster.children.filter(c => c !== sMaster);
                        if (!targetMaster.children) targetMaster.children = [];
                        
                        // Automatic Resolution
                        const originalName = sMaster.name;
                        sMaster.name = resolveNameClash(originalName, targetMaster);

                        // Update paths for moved items
                        updatePathAfterMove(sMaster, targetMaster);
                        
                        targetMaster.children.push(sMaster);
                    }
                });

                window.addPendingChange('move', `Moved ${topLevelResults.length} search results to ${targetMaster.name}`);
            } else {
                sourceParentMaster.children = sourceParentMaster.children.filter(c => c !== sourceMaster);
                if (!targetMaster.children) targetMaster.children = [];
                
                // Automatic Resolution
                const originalName = sourceMaster.name;
                sourceMaster.name = resolveNameClash(originalName, targetMaster);

                updatePathAfterMove(sourceMaster, targetMaster);
                
                targetMaster.children.push(sourceMaster);
                window.addPendingChange('move', `${sourceMaster.name} moved to ${targetMaster.name}${sourceMaster.name !== originalName ? ' (Auto-renamed)' : ''}`);
            }
            
            applyFilters(); // Refresh view from updated Master Data
            }
        }
        event.subject.node = null;
        draggedNode = null; // Clear dragged node
        isMovingSearchSet = false;
        drawHighlights(); // Clear ghost and line
    });

  d3.select(canvas).call(drag);

  function findNodeAt(rawX, rawY) {
      const rect = canvas.getBoundingClientRect();
      // Transform screen coordinates to visualization coordinates
      const x = (rawX - rect.left - transform.x) / transform.k;
      const y = (rawY - rect.top - transform.y) / transform.k;
      const zoomDepth = currentZoomNode ? currentZoomNode.depth : 0;

      for (let i = currentDataNodes.length - 1; i >= 0; i--) {
          const d = currentDataNodes[i];
          
          // Respect the depth filter for selectability
          const relativeDepth = d.depth - zoomDepth;
          if (maxVisibleDepthRelative < 10 && relativeDepth > Math.ceil(maxVisibleDepthRelative)) continue;

          const dx = x - d.x;
          const dy = y - d.y;
          if (Math.sqrt(dx * dx + dy * dy) < d.r) {
              return d;
          }
      }
      return null;
  }


    function filterHierarchy(node, matchesSearch, depth = 0) {
        filtered = true;
    // 1. Always recurse into children first to ensure we don't keep empty folders
    if (node.children && node.children.length > 0) {
      // Recursively filter the children
      const filteredChildren = node.children
        .map((child) => filterHierarchy(child, matchesSearch, depth + 1))
        .filter((child) => child !== null);

      // 2. If any children matched, keep this parent node
      if (filteredChildren.length > 0) {
        const newNode = { ...node };
        newNode.children = filteredChildren;
        return newNode;
      }
      // If folder contents don't match, check if it matches
      if (matchesSearch(node, depth)) {
        return node;
      } 
      return null;
    }
    // 3. Leaf node (File): Keep if it matches
    if (matchesSearch(node, depth)) {
        return { ...node };
    }
    return null;
  }
  function filteroutHierarchy(node, mismatchesSearch, depth = 0) {
            filtered = true;
// 1. If the current node matches, we remove it and EVERYTHING inside it
    if (!mismatchesSearch(node, depth)) {
      return null;
    }
    // 2. If the node doesn't match, check if it has children to explore
    if (node.children && node.children.length >= 0) {
      // Recursively filter the children
      const filteredChildren = node.children
        .map((child) => filteroutHierarchy(child, mismatchesSearch, depth + 1))
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

  // Event listener for Save Scan button
  saveScanButton.addEventListener("click", function () {
    if (!rootNodeData) {
      displayMessageBox("No data available to save.", "Warning");
      return;
    }

    // Export the current rootNodeData (which has filters applied) as a JSON file
    const dataStr = JSON.stringify(rootNodeData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `${rootNodeData.name}-${dateStr}`.replace(/[^a-z0-9 _-]/gi, '-');

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });

  // Event listener for when a file is selected via the input
  jsonFileLoad.addEventListener("change", function (event) {
      resetZoom(); // Reset zoom to fit the new data
    const file = event.target.files[0];
    if (!file) {
      return; // No file selected
    }
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        window.immutableRawData = JSON.parse(e.target.result); // The fresh load
        window.originalFullData = JSON.parse(JSON.stringify(window.immutableRawData)); // Master Architecture
        rootNodeData = JSON.parse(JSON.stringify(window.immutableRawData)); // Initial view
        processAndRenderVisualization(rootNodeData);
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
        animateDepthShowcase();

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
  
  // Changes Management Logic
  window.addPendingChange = function(type, description) {
      pendingChanges.push({ type, description, timestamp: Date.now() });
      hasUnsavedChanges = true;
      renderChanges();
  };

  function renderChanges() {
      changesList.innerHTML = "";
      if (pendingChanges.length === 0) {
          changesMadeContainer.classList.add("hidden");
          return;
      }

      changesMadeContainer.classList.remove("hidden");
      pendingChanges.forEach((change, index) => {
          const item = document.createElement("div");
          item.className = "change-item";
          item.innerHTML = `
              <span>${change.description}</span>
              <span class="remove-filter" onclick="removePendingChange(${index})" title="Undo this change">×</span>
          `;
          changesList.appendChild(item);
      });
  }

  window.removePendingChange = function(index) {
      pendingChanges.splice(index, 1);
      if (pendingChanges.length === 0) hasUnsavedChanges = false;
      renderChanges();
  };

  applyChangesBtn.addEventListener("click", () => {
      displayMessageBox(
          "Applying changes to the physical file system is a <strong>Nircles Pro</strong> feature. <br><br> In this demo, changes are only recorded in the local summary.",
          "Feature Restricted"
      );
  });

  revertChangesBtn.addEventListener("click", () => {
      displayConfirmationBox("Are you sure you want to discard all pending organization changes?", () => {
          pendingChanges = [];
          hasUnsavedChanges = false;
          renderChanges();
          
          // 1. Restore Master Architecture from the immutable backup
          window.originalFullData = JSON.parse(JSON.stringify(window.immutableRawData));

          // 2. Re-apply current filters to the restored data
          applyFilters();
          resetZoom();
      });
  });

  // Event listener for Close button
  closeAppButton.addEventListener("click", function () {
    if (hasUnsavedChanges) {
      displayConfirmationBox(
        "You have unsaved changes (filters/edits). Are you sure you want to close?",
        () => { window.close(); }
      );
    } else {
      window.close();
    }
  });

  function displayConfirmationBox(message, onConfirm) {
    const messageBox = document.createElement("div");
    messageBox.className = `message-box-overlay`;
    messageBox.innerHTML = `
        <div class="message-box-content">
            <h3 class="text-info">Confirm Action</h3>
            <p>${message}</p>
            <div style="margin-top: 20px; display: flex; justify-content: center; gap: 10px;">
                <button id="confirmActionBtn">Yes</button>
                <button id="cancelActionBtn" style="background-color: var(--Black);">No</button>
            </div>
        </div>
    `;
    document.body.appendChild(messageBox);
    document.getElementById("confirmActionBtn").onclick = () => { document.body.removeChild(messageBox); onConfirm(); };
    document.getElementById("cancelActionBtn").onclick = () => { document.body.removeChild(messageBox); };
  }

  // Reusable Folder Creation Logic
  window.triggerNewFolder = function(targetNode) {
      const folderName = prompt("Enter new folder name:", "New Folder");
      if (!folderName) return;

      const targetParentNode = (targetNode && isaFolder(targetNode)) ? targetNode : currentZoomNode || currentDataNodes[0];
      const masterParent = findInMaster(targetParentNode.data);

      if (masterParent) {
          if (!masterParent.children) masterParent.children = [];
          const newFolderValue = Math.max(1000, masterParent.value * 0.2); // 20% of parent's effective value or 1000 bytes

          // Resolve clash for default name
          const uniqueName = resolveNameClash(folderName, masterParent);

          const newFolder = { // Assign the calculated value directly to the new folder's data
          name: uniqueName,
          path: masterParent.path + "\\" + masterParent.name,
          type: "folder",
          value: newFolderValue, // Use the calculated minimum value
          children: [],
          creationTime: Date.now() // Tag for visual highlighting
          };

          masterParent.children.push(newFolder);

          window.addPendingChange('create', `Created folder "${uniqueName}" in ${masterParent.name}`);
          applyFilters(); // Refresh view
      startPulseLoop(); // Trigger the animation loop
      }
  };

  newFolderButton.addEventListener("click", () => window.triggerNewFolder(selectedNode));

  // Interaction Toggle Logic
  panModeBtn.addEventListener("click", () => {
      userSelectedMode = false;
      setInteractionMode(false);
  });
  orgModeBtn.addEventListener("click", () => {
      userSelectedMode = true;
      setInteractionMode(true);
  });

  function setInteractionMode(organize) {
    isOrganizeMode = organize;
    panModeBtn.classList.toggle("active", !organize);
    orgModeBtn.classList.toggle("active", organize);
    canvas.style.cursor = organize ? "grab" : "crosshair";
    
    // Visual cue: darken background when in Organize mode
    canvas.style.transition = "background-color 0.3s ease";
    canvas.style.backgroundColor = organize ? "#1e1e26" : "";
  }

  // Keyboard Shortcuts
  window.addEventListener("keydown", (e) => {
      const isInputActive = e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA";

      // Shift toggle between Navigate and Organise
      if (e.key === "Shift") {
          setInteractionMode(!userSelectedMode);
      }
      
      // F1: Help
      if (e.key === "F1") {
          e.preventDefault();
          displayAboutBox();
      }

      // F2: Rename
      if (e.key === "F2" && !isInputActive) {
          e.preventDefault();
          if (selectedNode) window.triggerRename(selectedNode);
      }

      // Delete: Bulk or single deletion
      if (e.key === "Delete" && !isInputActive) {
          if (selectedNodes.size > 1) {
              displayConfirmationBox(`Delete all ${selectedNodes.size} selected items?`, () => {
                  selectedNodes.forEach(node => {
                      const masterParent = findInMaster(node.parent.data);
                      const masterNode = findInMaster(node.data);
                      if (masterParent && masterNode) {
                          masterParent.children = masterParent.children.filter(c => c !== masterNode);
                      }
                  });
                  selectedNodes.clear();
                  selectedNode = null;
                  applyFilters();
              });
          } else if (selectedNode) {
              window.triggerDelete(selectedNode);
          }
      }

      // Escape: Clear selection and close popups
      if (e.key === "Escape") {
          selectedNodes.clear();
          selectedNode = null;
          selectedItemDetails.classList.add("hidden");
          document.getElementById("aboutPopup").classList.add("hidden");
          document.getElementById("viewSettingsMenu").classList.add("hidden");
          document.getElementById("searchPopup").classList.add("hidden");
          drawVisualization();
      }

      // Global Ctrl shortcuts
      if (e.ctrlKey || e.metaKey) {
          if (e.key.toLowerCase() === "f") {
              e.preventDefault();
              searchInput.focus();
              searchInput.select();
          }
          if (e.key.toLowerCase() === "s") {
              e.preventDefault();
              saveScanButton.click();
          }
          if (e.key === "+" || e.key === "=") {
              e.preventDefault();
              maxVisibleDepthRelative = Math.min(5, maxVisibleDepthRelative + 0.5);
              depthVisibilitySlider.value = maxVisibleDepthRelative;
              depthLabel.textContent = maxVisibleDepthRelative >= 5 ? "Deep" : maxVisibleDepthRelative.toFixed(1);
              drawVisualization();
          }
          if (e.key === "-") {
              e.preventDefault();
              maxVisibleDepthRelative = Math.max(1, maxVisibleDepthRelative - 0.5);
              depthVisibilitySlider.value = maxVisibleDepthRelative;
              depthLabel.textContent = maxVisibleDepthRelative >= 5 ? "Deep" : maxVisibleDepthRelative.toFixed(1);
              drawVisualization();
          }
          if (e.key.toLowerCase() === "a" && !isInputActive) {
              e.preventDefault();
              const target = currentZoomNode || currentDataNodes[0];
              if (target && target.children) {
                  target.children.forEach(child => selectedNodes.add(child));
                  selectedNode = target.children[0];
                  selectedNodeDetails(selectedNode);
                  drawVisualization();
              }
          }
      }
  });

  window.addEventListener("keyup", (e) => {
      if (e.key === "Shift") {
          setInteractionMode(userSelectedMode);
      }
  });

  depthVisibilitySlider.addEventListener("input", (e) => {
      maxVisibleDepthRelative = parseFloat(e.target.value);
      depthLabel.textContent = maxVisibleDepthRelative >= 5 ? "Deep" : maxVisibleDepthRelative.toFixed(1);
      drawVisualization();
  });

  // Reusable Rename Logic
  window.triggerRename = function(node) {
      if (!node) return;
      const masterNode = findInMaster(node.data);
      const masterParent = node.parent ? findInMaster(node.parent.data) : null;
      
      if (!masterNode) return;
      
      const oldName = masterNode.name;
      const newName = prompt(`Rename "${oldName}" to:`, oldName);
      if (!newName || newName === oldName) return;

      // Automatic resolution if user enters a name that exists
      const resolvedName = resolveNameClash(newName, masterParent, masterNode);

      const oldPath = masterNode.path;
      masterNode.name = resolvedName;
      if (masterNode.type === 'folder') {
          updateDescendantPaths(masterNode, oldPath + "\\" + oldName, oldPath + "\\" + newName);
      }

      window.addPendingChange('rename', `Renamed "${oldName}" to "${resolvedName}"`);
      applyFilters();
  };

  renameButton.addEventListener("click", () => window.triggerRename(selectedNode));

  // Reusable Delete Logic
  window.triggerDelete = function(node) {
      if (!node || !node.parent) return;
      displayConfirmationBox(`Are you sure you want to delete "${node.data.name}"?`, () => {
          const masterParent = findInMaster(node.parent.data);
          const masterNode = findInMaster(node.data);
          
          if (masterParent && masterNode) {
              masterParent.children = masterParent.children.filter(c => c !== masterNode);
          window.addPendingChange('delete', `Deleted "${node.data.name}"`);
              applyFilters();
          selectedNode = null;
          selectedItemDetails.classList.add("hidden");
          initialDetailsPrompt.classList.remove("hidden");
          }
      });
  };

  // Logic to delete all currently matched items (Search or Empty Folder selection)
  window.triggerDeleteResults = function() {
      const isMatch = getMatchesSearch();
      if (!isMatch) return;
      
      const results = currentDataNodes.filter(isMatch);
      if (results.length === 0) return;

      displayConfirmationBox(`Are you sure you want to delete all ${results.length} matched items?`, () => {
          // Filter to only top-level nodes in the selection to avoid errors when deleting children recursively
          const topLevelResults = results.filter(n => {
              let p = n.parent;
              while(p) {
                  if (results.includes(p)) return false;
                  p = p.parent;
              }
              return true;
          });

          topLevelResults.forEach(node => {
              const masterNode = findInMaster(node.data);
              const masterParent = node.parent ? findInMaster(node.parent.data) : null;
              if (masterNode && masterParent) {
                  masterParent.children = masterParent.children.filter(c => c !== masterNode);
              }
          });

          window.addPendingChange('delete', `Deleted ${topLevelResults.length} items from results`);
          resetButton.click(); // Reset highlights and refresh view
      });
  };

  // Context Menu Event Handlers
  let contextTargetNode = null;
  canvas.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      contextTargetNode = findNodeAt(e.clientX, e.clientY);
      if (contextTargetNode) {
          contextMenu.style.left = `${e.pageX}px`;
          contextMenu.style.top = `${e.pageY}px`;
          contextMenu.classList.remove("hidden");
          // Only show "New Folder" if target is a folder
          ctxNewFolder.style.display = isaFolder(contextTargetNode) ? "block" : "none";
      }
  });

  // Hide context menu on global click
  window.addEventListener("mousedown", (e) => {
      if (!contextMenu.contains(e.target)) {
          contextMenu.classList.add("hidden");
      }
  });

  ctxRename.onclick = () => { window.triggerRename(contextTargetNode); contextMenu.classList.add("hidden"); };
  ctxNewFolder.onclick = () => { window.triggerNewFolder(contextTargetNode); contextMenu.classList.add("hidden"); };
  ctxDelete.onclick = () => { window.triggerDelete(contextTargetNode); contextMenu.classList.add("hidden"); };

  // Master Data Sync Helpers
  function resolveNameClash(name, parentData, excludeNode = null) {
      if (!parentData || !parentData.children) return name;
      
      let finalName = name;
      let counter = 1;
      
      // Determine if there's an extension to preserve during suffixing (e.g. file.txt -> file (2).txt)
      const lastDotIndex = name.lastIndexOf(".");
      const hasExtension = lastDotIndex > 0 && (name.length - lastDotIndex) <= 6; 
      const baseName = hasExtension ? name.substring(0, lastDotIndex) : name;
      const extension = hasExtension ? name.substring(lastDotIndex) : "";

      // Helper to check if name exists in siblings
      const checkClash = (n) => parentData.children.some(child => 
          child !== excludeNode && child.name.toLowerCase() === n.toLowerCase()
      );

      while (checkClash(finalName)) {
          counter++;
          finalName = `${baseName} (${counter})${extension}`;
      }
      
      return finalName;
  }

  function findInMaster(nodeData, root = window.originalFullData) {
      if (root.path === nodeData.path && root.name === nodeData.name) return root;
      if (root.children) {
          for (const child of root.children) {
              const found = findInMaster(nodeData, child);
              if (found) return found;
          }
      }
      return null;
  }

  function updatePathAfterMove(node, newParentMaster) {
      const oldFullPath = node.path + "\\" + node.name;
      const newParentPath = newParentMaster.path + "\\" + newParentMaster.name;

      if (node.type === 'folder' || node.type === 'Folder') {
          node.path = newParentPath;
          const newFullPath = node.path + "\\" + node.name;

          // Recursively update children
          if (node.children) {
              updateDescendantPaths(node, oldFullPath, newFullPath);
          }
      } else {
          // For files, path is just the parent directory
          node.path = newParentPath;
      }
  }

  function updateDescendantPaths(data, oldParentPath, newParentPath) {
      if (data.children) {
          data.children.forEach(child => {
              if (child.path && child.path.startsWith(oldParentPath)) {
                  child.path = newParentPath + child.path.substring(oldParentPath.length);
              }
              if (child.children) {
                  updateDescendantPaths(child, oldParentPath, newParentPath);
              }
          });
      }
  }

  // Event listener for color selection change (single dropdown)
  colorBySelect.addEventListener("change", function () {
      if (currentDataNodes.length > 0) {
        // If the mode is not ratio, clear ratio filter
        if (colorBySelect.value !== "ratio") {
          window.currentFilterFunction = null;
          window.currentFilterDescription = null;
        }      
        processAndRenderVisualization(rootNodeData); // Re-draw with new sort criteria
        drawVisualization(); // Re-draw with new color scheme
      }
  });

  // Event listener for sorting criteria change
  if (sortBySelect) {
    sortBySelect.addEventListener("change", function () {
      processAndRenderVisualization(rootNodeData); // Re-draw with new sort criteria
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


  // Event listener for relative date toggle
  relativeDate.addEventListener("change", function () {
    setColorDomains();
    initiateVisuals(rootNodeData); // Force rebuild of histograms with new scales
    drawVisualization();
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

  if (toggleTreeBtn && folderTreeColumn) {
      toggleTreeBtn.addEventListener("click", () => {
          folderTreeColumn.classList.toggle("collapsed-column");
          mainGrid?.classList.toggle("hide-left");
          toggleTreeBtn.innerHTML = folderTreeColumn.classList.contains("collapsed-column") ? "&#9654;" : "&#9664;";
      });
  }

  if (toggleGraphBtn && interactionGraphColumn) {
      toggleGraphBtn.addEventListener("click", () => {
          interactionGraphColumn.classList.toggle("collapsed-column");
          mainGrid?.classList.toggle("hide-right");
          toggleGraphBtn.innerHTML = interactionGraphColumn.classList.contains("collapsed-column") ? "&#9664;" : "&#9654;";
      });
  }

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
    
    const currentSearchTerm = searchTerm;
    const currentGraphFilter = window.currentFilterFunction;
    
    const matchesSearch = (d, dpt) => {
        const term = currentSearchTerm.toLowerCase();
        const nameMatch = term.length < 2 || d.name.toLowerCase().includes(term);
        const graphMatch = !currentGraphFilter || currentGraphFilter(d, dpt);
        return nameMatch && graphMatch;
    };

    activeFilters.push({
        desc: "Filtered with " + desc,
        fn: (data) => filterHierarchy(data, matchesSearch)
    });
    applyFilters();

     resetButton.classList.remove("hidden");
    resetButton2.classList.remove("hidden");
    searchTerm = "";  
    searchInput.value = "";
    window.currentFilterFunction = null;
    window.currentFilterDescription = null;
   });
  

  // Event listener for selecting Empty Folders (highlighting them as a selection set)
  emptyFolderSelectButton.addEventListener("click", function () {
      // Use the Graph Filter mechanism so they appear as a "Search Set" without pruning the view
      window.currentFilterFunction = (data) => {
          const isFolder = data.type === "folder" || data.type === "Folder" || data.type === "Directory" || data.type === "directory";
          const isEmpty = !data.children || data.children.length === 0;
          return isFolder && isEmpty;
      };
      window.currentFilterDescription = "Empty Folders";
      
      // Clear text search to focus purely on the empty folder set
      searchTerm = "";
      searchInput.value = "";
      
      drawVisualization(); 
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

    const currentSearchTerm = searchTerm;
    const currentGraphFilter = window.currentFilterFunction;

    const mismatchesSearch = (d, dpt) => {
        const term = currentSearchTerm.toLowerCase();
        // We want to KEEP things that do NOT match the search term
        // But we must also respect the graph filter (keep things that DO match the graph)
        // Folders must pass the graph filter check to ensure we don't prune the tree root.
        const isFolder = d.children && d.children.length > 0;
        
        if (term.length >= 2) {
             // Standard: Remove text matches, but keep items within the graph selection
             return !d.name.toLowerCase().includes(term) && (!currentGraphFilter || isFolder || currentGraphFilter(d, dpt));
        } else {
             // No text search: Invert the graph selection (Remove what is brushed)
             return isFolder || !currentGraphFilter || !currentGraphFilter(d, dpt);
        }
    };

    activeFilters.push({
        desc: "Filtered without " + desc,
        fn: (data) => filteroutHierarchy(data, mismatchesSearch)
    });
    applyFilters();

    resetButton.classList.remove("hidden");
    resetButton2.classList.remove("hidden");
    searchTerm = "";
    searchInput.value = "";
    window.currentFilterFunction = null;
    window.currentFilterDescription = null;
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


  function applyFilters() {
    let data = JSON.parse(JSON.stringify(window.originalFullData));
    
    for (const f of activeFilters) {
        const nextData = f.fn(data);
        if (nextData) {
            data = nextData;
        } else {
            displayMessageBox("Filter combination resulted in no data. Reverting.", "Warning");
            activeFilters.pop();
            applyFilters();
            return;
        }
    }

    rootNodeData = data;
    filtered = activeFilters.length > 0;
    processAndRenderVisualization(rootNodeData);
    resetZoom();
    
    const isHidden = activeFilters.length === 0;
    resetButton.classList.toggle("hidden", isHidden);
    resetButton2.classList.toggle("hidden", isHidden);
  }

  resetButton.addEventListener("click", function () {
    activeFilters = [];
    applyFilters();
    hasUnsavedChanges = false;
    resetButton.classList.add("hidden");
    resetButton2.classList.add("hidden");
    searchTerm = "";
    searchInput.value = "";
  });

    resetButton2.addEventListener("click", function () {
    activeFilters = [];
    applyFilters();
    resetButton.classList.add("hidden");
    resetButton2.classList.add("hidden");
    searchTerm = "";
    searchInput.value = "";
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

// Event listeners for folder-specific filtering
folderFilterButton.addEventListener("click", function () {
    if (!selectedNode || !isaFolder(selectedNode)) return;
    
    if (selectedNode.depth === 0) {
        displayMessageBox("You are already viewing the root folder.", "Info");
        return;
    }

    const targetPath = selectedNode.data.path;
    const targetName = selectedNode.data.name;

    // Reuse filterHierarchy: keep if node is part of the selected folder's subtree
    const matchesSearch = (d) => d.path.startsWith(targetPath);
    activeFilters.push({
        desc: "Focused on " + targetName,
        fn: (data) => filterHierarchy(data, matchesSearch)
    });
    applyFilters();
    searchTerm = "";  
    searchInput.value = "";
});

folderFilterOutButton.addEventListener("click", function () {
    if (!selectedNode || !isaFolder(selectedNode)) return;

    if (selectedNode.depth === 0) {
        displayMessageBox("You cannot filter out the current root folder.", "Warning");
        return;
    }

    const targetPath = selectedNode.data.path;
    const targetName = selectedNode.data.name;

    // Reuse filteroutHierarchy: remove if node is part of the selected folder's subtree
    const mismatchesSearch = (d) => !d.path.startsWith(targetPath);
    activeFilters.push({
        desc: "Excluded " + targetName,
        fn: (data) => filteroutHierarchy(data, mismatchesSearch)
    });
    applyFilters();
    searchTerm = "";
    searchInput.value = "";
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

  // Helper to keep the canvas rendering during the 3-second pulse period
  function startPulseLoop() {
    if (window.pulseTimer) window.pulseTimer.stop();
    window.pulseTimer = d3.timer((elapsed) => {
      drawVisualization();
      if (elapsed > 3000) {
        window.pulseTimer.stop();
        window.pulseTimer = null;
        drawVisualization(); // Final draw to clear pulse
      }
    });
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
    const containerHeight = Math.min(containerWidth, window.innerHeight - 50);

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
    .sum((d) => {
        const val = parseFloat(d.value) || 0;
        // Ensure empty folders have a minimum weight so they are rendered as circles.
        if (d.parent && (d.type === "folder" || d.type === "Folder") && (!d.children || d.children.length === 0) && val < 2) {
          var minNewSize = Math.max(1000, d.parent.value * 0.2); // 20% of parent's effective value or 1000 bytes
            return minNewSize; 
        }
        return Math.pow(val, ignoreSize.value / 100);
    })
    .sort((a, b) => sortItOut(a, b));
    
    // Calculate folder ratios BEFORE packing so padding can use the values
    root.descendants().forEach(d => {
        if (isaFolder(d)) {
            d.data.folderFileRatio = calculateFolderRatio(d);
        }
    });

    const pack = d3.pack()
        .size([containerWidth, containerHeight])
        .padding(d => {
            const numChildren = d.children ? d.children.length : 0;
            const ratio = d.data ? (d.data.folderFileRatio || 0) : 0;
            const basePadding = Math.pow(parseFloat(paddingFactorslider.value) / 2000, 2);

            // Special handling for single-item folders:
            // We enforce a minimum padding of 5px to ensure there is always a 
            // visible and clickable "rim" around the lone child.
            if (numChildren <= 1) {
                return Math.max(basePadding, 5);
            }

            // For multi-item folders, use the density-aware padding:
            // High density folders get thinner borders to maximize screen real estate.
            return basePadding / (1 + (ratio / 7));
        });

    const targetNodes = pack(root).descendants();

    // VITAL: Update currentDataNodes BEFORE calling setColorDomains 
    // so folder colors are calculated based on the new structure immediately.
    currentDataNodes = targetNodes;

    // Update zoom target immediately to the new root so resetZoom works correctly
    currentZoomNode = targetNodes[0];
    window.currentZoomNode = currentZoomNode;

    setColorDomains(); 
    initiateVisuals(data);

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
      currentZoomNode = currentDataNodes[0];
      window.currentZoomNode = currentZoomNode; // Ensure global reference is updated during animation
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

  /**
   * Calculates the ratio of files to folders for immediate children only.
   * Provides a "local" density metric for the current directory level.
   */
  function calculateFolderRatio(node) {
      let numAllFiles = 0;
      let numAllFolders = 0;

      // Iterate over all descendants (including itself, but we only care about children for ratio)
      node.descendants().forEach(d => {
          if (d === node) return; // Exclude the node itself

          if (isaFolder(d)) {
              numAllFolders++;
          } else {
              numAllFiles++;
          }
      });

      // If there are no sub-folders, the "ratio" is effectively the file count.
      // This prevents Infinity and provides a meaningful density metric.
      if (numAllFolders === 0) return numAllFiles;
      if (numAllFiles === 0) return numAllFolders; // If there are no files, return the folder count to reflect density of folders
      let ratio = numAllFiles / numAllFolders; 
      return ratio; // Add the folder count
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

    let html = `<div><strong>${currentDataNodes[0].data.name}</strong> contains:</div>`;
    html += `<div>${files.length} Files, ${directories.length} Folders</div>`;

    if (filtered && activeFilters.length > 0) {
      activeFilters.forEach((f, index) => {
          html += `<div class="filter-line small-text text-info">
                    <span>${f.desc}</span>
                    <span class="remove-filter" data-index="${index}" title="Remove this filter">×</span>
                   </div>`;
      });
    }

    html += `<div class="small-text">Total size: ${formatBytes(currentDataNodes[0].value || 0)}</div>`;
    folderSummary.innerHTML = html;
  }

  /**
   * Check if a node is currently within the visible canvas bounds.
   * Used to skip drawing calculations for off-screen elements.
   */
  function isInViewport(d) {
    const viewLeft = -transform.x / transform.k;
    const viewRight = (canvas.width - transform.x) / transform.k;
    const viewTop = -transform.y / transform.k;
    const viewBottom = (canvas.height - transform.y) / transform.k;

    return d.x + d.r > viewLeft && d.x - d.r < viewRight &&
           d.y + d.r > viewTop && d.y - d.r < viewBottom;
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
        const graphMatch = !window.currentFilterFunction || window.currentFilterFunction(d.data, d.depth);
        return nameMatch && graphMatch;
    };

    searchCount.textContent = "";
    searchSum.textContent = "";

    // Determine if any filtering is active (Search text OR Graph brush)
    const isFiltering = searchTerm.length > 1 || window.currentFilterFunction !== null;
    const zoomDepth = currentZoomNode ? currentZoomNode.depth : 0;


    if (isFiltering) {
      searchLogic(matchesSearch);
      filterButton.classList.remove("hidden");
      filterOutButton.classList.remove("hidden");
      deleteMatchButton.classList.remove("hidden");
      searchSummary.classList.remove("hidden");
    } else {
      searchSummary.classList.remove("hidden");
      filterButton.classList.add("hidden");
      filterOutButton.classList.add("hidden");
      deleteMatchButton.classList.add("hidden");
      searchResults = "";
      searchCount.textContent = "";
      searchSum.textContent = "";
      searchCriteria.textContent = "";
      updateSearchResults(searchResults);
    }

    // Draw directories first (largest to smallest radius), then files
    const colorMode = colorBySelect.value;
    const directories = currentDataNodes
      .filter((d) => isaFolder(d))
      .sort((a, b) => b.r - a.r);
    directories.forEach((d) => {
      if (isInViewport(d)) {
        
        const relativeDepth = d.depth - zoomDepth;
        const isBeyondDepth = maxVisibleDepthRelative < 5 && relativeDepth > maxVisibleDepthRelative;

        if ( // Only draw if it's above the minimum radius threshold or matches the search term
          d.r * transform.k > minRadius ||
          (isFiltering && matchesSearch(d))
        ) {
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r, 0, 2 * Math.PI);
          ctx.fillStyle = getNodeColor(d);

          // Highlight for hover, selection, zoom, or search match
          // Use white strokes for the "Ratio" scheme (to contrast with black folders)
          // Use black strokes for all other schemes (to contrast with colorful/white folders)
          let strokeColor = "#000000";
          if (colorMode === "ratio") {
            strokeColor = "#ffffff";
          } else if (colorMode === "fileSize") {
            strokeColor = linearRainbowColorScale(d.depth);
          }
          let lineWidth = 0.5 / transform.k;

          if (selectedNodes.has(d) ||
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

          let baseAlpha = 1.0;
// Dim non-matching nodes if a search term is active
          if (isFiltering && !matchesSearch(d)) {
baseAlpha = 0.12; // Reduce opacity     
}

          // Smooth Information Depth Filter
          if (maxVisibleDepthRelative < 5) {
              const depthAlpha = Math.max(0.00, Math.min(1.0, maxVisibleDepthRelative - (relativeDepth - 1)));
              baseAlpha *= depthAlpha;
            }
          ctx.globalAlpha = baseAlpha;


          ctx.fill();
          ctx.stroke();


          // --- NEW FOLDER PULSE EFFECT ---
          if (d.data.creationTime && Date.now() - d.data.creationTime < 3000) {
            const age = Date.now() - d.data.creationTime;
            const opacity = 1 - (age / 3000); // Fade out over time
            const pulseRadius = Math.sin(age / 150) * 8 + 8; // Pulsating range
            
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.r + (pulseRadius / transform.k), 0, 2 * Math.PI);
            ctx.strokeStyle = `rgba(49, 124, 237, ${opacity})`; // Nircles Blue highlight
            ctx.lineWidth = 4 / transform.k;
            ctx.stroke();
          }
        }
      }
    });

    //////////////////////////////////////////////////////////////////////////
    /////////////////////// Draw the Files ///////////////////////////////////
    //////////////////////////////////////////////////////////////////////////

    const files = currentDataNodes.filter((d) => !isaFolder(d));
    files.forEach((d) => {
      if (isInViewport(d)) {
        const relativeDepth = d.depth - visualZoomDepth;

        // Performance Optimization: Skip drawing entirely if beyond the horizon
        if (maxVisibleDepthRelative < 5 && relativeDepth > Math.ceil(maxVisibleDepthRelative) + 1) return;

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
          let strokeColor = "#111"; // Default file white
          if (colorMode === "fileSize") {
            strokeColor = linearRainbowColorScale(d.depth);
          }
          let lineWidth = 0.5 / transform.k;

          if (selectedNodes.has(d)) {
            lineWidth = 2.5 / transform.k;
          }

          if (isFiltering && matchesSearch(d)) {
            strokeColor = "#ED6631"; // Orange tint for search match
            lineWidth = 5 / transform.k;
          }

          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = lineWidth;

          let baseAlpha = 1.0;
          // Dim non-matching nodes if a search term is active
          if (isFiltering && !matchesSearch(d)) {
            baseAlpha = 0.12; // Reduce opacity
          }
          
          // Smooth Information Depth Filter (Opacity only)
          if (maxVisibleDepthRelative < 5) {
              const depthAlpha = Math.max(0.001, Math.min(1.0, maxVisibleDepthRelative - (relativeDepth - 1)));
              baseAlpha *= depthAlpha;
          }
          ctx.globalAlpha = baseAlpha;
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

      const relativeDepth = d.depth - visualZoomDepth;
      
      // Skip labels entirely if beyond the horizon
      if (maxVisibleDepthRelative < 5 && relativeDepth > Math.ceil(maxVisibleDepthRelative) + 0.5) return;

      if (isVisibleInZoom) {
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
        if (isaFolder(d)) {
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

  function drawHighlights() {
    // Clear the overlay regardless of animation state
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    // Only skip drawing if a main layout animation is running AND we aren't dragging
    if (isAnimating && !draggedNode) return;

    // Only proceed if there's something to highlight
    if (!draggedNode && !hoveredNode) {
        return;
    }
    overlayCtx.save();
    overlayCtx.translate(transform.x, transform.y);
    overlayCtx.scale(transform.k, transform.k);
    
    // Draw dragged node ghost and line
    if (draggedNode) {
        // Draw ghost circle
        overlayCtx.beginPath();
        if (!isaFolder(draggedNode) && hexagonalFiles.checked) {
            const polySides = 6;
            for (let i = 0; i < polySides; i++) {
                const angle = (2 * Math.PI / polySides) * i;
                const x = draggedNode.currentX + draggedNode.r * Math.sin(angle);
                const y = draggedNode.currentY + draggedNode.r * Math.cos(angle);
                if (i === 0) overlayCtx.moveTo(x, y);
                else overlayCtx.lineTo(x, y);
            }
            overlayCtx.closePath();
        } else {
            overlayCtx.arc(draggedNode.currentX, draggedNode.currentY, draggedNode.r, 0, 2 * Math.PI);
        }
        
        overlayCtx.fillStyle = "rgba(255, 255, 255, 0.3)"; // Semi-transparent white
        overlayCtx.strokeStyle = "#ffa135";
        overlayCtx.lineWidth = 2 / transform.k;
        overlayCtx.fill();
        overlayCtx.stroke();

        // Draw line from origin
        overlayCtx.beginPath();
        overlayCtx.moveTo(draggedNode.originalX, draggedNode.originalY);
        overlayCtx.lineTo(draggedNode.currentX, draggedNode.currentY);
        overlayCtx.strokeStyle = "#ffa135";
        overlayCtx.lineWidth = 1 / transform.k;
        overlayCtx.setLineDash([5 / transform.k, 5 / transform.k]); // Dashed line
        overlayCtx.stroke();
        overlayCtx.setLineDash([]); // Reset line dash

        // Calculate the actual landing zone (files redirect to parent)
        let effectiveTarget = hoveredNode;
        if (effectiveTarget && !isaFolder(effectiveTarget)) {
            effectiveTarget = effectiveTarget.parent;
        }

        // Validity check: Not itself, not current parent, and not a descendant
        let isValid = false;
        if (effectiveTarget && effectiveTarget !== draggedNode && effectiveTarget !== draggedNode.parent) {
            let temp = effectiveTarget;
            let isDescendant = false;
            while (temp) {
                if (temp === draggedNode) {
                    isDescendant = true;
                    break;
                }
                temp = temp.parent;
            }
            if (!isDescendant) isValid = true;
        }

        // Highlight target folder for a valid move
        if (isValid && effectiveTarget) {
            overlayCtx.beginPath();
            overlayCtx.arc(effectiveTarget.x, effectiveTarget.y, effectiveTarget.r, 0, 2 * Math.PI);
            overlayCtx.strokeStyle = "var(--NirclesBlue, #317ced)";
            overlayCtx.lineWidth = 6 / transform.k;
            overlayCtx.stroke();
        } 
        // Show an "X" icon near the ghost if hovering over an invalid target
        else if (hoveredNode) {
            const xSize = 7 / transform.k;
            const xPos = draggedNode.currentX + draggedNode.r + (10 / transform.k);
            const yPos = draggedNode.currentY - draggedNode.r - (10 / transform.k);
            
            overlayCtx.beginPath();
            overlayCtx.moveTo(xPos - xSize, yPos - xSize);
            overlayCtx.lineTo(xPos + xSize, yPos + xSize);
            overlayCtx.moveTo(xPos + xSize, yPos - xSize);
            overlayCtx.lineTo(xPos - xSize, yPos + xSize);
            
            overlayCtx.strokeStyle = "#dc2626"; // Error Red
            overlayCtx.lineWidth = 3 / transform.k;
            overlayCtx.stroke();
        }

        if (isMovingSearchSet) {
            const isMatch = getMatchesSearch();
            const count = currentDataNodes.filter(isMatch).length;
            overlayCtx.fillStyle = "white";
            overlayCtx.font = `${14 / transform.k}px Roboto`;
            overlayCtx.textAlign = "center";
            overlayCtx.fillText(`Moving ${count} items`, draggedNode.currentX, draggedNode.currentY - draggedNode.r - (10 / transform.k));
        }
    }
    // Draw hovered node highlight (only if not dragging the same node)
    else if (hoveredNode) {
        const d = hoveredNode;
        overlayCtx.beginPath();
        if (!isaFolder(d) && hexagonalFiles.checked) {
            const polySides = 6;
            for (let i = 0; i < polySides; i++) {
                const angle = (2 * Math.PI / polySides) * i;
                const x = d.x + d.r * Math.sin(angle);
                const y = d.y + d.r * Math.cos(angle);
                if (i === 0) overlayCtx.moveTo(x, y);
                else overlayCtx.lineTo(x, y);
            }
            overlayCtx.closePath();
        } else {
            overlayCtx.arc(d.x, d.y, d.r, 0, 2 * Math.PI);
        }
        overlayCtx.strokeStyle = "#ffa135";
        overlayCtx.lineWidth = 4 / transform.k;
        overlayCtx.stroke();
    }

    overlayCtx.restore();
  }

  // Search functionality
  function searchLogic(matchesSearch) {
    const matchedNodes = currentDataNodes.filter(matchesSearch);
    const match = matchedNodes.length;
    const matchfolder = matchedNodes.filter((d) => isaFolder(d)).length;
    let thisSum = 0;
    matchedNodes.forEach((d) => {
      thisSum = thisSum + d.value;
    });

    // Update Search Summary Panel
    const searchSummaryPanel = document.getElementById("searchResultSummary");
    if (match > 0) {
        initialDetailsPrompt.classList.add("hidden");
        selectedItemDetails.classList.add("hidden");
        searchSummaryPanel.classList.remove("hidden");
        document.getElementById("summaryMatchCount").textContent = `${matchfolder} folders, ${match - matchfolder} files`;
        document.getElementById("summaryTotalSize").textContent = formatBytes(thisSum);
    } else {
        searchSummaryPanel.classList.add("hidden");
        if (!selectedNode) initialDetailsPrompt.classList.remove("hidden");
    }

    searchCount.textContent = matchfolder + " folders and " + (match - matchfolder) + " files";
    searchSum.textContent = formatBytes(thisSum);

    // Build and display criteria description
    let criteria = [];
    if (searchTerm.length > 1) criteria.push(`Name contains "${searchTerm}"`);
    if (window.currentFilterDescription) criteria.push(window.currentFilterDescription);
    searchCriteria.textContent = criteria.join(" AND ");

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
    const typeCounts = {};
    currentDataNodes.forEach(d => {
        if (!isaFolder(d)) {
            const t = d.data.type || "unknown";
            typeCounts[t] = (typeCounts[t] || 0) + 1;
        }
    });

    // Identify Top 10 extensions by count
    window.topFileTypes = Object.entries(typeCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(entry => entry[0]);

    // Domain is restricted to the top 10 to ensure consistent color mapping
    categoricalColorScale.domain(window.topFileTypes);

    const isRelative = relativeDate.checked;
    const nowUnix = Date.now() / 1000;

    const allDates = currentDataNodes
      .filter((d) => d.data.last_modified_unix)
      .map((d) => {
        if (isRelative) {
          // Age in days. Minimum 0.001 (approx 1.5 mins) to allow log scales.
          return Math.max(0.001, (nowUnix - d.data.last_modified_unix) / 86400);
        }
        return d.data.last_modified_unix;
      });

    const minDate = d3.min(allDates);
    const maxDate = d3.max(allDates);
    const dateRange = maxDate - minDate;

    if (isRelative) {
      // 1. Determine the appropriate unit and divisor for the range
      const maxDays = d3.max(allDates) || 1;
      let unit = "days", divisor = 1;
      if (maxDays > 730) { unit = "years"; divisor = 365; }
      else if (maxDays > 60) { unit = "months"; divisor = 30.44; }
      else if (maxDays > 14) { unit = "weeks"; divisor = 7; }
      
      window.currentAgeUnit = unit;
      window.currentAgeDivisor = divisor;

      // 2. Use Log2 scale. Newer items (smaller unit value) are lighter.
      linearBWColorScale1 = d3.scaleLog()
        .base(2)
        .range(["#eee","#222"])
        .domain([1, Math.max(2, maxDays / divisor)]); // Domain in selected units
      
      minDateLabel.textContent = "Newest";
      maxDateLabel.textContent = "Oldest (" + formatAge(maxDays) + ")";
    } else {
      // Use linear scale for absolute time. Newer items (larger timestamp) are lighter.
      linearBWColorScale1 = d3.scaleLinear()
        .range(["#222", "#ebebeb"]);
        
      linearBWColorScale1.domain([minDate, maxDate]); // Use linear scale for absolute time

      minDateLabel.textContent = minDate ? d3.timeFormat("%d.%m.%Y")(new Date(minDate * 1000)) : "";
      maxDateLabel.textContent = maxDate ? d3.timeFormat("%d.%m.%Y")(new Date(maxDate * 1000)) : "";
    }
    
    window.linearBWColorScale1 = linearBWColorScale1;
    linearBWColorScale2.domain([minDate, maxDate]);

    // Consider all nodes (files and folders) for the size scale domain
    const allSizes = currentDataNodes.map((d) => d.value);
    // Log scale domain must be > 0. Clamp minimum to 1 byte.
    const minFileSize = Math.max(1, d3.min(allSizes) || 1);
    const maxFileSize = Math.max(minFileSize + 1, d3.max(allSizes) || 10);
    exponentialColorScale.domain([minFileSize, maxFileSize]);

    const allFileDepths = currentDataNodes
      .filter((d) => !isaFolder(d))
      .map((d) => d.depth);
    const minFileDepth = d3.min(allFileDepths);
    const maxFileDepth = d3.max(allFileDepths);
    linearRainbowColorScale.domain([0, 5]);
    updateGraphVisibility();

  }

  // Helper function to format age in days to human-readable units
  function formatAge(days) {
      if (days < 1) return "<1 day";
      if (days < 7) return `${Math.round(days)} day${Math.round(days) === 1 ? '' : 's'}`;
      if (days < 30) return `${Math.round(days / 7)} week${Math.round(days / 7) === 1 ? '' : 's'}`;
      if (days < 365) return `${Math.round(days / 30.44)} month${Math.round(days / 30.44) === 1 ? '' : 's'}`; // Average days in month
      if (days < 365 * 5) return `${Math.round(days / 365)} year${Math.round(days / 365) === 1 ? '' : 's'}`;
      if (days < 365 * 10) return `${Math.round(days / 365)} years`;
      return `${Math.round(days / 365)} years+`;
  }

  // Function to get color based on selected option
  function getNodeColor(d) {
    const colorMode = colorBySelect.value;
    const isRelative = relativeDate.checked;
    const nowUnix = Date.now() / 1000;

    let dateValue = d.data.last_modified_unix;
    if (dateValue && isRelative) {
      const daysOld = Math.max(0.001, (nowUnix - dateValue) / 86400);
      const divisor = window.currentAgeDivisor || 1;
      dateValue = Math.max(1, daysOld / divisor); // Convert to units and clamp to domain start
    }

    if (isaFolder(d)) {
      // Folder coloring logic
      if (colorMode === "ratio") {
        return folderRatioColorScale(d.data.folderFileRatio);
      } else if (colorMode === "type") {
        return "#ffffff"; // Folders appear white when coloring by file type
      } else if (colorMode === "depth") {
        return linearRainbowColorScale(d.depth);
      } else if (colorMode === "date") {
        return dateValue ? linearBWColorScale1(dateValue) : "#fff";
      } else if (colorMode === "fileSize") {
        return exponentialColorScale(Math.max(1, d.value)); // Guard against 0 for log scale
      }
      return "#888"; // Default folder color
    } else {
      // File coloring logic
      if (colorMode === "ratio") {
        return "#ffffff"; // Files appear white when coloring by ratio
      } else if (colorMode === "type") {
        const type = d.data.type || "unknown";
        return window.topFileTypes.includes(type) ? categoricalColorScale(type) : "#bfc3ba"; // Use AshGrey for others
      } else if (colorMode === "depth") {
        return linearRainbowColorScale(d.depth);
      } else if (colorMode === "date") {
        return dateValue ? linearBWColorScale1(dateValue) : "#fff";
      } else if (colorMode === "fileSize") {
        return exponentialColorScale(Math.max(1, d.value)); // Guard against 0 for log scale
      }
      return "#ccc"; // Default file color
    }
  }

  function updateGraphVisibility() {
    const typeLegendItems = document.getElementById("typeLegendItems");
    const dateLegendItems = document.getElementById("dateLegendItems");
    const depthLegendItems = document.getElementById("depthLegendItems");
    const fileSizeLegendItems = document.getElementById("fileSizeLegendItems");
    const ratioLegendItems = document.getElementById("ratioLegendItems"); // New ratio legend
    const ratioGraphItems = document.getElementById("ratioGraphItems");
    
    [typeLegendItems, dateLegendItems, depthLegendItems, fileSizeLegendItems, ratioLegendItems, ratioGraphItems, searchSummary].forEach(el => {
      if(el) el.classList.add("hidden");
    });

    const mode = colorBySelect.value;

    if (mode === "type") typeLegendItems.classList.remove("hidden");
    if (mode === "ratio") {
        ratioLegendItems.classList.remove("hidden");
        ratioGraphItems.classList.remove("hidden");
    }
    if (mode === "date") dateLegendItems.classList.remove("hidden");
    if (mode === "depth") depthLegendItems.classList.remove("hidden");
    if (mode === "fileSize") {
        fileSizeLegendItems.classList.remove("hidden");
        searchSummary.classList.remove("hidden");
    }
  }

  function zoomToNode(node, targetMaxVisibleDepth = null) {
    const width = canvas.width;
    const height = canvas.height;
    
    const k = Math.min(width, height) / (node.r * 2.125);
    const tx = width / 2 - node.x * k;
    const ty = height / 2 - node.y * k;
    
    const newTransform = d3.zoomIdentity.translate(tx, ty).scale(k);
    
    const startVisualDepth = visualZoomDepth;
    const endVisualDepth = node.depth;
    
    d3.transition().duration(750).tween("zoom", function () {
      const i = d3.interpolate(transform, newTransform);
      const iVisualDepth = d3.interpolate(startVisualDepth, endVisualDepth);
      updateBreadcrumbs();
      let iDepth = null;
      if (targetMaxVisibleDepth !== null) {
          iDepth = d3.interpolate(maxVisibleDepthRelative, targetMaxVisibleDepth);
      }
      return function (t) {
        transform = i(t);
        visualZoomDepth = iVisualDepth(t);
        if (iDepth) {
            maxVisibleDepthRelative = iDepth(t);
            depthVisibilitySlider.value = maxVisibleDepthRelative;
            depthLabel.textContent = maxVisibleDepthRelative >= 5 ? "Deep" : maxVisibleDepthRelative.toFixed(1);
        }
        isAnimating = true;  
            drawVisualization();
            drawHighlights();
        };
    }).on("end", () => {
        // VITAL: Update the D3 zoom state so panning starts from THIS position
        d3.select(canvas).property("__zoom", newTransform); 
        isAnimating = false;
        visualZoomDepth = endVisualDepth;
        if (targetMaxVisibleDepth !== null) {
            // Ensure final value is set precisely
            maxVisibleDepthRelative = targetMaxVisibleDepth;
            depthVisibilitySlider.value = maxVisibleDepthRelative;
            depthLabel.textContent = maxVisibleDepthRelative >= 5 ? "Deep" : maxVisibleDepthRelative.toFixed(1);
        }
    });
    currentZoomNode = node;
}

  /**
   * Animates the depth visibility from current to max and back to show off the data structure.
   */
  function animateDepthShowcase() {
      if (maxVisibleDepthRelative >= 5) return;
      const originalDepth = maxVisibleDepthRelative;
      
      d3.transition()
          .duration(2500)
          .ease(d3.easeQuadInOut)
          .tween("depthShowcase", function() {
              const i = d3.interpolate(originalDepth, 5);
              return function(t) {
                  const val = i(t);
                  maxVisibleDepthRelative = val;
                  depthVisibilitySlider.value = val;
                  depthLabel.textContent = val >= 5 ? "Deep" : val.toFixed(1);
                  drawVisualization();
              };
          })
          .transition()
          .duration(2500)
          .ease(d3.easeQuadInOut)
          .tween("depthReturn", function() {
              const i = d3.interpolate(5, originalDepth);
              return function(t) {
                  const val = i(t);
                  maxVisibleDepthRelative = val;
                  depthVisibilitySlider.value = val;
                  depthLabel.textContent = val >= 5 ? "Deep" : val.toFixed(1);
                  drawVisualization();
              };
          });
  }

  function resetZoom() {
    currentZoomNode = currentDataNodes[0];
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
        separator.textContent = "\u203A"; // Segmented chevron like Explorer
        separator.className = "breadcrumb-separator";
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

    overlayCanvas.width = containerWidth;
    overlayCanvas.height = containerHeight;

    const root = d3
      .hierarchy(newNodeData)
      .sum((d) => Math.pow(d.value, ignoreSize.value / 100))
      .sort((a, b) => sortItOut(a, b));

    // Sync ratio calculation for consistency
    root.descendants().forEach(d => {
        if (isaFolder(d)) d.data.folderFileRatio = calculateFolderRatio(d);
    });

      const pack = d3
          .pack()
          .size([containerWidth, containerHeight])
          .padding(d => {
              const ratio = d.data ? (d.data.folderFileRatio || 0) : 0;
              const basePadding = Math.pow(parseFloat(paddingFactorslider.value) / 2000, 2);
              return basePadding / (1 + (ratio / 10));
          });

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
    isAnimating = true; // SET FLAG: Stop drawing labels
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
        isAnimating = false;
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

    // Calculate tooltip position to prevent overflowing the viewport and causing scrollbars
    const tooltipNode = tooltip.node();
    const tooltipWidth = tooltipNode.offsetWidth;
    const tooltipHeight = tooltipNode.offsetHeight;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let posX = event.clientX + 15;
    let posY = event.clientY + 15;

    // Flip tooltip to the left if it would overflow the right edge
    if (posX + tooltipWidth > viewportWidth) posX = event.clientX - tooltipWidth - 15;
    // Flip tooltip upwards if it would overflow the bottom edge
    if (posY + tooltipHeight > viewportHeight) posY = event.clientY - tooltipHeight - 15;

    tooltip.style("transform", `translate(${posX}px, ${posY}px)`);

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

    // Only update DOM if the hovered node changes, for performance
    if (foundNode !== hoveredNode) {
      hoveredNode = foundNode;
      window.hoveredNode = hoveredNode; // Store hovered node in global variable for access in other functions
      drawHighlights();

      if (hoveredNode) {
        let details = ''; // Initialize details string
        const colorMode = colorBySelect.value;

        // Add common details first
        details += `<br/><strong>Type: </strong>${isaFolder(hoveredNode) ? 'Folder' : hoveredNode.data.type || 'N/A'}`;
        details += `<br/><strong>Size: </strong>${formatBytes(hoveredNode.value)}`;
        details += `<br/><strong>Modified: </strong>${hoveredNode.data.last_modified_iso ? new Date(hoveredNode.data.last_modified_unix * 1000).toLocaleDateString() : "N/A"}`;
        details += `<br/><strong>Depth: </strong>${hoveredNode.depth}`;

        // Add ratio for folders if applicable
        if (isaFolder(hoveredNode) && hoveredNode.data.folderFileRatio !== undefined) {
            details += `<br/><strong>Ratio (F/f): </strong>${hoveredNode.data.folderFileRatio.toFixed(2)}`;
        }

        tooltip
          .style("opacity", 1)
          .html(
            `<strong>${hoveredNode.data.name}</strong>
             <br/><strong>Parent: </strong>${hoveredNode.parent ? hoveredNode.parent.data.name : "N/A"}
             ${details}`
          );
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
      drawHighlights(); // Redraw to remove hover highlight
      tooltip.style("opacity", 0);
    }
  });

  // Event listener for click on canvas
  canvas.addEventListener("click", function (event) {
    const clickedNode = findNodeAt(event.clientX, event.clientY);
    if (clickedNode) {
      window.selectedNode = clickedNode;

      // Transition to full clarity: Adjust depth if clicking a hidden object
      const zoomDepth = currentZoomNode ? currentZoomNode.depth : 0;
      const clickedRelDepth = clickedNode.depth - zoomDepth;
      let depthToPass = null;
      if (maxVisibleDepthRelative < 10 && clickedRelDepth > maxVisibleDepthRelative) {
          depthToPass = Math.ceil(clickedRelDepth);
      }

      // Handle Multi-select with Ctrl
      if (event.ctrlKey) {
          if (selectedNodes.has(clickedNode)) {
              selectedNodes.delete(clickedNode);
              if (selectedNode === clickedNode) selectedNode = Array.from(selectedNodes).pop() || null;
          } else {
              selectedNodes.add(clickedNode);
              selectedNode = clickedNode;
          }
      } else {
          selectedNodes.clear();
          selectedNodes.add(clickedNode);
          selectedNode = clickedNode;
          zoomToNode(clickedNode, depthToPass); // Pass the target depth here
      }

      if (selectedNode) selectedNodeDetails(selectedNode);

      //Breadcrumbs or full path needs updating
      drawVisualization(); // Redraw to remove selection highlight

      if (typeof window.highlightNodeInTree === 'function') {
        window.highlightNodeInTree(selectedNode);
      }
    } else {
      // If click occurred outside any node, clear selection and zoom out
        selectedNodes.clear();
        selectedNode = null;
        drawVisualization(); // Redraw to remove selection highlight
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

    if (selectedNodes.size > 1) {
        detailName.textContent = `${selectedNodes.size} items selected`;
        detailType.textContent = "Mixed Selection";
        // Handle summary for multiple items if desired
    } else {
        detailName.textContent = selectedNode.data.name;
        detailType.textContent = selectedNode.data.type || "Folder";
    }
    
    document.getElementById("searchResultSummary").classList.add("hidden");
    // Display details in the third column
      selectedItemDetails.classList.remove("hidden");
      copyPathButton.classList.remove("hidden");
      initialDetailsPrompt.classList.add("hidden");
      
    // Inject contextual buttons
    itemContextActions.innerHTML = "";
    const btnRename = document.createElement("button");
    btnRename.className = "small-btn";
    btnRename.textContent = "Rename";
    btnRename.onclick = () => window.triggerRename(node);
    itemContextActions.appendChild(btnRename);

    if (isaFolder(node)) {
        const btnNew = document.createElement("button");
        btnNew.className = "small-btn";
        btnNew.textContent = "New Folder";
        btnNew.onclick = () => window.triggerNewFolder(node);
        itemContextActions.appendChild(btnNew);
    }

    const btnDel = document.createElement("button");
    btnDel.className = "small-btn";
    btnDel.style.backgroundColor = "var(--AshGrey)";
    btnDel.textContent = "Delete";
    btnDel.onclick = () => window.triggerDelete(node);
    itemContextActions.appendChild(btnDel);

    if (isaFolder(selectedNode)) {
        folderSpecificActions.classList.remove("hidden");
        
        const children = selectedNode.children || [];
        const dirCount = children.filter(d => isaFolder(d)).length;
        const fileCount = children.length - dirCount;
        const totalDescendants = selectedNode.descendants().length - 1;

        detailChildren.innerHTML = `
            ${dirCount} folders, ${fileCount} files (immediate)
            <div class="small-text">${totalDescendants} total items in subtree</div>
            <div><strong>Ratio: </strong>${(selectedNode.data.folderFileRatio || 0).toFixed(2)}</div>
        `;
    } else {
        folderSpecificActions.classList.add("hidden");
        detailChildren.textContent = "";
      }
      detailSize.textContent = formatBytes(selectedNode.value);
      detailLastModified.textContent = selectedNode.data.last_modified_iso
        ? new Date(selectedNode.data.last_modified_unix * 1000).toLocaleDateString()
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
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(0)) + " " + sizes[i];
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
        
        resultItem.innerHTML = `
            <div>${path.data.name}</div>
            <div>${path.data.path}</div>
        `;
        resultItem.addEventListener("click", () => zoomToNode(path));

        searchItems.appendChild(resultItem);
      });
    } else {
      if (colorBySelect.value !== "fileSize") searchSummary.classList.add("hidden");
    }
  }

  folderSummary.addEventListener("click", function(e) {
    if (e.target.classList.contains("remove-filter")) {
      const index = parseInt(e.target.getAttribute("data-index"));
      activeFilters.splice(index, 1);
      applyFilters();
    }
  });

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
        const newHeight = Math.min(newWidth, window.innerHeight - 50);

        if (canvas.width !== newWidth || canvas.height !== newHeight) {
          canvas.width = newWidth;
          canvas.height = newHeight;

          overlayCanvas.width = newWidth;
          overlayCanvas.height = newHeight;

          if (rootNodeData) {
            // Re-process and redraw with new dimensions if data is loaded
            processAndRenderVisualization(rootNodeData);
            //folderSummary = data.length();
            // Reset zoom after resize to fit new dimensions
            //resetZoom();
          } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear if no data
            overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
          }
        }
      }
    }
  });

  // Start observing the visualization column for size changes
  resizeObserver.observe(visualizationColumn);
});
