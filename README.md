# Philly Parking Violations Analysis :parking: & Indications from Weather :cloud_with_rain: (UPenn Data Boot Camp)

*Last Updated: May 30, 2021*

**Highlevel**: This is an interactive web application that offers analytical insights into historical parking violations and the potential effects of various weather conditions in Philadelphia.<br>
**View the deployed app (Heroku) here**: https://philly-parking-violations.herokuapp.com/<br>

*View our presentation deck [here](https://docs.google.com/presentation/d/12zvvblExMmNb_WNNd9zoDT4At5H9TNzZK52N2xGuJ9o/edit?usp=sharing)*

<img src=images_highlights/parking_ticket_image.jpeg width="70%" alt="Header Image - A Parking Violation Ticket">

## Background

This was the second data analysis project in the Penn Data Boot Camp curriculum. The task was to **tell a story through data visulizations with a focus on providing users an interactive means to explore the data themselves.** As a team, most of us lived in the Philadelphia region. Just like everybody else, we've also had the unpleasant experiences of being ticketed. These experiences were certainly no fun! While we support a system to regulate urban parking because as it is a necessity, they can surely ruin your day and hurt your wallet no matter how you got ticketed.

However, instead of being torn by the fact that we received a ticket, what we can do is to be more mindful about how we park, where we park, and when we park. We were very interested in how these tickets were issued by the PPA (Philadelphia Parking Authority) and wanted to provide deeper insights so hopefully our audience can make a more educated and smarter decision on how to park their cars. As a result, we set out to learn more about parking violations. Questions we had in mind: What is the most common type of parking violation? Where are they more likely to occur? How often are they issued? And in addition, could weather conditions affect ticket issuance behaviors?

### Data Source:
To answer the above questions, we:
* Retrieved the historical Philadelphia parking violations data from 2017 ([OpenDataPhilly](https://www.opendataphilly.org/dataset/parking-violations));
* Purchased the historical weather data in bulk from that same year ([OpenWeather API](https://openweathermap.org/history-bulk));
* Performed an API call to retrieve the GeoJSON (Polygon) that provides Philadelphia zip codes information ([OpenDataPhilly](https://www.opendataphilly.org/dataset/zip-codes))

## Methods & Approach

**Technical Diagram & Workflow**
![Workflow Technical Diagram](images_highlights/technical_diagram.png)

* Our application is a flask app.
* ETL (Extract, Transform, Load) processes were performed on the datasets we collected from the various sources listed above.
* Data was loaded into a SQLite database for local testing purposes but later migrated to Heroku Postgres upon deployment.
* For consideration of the responsiveness and performance while loading/generating the visuals on our application, we decided to take a random sample of 30% of all the parking violations data in 2017 which still amounted to 400k+ rows. The violation count per month was consistent throughout the year thus we believed there would be minimal negative impact on our analysis.
* To perform various weather related analyses, tables were joined based on a speacial "datetime" column (in string format) which detailed aggregations down to every hour in the days throughout 2017.
* The visualizations were built using libraries including Plotly.js, Leaflet.js, and D3.js, etc.
* The application was deployed on Heroku.

## Highlights & Analyses

Below are some highlights of our application. You can also view our presentation deck [here](https://docs.google.com/presentation/d/12zvvblExMmNb_WNNd9zoDT4At5H9TNzZK52N2xGuJ9o/edit?usp=sharing).

#### Top 10 Violation Types (Plotly.js)
<img src=images_highlights/top_10_violations.png width="80%" alt="Bar Chart - Top 10 Violation Types">

* "Meter Expired CC" (CC means Center City) was not the most expensive offense but was the most commonly issued ticket.

#### Top 10 States by Ticket Count & Average Fine (Plotly.js)
<img src=images_highlights/top_10_states_count.png width="40%" alt="Top 10 States Pie Chart by Count of Tickets Received"><img src=images_highlights/top_10_states_fine.png width="40%" alt="Top 10 States Pie Chart by the Average of Ticket Fines">

* Looking at the two states most adjacent to Pennsylvania and closest Philadelphia, visitors from New Jersey received more tickets than those from Delaware likely because they made more trips to Philly in 2017 since they're geologically closer.
* Not surprisingly, the top 10 states are all located on the east coast. Some of the farther states also made it to the top 10, such as Florida, Indiana and Massachusetts.
* The state vehicle license from Indiana was fined the most on average besides the "VN" catogery which stood for "Veteran".

#### Average Violation Count per Hour by Weather Types (Plotly.js)
<img src=images_highlights/avg_violation_count_vs_sub_weather.png width="100%" alt="Bubble Chart - Average Violation Count per Hour by Sub-Weather Types">

* To ask the question: Could weather conditions affect ticket issuance behaviors? Essentially we want to know if it's less (or more) likely to receive a ticket when there's an inclement weather condition, meaning when it's raining or snowing, etc.
* To analyze if a certain weather condition has an impact on the ticket issurance behavior, we plotted weather types against the number of tickets on a bubble chart. We queried the total number of violations issued for the sub-weather types (Rain as a main type includes sub-types like light rain, moderate rain, and very heavy rain, etc.) AND the total number of hours in which those violations were recorded within. We then calculated the average which is what the y-axis represents. (Avg. hourly count = Total violation count for a weather / Total hours of a weather).
* The x-axis is color-coded based on weather conditions. By common sense, most of the weather conditions on the right (red) can be considered "good" or "normal" weathers, and most on the left (such as "thunderstorm with heavy rain") can be considered as "inclement" weathers for urban living. In addition, the size of the circles are based on the average hourly violation count.
* Looking at the visuals, something that surprised us was that the average counts for the most common weather conditions such as “sky is clear”, “few clouds”, “light rain", "moderate rain" were basically on par with each other. We did expect the average count for the sunny days to be higher than that of the rainy days because it's natural to think it isn't ideal (for the parking authority officers) to work in rain. However, the amount of precipitation didn't seem to have an astronomical effect on the amount of tickets PPA could issue.
* On the other hand, if we take a look at the two highest types, you would never think “thunderstorm with rain” and “very heavy rain” would have the highest average counts. The explanations could be either the inclement weather conditions created opporutunities for officers or exposed drivers to risks for more violations (depending on which side you are on)... To our knowledge, these two data points are outliers because the instances of these weather conditions were rare but the average counts were high within the limited instances thus skewing the data. In the next visualization - scatterplot, we will see the exact data point that resulted in that unexpectedly high hourly average violation count when there was a "very heavy rain".
* In additian to the rainy days, we observed the lowest average counts for snowy conditions. An explnation is that the drop of tickets issued was a result of fewer people going outdoor in snowy days rather than the officers deciding to work "less" in snowy days. Yet interestingly enough, the same pattern of count increase can be observed when you compare “snow” against “heavy snow”.

#### Violation Statistics vs. Weather Types (D3.js)
<img src=images_highlights/scatterplot_precipitation_vs_count.png width="90%" alt="Scatterplot - Parking Violation Statistics vs. Various Weather Metrics">

* Having looked at the average tickets issued per weather types, we decided to dive deeper into other weather metrics (such as temperatures and precipitation volumes) in the weather dataset to see if we can find any correlations.
* To do that, we built a scatter plot that shows various weather metrics on the x-axis and parking metrics on the y-axis. Each dot represents a complete hour with a specific weather type recorded for that time period. Interactivity such as CSS transitions and tooltips are built to explore different combinations of metrics interactively. Despite some patterns shown on the above bubble chart, we did not find any noticeable correlations between the variables in the scatterplot.
* As mentioned before, the high ticket count shown for the "very heavy rain" weather type is also plotted on the chart (far right). The average count remains high for that weather condition because that is the only date point.

#### Multi-Layered Parking Violation Map (Leaflet.js)
<img src=images_highlights/map_streets.png width="90%" alt="An interactive map with layers of heatmap, Philly zip codes, and selected violation as pins">

* To provide our users more ways to explore and understand parking violations in Philly, we also built an interactive map using Leaflet.
* Components/Layeres:
  * Responsive polygons of Philly zip codes
  * Heatmap of all violations based on recorded coordinates
  * Customized pins (with clickable pop-ups) of selected violations such as "Excessive Noise"
  * Selectable map styles (streets, light, dark) from Mapbox API
* Our consideration for performance was mostly centered on this map functionality. Again, note for our purpose the heatmap is fairly clustered already even with only 30% of randomly selected data.

<hr>

## Opportunities for Next Steps

* Plot a time series to explore how violation count changes throughout the day, week, or month.
* Explore other weather data points (e.g. wind speed) to see if there's any correlation 
* Research historical events as there could be external factors that might influence citation issuance (e.g. events, street closures)
* Since there are not as many rainy or snowy days in a typical year, for example, we could also make a focused scatterplot with data from multiple years only when there's rain.
* Since 2020 is a "different" year with COVID-19, more interesting sights can potentially be found if we collect data from that time period.
