//main js script for 575 Final Project
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
    var width = 700,
        height = 680;

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
        .defer(d3.csv, "data/GradDropout_2016Networks.csv") //load attributes from CPS data
        .defer(d3.json, "data/ChicagoNetworksT.topojson") //load spatial data for choropleth map
        .await(callback); //send data to callback function


//function to populate the dom with topojson data
    function callback(error, csvData, chicago){

        setGraticule(ourmap, path);
        
        //translate chicago comm areas to topojson
        var chicagoNets = topojson.feature(chicago, chicago.objects.ChicagoNetworks).features;



        //add enumeration units to ourmap
        setEnumerationUnits(chicagoNets, ourmap, path);

        // // check
        // console.log(illinois);
        console.log(chicago);
        console.log(csvData);
    };

};

function joinData (chicagoNets, csvdata){
    //testing dropout and grad data
    //using two attributes: dropoutr rates 2016, and gradaution rates 2016
    var attArray = ["Cohort Dropout Rates 2016", "Cohort Graduation Rates 2016"]

    //loop through the dropout/grad csv file to assign each attribute to a netowrk geojson region
    for (var i=0; i<csvData.length; i++){
        var csvRegion = csvData[i]; //network regions
        var csvKey = csvRegion.network_num.replace(/ /g, '_'); //replace spaces with underscores


        // loop through geojson network regions to find the linked region
        for (var a=0; a<chicagoNets.length; a++){

            var geojsonProps = chicagoNets[a].properties; //geo properties
            var geojsonKey = geojsonProps.networks.replace(/ /g, '_'); //geojson key


            //match the keys! transfer the data over to enumeration unit
            if (geojsonKey == csvKey){

                //assign attributes and values
                attArray.forEach(function(attr){
                    var val = parseFloat(csvRegion[attr]);
                    geojsonProps[attr] = val;
                });
            };
        };
    };
    return chicagoNets;
};


function setEnumerationUnits(chicagoNets, ourmap, path){
        //adding chicago community areas/neighborhoods to ourmap
        var networks = ourmap.selectAll(".networks")
            .data(chicagoNets)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "networks " + d.properties.network_num;
            })
            .attr("d", path)

        var desc = networks.append("desc")
            .text('{"stroke": "#000", "stroke-width": "1px"}');


};

function setGraticule(ourmap, path){
    //...GRATICULE BLOCKS FROM MODULE 8
        var graticule = d3.geoGraticule()
            .step([0.5, 0.5]); //place graticule lines every 5 degrees of longitude and latitude
            
        //create graticule background
        var gratBackground = ourmap.append("path")
            .datum(graticule.outline()) //bind graticule background
            .attr("class", "gratBackground") //assign class for styling
            .attr("d", path) //project graticule
            
        //create graticule lines
        var gratLines = ourmap.selectAll(".gratLines") //select graticule elements that will be created
            .data(graticule.lines()) //bind graticule lines to each element to be created
            .enter() //create an element for each datum
            .append("path") //append each element to the svg as a path element
            .attr("class", "gratLines") //assign class for styling
            .attr("d", path); //project graticule lines
};





})(); //last line of main.js
