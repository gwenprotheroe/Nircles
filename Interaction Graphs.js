// Based on the D3 collapsible tree example
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
    const allFiles = root.leaves().map((d) => {
      const data = d.data;
      data.depthObject = d.depth;
      return data;
    });

    // --- SCALES ---
    const x = d3
      .scaleLinear()
      .domain(d3.extent(allFiles, (d) => d.depthObject))
      .nice()
      .range([0, width]);
    const depthCounts = {};

    root.leaves().forEach((leaf) => {
      const d = leaf.depth;
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

    const bins = histogram(allFiles);
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
      .call(d3.axisBottom(x).tickValues(x.domain()));

    svg.append("g").call(d3.axisLeft(y).tickValues(y.domain()));

    // --- ADD BRUSHING BACK ---
    const brush = d3
      .brushX()
      .extent([
        [0, 0],
        [width, height],
      ])
      .on("brush end", brushed);

    svg.append("g").attr("class", "brush").call(brush);

    function brushed(event) {
      const selection = event.selection;
      if (!selection) {
        window.currentFilterFunction = null;
        if(window.drawVisualization) window.drawVisualization();
        return;
      }

      // Convert pixel selection back to Dates
      const [minDate, maxDate] = selection.map(x.invert);
      
      window.currentFilterFunction = (d) => {
          return d.depthObject !== undefined && d.depthObject >= minDate && d.depthObject <= maxDate;
      };
      window.currentFilterDescription = `Depth between ${Math.round(minDate)} and ${Math.round(maxDate)}`;
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
        .filter(d => d.children && d.data.folderFileRatio !== undefined)
        .map(d => d.data);

    if (folderData.length === 0) return;

    const x = d3.scaleLinear()
      //.domain([0, 20]) // Focus on the 0-20 range as requested
      .domain(d3.extent(folderData, d => d.folderFileRatio))
      .nice()
      .range([0, width]);

    const histogram = d3.bin()
      .value(d => d.folderFileRatio)
      .domain(x.domain())
      .thresholds(x.ticks(12));

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
      .call(d3.axisBottom(x).ticks(5));

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
            // Allow files to be visible if their parent is a folder within the ratio range
            // or if we are filtering the folders themselves.
            const ratio = d.folderFileRatio;
            return ratio !== undefined && ratio >= minR && ratio <= maxR;
        };
        window.currentFilterDescription = `Ratio between ${minR.toFixed(1)} and ${maxR.toFixed(1)}`;
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
    const margin = { top: 10, right: 40, bottom: 20, left: 50 },
      width = 220 - margin.left - margin.right,
      height = 125 - margin.top - margin.bottom;

    d3.select("#date-graph").html("");

    const svg = d3
      .select("#date-graph")
      .append("svg")
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // 1. Process Data: Count files at each date
    const root = d3.hierarchy(dataset);
      const allFiles = root.leaves().map((d) => {
      const data = d.data;
      // Convert Unix (seconds) to JS Date (milliseconds)
      data.dateObject = new Date(Math.floor(data.last_modified_unix) * 1000);
      return data;
    }); 
    const dateCounts = {};
    root.leaves().forEach((leaf) => {
      const d = leaf.data.dateObject;
      dateCounts[d] = (dateCounts[d] || 0) + 1;
    });

    // Convert object to sorted array: [{date: 0, count: 5}, ...]
    const plotData = Object.keys(dateCounts)
      .map((d) => ({ date: new Date(d), count: dateCounts[d] }))
      .sort((a, b) => a.date - b.date);

    // 2. Scales
    const x = d3
      .scaleTime()
      .domain(d3.extent(plotData, (d) => d.date))
      .range([0, width]);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(plotData, (d) => d.count)])
      .nice()
      .range([height, 0]);

    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickValues(x.domain()).tickFormat(d3.timeFormat("%d.%m.%Y")))
      .exit().remove(); 

    svg.append("g").call(d3.axisLeft(y).tickValues(y.domain()))
    .exit().remove(); 

    //  Add Dots (to make data points clickable/visible)
    svg
      .selectAll(".dot")
      .data(plotData)
      .enter()
      .append("circle")
      .attr("cx", (d) => x(d.date))
      .attr("cy", (d) => y(d.count))
      .attr("r", 5)
      .attr("fill", (d) => window.linearBWColorScale1(d.date.getTime() / 1000))
      .exit().remove(); 

    
    // --- ADD BRUSHING BACK ---
    const brush = d3
      .brushX()
      .extent([
        [0, 0],
        [width, height],
      ])
      .on("brush end", brushed);

    svg.append("g").attr("class", "brush").call(brush)
    .exit().remove(); 


    function brushed(event) {
      const selection = event.selection;
      if (!selection) {
        window.currentFilterFunction = null;
        window.currentFilterDescription = null;
        if(window.drawVisualization) window.drawVisualization();
        return;
      }
      // Convert pixel selection back to Dates
      const [minDate, maxDate] = selection.map(x.invert);
      
      window.currentFilterFunction = (d) => {
          return d.dateObject !== undefined && d.dateObject >= minDate && d.dateObject <= maxDate;
      };
      window.currentFilterDescription = `Date between ${minDate.toLocaleDateString()} and ${maxDate.toLocaleDateString()}`;
      if(window.drawVisualization) window.drawVisualization();
    }

  }
  function buildRatioDepthGraph(dataset) {
    const margin = { top: 10, right: 25, bottom: 20, left: 25 },
      width = 220 - margin.left - margin.right,
      height = 125 - margin.top - margin.bottom;

    const svg = d3
      .select("#date-graph")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // --- DATA PROCESSING ---
    const root = d3.hierarchy(dataset);
    const allFiles = root.leaves().map((d) => {
      const data = d.data;
      // Convert Unix (seconds) to JS Date (milliseconds)
      data.depthObject = new Date(data.last_modified_unix * 1000);
      return data;
    });

    // --- SCALES ---
    // Using scaleTime for human-readable axes
    const x = d3
      .scaleLinear()
      .domain(d3.extent(allFiles, (d) => d.depth))
      .nice()
      .range([0, width]);

    // Prepare plotData: count files at each depth
    const depthCounts = {};
    allFiles.forEach((file) => {
      const d = file.depth;
      depthCounts[d] = (depthCounts[d] || 0) + 1;
    });
    const plotData = Object.keys(depthCounts)
      .map((d) => ({ depth: +d, count: depthCounts[d] }))
      .sort((a, b) => a.depth - b.depth);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(plotData, (d) => d.count)])
      .nice()
      .range([height, 0]);

    // 3. Line Generator
    const line = d3
      .line()
      .x((d) => x(d.depth))
      .y((d) => y(d.count))
      .curve(d3.curveMonotoneX); // Makes the line smooth

    // 4. Draw Path
    svg
      .append("path")
      .datum(plotData)
      .attr("fill", "none")
      .attr("stroke", "#ff6347")
      .attr("stroke-width", 3)
      .attr("d", line);

    // 5. Add Dots (to make data points clickable/visible)
    svg
      .selectAll(".dot")
      .data(plotData)
      .enter()
      .append("circle")
      .attr("cx", (d) => x(d.depth))
      .attr("cy", (d) => y(d.count))
      .attr("r", 5)
      .attr("fill", "#ff6347");

    // 6. Axes
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickValues(x.domain()));

    svg.append("g").call(d3.axisLeft(y).tickValues(y.domain()));
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

    // --- SCALES ---
    // Use scaleLinear for file sizes (numeric)
    const x = d3
      .scaleLog()
      .domain(d3.extent(allFiles, (d) => d.value))
      .nice()
      .range([0, width]);

    // --- BINNING ---
    const histogram = d3
      .bin()
      .value((d) => d.value)
      .domain(x.domain())
      .thresholds(x.ticks(9));

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
      .call(d3.axisBottom(x).ticks(4).tickValues(x.domain()).tickFormat(window.formatBytes));

  svg.append("g").call(d3.axisLeft(y).tickValues(y.domain()));

    // --- ADD BRUSHING ---
    const brush = d3
      .brushX()
      .extent([
        [0, 0],
        [width, height],
      ])
      .on("brush end", brushed);

    svg.append("g").attr("class", "brush").call(brush);

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
