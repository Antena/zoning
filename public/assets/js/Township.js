var Township = function Township(options) {

    this.options = options;
    this.mapManager = options.mapManager;

    this.map = options.mapManager.getMap()
    this.ftLimitColumnName = options.mapManager.options.ftLimitColumnName;
    this.ftId = options.mapManager.ftId;

    this.urbArea_t0 = null;
    this.urbArea_t1 = null;
    this.urbFootprint_t0 = null;
    this.urbFootprint_t1 = null;
    this.newDevelopment = null;

    this.edgeIndex = options.edge;
    this.opennessIndex = options.open;

    this.urbAreaFilename = "urbArea";
    this.urbFootprintFilename = "urbFootprint";
    this.newDevelopmentFilenmae = "newDevelopment";

    var neCoordinate = new google.maps.LatLng(options.n, options.e);
    var swCoordinate = new google.maps.LatLng(options.s, options.w);
    this.latLngBounds = new google.maps.LatLngBounds(swCoordinate, neCoordinate);

    this.polygons = null;
    this.polygonsOpacity = 0.5;

    this.init = function() {
        var self = this;

        // Overlay : urbArea t0
        this.urbArea_t0 = new google.maps.GroundOverlay(
            this._buildImagesUrlHead(options.name) + this.urbAreaFilename + "_t0.png",
            this.latLngBounds,
            { opacity: 0.5 }
        );
        this.urbArea_t1 = new google.maps.GroundOverlay(
            this._buildImagesUrlHead(options.name) + this.urbAreaFilename + "_t1.png",
            this.latLngBounds,
            { opacity: 0.5 }
        );

        // Overlay : urbFootprint t0
        this.urbFootprint_t0 = new google.maps.GroundOverlay(
            this._buildImagesUrlHead(options.name) + this.urbFootprintFilename + "_t0.png",
            this.latLngBounds,
            { opacity: 0.5 }
        );
        this.urbFootprint_t1 = new google.maps.GroundOverlay(
            this._buildImagesUrlHead(options.name) + this.urbFootprintFilename + "_t1.png",
            this.latLngBounds,
            { opacity: 0.5 }
        );

        // Overlay : newDevelopment
        this.newDevelopment = new google.maps.GroundOverlay(
            this._buildImagesUrlHead(options.name) + this.newDevelopmentFilenmae + ".png",
            this.latLngBounds,
            { opacity: 0.5 }
        );
    }

    // UrbArea
    this.showUrbArea = function() {
        this.urbArea_t0.setMap(this.map);
    }

    this.getUrbArea = function() {
        return this.urbArea_t0;
    }

    this.setUrbAreaOpacity = function(value) {
        this.urbArea_t0.setOpacity(value);
        this.urbArea_t1.setOpacity(value);
    }

    // UrbFootprint
    this.showUrbFootprint = function() {
        this.urbFootprint_t0.setMap(this.map);
    }

    this.getUrbFootprint = function() {
        return this.urbFootprint_t0;
    }

    this.setUrbFootprintOpacity = function(value) {
        this.urbFootprint_t0.setOpacity(value);
        this.urbFootprint_t1.setOpacity(value);
    }

    this.showNewDevelopment = function() {
        this.newDevelopment.setMap(this.map);
    }

    this.getNewDevelopment = function() {
        return this.newDevelopment;
    }

    this.hideAll = function() {
        this.urbArea_t0.setMap(null);
        this.urbArea_t1.setMap(null);
        this.urbFootprint_t0.setMap(null);
        this.urbFootprint_t1.setMap(null);
        this.newDevelopment.setMap(null);
        this.hidePolygons();
    }

    this.showHistoricalTime = function(value) {
        if (value == 0) {
            this.urbArea_t0.setMap(this.map);
            this.urbArea_t1.setMap(null);
            this.urbFootprint_t0.setMap(this.map);
            this.urbFootprint_t1.setMap(null);
        } else {
            this.urbArea_t0.setMap(null);
            this.urbArea_t1.setMap(this.map);
            this.urbFootprint_t0.setMap(null);
            this.urbFootprint_t1.setMap(this.map);
        }
    }

    this.getLatLngBounds = function() {
        return this.latLngBounds;
    }

    this.getName = function() {
        return this.options.name;
    }

    this.getId = function() {
        return this.options.id;
    }

    this.getEdgeIndex = function() {
        return this.edgeIndex;
    }

    this.getOpennessIndex = function() {
        return this.opennessIndex;
    }

    this.addPolygons = function(ftClient, show) {
        var self = this;
        if (!self.polygons) {
            ftClient.query(["Tipo", "Polygon"], "'Municipio Id' = " + self.getId(), null, function(data) {
                self.polygons = [];
                var rows = data.table.rows;
                for (var i=0; i<rows.length; i++) {
                    var row = rows[i];
                    if (row[1].type == "GeometryCollection") {
                        for (var j=0; j<row[1].geometries.length; j++) {
                            self.polygons.push(self.createPolygon(row[0], row[1].geometries[j].coordinates));
                        }
                    } else {
                        self.polygons.push(self.createPolygon(row[0], row[1].coordinates));
                    }
                }
                if (show)
                    self.showPolygons();
            });
        } else if (show) {
            self.showPolygons();
        }
    }

    this.createPolygon = function(name, coordinates) {
        var self = this;
        // console.log(self.mapManager.zoningColors[name].color);
        var polygon = new google.maps.Polygon({
            paths: self._coordinatesToLatLng(coordinates),
            strokeColor: "#333333",
            strokeOpacity: self.polygonsOpacity,
            strokeWeight: 1,
            fillColor: self.mapManager.zoningColors[name].color,
            fillOpacity: self.polygonsOpacity,
            zoningType: name
        });
        google.maps.event.addListener(polygon, "mousemove", function(event) {
            self.mapManager.zoningColors[this.zoningType].marker.setPosition(event.latLng);
            self.mapManager.zoningColors[this.zoningType].marker.setVisible(true);
        });
        google.maps.event.addListener(polygon, "mouseout", function(event) {
            self.mapManager.zoningColors[this.zoningType].marker.setVisible(false);
        });

        return polygon;
    }

    this.showPolygons = function() {
        var self = this;
        if (self.polygons) {
            self.polygons.map(function(polygon) {
                polygon.setMap(self.map);
            });
        }
    }


    this.setPolygonsOpacity = function(opacity) {
        var self = this;
        if (self.polygons) {
            self.polygons.map(function(polygon) {
                polygon.setOptions({
                     fillOpacity:opacity,
                     strokeOpacity:opacity   
                });
            });
        }
    }

    this.getPolygonsOpacity = function(){
        return this.polygonsOpacity;
    }

    this._coordinatesToLatLng = function(coordinates) {
        var array = [];
        var coords = null;
        if(coordinates[0].length >2){
            coords=coordinates[0];
        }else{
            coords=coordinates;
        }
        
        for (var i=0; i<coords.length; i++) {
            // console.log(parseFloat(coords[i][1]) + ' ' + parseFloat(coords[i][0]) );
            // console.log(new google.maps.LatLng(parseFloat(coords[i][1]), parseFloat(coords[i][0])));
            array.push(new google.maps.LatLng(parseFloat(coords[i][1]), parseFloat(coords[i][0])));
        }
        return array;
    }

    this.hidePolygons = function() {
        var self = this;
        if (self.polygons) {
            self.polygons.map(function(polygon) {
                polygon.setMap(null);
            })
        }
    }

    this.buildMetrics = function(edgeRank, opennessRank) {
        var $edgeIndex = $('#edge-index .ranking').empty();
        var $opennessIndex = $('#openness-index .ranking').empty();

        // Edge Rank
        for (var i=0; i<edgeRank.length; i++) {
            var index = edgeRank[i];
            if (index.type == "elipsis") {
                $edgeIndex.append('<li><div class="elipsis">&#8942;</div></li>');
            } else {
                var divClass = index.active ? "rank active" : "rank";
                $edgeIndex.append('<li><div class="' + divClass + '">' + index.rank + '</div>' + index.name + ' (' + index.value + ')</li>');
            }
        }

        // Openness Rank
        for (var i=0; i<opennessRank.length; i++) {
            var index = opennessRank[i];
            if (index.type == "elipsis") {
                $opennessIndex.append('<li><div class="elipsis">&#8942;</div></li>');
            } else {
                var divClass = index.active ? "rank active" : "rank";
                $opennessIndex.append('<li><div class="' + divClass + '">' + index.rank + '</div>' + index.name + ' (' + index.value + ')</li>');
            }
        }
    }

    // UTILITY METHODS
    this._buildImagesUrlHead = function(name) {
        var head = "/assets/images/townships/";
        head += this.options.filename + "/";
        return head;
    }
}