var http = require("http"),
    url  = require("url"),
    qs   = require("querystring"),
    fs   = require('fs'),
    Tiny = require("tiny");


//清掉数据库
//Tiny('user.tiny', function(err, db) {
//    db.kill(function(err) {
//        console.log('kill user.tiny');
//    });
//})
//Tiny('message.tiny', function(err, db) {
//    db.kill(function(err) {
//        console.log('kill message.tiny');
//    });
//})

//获取指定时间的时间戳
function getTimeTS(day){
    var re = /(\d{4})(?:-(\d{1,2})(?:-(\d{1,2}))?)?(?:\s+(\d{1,2}):(\d{1,2}):(\d{1,2}))?/.exec(day);
    return new Date(re[1],(re[2]||1)-1,re[3]||1,re[4]||0,re[5]||0,re[6]||0).getTime();
}
var beginTime = getTimeTS("2014-03-29 00:00:00"),
    endTime = getTimeTS("2014-03-29 02:00:00");


httpServer = http.createServer(function (request, response) {
    //ajax长连接跨域解决
    var origin = (request.headers.origin || "*");
    if (request.method.toUpperCase() === "OPTIONS"){
        response.writeHead(
            "204",
            "No Content",
            {
                "access-control-allow-origin": origin,
                "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
                "access-control-allow-headers": "content-type, accept",
                "access-control-max-age": 10, // Seconds.
                "content-length": 0
            }
        );
        return( response.end() );
    }
    //这里获取参数data  ajax post data json(string)   如果用get 就不用这里了
    var requestBodyBuffer = [];
    request.on(
        "data",
        function( chunk ){
            //分解参数给requestBodyBuffer
            requestBodyBuffer.push( chunk );

        }
    );
    request.on(
        "end",
        function(){
            //可以在这里做数据库操作,响应内容 ，这里上可以自己定
            var pathname = url.parse(request.url).pathname,   //提交的请求路径
                callback = qs.parse(url.parse(request.url).query);

            switch (pathname){
                case '/robot.html':
                    responseRobot(callback);
                    break;
                case '/robotTalk.html':
                    responseRobotTalk(callback);
                    break;
                case '/getMessage.html':
                    collectMessage(callback);
                    break;
                case '/getAllRead.html':
                    getAllRead(callback);
                    break;
                case '/getSendButton.html':
                    getSendButton(callback);
                    break;
                case '/user.html':
                    handleUser(callback);
                    break;
                case '/message.html':
                    handleMessage(callback);
                    break;
                case '/groupmsg.html':
                    responseGroup(callback);
                    break;
                case '/membermsg.html':
                    responseMember(callback);
                    break;
                case '/onemsg.html':
                    responseOne(callback);
                    break;
                case '/infor.html':
                    responseInfor(callback);
                    break;
                default:
                    break;
            }

            if(pathname == "/robot.html"){
                responseRobot(callback);
            }else if(pathname == "/robotTalk.html"){
                responseRobotTalk(callback);
            }else if(pathname == "/getMessage.html"){
                collectMessage(callback);
            }else if(pathname == "/getAllRead.html"){
                getAllRead(callback);
            }else if(pathname == "/getSendButton.html"){
                getSendButton(callback);
            }else if(pathname == "/user.html"){
                handleUser(callback);
            }else if(pathname == "/message.html"){
                handleMessage(callback);
            }else if(pathname == "/groupmsg.html"){
                responseGroup(callback);
            }else if(pathname == "/membermsg.html"){
                responseMember(callback);
            }else if(pathname == "/onemsg.html"){
                responseOne(callback);
            }else if(pathname == "/infor.html"){
                responseInfor(callback);
            }
        }
    );

    //返回robot json数据
    function responseRobot(callback){
        var callback = callback,
            responseBody = "",
            len = 0;

        console.log('robot json');

        fs.readFile("public/json/robot.json","utf8", function(err, data) {
            if (err) {
                console.error(err);
            } else {
                // Close out the response.
                if(new Date().getTime() < beginTime){
                    responseBody = JSON.stringify({tips: 'noOpen'});
                    console.log('no open')
                }else if(new Date().getTime() > endTime){
                    responseBody = JSON.stringify({tips: 'close'});
                    console.log('close')
                }else{
                    responseBody = data;
                    console.log('open')
                }
                //console.log(responseBody);
                //响应头 ，以下这样就可以
                response.writeHead(
                    "200",
                    "OK",
                    {
                        "access-control-allow-origin": origin,
                        "content-type": "text/plain",
                        "content-length": Buffer.byteLength(responseBody, 'utf8')
                    }
                );

                return( response.end(responseBody));
            }
        });

    }

    //返回robot json数据
    function responseRobotTalk(callback){
        var callback = callback,
            responseBody = "",
            len = 0;
        console.log('robot talk json');

        fs.readFile("public/json/robot_talk.json","utf8", function(err, data) {
            if (err) {
                console.error(err);
            } else {
                responseBody = data;
                //console.log(responseBody);
                //响应头 ，以下这样就可以
                response.writeHead(
                    "200",
                    "OK",
                    {
                        "access-control-allow-origin": origin,
                        "content-type": "text/plain",
                        "content-length": Buffer.byteLength(responseBody, 'utf8')
                    }
                );
                // Close out the response.
                return( response.end(responseBody));
            }
        });

    }

    //收集数据
    function collectMessage(callback){
        var callback = callback,
            responseBody = "",
            keytime = new Date().getTime(),
            usernum = 0;

        Tiny('collectMessage.tiny', function(err, db) {
            usernum = db.length;
            responseBody = usernum + "";
            console.log("num",usernum);
            if(callback.send != ""){
                db.set(keytime, {
                    send: callback.send
                }, function(err) {
                    if(err){   //有错误
                        console.log(err);
                    }else{    //添加成功
                        console.log('collect!');
                    }
                });
            }

            //响应头 ，以下这样就可以
            response.writeHead(
                "200",
                "OK",
                {
                    "access-control-allow-origin": origin,
                    "content-type": "text/plain",
                    "content-length": Buffer.byteLength(responseBody, 'utf8')
                }
            );
            // Close out the response.
            return( response.end(responseBody));

        });
    }

    //记录多少人读完全部信息
    function getAllRead(callback){
        var callback = callback,
            responseBody = "",
            keytime = new Date().getTime(),
            usernum = 0;

        Tiny('getAllRead.tiny', function(err, db) {
            usernum = db.length;
            responseBody = usernum + "";
            db.set(keytime, {
                num: callback.readAll
            }, function(err) {
                if(err){   //有错误
                    console.log(err);
                }else{    //添加成功
                    console.log('read all!');
                }
            });

            //响应头 ，以下这样就可以
            response.writeHead(
                "200",
                "OK",
                {
                    "access-control-allow-origin": origin,
                    "content-type": "text/plain",
                    "content-length": Buffer.byteLength(responseBody, 'utf8')
                }
            );
            // Close out the response.
            return( response.end(responseBody));

        });
    }

    //记录多少人点击发送
    function getSendButton(callback){
        var callback = callback,
            responseBody = "",
            keytime = new Date().getTime(),
            usernum = 0;

        Tiny('getSendButton.tiny', function(err, db) {
            usernum = db.length;
            responseBody = usernum + "";
            db.set(keytime, {
                num: callback.firstsend
            }, function(err) {
                if(err){   //有错误
                    console.log(err);
                }else{    //添加成功
                    console.log('first send!');
                }
            });

            //响应头 ，以下这样就可以
            response.writeHead(
                "200",
                "OK",
                {
                    "access-control-allow-origin": origin,
                    "content-type": "text/plain",
                    "content-length": Buffer.byteLength(responseBody, 'utf8')
                }
            );
            // Close out the response.
            return( response.end(responseBody));

        });
    }



    //处理user
    function handleUser(callback){
        var callback = callback,
            responseBody = "",
            keytime = new Date().getTime(),
            usernum = 0;

        Tiny('user.tiny', function(err, db) {
            usernum = db.length;
            responseBody = usernum + "";
            console.log("num",usernum);
            if(callback.type == "set"){
                db.set(keytime, {
                    uid: callback.uid + usernum,
                    rid: callback.rid
                }, function(err) {
                    if(err){   //有错误
                        console.log(err);
                    }else{    //添加成功
                        console.log('set!');
                    }
                });
            }else if(callback.type == "update"){
                db.fetch({
                    limit: 1,
                    uid:   callback.uid
                }, function(obj, key){
                    return true;
                }, function(err, datas){
                    db.update(datas[0]._key, {
                        rid: callback.rid
                    }, function(err) {
                        console.log('update!');
                    });
                });

            }

            //响应头 ，以下这样就可以
            response.writeHead(
                "200",
                "OK",
                {
                    "access-control-allow-origin": origin,
                    "content-type": "text/plain",
                    "content-length": Buffer.byteLength(responseBody, 'utf8')
                }
            );
            // Close out the response.
            console.log(responseBody);
            return( response.end(responseBody));

        });
    }

    //处理用户提交信息
    function handleMessage(callback){
        var callback = callback,
            responseBody = "",
            keytime = new Date().getTime();

        Tiny('message.tiny', function(err, db) {
            if(callback.type == "one"){   //如果是独聊返回的消息
                responseBody = "success";
                db.set(keytime, {
                    ts: callback.ts,
                    uid: callback.uid,
                    rid: callback.rid,
                    type: callback.type,
                    detail: callback.detail,
                    tuid: callback.tuid
                }, function(err) {
                    if(err){   //有错误
                        console.log(err);
                    }else{    //添加成功
                        console.log('set!');
                    }
                });
                //响应头 ，以下这样就可以
                response.writeHead(
                    "200",
                    "OK",
                    {
                        "access-control-allow-origin": origin,
                        "content-type": "text/plain",
                        "content-length": Buffer.byteLength(responseBody, 'utf8')
                    }
                );
                // Close out the response.
                return(response.end(responseBody));
            }else{   //群聊返回的消息
                if(callback.type == "message" && callback.detail == ""){
                    return;
                }
                responseBody = "success";
                db.set(keytime, {
                    ts: callback.ts,
                    uid: callback.uid,
                    rid: callback.rid,
                    type: callback.type,
                    detail: callback.detail
                }, function(err) {
                    if(err){   //有错误
                        console.log(err);
                    }else{    //添加成功
                        console.log('set!');
                    }
                });
                //响应头 ，以下这样就可以
                response.writeHead(
                    "200",
                    "OK",
                    {
                        "access-control-allow-origin": origin,
                        "content-type": "text/plain",
                        "content-length": responseBody.length
                    }
                );
                // Close out the response.
                return(response.end(responseBody));
            }


        });
    }

    //返回聊天室记录
    function responseGroup(callback){
        var callback = callback,
            responseBody = "",
            rid = callback.rid,
            ts = callback.ts,
            oldts = callback.oldts,
            msg = null,
            len = 0;

        msg = callback.num? {
            desc: '_key',
            limit: callback.num
        }:{
            asc: '_key'
        };

        Tiny('message.tiny', function(err, db) {
            db.fetch(msg, function(doc, key){
                if (doc.rid == rid && doc.type != "one" && doc.ts >= oldts && doc.ts <= ts) {
                    return true;
                }
            }, function(err, datas){
                responseBody = JSON.stringify(datas);
                len = responseBody.match(/[^ -~]/g) == null ? responseBody.length : responseBody.length + responseBody.match(/[^ -~]/g).length;
            });
            //响应头 ，以下这样就可以
            response.writeHead(
                "200",
                "OK",
                {
                    "access-control-allow-origin": origin,
                    "content-type": "text/plain",
                    "content-length": Buffer.byteLength(responseBody, 'utf8')
                }
            );
            // Close out the response.
            return( response.end(responseBody));

        });
    }

    //返回独聊记录
    function responseOne(callback){
        var callback = callback,
            responseBody = "",
            uid = callback.uid,
            tuid = callback.tuid,
            ts = callback.ts,
            oldts = callback.oldts,
            msg = null,
            len = 0;

        msg = callback.num? {
            desc: '_key',
            limit: callback.num
        }:{
            asc: '_key'
        };

        Tiny('message.tiny', function(err, db) {
            db.fetch(msg, function(doc, key){
                if(doc.type == "one" && doc.uid == uid && doc.tuid == tuid && doc.ts >= oldts && doc.ts <= ts){
                    return true;
                }
                if(doc.type == "one" && doc.uid == tuid && doc.tuid == uid && doc.ts >= oldts && doc.ts <= ts){
                    return true;
                }

            }, function(err, datas){
                responseBody = JSON.stringify(datas);
                len = responseBody.match(/[^ -~]/g) == null ? responseBody.length : responseBody.length + responseBody.match(/[^ -~]/g).length;
            });
            //响应头 ，以下这样就可以
            response.writeHead(
                "200",
                "OK",
                {
                    "access-control-allow-origin": origin,
                    "content-type": "text/plain",
                    "content-length": Buffer.byteLength(responseBody, 'utf8')
                }
            );
            // Close out the response.
            return( response.end(responseBody));

        });
    }

    //返回成员列表
    function responseMember(callback){
        var callback = callback,
            responseBody = null,
            rid = callback.rid,
            uidlist = null,
            arr = [],
            len = 0;
        //取到user.tiny匹配rid的uid
        Tiny('user.tiny', function(err, db) {
            db.fetch({
                asc: '_key'
            }, function(doc, key){
                if (doc.rid == rid) {
                    return true;
                }
            }, function(err, datas){
                uidlist = datas;
            });
            Tiny('message.tiny', function(err, db) {
                for(var i = 0,lens = uidlist.length; i < lens; i++){
                    db.fetch({
                        limit: 1,
                        desc: "ts"
                    }, function(doc, key){
                        if (doc.uid == uidlist[i].uid && doc.type == "message" && doc.detail != "") {
                            return true;
                        }
                    }, function(err, datas){
                        if(datas[0] == undefined){
                            datas[0] = {
                                ts: uidlist[i]._key,
                                rid: uidlist[i].rid,
                                uid:uidlist[i].uid,
                                detail: "他很懒，啥都没留下。。",
                                type: "message"
                            }
                        }
                        arr[i] = datas[0];
                    });
                }
                responseBody = JSON.stringify(arr);
                len = responseBody.match(/[^ -~]/g) == null ? responseBody.length : responseBody.length + responseBody.match(/[^ -~]/g).length;
                //响应头 ，以下这样就可以
                response.writeHead(
                    "200",
                    "OK",
                    {
                        "access-control-allow-origin": origin,
                        "content-type": "text/plain",
                        "content-length": Buffer.byteLength(responseBody, 'utf8')
                    }
                );
                // Close out the response.
                return( response.end(responseBody));
            });
        });



    }

    //返回消息列表
    function responseInfor(callback){
        var callback = callback,
            responseBody = null,
            uid = callback.uid,
            hasuid,
            len = 0;

        Tiny('message.tiny', function(err, db) {
            db.fetch({
                desc: "ts"
            }, function(doc, key){
                if (doc.type == "one" && doc.tuid == uid && hasuid != doc.uid) {
                    hasuid = doc.uid;
                    return true;
                }
            }, function(err, datas){
                responseBody = JSON.stringify(datas);
                len = responseBody.match(/[^ -~]/g) == null ? responseBody.length : responseBody.length + responseBody.match(/[^ -~]/g).length;
            });

            //响应头 ，以下这样就可以
            response.writeHead(
                "200",
                "OK",
                {
                    "access-control-allow-origin": origin,
                    "content-type": "text/plain",
                    "content-length": Buffer.byteLength(responseBody, 'utf8')
                }
            );
            // Close out the response.
            return( response.end(responseBody));
        });


    }



}).listen(5000);