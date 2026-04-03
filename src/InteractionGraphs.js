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

export function InteractionGraphs(data) {
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
                // Clamp for visual grouping in histogram only
                displayRatio: Math.min(50, d.data.folderFileRatio)
            };
        });

    if (folderData.length === 0) return;

    const x = d3.scaleLinear()
      .domain([0, 50])
      .nice()
      .range([0, width]);

    const histogram = d3.bin()
      .value(d => d.displayRatio)
      .domain([0, 50])
      .thresholds(d3.range(0, 52, 2)); // Exactly 20 bins (5 units each)

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
      .call(d3.axisBottom(x).ticks(5).tickFormat(d => d === 50 ? "50+" : d));

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
            const ratio = d.folderFileRatio;
            if (ratio === undefined) return false;
            
            // If selection reaches the 50 mark, treat it as "50 or more" 
            // to ensure high-ratio outliers aren't filtered out.
            if (maxR >= 48) return ratio >= minR;
            return ratio >= minR && ratio <= maxR;
        };
        window.currentFilterDescription = `Ratio ${minR.toFixed(0)} to ${maxR >= 48 ? "50+" : maxR.toFixed(0)}`;
        if(window.drawVisualization) window.drawVisualization();
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
      .attr("fill", (d) => color(d[0]))
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
      .attr("fill", (d) => color(d.data[0]))
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
        // Age in days. Minimum 0.001 to support log scale.
        data.age = Math.max(0.001, (nowUnix - data.last_modified_unix) / 86400);
        data.dateObject = new Date(data.last_modified_unix * 1000);
        return data;
      });

    if (allFiles.length === 0) return;

    // 2. Scales
    let x;
    if (isRelative) {
      x = d3.scaleLog()
        .domain(d3.extent(allFiles, d => d.age))
        .range([0, width]);
    } else {
      x = d3.scaleTime()
        .domain(d3.extent(allFiles, d => d.dateObject))
        .range([0, width]);
    }

    // 3. Binning (Histogram)
    const histogram = d3.bin()
      .value(d => isRelative ? d.age : d.dateObject)
      .domain(x.domain())
      .thresholds(x.ticks(isRelative ? 10 : 20));

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
    const xAxis = isRelative 
      ? d3.axisBottom(x).ticks(5, ".0f") 
      : d3.axisBottom(x).ticks(3).tickFormat(d3.timeFormat("%d.%m.%Y"));

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
              let rangeLabel;
              if (isRelative) {
                  rangeLabel = `${bin.x0.toFixed(1)} - ${bin.x1.toFixed(1)} days ago`;
              } else {
                  const fmt = d3.timeFormat("%d.%m.%Y");
                  rangeLabel = `${fmt(bin.x0)} - ${fmt(bin.x1)}`;
              }
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
      
      window.currentFilterFunction = (d) => {
          const checkVal = isRelative 
            ? Math.max(0.001, (nowUnix - d.last_modified_unix) / 86400)
            : new Date(d.last_modified_unix * 1000);
          return checkVal >= minVal && checkVal <= maxVal;
      };
      window.currentFilterDescription = isRelative 
        ? `Age between ${minVal.toFixed(1)} and ${maxVal.toFixed(1)} days`
        : `Date between ${minVal.toLocaleDateString()} and ${maxVal.toLocaleDateString()}`;
      if(window.drawVisualization) window.drawVisualization();
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
    const allFiles = root.leaves().filter(d => d.data.value > 0).map(d => d.data);

    if (allFiles.length === 0) return;

    // --- SCALES ---
    const extent = d3.extent(allFiles, (d) => d.value);
    // Round down to the nearest power of 10 for the min, and up for the max
       const k = 1024;

    // Round down to the nearest power of 1024 for min, and up for max
    const domainMin = Math.pow(k, Math.floor(Math.log(extent[0]) / Math.log(k)));
    const domainMax = Math.pow(k, Math.ceil(Math.log(extent[1]) / Math.log(k)));

    // Generate specific "round" tick values to align with formatBytes logic
    const tickValues = [];
    for (let i = 0; i <= 8; i++) {
        const unitPower = Math.pow(k, i);
        [1, 10, 100].forEach(multiplier => {
            const val = unitPower * multiplier;
            if (val >= domainMin && val <= domainMax) tickValues.push(val);
        });
    }

    // If range is very large, take every second or third tick to prevent congestion
    const finalTicks = tickValues.length > 8 ? tickValues.filter((_, i) => i % 2 === 0) : tickValues;

    const x = d3
      .scaleLog()
      .domain([domainMin, domainMax])
      .range([0, width]);

    // --- BINNING ---
    const histogram = d3
      .bin()
      .value((d) => d.value)
      .domain(x.domain())
      .thresholds(x.ticks(12));

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
      .attr("x", (d) => x(d.x0))
      .attr("width", (d) => Math.max(0, x(d.x1) - x(d.x0) - 1))
      .attr("y", (d) => y(d.length))
      .attr("height", (d) => height - y(d.length))
      .attr("fill", (d) => window.exponentialColorScale(d.x0));

    // --- AXES ---
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickValues(finalTicks).tickFormat(window.formatBytes));

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
          return d.value !== undefined && d.value >= minSize && d.value <= maxSize;
      };
      window.currentFilterDescription = `Size between ${window.formatBytes(minSize)} and ${window.formatBytes(maxSize)}`;
      if(window.drawVisualization) window.drawVisualization();
    }
  }
