viz.caseChart = function (containerId) {

    var chart = {},
	 	data = {},
        dispatch = d3.dispatch("clickdata", "mouseoverdata", "mouseoutdata", "dragthreshold", "dragaxis");

    /*
    ** PUBLIC
    */

    chart.data = function (_) {
        if (!arguments.length) return data;
        data = _;
        return chart;
    };

    chart.dispatch = dispatch;

    containerId = "#" + containerId;
    var margin = { top: 20, right: 20, bottom: 30, left: 50 };

    var width = $(containerId).width() - margin.left - margin.right;
    var height = $(containerId).height() - margin.top - margin.bottom;

    var parseDate = d3.time.format("%x").parse;

    var x = d3.time.scale()
        .range([0, width]);

    var y = d3.scale.linear()
        .range([height, 0]);

    var color = d3.scale.category10();
    var colorQueue = d3.range(0, 10, 1).map(function (i) { return color(i); });
    var colorMap = d3.map();
    var getColor = function (districtName) {
        var districtColor = colorMap.get(districtName);
        if (!districtColor) {
            if (colorQueue.length == 0) {
                colorQueue.push.apply(colorQueue, d3.range(0, 10, 1).map(function (i) { return color(i); }));
            }

            districtColor = colorQueue.pop();
            colorMap.set(districtName, districtColor);
        }

        return districtColor;
    }

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

    var line = d3.svg.line()
        .interpolate("basis") // TODO JINA: Do we want to interpolate??
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

    chart.update = function () {
        if (!data) {
            return;
        }

        var districts = data.selectedDistricts().map(function (name) {
            console.log("selected: " + name);
            return {
                name: name,
                values: data.districtData.get(name).map(function (datum) {
                    return { date: datum.date, count: +data.getCount(datum) };
                })
            };
        });

        // Return color for unselected districts
        colorMap.forEach(function (key, value) {
            if (data.selectedDistricts().indexOf(key) < 0) {
                colorMap.remove(key);
                colorQueue.unshift(value);
            }
        })


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
            .text("Temperature (ºF)");

        // DATA JOIN
        // Join new data with old elements, if any.
        var district = svg.selectAll(".district")
            .data(districts, function (d) { return d.name; });

        // UPDATE
        // Update old elements as needed.

        // ENTER
        // Create new elements as needed.
        district.enter().append("g")
            .attr("class", function (d) {
                return "district " + d.name;
            })
            .append("path")
            .attr("class", "line")
            .attr("d", function (d) { return line(d.values); })
            .style("stroke", function (d) { return getColor(d.name); })
            .append("text")
            .datum(function (d) { return { name: d.name, value: d.values[d.values.length - 1] }; })
            .attr("transform", function (d) { return "translate(" + x(d.value.date) + "," + y(d.value.count) + ")"; })
            .attr("x", 3)
            .attr("dy", ".35em")
            .text(function (d) { return d.name; });

        // ENTER + UPDATE
        // Appending to the enter selection expands the update selection to include
        // entering elements; so, operations on the update selection after appending to
        // the enter selection will apply to both entering and updating nodes.
        district.selectAll(".line")
            .attr("d", function (d) { return line(d.values); })
            .style("stroke", function (d) { return getColor(d.name); });

        district.selectAll("text")
            .attr("transform", function (d) { return "translate(" + x(d.value.date) + "," + y(d.value.count) + ")"; })
            .attr("x", 3)
            .attr("dy", ".35em")
            .text(function (d) { return d.name; });

        // EXIT
        // Remove old elements as needed.
        district.exit().remove();

        return chart;
    };

    // return the object
    return chart;
};