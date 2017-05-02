//main js script for 575 Final Project

//topojson for CPS networks included in data folder

//anonymous function to move variables to local scope
(function(){
	
	$("#intro-panel").show(); //splash screen on start
	$("#help-info").hide(); //splash screen on start
	$("#help-text").hide(); //splash screen on start

// //pseudo-global variables
	var attrArray = ["Average ACT Score", "Lunch Total", "Lunch Percent", "Cohort Dropout Rates 2016", "Cohort Graduation Rates 2016", "Personnel", "Non-Personnel", "FY16 Budget", "White", "African American", "Asian / Pacific Islander", "Native American / Alaskan", "Hispanic", "Multi-Racial", "Asian", "Hawaiian / Pacific Islander", "Other"]; 
	var expressed = attrArray[0]; //initial attribute
	
	var colorClasses = [
        "#dadaeb",
        "#bcbddc",
        "#9e9ac8",
        "#756bb1",
        "#54278f"
    ];


// //list of attributes up there
// var expressed = attrArray[0]; //initial attribute


//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){
    //map frame dimensions
    var width = window.innerWidth * 0.30,
        height = 700;

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
        .scale(100000.00)
        .translate([width / 2, height / 2]);

	//create path generator for ourmap
	var path = d3.geoPath()
    	.projection(projection);


    //use d3.queue to parallelize asynchronous data loading
    d3.queue()
        .defer(d3.csv, "data/data_project.csv") //load attributes from CPS data
		.defer(d3.json, "data/us_states.topojson") //load background spatial data
        .defer(d3.json, "data/ChicagoNetworksT.topojson") //load spatial data for choropleth map
        .await(callback); //send data to callback function
		


//function to populate the dom with topojson data
    function callback(error, csvData, us, chicago){

		//setGraticule(ourmap, path);
		
    	//translate chicago comm areas to topojson
    	var usStates = topojson.feature(us, us.objects.USStates),
		chicagoNets = topojson.feature(chicago, chicago.objects.ChicagoNetworks).features;

		/*var unitedStates = ourmap.append("path")
            .datum(usStates)
            .attr("class", "unitedStates")
            .attr("d", path);*/
			
		//join csv data to GeoJSON enumeration units
        chicagoNets = joinData(chicagoNets, csvData);
		
		//create the color scale
        var colorScale = makeColorScale(csvData);

        //add enumeration units to ourmap
        setEnumerationUnits(chicagoNets, ourmap, path, colorScale);
		
		//add dropdown menu to the map
		createDropdown(csvData);
		
		//add menu panel to map
		createMenu(csvData);
		
		
        // // check
        // console.log(illinois);
        console.log(chicago);
		console.log(csvData);
    };

};

function joinData (chicagoNets, csvData){
    //testing dropout and grad data
    //using two attributes: dropoutr rates 2016, and gradaution rates 2016

    //loop through the dropout/grad csv file to assign each attribute to a netowrk geojson region
    for (var i=0; i<csvData.length; i++){
        var csvRegion = csvData[i]; //network regions
        var csvKey = csvRegion.network_num.replace(/ /g, '-'); //replace spaces with dashes


        // loop through geojson network regions to find the linked region
        for (var a=0; a<chicagoNets.length; a++){

            var geojsonProps = chicagoNets[a].properties; //geo properties
            var geojsonKey = geojsonProps.network_num.replace(/ /g, '-'); //geojson key


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
                return "networks " + d.properties.network_num.replace(/ /g, '-');
            })
            .attr("d", path)
			.style("fill", function(d){
            return choropleth(d.properties, colorScale);
			})
			.on("mouseover", function(d){
            highlight(d.properties);
			})
			.on("mouseout", function(d){
            dehighlight(d.properties);
			})
			.on("mousemove", moveLabel);
        var desc = networks.append("desc")
            .text('{"stroke": "white", "stroke-width": "1px"}');


};

//function to create color scale generator
function makeColorScale(data){

    //create color scale generator
    var colorScale = d3.scaleQuantile()
        .range(colorClasses);

    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };

    //assign array of expressed values as scale domain
    colorScale.domain(domainArray);
    return colorScale;
};

//function to test for data value and return color
function choropleth(props, colorScale){
    //make sure attribute value is a number
    var val = parseFloat(props[expressed]);
    //if attribute value exists, assign a color; otherwise assign gray
    if (typeof val == 'number' && !isNaN(val)){
        return colorScale(val);
    } else {
        return "#f2f0f7";
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

//function to create a dropdown menu for attribute selection
function createDropdown(csvData){
   //add select element
    var dropdown = d3.select("body")
        .append("select")
        .attr("class", "dropdown")
        .on("change", function(){
            changeAttribute(this.value, csvData)
        });

    //add initial option
    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Select Attribute");

    //add attribute name options
    var attrOptions = dropdown.selectAll("attrOptions")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d){ return d })
        .text(function(d){ return d });
};

//dropdown change listener handler
function changeAttribute(attribute, csvData){
//change the expressed attribute
    //expressed = attribute;

    //recreate the color scale
    var colorScale = makeColorScale(csvData);

    //recolor enumeration units
    var networks = d3.selectAll(".networks")
        .transition()
        .duration(800)
        .style("fill", function(d){
            return choropleth(d.properties, colorScale)
        })
};

function setInfoBox(csvData){
        var width = window.innerWidth * 0.30,
        height = 650;

    var box = d3.select("info-box")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("class", "box");
};

function highlight(props){
    //change stroke
    var selected = d3.selectAll("." + props.network_num.replace(/ /g, '-'))
        .style("stroke", "#FF66FF")
        .style("stroke-width", "4");
		console.log(props.network_num);
	setLabel(props);
};

//function to reset the element style on mouseout
function dehighlight(props){
	
    var selected = d3.selectAll("." + props.network_num.replace(/ /g, '-'))
        .style("stroke", function(){
            return getStyle(this, "stroke")
        })
       .style("stroke-width", function(){
            return getStyle(this, "stroke-width") 
        });  
		
    function getStyle(element, styleName){
        var styleText = d3.select(element)
            .select("desc")
            .text();

        var styleObject = JSON.parse(styleText);

        return styleObject[styleName];
		
    };
	d3.select(".infolabel")
        .remove();
};

function setLabel(props){
    //label content
    var labelAttribute = "<h1>" + props[expressed] +
        "</h1><b>" + expressed + "</b>";
		
	if (Boolean(props[expressed]) == true) {
        if (expressed == attrArray[0]) {
            labelAttribute = "<h1>" + props[expressed]+"</h1>" + "ACT score average"
        } else if (expressed == attrArray[1]) {
            labelAttribute = "<h1>" + props[expressed]+"</h1>" + "students receiving free/reduced lunches"
        } else if (expressed == attrArray[2]) {
            labelAttribute = "<h1>" + props[expressed]+"%</h1>" + "students receiving free/reduced lunches"
        } else if (expressed == attrArray[3]) {
            labelAttribute = "<h1>" + props[expressed]+"%</h1>" + "of students dropout"
        } else if (expressed == attrArray[4]) {
            labelAttribute = "<h1>" + props[expressed]+"%</h1>" + "of students graduating"
		} else if (expressed == attrArray[5]) {
            labelAttribute = "<h1>$" + props[expressed]+"</h1>" + "personnel"
		} else if (expressed == attrArray[6]) {
            labelAttribute = "<h1>$" + props[expressed]+"</h1>" + "non-personnel"
		} else if (expressed == attrArray[7]) {
            labelAttribute = "<h1>$" + props[expressed]+"</h1>" + "budget (2016)"
		} else if (expressed == attrArray[8]) {
            labelAttribute = "<h1>" + props[expressed]+"%</h1>" + "White students"
        } else if (expressed == attrArray[9]) {
            labelAttribute = "<h1>" + props[expressed]+"%</h1>" + "African American students"
		} else if (expressed == attrArray[10]) {
            labelAttribute = "<h1>" + props[expressed]+"%</h1>" + "Asian / Pacific Islander students"
		} else if (expressed == attrArray[11]) {
            labelAttribute = "<h1>" + props[expressed]+"%</h1>" + "Native American / Alaskan students"
		} else if (expressed == attrArray[12]) {
            labelAttribute = "<h1>" + props[expressed]+"%</h1>" + "Hispanic students"
		} else if (expressed == attrArray[13]) {
            labelAttribute = "<h1>" + props[expressed]+"%</h1>" + "Multi-racial students"
        } else if (expressed == attrArray[14]) {
            labelAttribute = "<h1>" + props[expressed]+"%</h1>" + "Asian students"
		} else if (expressed == attrArray[15]) {
            labelAttribute = "<h1>" + props[expressed]+"%</h1>" + "Hawaiian / Pacific Islander students"
		} else if (expressed == attrArray[16]) {
            labelAttribute = "<h1>" + props[expressed]+"%</h1>" + "Other race students"
		};
    } else { //if no data associated with selection, display "No data"
        labelAttribute = "<h1>No Data</h1>";
    };
		

    //create info label div
    var infolabel = d3.select("body")
        .append("div")
        .attr("class", "infolabel")
        .attr("id", props.network_num + "_label")
        .html(labelAttribute);

    var countryName = infolabel.append("div")
        .attr("class", "labelname")
        .html(props.network_num);
};

//function to move info label with mouse
function moveLabel(){
    //get width of label
    var labelWidth = d3.select(".infolabel")
        .node()
        .getBoundingClientRect()
        .width;

    //use coordinates of mousemove event to set label coordinates
    var x1 = d3.event.clientX + 10,
        y1 = d3.event.clientY - 75,
        x2 = d3.event.clientX - labelWidth - 10,
        y2 = d3.event.clientY + 25;

    //horizontal label coordinate, testing for overflow
    var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1; 
    //vertical label coordinate, testing for overflow
    var y = d3.event.clientY < 75 ? y2 : y1; 

    d3.select(".infolabel")
        .style("left", x + "px")
        .style("top", y + "px");
};



//menu items function
function createMenu(csvData){
	$(".ACTaverage").click(function(){ 
        expressed = attrArray[0];

        d3.selectAll(".networks").on("change", function(){
					changeAttribute(this.value, csvData)
			})
            .select("desc")
                .text(function(d) {
                    changeAttribute(this.value, csvData);
            });
    });
	
	$(".Lunch").click(function(){ 
        expressed = attrArray[2];

        d3.selectAll(".networks").on("change", function(d){
                changeAttribute(this.value, csvData);
            })
            .select("desc")
                .text(function(d) {
                    changeAttribute(this.value, csvData);
            });
    });
	
	$(".Dropout").click(function(){ 
        expressed = attrArray[3];

        d3.selectAll(".networks").on("change", function(d){
                changeAttribute(this.value, csvData);
            })
            .select("desc")
                .text(function(d) {
                    changeAttribute(this.value, csvData);
            });
    });
	
	$(".Graduation").click(function(){ 
        expressed = attrArray[4];

        d3.selectAll(".networks").on("change", function(d){
                changeAttribute(this.value, csvData);
            })
            .select("desc")
                .text(function(d) {
                    changeAttribute(this.value, csvData);
            });
    });
	
	$(".Budget").click(function(){ 
        expressed = attrArray[5];

        d3.selectAll(".networks").on("change", function(d){
                changeAttribute(this.value, csvData);
            })
            .select("desc")
                .text(function(d) {
                    changeAttribute(this.value, csvData);
            });
    });
	
	$(".Closings").click(function(){ 
        expressed = attrArray[6];

        d3.selectAll(".networks").on("change", function(d){
                changeAttribute(this.value, csvData);
            })
            .select("desc")
                .text(function(d) {
                    changeAttribute(this.value, csvData);
            });
    });
	
};



})(); //last line of main.js
