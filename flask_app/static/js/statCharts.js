// Build our Count & Avg. Fine by Violation Type bar chart
d3.json("/api/violation_bar").then((violationData) => {

    // console.log(violationData);

    // Only plotting the top 10 violation types
    violationDescription = violationData.description.slice(0,10);
    violationCount = violationData.count.slice(0,10);
    violationFine = violationData.avg_fine.slice(0,10);

    // Build our Plotly bar chart
    var traceViolationCount = {
        x: violationDescription,
        y: violationCount,
        type: "bar",
        name: "Count"
    };

    var traceViolationFine = {
        x: violationDescription,
        y: violationFine,
        type: "bar",
        name: "Fine ($)",
        xaxis: "x2",
        yaxis: "y2"
        
    };

    var dataViolation = [traceViolationCount, traceViolationFine];

    var layoutViolation = {
            title: "Top 10 Violations by Count & Their Average Fine",
            xaxis: {showticklabels: false},
            xaxis2: {
                // tickangle: -90,
                showticklabels: true
            },
            grid: {rows: 2, columns: 1, pattern: 'independent'},
            height: 580,
            margin: {
                b: 220
            }
        };

    Plotly.newPlot("violation-bar", dataViolation, layoutViolation, {responsive: true});
});


// Build our Count by State Type bar chart
d3.json("/api/state_pie").then((stateData) => {

    // console.log(stateData);

    // Create a Plotly pie chart for violation count by the top 10 states in Philly
    var traceStateCount = {
            labels: stateData.state.slice(0, 10),
            values: stateData.count.slice(0, 10),
            type: 'pie'
        };
        
    var dataStateCount = [traceStateCount];
    
    var layoutStateCount = {
        title: "Top 10 States by Count"
    };

    Plotly.newPlot("state-pie-count", dataStateCount, layoutStateCount, {responsive: true});

    // Create another pie chart for average fine
    var traceStateFine = {
        labels: stateData.state.slice(0, 10),
        values: stateData.avg_fine.slice(0, 10),
        type: 'pie',
        textinfo: "value"
    };
    
    var dataStateFine = [traceStateFine];

    var layoutStateFine = {
        title: "Top 10 States by Avg. Fine"
    };

    Plotly.newPlot("state-pie-fine", dataStateFine, layoutStateFine, {responsive: true});
});

// Build our Bubble chart
d3.json("/api/weather_bubble").then((weatherData) => {

    // console.log(weatherData);

    weatherData.weather_id.forEach((data) => {
        data.weather_id = +data.weather_id;
    })

    // Scale down the market size so the plot is more readable
    var markerSize = weatherData.anon_ticket_number.map(value => value/10);

    // Create a Plotly bubble chart
    var traceWeatherBubble = {
        x: weatherData.weather_main,
        y: weatherData.anon_ticket_number,
        text: weatherData.weather_description,
        mode: 'markers',
        marker: {
            color: weatherData.weather_id,
            size: markerSize
        }
      };
    
    var dataWeatherBubble = [traceWeatherBubble];

    var layoutWeatherBubble = {
        title: "Violation Count vs. Weather",
        xaxis: {title: "Main Weather Types"},
        yaxis: {title: "Number of Violations for Each Weather Type"}
    };

    Plotly.newPlot("weather-bubble", dataWeatherBubble, layoutWeatherBubble, {responsive: true});
});

// Build another Bubble chart for average numbers
d3.json("/api/weather_bubble_avg").then((weatherDataAvg) => {

    // console.log(weatherDataAvg);

    weatherDataAvg.weather_id.forEach((data) => {
        data.weather_id = +data.weather_id;
    });

    // Scale down the market size so the plot is more readable
    var markerSizeAvg = weatherDataAvg.ticket_count.map(value => value/2);

    // Create a Plotly bubble chart
    var traceWeatherBubbleAvg = {
        x: weatherDataAvg.weather_description,
        y: weatherDataAvg.ticket_count,
        text: weatherDataAvg.weather_description,
        mode: 'markers',
        marker: {
            color: weatherDataAvg.weather_id,
            size: markerSizeAvg
        }
      };
    
    var dataWeatherBubbleAvg = [traceWeatherBubbleAvg];

    var layoutWeatherBubbleAvg = {
        title: "Avg. Violation per Hour vs. Sub-Weather",
        xaxis: {title: "Sub-Weather Types"},
        yaxis: {title: "Avg. Hourly Violations for Each Sub-Weather Type"},
        height: 600,
        margin: {
            b: 200
        }
    };

    Plotly.newPlot("weather-bubble-avg", dataWeatherBubbleAvg, layoutWeatherBubbleAvg, {responsive: true});
});
