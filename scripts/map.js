viz = function () {
    var viz = {};

    return viz;
}();

viz.ebolaMap = function (containerId) {

    var currentMap = {},
	 	data = {},
        dispatch = d3.dispatch("clickdata", "mouseoverdata", "mouseoutdata", "dragthreshold", "dragaxis");

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
                    var type = (data.selectedParams.type == 0) ? "Confirmed" : "Probable";
                    var val = datum[type];

                    return data.countRadiusScale(val);
                },
            },
            fillFunc: function (datum) {
                var key;
                if (data.selectedParams.type == 0) {
                    key = data.foiFillScale(datum.ConfirmedFOI);
                }
                else {
                    key = data.foiFillScale(datum.ProbableFOI);
                }

                return data.colorScheme[key];
            },
            data: {
            }  //empty data has to be included here cause of some issue MarkDiMarkoh  mentioned in our GitHub conversation

        });


    /*
    ** PUBLIC
    */

    currentMap.data = function (_) {
        if (!arguments.length) return data;
        data = _;
        return currentMap;
    };

    currentMap.dispatch = dispatch;

    currentMap.update = function () {
        currentMap.updateChropleth();
        currentMap.updateBubbles();

        return currentMap;
    };

    currentMap.updateChropleth = function () {
        if (data) {
            var newData = data.weeklyMapData[data.selectedParams.weekID];
            if (newData) {
                datamap.updateChoropleth(newData);
            }
        }

        return currentMap;
    };

    currentMap.updateBubbles = function () {
        if (data) {
            if (data.selectedParams.showCount) {
                var newData = data.weeklyBubbleData[data.selectedParams.weekID];
                if (newData) {
                    datamap.bubbles(newData);
                }
            }
            else {
                datamap.bubbles([]);
            }
        }

        return currentMap;
    };


    // return the object
    return currentMap;
};