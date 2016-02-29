
var COMMON = require('./common');

function define(name, value) {
    Object.defineProperty(exports, name, {
        value: value,
        enumerable : true,
    });
}

var DEBUG_MODE = true; 
define("DEBUG_MODE", DEBUG_MODE);
define("DEBUG",  true);

define("UNEXPECTED_ERROR", {"errorCode": 1001, "errorMsg":"An unexpected error occurred." });
define("NOT_FOUND_DATA", {"errorCode": 1002, "errorMsg":"Can not find data." });
define("NOT_PARAM", {"errorCode": 1003, "errorMsg":"Can not find parameter." });
define("DB_ERROR", {"errorCode": 1004, "errorMsg":"DB error occurred." });
define("UPLOAD_ERROR", {"errorCode": 1005, "errorMsg":"UPLOAD error occurred." });
define("PASSWORD_ERROR", {"errorCode": 1006, "errorMsg":"Password error occurred." });
define("EMAIL_ERROR", {"errorCode": 1007, "errorMsg":"Invalid email address." });

define("HOST_URL",  'YOUR_HOST');
define("HOST_ID",  'YOUR_ID');
define("HOST_PASSWORD",  'YOUR_PASSWORD');
define("HOST_DATABASE",  'YOUR_DATABASE');
define("MAX_UPLOAD_FILE_SIZE",  4096000);

module.exports = {    
    
    getConnection : function ()
    {
        var mysql      = require('mysql');
        var connection = mysql.createConnection({
          host     : COMMON.HOST_URL ,
          user     : COMMON.HOST_ID,
          password : COMMON.HOST_PASSWORD,
          database : COMMON.HOST_DATABASE
        });
        return connection;
    },
    makeHeader : function (action,reqestData,responseData)
    {    
        //make header
        var headers = {"action" : action , "statusCode": 200,"Content-Type": "application/json ; charset=utf-8"};
        responseData.headers = headers;
        //make result
        responseData.result ={};
        responseData.result.isSuccess = false;
        return;
    },
    makeNoParamError : function (res,responseData,debug)
    {    
        responseData.result.errorMsg = COMMON.NOT_PARAM.errorMsg + " Line : " + debug;        
        responseData.result.errorCode = COMMON.NOT_PARAM.errorCode;
        res.json(responseData);
        return;         
    },
    makeDBError : function (res,responseData,connection,debug)
    {    
        responseData.result.errorMsg = COMMON.DB_ERROR.errorMsg + " Line : " + debug;        
        responseData.result.errorCode = COMMON.DB_ERROR.errorCode;
        res.json(responseData);
        connection.end();
        return;         
    },
    makeNotFoundError : function (res,responseData,connection,debug)
    {    
        responseData.result.errorMsg = COMMON.NOT_FOUND_DATA.errorMsg + " Line : " + debug;        
        responseData.result.errorCode = COMMON.NOT_FOUND_DATA.errorCode;
        res.json(responseData);
        connection.end();
        return;         
    },
    makeUnexpectedError : function (res,responseData,connection,debug)
    {    
        responseData.result.errorMsg = COMMON.UNEXPECTED_ERROR.errorMsg + " Line : " + debug;        
        responseData.result.errorCode = COMMON.UNEXPECTED_ERROR.errorCode;
        res.json(responseData);
        connection.end();
        return;         
    },
    makeUploadError : function (res,responseData,connection,debug)
    {    
        responseData.result.errorMsg = COMMON.UPLOAD_ERROR.errorMsg + " Line : " + debug;        
        responseData.result.errorCode = COMMON.UPLOAD_ERROR.errorCode;
        res.json(responseData);
        connection.end();
        return;         
    },
    makePasswordError : function (res,responseData,connection,debug)
    {    
        responseData.result.errorMsg = COMMON.PASSWORD_ERROR.errorMsg + " Line : " + debug;        
        responseData.result.errorCode = COMMON.PASSWORD_ERROR.errorCode;
        res.json(responseData);        
        connection.end();
        return;         
    },
    makeEmailError : function (res,responseData,connection,debug)
    {    
        responseData.result.errorMsg = COMMON.EMAIL_ERROR.errorMsg + " Line : " + debug;        
        responseData.result.errorCode = COMMON.EMAIL_ERROR.errorCode;
        res.json(responseData);        
        connection.end();
        return;         
    },
    log : function (msg)
    {    
        if(COMMON.DEBUG)
            console.log(msg);
        
        return;         
    },
    checkEmail : function (email) {
    var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    return re.test(email);
    }
}

