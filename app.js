const cors = require('cors');
const express = require('express');
const request = require('request');
const ytdl = require('ytdl-core');
const contentDisposition = require('content-disposition');
var app = express();

var stolenApiKey = "AIzaSyCIM4EzNqi1in22f4Z3Ru3iYvLaY8tc3bo";

app.use(cors());

app.get('/audio/:videoID', (req, res) => {
    info(req.params.videoID, (err, info) => {
        if (err) res.sendStatus(404);
        else
            for (var formats of info['formats'])
                if (formats['container'] == "m4a") res.redirect(formats['url']);
    });
});

app.get('/video/:videoID', (req, res) => {
    info(req.params.videoID, (err, info) => {
        if (err) res.sendStatus(404);
        else res.redirect(info['formats'][0]['url']);
    });
});

app.get('/shortinfo/:videoID', (req, res) => {
    info(req.params.videoID, (err, info) => {
        if (err) res.sendStatus(404);
        else {

            var craftedInfo = {};
            craftedInfo['title'] = info['player_response']['videoDetails']['title'];
            craftedInfo['author'] = info['player_response']['videoDetails']['author'].replace(" - Topic", "");

            request.head("https://i.ytimg.com/vi/" + info['player_response']['videoDetails']['videoId'] + "/maxresdefault.jpg", (err, resp) => {
                if (err || resp.statusCode == 404) craftedInfo['thumburl'] = "https://i.ytimg.com/vi/" + info['player_response']['videoDetails']['videoId'] + "/hqdefault.jpg";
                else craftedInfo['thumburl'] = "https://i.ytimg.com/vi/" + info['player_response']['videoDetails']['videoId'] + "/maxresdefault.jpg";
                res.json(craftedInfo);

            });
        }
    });
});

app.get('/info/:videoID', (req, res) => {
    info(req.params.videoID, (err, info) => {
        if (err) res.sendStatus(404);
        else res.json(info['player_response']['videoDetails']);
    });
});

app.get('/formats/:videoID', (req, res) => {
    info(req.params.videoID, (err, info) => {
        if (err) res.sendStatus(404);
        else res.json(info['formats']);
    });
});

app.get('/query/:query', (req, res) => {
    search(req.params.query, (err, results) => {
        if (err) res.sendStatus(404);
        else res.json(results);
    });
});

app.get('/playlist/:listID', (req, res) => {
    parsePlaylist(req.params.listID, (err, results) => {
        if (err) res.sendStatus(404);
        else res.json(results);
    });
});

app.get('/playlistFull/:listID', (req, res) => {
    parsePlaylist(req.params.listID, (err, results) => {
        if (err) res.sendStatus(404);
        else {
            var playlistFull = [];
            for (var id of results) {
                info(id, (err, info) => {
                    if (err) res.sendStatus(404);
                    else {

                        var craftedInfo = {};
                        craftedInfo['title'] = info['player_response']['videoDetails']['title'];
                        craftedInfo['author'] = info['player_response']['videoDetails']['author'].replace(" - Topic", "");

                        request.head("https://i.ytimg.com/vi/" + info['player_response']['videoDetails']['videoId'] + "/maxresdefault.jpg", (err, resp) => {
                            if (err || resp.statusCode == 404) craftedInfo['thumburl'] = "https://i.ytimg.com/vi/" + info['player_response']['videoDetails']['videoId'] + "/hqdefault.jpg";
                            else craftedInfo['thumburl'] = "https://i.ytimg.com/vi/" + info['player_response']['videoDetails']['videoId'] + "/maxresdefault.jpg";
                            playlistFull.push(craftedInfo);

                        });
                    }
                });
            }
            res.json(playlistFull);
        }
    });
});

app.get('/downloadAudio/:videoID', (req, res) => {
    info(req.params.videoID, (err, info) => {
        if (err) res.sendStatus(404);
        else {
            for (var formats of info['formats'])
                if (formats['container'] == "m4a") {
                    var filename;
                    if (info['player_response']['videoDetails']['title'].toLowerCase().includes(info['player_response']['videoDetails']['author'].replace(" - Topic", "").toLowerCase())) filename = info['player_response']['videoDetails']['title']
                    else filename = info['player_response']['videoDetails']['title'] + " - " + info['player_response']['videoDetails']['author'].replace(" - Topic", "");
                    res.header('Content-Disposition', 'attachment; filename="' + filename.replace(/[^\x00-\x7F]/g, "") + '.m4a"');

                    request.head(formats['url'], (error, response, body) => {
                        if (error) return;
                        if (response.headers['accept-ranges'] == "bytes") {
                            var len = response.headers['content-length'];
                            var options = {
                                url: formats['url'],
                                headers: {
                                    'Range': 'bytes=0-' + len
                                }
                            };
                            request.get(options).pipe(res);
                        }
                    })
                    break;
                }
        }
    });
});

app.listen(3000);

function info(videoID, callback) {
    if (ytdl.validateID(videoID)) {
        ytdl.getInfo(videoID, {}, (err, info) => {
            if (err) callback("not valid url");
            callback(undefined, info);
        });
    } else callback("not valid url");
}

function parsePlaylist(listid, callback) {
    var queryLink = "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet%2CcontentDetails&maxResults=50&playlistId=" + listid + "&key=" + stolenApiKey;
    var options = {
        url: queryLink,
        json: true
    };
    request(options, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            var videoList = [];
            for (var video of body['items']) videoList.push(video['contentDetails']['videoId']);
            callback(undefined, videoList);
        } else callback("error");
    });
}

function search(query, callback) {
    var queryLink = "https://www.googleapis.com/youtube/v3/search?part=id,snippet&maxResults=15&q=" + encodeURIComponent(query + " topic") + "&key=" + stolenApiKey;
    var options = {
        url: queryLink,
        json: true
    };
    request(options, (error, response, body) => {
        if (!error && response.statusCode === 200) beautyIterator(body['items']).then(vids => callback(undefined, vids));
        else callback("error");
    });
}

async function beautyIterator(videoList) {
    var vids = []
    for (var item of videoList)
        if (item['id']['kind'] == "youtube#video") {
            var beauty = await beautifyResult(item);
            vids.push(beauty);
        }
    return vids;
}

async function beautifyResult(video) {
    var videoItem = {};

    videoItem['id'] = video['id']['videoId'];
    videoItem['author'] = video['snippet']['channelTitle'].replace(" - Topic", "");
    videoItem['title'] = video['snippet']['title'];

    var promise = new Promise((resolve, reject) => {
        request.head("https://i.ytimg.com/vi/" + videoItem['id'] + "/maxresdefault.jpg", (err, res) => {
            if (err || res.statusCode == 404) resolve("https://i.ytimg.com/vi/" + videoItem['id'] + "/hqdefault.jpg");
            else resolve("https://i.ytimg.com/vi/" + videoItem['id'] + "/maxresdefault.jpg");
        });
    });

    videoItem['thumburl'] = await promise;
    return videoItem;

}