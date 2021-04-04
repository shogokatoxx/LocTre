var express = require('express');
var router = express.Router();

let fs = require('fs');

var models = require('../config/models');
var User = models.User;
var Product = models.Product;
var Good = models.Good;

// multerの設定
var multer = require('multer');

// ユニークな画像名にするため現在時刻との組み合わせを使う
require('date-utils');

// multer保存に関する設定
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

// multer設定適用
var upload = multer({storage:storage});

// cloudinaryの読み込み
let cloudinary = require('../config/cloudinary_con').cloudinary;

// 他社の詳細
router.get('/:productId/:userId/',function(req,res,next){
  if(req.session.login == null){
    res.redirect('/users');
    return;
  }
  const loginUserId = req.session.login.id;
  let productId = req.params.productId;
  let userId = req.params.userId;
  let users;
  let goods;
  new User().where('id','=',loginUserId).fetch().then((collection)=>{
    users = collection;
  });
  new Good().where('user_id','=',loginUserId).fetchAll().then((collection)=>{
    goods = collection.toArray();
  });
  new Product().where('id','=',productId).fetch({withRelated:['user']}).then((collection)=>{
    var data = {
      product:collection,
      users:users,
      goods:goods
    };
    console.log(data.users);
    res.render('detail',data);
  })
  .catch((err) => {
    res.status(500).json({error:true,data:{message:err.message}});
  });
});

// 自分の制作物の詳細(あまりに速度落ちるなら、詳細のテンプレートをフラグで分ける)
router.get('/mypage_detail/:productId/:userId',((req,res,next)=>{
  if(req.session.login == null){
    res.redirect('/users');
    return;
  }
  let loginUserObj = req.session.login;
  let productId = req.params.productId;
  let userId = req.params.userId;
  let users;
  let goods;
  let product;

  let userGetProcess = async function(){
    await new User().where('id','=',loginUserObj.id).fetch().then((collection)=>{
      users = collection;
    })
    .catch((err)=>{
      res.status(500).json({error:true,data:{message:err.message}});
    });
  }

  let goodGetProcess = async function(){
    await new Good().where('user_id','=',loginUserObj.id).fetchAll().then((collection)=>{
      goods = collection.toArray();
    })
    .catch((err)=>{
      res.status(500).json({error:true,data:{message:err.message}});
    });
  }

  let productGetProcess = async function(){
    await new Product().where('id','=',productId).fetch({withRelated:['user']}).then((collection)=>{
      product = collection;
    })
    .catch((err)=>{
      res.status(500).json({error:true,data:{message:err.message}});
    });
  }
  
  let finalProcess = function(){
    let data = {
      product:product,
      users:users,
      goods:goods,
      content:''
    };
    // [DEBUG]
    // console.log(data.users);

    res.render('mypage_detail',data);
  }

  let processAll = async function(){
    await userGetProcess();
    await goodGetProcess();
    await productGetProcess();
    finalProcess();
  }

  processAll();
  
}));

// 編集機能(モーダルからのアクセス)
router.post('/mypage_detail/:productId',upload.single('thumbnail'),function(req,res,next){
  req.check('title','タイトルは必ず入力してください。').notEmpty();
  try{
    if(req.file.filename.endsWith('gif') || req.file.filename.endsWith('jpg') || req.file.filename.endsWith('png')){
      req.body.profile = 'succsess';
    }
  }catch(e){
    console.log("images not found.don't images update!!");
    console.log(e.message);
  }
  req.sanitize('description').escape();
  req.getValidationResult().then((result)=>{
    if(!result.isEmpty()){
      console.log(req.body.profile);
      let loginUserObj = req.session.login;
      let re = '<ul class="error" style="color:red;">';
      let result_arr = result.array();
      for(var n in result.array()){
        re += '<li>' + result_arr[n].msg + '</li>';
      }
      re += '</ul>';
      let productId = req.params.productId;
      let userId = req.params.userId;
      let users;
      let goods;
      new User().where('id','=',loginUserObj.id).fetch().then((collection)=>{
        users = collection;
      });
      new Good().where('user_id','=',loginUserObj.id).fetchAll().then((collection)=>{
        goods = collection.toArray();
      });
      new Product().where('id','=',productId).fetch({withRelated:['user']}).then((collection)=>{
        let data = {
          product:collection,
          users:users,
          goods:goods,
          content:re
        };
        console.log(data.users);
        res.render('mypage_detail',data);
      })
      .catch((err)=>{
        res.status(500).json({error:true,data:{message:err.message}});
      });
    }else{
      let productId = req.params.productId;
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
      description = description.replace(/\r?\n/g, '<br>');
      console.log(description);
      if(req.body.profile == 'succsess'){
        new Product().where('id','=',productId).fetch().then((result)=>{
          try{
            cloudinary.uploader.destroy(result.attributes.product_cloud,function(error,result){
              if(error){
                console.log(error.message);
              }else{
                console.log('cloudianryに存在する前回登録の画像は削除しました。');
              }
            });
            fs.statSync('./public/uploads/'+result.attributes.images);
            fs.unlink('./public/uploads/'+result.attributes.images,function(err){
              if(err){
                console.log(err.message);
                res.send('fsのエラーが出てます。');
              }else{
                console.log('前回登録の画像の削除をしました。');
              }
            });
          }catch(error){
            console.log('削除対象画像が見つかりませんでした。このままオブジェクトの更新へ進みます。');
          }finally{
            cloudinary.uploader.upload(req.file.path,function(error,result){
              new Product().where('id','=',productId).save({'title':title,'description':description,'product_cloud':result.public_id,'images':create_image,'publish':publish,'updated_at':formatted},{patch:true}).then((collection)=>{
                res.redirect('/detail/mypage_detail/'+productId+'/'+loginUserObj.id);
              });
            });
          }
        });
      }else{
        new Product().where('id','=',productId).save({'title':title,'description':description,'publish':publish,'update_at':formatted},{patch:true}).then((collection)=>{
          res.redirect('/detail/mypage_detail/'+productId+'/'+loginUserObj.id);
        });
      }
    }
  });
});

module.exports = router;
