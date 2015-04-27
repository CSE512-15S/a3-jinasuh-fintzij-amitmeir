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

    mapViz.initialized = function () {

        // Date slider
        var dateSlider = $("#dateSlider");
        var datePlayButton = $("#datePlayButton");

        dateSlider.slider({
            min: mapViz.weekIDExtent[0],
            max: mapViz.weekIDExtent[1],
            step: 1,
            slide: function (event, ui) { updateSlider(ui.value, "#dateValue", "WeekID", true); },
            change: function (event, ui) { updateSlider(ui.value, "#dateValue", "WeekID", true); },
        });

        datePlayButton.click(function () {
            dateSlider.slider("value", 0);
            incrementDateSlider();
        });

        // Data type
        $('#selector button').click(function () {
            $(this).addClass('active').siblings().removeClass('active');
            var newType = ($(this)[0].id == "confirmed") ? 0 : 1;
            if (newType != mapViz.selectedParams().Type) {
                mapViz.selectedParams().Type = newType;
                mapViz.updateChropleth();
            }
        });

        // Infectivity
        var infSlider = $("#infSlider");

        infSlider.slider({
            min: 0.01,
            max: 0.06,
            step: 0.05,
            slide: function (event, ui) { updateSlider(ui.value, "#infValue", "Inf", false); },
            change: function (event, ui) { updateSlider(ui.value, "#infValue", "Inf", false); },
        });

        // Sample Probability
        var spSlider = $("#spSlider");

        spSlider.slider({
            min: 0.1,
            max: 0.6,
            step: 0.5,
            slide: function (event, ui) { updateSlider(ui.value, "#spValue", "SProb", false); },
            change: function (event, ui) { updateSlider(ui.value, "#spValue", "SProb", false); },
        });

        // District Neighbors
        var ndSlider = $("#ndSlider");

        ndSlider.slider({
            min: 0,
            max: 0.2,
            step: 0.1,
            slide: function (event, ui) { updateSlider(ui.value, "#ndValue", "ND", false); },
            change: function (event, ui) { updateSlider(ui.value, "#ndValue", "ND", false); },
        });

        // Country Neighbors
        var ncSlider = $("#ncSlider");

        ncSlider.slider({
            min: 0,
            max: 0.05,
            step: 0.025,
            slide: function (event, ui) { updateSlider(ui.value, "#ncValue", "NC", false); },
            change: function (event, ui) { updateSlider(ui.value, "#ncValue", "NC", false); },
        });

        // Initialize controls
        //dateSlider.slider("value", mapViz.weekIDExtent[0]);

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

        function updateSlider(v, valueId, property, isDate) {
            var myValue = $(valueId);
            if (v != mapViz.selectedParams()[property]) {
                myValue.html(v);
                mapViz.selectedParams()[property] = v;
                if (isDate) {
                    mapViz.update();
                }
                else {
                    mapViz.updateBubbles();
                }
            }
            return v;
        }

        //function updateSlider(sliderId, valueId, property, isDate) {
        //    var mySlider = $(sliderId);
        //    var myValue = $(valueId);
        //    var v = mySlider.slider("value");
        //    if (v != mapViz.selectedParams()[property]) {
        //        myValue.html(v);
        //        mapViz.selectedParams()[property] = v;
        //        if (isDate) {
        //            mapViz.updateChropleth();
        //        }
        //        else {
        //            mapViz.updateBubbles();
        //        }
        //    }
        //    return v;
        //}

        //function updateDate() {
        //    // When date slider value changes, update the selected date on the map
        //    var v = updateSlider("#dateSlider", "#dateValue");
        //    if (v != mapViz.selectedParams().WeekID) {
        //        mapViz.selectedParams().WeekID = v;
        //        mapViz.update();
        //    }
        //}
    }

    mapViz.initialize();
}
