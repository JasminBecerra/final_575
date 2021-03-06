//main js script for 575 Final Project
//Authors: Alex Nelson, Jasmin Becerra & Jacob Clausen

//topojson for CPS networks included in data folder

//anonymous function to move variables to local scope
(function(){
	
	$(document).ready(function(){
		$("#myModal").modal('show');
	});
	
	

// //pseudo-global variables
	var attrArray = ["Average ACT Score", "Lunch Total", "Lunch Percent", "Cohort Dropout Rates 2016", "Cohort Graduation Rates 2016", "Personnel", "Non-Personnel", "Percent College Enrollment 2015", "White", "African American", "Asian / Pacific Islander", "Native American / Alaskan", "Hispanic", "Multi-Racial", "Asian", "Hawaiian / Pacific Islander", "Other"]; 
	var expressed = attrArray[0]; //initial attribute
	
	var colorClasses = [
        "#dadaeb",
        "#bcbddc",
        "#9e9ac8",
        "#756bb1",
        "#54278f"
    ];
	
	var districtSchoolOverlay = false;
	var charterSchoolOverlay = false;
	


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
	
    var projection = d3.geoAlbers()
        .center([0, 41.835])
        .rotate([87.75, 0, 0])
        .parallels([41.79, 41.88])
        .scale(85000.00)
        .translate([width / 2, height / 2]);

	//create path generator for ourmap
	var path = d3.geoPath()
    	.projection(projection);

    //use d3.queue to parallelize asynchronous data loading
    d3.queue()
        .defer(d3.csv, "data/data_project2.csv") //load attributes from CPS data
        .defer(d3.json, "data/ChicagoNetworksT.topojson") //load spatial data for choropleth map
		.defer(d3.json, "data/cpsDistrictData_529.geojson") //load districts spatial data
		.defer(d3.json, "data/cpsCharterData2.geojson") //load districts spatial data
        .await(callback); //send data to callback function
		

		

//function to populate the dom with topojson data
    function callback(error, csvData, chicago, dis, chtr){
		
    	//translate chicago comm areas to topojson
		var chicagoNets = topojson.feature(chicago, chicago.objects.ChicagoNetworks).features;

		//join csv data to GeoJSON enumeration units
        chicagoNets = joinData(chicagoNets, csvData);
		
		//create the color scale
        var colorScale = makeColorScale(csvData);

        //add enumeration units to ourmap
        setEnumerationUnits(chicagoNets, ourmap, path, colorScale);
		
		//add menu panel to map
		createMenu(csvData, chicagoNets, path, colorScale);
		
		setNetworkBox();
		
		//overlay high school points
		overlay(ourmap, chtr, dis, projection);
		
		
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
        var desc = networks.append("desc")
            .text('{"stroke": "white", "stroke-width": "1px"}');


};

function createDistrictSchools (ourmap, dis, projection){
		var disSchools = ourmap.selectAll(".dis-schools")
			.data(dis.features)
			.enter()
			.append("circle")
			.attr("class", "dis-schools")
			.attr("cx", function(d){	
				var coords = projection(d.geometry.coordinates);
				return coords[0];
			})
			.attr("cy", function(d){	
				var coords = projection(d.geometry.coordinates);
				return coords[1];
			})
			.attr("r", 5)
			.on("mouseover", function(d){
			d3.select("h2").text(d.properties.school_nm);
			d3.select(this).attr("class","dis-schools hover");
			highlight(d.properties);
			})
			.on("mouseout", function(d){
			d3.select("h2").text("");
			d3.select(this).attr("class","dis-schools");
			dehighlight(d.properties);
			});
};

function createCharterSchools (ourmap, chtr, projection){
		var chtrSchools = ourmap.selectAll(".chtr-schools")
			.data(chtr.features)
			.enter()
			.append("circle")
			.attr("class", "chtr-schools")
			.attr("cx", function(d){	
				var coords = projection(d.geometry.coordinates);
				return coords[0];
			})
			.attr("cy", function(d){	
				var coords = projection(d.geometry.coordinates);
				return coords[1];
			})
			.attr("r", 5)
			.on("mouseover", function(d){
			d3.select("h2").text(d.properties.school_nm);
			d3.select(this).attr("class","chtr-schools hover");
			highlight(d.properties);
			})
			.on("mouseout", function(d){
			d3.select("h2").text("");
			d3.select(this).attr("class","chtr-schools");
			dehighlight(d.properties);
			});
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

function setNetworkBox(){
    var width = window.innerWidth * 0.25,
		height = 650;

    var box = d3.select("network-box")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("class", "box")
		.attr("class", "col-md-2");
		
	var boxTitle = box.append("text")
        .attr("x", 40)
        .attr("y", 30)
        .attr("class", "boxTitle")
        .text(expressed + " in each country");
	
};



function highlight(props){
    //change stroke
    var selected = d3.selectAll("." + props.network_num.replace(/ /g, '-'))
        .style("stroke", "#FF66FF")
        .style("stroke-width", "4");
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
    var labelAttribute = "<b>"+ expressed +
        "</b><h1>" + props[expressed] + "</h1>";

		if (Boolean(props[expressed]) == true) {
			if (expressed == attrArray[0]) {
				labelAttribute = "<b>Network Atrribute:</b><br>" + "ACT Score Average:" + "<h1>" + props[attrArray[0]] + "</h1>" + "<br><br>" + "<b>Network Race Demographics:</b>" + "<br>" + "Percentage of White Students:" + "<h1>" + props[attrArray[8]] + "%</h1>" +  "<br>" + "Percentage of African American Students:" + "<h1>" + props[attrArray[9]] + "%</h1>" +  "<br>" + "Percentage of Hispanic Students:" + "<h1>" + props[attrArray[12]] + "%</h1>" +  "<br>" + "Percentage of Asian Students:" + "<h1>" + props[attrArray[14]] + "%</h1>"
			} else if (expressed == attrArray[2]) {
				labelAttribute = "<b>Network Atrribute:</b><br>" + "Students receiving Free/Reduced Lunches:" + "<h1>" + props[attrArray[2]]+ "%</h1>" + "<br><br>"  + "<b>Network Race Demographics:</b>" + "<br>" + "Percentage of White Students:" + "<h1>" + props[attrArray[8]] + "%</h1>" +  "<br>" + "Percentage of African American Students:" + "<h1>" + props[attrArray[9]] + "%</h1>" +  "<br>" + "Percentage of Hispanic Students:" + "<h1>" + props[attrArray[12]] + "%</h1>" +  "<br>" + "Percentage of Asian Students:" + "<h1>" + props[attrArray[14]] + "%</h1>"
			} else if (expressed == attrArray[3]) {
				labelAttribute = "<b>Network Atrribute:</b><br>" + "Dropout Rate:" + "<h1>" + props[attrArray[3]]+"%</h1>" + "<br><br>" + "<b>Network Race Demographics:</b>" + "<br>" + "Percentage of White Students:" + "<h1>" + props[attrArray[8]] + "%</h1>" +  "<br>" + "Percentage of African American Students:" + "<h1>" + props[attrArray[9]] + "%</h1>" +  "<br>" + "Percentage of Hispanic Students:" + "<h1>" + props[attrArray[12]] + "%</h1>" +  "<br>" + "Percentage of Asian Students:" + "<h1>" + props[attrArray[14]] + "%</h1>"
			} else if (expressed == attrArray[4]) {
				labelAttribute = "<b>Network Atrribute:</b><br>" + "Graduation Rate:" + "<h1>" + props[attrArray[4]] + "%</h1>" + "<br><br>" + "<b>Network Race Demographics:</b>" + "<br>" + "Percentage of White Students:" + "<h1>" + props[attrArray[8]] + "%</h1>" +  "<br>" + "Percentage of African American Students:" + "<h1>" + props[attrArray[9]] + "%</h1>" +  "<br>" + "Percentage of Hispanic Students:" + "<h1>" + props[attrArray[12]] + "%</h1>" +  "<br>" + "Percentage of Asian Students:" + "<h1>" + props[attrArray[14]] + "%</h1>"
			} else if (expressed == attrArray[7]) {
				labelAttribute = "<b>Network Atrribute:</b><br>" + "College Enrollment 2015:" + "<h1>" + props[attrArray[7]]+"%</h1>" + "<br><br>" + "<b>Network Race Demographics:</b>" + "<br>" + "Percentage of White Students:" + "<h1>" + props[attrArray[8]] + "%</h1>" +  "<br>" + "Percentage of African American Students:" + "<h1>" + props[attrArray[9]] + "%</h1>" +  "<br>" + "Percentage of Hispanic Students:" + "<h1>" + props[attrArray[12]] + "%</h1>" +  "<br>" + "Percentage of Asian Students:" + "<h1>" + props[attrArray[14]] + "%</h1>"
			};
		}else if (props.hasOwnProperty("school_nm")){
			labelAttribute = "School Name:" + "<h1>" + props.school_nm + "</h1>" + "<br>" + "School Address:" + "<h1>" + props.sch_addr + "</h1>" + "<br>" + "School Type:" + "<h1>" + props.sch_type + "</h1>" + "<br>" + "ACT Composite Average:" + "<h1>" + props.act_composite_avg + "</h1>" + "<br>" + "Percent Free/Reduced Lunch:" + "<h1>" + props.pct_free_red_lunch + "</h1>" + "<br>" + "Dropout Rate 2016:" + "<h1>" + props.dropout_rate_16 + "</h1>" + "<br>" + "Graduation Rate 2016:" + "<h1>" + props.grad_rate_16 + "</h1>" + "<br>" + "College Enrollment (%) 2015:" + "<h1>" + props.Enrollment_Pct + "</h1>"
			
		} else { //if no data associated with selection, display "No data"
			labelAttribute = "<h1>No Data</h1>";
		};


    //create info label div
    var infolabel = d3.select("body")
        .append("div")
        .attr("class", "infolabel")
        .attr("id", props.network_num + "_label")
        .html(labelAttribute);

		var regionName = infolabel.append("div")
		    .attr("class", "labelname")
		    .html(props.network_num);

};

//menu items function
function createMenu(csvData, chicagoNets, path, colorScale){
	$(".ACTaverage").click(function(){ 
        expressed = attrArray[0];

        d3.selectAll(".networks").on("change", function(){
					changeAttribute(this.value, csvData)
			})
			.select("desc")
                .text(function(d) {
					changeAttribute(this.value, csvData);
					setEnumerationUnits(chicagoNets, ourmap, path, colorScale);
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
					setEnumerationUnits(chicagoNets, ourmap, path, colorScale);
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
					setEnumerationUnits(chicagoNets, ourmap, path, colorScale);
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
					setEnumerationUnits(chicagoNets, ourmap, path, colorScale);
            });
    });
	
	$(".Enrollment").click(function(){ 
        expressed = attrArray[7];

        d3.selectAll(".networks").on("change", function(d){
                changeAttribute(this.value, csvData);
            })
            .select("desc")
                .text(function(d) {
                    changeAttribute(this.value, csvData);
					setEnumerationUnits(chicagoNets, ourmap, path, colorScale);
            });
    });
	
	$(".Closings").click(function(){ 
        expressed = attrArray[20];

        d3.selectAll(".networks").on("change", function(d){
                changeAttribute(this.value, csvData);
            })
            .select("desc")
                .text(function(d) {
                    changeAttribute(this.value, csvData);
					setEnumerationUnits(chicagoNets, ourmap, path, colorScale);
            });
    });
	
}; //end of create createMenu

//creates overlay of charter and district schools
function overlay(ourmap, chtr, dis, projection){
	$("#district-sch").click(function(){
        if (districtSchoolOverlay == false){
			createDistrictSchools (ourmap, dis, projection);
			districtSchoolOverlay = true;
			
        } else {
			removeDistrict = d3.selectAll(".dis-schools").remove();
			districtSchoolOverlay = false;
        }
    });
    
    $("#charter-sch").click(function(){
		if (charterSchoolOverlay == false){
			createCharterSchools (ourmap, chtr, projection);
			charterSchoolOverlay = true;
			
        } else {
			removeCharter = d3.selectAll(".chtr-schools").remove();
			charterSchoolOverlay = false;
        }
    });

}; //end of overlay function

})(); //last line of main.js
