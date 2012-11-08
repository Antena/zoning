var MapManager = function MapManager(options) {

    this.options = options;

    // Initialization code
    var googleMapOptions = {
        zoom: options.zoom,
        center: new google.maps.LatLng(options.center.lat, options.center.lng),
        mapTypeId: options.mapTypeId
    };
    this.map = new google.maps.Map(document.getElementById(options.containerDivId), googleMapOptions);
    this.ftClient = new FTClient(options.ftId);

    // Added townships
    var townships = [];

    this.getMap = function() {
        return this.map;
    }

    this.addTownship = function(name, options) {
        var self = this;
        // query ft
        self.ftClient.query(["Id", "Nombre", "N", "E", "S", "W"], "Nombre = '" + name + "'", function(data) {
            var rows = data.table.rows;
            var map = self.getMap();

            for (var i=0; i<rows.length; i++) {
                var township = rows[i];
                var id = township[0];
                var name = township[1];
                var imagesUrlHead = self._buildImagesUrlHead(name);

                // Fusion Tables  township limit on map
                new google.maps.FusionTablesLayer({
                    query: {
                        select: self.options.ftLimitColumnName,
                        from: self.options.ftId
                    },
                    map: map
                });

                // Overlay coordinates
                var neCoordinate = new google.maps.LatLng(township[2], township[3]);
                var swCoordinate = new google.maps.LatLng(township[4], township[5]);
                var latLngBounds = new google.maps.LatLngBounds(swCoordinate, neCoordinate);

                // Overlay: urbArea t0
                var urbArea = new google.maps.GroundOverlay(
                    imagesUrlHead + self.options.urbAreaFilename + "_t0.png",
                    latLngBounds,
                    { opacity: 0.5 }
                );
                urbArea.setMap(map);

                // Overlay: urbFootprint t0
                var urbFootprint = new google.maps.GroundOverlay(
                    imagesUrlHead + self.options.urbFootprintFilename + "_t0.png",
                    latLngBounds,
                    { opacity: 0.5 }
                );
                urbFootprint.setMap(map);

                // Overlay: urbFootprint t0
                var newDevelopment = new google.maps.GroundOverlay(
                    imagesUrlHead + self.options.newDevelopmentFilename + ".png",
                    latLngBounds,
                    { opacity: 0.5 }
                );
                newDevelopment.setMap(map);
            }
        })
    }

    // UTILITY FUNCTIONS
    this._buildImagesUrlHead = function(name) {
        var head = "/assets/images/townships/";
        head += name.toLowerCase().replace(" ","_") + "/";
        return head;
    }
}