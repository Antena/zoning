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