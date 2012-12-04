var MapManager = function MapManager(options) {
    var self = this;

    this.options = options;

    // Initialization code
    var googleMapOptions = {
        zoom: options.zoom,
        center: new google.maps.LatLng(options.center.lat, options.center.lng),
        mapTypeId: options.mapTypeId,
        styles: [
            {
                "featureType": "road",
                "stylers": [
                    { "visibility": "off" }
                ]
            },{
                "featureType": "poi",
                "stylers": [
                    { "visibility": "off" }
                ]
            },{
                "featureType": "administrative",
                "stylers": [
                    { "visibility": "off" }
                ]
            },{
                "featureType": "administrative.province",
                "elementType": "geometry",
                "stylers": [
                    { "visibility": "on" }
                ]
            }
        ]
    };
    this.map = new google.maps.Map(document.getElementById(options.containerDivId), googleMapOptions);
    this.ftClient = new FTClient(options.ftId);

    this.historicalTime = 0;

    // Fusion Tables Layer
    this.ftQuery = {
        select: options.ftLimitColumnName,
        from: options.ftId
    };
    this.ftStyles = [
        {
            polygonOptions: {
                fillColor: "#FF0000",
                fillOpacity: 0.5
            }
        },
        {
            where: "Nombre = ''",
            polygonOptions: {
                fillColor: options.activeTownshipColor,
                fillOpacity: 0.5
            }
        }
    ];
    this.ftLayer = new google.maps.FusionTablesLayer({
        query: this.ftQuery,
        suppressInfoWindows: true,
        map: this.map,
        styles: this.ftStyles
    });
    google.maps.event.addListener(this.ftLayer, 'click', function(kmlEvent) {
        if ($("#municipios").attr("value")) {
            $("#municipios").attr("value", "");
        }
        self.setActiveTownship(kmlEvent.row['Nombre'].value)
    });

    this.ftId = options.ftId;

    this.townships = {};
    this.activeTownship = null;

    this.getMap = function() {
        return this.map;
    }

    this.getTownships = function() {
        return this.townships;
    }

    this.addTownship = function(name, success) {
        var self = this;

        self.ftClient.query(["Id", "Nombre", "N", "E", "S", "W","filename"], "Nombre = '" + name + "'",null, function(data) {

            if (data.table.rows.length > 1) {
            	console.log(name)
                throw "ERROR: Query returned more than 1 township";
            }

            var row = data.table.rows[0];
            var township = new Township({
                id : row[0],
                name : row[1],
                n : row[2],
                e : row[3],
                s : row[4],
                w : row[5],
                mapManager: self,
                showLimit: true,
                filename: row[6]
            });
            township.init();
            self.townships[name] = township;

            if (success){
            	console.log(name);
                success.call(township);
            }
        })
    }

    this.setActiveTownship = function(name) {
        var self = this;
        var township = self.townships[name];

        if (self.activeTownship) {
            self.activeTownship.hideAll();
            self.showHideLimit(self.activeTownship.getName(), true);
        }

        // Pan, zoom and display
        self.activeTownship = township;
        $("#township-name").text(township.getName()).show();
        self.getMap().fitBounds(township.getLatLngBounds());
        township.showUrbArea();
        township.showUrbFootprint();
        township.showNewDevelopment();
        township.buildMetrics(self._calculateEdgeRank(name), self._calculateOpennessRank(name));
        $("#metrics").show();

        this.ftStyles[1].where = "Nombre = '" + township.getName() + "'";
        this.ftLayer.setOptions( {query:this.ftQuery, styles: this.ftStyles } );
        resetControls(this);
    }

    this.getActiveTownship = function(name) {
        return this.activeTownship;
    }

    this.showHideLimit = function(name, value) {
        var self = this;
        var visibleTownships = [];
        var notVisibleTownships = [];

        this.townships[name].options.showLimit = value;

        if(!value){
        	this.ftQuery.where = "Id NOT EQUAL TO '" + self.townships[name].getId() + "'";
        }else{
        	this.ftQuery.where = "";
        }
        
        
        
        this.ftLayer.setOptions( {query:this.ftQuery, styles: this.ftStyles } );
    }

    this.showHideNonActiveLimits = function(value) {
        var self = this;
        this.ftStyles[0].polygonOptions.fillOpacity = value ? 0.5 : 0.01;
        this.ftLayer.setOptions( {query:this.ftQuery, styles: this.ftStyles } );
    }

    this.setHistoricalTime = function(value) {
        this.historicalTime = value;
        this.activeTownship.showHistoricalTime(value);

        // Update metrics
        var name = this.activeTownship.getName();
        $("#metrics span.year").text(value ? "2001" : "1990");
        this.activeTownship.buildMetrics(self._calculateEdgeRank(name), self._calculateOpennessRank(name));
    }

    this._calculateEdgeRank = function(name) {
        var values = [Math.random().toFixed(3), Math.random().toFixed(3), Math.random().toFixed(3), Math.random().toFixed(3), Math.random().toFixed(3)].sort().reverse();

        return [
            { rank:1, name:"Pilar", value:values[0], active: false, type: "township" },
            { rank:2, name:"Salsipuedes", value:values[1], active: false, type: "township" },
            { type: "elipsis" },
            { rank:27, name: name, value:values[2], active: true, type: "township" },
            { type: "elipsis" },
            { rank:129, name:"Campana", value:values[3], active: false, type: "township" },
            { rank:130, name:"Avellaneda", value:values[4], active: false, type: "township" }
        ];
    }

    this._calculateOpennessRank = function(name) {
        var values = [Math.random().toFixed(3), Math.random().toFixed(3), Math.random().toFixed(3), Math.random().toFixed(3), Math.random().toFixed(3)].sort().reverse();
        return [
            { rank:1, name:"Berazategui", value:values[0], active: false, type: "township" },
            { rank:2, name:"Avellaneda", value:values[1], active: false, type: "township" },
            { type: "elipsis" },
            { rank:89, name: name, value:values[2], active: true, type: "township" },
            { type: "elipsis" },
            { rank:129, name:"Pilar", value:values[3], active: false, type: "township" },
            { rank:130, name:"Río Ceballos", value:values[4], active: false, type: "township" }
        ];
    }
}