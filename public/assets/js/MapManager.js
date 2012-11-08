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
    this.ftLayer = new google.maps.FusionTablesLayer();
    this.ftId = options.ftId;

    this.townships = {};

    this.getMap = function() {
        return this.map;
    }

    this.getTownships = function() {
        return this.townships;
    }

    this.addTownship = function(name, success) {
        var self = this;

        self.ftClient.query(["Id", "Nombre", "N", "E", "S", "W"], "Nombre = '" + name + "'", function(data) {

            if (data.table.rows.length > 1) {
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
                mapManager: self
            });
            township.init();
            self.townships[name] = township;

            success.call(township);
        })
    }
}