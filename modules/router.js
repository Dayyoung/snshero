var COMMON = require('./common');
var user = require('./user');
var board = require('./board');

module.exports = {

    setRestUrl : function(app) {
      
        app.get('/board/item/:id1', checkSession , function(req, res , next) {
         
            console.log("/board/item/:id1");
        
            if(req.params.id1) 
              res.locals.idx_board = req.params.id1;
            else 
              res.locals.idx_board = 0;    

              res.render('board_item_view');
              return;
        });

        app.get('/board/write', checkSession , function(req, res , next) {
         
            console.log("/board/write");        

            res.locals.idx_board = 0;  
            
            res.render('board_write_view');
            return;
        });

        app.get('/board/write/:id1', checkSession , function(req, res , next) {
         
            console.log("/board/write/:id1");
        
            if(req.params.id1) 
              res.locals.idx_board = req.params.id1;
            else 
              res.locals.idx_board = 0;    

              res.render('board_write_view');
              return;
        });

        //Must be last order!
        app.get('/board/:id1/:id2', checkSession , function(req, res , next) {
         
          console.log("/board/:id1/:id2");

          if(req.params.id1) 
            res.locals.m_category = req.params.id1;
          else 
            res.locals.m_category = 0;          

          if(req.params.id2) 
            res.locals.m_page = req.params.id2;
          else 
            res.locals.m_page = 0;       

            res.render('board_view'); 
            return;
        });

        app.get('/common_control.js', checkSession , function(req, res) {
          res.set('Content-Type', 'application/javascript');
          res.render('common_control');
        });
        app.get('/board_control.js',checkSession , function(req, res) {
          res.set('Content-Type', 'application/javascript');
          res.render('board_control');
        });
        app.get('/board_item_control.js',checkSession , function(req, res) {
          res.set('Content-Type', 'application/javascript');
          res.render('board_item_control');
        });
        app.get('/board_write_control.js',checkSession , function(req, res) {
          res.set('Content-Type', 'application/javascript');
          res.render('board_write_control');
        });
        app.get('/redirect.html',checkSession, function(req, res){
          if(req.query.destination) res.locals.destination = req.query.destination;
          else res.locals.destination = '/';
          res.render('redirect');
        });

        app.all('/API/loginUser', user.loginUser);        
        app.all('/API/logoutUser', user.logoutUser);     
        app.all('/API/getBoardList', board.getBoardList);        
        app.all('/API/getBoardItem', board.getBoardItem);
        app.all('/API/insertBoardItem', board.insertBoardItem);    
        app.all('/API/updateBoardItem', board.updateBoardItem);    
        app.all('/API/hitBoardItem', board.hitBoardItem);            
        app.all('/API/getNextBoardItem', board.getNextBoardItem);    
        app.all('/API/rateBoardItem', board.rateBoardItem);          
        app.all('/API/insertReplyItem', board.insertReplyItem);       
        app.all('/API/voteReplyItem', board.voteReplyItem);          

        app.use(function(req,res){              
          res.redirect('/redirect.html?destination=board/1/1');
        });
    }
}

function checkSession(req, res, next) {

  // var i18n = require('i18n');
  // i18n.setLocale(res.locals, 'en');

  if (!req.session.idx_user) {        
    res.locals.idx_user = 0;
    res.locals.m_name='';
    next();
  } else {    
    res.locals.idx_user = req.session.idx_user;
    res.locals.m_name= req.session.m_name;
    next();
  }
}
