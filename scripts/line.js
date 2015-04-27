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

    chart.update = function () {
        if (!data) {
            return;
        }

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

        // Update the color scale with the selected districts
        color.domain(data.selectedDistricts);
        var districts = color.domain().map(function (name) {
            return {
                name: name,
                values: data.districtData.get(name).map(function (datum) {
                    return { date: datum.date, count: +data.getCount(datum) };
                })
            };
        });

        x.domain(data.dateExtent);

        y.domain([
          d3.min(districts, function (d) { return d3.min(d.values, function (d) { return d.count; }); }),
          d3.max(districts, function (d) { return d3.max(d.values, function (d) { return d.count; }); })
        ]);

        // Draw x-axis
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        // Draw y-axis
        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
          .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("Temperature (ºF)");

        var district = svg.selectAll(".district")
            .data(districts)
          .enter().append("g")
            .attr("class", "district");

        district.append("path")
            .attr("class", "line")
            .attr("d", function (d) { return line(d.values); })
            .style("stroke", function (d) { return color(d.name); });

        district.append("text")
            .datum(function (d) { return { name: d.name, value: d.values[d.values.length - 1] }; })
            .attr("transform", function (d) { return "translate(" + x(d.value.date) + "," + y(d.value.count) + ")"; })
            .attr("x", 3)
            .attr("dy", ".35em")
            .text(function (d) { return d.name; });

        return chart;
    };

    // return the object
    return chart;
};