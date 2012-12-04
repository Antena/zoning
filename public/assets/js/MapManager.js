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
    this.edgeRank = {};
    this.opennessRank = {};

    this.getMap = function() {
        return this.map;
    }

    this.getTownships = function() {
        return this.townships;
    }

    this.addTownship = function(name, success) {
        var self = this;

        self.ftClient.query(["Id", "Nombre", "N", "E", "S", "W", "edgeT0", "edgeT1", "openT0", "openT1"], "Nombre = '" + name + "'",null, function(data) {

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
                edge : {t0: row[6], t1: row[7]},
                open : {t0: row[8], t1: row[9]},
                mapManager: self,
                showLimit: true
            });
            township.init();
            self.townships[name] = township;

            if (success){
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

        this.townships[name].options.showLimit = value;
        for (var i in self.townships) {
            if (self.townships[i].options.showLimit) {
                visibleTownships.push(self.townships[i].getName());
            }
        }


        this.ftQuery.where = "Nombre IN ('" + visibleTownships.join("', '") + "')";
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

    this.calculateIndexRanks = function() {
        // calculate edge and openness ranks
        this.edgeRank.t0 = $.map(self.townships, function(k, v) { return [{name:k.getName(), value:k.getEdgeIndex().t0}];})
                .filter(function(element) { return element.value != ""; })
                .sort(function(a, b) { return (b.value - a.value); });
        this.edgeRank.t1 = $.map(self.townships, function(k, v) { return [{name:k.getName(), value:k.getEdgeIndex().t1}];})
            .filter(function(element) { return element.value != ""; })
            .sort(function(a, b) { return (b.value - a.value); });
        this.opennessRank.t0 = $.map(self.townships, function(k, v) { return [{name:k.getName(), value:k.getOpennessIndex().t0}];})
            .filter(function(element) { return element.value != ""; })
            .sort(function(a, b) { return (b.value - a.value); });
        this.opennessRank.t1 = $.map(self.townships, function(k, v) { return [{name:k.getName(), value:k.getOpennessIndex().t1}];})
            .filter(function(element) { return element.value != ""; })
            .sort(function(a, b) { return (b.value - a.value); });
    }

    this._getTownshipRank = function(name, rank) {
        var theRank = this.historicalTime ? rank.t0 : rank.t1;
        return theRank.indexOf(theRank.filter(function(element) { return element.name == name })[0]);
    }

    this._getValueAtIndex = function(index, rank) {
        var theRank = this.historicalTime ? rank.t0 : rank.t1;
        return theRank[index];
    }

    this._getRank = function(rank) {
        return this.historicalTime ? rank.t0 : rank.t1;
    }

    this._calculateEdgeRank = function(name) {

        var length = this._getRank(this.edgeRank).length;
        var hasData = this._getTownshipRank(name, this.edgeRank) > 0;
        var rank = this._getTownshipRank(name, this.edgeRank);
        var values = [];

        for (var i= 0; i<5; i++) {
            if (i < 2) {
                var index = i;
                values.push({rank: (index + 1), name: this._getValueAtIndex(index, this.edgeRank).name, value: this._getValueAtIndex(index, this.edgeRank).value.toFixed(3), active: false || index == rank  });
            } else if (i == 2 && i != rank) {
                values.push({ type: "elipsis" });
                var pos = hasData && rank > 1 && rank < length - 2 ? rank : Math.floor(length/2);
                values.push({rank: (pos), name: this._getValueAtIndex(pos-1, this.edgeRank).name, value: this._getValueAtIndex(pos-1, this.edgeRank).value.toFixed(3), active: false })
                values.push({rank: (pos + 1), name: this._getValueAtIndex(pos, this.edgeRank).name, value: this._getValueAtIndex(pos, this.edgeRank).value.toFixed(3), active: true & hasData && rank > 1 && rank < length -2})
                values.push({rank: (pos + 2), name: this._getValueAtIndex(pos+1, this.edgeRank).name, value: this._getValueAtIndex(pos+1, this.edgeRank).value.toFixed(3), active: false })
                values.push({ type: "elipsis" });
            } else {
                var index = length - (5 - i);
                values.push({rank: index+1, name: this._getValueAtIndex(index, this.edgeRank).name, value: this._getValueAtIndex(index, this.edgeRank).value.toFixed(3), active: false  || index == rank})
            }
        }

        return values;
    }

    this._calculateOpennessRank = function(name) {
        var length = this._getRank(this.opennessRank).length;
        var hasData = this._getTownshipRank(name, this.opennessRank) > 0;
        var rank = this._getTownshipRank(name, this.opennessRank);
        var values = [];

        for (var i= 0; i<5; i++) {
            if (i < 2) {
                var index = i;
                values.push({rank: (index + 1), name: this._getValueAtIndex(index, this.opennessRank).name, value: this._getValueAtIndex(index, this.opennessRank).value.toFixed(3), active: false || index == rank  });
            } else if (i == 2 && i != rank) {
                values.push({ type: "elipsis" });
                var pos = hasData && rank > 1 && rank < length - 2 ? rank : Math.floor(length/2);
                values.push({rank: (pos), name: this._getValueAtIndex(pos-1, this.opennessRank).name, value: this._getValueAtIndex(pos-1, this.opennessRank).value.toFixed(3), active: false })
                values.push({rank: (pos + 1), name: this._getValueAtIndex(pos, this.opennessRank).name, value: this._getValueAtIndex(pos, this.opennessRank).value.toFixed(3), active: true & hasData && rank > 1 && rank < length -2})
                values.push({rank: (pos + 2), name: this._getValueAtIndex(pos+1, this.opennessRank).name, value: this._getValueAtIndex(pos+1, this.opennessRank).value.toFixed(3), active: false })
                values.push({ type: "elipsis" });
            } else {
                var index = length - (5 - i);
                values.push({rank: index+1, name: this._getValueAtIndex(index, this.opennessRank).name, value: this._getValueAtIndex(index, this.opennessRank).value.toFixed(3), active: false  || index == rank})
            }
        }

        return values;
    }
}