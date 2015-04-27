var mapViz = viz.ebolaMap("map");

// Wire up events
$(document).ready(function onReady() {


    //initialize the views
    //mapViz.data([])
    //	.layout()
    //	.repaint();

    //loading data	
    loadData();
});

function loadData() {
    //var positions = {};
    //// Load the position data
    //d3.csv("data/locations.csv", function (error, data) {
    //    data.forEach(function (row) {
    //        positions[row.DistrictID] = [row.lat, row.long];
    //    })
    //});

    // Load the infection data
    d3.csv("data/infection2.csv", function (error, data) {

        // Figure out the range of values to set the choropleth color range

        //Country,District,Case_Type,Week,DistrictID,WeekID,Probable,Confirmed,inf0.01sprob0.1nd0nc0confirmed

        var countExtent = [0, 225]; //d3.extent(data, function (row) { return +row.ConfirmedCount; });// 225
        var foiExtent = [0, 360]; //d3.extent(data, function (row) { return +row.FOI__1; }); // 360
        var weekIDExtent = d3.extent(data, function (row) { return +row.WeekID; });

        var quantizeFill = d3.scale.quantize()
            .domain(countExtent)
            .range(d3.range(9).map(function (i) { return "q" + i + "-9"; }));

        var quantizeRadius = d3.scale.linear()
            .domain(foiExtent)
            .range([0, 100]); // TODO: Figure out the best range

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
                v.data.fillKey = quantizeFill(v.data.ConfirmedCount);
                v.data.radius = quantizeRadius(v.data.FOI__1);
                v.data.centered = v.district;

                if (v.data.Country == "Liberia") {
                    //var pos = positions[v.district];
                    //if (pos) {
                    //    v.data.latitude = pos[0];
                    //    v.data.longitude = pos[1];
                    //} else {
                    //    console.log("MISSING POSITION FOR DISTRICT: " + v.district);
                    //}

                    bubbleArray.push(v.data);
                }
            });

            finalData[d.group] = newVals;
            finalBubbleData[d.group] = bubbleArray;
        });

        mapViz.data(finalData);
        mapViz.bubbleData(finalBubbleData);

        mapViz.selectedDate(weekIDExtent[0]);


        var dateSlider = $("#dateSlider");
        var datePlayButton = $("#datePlayButton");

        dateSlider.slider({
            min: weekIDExtent[0],
            max: weekIDExtent[1],
            step: 1,
            slide: function () { updateDate(); },
            change: function () { updateDate(); },
        });

        datePlayButton.click(function () {
            dateSlider.slider("value", 0);
            incrementDateSlider();
        })
    });

    function incrementDateSlider() {
        var dateSlider = $("#dateSlider");
        var max = dateSlider.slider("option", "max");
        var current = dateSlider.slider("value");

        if (current < max) {
            setTimeout(function () {
                dateSlider.slider("value", current + 1);
                incrementDateSlider();
            }, 100);
        }
    }

    function updateDate() {
        // When date slider value changes, update the selected date on the map
        var dateSlider = $("#dateSlider");
        var dateValue = $("#dateValue");
        var v = dateSlider.slider("value");
        if (v != mapViz.selectedDate()) {
            dateValue.html(v);
            mapViz.selectedDate(v);
        }
    }
}
