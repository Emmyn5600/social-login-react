/* eslint-disable no-undef */
let cleanUpTimeout = 0;
let lastScrollX = 0;
let lastScrollY = 0;
let links = [];
let linksCounter = 0;
let targetElement = null;
let targetLink = 'no-link';

function clearClips() {
  links = [];
  linksCounter = 0;
  $("[id^=screenshot_addon_link_]").remove();
  $("#screenshot_addon_help").remove();
}

function processWithoutLink() {
  targetLink = window.location.href;
  clearClips();
  $("#screenshot_addon_tip").hide();
  $("#screenshot_addon_tip").remove();
  getPositions(targetElement);
}

function drawClips() {
  targetLink = 'no-link';
  clearClips();
  $("#screenshot_addon_help").click(function (e) {
    processWithoutLink();
  });
  var items = $("a");
  if (items.length == 0) {
    processWithoutLink();
    return;
  }
  items.each(function (element) {
    var href = this.getAttribute("href");
    if (href && href != "#" & href.length > 0 && href.indexOf("javascript:") == -1) {
      links.push(this);
      $('body').append('<img id="screenshot_addon_link_' + linksCounter + '" style="z-Index:9999999;position:absolute;padding:0px;margin:0px;b"  width="18px" height="18px" src="' + chrome.runtime.getURL("assets/images/clip.png") + '">');
      $('#screenshot_addon_link_' + linksCounter).attr("index", linksCounter);
      $('#screenshot_addon_link_' + linksCounter).css($(this).offset());
      $('#screenshot_addon_link_' + linksCounter).hover(function () {
        var target = links[$(this).attr("index")];
        $("#screenshot_addon_tip").html("Some info:" + target.href);
        //$("#screenshot_addon_tip").css({zIndex:$(this).css("zIndex")+2});
        $("#screenshot_addon_tip").show();
      }, function () {
        $("#screenshot_addon_tip").hide();
      });
      $('#screenshot_addon_link_' + linksCounter).mousemove(function (event) {
        $("#screenshot_addon_tip").css({ left: event.pageX + 10, top: event.pageY + 10 });
      });
      $('#screenshot_addon_link_' + linksCounter).click(function (element) {
        var target = links[$(this).attr("index")];
        targetLink = target.href;
        clearClips();
        $("#screenshot_addon_tip").hide();
        $("#screenshot_addon_tip").remove();
        getPositions(targetElement);
      });

      linksCounter++;
    }
  })
}

function takeScreenshot(element) {
  html2canvas(element).then(canvas => {
    var a = document.createElement('a');
    document.body.appendChild(a);
    a.style = 'display: none';
    a.href = canvas.toDataURL();
    a.download = 'screenshot_addon.png';
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  });
}

function processPage(elements) {
  $('body').append('<div id="screenshot_addon" style="z-Index:9999999;display:none;position:absolute;padding:0px;margin:0px;opacity: 0.75;border: 2px solid red;background:#b4cfeadb;"></div>');
  $("body").append('<div id="screenshot_addon_tip" style="z-Index:9999999;display:none;position:absolute;padding:0px;margin:10px;border: 1px solid black;background:white;"></div>');
  $("body").keydown(function (e) {
    if (e.keyCode == 27) {
      // chrome.storage.local.set({ 'state': null });
      localStorage.setItem("app_state", null);
      $('#screenshot_addon').hide();
      $('#screenshot_addon').remove();
      clearClips();
    }
  });

  $("#screenshot_addon").keydown(function (e) {
    if (e.keyCode == 27) {
      // chrome.storage.local.set({ 'state': null });
      localStorage.setItem("app_state", null);
      $('#screenshot_addon').hide();
      $('#screenshot_addon').remove();
      clearClips();
    }
  });

  $('body').mousemove(function (event) {
    $('#screenshot_addon').hide();
    var element = document.elementFromPoint(event.clientX, event.clientY);
    if (!element) {
      return;
    }
    if ($(element).width() < 100) {
      return;
    }
    if ($(element).height() < 100) {
      return;
    }
    $('#screenshot_addon').css($(element).offset());
    $('#screenshot_addon').width($(element).width());
    $('#screenshot_addon').height($(element).height());
    $('#screenshot_addon').show();
  });

  $('#screenshot_addon').click(function (event) {
    $('#screenshot_addon').hide();
    $('#screenshot_addon').remove();
    var element = document.elementFromPoint(event.clientX, event.clientY);
    var position = $(element).offset();
    //var data = { x : Math.floor(position.left), y : Math.floor(position.top), width : Math.floor($(element).width()), height : Math.floor($(element).height()), wWidth:window.innerWidth };
    setTimeout(function () {
      targetElement = element;
      drawClips();
      //getPositions(element);
      //chrome.runtime.sendMessage({action:"capture",data:data});
    }, 50);
    //captureTab();
  })
};

function stopHighlight() {
  $("#screenshot_addon").hide();
  $("#screenshot_addon").remove();
  $("body").unbind('mousemove');
}

function max(nums) {
  return Math.max.apply(Math, nums.filter(function (x) { return x; }));
}

function getPositions(element) {
  var body = document.body,
    originalBodyOverflowYStyle = body ? body.style.overflowY : '',
    originalX = window.scrollX,
    originalY = window.scrollY,
    originalOverflowStyle = document.documentElement.style.overflow;

  if (body) {
    body.style.overflowY = 'visible';
  }

  var elementHeight = $(element).height();
  elementHeight = elementHeight <= 2000 ? elementHeight : 2000;

  var widths = [
    document.documentElement.clientWidth,
    body ? body.scrollWidth : 0,
    document.documentElement.scrollWidth,
    body ? body.offsetWidth : 0,
    document.documentElement.offsetWidth
  ],
    heights = [
      document.documentElement.clientHeight,
      body ? body.scrollHeight : 0,
      document.documentElement.scrollHeight,
      body ? body.offsetHeight : 0,
      document.documentElement.offsetHeight
    ],
    fullWidth = $(element).offset().left + $(element).width(), //max(widths),
    fullHeight = $(element).offset().top + elementHeight, //max(heights),
    windowWidth = window.innerWidth,
    windowHeight = window.innerHeight,
    arrangements = [],

    scrollPad = 200,
    yDelta = windowHeight - (windowHeight > scrollPad ? scrollPad : 0),
    xDelta = windowWidth,
    yPos = fullHeight - yDelta,
    xPos,
    numArrangements;

  if (fullWidth <= xDelta + 1) {
    fullWidth = xDelta;
  }

  document.documentElement.style.overflow = 'hidden';

  while (yPos >= ($(element).offset().top - yDelta - scrollPad)) {
    xPos = 0;
    while (xPos < fullWidth) {
      arrangements.push([xPos, yPos]);
      xPos += xDelta;
    }
    yPos -= yDelta;
  }

  /** */
  console.log('fullHeight', fullHeight, 'fullWidth', fullWidth);
  console.log('windowWidth', windowWidth, 'windowHeight', windowHeight);
  console.log('xDelta', xDelta, 'yDelta', yDelta);
  var arText = [];
  arrangements.forEach(function (x) { arText.push('[' + x.join(',') + ']'); });
  console.log('arrangements', arText.join(', '));
  /**/

  numArrangements = arrangements.length;

  function cleanUp() {
    document.documentElement.style.overflow = originalOverflowStyle;
    if (body) {
      body.style.overflowY = originalBodyOverflowYStyle;
    }
    window.scrollTo(originalX, originalY);
  }

  (async function processArrangements() {
    if (!arrangements.length) {
      cleanUp();
      var elementHeight = $(element).height();
      elementHeight = elementHeight <= 2000 ? elementHeight : 2000;
      var data = {};
      data.width = $(element).width();
      data.height = elementHeight;
      data.x = $(element).offset().left;
      data.y = $(element).offset().top;
      chrome.runtime.sendMessage({ action: "endCapture", data: data, url: targetLink });
      return;
    }

    var next = arrangements.shift(),
      x = next[0], y = next[1];

    window.scrollTo(x, y);

    var data = {
      action: 'capture',
      x: window.scrollX,
      y: window.scrollY,
      complete: (numArrangements - arrangements.length),
      wWidth: windowWidth,
      totalWidth: fullWidth,
      totalHeight: fullHeight
    };

    lastScrollX = window.scrollX;
    lastScrollY = window.scrollY;
    await new Promise(resolve => setTimeout(() => {
      resolve();
    }, 10));
    cleanUp();
    $("body").append('<div id="screenshot_addon_upload" style="z-Index:9999999;position: fixed;padding: 5px;margin:10px;margin-top: -125px;margin-left: -100px;text-align:center;left: 50%;top: 50%;height: 240px;width:200px;background: white;border: 2px solid #777777;"><img width="200px" height="200px" src="' + chrome.runtime.getURL("assets/images/loader.gif") + '"><span style="color: #aaaaa9;font-size: 20px;">Processing...</span></div>');
    // window.setTimeout(function () {
    //   cleanUpTimeout = window.setTimeout(cleanUp, 1250);

      // await new Promise(resolve => setTimeout(() => {
      //   resolve();
      // }, 50));
     
      chrome.runtime.sendMessage(data, function (captured) {
        window.clearTimeout(cleanUpTimeout);
        if (captured) {
          processArrangements();
        } else {
          cleanUp();
        }
      });
    // }, 50);
  })();
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "startHighlight") {
    localStorage.setItem("app_state", "UPLOAD_SUCCESS");
    processPage();
    sendResponse({redirectFromContent1: true});
  }

  if (request.action === "stopHighlight") {
    stopHighlight();
  }

  if (request.action === "doneUpload") {
    localStorage.setItem("app_state", "UPLOAD_SUCCESS");
    $("#screenshot_addon_upload").remove();
    $("body").append('<div id="screenshot_upload_success" style="z-Index:9999999;position: fixed;padding: 5px;margin:10px;margin-top: -125px;margin-left: -100px;text-align:center;left: 50%;top: 50%;height: 240px;width:200px;background: white;border: 2px solid #777777;"><img style="margin: 20px 20px;" height="150px" width="150px" src="' + chrome.runtime.getURL("assets/images/success.gif") + '"><span style="color: #aaaaa9;font-size: 25px;">Success</span></div>');
  }

  if (request.action === "removeSuccessMessage") {
    $("#screenshot_upload_success").remove();
  }

  if (request.action === "download") {
    var a = document.createElement('a');
    document.body.appendChild(a);
    a.style = 'display: none';
    a.href = request.url;
    a.download = 'screenshot_addon.png';
    a.click();
    document.body.removeChild(a);
  }

  if (request.action === "captured") {
    window.clearTimeout(cleanUpTimeout);
    processArrangements();
  }

  if (request.action === "get_authentication_token") {
    let authentication_token = localStorage.getItem("authentication_token");
    sendResponse({ authentication_token });
    return true;
  }

  if (request.action === "CONT_MINIMIZE_EXTENSION") {
    const mainExtensionRoot =  $('#my-extension-root');
    console.log('mainExtensionRoot: ', mainExtensionRoot);
    mainExtensionRoot.css('height', "8%");
  }

  if (request.action === "CONT_MAXIMIZE_EXTENSION") {
    const mainExtensionRoot =  $('#my-extension-root');
    console.log('mainExtensionRoot: ', mainExtensionRoot);
    mainExtensionRoot.css('height', "50%");
  }

  if (request.action === "CONT_CLOSE_EXTENSION") {
    const mainExtensionRoot =  $('#my-extension-root');
    mainExtensionRoot.css('display', 'none');
  }

  return Promise.resolve("");
});
