(function () {
    // Objeto conector usado
    var myConnector = tableau.makeConnector();

    myConnector.init = function(initCallback) {
        tableau.authType = tableau.authTypeEnum.basic;

        if (tableau.phase == tableau.phaseEnum.gatherDataPhase) {
            // If the API that WDC is using has an endpoint that checks
            // the validity of an access token, that could be used here.
            // Then the WDC can call tableau.abortForAuth if that access token
            // is invalid.
            tableau.log('Auth Alert!')
        }
        
        // var accessToken = Cookies.get("accessToken");
        // console.log("Access token is '" + accessToken + "'");
        // var hasAuth = (accessToken && accessToken.length > 0) || tableau.password.length > 0;
        // updateUIWithAuthState(hasAuth);

        initCallback();

        if (tableau.phase == tableau.phaseEnum.interactivePhase || tableau.phase == tableau.phaseEnum.authPhase) {
            if (hasAuth) {
                tableau.password = accessToken;
  
                if (tableau.phase == tableau.phaseEnum.authPhase) {
                  // Auto-submit here if we are in the auth phase
                  tableau.submit()
                }
  
                return;
            }
        }
    }
    // Función para determinar el esquema de datos esperado por Tableau
    myConnector.getSchema = function (schemaCallback) {
        tableau.log("Setting schema");
        var cols=[
            {
                id:"id",
                dataType: tableau.dataTypeEnum.string
            },
            {
                id:"Parameter",
                dataType: tableau.dataTypeEnum.string
            },
            {
                id:"Measure",
                dataType: tableau.dataTypeEnum.string
            },
            {
                id:"Time",
                dataType: tableau.dataTypeEnum.datetime
            }
        ]
        var tsSchema = {
            id: "AquariusTS",
            alias: "Time series of measurements for a certain lock",
            columns: cols
        };
        schemaCallback([tsSchema]);
    };

    // Función para leer los datos de donde se vaya a leer
    myConnector.getData = function (table, doneCallback) {
        tableau.abortForAuth();
        tableau.log('Getting Data!')
        $.getJSON("https://panama.aquaticinformatics.net/AQUARIUS/Publish/v2/GetTimeSeriesCorrectedData?TimeSeriesUniqueId=8330a745cd9247c5b8530c8dc57f9e69", function(resp) {
            
            var feat = resp.features,
                tableData = [];
            var id=feat.UniqueId;
            var Parameter = feat.Parameter;
            // Iterate over the JSON object
            for (var i = 0, len = feat.Points.length; i < len; i++) {
                tableData.push({
                    "id": id,
                    "Parameter": Parameter,
                    "Measure": feat.Points[i].Value.Numeric,
                    "Time": feat.Points[i].Timestamp.DateTimeOffset
                });
            }

            table.appendRows(tableData);
            doneCallback();
        });
    };

    // Función para validar el conector antes de inicializar
    tableau.registerConnector(myConnector);
    
    $(document).ready(function () {
        $("#submitButton").click(function () {
            tableau.connectionName = "Aquarius Time Series";
            tableau.submit();
        });
    });
})();