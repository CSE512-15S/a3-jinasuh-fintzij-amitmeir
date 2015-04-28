var mapViz = viz.ebolaMap("map");
var lineViz = viz.caseChart("lineChart");

var sharedData = {
    colorScheme: colorbrewer.Reds[9],
    weeklyMapData: {},
    weeklyBubbleData: {},
    districtData: {},
    selectedDistricts: ko.observableArray(),
    selectedData: {},
    weekIDExtent: [0, 0],
    dateExtent: [0, 0],
    countRadiusScale: function (datum) { return 0; },
    foiFillScale: function (datum) { return 0; },
    selectedParams: {
        weekID: 0,
        type: 0, // confirmed=0 or probable=1
        showCount: false,
    },
    showConfirmed: function () { return sharedData.selectedParams.type == 0; },
    getCount: function (datum) {
        if (sharedData.showConfirmed()) {
            return datum.Confirmed;
        }
        else {
            return datum.Probable;
        }
    },
    getFOI: function (datum) {
        if (sharedData.showConfirmed()) {
            return datum.ConfirmedFOI;
        }
        else {
            return datum.ProbableFOI;
        }
    },
};


// Wire up events
$(document).ready(function onReady() {
    //loading data	
    loadData();
});

function loadData() {
    queue()
   .defer(d3.csv, "data/eboladata.csv")
   .await(function (error, data) {
       initializeData(error, data);
       initializeMap();
       initializeChart();
       initializeControls();
   });

    function initializeData(error, data) {

        // Data format
        //Country,DistrictID,Case_Type,Week,Probable,Confirmed,ConfirmedFOI,ProbableFOI,WeekID

        // Date parser
        var parseDate = d3.time.format("%x").parse;

        // Extent for Weeks
        sharedData.weekIDExtent = d3.extent(data, function (row) { return +row.WeekID; });
        sharedData.dateExtent = d3.extent(data, function (row) {
            row.date = parseDate(row.Week);
            return row.date;
        });

        // Extent and Scale for New case counts
        var countExtent = [0, 225];
        sharedData.countRadiusScale = d3.scale.linear()
          .domain(countExtent)
          .range([0, 100]);

        // Extend and Scale for FOI
        var foiExtent = [0, 7];
        sharedData.foiFillScale = d3.scale.quantize()
           .domain(foiExtent)
           .range(d3.range(9).map(function (i) { return i; }));

        // Group data by WeekID and DistrictID
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

        // DataMap Choropleth requires each geometry name (DistrictID) to be a property into the data
        // DataMap Bubble requires a data array
        nestedData.forEach(function (d) {
            var newVals = {};
            var bubbleArray = [];

            d.values.forEach(function (v) {
                newVals[v.district] = v.data;

                // JINA HACK -- Only Liberia geo is available for now
                if (v.data.Country == "Liberia") {
                    v.data.centered = v.district;
                    bubbleArray.push(v.data);
                }
            });

            sharedData.weeklyMapData[d.group] = newVals;
            sharedData.weeklyBubbleData[d.group] = bubbleArray;
        });

        // Nest by DistrictID
        sharedData.districtData = d3.nest()
                    .key(function (row) {
                        return row.DistrictID;
                    })
                    .map(data, d3.map);
    }

    function initializeMap() {
        // Set the data on the map
        mapViz.data(sharedData);

        // Update the map with the data
        mapViz.update();
    }

    function initializeChart() {
        // Set the data on the map
        lineViz.data(sharedData);

        // Update the map with the data
        lineViz.update();
    }

    function initializeControls() {

        // Date slider
        var dateSlider = $("#dateSlider");
        var datePlayButton = $("#datePlayButton");

        dateSlider.slider({
            min: sharedData.weekIDExtent[0],
            max: sharedData.weekIDExtent[1],
            step: 1,
            slide: function (event, ui) { updateSlider(ui.value, "#dateValue", "weekID"); },
            change: function (event, ui) { updateSlider(ui.value, "#dateValue", "weekID"); },
        });

        datePlayButton.click(function () {
            dateSlider.slider("value", 0);
            incrementDateSlider();
        });

        // Data type
        $('#selector button').click(function () {
            $(this).addClass('active').siblings().removeClass('active');
            var newType = ($(this)[0].id == "confirmed") ? 0 : 1;
            if (newType != sharedData.selectedParams.Type) {
                sharedData.selectedParams.Type = newType;
                mapViz.updateChropleth();
            }
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

        function updateSlider(v, valueId, property) {
            var myValue = $(valueId);
            if (v != sharedData.selectedParams[property]) {
                myValue.html(v);
                sharedData.selectedParams[property] = v;
                mapViz.update();
            }
            return v;
        }
    }

}