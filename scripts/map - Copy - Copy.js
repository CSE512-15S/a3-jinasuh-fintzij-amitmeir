viz = function () {
    var viz = {};

    return viz;
}();


viz.ebolaMap = function (containerId) {

    var currentMap = {},
	 	data = [],
        bubbleData = [],
        selectedParams = {
            WeekId: 0,
            Inf: 0.01, // 0.01, 0.06
            SProb: 0.6, // 0.1, 0.6
            ND: 0, // 0, 0.1, 0.2
            NC: 0, // 0, 0.025, 0.05
            Type: 0, // confirmed=0 or probable=1
        };

    dispatch = d3.dispatch("clickdata", "mouseoverdata", "mouseoutdata", "dragthreshold", "dragaxis");

    var colorScheme = colorbrewer.Reds[9];
    var width = 960,
  height = 500;

    // Setting color domains(intervals of values) for our map

    var colorArray = colorbrewer.Reds[9];
    var ext_color_domain = color_domain.shift(0);
    var countExtent = [0, 225];

    var legend_labels = ["q0", "q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10"]
    var color = d3.scale.quantize()
     .domain(countExtent)
     .range(d3.range(9).map(function (i) { return colorArray[i]; }));

    var div = d3.select(containerId).append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

    var svg = d3.select(containerId).append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("margin", "10px auto");

    var projection = d3.geo.equirectangular()
                  .center([-9.8124935, 6.2308452]) // -10.8451467	6.7562926
                  .scale(6000)
                  .translate([element.offsetWidth / 2, element.offsetHeight / 2]);

    var path = d3.geo.path().projection(projection);

    //Reading map file and data

    queue()
    .defer(d3.json, "data/liberia.json")
    .defer(d3.csv, "ebolawithfoi.csv")
    .await(ready);

    //Start of Choropleth drawing

    function ready(error, map, data) {
        var rateById = {};
        var nameById = {};

        data.forEach(function (d) {
            rateById[d.RegionCode] = +d.Deaths;
            nameById[d.RegionCode] = d.RegionName;
        });

        //Drawing Choropleth

        svg.append("g")
        .attr("class", "region")
        .selectAll("path")
        .data(topojson.object(map, map.objects.russia).geometries)
        //.data(topojson.feature(map, map.objects.russia).features) <-- in case topojson.v1.js
        .enter().append("path")
        .attr("d", path)
        .style("fill", function (d) {
            return color(rateById[d.properties.region]);
        })
        .style("opacity", 0.8)

        //Adding mouseevents
        .on("mouseover", function (d) {
            d3.select(this).transition().duration(300).style("opacity", 1);
            div.transition().duration(300)
            .style("opacity", 1)
            div.text(nameById[d.properties.region] + " : " + rateById[d.properties.region])
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 30) + "px");
        })
        .on("mouseout", function () {
            d3.select(this)
            .transition().duration(300)
            .style("opacity", 0.8);
            div.transition().duration(300)
            .style("opacity", 0);
        })

        // Adding cities on the map

        d3.tsv("cities.tsv", function (error, data) {
            var city = svg.selectAll("g.city")
            .data(data)
            .enter()
            .append("g")
            .attr("class", "city")
            .attr("transform", function (d) { return "translate(" + projection([d.lon, d.lat]) + ")"; });

            city.append("circle")
            .attr("r", 3)
            .style("fill", "lime")
            .style("opacity", 0.75);

            city.append("text")
            .attr("x", 5)
            .text(function (d) { return d.City; });
        });

    }; // <-- End of Choropleth drawing

    //Adding legend for our Choropleth

    var legend = svg.selectAll("g.legend")
    .data(ext_color_domain)
    .enter().append("g")
    .attr("class", "legend");

    var ls_w = 20, ls_h = 20;

    legend.append("rect")
    .attr("x", 20)
    .attr("y", function (d, i) { return height - (i * ls_h) - 2 * ls_h; })
    .attr("width", ls_w)
    .attr("height", ls_h)
    .style("fill", function (d, i) { return color(d); })
    .style("opacity", 0.8);

    legend.append("text")
    .attr("x", 50)
    .attr("y", function (d, i) { return height - (i * ls_h) - ls_h - 4; })
    .text(function (d, i) { return legend_labels[i]; });





















    var datamap = new Datamap(
        {
            scope: 'LIB-level_1',
            geographyConfig: {
                dataUrl: 'data/liberia.json',
                borderWidth: 0.3,
                borderColor: function (data) {
                    return '#4F4F4F';
                },
                highlightBorderColor: 'black',
                highlightBorderWidth: 0.5,
                highlightFillColor: '#FFEC38',

                popupTemplate: function (geography, data) {
                    var popup = '<div class="hoverinfo"> <strong> District: ' + geography.properties.ID + ' </strong> Country: ' + geography.properties.CAPTION;
                    if (data) {
                        popup = popup + '+++' + data.ConfirmedCount + '</div>';
                    }

                    return popup;
                },
            },

            element: document.getElementById(containerId),
            setProjection: function (element) {
                var projection = d3.geo.equirectangular()
                  .center([-9.8124935, 6.2308452]) // -10.8451467	6.7562926
                  .scale(6000)
                  .translate([element.offsetWidth / 2, element.offsetHeight / 2]);
                var path = d3.geo.path()
                  .projection(projection);

                return {
                    path: path, projection: projection
                };
            },
            bubblesConfig: {
                borderWidth: 2,
                borderColor: '#FFFFFF',
                popupOnHover: true,
                radius: null,
                popupTemplate: function (data) {
                    var popup = '<div class="hoverinfo"> <strong> District: ' + data.DistrictID + ' </strong> FOI: ' + data.FOI__1;
                    return popup;
                },
                fillOpacity: 0.75,
                //animate: true,
                highlightOnHover: true,
                highlightFillColor: '#FC8D59',
                highlightBorderColor: 'rgba(250, 15, 160, 0.2)',
                highlightBorderWidth: 2,
                highlightFillOpacity: 0.85,
                //exitDelay: 100
            },
            fills: {
                "q0-9": colorScheme[0],
                "q1-9": colorScheme[1],
                "q2-9": colorScheme[2],
                "q3-9": colorScheme[3],
                "q4-9": colorScheme[4],
                "q5-9": colorScheme[5],
                "q6-9": colorScheme[6],
                "q7-9": colorScheme[7],
                "q8-9": colorScheme[8],
                "bubble": "#777",
                'no data': 'rgba(190,190,190,0.3)',
                defaultFill: 'rgba(190,190,190,0.3)'
            },
            data: {
            }  //empty data has to be included here cause of some issue MarkDiMarkoh  mentioned in our GitHub conversation

        });

    currentMap.data = function (_) {
        if (!arguments.length) return data;
        data = _;
        return currentMap;
    };

    currentMap.bubbleData = function (_) {
        if (!arguments.length) return bubbleData;
        bubbleData = _;
        return currentMap;
    };

    currentMap.selectedParams = function (_) {
        if (!arguments.length) return selectedParams;
        selectedParams = _;
        return currentMap;
    };

    currentMap.dispatch = dispatch;

    currentMap.update = function () {
        currentMap.updateChropleth();
        currentMap.updateBubbles();

        return currentMap;
    };

    currentMap.updateChropleth = function () {
        var newData = data[selectedParams.WeekID];
        if (newData) {
            datamap.updateChoropleth(newData);
        }

        return currentMap;
    };

    currentMap.updateBubbles = function () {
        var newData = data[selectedParams.WeekID];
        if (newData) {


            datamap.updateChoropleth(newData);
            datamap.bubbles(bubbleData[selectedDate]);
        }

        return currentMap;
    };


    // return the object
    return currentMap;
};



////  –––––––––––––––––––––––––––––––––––––––––––––––––––
////  Max – Plugin added by me to have the legend vertically
//function addLegendmaxstyle(layer, data, options) {
//    data = data || {};
//    if (!this.options.fills) { return; }

//    var html = '<dl>';
//    var label = '';

//    if (data.legendTitle) { html = '<h4>' + data.legendTitle + '</h4>' + html; }

//    for (var fillKey in this.options.fills) {

//        if (fillKey === 'defaultFill') {
//            if (!data.defaultFillName) {
//                continue;
//            }

//            label = data.defaultFillName;
//        } else {
//            if (data.labels && data.labels[fillKey]) {
//                label = data.labels[fillKey];
//            } else {

//                // Changed by Max //
//                label = '' + fillKey;
//                html += '<dd style="background-color:' + this.options.fills[fillKey] + '">&nbsp;</dd>';
//                html += '<dt>' + label + '</dt>' + '<br>';

//            }
//        }
//    }
//    html += '</dl>';

//    var hoverover = d3.select(this.options.element).append('div')
//            .attr('class', 'datamaps-legend')
//            .html(html);
//}
////  –––––––––––––––––––––––––––––––––––––––––––––––––––









////Legende anzeigen
//myMap1.addPlugin("mylegend", addLegendmaxstyle);
//myMap1.mylegend({ legendTitle: "Infant Mortality (per 1,000 live births)" })
//// –––––––––––––––––––––––––––––––––––––––––––––––––––


