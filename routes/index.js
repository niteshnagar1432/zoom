var express = require('express');
var router = express.Router();
const multer  = require('multer')
var path = require('path');
let fileName = '';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/uploads');
  },
  filename: function (req, file, cb) {
    let tempFile = new Date().getTime();
    fileName = Math.floor(Math.random() * 1000000) + tempFile + path.extname(file.originalname);
    cb(null, fileName);
  },
});

const upload = multer({ storage: storage });


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('home');
});

router.get('/room/:id',(req,res)=>{
  let roomId = req.params.id;
  res.render('home-c',{roomId});
})

router.post('/upload/doc', upload.single('file'), (req, res) => {
  res.status(200).json({
    status:'sucess',
    message:'File upoaded sucessfully...!',
    fileName:fileName
  });
});

router.get('/images/uploads/:fileName',(req,res)=>{
  const fileName = req.params.fileName;
  const filePath = `./public/images/uploads/${fileName}`;
  res.download(filePath, `w-${fileName}`);
});

module.exports = router;
