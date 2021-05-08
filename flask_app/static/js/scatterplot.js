// Initial Setup
var svgWidth = 700;
var svgHeight = 530;

var margin = {
    top: 20,
    right: 20,
    bottom: 140,
    left: 80
};

var width = svgWidth - margin.left - margin.right;
var height = svgHeight - margin.top - margin.bottom;

// Create an SVG wrapper
var svg = d3
    .select("#scatter")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

// Append an SVG group and shift it by the left and top margins.
var chartGroup = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Initial Params
var chosenXAxis = "temp_feels_like";
var chosenYAxis = "total_ticket_number";

// Configure a parseTime() function which will return a datetime object from a string
var parseTime = d3.timeParse("%a, %d %b %Y %H:%M:%S GMT");
// Configure a formatTime() function which will return a string from a datetime object
var formatTime = d3.timeFormat("%a, %B %d %H:%M:%S");

// ------------------------------------------------

// Function used for updating x-scale var upon click on axis label
function xScale(ppaWeatherData, chosenXAxis) {
    // create scales
    var xLinearScale = d3.scaleLinear()
    .domain([
        d3.min(ppaWeatherData, d => d[chosenXAxis]) * 0.85,
        d3.max(ppaWeatherData, d => d[chosenXAxis]) * 1.15
    ])
    .range([0, width]);

    xLinearScale.nice();

    return xLinearScale;
}

// Function used for updating x-scale var upon click on axis label if the var is a datetime
function xScaleTime(ppaWeatherData, chosenXAxis) {
    // create time scales
    var xTimeScale = d3.scaleTime()
    .domain(d3.extent(ppaWeatherData, d => d[chosenXAxis]))
    .range([0, width]);

    xTimeScale.nice();

    return xTimeScale;
}

// Function used for updating y-scale var upon click on axis label
function yScale(ppaWeatherData, chosenYAxis) {
    // create scales
    var yLinearScale = d3.scaleLinear()
    .domain([
        d3.min(ppaWeatherData, d => d[chosenYAxis]) * 0.85,
        d3.max(ppaWeatherData, d => d[chosenYAxis]) * 1.15
    ])
    .range([height, 0]);

    yLinearScale.nice();

    return yLinearScale;
}

// Function used for updating xAxis var upon click on axis label
function renderXAxis(newXScale, xAxis) {
    var bottomAxis = d3.axisBottom(newXScale);

    xAxis.transition()
        .duration(1200)
        .call(bottomAxis);

    return xAxis;
}

// Function used for updating yAxis var upon click on axis label
function renderYAxis(newYScale, yAxis) {
    var leftAxis = d3.axisLeft(newYScale);

    yAxis.transition()
        .duration(1200)
        .call(leftAxis);

    return yAxis;
}

// Function used for updating circles group with a transition to new circles
function renderCircles(circlesGroup, newXScale, newYScale, chosenXAxis, chosenYAxis) {

    circlesGroup.transition()
        .duration(1000)
        .attr("cx", d => newXScale(d[chosenXAxis]))
        .attr("cy", d => newYScale(d[chosenYAxis]));

  return circlesGroup;
}

// Function used for updating circles group with new tooltip
function updateToolTip(chosenXAxis, chosenYAxis, circlesGroup) {

    // Create a number formatter so that we can display fine in the style of "currency" within the tooltips
    var formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 1
    });

    var xLabel;
    var yLabel;

    // Conditions to customize info in tooltips depending on chosenXAxis
    if (chosenXAxis === "temp_feels_like") {
        xLabel = "Temperature (°F) per hour";
    }
    else if (chosenXAxis === "rain_1h") {
        xLabel = "Precipitation (mm) per hour:";
    }
    else if (chosenXAxis === "snow_3h") {
        xLabel = "Snow (mm) per hour:";
    }
    else if (chosenXAxis === "humidity") {
        xLabel = "Humidty (%) per hour:";
    }
    else if (chosenXAxis === "datetime") {
        xLabel = "Date & Hour:";
    };

    // Conditions to customize info in tooltips depending on chosenYAxis
    if (chosenYAxis === "total_ticket_number") {
        yLabel = "Tickets per hour:";
    }
    else if (chosenYAxis === "fine") {
        yLabel = "Avg. Fine ($) per hour:";
    }

    // Dollar info needs to be formatted as well as our datetime objects into more readable styles
    if (chosenYAxis === "fine") {
        var toolTip = d3.tip()
            .attr("class", "d3-tip")
            .offset([85, 65])
            .html(function(d) {
                return (
                    `${d.weather_description}<br>
                    ${xLabel} ${d[chosenXAxis]}<br>
                    ${yLabel} ${formatter.format(parseInt(d[chosenYAxis]))}`);
            })
        if (chosenXAxis === "datetime") {
            var toolTip = d3.tip()
                .attr("class", "d3-tip")
                .offset([85, 65])
                .html(function(d) {
                    return (
                        `${d.weather_description}<br>
                        ${xLabel} ${formatTime(d[chosenXAxis])}<br>
                        ${yLabel} ${formatter.format(parseInt(d[chosenYAxis]))}`);
                })
        }
    }
    else {
        if (chosenXAxis === "datetime") {
            var toolTip = d3.tip()
                .attr("class", "d3-tip")
                .offset([85, 65])
                .html(function(d) {
                    return (
                        `${d.weather_description}<br>
                        ${xLabel} ${formatTime(d[chosenXAxis])}<br>
                        ${yLabel} ${d[chosenYAxis]}`);
                })
        }
        else {
            var toolTip = d3.tip()
                .attr("class", "d3-tip")
                .offset([85, 65])
                .html(function(d) {
                    return (
                        `${d.weather_description}<br>
                        ${xLabel} ${d[chosenXAxis]}<br>
                        ${yLabel} ${d[chosenYAxis]}`);
                })
        }
    };

    // Append tooltips also to the circles group
    circlesGroup.call(toolTip);

    circlesGroup.on("mouseover", function(data) {
        toolTip.show(data);
    })
    // on mouseout event
        .on("mouseout", function(data, index) {
        toolTip.hide(data);
    });

    // Return both groups with updated tooltips
    return circlesGroup;
}

// ------------------------------------------------
// ------------------------------------------------

// Retrieve data from the api route and execute everything below
d3.json("/api/scatterplot").then(function(ppaWeatherData, err) {
    if (err) throw err;
    // For developers... visualizing data...
    // console.log(ppaWeatherData);

    // Parse data and make sure numeric fields are in number formats and datetime in datetime
    ppaWeatherData.forEach((data) => {
        data.datetime = parseTime(data.datetime);
        data.fine = +data.fine;
        data.humidity = +data.humidity;
        data.rain_1h = +data.rain_1h;
        data.snow_3h = +data.snow_3h;
        data.temp_feels_like = +data.temp_feels_like;
        data.total_ticket_number = +data.total_ticket_number;
    });

    // Create x scale function using the created xScale() function
    var xLinearScale = xScale(ppaWeatherData, chosenXAxis);

    // Create y scale function using the created yScale() function
    var yLinearScale = yScale(ppaWeatherData, chosenYAxis);

    // Create initial axis functions
    var bottomAxis = d3.axisBottom(xLinearScale);
    var leftAxis = d3.axisLeft(yLinearScale);

    // Append x axis
    var xAxis = chartGroup.append("g")
        .classed("x-axis", true)
        .attr("transform", `translate(0, ${height})`)
        .call(bottomAxis);

    // Append y axis
    var yAxis = chartGroup.append("g")
        .classed("y-axis", true)
        .call(leftAxis);

    // Append initial circles
    var circlesGroup = chartGroup.selectAll("circle") // If "circle" doesn't work use "div"...
        .data(ppaWeatherData)
        .enter()
        .append("circle")
        .attr("cx", d => xLinearScale(d[chosenXAxis]))
        .attr("cy", d => yLinearScale(d[chosenYAxis]))
        .attr("r", 3)
        .classed("circles", true);

    // Create group for all labels
    var xLabelsGroup = chartGroup.append("g")
        .attr("transform", `translate(${width / 2}, ${height + 10})`);

    // Append x labels
    var tempLabel = xLabelsGroup.append("text")
        .attr("x", 0)
        .attr("y", 20)
        .attr("value", "temp_feels_like")
        .attr("dy", "0.75em")
        .classed("x-label active aText", true)
        .text(`"Feels-Like" Temperature in an Hour (°F)`);
    
    var rainLabel = xLabelsGroup.append("text")
        .attr("x", 0)
        .attr("y", 40)
        .attr("value", "rain_1h")
        .attr("dy", "0.75em")
        .classed("x-label inactive aText", true)
        .text("Precipitation Volume for the Last Hour (mm)");

    var snowLabel = xLabelsGroup.append("text")
        .attr("x", 0)
        .attr("y", 60)
        .attr("value", "snow_3h")
        .attr("dy", "0.75em")
        .classed("x-label inactive aText", true)
        .text("Snow Volume for the Last 3 Hours (mm)");
    
    var humidityLabel = xLabelsGroup.append("text")
        .attr("x", 0)
        .attr("y", 80)
        .attr("value", "humidity")
        .attr("dy", "0.75em")
        .classed("x-label inactive aText", true)
        .text("Humidity Level (%)");

    var monthLabel = xLabelsGroup.append("text")
        .attr("x", 0)
        .attr("y", 100)
        .attr("value", "datetime")
        .attr("dy", "0.75em")
        .classed("x-label inactive aText", true)
        .text("Months");

    // Append y labels
    var yLabelsGroup = chartGroup.append("g")
        .attr("transform", `translate(-30, ${height / 2})`);

    var ticketsLabel = yLabelsGroup.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", 0)
        .attr("y", -20)
        .attr("value", "total_ticket_number")
        .attr("dy", "0.75em")
        .classed("y-label active aText", true)
        .text("Total Tickets Issued in an Hour");

    var fineLabel = yLabelsGroup.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", 0)
        .attr("y", -40)
        .attr("value", "fine")
        .attr("dy", "0.75em")
        .classed("y-label inactive aText", true)
        .text("Average Ticket Fine in an Hour ($)");

    // Update tooltips with info from the new axes on the new circlesGroup using the created updateToolTip() function
    circlesGroup = updateToolTip(chosenXAxis, chosenYAxis, circlesGroup);

    // X-axis labels event listener
    xLabelsGroup.selectAll("text").on("click", function() {
        // Get value of the selected x label
        var xValue = d3.select(this).attr("value");
        if (xValue !== chosenXAxis) {

            // Replace chosenXAxis
            chosenXAxis = xValue;

            // For backend visibility
            console.log(`X-variable shown: ${chosenXAxis}`);
            console.log(`Y-variable shown: ${chosenYAxis}`);

            // Update x scale for new data using the created xScale() function
            if (chosenXAxis === "datetime") {
                xLinearScale = xScaleTime(ppaWeatherData, chosenXAxis);
            }
            else {
                xLinearScale = xScale(ppaWeatherData, chosenXAxis);
            }
            
            // Update x axis with transition using the created renderXAxis() function
            xAxis = renderXAxis(xLinearScale, xAxis);

            // Update circles with new x and y values using the created renderCircles() function
            circlesGroup = renderCircles(circlesGroup, xLinearScale, yLinearScale, chosenXAxis, chosenYAxis);

            // Update text with new x and y values using the created renderCircleText() function
            // textGroup = renderCircleText(textGroup, xLinearScale, yLinearScale, chosenXAxis, chosenYAxis);

            // Update tooltips with new info
            circlesGroup = updateToolTip(chosenXAxis, chosenYAxis, circlesGroup);

            // Change classes to change bold text for x labels
            if (chosenXAxis === "temp_feels_like") {
                tempLabel
                    .classed("active", true)
                    .classed("inactive", false);
                rainLabel
                    .classed("active", false)
                    .classed("inactive", true);
                snowLabel
                    .classed("active", false)
                    .classed("inactive", true);
                humidityLabel
                    .classed("active", false)
                    .classed("inactive", true);
                monthLabel
                    .classed("active", false)
                    .classed("inactive", true);
            }
            else if (chosenXAxis === "rain_1h") {
                rainLabel
                    .classed("active", true)
                    .classed("inactive", false);
                snowLabel
                    .classed("active", false)
                    .classed("inactive", true);
                humidityLabel
                    .classed("active", false)
                    .classed("inactive", true);
                monthLabel
                    .classed("active", false)
                    .classed("inactive", true);
                tempLabel
                    .classed("active", false)
                    .classed("inactive", true);
            }
            else if (chosenXAxis === "snow_3h") {
                snowLabel
                    .classed("active", true)
                    .classed("inactive", false);
                humidityLabel
                    .classed("active", false)
                    .classed("inactive", true);
                monthLabel
                    .classed("active", false)
                    .classed("inactive", true);
                tempLabel
                    .classed("active", false)
                    .classed("inactive", true);
                rainLabel
                    .classed("active", false)
                    .classed("inactive", true);
            }
            else if (chosenXAxis === "humidity") {
                humidityLabel
                    .classed("active", true)
                    .classed("inactive", false);
                monthLabel
                    .classed("active", false)
                    .classed("inactive", true);
                tempLabel
                    .classed("active", false)
                    .classed("inactive", true);
                rainLabel
                    .classed("active", false)
                    .classed("inactive", true);
                snowLabel
                    .classed("active", false)
                    .classed("inactive", true);
            }
            else if (chosenXAxis === "datetime") {
                monthLabel
                    .classed("active", true)
                    .classed("inactive", false);
                tempLabel
                    .classed("active", false)
                    .classed("inactive", true);
                rainLabel
                    .classed("active", false)
                    .classed("inactive", true);
                snowLabel
                    .classed("active", false)
                    .classed("inactive", true);
                humidityLabel
                    .classed("active", false)
                    .classed("inactive", true);
            }
        }
    });

    // Y-axis labels event listener
    yLabelsGroup.selectAll("text").on("click", function() {
        // Get value of the selected y label
        var yValue = d3.select(this).attr("value");
        if (yValue !== chosenYAxis) {

            // Replace chosenXAxis and/or chosenYAxis with xValue/yValue
            chosenYAxis = yValue;

            // For backend visibility
            console.log(`X-variable shown: ${chosenXAxis}`);
            console.log(`Y-variable shown: ${chosenYAxis}`);

            // Update y scale for new data using the created yScale() function
            yLinearScale = yScale(ppaWeatherData, chosenYAxis);

            // Update y axis with transition using the created renderYAxis() function
            yAxis = renderYAxis(yLinearScale, yAxis);

            // Update circles with new x and y values using the created renderCircles() function
            circlesGroup = renderCircles(circlesGroup, xLinearScale, yLinearScale, chosenXAxis, chosenYAxis);

            // Update text with new x and y values using the created renderCircleText() function
            // textGroup = renderCircleText(textGroup, xLinearScale, yLinearScale, chosenXAxis, chosenYAxis);

            // Update tooltips with new info
            circlesGroup = updateToolTip(chosenXAxis, chosenYAxis, circlesGroup);

            // Change classes to change bold text for y labels
            if (chosenYAxis === "total_ticket_number") {
                ticketsLabel
                    .classed("active", true)
                    .classed("inactive", false);
                fineLabel
                    .classed("active", false)
                    .classed("inactive", true);
            }
            else if (chosenYAxis === "fine") {
                fineLabel
                    .classed("active", true)
                    .classed("inactive", false);
                ticketsLabel
                    .classed("active", false)
                    .classed("inactive", true);
            }
        }
    });
});
