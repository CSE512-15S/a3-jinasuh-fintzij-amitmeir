viz.caseChart = function (containerId) {

    var chart = {},
	 	data = {};

    /*
    ** PUBLIC
    */

    chart.data = function (_) {
        if (!arguments.length) return data;
        data = _;
        return chart;
    };

    containerId = "#" + containerId;
    var margin = { top: 20, right: 20, bottom: 60, left: 50 };

    var width = $(containerId).width() - margin.left - margin.right;
    var height = $(containerId).height() - margin.top - margin.bottom;

    var parseDate = d3.time.format("%x").parse;
    var bisectDate = d3.bisector(function (d) {
        return d;
    }).left;

    var x = d3.time.scale()
        .range([0, width]);

    var y = d3.scale.linear()
        .range([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .ticks(5)
        .tickFormat(d3.time.format("%B %y"))
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

    var line = d3.svg.line()
        .x(function (d) {
            return x(d.date);
        })
        .y(function (d) {
            return y(d.count);
        });

    var svg = d3.select(containerId).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var xsvg = svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")");

    var ysvg = svg.append("g")
            .attr("class", "y axis");

    var ytext = ysvg
          .append("text");

    var overlay = svg.append("rect")
      .attr("class", "overlay")
      .attr("width", width)
      .attr("height", height)
      .on("mouseover", function () { svg.selectAll(".focus").style("display", null); })
      .on("mouseout", function () { svg.selectAll(".focus").style("display", "none"); })
      .on("mousemove", mousemove);

    var districts = [];

    function mousemove() {
        if (districts && districts.length > 0) {
            var x0 = x.invert(d3.mouse(this)[0]);
            i = bisectDate(data.dateIndices, x0, 1),
            d0 = data.dateIndices[i - 1],
            d1 = data.dateIndices[i],
            di = x0 - d0.date > d1.date - x0 ? i : i - 1;

            svg.selectAll(".focus")
                .data(districts, function (d) { return d.name; })
                .attr("transform", function (d) { return "translate(" + x(d.values[di].date) + "," + y(d.values[di].count) + ")"; })
                .select("text").text(function (d) { return d.values[di].count; });
        }
    }

    chart.update = function () {
        if (!data) {
            return;
        }

        districts = data.selectedDistricts().map(function (name) {
            console.log("selected: " + name);
            return {
                name: name,
                values: data.districtData.get(name).map(function (datum) {
                    return { date: datum.date, count: +data.getCount(datum) };
                }),
                confirmed: data.showConfirmed()
            };
        });

        x.domain(data.dateExtent);

        y.domain([
          d3.min(districts, function (d) { return d3.min(d.values, function (d) { return d.count; }); }),
          d3.max(districts, function (d) { return d3.max(d.values, function (d) { return d.count; }); })
        ]);

        // Draw x-axis
        xAxis.scale(x);
        xsvg.call(xAxis);

        // Draw y-axis
        yAxis.scale(y);
        ysvg.call(yAxis);

        ytext.attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("New Case Count");

        // DATA JOIN
        // Join new data with old elements, if any.
        var district = svg.selectAll(".district")
            .data(districts, function (d) {
                return d.name + d.confirmed;
            });

        // UPDATE
        // Update old elements as needed.

        // ENTER
        // Create new elements as needed.
        var newElements = district.enter().append("g")
            .attr("class", function (d) {
                return "district " + d.name;
            })

        var path = newElements.append("path")
        .attr("class", "line")
        .attr("d", function (d) { return line(d.values); })
        .style("stroke", function (d) { return data.getColor(d.name); });

        var focusGroup = newElements.append("g")
            .attr("class", "focus")
            .style("display", "none");

        focusGroup.append("circle")
            .attr("r", 3)
            .style("fill", function (d) { return data.getColor(d.name); });

        focusGroup.append("text")
            .attr("x", 9)
            .attr("dy", ".35em");

        var selectedCircle = newElements.append("circle")
            .attr("class", "selected")
            .attr("r", 5)
            .attr("transform", function (d) { return "translate(" + x(d.values[data.selectedParams.weekID].date) + "," + y(d.values[data.selectedParams.weekID].count) + ")"; })
            .style("fill", function (d) { return data.getColor(d.name); })
            .style("stroke", "black")
            .style("stroke-width", "2px");

        // ENTER + UPDATE
        // Appending to the enter selection expands the update selection to include
        // entering elements; so, operations on the update selection after appending to
        // the enter selection will apply to both entering and updating nodes.
        district.selectAll(".line")
            .attr("d", function (d) { return line(d.values); })
            .style("stroke", function (d) { return data.getColor(d.name); });

        // EXIT
        // Remove old elements as needed.
        district.exit().remove();

        return chart;
    };

    chart.updateSelectedWeek = function () {
        if (!data) {
            return;
        }

        var selectedCircle = svg.selectAll(".selected")
            .attr("transform", function (d) { return "translate(" + x(d.values[data.selectedParams.weekID].date) + "," + y(d.values[data.selectedParams.weekID].count) + ")"; });

        return chart;
    };

    chart.updateHoveredDistrict = function () {
        if (!data) {
            return;
        }

        var hoveredDistrict = svg.selectAll(".line")
            .classed("hovered", function (d) {
                return d.name == data.hoveredDistrict();
            });
    }

    // return the object
    return chart;
};