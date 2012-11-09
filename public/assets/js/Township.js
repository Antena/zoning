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

        // Overlay : urbFootprint t0
        this.urbFootprint_t0 = new google.maps.GroundOverlay(
            this._buildImagesUrlHead(options.name) + this.urbFootprintFilename + "_t0.png",
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

    this.showUrbArea = function() {
        this.urbArea_t0.setMap(this.map);
    }

    this.getUrbArea = function() {
        return this.urbArea_t0;
    }

    this.showUrbFootprint = function() {
        this.urbFootprint_t0.setMap(this.map);
    }

    this.getUrbFootprint = function() {
        return this.urbFootprint_t0;
    }

    this.showNewDevelopment = function() {
        this.newDevelopment.setMap(this.map);
    }

    this.getNewDevelopment = function() {
        return this.newDevelopment;
    }

    this.hideAll = function() {
        this.urbArea_t0.setMap(null);
        this.urbFootprint_t0.setMap(null);
        this.newDevelopment.setMap(null);
    }

    this.getLatLngBounds = function() {
        return this.latLngBounds;
    }

    this.getName = function() {
        return this.options.name;
    }

    // UTILITY METHODS
    this._buildImagesUrlHead = function(name) {
        var head = "/assets/images/townships/";
        head += name.toLowerCase().replace(" ","_") + "/";
        return head;
    }
}