function CommonTools(D,W) {
    var _self = this;

    _self.vendor = function() {
        var obj = {
                webkit: "webkitTransform",
                Moz: "MozTransition",
                O: "OTransform"
            },
            style = document.body.style;
        for(key in obj) {
            if(obj[key] in style) {
                return [key, "-" + key.toLowerCase() + "-"];
            }
        }
    }();

    //touch事件支持检测
    _self.isTouch = 'ontouchstart' in window;
    _self.startEvent = "touchstart";
    _self.moveEvent = "touchmove";
    _self.endEvent = "touchend";
    if(!_self.isTouch) {
        _self.startEvent = "mousedown";
        _self.moveEvent = "mousemove";
        _self.endEvent = "mouseup";
    }

    //IOS检测
    _self.isMobileSafari = navigator.userAgent.match(/(ipad|iphone|ipod).*mobile.*Safari/i);

    _self.css = {
        translate3d: function(elem, x, y, z) {
            var str = "translate3d(" + x + "," + y + "," + z + ")";
            elem.style.WebkitTransform = str;
            elem.style.MozTransform = str;
            elem.style.OTransform = "translate(" + x + "," + y + ")"; //Opera 12.5- unsupported 3D
            elem.style.transform = str;
            return elem;
        },

        //设置transform css方法
        transform: function(elem, str) {
            elem.style[_self.vendor[0] + "Transform"] = str;
            return elem;
        },

        //设置transition css方法
        transition: function(elem) {
            var str = "";
            if(arguments.length > 1) {
                str = [].slice.call(arguments, 1).join(",");
            }
            elem.style[_self.vendor[0] + "Transition"] = str;
            return elem;
        }
    };

    _self.fn = {
        client: function(e, path) {
            var str = "client" + path;
            if(_self.isTouch) {
                _self.client = function(e, path) {
                    var str = "client" + path;
                    return e.targetTouches[0][str];
                }
                return e.targetTouches[0][str];
            } else {
                _self.client = function(e, path) {
                    var str = "client" + path;
                    return e[str];
                }
                return e[str];
            }
        },

        LS: {
            createLS: function(table) {
                if(localStorage[table]) {
                    console.log("已存在");
                    return;
                }
                if(arguments[1]) {
                    localStorage[table] = JSON.stringify(arguments[1]);
                } else {
                    localStorage[table] = "";
                }
            },
            selectLS: function(str, table) {
                var data = localStorage[table];
                if(!data) {
                    console.warn("[selectLS]: localStorage[\"" + table + "\"] is undefined!");
                    return [[], []];
                }

                data = JSON.parse(data);

                var result = [[], []],
                    i = 0,
                    num = 0;
                if(str === "*") {
                    result[0] = data;
                    for(i = 0; i < data.length; i++) {
                        result[1].push(i);
                    }
                    return result;
                }
                var arr = str.split(","),
                    index = "",
                    value = "",
                    r1 = [],
                    r2 = [];
                for(i = 0; i < arr.length; i++) {
                    var j = 0;
                    index = arr[i].split("=")[0];
                    value = arr[i].split("=")[1];
                    if(i == 0) {
                        for(j = 0; j < data.length; j++) {
                            if(data[j][index] == value) {
                                r1.push(j);
                            }
                        }
                    } else {
                        for(j = 0; j < r1.length; j++) {
                            num = r1[j];
                            if(data[num][index] == value) {
                                r2.push(num);
                            }
                        }
                        r1 = r2;
                        r2 = [];
                    }
                }
                for(i = 0; i < r1.length; i++) {
                    num = r1[i];
                    result[0].push(data[num]);
                }
                result[1] = r1;
                return result;
            },
            deleteLS: function(str, table) {
                var data = localStorage[table];
                if(!data) {
                    console.warn("[deleteLS]: localStorage[\"" + table + "\"] is undefined!");
                    return;
                }

                data = JSON.parse(localStorage[table]);

                if(str === "*") {
                    localStorage.removeItem(table);
                    return;
                }

                var result = this.selectLS(str, table);
                for(var i = 0; i < result[1].length; i++) {
                    var num = result[1][i] - i;
                    data.splice(num, 1);
                }
                localStorage[table] = JSON.stringify(data);
            },
            insertLS: function(obj, table) {
                var data = JSON.parse(localStorage[table]);
                if(obj.push) {
                    for(var i = 0, length = obj.length; i < length; i++) {
                        data.push(obj[i]);
                    }
                } else {
                    data.push(obj);
                }
                localStorage[table] = JSON.stringify(data);
            },
            updateLS: function(str1, str2, table) {
                var data = JSON.parse(localStorage[table]),
                    result = this.selectLS(str2, table);
                if(result[1].length > 1) {
                    console.log("匹配结果大于1");
                    return;
                }
                var arr = str1.split(","),
                    key = result[1][0],
                    index = "",
                    value = "";
                for(var i = 0; i < arr.length; i++) {
                    index = arr[i].split("=")[0];
                    value = arr[i].split("=")[1];
                    data[key][index] = value;
                }
                localStorage[table] = JSON.stringify(data);
            }
        }
    };

    _self.ajax = {
        //ARQAjax Automatic repeat request Ajax
        ARQAjax_xhr: {},
        ARQAjax: (function(){
            function ajaxErr(opt){
                --opt.times && setTimeout(function(){ ARQAjax(opt) }, opt.ARQTime);
            }
            function ARQAjax(opt){
                !opt.times && (opt.times = 5);
                !opt.ARQTime && (opt.ARQTime = 3000);
                !opt._id && (opt._id = + new Date() + (Math.random() * 1000000 | 0));

                _self.ajax.ARQAjax_xhr[opt._id] = $.ajax(
                    $.extend({}, opt, {
                        success: function(data){
                            if(data){
                                delete _self.ajax.ARQAjax_xhr[opt._id];
                                opt.success(data);
                            }else{
                                ajaxErr(opt);
                            }
                        },
                        error: function(xhr, errorType, error){
                            console && console.error('ajax:' + errorType + ' ' + error);
                            if(opt.times > 0){
                                ajaxErr(opt);
                            }else{
                                delete _self.ajax.ARQAjax_xhr[opt._id];
                                opt.error(xhr, errorType, error);
                            }
                        }
                    })
                );

                return opt._id;
            }

            return ARQAjax;
        })()
    };

    //聊天室专用
    _self.chatLink = "i";
    _self.chat = {
        //夜聊开放时间0-23,[开始，结束]
        openTime: [10,19],
        //各接口链接
        urls: {
            user:  _self.chatLink + "/user.html?",  //用户
            groupmsg: _self.chatLink + "/groupmsg.html?",   //群聊接收
            sendmsg: _self.chatLink + "/message.html?", //发送
            robotmsg: _self.chatLink + "/robot.html?",  //机器人
            robotTalkmsg: _self.chatLink + "/robotTalk.html?",  //机器人
            onemsg: _self.chatLink + "/onemsg.html?",   //独聊接收
            membermsg: _self.chatLink + "/membermsg.html?",   //成员接收
            messagemsg: _self.chatLink + "/infor.html?"    //信息接收
        },
        //聊天室
        roomName: ["女神","天朝","梦想","八卦","书城","情感","直播","树洞"],
        //昵称
        nickName : ["屌丝","2B青年","美白富","文艺青年","小清新","深宅腐","神经质","多动儿","拽霸天","土豪"],
        //状态容器
        loadStatus : $(".loadStatus"),
        //共用ls
        commonLS : {
            ncInit: "nc_Init",  //夜聊初始化
            ncRoom: "nc_Room",   //房间初始化进入时间
            ncOne: "nc_One"    //独聊初始化开始聊天时间
        },
        //是否滚动到底部
        scrollToBottom : true,
        // 获取location的hash，以数组返回
        getHash: function(separator) {
            var s = separator ? separator : "/";
            return location.hash.slice(1).split(s);
        },
        //根据uid获得p,n,s,x的值
        getUidMsg: function(uid){
            var p, n, s, x;
            p = uid.match(/p[0-9]+/gi)[0].replace(/p/,"");
            n = uid.match(/n[0-9]+/gi)[0].replace(/n/,"");
            s = uid.match(/s[0-9]+/gi)[0].replace(/s/,"");
            x = uid.match(/x[0-9]+/gi)[0].replace(/x/,"");
            return {p: p,n: n,s: s,x: x};
        },
        //匹配在哪个页面，传入要匹配的页面名称，如index.html,传入index
        regPage: function(name){
            var href = location.href,
                regHtml = eval("/.html/"),
                regName = eval("/"+ name +".html/");
            //如果要匹配首页index，有可能匹配不到‘.html’
            if(name == "index"){
                return (!regHtml.test(href) || regName.test(href))? true: false;
            }else{
                return regName.test(href)? true: false;
            }
        },
        //是否开放时间内
        isOpenTime: function(){
            var nowHour = new Date().getHours(),
                openTime = _self.chat.openTime;
            //开放时间,有两种情况：1，开始时间在0点前；2，开始时间从0点或0点之后开始。返回true为开放时间内
            return (openTime[0] > openTime[1] && (nowHour >= openTime[0] || nowHour < openTime[1])) ||   //横跨0点
                (openTime[0] < openTime[1] && (nowHour >= openTime[0] & nowHour < openTime[1]));  //0点及之后
        },
        //全局初始化验证
        commonInit: function(){
            var now = new Date(),
                nowYear = now.getYear(),
                nowMouth = now.getMonth(),
                nowDay = now.getDate(),
                nowHour = now.getHours(),
                openTime = _self.chat.openTime,
                //openHours = openTime[0] > openTime[1] ? 24 - openTime[0] + openTime[1] : openTime[1] - openTime[0],  //开放时数
                ncLS = _self.chat.commonLS,
                ls = _self.fn.LS;
            //判断是否开放时间内
            if(_self.chat.isOpenTime()){
                if(!localStorage[ncLS.ncInit]) {   //没有初始LS则跳转到身份页创建
                    location.replace('identity.html');
                }else{   //有初始LS则判断ts是否在开放时间内
                    var lsTime = _self.fn.LS.selectLS("*", ncLS.ncInit)[0][0].ts,
                        beginTime = nowHour >= openTime[0]? new Date(nowYear,nowMouth,nowDay,openTime[0]).getTime():
                            new Date(nowYear,nowMouth,nowDay - 1,openTime[0]).getTime();
                    if(lsTime < beginTime){   //过期ts，跳转到身份页重新认证
                        location.replace('identity.html');
                    }else{    //其他情况则为开放时间内有效ts，仍需验证是否有其他LS存在，无则创建，在identity中也有该判断
                        //记录聊天室初始进入时间
                        if(!localStorage[ncLS.ncRoom]) {
                            ls.createLS(ncLS.ncRoom, [{
                                r0: 0,
                                r1: 0,
                                r2: 0,
                                r3: 0,
                                r4: 0,
                                r5: 0,
                                r6: 0,
                                r7: 0
                            }]);
                        };

                        //记录每个独聊对象初始聊天时间
                        if(!localStorage[ncLS.ncOne]) {
                            ls.createLS(ncLS.ncOne, [{}]);
                        };
                    }
                }
            }else{    //非开放时间,跳转到index.html，并提示开放时间段
                //判断是否为首页，首页不跳转，其他页面跳转，在首页提示
                if( !_self.chat.regPage('index')){   //非首页跳转到首页
                    location.replace('index.html');
                }else{   //首页提示开放时间
                    $(".openTips").html('开放时间为：'+ openTime[0] +'点到'+ openTime[1] +'点~~').show();
                }
            }
        },
        //认证身份,根据ls验证
        identity: function(initLSName){  
            var lsdata = _self.fn.LS.selectLS("*", initLSName)[0],
                uid = lsdata[0].uid,
                rid = lsdata[0].rid;
            //如果uid无效，跳转到身份页
            if(!uid.match(/x[0-9]+/gi)){
                location.replace("../identity.html");
            }
            //rid判断
            if(rid == "" || rid >= _self.chat.roomName.length){
                rid = 0;
                _self.fn.LS.updateLS("rid=0", "*", initLSName);
            }
            //返回最新的ls
            return _self.fn.LS.selectLS("*", initLSName)[0][0];
        },
        //加载状态控制器
        loadStatusController: function(statusCode){
            loadStatus = _self.chat.loadStatus;
            switch (statusCode) {
                case 0:
                    loadStatus.html('');
                    loadStatus.hide();
                    break;

                case 100:
                    loadStatus.html('<div class="loadStatusCircle"></div>正在加载中...');
                    loadStatus.show();
                    break;

                case 200:
                    loadStatus.html('加载成功');
                    loadStatus.show();
                    break;

                case 201:
                    loadStatus.html('没有找到相关内容 &gt;_&lt;');
                    loadStatus.show();
                    break;

                case 404:
                    loadStatus.html('加载失败');
                    loadStatus.show();
                    break;

                default :
                    break;
            }
        }
    };


    _self.extend = function(target){
        [].slice.call(arguments, 1).forEach(function(source) {
            for (key in source)
                if (source[key] !== undefined)
                    target[key] = source[key]
        });
        return target;
    };

}(document,window);

window.CT = new CommonTools();



