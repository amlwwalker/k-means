var flag = false;
var WIDTH = 600
var HEIGHT = 400
var clusters = [], dots = [];
var K = 4;

//set the svg up
var svg = d3.select("#kmeans svg")
  .attr('width', WIDTH)
  .attr('height', HEIGHT)
  .style('padding', '10px')
    .style('background', '#44484A')
  .style('cursor', 'pointer')
  .style('-webkit-user-select', 'none')
  .style('-khtml-user-select', 'none')
  .style('-moz-user-select', 'none')
  .style('-ms-user-select', 'none')
  .style('user-select', 'none')
  .on('click', function() {
    d3.event.preventDefault();
    step();
  });

var lineg = svg.append('g');
var dotg = svg.append('g');
var centerg = svg.append('g');
function step() {
  d3.select("#restart").attr("disabled", null);
  if (flag) {
    moveCenter();
    draw();
  } else {
    updateGroups();
    draw();
  }
  flag = !flag;
}

function init() {
  clusters = [];
  //create some cluster nodes at random points
  for (var i = 0; i < K; i++) {
    var cluster = {
      dots: [],
      color: 'hsl(' + (i * 360 / K) + ',100%,50%)',
      center: {
        x: Math.random() * WIDTH,
        y: Math.random() * HEIGHT
      },
      init: {
        center: {}
      }
    };
    //initialise the cluster position to the initial
    cluster.init.center = {
      x: cluster.center.x,
      y: cluster.center.y
    };
    clusters.push(cluster);
  }

  dots = [];
  flag = false;
  //for the data points set initially to random position
  //in reality this would come from data set
  var maxX = 0;
  var maxY = 0;
  $.getJSON('points.json', function(data) {
    $.each(data, function(i, d) {
      var dot ={
        x: d.x,
        y: d.y,
        group: undefined //set its group as unset initially (white dot)
      };
      dot.init = {
        x: dot.x,
        y: dot.y,
        group: dot.group
      };
      dots.push(dot);
      if (d.x > maxX) maxX = d.x;
      if (d.y > maxY) maxY = d.y;
    })
    console.log(maxX)
    $.each(dots, function(i, d) {
      d.x = WIDTH*d.x/maxX
      d.y = WIDTH*d.y/maxY
    })
    draw();
  })
}

function draw() {
  //for each dot, create a circle (to display)
  var circles = dotg.selectAll('circle')
    .data(dots);
  circles.enter()
    .append('circle');
  circles.exit().remove();
  circles
    .attr('cx', function(d) { return d.x; })
    .attr('cy', function(d) { return d.y; })
    .attr('fill', function(d) { return d.group ? d.group.color : 'white'; })
    .attr('r', 5);

  //check if dots have a group
  if (dots[0].group) {
    //create a line for each dot (array)
    var l = lineg.selectAll('line')
      .data(dots);
    var updateLine = function(lines) {
      //for each line...
      lines
        .attr('x1', function(d) { return d.x; })
        .attr('y1', function(d) { return d.y; })
        //attach the dot to its center
        .attr('x2', function(d) { return d.group.center.x; })
        .attr('y2', function(d) { return d.group.center.y; })
        .attr('stroke', function(d) { return d.group.color; });
    };
    updateLine(l.enter().append('line'));
    updateLine(l);
    l.exit().remove();
  } else {
    //with no groups, there should be no lines
    lineg.selectAll('line').remove();
  }

  //create a path for each cluster
  var c = centerg.selectAll('path')
    .data(clusters);
  var updateCenters = function(centers) {
    centers
      .attr('transform', function(d) { return "translate(" + d.center.x + "," + d.center.y + ")";})
      .attr('fill', function(d,i) { return d.color; })
      .attr('stroke', '#aabbcc');
  };
  c.exit().remove();
  updateCenters(c.enter()
    .append('path')
    .attr('d', d3.svg.symbol().type('circle').size(200))
    .attr('stroke', '#aabbcc'));
  //place the centers
  updateCenters(c);
}


function moveCenter() {
  //this sets the cluster's centers
  clusters.forEach(function(group, i) {
    //if there are no dots in the group, return
    if (group.dots.length == 0) return;

    // get center of gravity
    var x = 0, y = 0;
    //sum up the x and y values
    group.dots.forEach(function(dot) {
      x += dot.x;
      y += dot.y;
    });
    //find the average "center"
    group.center = {
      x: x / group.dots.length,
      y: y / group.dots.length
    };
  });
  
}

function updateGroups() {
  //reset the cluster dots array 
  clusters.forEach(function(g) { g.dots = []; });

  //find the nearest cluster for each dot
  /* for each dot, for each cluster, calculate the min distance */
  dots.forEach(function(dot) {
    // find the nearest group
    var min = Infinity;
    var group;
    //the dot finds the cluster its closest to
    clusters.forEach(function(g) {
      var d = Math.pow(g.center.x - dot.x, 2) + Math.pow(g.center.y - dot.y, 2);
      if (d < min) {
        min = d;
        group = g;
      }
    });

    // update group
    group.dots.push(dot);
    //and update dot. Now they both know the groups
    dot.group = group;
  });
}

init();