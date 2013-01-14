var FTClient = function FTClient(tableId) {

    this.tableId = tableId;

    this._queryUrlHead = 'https://www.googleapis.com/fusiontables/v1/query?sql=';
    this._queryUrlTail = '&key=AIzaSyDOzX31UyT-j4UKK3xP-PJUTR5WKvQr5_A';

    this.query = function(columnArray, whereClause, orderClause, success, error) {
        var self = this;
        var query = "SELECT '" + columnArray.join("', '") + "' FROM " + self.tableId;
        if (whereClause) {
            query += " WHERE " + whereClause;
        }
        if(orderClause){
        	query += " ORDER BY " + orderClause;
        }
        
        var queryurl = encodeURI(self._queryUrlHead + query + self._queryUrlTail);

        $.ajax({
            type: "GET",
            url:  queryurl,
            dataType: "jsonp",
            success: success,
            error: function () {
                console.log("AJAX ERROR for " + queryurl );
            }
        });
    }
}