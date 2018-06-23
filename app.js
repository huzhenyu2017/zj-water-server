var express = require('express');
var path = require('path');
// var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var app = express();
var db = require('./db/db');
var sd = require('silly-datetime');

var routeHandlers = {
	allTemplates: function(req, res, next) {
    console.log(req.query.user);
    db("select * from zjwater where USER = ?",[req.query.user], function (err, rows, fields) {
        if (err) {
            return res.status(404).send(err.message);
        }else{
            var json = JSON.stringify(rows);
            res.send(`{"templateContent": ${json} }`);
        }
    });
	},
	getTemplateById: function(req, res, next) {
		console.log(req.query.templateId);
    db("select template from zjwater where id = ? and user = ?",[req.query.templateId,req.query.user], function (err, rows, fields) {
        if (err) {
            return res.status(404).send(err.message);
        }else{
            res.send(rows);
        }
    });
  },
  saveTemplate: function(req, res, next) {
    var body = '', jsonStr;
    req.on('data', function (chunk) {
        body += chunk; //读取参数流转化为字符串
    });
    req.on('end', function () {
        //读取参数流结束后将转化的body字符串解析成 JSON 格式
        try {
            jsonStr = JSON.parse(body);
        } catch (err) {
            jsonStr = null;
        }
        var date = sd.format(new Date(), 'YYYY-MM-DD HH:mm');
        db("INSERT INTO zjwater(name,user,discription,template,date,authority,category,temtype,visible,pic) VALUES(?,?,?,?,?,?,?,?,?,?)",
          [jsonStr.name,jsonStr.user,jsonStr.discription,jsonStr.template,date,jsonStr.right,jsonStr.category,jsonStr.temtype,jsonStr.visible,jsonStr.pic], function (err, rows, fields) {
            if (err) {
                return res.status(404).send(`{"message":${err.message}`);
            }else{
                res.send({"message":"success"});
            }
        });
    });
  },
  updateTemplate: function(req, res, next) {
    //不能正确解析json格式的post参数,读取参数流转化为字符串
    var body = '', jsonStr;
    req.on('data', function (chunk) {
        body += chunk; //读取参数流转化为字符串
    });
    req.on('end', function () {
        //读取参数流结束后将转化的body字符串解析成 JSON 格式
        try {
            jsonStr = JSON.parse(body);
        } catch (err) {
            jsonStr = null;
        }
        var date = sd.format(new Date(), 'YYYY-MM-DD HH:mm');
        db("UPDATE zjwater SET NAME = ?, DISCRIPTION = ?,TEMPLATE = ?, AUTHORITY = ?,DATE = ? WHERE ID = ?",[jsonStr.name,jsonStr.discription,jsonStr.template,jsonStr.right,date,jsonStr.templateId], function (err, rows, fields) {
            if (err) {
                return res.status(404).send(`{"message":${err.message}`);
            }else{
                res.send({"message":"success"});
            }
        });
    });
    
	},
	// ping也属于一个通信协议，是TCP/IP协议的一部分,利用“ping”命令可以检查网络是否连通
	ping: function(req, res, next){
		res.send('zj-water-server says pong!');
	},
	// 对空白访问服务'/'时提供健康状态响应,避免因此出现异常
	healthStatus: function(req, res, next){
		res.send(':) zj-water-server is running!');
	},
};

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// X-Powered-By是网站响应头信息其中的一个，出于安全的考虑一般禁用这个信息
app.disable('x-powered-by'); //如果不禁用,响应头会出现X-Powered-By Express

// app.use()为调用中间件的方法(处理HTTP请求的函数，用来完成特定任务，比如检查用户是否登录、分析数据、以及其他在需要最终将数据发送给用户之前完成的任务)
// 当发生http请求时,先执行app.use()的中间件操作,再执行route()的路由操作!
app.use('*', function(req, res, next) {
    // 设置CORS跨域资源共享(若不设置允许跨域,则无法访问瓦片)
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', 'X-Requested-With');
	next();//next的作用是将请求转发，这个必须有，如果没有，请求到这就挂起了
});

// app.use('/', index);
// app.use('/users', users);

app.route('/allTemplates').get(routeHandlers.allTemplates);
app.route('/getTemplateById').get(routeHandlers.getTemplateById);
app.route('/saveTemplate').post(routeHandlers.saveTemplate);
app.route('/updateTemplate').post(routeHandlers.updateTemplate);
// app.route('/saveTemplate').get(routeHandlers.saveTemplate);
//app.route('/updateTemplate').get(routeHandlers.updateTemplate);
app.route('/ping').get(routeHandlers.ping);
app.route('/').get(routeHandlers.healthStatus);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
