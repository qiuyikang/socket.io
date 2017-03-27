var tm = (function(){
    var App = function(){};
    var app = App.prototype;
    var config = {
        dest: 'http://192.168.52.86:3000/mvc/stomp',
        topic: '/topic/csta/namespace/testwdd2.com'
        // topic: '/topic/csta/device/8002@testwdd2.com'
    };
    
    var eventQueue = [];
    var vm = new Vue({
        el:'#event-queue',
        data:{
            eventQueue: eventQueue
        }
    });

    Vue.filter('transAgentStatus', function(status){
        switch(status){
            case 'NotReady': return 'NotReady';
            case 'WorkNotReady': return 'WorkNotReady';
            case 'Idle': return 'Idle';
            case 'OnCallIn': return 'OnCallIn';
            case 'OnCallOut': return 'OnCallOut';
            case 'Logout': return 'Logout';
            case 'Ringing': return 'Ringing';
            case 'OffHook': return 'OffHook';
            case 'CallInternal': return 'CallInternal';
            case 'Dailing': return 'Dailing';
            case 'Ringback': return 'Ringback';
            case 'Conference': return 'Conference';
            case 'OnHold': return 'OnHold';
            case 'Other': return 'Other';
        }

        return '';
    });

    /**
     * [render description]
     * @Author   Wdd
     * @DateTime 2016-12-26T16:06:16+0800
     * @param    {[string]} tpl [模板字符串]
     * @param    {[object]} data [data对象]
     * @return   {[string]} [渲染后的字符串]
     */
    app.render = function(tpl,data){
        var re = /{{([^}]+)?}}/g;

        while(match = re.exec(tpl)){
            tpl = tpl.replace(match[0],data[match[1]] || '');
        }

        return tpl;
    };

    app.initWebSocket = function(dest, topic){
        dest = dest || config.dest;
        topic = topic || config.topic;

        var socket = new SockJS(dest);
        var ws = Stomp.over(socket);

        ws.connect({}, function(frame) {

            ws.subscribe(topic, function(event) {
                // var eventInfo = JSON.parse(event.body);
                app.handerEvent(JSON.parse(event.body));
            });
        }, function(frame) {
            console.log(frame);
            console.error(new Date() + 'websocket失去连接');
        });
    };

    /**
     * [findAgentIndex description]
     * @Author   Wdd
     * @DateTime 2016-12-28T10:34:13+0800
     * @param    {[string]} agentId [description]
     * @return   {[int]} [description]
     */
    app.findAgentIndex = function(agentId){
        for(var i = eventQueue.length - 1; i >= 0; i--){
            if(eventQueue[i].agentId === agentId){
                return i;
            }
        }

        return -1;
    };

    /**
     * [handerEvent 处理websocket事件]
     * @Author   Wdd
     * @DateTime 2016-12-28T10:33:03+0800
     * @param    {[object]} data [description]
     * @return   {[type]} [description]
     */
    app.handerEvent = function(data){
        if(data.eventType === 'CallEvent'){
            return;
        }
        if(!data.eventSrc){
            return;
        }

        var eventItem = {
            agentStatus: '',
            eventName: data.eventName,
            agentId: '',
            loginName: '',
            userName: '',
            deviceId: data.deviceId,
            agentStatusTime: ''
        };

        var agent = data.eventSrc.agent || '';

        if(agent){
            eventItem.agentId = agent.agentId;
            eventItem.loginName = agent.loginName;
            eventItem.userName = agent.userName;
            eventItem.agentStatus = agent.agentStatus;
            eventItem.agentStatusTime = agent.agentStatusTime;
        }
        // 针对登出事件的agentId在外层
        else if(data.agentMode){
            eventItem.agentStatus = data.agentMode;
            eventItem.agentId = data.agentId;
        }
        else if(data.agentStatus){
            eventItem.agentStatus = data.agentStatus;
        }

        if(!eventItem.agentId){
            return;
        }

        var itemIndex = app.findAgentIndex(eventItem.agentId);

        // 新的座席加入
        if(itemIndex === -1){
            eventQueue.push(eventItem);
        }
        // 更新已有座席的状态
        else{
            eventQueue[itemIndex].agentStatus = eventItem.agentStatus;
            eventQueue[itemIndex].agentStatusTime = eventItem.agentStatusTime;
            eventQueue[itemIndex].eventName = eventItem.eventName;
        }

    };


    return new App();
})();
