var port, server, service, page, url, svgDrawer
fs = require('fs');
var system = require('system');
var env = system.env;
port = 9494;
server = require('webserver').create();
page = require('webpage').create();
function waitFor(testFx, onReady, timeOutMillis) {
    var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 3000, //< Default Max Timout is 3s
        start = new Date().getTime(),
        condition = false,
        interval = setInterval(function() {
            if ( (new Date().getTime() - start < maxtimeOutMillis) && !condition ) {
                // If not time-out yet and condition not yet fulfilled
                condition = (typeof(testFx) === "string" ? eval(testFx) : testFx()); //< defensive code
            } else {
                if(!condition) {
                    // If condition still not fulfilled (timeout but condition is 'false')
                    phantom.exit(1);
                } else {
                    // Condition fulfilled (timeout and/or condition is 'true')
                    typeof(onReady) === "string" ? eval(onReady) : onReady(); //< Do what it's supposed to do once the condition is fulfilled
                    clearInterval(interval); //< Stop this interval
                }
            }
        }, 50); //< repeat check every 250ms
};

service = server.listen(port, function (request, response) {
 var drawerPayload = null;
	try{
		drawerPayload=JSON.parse(request.post);
	}catch(e){
	 	response.statusCode = 417;
		response.write("Error : Invalid Input JSON");
		response.close();
		return;
	}
	
if(env.WORKING_DIRECTORY != undefined){
    fs.changeWorkingDirectory(env.WORKING_DIRECTORY)
}

url = 'file:///' + fs.absolute('./'+drawerPayload.inFile);
page.open(url, function (status) {
	if(status=="success"){
		waitFor(function() {
				page.evaluate(function(data){
					$("body").on("click", data, chartBuilder);
					$("body").click();
				}, drawerPayload.options);
        return page.evaluate(function() {
            return window.chartRendered;
        });
    }, function() {
		response.statusCode = 200;
        switch (drawerPayload.returnType) {
            case "svg":
                pageChartSVG = page.evaluate(function() {
                    return $("#chart").html()
                });
                response.write(pageChartSVG);
                break;
            case "image":
                page.render(drawerPayload.outFile);
                response.write(true);
                break;
            case "base64":
                response.write(page.renderBase64('PNG'));
                break;
            default:
                response.write(page.renderBase64('PNG'));
                break;
        }
		response.close();
		return;
    });
	}else{
		response.statusCode = 404;
		response.write("Not Found"+url);
		response.close();
		return;
	}
  });
page.onError = function (msg, trace) {
    console.log(msg);
    trace.forEach(function(item) {
        console.log('  ', item.file, ':', item.line);
    })
	response.statusCode = 417;
	response.write("Error : "+msg);
	response.close();
	return;
}
});
if (service) {
	console.log('Web server running on port ' + port);
} else {
	console.log('Error: Could not create web server listening on port ' + port);
	phantom.exit();
}
