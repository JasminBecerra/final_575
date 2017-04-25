//main js script for 575 Final Project

//topojson for CPS networks included in data folder



//anonymous function to move variables to local scope
(function(){

// //pseudo-global variables
// var attrArray = []; 

var attrArray = ["Cohort Dropout Rates 2016", "Cohort Graduation Rates 2016"]
var expressed = attrArray[0]; 


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

        chicagoNets = joinData(chicagoNets, csvData);

        var colorScale = makeColorScale(csvData);

        //add enumeration units to ourmap
        setEnumerationUnits(chicagoNets, ourmap, path, colorScale);

        // // check
        // console.log(illinois);
        console.log(chicago);
        console.log(csvData);
    };

};

function joinData (chicagoNets, csvData){
    //testing dropout and grad data
    //using two attributes: dropoutr rates 2016, and gradaution rates 2016
    var attrArray = ["Cohort Dropout Rates 2016", "Cohort Graduation Rates 2016"]
    var expressed = attrArray[0]; 
    //loop through the dropout/grad csv file to assign each attribute to a netowrk geojson region
    for (var i=0; i<csvData.length; i++){
        var csvRegion = csvData[i]; //network regions
        var csvKey = csvRegion.network_num.replace(/ /g, '_'); //replace spaces with underscores


        // loop through geojson network regions to find the linked region
        for (var a=0; a<chicagoNets.length; a++){

            var geojsonProps = chicagoNets[a].properties; //geo properties
            var geojsonKey = geojsonProps.network_num.replace(/ /g, '_'); //geojson key

            console.log(geojsonKey, csvKey);

            //match the keys! transfer the data over to enumeration unit
            if (geojsonKey == csvKey){

                //assign attributes and values
                attrArray.forEach(function(attr){
                    var val = parseFloat(csvRegion[attr]);
                    geojsonProps[attr] = val;
                });
            };
        };
    };
    return chicagoNets;
};


function setEnumerationUnits(chicagoNets, ourmap, path, colorScale){
        //adding chicago community areas/neighborhoods to ourmap
        var networks = ourmap.selectAll(".networks")
            .data(chicagoNets)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "networks " + d.properties.network_num.replace(/ /g, '_');
            })
            .attr("d", path)
            .style("fill", function(d){
                console.log(d.properties);
             return choropleth(d.properties, colorScale);
                });

        var desc = networks.append("desc")
            .text('{"stroke": "#000", "stroke-width": "1px"}');

};

//func to create color scale gen
function makeColorScale(data){
    //colors for class breaks
    var colorClasses = [
        "#a6bddb",
        "#67a9cf",
        "#1c9099",
        "#016c59"
    ];

    //create color scale gen
    var colorScale = d3.scaleThreshold()
        .range(colorClasses);

    //build array of values (for the expressed attribute)
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };

    //cluster data using ckmeans clustering algorithm to create jenks natural breaks
    var clusters = ss.ckmeans(domainArray, 4);
    //reset domain array to cluster mins
    domainArray = clusters.map(function(d){
        return d3.min(d);
    });
    //remove first value from domain array to create class breakpoints
    domainArray.shift();

    //assign array of last 4 cluster mins as domain
    colorScale.domain(domainArray);

    return colorScale;

};

//function to test for data value and return color (i was getting a "cannot generate mroe classes than..." error, hope this helps!)
function choropleth(props, colorScale){
    //make sure attribute value is a number
    var val = parseFloat(props[expressed]);
    //if attribute value exists, assign a color; otherwise assign gray
    if (typeof val == 'number' && !isNaN(val)){
        return colorScale(val);
    } else {
        return "#CCC";
    };
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