var http = require("http"),
    url  = require("url"),
    qs   = require("querystring"),
    fs   = require('fs'),
    Tiny = require("tiny"),
    sys = require('util'),
    Client = require('mysql'),
    client = Client.createConnection({
        'user':'root',
        'password':'root'
    });

var date = new Date(),
    createtime = date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate();

//获取指定时间的时间戳
function getTimeTS(day){
    var re = /(\d{4})(?:-(\d{1,2})(?:-(\d{1,2}))?)?(?:\s+(\d{1,2}):(\d{1,2}):(\d{1,2}))?/.exec(day);
    return new Date(re[1],(re[2]||1)-1,re[3]||1,re[4]||0,re[5]||0,re[6]||0).getTime();
}
var beginTime = getTimeTS("2014-04-22 00:00:00"),
    endTime = getTimeTS("2014-04-30 02:00:00");

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
                    responseRobot();
                    break;
                case '/robotIntelligent.html':
                    responseRobotIntelligent();
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
                default:
                    break;
            }

        }
    );

    //返回robot json数据
    var responseRobot = function(){
        var responseBody = "";
        console.log('robot json');
        fs.readFile("public/json/robot.json","utf8", function(err, data) {
            if (!err) {
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

    //返回robot Intelligence json数据
    var responseRobotIntelligent = function(){
        var responseBody = "";
        console.log('robot Intelligent json');

        fs.readFile("public/json/intelligent.json","utf8", function(err, data) {
            if (!err) {
                responseBody = data;
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

    //收集数据
    var collectMessage = function(callback){
        var callback = callback,
            responseBody = "";

        client.query('USE nightchat',function(error,results){
            if(error){
                console.log('collectmessage Error:'+error.message)
                client.end();
                return;
            }
            client.query('insert into collectmessage set date=?,content=?',[createtime, callback.send],function(error,results){
                if(error){
                    console.log('ClientReady Error:'+error.message);
                    client.end();
                    return;
                }
            });
        });

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

    //记录多少人读完全部信息
    var getAllRead = function(callback){
        var responseBody = "";

        client.query('USE nightchat',function(error,results){
            if(error){
                console.log('getAllRead Error:'+error.message)
                client.end();
                return;
            }
            client.query('insert into getallread set date=?',[createtime],function(error,results){
                if(error){
                    console.log('ClientReady Error:'+error.message);
                    client.end();
                    return;
                }
                console.log('getAllRead Inserted:'+results.affectedRows+'row.');
            });
        });

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

    //记录多少人点击发送
    var getSendButton = function(callback){
        var responseBody = "";

        client.query('USE nightchat',function(error,results){
            if(error){
                console.log('getsendbutton Error:'+error.message)
                client.end();
                return;
            }
            client.query('insert into getsendbutton set date=?',[createtime],function(error,results){
                if(error){
                    console.log('ClientReady Error:'+error.message);
                    client.end();
                    return;
                }
                console.log('getSendButton Inserted:'+results.affectedRows+'row.');
            });
        });

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


}).listen(5000);