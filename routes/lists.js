var express = require('express');
var router = express.Router();

var models = require('../config/models');
var dbConfig = require('../config/db_con');

var User = models.User;
var Product = models.Product;
var Good = models.Good;

var multer = require('multer');
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

// 全一覧ビュー(新規順)
router.get('/lists/:page',function(req,res,next){
  if(req.session.login == null){
    res.redirect('/users');
    return;
  }
  var users;
  let goods;
  let page = req.params.page;
  page *= 1;
  if(page < 1){page = 1;}
  let loginUserObj = req.session.login;
  new User().where('id','=',loginUserObj.id).fetch().then((collection)=>{
    users = collection;
  });
  new Good().where('user_id','=',loginUserObj.id).fetchAll().then((collection)=>{
    goods = collection.toArray();
  });
  new Product().where('publish','=','Public').orderBy('created_at','DESC').fetchPage({pageSize:12,page:page,withRelated:['user']}).then((collection) => {
    var data = {
      title:'・全制作物一覧(新規順)',
      pass:'lists',
      content:collection.toArray(),
      pagination:collection.pagination,
      users:users,
      goods:goods,
      // pagination:collection.pagination
    };
    console.log(users);
    console.log(collection.pagination);
    res.render('lists',data);
  })
  .catch((err) => {
    res.status(500).json({error:true,data:{message:err.message}});
  });
});

// マイページ
router.get('/mypage',function(req,res,next){
  if(req.session.login == null){
    res.redirect('/users');
    return;
  }
  let users;
  let goods;
  let loginUserObj = req.session.login;
  new User().where('id','=',loginUserObj.id).fetch().then((collection)=>{
    users = collection;
  });
  new Good().where('user_id','=',loginUserObj.id).fetchAll().then((collection)=>{
    goods = collection.toArray();
  });
  new Product().where('user_id','=',loginUserObj.id).orderBy('created_at','DESC').fetchAll({withRelated:['user']}).then((collection) => {
    var data = {
      content:collection.toArray(),
      users:users,
      goods:goods
    };
    console.log(users);
    res.render('mypage',data);
  })
  .catch((err) => {
    res.status(500).json({error:true,data:{message:err.message}});
  });
});

router.post('/change_profile',upload.single('thumbnail'),function(req,res,next){
  try{
    if(req.file.filename.endsWith('gif') || req.file.filename.endsWith('jpg') || req.file.filename.endsWith('png')){
      req.body.profile = 'succsess';
    }
  }catch(e){
    console.log('image not found');
    res.send('画像の拡張子はgif,jpg,pngのどれかで登録してください。');
  }
  let changeProfileImage = req.file.filename;
  let loginUserObj = req.session.login;
  new User().where('id','=',loginUserObj.id).save({'filename':changeProfileImage},{patch:true}).then((result)=>{
    console.log('ユーザーのプロフィール画像の更新が完了しました。');
    res.redirect('/lists/mypage');
  });
});

// 全制作物一覧(人気順)
router.get('/goodranking/:page',function(req,res,next){
  if(req.session.login == null){
    res.redirect('/users');
    return;
  }
  var users;
  let goods;
  let page = req.params.page;
  page *= 1;
  if(page < 1){page = 1;}
  let loginUserObj = req.session.login;
  new User().where('id','=',loginUserObj.id).fetch().then((collection)=>{
    users = collection;
  });
  new Good().where('user_id','=',loginUserObj.id).fetchAll().then((collection)=>{
    goods = collection.toArray();
  });
  new Product().where('publish','=','Public').orderBy('good_count','DESC').fetchPage({page:page,pageSize:12,withRelated:['user']}).then((collection) => {
    var data = {
      title:'・全制作物一覧(人気順)',
      pass:'goodranking',
      content:collection.toArray(),
      users:users,
      goods:goods,
      pagination:collection.pagination
    };
    console.log(users);
    res.render('lists',data);
  })
  .catch((err) => {
    res.status(500).json({error:true,data:{message:err.message}});
  });
});

// いいねした制作物一覧
router.get('/lists_good/:page',function(req,res,next){
  if(req.session.login == null){
    res.redirect('/users');
    return;
  }
  var users;
  let goods;
  let page = req.params.page;
  page *= 1;
  if(page < 1){page = 1;}
  let loginUserObj = req.session.login;
  new User().where('id','=',loginUserObj.id).fetch().then((collection)=>{
    users = collection;
  });
  new Good().where('user_id','=',loginUserObj.id).fetchAll().then((collection)=>{
    goods = collection.toArray();
  });
  new Product().orderBy('good_count','DESC').fetchAll({withRelated:['user']}).then((collection) => {
    var data = {
      content:collection.toArray(),
      pagination:collection.pagination,
      users:users,
      goods:goods
    };
    let objlist = [];
    for(var i of data.content){
      for(var ii of data.goods){
        if(ii.attributes.user_id == loginUserObj.id && ii.attributes.product_id == i.id && ii.attributes.good_user == i.relations.user.id){
          objlist.push(i);
        }
      }
    }
    let listLen = objlist.length;//配列全体の長さ
    let pageCount = Math.floor(listLen/12);//pagesize12で切り捨て
    if(pageCount != listLen/12){//12、24などちょうど割り切れるときにも+1すると空のページが一つできてしまうのでその対策
        pageCount+=1;
    }
    let x = (page-1)*12;//1の場合0,12  2の場合12,24と
    let y = page*12;
    data = {
      content:objlist.slice(x,y),
      pagination:{
        page:page,
        pageCount:pageCount
      },
      users:users,
      goods:goods
    }
    console.log(data.content);
    res.render('lists_good',data);
  })
  .catch((err) => {
    res.status(500).json({error:true,data:{message:err.message}});
  });
});

// 検索機能
router.post('/serch',function(req,res,next){
  new Product().where('title','=',req.body.title).fetch({withRelated:['user']}).then((result)=>{
    res.redirect('/detail/'+result.id+'/'+result.relations.user.id)
  })
  .catch((err)=>{
    res.redirect('/lists/serch_error')
  });
});

// 検索時に見つからなかった時のエラー関数
router.get('/serch_error',function(req,res,next){
  res.send('タイトルが見つかりませんでした。');
});


module.exports = router;
