const svgWidth = 825;
const svgHeight = 660;
const margin = { top: 20, right: 40, bottom: 100, left: 100 };
const width = svgWidth - margin.left - margin.right;
const height = svgHeight - margin.top - margin.bottom;

let svg = d3.select("#scatter").append("svg").attr("width", svgWidth).attr("height", svgHeight);
let chrtgrp = svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`);

let xaxislbl = [
  { 'x': 0, 'y': 20, 'value': 'age', 'active': true, 'inactive': false, 'text': "Age (Median)"},
  { 'x': 0, 'y': 40, 'value': 'poverty', 'active': false, 'inactive': true, 'text': "In Poverty (%)"},
  { 'x': 0, 'y': 60, 'value': 'income', 'active': false, 'inactive': true, 'text': "Household Income (Median)"}
];
let yaxislbl = [
  { 'y': -margin.left * 4 / 5, 'x': -height / 2, 'value': 'obesity', 'active': true, 'inactive': false, 'text': "Obese (%)"},
  { 'y': -margin.left * 3 / 5, 'x': -height / 2, 'value': 'smokes',  'active': false, 'inactive': true, 'text': "Smokes (%)"},
  { 'y': -margin.left * 2 / 5, 'x': -height / 2, 'value': 'healthcare', 'active': false, 'inactive': true, 'text': "Lacks Healthcare (%)"}
];
let xvar = xaxislbl.map(d => d.value);
let yvar = yaxislbl.map(d => d.value);
let xaxis = xvar[0];
let yaxis = yvar[0];

let getlin = (data, slctaxis) => {
  let rangearr = [0, width];
  if (slctaxis == yaxis) rangearr = [height, 0];
  let max = d3.max(data, d => d[slctaxis]);
  let min = d3.min(data, d => d[slctaxis]);
  let padd = (max - min) * 0.1;
  let lin = d3.scaleLinear()
    .domain([min - padd, max + padd])
    .range(rangearr);
  return lin;
}
let makeaxis = (newscale, newaxis, XorY) => {
  let axis = d3.axisBottom(newscale);
  if (XorY == 'y') axis = d3.axisLeft(newscale);
  newaxis.transition()
    .duration(750)
    .call(axis);
  return newaxis;
}
let makecircles = (crclgrp, newscale, slctaxis) => {
  let attstr = "cx";
  if (slctaxis == yaxis) attstr = "cy";
  crclgrp.transition()
    .duration(750)
    .attr(attstr, d => newscale(d[slctaxis]));
  return crclgrp;
}
let updTT = crclgrp => {
  let pctstr = "";
  if (xaxis == "poverty") pctstr = "%";
  let tooltip = d3.tip()
    .attr("class", "d3-tip")
    .offset([30,-25])
    .html(d => `${d.state}<br>${xaxis}: ${d[xaxis] + pctstr}<br>${yaxis}: ${d[yaxis]}%`);
  crclgrp.call(tooltip);
  crclgrp
    .on("mouseover", data => tooltip.show(data))
    .on("mouseout", data => tooltip.hide(data));
  return crclgrp;
}
let makeabbr = (abbrgrp, newscale, slctaxis) => {
  let axis = 'x';
  if (slctaxis == yaxis) axis = 'y';
  abbrgrp.transition()
    .duration(750)
    .attr(axis, d => newscale(d[slctaxis]));
  return abbrgrp;
}
let setlbl = (lblgrp, d, labels) => {
  let lbl = lblgrp.append("text")
    .attr("x", d.x)
    .attr("y", d.y)
    .attr("value", d.value)
    .classed("active", d.active)
    .classed("inactive", d.inactive)
    .text(d.text);
  labels.push(lbl);
}
let handleOnClickLabel = (trgt, data, XorY, labels, axis, crclgrp, abbrgrp) => {
  let slctaxis = d3.select(trgt).attr("value");
  let values;
  let prev;
  if (XorY == 'x') {values = xvar; prev = xaxis;}
  else {values = yvar; prev = yaxis;}
  if (slctaxis !== prev) {
    try {
      let i = values.indexOf(prev);
      labels[i].classed("active", false).classed("inactive", true);
      if (XorY == 'x') {xaxis = slctaxis;
      }
      else {yaxis = slctaxis;
      }
      lin = getlin(data, slctaxis);
      axis = makeaxis(lin, axis, XorY);
      crclgrp = makecircles(crclgrp, lin, slctaxis);
      crclgrp = updTT(crclgrp);
      abbrgrp = makeabbr(abbrgrp, lin, slctaxis);
      i = values.indexOf(slctaxis);
      labels[i].classed("active", true).classed("inactive", false);
    }
    catch (error) {return;}
  }
}
d3.csv("assets/data/data.csv").then((data, err) => {
  if (err) throw err;
  data.forEach(d => {
    d.poverty = +d.poverty;
    d.age = +d.age;
    d.income = +d.income
    d.obesity = +d.obesity
    d.smokes = +d.smokes;
    d.healthcare = +d.healthcare
  });
  let xlin = getlin(data, xaxis);
  let ylin = getlin(data, yaxis);
  let xAxis = chrtgrp.append("g")
    .classed("x-axis", true)
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(xlin));
  let yAxis = chrtgrp.append("g")
    .classed("y-axis", true)
    .call(d3.axisLeft(ylin));
  let xlblgrp = chrtgrp.append("g")
    .attr("transform", `translate(${width / 2}, ${height + 20})`);
  let ylblgrp = chrtgrp.append("g")
    .attr("transform", "rotate(-90)")
  let xlabels = [];
  let ylabels = [];
  xaxislbl.forEach(d => setlbl(xlblgrp, d, xlabels));
  yaxislbl.forEach(d => setlbl(ylblgrp, d, ylabels));
  let crclgrp = chrtgrp.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("r", 20)
    .attr("cx", d => xlin(d[xaxis]))
    .attr("cy", d => ylin(d[yaxis]))
    .attr("fill", "lightblue")
    .attr("opacity", ".75");
  crclgrp = updTT(crclgrp);
  let abbrgrp = chrtgrp.selectAll("text.stateText")
    .data(data)
    .enter()
    .append("text")
    .classed("stateText", true)
    .text(d => d.abbr)
    .attr("x", d => xlin(d[xaxis]))
    .attr("y", d => ylin(d[yaxis]))
    .attr("dy", 5);
  xlblgrp.selectAll("text")
    .on("click", () => {
      handleOnClickLabel(d3.event.target, data, 'x', xlabels, xAxis, crclgrp, abbrgrp);
    });
  ylblgrp.selectAll("text")
    .on("click", () => {
      handleOnClickLabel(d3.event.target, data, 'y', ylabels, yAxis, crclgrp, abbrgrp);
    });
}).catch(error => {console.log(error);
});