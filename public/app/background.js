/*global chrome*/

// Called when the user clicks on the browser action
chrome.browserAction.onClicked.addListener(function(tab) {
   // Send a message to the active tab
  chrome.tabs.query({active: true, currentWindow:true},function(tabs) {
        var activeTab = tabs[0];
        chrome.tabs.sendMessage(activeTab.id, {"message": "clicked_browser_action"});
  });
});

const API_URL        = 'https://mydiligram-be.int.c85.de/api/v1/diliboard/tmp';
const USER_LOGIN_URL = 'https://mydiligram-be.int.c85.de/api/v1/sessions';

var canvas = null;

function login(payload) {
  return new Promise((resolve, reject) => {
    fetch(USER_LOGIN_URL, {
      method: 'POST', headers: { "Content-Type": "application/json", },
      body: JSON.stringify(payload),
    }).then(res => res.json()).then((response) => {
      return resolve(response);
    }).catch(err => {
      return reject(err);
    });
  })
}

function loggedOut() {
  return new Promise(resolve => {
    localStorage.setItem("authentication_token", null);
    return resolve(true);
  
  })
}

function getLoggedInStatus() {
  return new Promise(resolve => {

    let authentication_token = localStorage.getItem("authentication_token");
    if (!authentication_token) {
      return resolve(false);
    }
    return resolve(true);
  })
}


function captureTab(data, callback) {
  chrome.tabs.captureVisibleTab(null, { format: 'png', quality: 100 }, function (dataURI) {
    console.log(" captureTab :: data ", data);
    if (dataURI) {
      let image = new Image();
      image.onload = function () {
        let scale = image.width / data.wWidth;

        if (data.complete == 1) {
          canvas = document.createElement("canvas");;
          canvas.width = data.totalWidth * scale;
          canvas.height = data.totalHeight * scale;
          canvas.scale = scale;
        }

        /*data.x /= scale;
          data.y /= scale;
          data.width = image.width / scale;
          data.height = image.height / scale ;
        */
        let ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0, image.width, image.height, data.x * scale, data.y * scale, image.width, image.height);
        callback(true);
        /*chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
          if(tabs && tabs.length) {
            chrome.tabs.sendMessage(tabs[0].id,{action:"captured"});
          }
        });
        */
        //ctx.drawImage(image,0,0,image.width,image.height);
        /*chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
          if(tabs && tabs.length) {
            chrome.tabs.sendMessage(tabs[0].id,{action:"download", url : canvas.toDataURL()});
          }
        });*/
        /*var a = document.createElement('a');
        document.body.appendChild(a);
        a.style = 'display: none';
        a.href = canvas.dataURI;
        a.download = 'screenshot_addon.png';
        a.click();
        document.body.removeChild(a);*/
      };
      image.src = dataURI;
    }
  });
}

chrome.runtime.onMessage.addListener(function (msg, sender, callback) {
  if (msg.action === "background_startHighLight") {
    chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
      if (tabs && tabs.length) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'startHighlight' }, function(response) {
          callback({redirectFromBackground1: true});
        });
      }
    });
    return true;
  }

  if (msg.action === "background_showImage_startHighLight") {
    chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
      if (tabs && tabs.length) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'startHighlight' }, function(response) {
          callback({redirectFromBackground2: true});
        });
        localStorage.setItem("collectingActive", 'true');
      }
    });
  }

  if (msg.action === "background_stopHighlight") {
    chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
      if (tabs && tabs.length) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'stopHighlight' });
      }
    });
  }

  if (msg.action === "login") {
    login(msg.data).then(res => {
      localStorage.setItem("authentication_token", res.authentication_token);
      callback(res);
    }).catch(err => {
      console.log("background: login: err: ", err);
    })

    return true;
  }

  if (msg.action === "check_login_status") {
    getLoggedInStatus().then(loggedInStatus => {
      callback(loggedInStatus);
    }).catch(err => {
      console.log(" check_login_status :: err : ", err);
    });

    return true;
  }

  if (msg.action === "capture") {
    captureTab(msg, callback);
    return true;
  }

  if (msg.action === "endCapture") {
    var canvasResult = document.createElement("canvas");
    canvasResult.width = msg.data.width;
    canvasResult.height = msg.data.height;
    var scale = canvas.scale;
    var ctxResult = canvasResult.getContext("2d");
    ctxResult.drawImage(canvas, msg.data.x * scale, msg.data.y * scale, msg.data.width * scale, msg.data.height * scale, 0, 0, msg.data.width, msg.data.height);

    const dataURL = canvasResult.toDataURL();
    const byteString = atob(dataURL.split(',')[1]);
    const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], {type: mimeString});
    const formData = new FormData();

    formData.append("picture", blob);
    formData.append("page_url", msg.url);
    formData.append("title", "infoimg");
    formData.append("description", "image format");

    chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
      if (tabs && tabs.length) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'get_authentication_token' }, function(response) {
          fetch(API_URL, {
            method: 'POST',
            headers: {
              "Authorization": "Token token=" + response.authentication_token
            },
            body: formData
          }).then(res => res.json()).then((response) => {
            chrome.tabs.sendMessage(sender.tab.id, { action: "doneUpload" });
            setTimeout(function () {
              chrome.tabs.sendMessage(sender.tab.id, { action: "removeSuccessMessage" });
              const collectingActive = localStorage.getItem("collectingActive");

              if (collectingActive === 'true') {
                chrome.tabs.sendMessage(sender.tab.id, { action: "COMP_UPDATE_SHOWIMAGE" });
              } else {
                localStorage.setItem("collectingActive", "true");
                chrome.tabs.sendMessage(sender.tab.id, { action: "COMP_REDIRECT_SHOWIMAGE" });
              }
            }, 2000);
          }).catch((err) => {
            console.log(err);
          });
          });
      }
    });
  }

  if (msg.action === "BG_MINIMIZE_EXTENSION") {
    chrome.tabs.query({active: true, currentWindow:true},function(tabs) {
      const activeTab = tabs[0];
      chrome.tabs.sendMessage(activeTab.id, {action: "CONT_MINIMIZE_EXTENSION"});
    });
  }

  if (msg.action === "BG_MAXIMIZE_EXTENSION") {
    chrome.tabs.query({active: true, currentWindow:true},function(tabs) {
      const activeTab = tabs[0];
      chrome.tabs.sendMessage(activeTab.id, {action: "CONT_MAXIMIZE_EXTENSION"});
    });
  }

  if (msg.action === "BG_CLOSE_EXTENSION") {
    chrome.tabs.query({active: true, currentWindow:true},function(tabs) {
      const activeTab = tabs[0];
      chrome.tabs.sendMessage(activeTab.id, {action: "CONT_CLOSE_EXTENSION"});
    });
  }

  if (msg.action === "BG_SET_COLLECTING_ACTIVE") {
    localStorage.setItem("collectingActive", msg.payload);
  }

  if (msg.action === "BG_GET_COLLECTING_ACTIVE") {
    let collectingActive = localStorage.getItem("collectingActive");
    callback({collectingActive});
    return true;
  }

  return Promise.resolve("");
});
chrome.action.onClicked.addListener(function() {
  chrome.tabs.create({url: 'index.html'});
});