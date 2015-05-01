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
    dateIndices: [],
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
    hoveredDistrict: ko.observable(),
    hoveredDistrictName: ko.observable(),
    hoveredCountryName: ko.observable(),
    hoveredDistrictPopulationSize: ko.observable(),
    selectedWeek: ko.observable(),
    totalCases: ko.observable(),
    hoveredDistrictFoi: ko.observable(),
    playing: ko.observable(false),
    colors: d3.scale.category10(),
    colorMap: d3.map(),
    getColor: function (districtID) {
        var color = sharedData.colorMap.get(districtID);
        if (color) {
            return color;
        }
        else {
            var usedColors = sharedData.colorMap.values();

            for (var i = 0; i < 10; i++) {
                var c = sharedData.colors(i);
                if (usedColors.indexOf(c) < 0) {
                    sharedData.colorMap.set(districtID, c);
                    color = c;
                    break;
                }
            }

            return color;
        }
    },
};


// Wire up events
$(document).ready(function onReady() {
    ko.applyBindings(sharedData);

    loadData();

    sharedData.selectedDistricts.subscribe(function () {
        // Clean up colors
        var usedColors = sharedData.colorMap.keys();
        for (var i = 0; i < usedColors.length; i++) {
            var key = usedColors[i];
            if (sharedData.selectedDistricts().indexOf(key) < 0) {
                sharedData.colorMap.remove(key);
            }
        }

        lineViz.update();
    });

    sharedData.hoveredDistrict.subscribe(function () {
        onDistrictHovered();
    })
});

function onDistrictHovered() {
    var hoveredDistrictId = sharedData.hoveredDistrict();
    if (hoveredDistrictId) {
        var districtData = sharedData.districtData.get(hoveredDistrictId);
        var dataPoint = districtData[sharedData.selectedParams.weekID];
        sharedData.hoveredDistrictName("x" + dataPoint.DistrictID); // dataPoint.DistrictID
        sharedData.hoveredCountryName(dataPoint.Country);
        sharedData.hoveredDistrictPopulationSize("todo123"); // dataPoint.PopulationSize
        sharedData.hoveredDistrictFoi(sharedData.getFOI(dataPoint));

    }
    else {
        sharedData.hoveredDistrictName(""); // dataPoint.DistrictID
        sharedData.hoveredCountryName("");
        sharedData.hoveredDistrictPopulationSize(0); // dataPoint.PopulationSize
        sharedData.hoveredDistrictFoi(0);
    }

    lineViz.updateHoveredDistrict();
}

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
        var weeks = {};
        sharedData.weekIDExtent = d3.extent(data, function (row) { return +row.WeekID; });
        sharedData.dateExtent = d3.extent(data, function (row) {
            row.date = parseDate(row.Week);
            weeks[+row.WeekID] = row.date;
            return row.date;
        });

        for (var i = sharedData.weekIDExtent[0]; i <= sharedData.weekIDExtent[1]; i++) {
            sharedData.dateIndices.push(weeks[i]);
        }

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
        var datePlayButton = $(".playbutton");

        dateSlider.slider({
            min: sharedData.weekIDExtent[0],
            max: sharedData.weekIDExtent[1],
            step: 1,
            slide: function (event, ui) { updateWeek(ui.value); },
            change: function (event, ui) { updateWeek(ui.value); },
        });

        datePlayButton.click(function () {
            if (!sharedData.playing()) {
                sharedData.playing(true);
                incrementDateSlider();
            }
            else {
                sharedData.playing(false);
            }
        });

        // Data type
        $('#selector button').click(function () {
            $(this).addClass('active').siblings().removeClass('active');
            var newType = ($(this)[0].id == "confirmed") ? 0 : 1;
            if (newType != sharedData.selectedParams.type) {
                sharedData.selectedParams.type = newType;
                mapViz.updateChropleth();
                lineViz.update();
            }
        });

        function incrementDateSlider() {
            var dateSlider = $("#dateSlider");
            var max = dateSlider.slider("option", "max");
            var current = dateSlider.slider("value");

            if (current < max) {
                setTimeout(function () {
                    if (sharedData.playing()) {
                        dateSlider.slider("value", current + 1);
                        incrementDateSlider();
                    }
                }, 100);
            }
            else {
                sharedData.playing(false);
                dateSlider.slider("value", 0);
            }
        }

        function updateWeek(week, force) {
            if (week != sharedData.weekID || force) {
                sharedData.selectedParams.weekID = week;
                mapViz.update();
                lineViz.updateSelectedWeek();
                sharedData.selectedWeek(sharedData.dateIndices[week])
                sharedData.totalCases("x123");
            }
            return week;
        }

        updateWeek(0, true);
    }

}