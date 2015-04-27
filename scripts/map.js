viz = function () {
    var viz = {};

    return viz;
}();


viz.ebolaMap = function (containerId) {

    var currentMap = {},
	 	data = [],
        bubbleData = [],
        selectedParams = {
            WeekID: 0,
            Inf: 0.01, // 0.01, 0.06
            SProb: 0.6, // 0.1, 0.6
            ND: 0, // 0, 0.1, 0.2
            NC: 0, // 0, 0.025, 0.05
            Type: 0, // confirmed=0 or probable=1
        };

    // chart 
    var countExtent,
        foiExtent,
        weekIDExtent,
        quantizeFill,
        linearRadius;

    dispatch = d3.dispatch("clickdata", "mouseoverdata", "mouseoutdata", "dragthreshold", "dragaxis");

    var colorScheme = colorbrewer.Reds[9];
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
                radiusFunc: function (datum) {
                    var type = (selectedParams.Type == 0) ? "confirmed" : "probable";
                    var prop = "inf" + selectedParams.Inf + "sprob" + selectedParams.SProb + "nd" + selectedParams.ND + "nc" + selectedParams.NC + type;
                    var val = datum[prop];

                    return linearRadius(val);
                },
            },
            fillFunc: function (datum) {
                var key;
                if (selectedParams.Type == 0) {
                    key = quantizeFill(datum.Confirmed);
                }
                else {
                    key = quantizeFill(datum.Probable);
                }

                return colorScheme[key];
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

    currentMap.initialize = function () {
        d3.csv("data/ebolawithfoi.csv", function (error, data) {

            // Figure out the range of values to set the choropleth color range

            //Country,District,Case_Type,Week,DistrictID,WeekID,Probable,Confirmed,inf0.01sprob0.1nd0nc0confirmed

            weekIDExtent = d3.extent(data, function (row) { return +row.WeekID; });
            currentMap.weekIDExtent = weekIDExtent;

            countExtent = [0, 225]; //d3.extent(data, function (row) { return +row.ConfirmedCount; });// 225
            quantizeFill = d3.scale.quantize()
               .domain(countExtent)
               .range(d3.range(9).map(function (i) { return i; }));
            //.range(d3.range(9).map(function (i) { return "q" + i + "-9"; }));

            foiExtent = [0, 360]; //d3.extent(data, function (row) { return +row.FOI__1; }); // 360
            linearRadius = d3.scale.linear()
               .domain(foiExtent)
               .range([0, 500]); // TODO: Figure out the best range

            // Extract dates and set the dates on the slider
            var nestedData = d3.nest()
                .key(function (row) {
                    return row.WeekID;
                })
                .entries(data)
                .map(function (d) {
                    var group = d.key
                    var values = d.values.map(function (dd) {
                        return {
                            "district": dd.DistrictID, "data": dd
                        };
                    })
                    return {
                        'group': group, 'values': values
                    }
                });

            var finalData = {};
            var finalBubbleData = {};
            nestedData.forEach(function (d) {
                var newVals = {};
                var bubbleArray = [];

                d.values.forEach(function (v) {
                    newVals[v.district] = v.data;

                    // JINA HACK
                    if (v.data.Country == "Liberia") {
                        v.data.centered = v.district;
                        bubbleArray.push(v.data);
                    }
                });

                finalData[d.group] = newVals;
                finalBubbleData[d.group] = bubbleArray;
            });

            currentMap.data(finalData);
            currentMap.bubbleData(finalBubbleData);

            currentMap.update();

            if (currentMap.initialized) {
                currentMap.initialized();
            }
        });
    }

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
        var newData = bubbleData[selectedParams.WeekID];
        if (newData) {
            datamap.bubbles(newData);
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


