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

port = 9494;

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
  var address, pageWidth, pageHeight;
  page = require('webpage').create();
  page.settings.userAgent = 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.120 Safari/537.36';
  address = 'https://app.iq300.ru/pub/gantt_images/' + drawerPayload.token;
  page.customHeaders = {
    "Accept-Language": "ru-RU"
  };
  page.open(address, function (status) {
    if (status === 'success') {
      waitFor((function() {
        return page.evaluate(function() {
          return window.ganttLoaded && $('.gantt_row') && $('.gantt_row').length > 0;
        });
      }), (function () {
      setTimeout(function() {
        var bb = page.evaluate(function () {
          return document.getElementsByClassName('gantt_container')[0].getBoundingClientRect();
        });
        pageWidth = page.evaluate(function () {
          var width = document.getElementsByClassName('gantt_task')[0].scrollWidth;
          width += document.getElementsByClassName('gantt_grid')[0].offsetWidth;
          return width;
        });
        pageWidth += bb.left*2;
        pageHeight = page.evaluate(function () {
          return document.getElementsByClassName('gantt_task_bg')[0].scrollHeight +
             document.getElementsByClassName('gantt_task_scale')[0].scrollHeight + 1;
        });
        pageHeight += bb.top;
        page.viewportSize = { width: pageWidth, height: pageHeight };
        page.clipRect = {
          top: bb.top,
          left: bb.left,
          width: pageWidth - bb.left*2,
          height: pageHeight - bb.top
        };
        saved = page.render('gantt_image.png', {format: 'png', quality: '75'});
        if (saved) {
          response.statusCode = 200;
          response.write(true);
        }
        else
          response.write(false);
        response.close();
        }, 1000);
      }), 110000);
    }
  });
});

if (service) {
  console.log('Web server running on port ' + port);
} else {
  console.log('Error: Could not create web server listening on port ' + port);
  phantom.exit();
}