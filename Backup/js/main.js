//main js script for 575 Final Project

//topojson for CPS networks included in data folder


//anonymous function to move variables to local scope
(function(){

// //pseudo-global variables
// var attrArray = []; 


// //list of attributes up there
// var expressed = attrArray[0]; //initial attribute


//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){
    //map frame dimensions
    var width = 600,
        height = 590;

	//container for map
	var ourmap = d3.select("body")
		.append("svg")
		.attr("class", "ourmap")
		.attr("width", width)
		.attr("height", height);

	//create Albers equal area conic projection centered on Chicago
    // try geo.albers or geoAlbers
    var projection = d3.geoAlbers()
        .center([0, 41.835])
        .rotate([87.75, 0, 0])
        .parallels([41.79, 41.88])
        .scale(80000.00)
        .translate([width / 2, height / 2]);

	//create path generator for ourmap
	var path = d3.geoPath()
    	.projection(projection);


    //use d3.queue to parallelize asynchronous data loading
    d3.queue()
        // .defer(d3.csv, "") //load attributes from CPS data
        .defer(d3.json, "data/ChicagoNetworksT.topojson") //load spatial data for choropleth map
        .await(callback); //send data to callback function


//function to populate the dom with topojson data
    function callback(error, chicago){

    	//translate chicago comm areas to topojson
    	var chicagoNets = topojson.feature(chicago, chicago.objects.ChicagoNetworks).features;



        //add enumeration units to ourmap
        setEnumerationUnits(chicagoNets, ourmap, path);

        // // check
        // console.log(illinois);
        console.log(chicago);
    };

};


function setEnumerationUnits(chicagoNets, ourmap, path){
        //adding chicago community areas/neighborhoods to ourmap
        var networks = ourmap.selectAll(".networks")
            .data(chicagoNets)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "networks " + d.properties.networks;
            })
            .attr("d", path)

        var desc = networks.append("desc")
            .text('{"stroke": "white", "stroke-width": "1px"}');


};





})(); //last line of main.js