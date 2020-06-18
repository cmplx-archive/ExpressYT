/* eslint-env browser, es6, jquery */
/* jslint es6 */
/* eslint-disable no-console */
var convertBtn = $('.convert-button')[0];
var searchBox = $('.input')[0];

var apiHost = "https://api.complexicon.tk/api/";

searchBox.addEventListener('keypress', function (e) {
    if (e.keyCode === 13) convertBtn.click();
});

convertBtn.addEventListener('click', function () {
    $("#dlCont").empty()
    if (searchBox.value.includes('list=')) {
        jQuery.getJSON(apiHost + "playlist/" + getURLParameter(searchBox.value, 'list'), (resp) => {
            for (const id of resp) {
                jQuery.getJSON(apiHost + "shortinfo/" + id, (info) => {
                    $("#dlCont").append('<li>' + info['title'] + ' - ' + info['author'] + ' <button id="' + id + '">Download</button></li>')
                    $("#" + id).click(() => download(apiHost + "downloadAudio/" + id))
                });
            }
        })
    } else if (searchBox.value.includes('youtu.be/')) download(apiHost + "downloadAudio/" + searchBox.value.split('?')[0].split('youtu.be/')[1])
    else if (searchBox.value.includes('youtube.com/watch?v=')) download(apiHost + "downloadAudio/" + getURLParameter(searchBox.value, 'v'))
    else jQuery.getJSON(apiHost + "query/" + encodeURIComponent(searchBox.value), (resp) => {
        for (const videoObj of resp) {
            $("#dlCont").append('<li>' + videoObj['title'] + ' - ' + videoObj['author'] + ' <button id="' + videoObj['id'] + '">Download</button></li>')
            $("#" + videoObj['id']).click(() => download(apiHost + "downloadAudio/" + videoObj['id']))
        }
    })
});

function download(url) {
    var anchor = document.createElement('a');
    anchor.setAttribute('href', url);
    anchor.target = "_blank"
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
}

function getURLParameter(url, key) {
    var params = {};
    var parameters = url.split('?')[1].split('&');
    for (var param of parameters) {
        var lol = param.split('=');
        params[lol[0]] = decodeURIComponent(lol[1]);
    }
    return params[key];
}