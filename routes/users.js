const express = require('express');
const router = express.Router();

const bcrypt = require('../config/bcrypt_con');
const createHash = bcrypt.createHash;
const hashValidation = bcrypt.hashValidation;

const models = require('../config/models');
const User = models.User;

const multer = require('multer');
require('date-utils');

var storage = multer.diskStorage({
  destination:function(req,file,cb){
    cb(null,'public/uploads')
  },
  filename:function(req,file,cb){
    var dt = new Date();
    var formatted = dt.toFormat("YYYYMMDDHH24MISS");
    cb(null,formatted+file.originalname)
  }
});

var upload = multer({storage:storage});

// Cloudinaryの設定ファイルの読み込み
let cloudinary = require('../config/cloudinary_con').cloudinary;

/* GET users listing. */
router.get('/signup', function(req, res, next) {
  var data = {
    form:{username:'',password:''},
    content:'',
    profile:''
  }
  res.render('signup',data);
});

//post signup method
router.post('/signup',upload.single('profile'),function(req,res,next){
  req.check('username','usernameは必ず入力してください。').notEmpty();
  req.check('password','passwordは必ず入力してください。').notEmpty();
  req.check('password','passwordは必ず8文字以上に設定してください。').isLength({min:8});
  req.check('password','passwordに数値を含めてください。').matches(/\d/);
  try{
    if(req.file.filename.endsWith('gif') || req.file.filename.endsWith('jpg') || req.file.filename.endsWith('png')){
      req.body.profile = 'succsess';
    }
  }catch(e){
    console.log('image error');
    console.log(e.message);
  }
  req.check('profile','画像を必ず入力してください。(拡張子はgif,jpg,pngのどれかでお願いします)').notEmpty();
  req.getValidationResult().then((result)=>{
    if(!result.isEmpty()){
      var content = '<ul class="errors" style="color:red;">';
      var result_arr = result.array();
      for(var n of result_arr){
        content += '<li>'+ n.msg + '</li>';
      }
      content += '</ul>';
      var data = {
        form:req.body,
        content:content,
        profile:{profiles:''}
      };
      res.render('signup',data);
    }else{
      var username = req.body.username;
      new User().where('username','=',username).fetch().then((result)=>{
        var content = '<ul class="errors" style="color:red;">';
        content += '<li>このユーザー名は存在してます。</li></ul>';
        var data = {
          form:req.body,
          content:content,
          profile:{profiles:''}
        };
        res.render('signup',data);
      })
      .catch((err)=>{
        req.session.login = null;
        var password = req.body.password;
        var hash = createHash(password);
        var profile = req.file.filename;
        cloudinary.uploader.upload(req.file.path,function(error,result){
          new User({'username':username,'password':hash,'filename':profile,'user_cloud':result.public_id}).save().then((result)=>{
            res.redirect('/users');
          })
          .catch((err) => {
            res.status(500).json({error:true,data:{message:err.message}});
          });
        });
      })
    }
  });
});

router.get('/',function(req,res,next){
  var data = {
    content:'',
    form:{username:'',password:''}
  }
  res.render('login',data);
});

router.post('/',function(req,res,next){
  req.check('username','usernameは必ず入力してください。').notEmpty();
  req.check('password','passwordは必ず入力してください。').notEmpty();
  req.getValidationResult().then((result)=>{
    if(!result.isEmpty()){
      var content = '<ul class="errors" style="color:red;">';
      var result_arr = result.array();
      for(var n of result_arr){
        content += '<li>'+ n.msg + '</li>';
      }
      content += '</ul>';
      var data = {
        form:req.body,
        content:content,
      }
      res.render('login',data);
    }else{
      var username = req.body.username;
      var password = req.body.password;
      new User().where('username','=',username).fetch().then((result)=>{
        // var hash = createHash(password);
        console.log(hashValidation(password,result.attributes.password));
        if(hashValidation(password,result.attributes.password)){
          req.session.login = result.attributes;
          res.redirect('/lists/lists/1');
        }else{
          console.log('ハッシュの検証が失敗しました。');
          var data = {
            form:req.body,
            content:'<p class="error" style="color:red;">ユーザー名またはパスワードが違います。</p>'
          };
          res.render('login',data);
        }
      })
      .catch((err)=>{
        console.log(err.message);
        var data = {
          form:req.body,
          content:'<p class="error" style="color:red;">ユーザー名またはパスワードが違います。</p>'
        };
        res.render('login',data);
      });
    }
  });
});

router.get('/logout',function(req,res,next){
  req.session.login = null;
  res.redirect('/');
});

module.exports = router;
