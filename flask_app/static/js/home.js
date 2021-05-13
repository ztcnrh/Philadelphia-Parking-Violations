// Add custom responsive stylings to clickable carousel objects

// Carousel "Previous" and "Next" buttons
buttons = d3.selectAll("button");

buttons.on("mouseover", function() {
    d3.select(this)
    .style("opacity", 0.5)
})
.on("mouseout", function() {
    d3.select(this)
    .style("opacity", 0.2)
    .style("background-color", "slateGray")
})
.on("click", function() {
    d3.select(this)
    .style("opacity", 0.6)
    .style("background-color", "steelBlue")
});
