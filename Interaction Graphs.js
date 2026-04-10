// Based on the D3 collapsible tree example

// Helper for tooltips in graphs
function updateGraphTooltip(event, content) {
    const tooltip = d3.select("#tooltip");
    if (content) tooltip.html(content);
    tooltip.style("opacity", 1);
    
    const tooltipNode = tooltip.node();
    let posX = event.clientX + 15;
    let posY = event.clientY + 15;

    if (posX + tooltipNode.offsetWidth > window.innerWidth) posX = event.clientX - tooltipNode.offsetWidth - 15;
    if (posY + tooltipNode.offsetHeight > window.innerHeight) posY = event.clientY - tooltipNode.offsetHeight - 15;

    tooltip.style("transform", `translate(${posX}px, ${posY}px)`);
}

function hideGraphTooltip() {
    d3.select("#tooltip").style("opacity", 0);
}

function InteractionGraphs(data) {
  // Now you can build your charts using 'data'
  //buildAgeHistogram(data);
  buildDepthHistogram(data);
  buildAgeGraph(data);
  buildPieChart(data);
  buildSizeGraph(data);
  buildRatioHistogram(data);
  //buildDepthGraph(data);
}
function resetAllGraphs(){
  d3.select("svg").remove(); 
}
  function buildDepthHistogram(dataset) {
    const margin = { top: 10, right: 20, bottom: 20, left: 50 },
      width = 250 - margin.left - margin.right,
      height = 125 - margin.top - margin.bottom;

    d3.select("#depth-histogram").html("");

    const svg = d3
      .select("#depth-histogram")
      .append("svg")
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // --- DATA PROCESSING ---
    const root = d3.hierarchy(dataset);
    const allNodes = root.descendants().map((d) => {
      const data = d.data;
      data.depthObject = d.depth;
      return data;
    });

    // --- SCALES ---
    const x = d3
      .scaleLinear()
      .domain(d3.extent(allNodes, (d) => d.depthObject))
      .nice()
      .range([0, width]);
    const depthCounts = {};

    root.descendants().forEach((node) => {
      const d = node.depth;
      depthCounts[d] = (depthCounts[d] || 0) + 1;
    });

    // Convert object to sorted array: [{depth: 0, count: 5}, ...]
    const plotData = Object.keys(depthCounts)
      .map((d) => ({ depth: +d, count: depthCounts[d] }))
      .sort((a, b) => a.depth - b.depth);

    const y = d3.scaleLinear().range([height, 0]);

    // --- BINNING ---
    const histogram = d3
      .bin()
      .value((d) => d.depthObject)
      .domain(x.domain())
      .thresholds(root.height);

    const bins = histogram(allNodes);
    y.domain([0, d3.max(bins, (d) => d.length)]).nice(); // Scale y based on max count, with some padding

    // --- DRAW BARS ---
    const bars = svg
      .selectAll("rect")
      .data(bins)
      .join("rect")
      .attr("x", (d) => x(d.x0))
      .attr("width", (d) => Math.max(0, x(d.x1) - x(d.x0) - 1))
      .attr("y", (d) => y(d.length))
      .attr("height", (d) => height - y(d.length))
      .attr("fill", d => window.linearRainbowColorScale(d.x0));

    // --- AXES ---
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5, ".0f").tickValues(x.domain()));

    svg.append("g").call(d3.axisLeft(y).tickValues(y.domain()));

    // --- ADD BRUSHING BACK ---
    const brush = d3
      .brushX()
      .extent([
        [0, 0],
        [width, height],
      ])
      .on("brush end", brushed);

    svg.append("g")
      .attr("class", "brush")
      .call(brush)
      .on("mousemove", (event) => {
          const [mx] = d3.pointer(event);
          const val = x.invert(mx);
          const bin = bins.find(b => val >= b.x0 && val < b.x1);
          if (bin) {
              updateGraphTooltip(event, `<strong>Depth: ${bin.x0}</strong><br/>Items: ${bin.length}`);
          }
      })
      .on("mouseout", hideGraphTooltip);

    function brushed(event) {
      const selection = event.selection;
      if (!selection) {
        window.currentFilterFunction = null;
        if(window.drawVisualization) window.drawVisualization();
        return;
      }

      // Convert pixel selection back to depth values and snap to nearest integer
      // to ensure "2.5" logic selects the intended discrete depth level.
      const [rawMin, rawMax] = selection.map(x.invert);
      const minD = Math.round(rawMin);
      const maxD = Math.round(rawMax);
      
      window.currentFilterFunction = (d, dpt) => {
          // Use structural depth (dpt) if provided, otherwise fallback to attached property
          const checkDepth = dpt !== undefined ? dpt : d.depthObject;
          return checkDepth !== undefined && checkDepth >= minD && checkDepth <= maxD;
      };
      window.currentFilterDescription = `Depth between ${minD} and ${maxD}`;
      if(window.drawVisualization) window.drawVisualization();
      if(window.drawHighlights) window.drawHighlights();
    }
  }

  function buildRatioHistogram(dataset) {
    const margin = { top: 10, right: 20, bottom: 20, left: 50 },
      width = 250 - margin.left - margin.right,
      height = 125 - margin.top - margin.bottom;

    d3.select("#ratio-histogram").html("");

    const svg = d3
      .select("#ratio-histogram")
      .append("svg")
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const root = d3.hierarchy(dataset);
    // Get ratio from folders only
    const folderData = root.descendants()
        .filter(d => d.data.folderFileRatio !== undefined)
        .map(d => {
            return {
                ...d.data,
                // Clamp to 64 for visual grouping
                displayRatio: Math.max(1, Math.min(64, d.data.folderFileRatio))
            };
        });

    if (folderData.length === 0) return;

    const x = d3.scaleLog()
      .base(2)
      .domain([1, 64]) 
      .range([0, width]);

    // Create thresholds for 2 bins between each tick (2, 4, 8, 16, 32, 64)
    const thresholds = d3.range(0, 6.5, 0.5).map(v => Math.pow(2, v));

    const histogram = d3.bin()
      .value(d => d.displayRatio)
      .domain(x.domain())
      .thresholds(thresholds);

    const bins = histogram(folderData);

    const y = d3.scaleLinear()
      .domain([0, d3.max(bins, d => d.length)])
      .nice()
      .range([height, 0]);

    svg.selectAll("rect")
      .data(bins)
      .join("rect")
      .attr("x", d => x(d.x0))
      .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
      .attr("y", d => y(d.length))
      .attr("height", d => height - y(d.length))
      .attr("fill", d => window.folderRatioColorScale(d.x0));

    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickValues([2, 4, 8, 16, 32, 64]).tickFormat(d => d === 64 ? "64+" : d));

    svg.append("g").call(d3.axisLeft(y).ticks(5));

    const brush = d3.brushX()
      .extent([[0, 0], [width, height]])
      .on("brush end", (event) => {
        const selection = event.selection;
        if (!selection) {
          window.currentFilterFunction = null;
          window.currentFilterDescription = null;
          if(window.drawVisualization) window.drawVisualization();
          return;
        }

        const [minR, maxR] = selection.map(x.invert);
        window.currentFilterFunction = (d) => {
            const ratio = d.data ? d.data.folderFileRatio : d.folderFileRatio;
            if (ratio === undefined) return false;
            
            // If selection reaches the 64 mark, treat it as "64 or more" 
            // to ensure high-ratio outliers aren't filtered out.
            if (maxR >= 62) return ratio >= minR;
            return ratio >= minR && ratio <= maxR;
        };
        window.currentFilterDescription = `Ratio ${minR.toFixed(1)} to ${maxR >= 62 ? "64+" : maxR.toFixed(1)}`;
        if(window.drawVisualization) window.drawVisualization();
        if(window.drawHighlights) window.drawHighlights();
      });

    svg.append("g").attr("class", "brush").call(brush);
  }

  function buildPieChart(dataset) {
    const width = 242,
      height = 242,
      margin = 20;

    const radius = Math.min(width, height) / 2 - margin;

    d3.select("#file-type-pie").html("");

    // 1. Data Aggregation
    const root = d3.hierarchy(dataset);
    const typeCounts = {};
    root.leaves().forEach((leaf) => {
      // Exclude empty folders (which D3 treats as leaves) from the file type pie chart
      const isFolder = leaf.data.type === "folder" || leaf.data.type === "Folder" || leaf.data.type === "Directory";
      if (isFolder) return;

      const type = leaf.data.type || "unknown";
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    const color = window.categoricalColorScale;
    
    // 2. Generators
    const pie = d3
      .pie()
      .value((d) => d[1])
      .sort(null); // Keeps order consistent

    const arc = d3
      .arc()
      .innerRadius(0)
      .outerRadius(Math.min(width, height) / 2.05);

    // This specific arc is used just for positioning labels slightly outward
    const labelArc = d3
      .arc()
      .innerRadius(radius * 0.5)
      .outerRadius(radius * 1.0);
    //.style("fill", "url(#legendGradientMulti)");

    const data_ready = pie(Object.entries(typeCounts));

    const svg = d3
      .select("#file-type-pie")
      .append("svg")
      .attr("viewBox", [-width / 2, -height / 2, width, height * 1.2]);
    svg
      .append("g")
      .attr("stroke", "white")
      .selectAll()
      .data(data_ready)
      .join("path")
      .attr("fill", (d) => {
          const type = d.data[0];
          return window.topFileTypes.includes(type) ? color(type) : "#bfc3ba";
      })
      .attr("d", arc);

    // 3. Draw Slices
    svg
      .selectAll("path")
      .data(data_ready)
      .join("path")
      .attr("d", arc)
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 45)
      .attr("height", 20)
      .attr("fill", (d) => {
          const type = d.data[0];
          return window.topFileTypes.includes(type) ? color(type) : "#bfc3ba";
      })
      .attr("stroke", "white")
      .attr("cursor", "pointer")
      .on("mouseover", (event, d) => {
        updateGraphTooltip(event, `<strong>Type: .${d.data[0]}</strong><br/>Items: ${d.data[1]}`);
      })
      .on("mousemove", (event) => updateGraphTooltip(event))
      .on("mouseout", hideGraphTooltip)
      .on("click", (event, d) => {
        const selectedType = d.data[0];
        if (window.currentFilterDescription === `Type is .${selectedType}`) {
          window.currentFilterFunction = null;
          window.currentFilterDescription = null;
        } else {
          window.currentFilterFunction = (node) => node.type === selectedType;
          window.currentFilterDescription = `Type is .${selectedType}`;
        }
        if(window.drawVisualization) window.drawVisualization();
        if(window.drawHighlights) window.drawHighlights();
      });

    // 4. Add Centered Labels (Filtered by Angle)
    svg
      .selectAll("text")
      .data(data_ready)
      .join("text")
      .text((d) => d.data[0]) // The file type
      .attr("transform", (d) => `translate(${labelArc.centroid(d)})`)
      // FILTER: Only show if angle > 20 degrees (0.35 radians)
      .style("display", (d) =>
        d.endAngle - d.startAngle > 0.35 ? "block" : "none",
      );
  }

  function buildAgeGraph(dataset) {
    const margin = { top: 10, right: 40, bottom: 25, left: 50 },
      width = 220 - margin.left - margin.right,
      height = 125 - margin.top - margin.bottom;

    // Clear existing SVG content and reset dimensions
    const svgElement = d3.select("#date-graph");
    svgElement.selectAll("*").remove();

    const isRelative = document.getElementById("relativeDate")?.checked;
    const nowUnix = Date.now() / 1000;

    const svg = svgElement
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // 1. Process Data
    const root = d3.hierarchy(dataset);
    const allFiles = root.leaves()
      .filter(d => d.data.last_modified_unix)
      .map((d) => {
        const data = d.data;
        data.age = Math.max(0.001, (nowUnix - data.last_modified_unix) / 86400);
        return data;
      });

    if (allFiles.length === 0) return;

    // 2. Scales
    // Determine unit based on max age
    const maxDays = d3.max(allFiles, d => d.age) || 1;
    let unit = "days", divisor = 1;
    if (maxDays > 730) { unit = "years"; divisor = 365; }
    else if (maxDays > 60) { unit = "months"; divisor = 30.44; }
    else if (maxDays > 14) { unit = "weeks"; divisor = 7; }

    const maxUnits = maxDays / divisor;
    const maxExp = Math.ceil(Math.log2(Math.max(2, maxUnits)));
    const domainMax = Math.pow(2, maxExp);

    const x = d3.scaleLog().base(2)
      .domain([1, domainMax])
      .range([0, width]);

    // 3. Binning (Histogram)
    const maxExpThreshold = Math.ceil(Math.log2(x.domain()[1]));
    const thresholds = d3.range(0, maxExpThreshold + 0.5, 0.5).map(v => Math.pow(2, v));
    allFiles.forEach(d => d.ageUnit = d.age / divisor);

    const histogram = d3.bin()
      .value(d => d.ageUnit)
      .domain(x.domain())
      .thresholds(thresholds);

    const bins = histogram(allFiles);

    const y = d3.scaleLinear()
      .domain([0, d3.max(bins, d => d.length)])
      .nice()
      .range([height, 0]);

    // 4. Draw Bars
    svg.selectAll("rect")
      .data(bins)
      .join("rect")
      .attr("x", d => x(d.x0))
      .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
      .attr("y", d => y(d.length))
      .attr("height", d => height - y(d.length))
      .attr("fill", d => window.linearBWColorScale1(d.x0));

    // 5. Axes
    const xAxis = d3.axisBottom(x)
        .tickValues(thresholds.filter((_, i) => i % 2 === 0))
        .tickFormat(d => `${d} ${unit}`)
        .tickSizeOuter(0);

    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis);

    svg.append("g").call(d3.axisLeft(y).ticks(5));

    
    // --- ADD BRUSHING BACK ---
    const brush = d3
      .brushX()
      .extent([
        [0, 0],
        [width, height],
      ])
      .on("brush end", (event) => {
          brushed(event, x, isRelative, nowUnix);
      });

    svg.append("g")
      .attr("class", "brush")
      .call(brush)
      .on("mousemove", (event) => {
          const [mx] = d3.pointer(event);
          const val = x.invert(mx);
          const bin = bins.find(b => val >= b.x0 && val < b.x1);
          if (bin) {
              const rangeLabel = `${window.formatAge(bin.x0 * divisor)} - ${window.formatAge(bin.x1 * divisor)}`;
              updateGraphTooltip(event, `<strong>Range: ${rangeLabel}</strong><br/>Files: ${bin.length}`);
          }
      })
      .on("mouseout", hideGraphTooltip);

    function brushed(event, x, isRelative, nowUnix) {
      const selection = event.selection;
      if (!selection) {
        window.currentFilterFunction = null;
        window.currentFilterDescription = null;
        if(window.drawVisualization) window.drawVisualization();
        return;
      }
      // Convert pixel selection back to Dates
      const [minVal, maxVal] = selection.map(x.invert);
      
      // Detect if the brush is at the start of the log scale (approx zero)
      const isAtStart = minVal <= x.domain()[0] * 1.01; 
      
      window.currentFilterFunction = (d) => {
          const currentDivisor = window.currentAgeDivisor || 1;
          const ageInDays = Math.max(0.001, (nowUnix - d.last_modified_unix) / 86400);
          const ageInUnits = ageInDays / currentDivisor;

          // If at start, ignore the minimum threshold to catch everything "newer" than the baseline
          const satisfiesMin = isAtStart ? true : ageInUnits >= minVal;
          const satisfiesMax = (maxVal >= x.domain()[1]) ? true : ageInUnits <= maxVal;

          return satisfiesMin && satisfiesMax;
      };

      window.currentFilterDescription = isAtStart 
        ? `Age less than ${window.formatAge(maxVal * divisor)}`
        : `Age between ${window.formatAge(minVal * divisor)} and ${window.formatAge(maxVal * divisor)}`;

      if(window.drawVisualization) window.drawVisualization();
      if(window.drawHighlights) window.drawHighlights();
    }
}
  
  function buildSizeGraph(dataset) {
    const margin = { top: 10, right: 25, bottom: 20, left: 50 },
      width = 220 - margin.left - margin.right,
      height = 125 - margin.top - margin.bottom;

    d3.select("#size-graph").html("");

    const svg = d3
      .select("#size-graph")
      .append("svg")
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // --- DATA PROCESSING ---
    const root = d3.hierarchy(dataset);
    // Exclude folders from the size graph
    const allFiles = root.leaves()
      .filter(d => {
          const isFolder = d.data.type === "folder" || d.data.type === "Folder" || d.data.type === "Directory";
          return d.data.value > 0 && !isFolder;
      })
      .map(d => d.data);

    if (allFiles.length === 0) return;

      // --- SCALES AND THRESHOLDS ---
    const k = 1024;
    const extent = d3.extent(allFiles, d => d.value);
    
    // Calculate the power range (0=B, 1=KB, 2=MB, etc.)
    const minPower = Math.max(0, Math.floor(Math.log(extent[0]) / Math.log(k)));
    const maxPower = Math.ceil(Math.log(extent[1]) / Math.log(k));
    
    // Determine major ticks (round units) and sample to max 4
    let majorPowers = d3.range(minPower, maxPower + 1);
    if (majorPowers.length > 4) {
        const step = (majorPowers.length - 1) / 3;
        majorPowers = [0, 1, 2, 3].map(i => majorPowers[Math.round(i * step)]);
    }

    const tickValues = majorPowers.map(p => Math.pow(k, p));


    const x = d3
      .scaleLog()
      .base(k)
      .domain([Math.pow(k, minPower), Math.pow(k, maxPower)])
      .range([0, width]);

    // --- BINNING ---
    
    // Create thresholds: exactly two bins between each unit power (e.g., thresholds at k^0, k^0.5, k^1...)
    const thresholds = d3.range(minPower, maxPower + 0.25, 0.25).map(p => Math.pow(k, p));

    const histogram = d3
      .bin()
      .value(d => d.value)
      .domain(x.domain())
      .thresholds(thresholds);

    const bins = histogram(allFiles);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(bins, (d) => d.length)])
      .nice()
      .range([height, 0]);

    svg
      .selectAll("rect")
      .data(bins)
      .join("rect")
      .attr("x", d => x(d.x0))
      .attr("width", (d) => Math.max(0, x(d.x1) - x(d.x0) - 1))
      .attr("y", d => y(d.length))
      .attr("height", (d) => height - y(d.length))
      .attr("fill", d => window.exponentialColorScale(d.x0));

    // --- AXES ---
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickValues(tickValues).tickFormat(window.formatBytes));

  svg.append("g").call(d3.axisLeft(y).tickValues(y.domain()));

    // --- ADD BRUSHING ---
    const brush = d3
      .brushX()
      .extent([
        [0, 0],
        [width, height],
      ])
      .on("brush end", brushed);

    svg.append("g")
      .attr("class", "brush")
      .call(brush)
      .on("mousemove", (event) => {
          const [mx] = d3.pointer(event);
          const val = x.invert(mx);
          const bin = bins.find(b => val >= b.x0 && val < b.x1);
          if (bin) {
              const rangeLabel = `${window.formatBytes(bin.x0)} - ${window.formatBytes(bin.x1)}`;
              updateGraphTooltip(event, `<strong>Size: ${rangeLabel}</strong><br/>Files: ${bin.length}`);
          }
      })
      .on("mouseout", hideGraphTooltip);

    function brushed(event) {
      const selection = event.selection;
      if (!selection) {
        window.currentFilterFunction = null;
        window.currentFilterDescription = null;
        if(window.drawVisualization) window.drawVisualization();
        return;
      }

      // Convert pixel selection back to size values
      const [minSize, maxSize] = selection.map(x.invert);
      
      window.currentFilterFunction = (d) => {
          const isFolder = d.type === "folder" || d.type === "Folder" || d.type === "Directory" || d.type === "directory";
          return !isFolder && d.value !== undefined && d.value >= minSize && d.value <= maxSize;
      };
      window.currentFilterDescription = `Size between ${window.formatBytes(minSize)} and ${window.formatBytes(maxSize)}`;
      if(window.drawVisualization) window.drawVisualization();
      if(window.drawHighlights) window.drawHighlights();
    }
  }
