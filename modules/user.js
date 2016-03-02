var COMMON = require('./common');
var moment = require("moment");

module.exports = {
    loginUser : function(req, res) {    

        var action = "loginUser";
        COMMON.log(action);
        var requestData = {};
        var responseData ={};

        var IsGet = Object.keys(req.query).length;    

        if(IsGet>0)
            requestData = req.query;
        else
            requestData = req.body;

        COMMON.makeHeader(action,requestData,responseData);

        if( !requestData || !requestData.m_email || !requestData.m_password)
        {
          COMMON.makeNoParamError(res,responseData ,1);
          return;
        }  

        var queryArray = [];
        queryArray[0] = requestData.m_email;
        queryArray[1] = requestData.m_password;

        var connection = COMMON.getConnection();

        var q = 'select idx_user, m_name , m_password from t_user where m_email = ?';

        connection.query(q, queryArray , function(err, result, fields) {

            if (err) 
            {
                COMMON.makeDBError(res,responseData,connection , 1);
                return;
            }          
            if (result.length > 0) 
            {
                if(result[0].m_password != requestData.m_password )
                {
                    COMMON.makePasswordError(res,responseData,connection , 1);
                    return;
                }
                else
                {
                    responseData.result.isSuccess = true;            
                    req.session.idx_user = result[0].idx_user; 
                    req.session.m_name = result[0].m_name;
                    responseData.result.idx_user = result[0].idx_user;
                    responseData.result.m_name = result[0].m_name;
                    res.json(responseData);
                    connection.end();
                    return;
                }     
            }

            if(!COMMON.checkEmail(requestData.m_email))
            {
                COMMON.makeEmailError(res,responseData,connection , 1);
                return;
            }

            var queryJson = {};
            queryJson.m_email = requestData.m_email;
            queryJson.m_name = requestData.m_email;
            queryJson.m_password = requestData.m_password;

            var q = 'insert into t_user set ?';

            connection.query(q , queryJson ,function(err, result, fields) {                

                if (err) 
                {
                    COMMON.makeDBError(res,responseData,connection , 2);
                    return;
                }
                responseData.result.isSuccess = true;
                req.session.idx_user = result.insertId;
                req.session.m_name = requestData.m_email;
                responseData.result.idx_user = result.insertId;   
                responseData.result.m_name = requestData.m_email;            
                res.json(responseData);
                connection.end();
                return;     
            }); 
        });
    },
    logoutUser : function(req, res) {    

        var action = "logoutUser";
        COMMON.log(action);
        var requestData = {};
        var responseData ={};

        COMMON.makeHeader(action,requestData,responseData);

        req.session.destroy(function(err) {
        // cannot access session here        
        if(err)
        {
            COMMON.makeUnexpectedError(res,responseData, undefined , 1);
        }
            responseData.result.isSuccess = true;
            console.log("BYE BYE!");
            res.json(responseData);
            return;   
        });         
    }
}