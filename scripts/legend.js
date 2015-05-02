viz.legend = function (containerId) {

    containerId = "#" + containerId;
    var legendInstance = {};
    var initialized = false;
    var margin = { top: 0, right: 10, bottom: 0, left: 10 };

    var width = $(containerId).width() - margin.left - margin.right;
    var height = $(containerId).height() - margin.top - margin.bottom;

    legendInstance.data = function (_) {
        if (!arguments.length) return data;
        data = _;
        return legendInstance;
    };

    legendInstance.update = function () {
        if (data && !initialized) {
            initialized = true;
            var logFoiRange = [1, 2, 3, 4, 5, 6, 7];
            var foiThreshold = d3.scale.threshold().domain(logFoiRange).range(data.colorScheme);
            var legend = d3.svg.legend().units("log(FOI)").cellWidth(80).cellHeight(25).inputScale(foiThreshold).cellStepping(100);

            d3.select(containerId).append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g").attr("transform", "translate(1,70)").attr("class", "legend").call(legend);
        }
        return legendInstance;
    };
    // return the object
    return legendInstance;
};