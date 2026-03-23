// Based on the D3 collapsible tree example
function InteractionGraphs(data) {
  // Now you can build your charts using 'data'
  //buildAgeHistogram(data);
  buildDepthHistogram(data);
  buildAgeGraph(data);
  buildPieChart(data);
  buildSizeGraph(data);
  //buildDepthGraph(data);
}
  function buildDepthHistogram(dataset) {
    const margin = { top: 10, right: 25, bottom: 20, left: 25 },
      width = 250 - margin.left - margin.right,
      height = 125 - margin.top - margin.bottom;

    const svg = d3
      .select("#depth-histogram")
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
      data.dateObject = new Date(data.last_modified_unix * 1000);
      return data;
    });

    // --- SCALES ---
    // Using scaleTime for human-readable axes
    const x = d3
      .scaleTime()
      .domain(d3.extent(allFiles, (d) => d.dateObject))
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
      .value((d) => d.depth)
      .domain(x.domain())
      .thresholds(x.ticks(8));

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
      .attr("fill", "#4682b4");

    // --- AXES ---
    
    svg.append("g").call(d3.axisLeft(y));

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
        window.processAndRenderVisualization(allFiles);
        return;
      }

      // Convert pixel selection back to Dates
      const [minDate, maxDate] = selection.map(x.invert);

      const filteredData = allFiles.filter(
        (d) => d.dateObject >= minDate && d.dateObject <= maxDate,
      );

      window.processAndRenderVisualization(filteredData);
    }
  }

function _buildDepthHistogram(dataset) {
    const margin = { top: 10, right: 25, bottom: 20, left: 25 },
      width = 250 - margin.left - margin.right,
      height = 125 - margin.top - margin.bottom;

    const svg = d3
      .select("#depth-histogram")
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
      data.dateObject = new Date(data.last_modified_unix * 1000);
      return data;
    });

    // --- SCALES ---
    // Using scaleTime for human-readable axes
    const x = d3
      .scaleTime()
      .domain(d3.extent(allFiles, (d) => d.dateObject))
      .nice()
      .range([0, width]);

    const y = d3.scaleLinear().range([height, 0]);

    // --- BINNING ---
    const histogram = d3
      .bin()
      .value((d) => d.dateObject)
      .domain(x.domain())
      .thresholds(x.ticks(10));

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
      .attr("fill", "#4682b4");

    // --- AXES ---
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks().tickSizeOuter(0));

    //.call(d3.axisBottom(x)); // D3 automatically formats dates here

    svg.append("g").call(d3.axisLeft(y));

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
        window.processAndRenderVisualization(allFiles);
        return;
      }

      // Convert pixel selection back to Dates
      const [minDate, maxDate] = selection.map(x.invert);

      const filteredData = allFiles.filter(
        (d) => d.dateObject >= minDate && d.dateObject <= maxDate,
      );

      window.processAndRenderVisualization(filteredData);
    }
  }

  function buildPieChart(dataset) {
    const width = 200,
      height = 200,
      margin = 20;

    const radius = Math.min(width, height) / 2 - margin;

    // 1. Data Aggregation
    const root = d3.hierarchy(dataset);
    const typeCounts = {};
    root.leaves().forEach((leaf) => {
      const type = leaf.data.type || "unknown";
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    const color = d3
      .scaleOrdinal()
      .domain(Object.keys(typeCounts))
      .range(d3.schemeCategory10);
    // 2. Generators
    const pie = d3
      .pie()
      .value((d) => d[1])
      .sort(null); // Keeps order consistent

    const arc = d3
      .arc()
      .innerRadius(10)
      .outerRadius(Math.min(width, height) / 2.5 - 1);

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
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width / 2, -height / 2, width, height*1.2]);
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
      .style("stroke-width", "1px");

    // 4. Add Centered Labels (Filtered by Angle)
    svg
      .selectAll("text")
      .data(data_ready)
      .join("text")
      .text((d) => d.data[0]) // The file type
      .attr("transform", (d) => `translate(${labelArc.centroid(d)})`)
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      // FILTER: Only show if angle > 20 degrees (0.35 radians)
      .style("display", (d) =>
        d.endAngle - d.startAngle > 0.35 ? "block" : "none",
      )
      .style("pointer-events", "none"); // Ensure text doesn't block mouse interactions
  }

  function buildAgeGraph(dataset) {
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

    // 1. Process Data: Count files at each date
    const root = d3.hierarchy(dataset);
      const allFiles = root.leaves().map((d) => {
      const data = d.data;
      // Convert Unix (seconds) to JS Date (milliseconds)
      data.dateObject = new Date(data.last_modified_unix * 1000);
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

    // 3. Line Generator
    const line = d3
      .line()
      .x((d) => x(d.date))
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
      .attr("cx", (d) => x(d.date))
      .attr("cy", (d) => y(d.count))
      .attr("r", 5)
      .attr("fill", "#ff6347");

    // 6. Axes
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(2).tickFormat(d3.timeFormat("%d %m/%y")));

    svg.append("g").call(d3.axisLeft(y).ticks(4));
  }
  function buildDepthGraph(dataset) {
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
      data.dateObject = new Date(data.last_modified_unix * 1000);
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
      .call(d3.axisBottom(x).ticks(plotData.length));

    svg.append("g").call(d3.axisLeft(y).ticks(5));
  }
  function buildSizeGraph(dataset) {
    const margin = { top: 10, right: 25, bottom: 20, left: 25 },
      width = 220 - margin.left - margin.right,
      height = 125 - margin.top - margin.bottom;

    const svg = d3
      .select("#size-graph")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // --- DATA PROCESSING ---
    const root = d3.hierarchy(dataset);
    const allFiles = root.leaves().map((d) => {
      const data = d.data;
      return data;
    });

    // --- SCALES ---
    // Use scaleLinear for file sizes (numeric)
    const x = d3
      .scaleLinear()
      .domain(d3.extent(allFiles, (d) => d.size))
      .nice()
      .range([0, width]);

    // --- BINNING ---
    const histogram = d3
      .bin()
      .value((d) => d.size)
      .domain(x.domain())
      .thresholds(x.ticks(10));

    const bins = histogram(allFiles);

    // Prepare plotData: each bin as {size: bin center, count: bin length}
    // Prepare plotData: each bin as {size: bin lower bound (x0), count: bin length}
    const plotData = bins.map(bin => ({
      size: bin.x0,
      count: bin.length
    }));
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(plotData, (d) => d.count)])
      .nice()
      .range([height, 0]);

    // 3. Line Generator
    const line = d3
      .line()
      .x((d) => x(d.size))
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
      .attr("cx", (d) => x(d.size))
      .attr("cy", (d) => y(d.count))
      .attr("r", 5)
      .attr("fill", "#ff6347");

    // 6. Axes
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(6));

  svg.append("g").call(d3.axisLeft(y).ticks(5));
  }
