// Based on the D3 collapsible tree example
function createFolderTree(data, containerSelector) {
  const width = 200,
    minHeight = 800;
  const barHeight = 20;

  const margin = {
    top: 100,
    bottom: 10,
    left: 0,
    right: 10,
  };
  const sortBySelect = document.getElementById("sortBy");

  let i = 0, duration = 200;
    const root = d3
        .hierarchy(data)
        .eachBefore((i => d => d.index = i++)(0))
        .sum(d => d.value)
        .sort((a, b) => sortItOut(a, b));

    // collapse all nodes recusively, hence initiate the tree
  function collapse(d) {
    if (d.children) {
        d.numOfChildren = d.children.length;
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = null;
    }
    else {
        d.numOfChildren = 0;
    }
  }
  
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
        return d3.ascending(a.data.type, b.data.type);
      } else if (sortMode === "reverseSize") {
        return a.value - b.value;
      } else if (sortMode === "date") {
        return b.data.last_modified_unix - a.data.last_modified_unix;
      } else if (sortMode === "name") {
        return d3.ascending(a.data.name, b.data.name);
      }
    }
    }
    
  const container = d3.select(containerSelector);
  container.html(""); // Clear previous content

  const svg = container
    .append("svg")
    .attr("width", width)
    .attr(
      "style",
      "max-width: 100%; height: auto; font: 12px sans-serif; text-align:left; overflow: visible;",
    );

  const gNode = svg.append("g")
      .attr("cursor", "pointer")
      .attr("pointer-events", "all");

   const gLink = svg.append("g")
      .attr("fill", "none")
      .attr("stroke", "#555")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", 1.5);

  root.x0 = 0;
  root.y0 = 0;
  // if (root.children) {
  //   root.children.forEach(collapse);
  // }
  update(root);

  // Toggle children on click.
    function click(event, d) {
    highlightNodeInTree(d);
    if (d.children) {
        d._children = d.children;
        d.children = null;
    } else if (d._children) {
        d.children = d._children;
        d._children = null;
    }
    update(d);
}

  function update(source) {
    const duration = 250;
    const nodes = root.descendants();
    const links = root.links();

    const height = Math.max(minHeight, nodes.length * barHeight + margin.top + margin.bottom ) + (barHeight * 3 /2);

    const transition = svg.transition()
        .duration(duration)
        .attr("height", height)
        .attr("viewBox", [-barHeight / 2, -barHeight * 3 / 2, width, height])
        .tween("resize", window.ResizeObserver ? null : () => () => svg.dispatch("toggle"));

  const node = gNode.selectAll("g")
          .data(nodes, d => d.id || (d.id = ++i));
        
    let index = 0
    //update index
   function updateXY(node){
     if(!node) return;
     node.index = index++;
    if(node.children){
        for(let i=0;i<node.children.length;i++){
           updateXY(node.children[i])
        }
     }
      } 
      
    updateXY(root,0)
    nodes.forEach(function(n, i) {
          n.x = n.index * barHeight;
          n.y = n.depth * 20;
    });


    const nodeEnter = node
      .enter()
      .append("g")
      .attr("transform", (d) => `translate(${source.y0},${source.x0})`)
      .attr("fill-opacity", 0)
      .attr("stroke-opacity", 0)
        .on("click", (event, d) => {
            click(event, d)
        });
      nodeEnter.append("circle")
        .attr("r", 2.5)
        .attr("fill", "#FFF")
        .attr("stroke", d => d._children || d.children ? '#9315e5' :"#999")
        .attr("stroke-width",1)

    nodeEnter.append("text")
        .attr("dy", "0.32em")
        .attr("x", 15)
        .text(d => d.data.name)
        .attr("stroke-linejoin", "round")
        .attr("stroke", "white")
        .attr("paint-order", "stroke");

      // Transition nodes to their new position.
    const nodeUpdate = node.merge(nodeEnter).transition(transition)
        .attr("transform", d => `translate(${d.y},${d.x})`)
        .attr("fill-opacity", 1)
        .attr("stroke-opacity", 1);

    // Transition exiting nodes to the parent's new position.
    const nodeExit = node.exit().transition(transition).remove()
        .attr("transform", d => `translate(${source.y},${source.x})`)
        .attr("fill-opacity", 0)
        .attr("stroke-opacity", 0);

    // Update the links…
    const link = gLink.selectAll("path")
      .attr("fill", "none")
      .attr("stroke", "#999")
      .attr("stroke-width", 1)
      .data(links, d => d.target.id || (d.target.id = ++i));

    const linkExit = link
      .exit()
      .transition(transition)
      .remove()
      .attr("transform", (d) => `translate(${source.y},${source.x})`)
      .attr("fill-opacity", 0)
      .attr("stroke-opacity", 0);

    nodeEnter
      .append("text")
      .attr("dy", "0.32em")
      .attr("x", -10)
      .text((d) => (d.data.type === "folder" ? "📁" : "📄"))
      .attr("stroke-linejoin", "round")
      .attr("stroke", "white")
      .attr("paint-order", "stroke");

    // Enter any new links at the parent's previous position.
    const linkEnter = link.enter()
      .append("path")
      .attr("fill-opacity", 0)
      .attr("stroke-opacity", 0)
      .attr("d", d => {
        return `
        M${d.source.y0},${d.source.x0}
        V${d.target.x0 || d.target.x}
        h${barHeight}
      `});
     
 
      // Stash the old positions for transition.
  root.each(function(d) {
    d.x0 = d.x;
    d.y0 = d.y;
  });

    }
    if (typeof window.selectedNode === 'function') {
        window.selectedNode(selectedNode);
      }

  // This function will be called from NirclesScript.js
  window.highlightNodeInTree = (node) => {
    // First, reset any currently selected node
    gNode.selectAll("text").attr("font-weight", "normal").attr("fill", "black");

    // Find the node in the tree that corresponds to the path
      const targetNode = node;
      const targetPath = targetNode.ancestors().reverse(); // Get ancestors from root to the target node
      const nodePath = targetNode.data.path;
      const nodeName = targetNode.data.name;
    
      if (targetPath) {
          gNode.selectAll("g")
              .filter(d => d.data.path === nodePath && d.data.name === nodeName)
              .select("text")
              .attr("font-weight", "bold")
              .attr("fill", "#ce59f7");
          //targetNode.ancestors().reverse().forEach(ancestor => {
          //    gNode.selectAll("g")
          //        .filter(d => d === ancestor)
          //        .select("text")
          //        .attr("font-weight", "bold")
          //        .attr("fill", "#ce59f7");
          //});
          }
    update(node);
  };
}
