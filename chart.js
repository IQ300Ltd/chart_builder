var env, fs, page, port, server, service, svgDrawer, system, url, waitFor;

port = void 0;

server = void 0;

service = void 0;

page = void 0;

url = void 0;

svgDrawer = void 0;

waitFor = function(testFx, onReady, timeOutMillis) {
  var condition, interval, maxtimeOutMillis, start;
  maxtimeOutMillis = timeOutMillis ? timeOutMillis : 5000;
  start = (new Date).getTime();
  condition = false;
  interval = setInterval((function() {
    if ((new Date).getTime() - start < maxtimeOutMillis && !condition) {
      condition = typeof testFx === 'string' ? eval(testFx) : testFx();
    } else {
      if (!condition) {
        phantom.exit(1);
      } else {
        if (typeof onReady === 'string') {
          eval(onReady);
        } else {
          onReady();
        }
        clearInterval(interval);
      }
    }
  }), 50);
};

fs = require('fs');

system = require('system');

env = system.env;

port = 9495;

server = require('webserver').create();

page = require('webpage').create();

service = server.listen(port, function(request, response) {
  var drawerPayload, e;
  drawerPayload = null;
  try {
    drawerPayload = JSON.parse(request.post);
  } catch (_error) {
    e = _error;
    response.statusCode = 417;
    response.write('Error : Invalid Input JSON');
    response.close();
    return;
  }
  if (env.WORKING_DIRECTORY !== void 0) {
    fs.changeWorkingDirectory(env.WORKING_DIRECTORY);
  }
  url = 'file:///' + fs.absolute('./' + drawerPayload.inFile);
  page = require('webpage').create();
  page.open(url, function(status) {
    if (status === 'success') {
      waitFor((function() {
        page.evaluate((function(data) {
          $('body').on('click', data, chartBuilder);
          $('body').click();
        }), drawerPayload.options);
        return page.evaluate(function() {
          return window.chartRendered;
        });
      }), function() {
        var pageChartSVG;
        response.statusCode = 200;
        switch (drawerPayload.returnType) {
          case 'svg':
            pageChartSVG = page.evaluate(function() {
              return $('#chart').html();
            });
            response.write(pageChartSVG);
            break;
          case 'image':
            page.render(drawerPayload.outFile);
            response.write(true);
            break;
          case 'base64':
            response.write(page.renderBase64('PNG'));
            break;
          default:
            response.write(page.renderBase64('PNG'));
            break;
        }
        response.close();
      });
    } else {
      response.statusCode = 404;
      response.write('Not Found' + url);
      response.close();
      return;
    }
  });
});

if (service) {
  console.log('Web server running on port ' + port);
} else {
  console.log('Error: Could not create web server listening on port ' + port);
  phantom.exit();
}