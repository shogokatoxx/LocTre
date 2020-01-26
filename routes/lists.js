var express = require('express');
var router = express.Router();

var models = require('../config/models');

var User = models.User;
var Product = models.Product;
var Good = models.Good;

// 全一覧ビュー(新規順)
router.get('/',function(req,res,next){
  if(req.session.login == null){
    res.redirect('/users');
    return;
  }
  var users;
  let goods;
  let loginUserObj = req.session.login;
  new User().where('id','=',loginUserObj.id).fetch().then((collection)=>{
    users = collection;
  });
  new Good().where('user_id','=',loginUserObj.id).fetchAll().then((collection)=>{
    goods = collection.toArray();
  });
  new Product().where('publish','=','Public').orderBy('created_at','DESC').fetchAll({withRelated:['user']}).then((collection) => {
    var data = {
      title:'・全制作物一覧(新規順)',
      content:collection.toArray(),
      users:users,
      goods:goods
    };
    console.log(users);
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

// 全制作物一覧(人気順)
router.get('/goodranking',function(req,res,next){
  if(req.session.login == null){
    res.redirect('/users');
    return;
  }
  var users;
  let goods;
  let loginUserObj = req.session.login;
  new User().where('id','=',loginUserObj.id).fetch().then((collection)=>{
    users = collection;
  });
  new Good().where('user_id','=',loginUserObj.id).fetchAll().then((collection)=>{
    goods = collection.toArray();
  });
  new Product().where('publish','=','Public').orderBy('good_count','DESC').fetchAll({withRelated:['user']}).then((collection) => {
    var data = {
      title:'・全制作物一覧(人気順)',
      content:collection.toArray(),
      users:users,
      goods:goods
    };
    console.log(users);
    res.render('lists',data);
  })
  .catch((err) => {
    res.status(500).json({error:true,data:{message:err.message}});
  });
});

// いいねした制作物一覧
router.get('/lists_good',function(req,res,next){
  if(req.session.login == null){
    res.redirect('/users');
    return;
  }
  var users;
  let goods;
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
    data = {
      content:objlist,
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
