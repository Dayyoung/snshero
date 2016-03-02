
var COMMON = require('./common');
var moment = require("moment");

var multer  = require('multer');
var M_FILE='';

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/board');
  },
  filename: function (req, file, cb) {
    M_FILE = new Date().getTime() + file.originalname;
    cb(null, M_FILE);
  }
});

var limits = {fileSize: COMMON.MAX_UPLOAD_FILE_SIZE};

module.exports = {
  getBoardList : function(req, res) {    

    var action = "getBoardList";
    COMMON.log(action);
    var requestData = {};
    var responseData ={};

    var IsGet = Object.keys(req.query).length;    

    if(IsGet>0)
      requestData = req.query;
    else
      requestData = req.body;

    COMMON.makeHeader(action,requestData,responseData);

    if( !requestData || !requestData.m_page || !requestData.m_category)
    {
      COMMON.makeNoParamError(res,responseData ,1);
      return;
    }  

    var queryArray = [];
    queryArray[0] = requestData.m_category;
    queryArray[1] = requestData.m_page;

    var connection = COMMON.getConnection();

    var q = 'select count(*) as total from t_board where m_delete = 0 and m_category= ?';

    connection.query(q, queryArray , function(err, result, fields) {


      if (err) 
      {
        COMMON.makeDBError(res,responseData,connection , 1);
        return;
      }
      if (result.length==0) 
      {
        COMMON.makeNotFoundError(res,responseData,connection , 1);
        return;
      }
      if (result[0].total==0) 
      {
        COMMON.makeUnexpectedError(res,responseData,connection , 1);
        return;
      }

      var total  = result[0].total;

      var page = parseInt(requestData.m_page);
      var paging = 10;
      var sector = 3;

      var queryArray = [];
      queryArray[0] = requestData.m_category;
      var caculatePage = (page-1)*10;
      queryArray[1] = caculatePage;

      var q = 'select * from (select * from t_board where m_delete =0 and m_category=?  order by m_update_time desc limit ? ,10) as A left join (select idx_user,m_name from t_user) as B on A.idx_user = B.idx_user';

      connection.query(q , queryArray ,function(err, result, fields) {                

        if (err) 
        {
          COMMON.makeDBError(res,responseData,connection , 2);
          return;
        }
        if (result.length==0) 
        {
          COMMON.makeNotFoundError(res,responseData,connection , 2);
          return;
        }

        responseData.result.isSuccess = true;
        var totalpage = total/paging;
        responseData.result.total = total;
        responseData.result.total_page = Math.ceil(totalpage);
        responseData.result.total_block = Math.ceil(totalpage/sector) ;
        responseData.result.now_block = Math.ceil(page/sector) ;            
        responseData.result.start_page = (Math.ceil(page/sector)-1) * sector +1 ;        
        responseData.result.sector = sector ;        

        for (var i in result) {

          if(result[i].idx_user == null )
            result[i].idx_user = 0;

          if(result[i].m_name == null )
            result[i].m_name = '';

          result[i].m_update_time  = moment(result[i].m_update_time).format("YYYY-MM-DD HH:mm:ss");
          delete result[i].m_temp_pw ;
        }
        responseData.result.boardList = result;

        res.json(responseData);
        connection.end();
        return;         
      }); 
    });
  },
  getBoardItem : function(req, res) {    

    var action = "getBoardItem";
    COMMON.log(action);
    var requestData = {};
    var responseData ={};

    var IsGet = Object.keys(req.query).length;    

    if(IsGet>0)
      requestData = req.query;
    else
      requestData = req.body;

    COMMON.makeHeader(action,requestData,responseData);

    if( !requestData || !requestData.idx_board)
    {
      COMMON.makeNoParamError(res,responseData ,1);
      return;
    }  

    var queryArray = [];
    queryArray[0] = requestData.idx_board;

    var connection = COMMON.getConnection();

    var q = 'select * from (select * from t_board where idx_board = ?)as A left join (select idx_user,m_name from t_user) as B on A.idx_user = B.idx_user';

    connection.query(q, queryArray , function(err, result, fields) {

      if (err) 
      {
        COMMON.makeDBError(res,responseData,connection , 1);
        return;
      }
      if (result.length==0) 
      {
        COMMON.makeNotFoundError(res,responseData,connection , 1);
        return;
      }

      if(result[0].idx_user == null )
        result[0].idx_user = 0;

      if(result[0].m_name == null )
        result[0].m_name = '';  

      result[0].m_update_time  = moment(result[0].m_update_time).format("YYYY-MM-DD HH:mm:ss"); 

      delete result[0].m_temp_pw;

      responseData.result.boardItem = result[0];

      var queryArray = [];
      queryArray[0] = requestData.idx_board;

      var q = 'select * from (select * from t_reply where idx_board = ? ) as A left join (select idx_user,m_name from t_user) as B on A.idx_user = B.idx_user';

      connection.query(q , queryArray ,function(err, result, fields) {                

        if (err) 
        {
          COMMON.makeDBError(res,responseData,connection , 2);
          return;
        }

        responseData.result.isSuccess = true;

        for (var i in result) {

          if(result[i].idx_user == null )
            result[i].idx_user = 0;

          if(result[i].m_name == null )
            result[i].m_name = '';

          result[i].m_update_time  = moment(result[i].m_update_time).format("YYYY-MM-DD HH:mm:ss");
        }
        responseData.result.replyList = result;

        res.json(responseData);
        connection.end();
        return;     
      }); 
    });
  },
  insertBoardItem : function(req, res) {    

    var action = "insertBoardItem";
    COMMON.log(action);
    var requestData = {};
    var responseData ={};

    var upload = multer({ storage: storage , limits: limits }).single('thumbnail');

    upload(req, res, function (err) {

      var IsGet = Object.keys(req.query).length;    

      if(IsGet>0)
        requestData = req.query;
      else
        requestData = req.body;

      COMMON.makeHeader(action,requestData,responseData);

      var connection = COMMON.getConnection();

      if (err) {
        COMMON.makeUploadError(res, responseData , connection , err.code);
        return;
      }

      console.log(requestData);

      if(requestData.idx_user==0)
      {    
        if(!requestData || !requestData.m_temp_user || !requestData.m_temp_pw || !requestData.m_title|| !requestData.m_content)  
        {
          COMMON.makeNoParamError(res,responseData ,1);
          return;
        } 
      }
      else
      {
        if(!requestData || !requestData.idx_user || !requestData.m_title|| !requestData.m_content)  
        {
          COMMON.makeNoParamError(res,responseData ,1);
          return;  
        } 
      } 

      var queryJson = {};

      if(requestData.idx_user==0)
      {    
        queryJson.m_temp_user = requestData.m_temp_user;
        queryJson.m_temp_pw = requestData.m_temp_pw;
      }
      else
      {  
        queryJson.idx_user = requestData.idx_user;
      }

      queryJson.m_category = requestData.m_category;
      queryJson.m_title = requestData.m_title;
      queryJson.m_content = requestData.m_content;

      if(requestData.m_file == '')
        queryJson.m_file = M_FILE;

      M_FILE ='';

      delete queryJson.thumbnail;


      if(requestData.idx_board!=0)
      {
        if(requestData.idx_user==0)
          var q = 'update t_board set ? where idx_board='+requestData.idx_board +' and m_temp_pw='+requestData.m_temp_pw;
        else
          var q = 'update t_board set ? where idx_board='+requestData.idx_board +' and idx_user='+requestData.idx_user;
      }
      else
        var q = 'insert into t_board set ?';

      connection.query(q, queryJson, function(err, result, fields) {    

        if (err) 
        {
          COMMON.makePasswordError(res,responseData,connection , 2);
          return;
        }

        responseData.result.isSuccess = true;
        responseData.result.isFile = true;
        res.json(responseData);
        connection.end();
        return;     
      }); 
    });
  },
  updateBoardItem : function(req, res) {    

    var action = "updateBoardItem";
    COMMON.log(action);
    var requestData = {};
    var responseData ={};

    var IsGet = Object.keys(req.query).length;    

    if(IsGet>0)
      requestData = req.query;
    else
      requestData = req.body;

    COMMON.makeHeader(action,requestData,responseData);


    if(requestData.idx_user==0)
    {    
      if( !requestData || !requestData.idx_board || !requestData.m_temp_pw)
      {
        COMMON.makeNoParamError(res,responseData ,1);
        return;
      }  
    }
    else
    {
      if( !requestData || !requestData.idx_board || !requestData.idx_user)
      {
        COMMON.makeNoParamError(res,responseData ,1);
        return;
      }      
    }

    var queryArray = [];
    queryArray[0] = requestData.idx_board;

    if(requestData.idx_user==0)
    {
      queryArray[1] = requestData.m_temp_pw;
      var q = 'select * from t_board where idx_board= ? and m_temp_pw= ?';  
    }
    else
    {
      queryArray[1] = requestData.idx_user;
      var q = 'select * from t_board where idx_board= ? and idx_user= ?';  
    }

    var connection = COMMON.getConnection();

    connection.query(q, queryArray , function(err, result, fields) {

      if (err) 
      {
        COMMON.makeDBError(res,responseData,connection , 1);
        return;
      }
      if (result.length==0) 
      {
        COMMON.makePasswordError(res,responseData,connection , 1);
        return;
      }

      var queryJson = {};
      queryJson = requestData;

      var q = 'update t_board set ? where idx_board=';

      connection.query(q + requestData.idx_board , queryJson ,function(err, result, fields) {                

        if (err) 
        {
          COMMON.makeDBError(res,responseData,connection , 2);
          return;
        }

        responseData.result.isSuccess = true;
        res.json(responseData);
        connection.end();
        return;     
      }); 
    });
  },
  hitBoardItem : function(req, res) {    

    var action = "hitBoardItem";
    COMMON.log(action);
    var requestData = {};
    var responseData ={};

    var IsGet = Object.keys(req.query).length;    

    if(IsGet>0)
      requestData = req.query;
    else
      requestData = req.body;

    COMMON.makeHeader(action,requestData,responseData);

    if( !requestData || !requestData.idx_board )
    {
      COMMON.makeNoParamError(res,responseData ,1);
      return;
    }  

    var queryArray = [];
    queryArray[0] = requestData.idx_board;

    var connection = COMMON.getConnection();


    var q = 'select * from t_board where idx_board= ?';

    connection.query(q, queryArray , function(err, result, fields) {

      if (err) 
      {
        COMMON.makeDBError(res,responseData,connection , 1);
        return;
      }
      if (result.length==0) 
      {
        COMMON.makeNotFoundError(res,responseData,connection , 1);
        return;
      }

      var queryArray = [];
      queryArray[0] = requestData.idx_board;

      var q = 'update t_board set m_hit = m_hit + 1 where idx_board= ? ';

      connection.query(q , queryArray ,function(err, result, fields) {                

        if (err) 
        {
          COMMON.makeDBError(res,responseData,connection , 2);
          return;
        }

        responseData.result.isSuccess = true;
        res.json(responseData);
        connection.end();
        return;     
      }); 
    });
  },
  getNextBoardItem : function(req, res) {    

    var action = "getNextBoardItem";
    COMMON.log(action);
    var requestData = {};
    var responseData ={};

    var IsGet = Object.keys(req.query).length;    

    if(IsGet>0)
      requestData = req.query;
    else
      requestData = req.body;

    COMMON.makeHeader(action,requestData,responseData);

    if( !requestData || !requestData.idx_board)
    {
      COMMON.makeNoParamError(res,responseData ,1);
      return;
    }  

    var queryArray = [];
    queryArray[0] = requestData.idx_board;

    var connection = COMMON.getConnection();

    var q = 'select m_category , m_update_time from t_board  where idx_board = ? ';

    connection.query(q, queryArray , function(err, result, fields) {

      if (err) 
      {
        COMMON.makeDBError(res,responseData,connection , 1);
        return;
      }
      if (result.length==0) 
      {
        COMMON.makeNotFoundError(res,responseData,connection , 1);
        return;
      }

      requestData.m_category = result[0].m_category;
      requestData.m_update_time = result[0].m_update_time;

      var queryArray = [];
      queryArray[0] = requestData.m_update_time;
      queryArray[1] = requestData.m_category;

      if(requestData.order)
        var q = 'select idx_board from t_board  where m_update_time < ? and m_category = ? and m_delete = 0  order by m_update_time desc limit 1';
      else
        var q = 'select idx_board from t_board  where m_update_time > ? and m_category = ? and m_delete = 0 order by m_update_time asc limit 1';


      connection.query(q , queryArray ,function(err, result, fields) {                

        if (err) 
        {
          COMMON.makeDBError(res,responseData,connection , 2);
          return;
        }
        if (result.length==0 || result[0].idx_board== null ) 
        {
          COMMON.makeNotFoundError(res,responseData,connection , 2);
          return;
        }

        responseData.result.isSuccess = true;
        responseData.result.idx_board = result[0].idx_board;

        res.json(responseData);
        connection.end();
        return;     
      }); 
    });
  },
  rateBoardItem : function(req, res) {    

    var action = "rateBoardItem";
    COMMON.log(action);
    var requestData = {};
    var responseData ={};

    var IsGet = Object.keys(req.query).length;    

    if(IsGet>0)
      requestData = req.query;
    else
      requestData = req.body;

    COMMON.makeHeader(action,requestData,responseData);

    if( !requestData || !requestData.idx_board || !requestData.idx_user || !requestData.m_rate )
    {
      COMMON.makeNoParamError(res,responseData ,1);
      return;
    }  

    var connection = COMMON.getConnection();

    var queryJson = {};

    queryJson.idx_board = requestData.idx_board;
    queryJson.idx_user = requestData.idx_user;
    queryJson.m_rate = requestData.m_rate;

    var q = 'insert into t_board_check set ?';

    connection.query( q , queryJson ,function(err, result, fields) {                

      if (err) 
      {
        COMMON.makeDBError(res,responseData,connection , 1);
        return;
      }

      var queryArray = [];
      queryArray[0] = requestData.idx_board;

      var q = 'select round(avg(m_rate),1) as m_rate from t_board_check where idx_board =?';

      connection.query(q, queryArray , function(err, result, fields) {

        if (err) 
        {
          COMMON.makeDBError(res,responseData, connection , 2);
          return;
        }
        if (result.length==0) 
        {
          COMMON.makeNotFoundError(res,responseData,connection , 2);
          return;
        }

        var queryJson = {};
        queryJson.m_rate = result[0].m_rate;

        var q = 'update t_board set ? where idx_board=' + requestData.idx_board;

        connection.query( q , queryJson ,function(err, result, fields) {                

          if (err) 
          {
            COMMON.makeDBError(res,responseData,connection , 3);
            return;
          }
          responseData.result.isSuccess = true;
          res.json(responseData);
          connection.end();
          return;     
        }); 
      });
    });
  },
  insertReplyItem : function(req, res) {    

    var action = "insertReplyItem";
    COMMON.log(action);
    var requestData = {};
    var responseData ={};

    var IsGet = Object.keys(req.query).length;    

    if(IsGet>0)
      requestData = req.query;
    else
      requestData = req.body;

    COMMON.makeHeader(action,requestData,responseData);

    if(requestData.idx_user==0)
    {
      if( !requestData || !requestData.m_temp_user || !requestData.m_temp_pw || !requestData.idx_board|| !requestData.m_content)
      {
        COMMON.makeNoParamError(res,responseData ,1);
        return;
      }  
    }
    else
    {
      if( !requestData || !requestData.idx_user || !requestData.idx_board|| !requestData.m_content)
      {
        COMMON.makeNoParamError(res,responseData ,1);
        return;
      }  
    }

    var connection = COMMON.getConnection();

    var queryJson = {};

    if(requestData.idx_user==0)
    {
      queryJson.m_temp_user = requestData.m_temp_user;
      queryJson.m_temp_pw = requestData.m_temp_pw;
    }
    else
    {
      queryJson.idx_user = requestData.idx_user;
    }
    queryJson.idx_board = requestData.idx_board;
    queryJson.m_content = requestData.m_content;

    var q = 'insert into t_reply set ?';

    connection.query( q , queryJson ,function(err, result, fields) {                

      if (err) 
      {
        COMMON.makeDBError(res,responseData,connection , 1);
        return;
      }

      var queryArray = [];
      queryArray[0] = requestData.idx_board;

      var q = 'select count(*) as total from t_reply where idx_board =?';

      connection.query(q, queryArray , function(err, result, fields) {

        if (err) 
        {
          COMMON.makeDBError(res,responseData, connection , 2);
          return;
        }
        if (result.length==0) 
        {
          COMMON.makeNotFoundError(res,responseData,connection , 2);
          return;
        }

        var queryJson = {};
        queryJson.m_reply = result[0].total;

        var q = 'update t_board set ? where idx_board=' + requestData.idx_board;

        connection.query( q , queryJson ,function(err, result, fields) {                

          if (err) 
          {
            COMMON.makeDBError(res,responseData,connection , 3);
            return;
          }
          responseData.result.isSuccess = true;
          res.json(responseData);
          connection.end();
          return;     
        }); 
      });
    });
  },
  voteReplyItem : function(req, res) {    

    var action = "voteReplyItem";
    COMMON.log(action);
    var requestData = {};
    var responseData ={};

    var IsGet = Object.keys(req.query).length;    

    if(IsGet>0)
      requestData = req.query;
    else
      requestData = req.body;

    COMMON.makeHeader(action,requestData,responseData);

    if( !requestData || !requestData.idx_user || !requestData.idx_reply || !requestData.m_yes|| !requestData.m_no)
    {
      COMMON.makeNoParamError(res,responseData ,1);
      return;
    }  

    var connection = COMMON.getConnection();

    var queryJson = {};

    queryJson.idx_user = requestData.idx_user;
    queryJson.idx_reply = requestData.idx_reply;
    queryJson.m_yes = requestData.m_yes;
    queryJson.m_no = requestData.m_no;

    var q = 'insert into t_reply_check set ?';

    connection.query( q , queryJson ,function(err, result, fields) {                

      if (err) 
      {
        COMMON.makeDBError(res,responseData,connection , 1);
        return;
      }

      var queryArray = [];
      queryArray[0] = requestData.idx_reply;

      var q = 'select sum(m_yes) as m_yes, sum(m_no) as m_no from t_reply_check where idx_reply = ?';

      connection.query(q, queryArray , function(err, result, fields) {

        if (err) 
        {
          COMMON.makeDBError(res,responseData, connection , 2);
          return;
        }
        if (result.length==0) 
        {
          COMMON.makeNotFoundError(res,responseData,connection , 2);
          return;
        }

        var queryJson = {};
        queryJson.m_yes = result[0].m_yes;
        queryJson.m_no = result[0].m_no;

        var q = 'update t_reply set ? where idx_reply=' + requestData.idx_reply;

        connection.query( q , queryJson ,function(err, result, fields) {                

          if (err) 
          {
            COMMON.makeDBError(res,responseData,connection , 3);
            return;
          }
          responseData.result.isSuccess = true;
          res.json(responseData);
          connection.end();
          return;     
        }); 
      });
    });
  }

}