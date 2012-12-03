function initialize() {
    // Map Manager
    var mapManager = new MapManager({
        containerDivId : "map_canvas",
        center : { lat: -34.773204, lng: -58.348633 },
        zoom : 9,
        mapTypeId : google.maps.MapTypeId.HYBRID,
        ftId : "17pi-HfO1Dfm5Shp63i1HBxYNmV8dAGg1u20WvOQ",
        ftLimitColumnName : "'limite'",
        urbAreaFilename : "urbArea",
        urbFootprintFilename : "urbFootprint",
        newDevelopmentFilename : "newDevelopment",
        activeTownshipColor: "#00FF00"
    });

    var ftClient = new FTClient("17pi-HfO1Dfm5Shp63i1HBxYNmV8dAGg1u20WvOQ");
    ftClient.query(['Nombre','provincia'], null, " provincia asc", function(data) {
        var rows = data.table.rows;

        var townshipNames = new Array();

        for (var i=0; i<rows.length; i++) {
            var name = rows[i][0];
            var zone = rows[i][1];
            
            mapManager.addTownship(name);
            townshipNames.push({label: name , category: zone});
        }
        fillAutoComplete(townshipNames,mapManager);
    });

    initControls(mapManager);
}

function initControls(mapManager) {
    var self = this;

    // Time slider
    $("#slider-time").slider({
        max: 1,
        min: 0,
        value: 0,
        disabled: true,
        animate: "fast",
        slide: function(event, ui) {
            mapManager.setHistoricalTime(ui.value);
        }
    });

    // Urban Area slider
    $("#slider-urbArea").slider({
        max: 100,
        min: 0,
        value: 50,
        disabled: true,
        animate: "fast",
        slide: function(event, ui) {
            var township = mapManager.getActiveTownship();
            township.setUrbAreaOpacity(ui.value/100);
        }
    });

    // Urban Footprint slider
    $("#slider-urbFootprint").slider({
        max: 100,
        min: 0,
        value: 50,
        disabled: true,
        animate: "fast",
        slide: function(event, ui) {
            var township = mapManager.getActiveTownship();
            township.setUrbFootprintOpacity(ui.value/100);
        }
    });

    // New Development slider
    $("#slider-newDevelopment").slider({
        max: 100,
        min: 0,
        value: 50,
        disabled: true,
        animate: "fast",
        slide: function(event, ui) {
            var township = mapManager.getActiveTownship();
            township.getNewDevelopment().setOpacity(ui.value/100);
        }
    });

    // Current Township checkbox
    $("#currentTownship").change(function(event) {
        var checked = $(this).attr("checked") ? true : false;
        var township = mapManager.getActiveTownship();
        mapManager.showHideLimit(township.getName(), checked);
    });

    // Other Township checkbox
    $("#otherTownship").change(function(event) {
        var checked = $(this).attr("checked") ? true : false;
        mapManager.showHideNonActiveLimits(checked);
    });
}

function enableSlider(sliderDivId) {
    if ($("#" + sliderDivId).slider("option","disabled")) {
        $("#" + sliderDivId).slider("option","disabled", false);
    }
}

function enableCheckbox(checkboxId, reset) {
    var $checkbox = $("#"+checkboxId);
    $checkbox.removeAttr("disabled");
    var checked = $checkbox.attr("checked") ? true : false;
    if (reset && !checked)
        $checkbox.attr("checked", true);
}

function resetControls(mapManager) {
    var activeTownship = mapManager.getActiveTownship();

    $("#controls").removeClass("disabled");
    $("#map-options").removeClass("disabled");
    enableSlider("slider-time");
    enableSlider("slider-urbArea");
    enableSlider("slider-urbFootprint");
    enableSlider("slider-newDevelopment");
    enableCheckbox("currentTownship", true);
    enableCheckbox("otherTownship", false);

    $("#slider-limit").slider("value", 1);
    $("#slider-urbArea").slider("value", activeTownship.getUrbArea().getOpacity()*100);
    $("#slider-urbFootprint").slider("value", activeTownship.getUrbFootprint().getOpacity()*100);
    $("#slider-newDevelopment").slider("value", activeTownship.getNewDevelopment().getOpacity()*100);
}

function fillAutoComplete(townshipNames,mapManager){

    //stuff to draw category menus
    $.widget( "custom.catcomplete", $.ui.autocomplete, {
        _renderMenu: function( ul, items ) {
            var that = this,
                currentCategory = "";
            $.each( items, function( index, item ) {
                if ( item.category != currentCategory ) {
                    ul.append( "<li class='ui-autocomplete-category'>" + item.category + "</li>" );
                    currentCategory = item.category;
                }
                that._renderItemData( ul, item );
            });
        }
    });

    $("#municipios").catcomplete({
        source: townshipNames,
        select: function(event,ui){
            mapManager.setActiveTownship(ui.item.value);
            $(this).blur();
        },
        minLength: 0
    });

}
