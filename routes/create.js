var express = require('express');
var router = express.Router();

var models = require('../config/models');

var User = models.User;
var Product = models.Product;

var multer = require('multer');
require('date-utils');

var storage = multer.diskStorage({
  destination:function(req,file,cb){
    cb(null,'/public/uploads')
  },
  filename:function(req,file,cb){
    var dt = new Date();
    var formatted = dt.toFormat("YYYYMMDDHH24MISS");
    cb(null,formatted+file.originalname)
  }
});

var upload = multer({storage:storage});


router.get('/',function(req,res,next){
  let loginUserObj = req.session.login;
  if(req.session.login == null){
    res.redirect('/users');
    return;
  }
  new User().where('id','=',loginUserObj.id).fetch().then((collection)=>{
    var data = {
      users:collection,
      content:'',
      form:{title:'',description:'',publish:'Public'},
      image:{imagefile:''}
    }
    res.render('create',data);
  });
});

router.post('/',upload.single('thumbnail'),(req,res)=>{
  // console.log(req.file);
  req.check('title','タイトルは必ず入力してください。').notEmpty();
  try{
    if(req.file.filename){
      req.body.thumbnail = 'succsess';
    }
  }catch(e){
    console.log('image not found');
    console.log(e.message);
  }
  req.check('thumbnail','画像は必ず入れてください。').notEmpty();
  req.getValidationResult().then((result)=>{
    if(!result.isEmpty()){
      console.log(req.body.thumbnail);
      var re = '<ul class="error" style="color:red;">';
      var result_arr = result.array();
      for(var n in result.array()){
        re += '<li>' + result_arr[n].msg + '</li>';
      }
      re += '</ul>';
      new User().where('id','=',loginUserObj.id).fetch().then((collection)=>{
        var data = {
          users:collection,
          content:re,
          form:req.body,
          image:{imagefile:''}
        }
        res.render('create',data)
      });
    }else{
      let title = req.body.title;
      let description = req.body.description;
      let publish = req.body.publish;
      let create_image = req.file.filename;
      let loginUserObj = req.session.login;
      var dt = new Date();
      var formatted = dt.toFormat("YYYY-MM-DD HH24:MI:SS");
      if(description==''){
        description += 'None';
      }
      new Product({'user_id':loginUserObj.id,'title':title,'description':description,'images':create_image,'publish':publish,'created_at':formatted}).save().then((collection)=>{
        res.redirect('/lists')
      });
    }
  });
});

module.exports = router;
