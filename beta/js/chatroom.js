!function(W,D){
    var chatFn = CT.chat, ls = CT.fn.LS, loadStatusController = chatFn.loadStatusController,
        ncInitLS = chatFn.commonLS.ncInit, ncSnapLS = chatFn.commonLS.ncSnap,
        ARQAjax = CT.ajax.ARQAjax, put = CT.ajax.put,isOpen = false;
    //聊天功能
    var chatInit = function(myConfig, initFn){
        var _config = CT.extend({
            chats : $(".chats"),
            chatList : $(".chatList"),
            menuList : $(".menuList"),
            faceBox : $(".faceBox"),
            operateList : $(".operateList"),
            loadMore : $(".loadMore"),
            rid : ls.selectLS("*", ncInitLS)[0][0].rid,    //聊天室id
            uid : ls.selectLS("*", ncInitLS)[0][0].uid,
            enterRoomTS : null,   //初始聊天时间，group|one
            oldts : new Date().getTime(),   //当前时间，也是polling上一次发送时间
            robotMsgM : 2*60*1000, //robot发送机制--每两分钟,毫秒计算
            photoNum : chatFn.nickName.length,  //头像个数(与昵称个数对应，相同个数)
            nickNum : chatFn.nickName.length,   //昵称个数
            noNum : 100,    //序号范围0-99
            robotMsg : null,  //robot数据
            robotNum : 0,
            robotTalkMsg : null,   //robot对话数据
            robotTalkNum : 0,
            robotCounter : 0,    //robot数据计数器
            robotTalkCounter : 0,    //robot对话数据计数器
            publicRobotDate : 0,    //robot发布时间
            defaultPage : "group",  //默认设置页面  group|one
            haveHistory : false,  //是否获取更多消息
            breakLoading : false  //是否中断加载
        }, myConfig);

        var tool = {
            /**
             * 生成robot,返回数组，都是随机产生，获取
             * @param type   数据内容
             * @param counter   计数器
             * @param isArr    是否传入数组
             * @returns {Array}
             */
            creatRobot: function(msg,counter,isArr){
                var ruid = function(){
                        return "p" + Math.floor(Math.random()*(_config.photoNum - 1)) +
                            "n" + Math.floor(Math.random()*_config.nickNum) +
                            "s" + Math.floor(Math.random()*2) +
                            "x" + Math.floor(Math.random()*_config.noNum)
                    },
                    ts = new Date().getTime(),
                    msgLenght = msg[counter].length,
                    tempArr = [],
                    detail,img,link;
                if(isArr){   //对话
                    for(var i = 0; i < msgLenght; i++){   //循环输出每条，返回数组
                        var content = msg[counter][i];
                        detail = content.message || "";
                        img = content.img || "";
                        link = content.link || "";
                        tempArr[i] = {
                            uid: ruid(),
                            ts: ts,
                            type: "robot",
                            detail: detail,
                            img: img,
                            link: link
                        };
                    }
                    return tempArr;
                }else{    //单条robot
                    var content = msg[counter];
                    detail = content.message || "";
                    img = content.img || "";
                    link = content.link || "";
                    return [{
                        uid: ruid(),
                        ts: ts,
                        type: "robot",
                        detail: detail,
                        img: img,
                        link: link
                    }];
                }
            },
            //robot发送规律
            sendRobot: function(no,talkno){
                var tempArr = null,
                    tempArrLength = 0,
                    lsdata = ls.selectLS("*", ncSnapLS)[0][0],
                    setRobotFn = function(){
                        //如果已经遍历完robot数据，则跳出
                        if(_config.robotCounter == _config.robotNum && _config.robotTalkCounter == _config.robotTalkNum){
                            $('.openTips').html('亲，注意身体，明天再来哦~').show();
                            ls.updateLS('readAllRobot=1', '*', ncSnapLS);
//                            ga('send', 'event', 'button', 'click', 'read-all-robots');
                            put(chatFn.urls.getAllRead + "readAll=yes"); //统计数据,统计读完所有robot的
                            return;
                        }
                        setTimeout(function(){
                            if(_config.robotCounter < _config.robotNum){   //如果计数器已经小于robot条数，则输出robot数据，否则不执行
                                TOOL.toolset.ui(tool.creatRobot(_config.robotMsg, _config.robotCounter, false), 0);
                                _config.robotCounter++;
                                ls.updateLS('robotNo=' + _config.robotCounter, '*', ncSnapLS);
                            }
                            if(_config.robotTalkCounter < _config.robotTalkNum){    //如果还有对话数据
                                setTimeout(function(){
                                    tempArr = tool.creatRobot(_config.robotTalkMsg,_config.robotTalkCounter, true);
                                    tempArrLength = tempArr.length;
                                    TOOL.toolset.ui([tempArr[0]],0);   //先发送第一条对话
                                    if(tempArrLength > 1){
                                        var i=0;
                                        function setLoop(){
                                            i++;
                                            if(i < tempArrLength){
                                                setTimeout(function(){
                                                    TOOL.toolset.ui([tempArr[i]],0);
                                                    setLoop();
                                                },3000);
                                            }
                                        };
                                        setLoop();
                                    }
                                    _config.robotTalkCounter++;
                                    ls.updateLS('robotTalkNo=' + _config.robotTalkCounter, '*', ncSnapLS);
                                },(Math.floor(Math.random()*10) + 5)*1000);
                            }
                            setTimeout(setRobotFn, (Math.floor(Math.random()*5) + 5)*1000);
                        },(Math.floor(Math.random()*5)+5)*1000);
                    };
                //初始化计数器
                _config.robotCounter = no;
                _config.robotTalkCounter = talkno;
                //初始发布一条,toolset.ui接收数组
                if(lsdata.robotNo < _config.robotNum || lsdata.robotTalkNo < _config.robotTalkNum){
                    TOOL.toolset.ui(tool.creatRobot(_config.robotMsg,_config.robotCounter, false),0);
                    _config.robotCounter++;
                    ls.updateLS('robotNo=' + _config.robotCounter, '*', ncSnapLS);
                    setTimeout(setRobotFn, 1000);
                }
            },
            //robot发送机制
            publishRobot: function(robotDate){
                var lsdata = ls.selectLS("*", ncSnapLS)[0][0],
                    publishDate = lsdata.publishRobotDate;
                //检测LS中记录的json日期是否和取到的json日期相同，不同则重置数据,相同则看是否播完robot json
                if(publishDate != robotDate){
                    ls.updateLS('publishRobotDate=' + robotDate + ',robotNo=0,robotTalkNo=0,readAllRobot=0,sendButtonClick=0', '*', ncSnapLS);   //更新发布时间，重置数据
                    tool.sendRobot(0,0);  //启动robot发送机制
                }else{
                    if(lsdata.readAllRobot == '1'){
                        $('.openTips').html('亲，注意身体，明天再来哦~').show();
                    }else{
                        tool.sendRobot(lsdata.robotNo,lsdata.robotTalkNo);  //启动robot发送机制
                    }
                }
                //统计用户是否发送消息
                if(lsdata.sendButtonClick == 0){
                    $('.sendMessage').one('click',function(){
                        ls.updateLS("sendButtonClick=1", "*", ncSnapLS);
//                        ga('send', 'event', 'button', 'click', 'send-message-buttons');
                        put(chatFn.urls.getSendButton + "firstsend=yes");
                    });
                }
            },
            //监听滚动事件
            scrollEvent: function(){
                var chats = _config.chats,
                    oldScrollTop,
                    newScrollTop;
                oldScrollTop = chats.scrollTop();
                _config.chats.bind("scroll",function(){
                    oldScrollTop = oldScrollTop == 0 ? chats.scrollTop() : oldScrollTop;
                    newScrollTop = chats.scrollTop();

                    if(chatFn.scrollToBottom && (newScrollTop < oldScrollTop)){  //置底启动时如果判断到是向上滚动则取消置底
                        //console.log("stop")
                        chatFn.scrollToBottom = false;    //聊天室消息不再置底
                    }
                    if( !chatFn.scrollToBottom && newScrollTop + _config.chats.height() >= _config.chatList.height()){
                        //console.log("to BOTTOM")
                        chatFn.scrollToBottom = true;    //聊天室消息置底启动
                    }
                    oldScrollTop = newScrollTop;  //将此刻滚动位置记录到old里用以下次判断
                },false);
            },
            //查看更多消息
            history: function(){
                var loadMore = _config.loadMore,
                    enterRoomTS = _config.enterRoomTS,
                    lastTS = new Date().getTime();  //获取到聊天列表第一条的发布时间
                //如果没开通历史通道，则返回
                if(!_config.haveHistory){
                    return
                };
                loadMore.show();
                loadMore.click(function(){
                    if(lastTS - enterRoomTS <= 1000){  //可取历史时间差小于1s的,隐藏按钮并返回
                        loadMore.hide();
                        return
                    };
                    //区分不同页面请求链接和参数不同
                    var url = _config.defaultPage == 'group'?chatFn.urls.groupmsg : chatFn.urls.onemsg,
                        msg = _config.defaultPage == 'group'?{
                        rid: _config.rid,
                        ts: lastTS,
                        oldts: enterRoomTS,
                        num: 10
                    }:{
                        uid: _config.uid,
                        tuid: _config.tuid,
                        ts: lastTS,
                        oldts: enterRoomTS,
                        num: 10
                    };
                    //判断是否有更多历史消息
                    if(_config.defaultPage == 'group'){
                        TOOL.toolset.ui([tool.creatRobot()],0,1);
                    }
                    loadMore.hide();
                });

            }
        };

        var _init = function(){
            _config.chatList.html('');   //清空聊天室内容
            _config.faceBox.removeClass('faceBoxShow');
            _config.menuList.removeClass('menuListShow');
            _config.operateList.removeClass('operateListShow');

            //获取robot数据
            ARQAjax({
                url: 'i/robot.html',
                data: {},
                dataType: 'json',
                cache: false,
                success: function (data) {
                    if(data.tips){  //如果返回提示信息
                        if(data.tips == 'noOpen'){
                            $('.openTips').html('一大波美女将在午夜0点进攻！').show();
                        }else if(data.tips == 'close'){
                            $('.openTips').html('亲，注意身体，明天再来哦~').show();
                        }
                            isOpen = false;
                        return;
                    }
                    isOpen = true;
                    _config.publicRobotDate = data.date;
                    _config.robotMsg = data.robot;
                    _config.robotNum = _config.robotMsg.length;
                    _config.robotTalkMsg = data.robotTalk;
                    _config.robotTalkNum = _config.robotTalkMsg.length;
                    tool.publishRobot(_config.publicRobotDate);  //启动robot
                },
                error: function(){ }
            });

            tool.scrollEvent();   //启动滚动判断
            //tool.polling();  //启动轮询
        }
        _init();  //初始化方法
        initFn(_config, tool);  //独立初始化回调
    };

    //聊天室工具集
    var toolset = {
        //发送到server,参数需要ts,uid,type,message
        send: function(msg){
            ARQAjax({
                url: chatFn.urls.sendmsg,
                data: msg,
                //dataType: 'json',
                cache: false,
                success: function (data) { },
                error: function(){ }
            });
        },
        /**
         * 人工智能对话
         * @param robotIntelligent   获取到的json数据
         * @param value   需要匹配的对话
         */
        intelligent: function(robotIntelligent,value){
            var ts = new Date().getTime();
            for(var i = 0; i < robotIntelligent.length; i++){
                for(var j = 0; j < robotIntelligent.reg[i].length; j++){
                    if(new RegExp(robotIntelligent.reg[i][j]).test(value)){
                        setTimeout(function(){
                            TOOL.toolset.ui([{
                                ts: ts,
                                uid: 'p2s0n5x52',
                                type: 'message',
                                detail: robotIntelligent.message[i][Math.floor(Math.random()*robotIntelligent.numArr[i])]
                            }],1);
                        },robotIntelligent.delay[i]*1000);
                        return;//跳出循环
                    }
                }
            }
        },
        /**
         * UI层
         * @param data    内容
         * @param isMyMessage   是否是自己发送的
         * @param insertToTop   是否置顶
         */
        ui: function(data,isMyMessage,insertToTop){
            var chatList = $('.chatList'),
                divElem = $('<div></div>'),
                lsdata = ls.selectLS("*", ncInitLS)[0],
                newDiv;
            divElem.addClass('chatCon');
            newDiv = divElem;
            if(data == ""){
                return;
            }
            //返回的是数组，循环处理每一条
            for(var i = 0, len = data.length; i < len; i++){
                var msg = data[i];
                //如果/msg.uid是被禁言的对象/或者是自己发的信息，则忽略跳过
                if(insertToTop || isMyMessage || (!isMyMessage && lsdata[0].uid != msg.uid)){
                    //判断数据类型，分别调用不同方法
                    switch(msg.type){
                        case "message":
                            handleMessage(msg);
                            break;
                        case "one":
                            handleOne(msg);
                            break;
                        case "robot":
                            handleMessage(msg);
                            break;
                        case "good":
                            handleGood(msg);
                            break;
                        case "bad":
                            handleBad(msg);
                            break;
                        default:
                            break;
                    }
                }

            }

            //处理消息--message|robot
            function handleMessage(msg){
                var chat = $('.chats'),
                    loadMore = $('.loadMore'),
                    divClone = newDiv.clone(),
                    usermsg = chatFn.getUidMsg(msg.uid),
                    lsdata = ls.selectLS("*", ncInitLS)[0],
                    uid = lsdata[0].uid,
                    rid = lsdata[0].rid,
                    nickArr = chatFn.nickName,
                    content = '',
                    photoElem,
                    userName,
                    goodNum = 0;  //默认为0
                //被禁言或没有uid,信息则返回
                if(lsdata[0].gag.match(msg.uid) || msg.uid == ""){
                    return;
                }
                //取得uid的值，拼接出昵称+序号
                userName = nickArr[usermsg.n] + usermsg.x;
                //robot有图片和链接，需要判断
                if(msg.type == "robot"){   //robot   有无文字都不影响，直接加上文字内容，即使为空
                    if(msg.img != "" && msg.link != ""){   //有图片有链接
                        content = msg.detail + '<a href="'+ msg.link +'"><img class="robotimg" src="'+ msg.img +'" /></a>';
                    }else if(msg.img == "" && msg.link != ""){   //无图片有链接
                        content = '<a href="'+ msg.link +'">'+ msg.detail +'</a>';
                    }else if(msg.img != "" && msg.link == ""){   //有图片无链接
                        content = msg.detail + '<img class="robotimg" src="'+ msg.img +'" />';
                    }else{  //只有文字
                        content = msg.detail;
                    }
                }else{  //message
                    //表情替换
                    content = msg.detail.replace(/\/[a-p]{1}/gi,function(word){
                        return "<img class='faceimg' src='images/face"+ word +".png' />";
                    });
                }
                //判断是否是自己发送的消息，生成不同内容格式
                if(msg.uid == uid){  //如果是自己发的信息
                    divClone.addClass('myChat');
                    divClone.html( '<span class="chatPhoto" data-nid="'+ msg.uid +'"></span><div class="chatMiddle"><div class="chatMessage">'+
                        content +'</div><div class="addGood"><span>'+ goodNum +'</span></div></div>');
                }else{
                    divClone.html( '<span class="chatPhoto" data-nid="'+ msg.uid +'"></span><div class="chatMiddle"><span class="chatName">'+
                        userName +':</span><div class="chatMessage">'+ content + '</div><div class="addGood"><span>'+ goodNum +'</span></div></div>');
                }
                //取得uid的值，拼接出头像背景取值并设置样式
                photoElem = divClone.find('.chatPhoto');
                photoElem.css({"background":"url(images/picture/small/"+ usermsg.p +".jpg) no-repeat","backgroundSize":"33px"});
                //加入到聊天室列表
                divClone.attr('data-mid',msg.ts);
                //是否为历史记录，历史记录插入顶部
                if(!insertToTop){
                    chatList.append(divClone);
                }else{
                    if(chatList.find('.chatCon').length > 0){  //列表中已经有消息
                        var firstCon = chatList.find('.chatCon')[0];
                        divClone.insertBefore(firstCon);
                    }else{
                        chatList.append(divClone);
                    }
                }
                if(chatFn.scrollToBottom){  //如果聊天室需要置底
                    chat.scrollTop(chatList.height());     //聊天室置底
                }
            }
            //处理独聊消息--one
            function handleOne(msg){
                var chat = $('.chats'),
                    divClone = newDiv.clone(),
                    usermsg = chatFn.getUidMsg(msg.uid),
                    lsdata = ls.selectLS("*", ncInitLS)[0],
                    uid = lsdata[0].uid,
                    content = '';
                //没有uid,信息则返回
                if(msg.uid == '' || msg.detail == ''){
                    return;
                }
                //表情替换
                content = msg.detail.replace(/\/[a-p]{1}/gi,function(word){
                    return "<img class='faceimg' src='images/face"+ word +".png' />";
                });
                //判断是否是自己发送的消息，生成不同内容格式
                if(msg.uid == uid){  //如果是自己发的信息
                    divClone.addClass('myChat');
                    divClone.html('<span class="chatPhoto" data-nid="'+ msg.uid +'"></span><div class="chatMiddle"><div class="chatMessage">'+
                        content +'</div></div>');
                }else{
                    divClone.html('<span class="chatPhoto" data-nid="'+ msg.uid +'"></span><div class="chatMiddle"><div class="chatMessage">'+
                        content +'</div></div>');
                }
                //取得uid的值，拼接出头像背景取值并设置样式
                photoElem = divClone.find('.chatPhoto');
                photoElem.css({"background":"url(images/picture/small/"+ usermsg.p +".jpg) no-repeat","backgroundSize":"33px"});
                //是否为历史记录，历史记录插入顶部
                if(!insertToTop){
                    chatList.append(divClone);
                }else{
                    if(chatList.find('.chatCon').length > 0){  //列表中已经有消息
                        var firstCon = chatList.find('.chatCon')[0];
                        divClone.insertBefore(firstCon);
                    }else{
                        chatList.append(divClone);
                    }
                }
                if(chatFn.scrollToBottom){  //如果聊天室需要置底
                    chat.scrollTop(chatList.height());     //聊天室置底
                }
            }
            //处理赞--good
            function handleGood(msg){
                var chatlist = chatList.find('.chatCon'),
                    len = chatlist.length;
                //遍历该条点赞的信息是否存在于列表中,存在加1，从底部开始搜索
                for(var i = len - 1; i >= 0; i--){
                    if(chatlist.eq(i).attr('data-mid') == msg.detail){
                        var goodNum = parseInt(chatlist.eq(i).find('.addGood').find('span').html());
                        chatlist.eq(i).find('.addGood').find('span').html(goodNum + 1);
                        break;   //如果有该信息,执行完跳出for循环
                    }
                }
            }
            //处理黑--bad
            function handleBad(msg){
                var chatlist = chatList.find('.chatCon'),
                    len = chatlist.length;
                //遍历该条加黑的信息是否存在于列表中，存在让头像半透明3s，从底部开始搜索
                for(var i = len - 1; i >= 0; i--){
                    var target = chatlist.eq(i).find('.chatPhoto');
                    if(target.attr('data-nid') == msg.detail){
                        target.css('opacity',"0.5");
                        setTimeout(function(){
                            target.css('opacity',"1.0");
                        },3000);
                        break;   //如果有该信息,执行完跳出for循环
                    }
                }
            }
        }
    };

    //聊天室事件集
    var eventset = function(){
        var chats = $('.chats'),
            chatList = $('.chatList'),
            chatroomIcon = $('.chatroomIcon'),
            menuList = $('.menuList'),
            inputBox = $('.inputBox'),
            faceIcon = $('.faceIcon'),
            faceBox = $('.faceBox'),
            chatPhoto = $('.chatPhoto'),
            operateList = $('.operateList'),
            oat = $('.Oat'),
            oskull = $('.Oskull'),
            onovoice = $('.Onovoice'),
            sendMessage = $('.sendMessage'),
            lsdata = ls.selectLS("*", ncInitLS)[0],
            rid = lsdata[0].rid,
            uid = lsdata[0].uid,
            curUid = "",
            curName = "",
            curMsg = "",
            ts,
            robotIntelligent,  //人工智能聊天内容
            first = null; //避免触发两次onresize

        //载入人工智能对话json
        ARQAjax({
            url: 'i/robotIntelligent.html',
            data: {},
            dataType: 'json',
            cache: false,
            success: function (data) {
                robotIntelligent = {
                    data: data,
                    reg: data.reg,
                    message: data.message,
                    delay: data.delay,
                    length: data.reg.length,
                    numArr: []   //储备回复条数
                }
                for(var i = 0; i< robotIntelligent.length; i++){
                    robotIntelligent.numArr[i] = robotIntelligent.message[i].length;
                }
            },
            error: function(){ }
        });


        //表情事件
        faceIcon.on('click',function(){
            if(faceBox.hasClass('faceBoxShow')) {
                faceBox.removeClass('faceBoxShow');
            }else{
                faceBox.addClass('faceBoxShow');
            }
        });
        faceBox.find('a').on('click', function (e) {
            inputBox.val(inputBox.val() + e.target.attributes["data-fid"].value);
        });

        //提交消息----提交数据---inputvalue
        sendMessage.on('click',function(e){
            e.preventDefault();
            if(inputBox.val() == ''){
                inputBox.attr('placeholder','不能提交空消息');
            }else{
                ts = new Date().getTime();
                chatFn.scrollToBottom = true;
                TOOL.toolset.ui([{ts: ts, uid: uid,type: 'message', detail: inputBox.val()}],1);
                TOOL.toolset.intelligent(robotIntelligent,inputBox.val());//人工智能回复系统
                put(chatFn.urls.getMessage + 'send=' + inputBox.val());  //统计用户留言
                inputBox.attr('placeholder','');
                inputBox.val('');    //清空输入框
                faceBox.removeClass('faceBoxShow');

            }
        });


        //聊天室监听事件
        chatList.on('click',function(e){
            var $etarget = $(e.target);
            if(e.target.tagName == "SPAN" && $etarget.attr('class')){
                //头像弹框
                if($etarget.attr('class') == 'chatPhoto' && $etarget.attr('data-nid') != uid ) {
                    curUid = $etarget.attr('data-nid');
                    curName = $etarget.parent().find('.chatName').html().replace("："," ")
                    if(operateList.hasClass('operateListShow') && operateList.attr('data-nid') == curUid) {
                        operateList.removeClass('operateListShow');
                    }else if(operateList.hasClass('operateListShow') && operateList.attr('data-nid' != curUid)){
                        operateList.attr('data-nid',curUid);
                        $etarget.parent().append(operateList);
                    }else{
                        operateList.addClass('operateListShow');
                        operateList.attr('data-nid',curUid);
                        $etarget.parent().append(operateList);
                    }

                }
            }else{
                //赞---提交数据--curMsg
                if(e.target.tagName == "SPAN" && $etarget.parent().attr('class') == "addGood"){
                    curMsg = $etarget.parents('.chatCon').attr('data-mid');
                    ts = new Date().getTime();
                    TOOL.toolset.ui([{ts: ts, uid: uid, type: "good", detail: curMsg}],1);
                }
            }
        },false);

        //头像工具栏事件
        //@
        oat.on('click',function(){
            inputBox.val(inputBox.val() + "@" + curName);
            operateList.removeClass('operateListShow');
        });
        //黑---提交数据--curUid
        oskull.on('click',function(){
            operateList.removeClass('operateListShow');
            ts = new Date().getTime();
            TOOL.toolset.ui([{ts: ts, uid: uid,type: "bad", detail: curUid}],1);
        });
        //禁-->接收消息时通过gag过滤
        onovoice.on('click',function(){
            operateList.removeClass('operateListShow');
            //如果ls中的gag没有这个禁言对象，则加入
            if(!lsdata[0].gag.match(curUid)){
                var ogag = ls.selectLS("*", ncInitLS)[0][0].gag + "_" + curUid;
                ls.updateLS("gag=" + ogag, "*", ncInitLS);
            }
        });
        //检测屏幕高度，横竖屏切换
        window.onresize = function() {
            if(first == null) {
                first = setTimeout(function() {
                    chats.height($(window).height() - $('header').height() - $('.actionBar').height() + "px");
                    first = null;
                }, 100);
            }
        };
    };

    W.TOOL = {
        chatInit: chatInit,
        toolset: toolset,
        eventset: eventset
    }

}(window,document);