/* eslint-env browser, es6, jquery */
/* jslint es6 */
/* eslint-disable no-console */
var convertBtn = $('.convert-button')[0];
var searchBox = $('.input')[0];
var playPause = $('.play-button')[0];
var playIcon = $('.pauseplay')[0];
var currentTime = $('.current')[0];
var slider = $('.slider')[0];
var loopBtn = $('.replay-button')[0];
var downloadBtn = $('.download-button')[0];
var duration = $('.duration')[0];
var song = $('.song-name')[0];
var bgimg = $('.bgimg')[0];
var buffering = $('.buffering')[0];
var volumeBtn = $('.volume-btn')[0];
var volumeControls = $('.volume-controls')[0];
var volumeSlider = $('.volume-slider')[0];
var bufContext = buffering.getContext("2d");

var playing = new Audio();

bufContext.fillStyle = '#226bb0';

var apiHost = "http://localhost:5000/";

var inc = 0;
var playCall = false;
var currentPlayingID = "";

playing.oncanplay = function () {
    duration.textContent = time_convert(playing.duration);
    slider.max = Math.round(playing.duration);
    inc = buffering.width / playing.duration;
    if (playCall) {
        playing.play();
        playCall = false;
    }
}

playing.ontimeupdate = function () {
    slider.value = Math.round(playing.currentTime);
    currentTime.textContent = time_convert(playing.currentTime);
}

playing.onprogress = function () {
    for (var i = 0; i < playing.buffered.length; i++) {

        var startX = playing.buffered.start(i) * inc;
        var endX = (playing.buffered.end(i) * inc);

        bufContext.fillRect(startX, 2, endX - startX, buffering.height);
        bufContext.stroke();
    }
}

playing.onended = function () {
    if (!playing.loop) {
        playing.currentTime = 0;
        playIcon.classList.remove('fa-pause');
        playIcon.classList.add('fa-play');
        song.textContent = "Nothing Playing";
        window.document.title = "Nothing Playing";
    }
}

slider.oninput = () => playing.currentTime = slider.value

volumeSlider.oninput = () => playing.volume = volumeSlider.value / 100;

searchBox.addEventListener('keypress', function (e) {
    if (e.keyCode === 13) convertBtn.click();
});

playPause.addEventListener('click', function () {
    if (playing.currentSrc == "") return;
    if (playing.paused) {
        playing.play();
        playIcon.classList.remove('fa-play');
        playIcon.classList.add('fa-pause');
    } else {
        playing.pause();
        playIcon.classList.remove('fa-pause');
        playIcon.classList.add('fa-play');
    }
});

convertBtn.addEventListener('click', function () {
    if (searchBox.value.includes('youtube.com/watch?v=')) {
        var videoID = getURLParameter(searchBox.value, 'v')
        jQuery.getJSON(apiHost + "info/" + videoID, (info) => setPlayerInfo(info));
    } else if (searchBox.value.includes('list=')) {
        jQuery.getJSON(apiHost + "info/" + getURLParameter(searchBox.value, 'list'), (info) => {
            for (var id of info) download(apiHost + "downloadAudio/" + id)
        });
    } else jQuery.getJSON(apiHost + "query/" + encodeURIComponent(searchBox.value), (info) => setPlayerInfo(info[0], info[0]['id']));
});

loopBtn.addEventListener('click', function () {
    playing.loop = !playing.loop;
    if (playing.loop) loopBtn.style.background = "#226bb0";
    else loopBtn.style.background = "#2b2b2b";
});

volumeBtn.addEventListener('click', () => volumeControls.classList.toggle('hidden'));
bufContext.stroke();

downloadBtn.addEventListener('click', () => download(apiHost + "downloadAudio/" + currentPlayingID));

function play(videoID) {

    playing.setAttribute('src', apiHost + "audio/" + videoID);

    playing.currentTime = 0;
    playIcon.classList.remove('fa-play');
    playIcon.classList.add('fa-pause');
    playCall = true;
    playing.load();
    currentPlayingID = videoID;

    bufContext.clearRect(0, 0, buffering.width, buffering.height);

}

function setPlayerInfo(info) {
    let songname;

    songname = info['title'];

    song.textContent = songname;
    window.document.title = songname;

    if (info['thumburl'].includes('maxres')) bgimg.removeAttribute("style");
    else bgimg.style.filter = "blur(8px)";
    bgimg.style.backgroundImage = "url('" + info['thumburl'] + "')";
	
    playing.setAttribute('src', info["url"]);

    playing.currentTime = 0;
    playIcon.classList.remove('fa-play');
    playIcon.classList.add('fa-pause');
    playCall = true;
    playing.load();
    currentPlayingID = videoID;

    bufContext.clearRect(0, 0, buffering.width, buffering.height);
}

function time_convert(time) {
    var hrs = ~~(time / 3600);
    var mins = ~~((time % 3600) / 60);
    var secs = ~~time % 60;
    var ret = "";
    if (hrs > 0) ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
    ret += "" + mins + ":" + (secs < 10 ? "0" : "");
    ret += "" + secs;
    return ret;
}

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