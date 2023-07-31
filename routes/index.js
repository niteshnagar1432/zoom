var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('home');
});

router.get('/room/:id',(req,res)=>{
  let roomId = req.params.id;
  res.render('home-c',{roomId});
})

module.exports = router;
