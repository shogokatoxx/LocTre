var express = require('express');
var router = express.Router();

// 削除更新時に前回のファイルを削除するためのファイルモジュール呼び出し。
let fs = require('fs');

// モデル呼び出し
var models = require('../config/models');
var dbConfig = require('../config/db_con');

// モデル設置
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

let cloudinary = require('../config/cloudinary_con').cloudinary;


////////////////////////
// 全一覧ビュー(新規順)
////////////////////////
router.get('/lists/:page',function(req,res,next){
  if(req.session.login == null){
    res.redirect('/users');
    return;
  }
  let users;
  let goods;
  let products;
  let paginationObj;
  let page = req.params.page;
  page *= 1;
  if(page < 1){page = 1;}
  let loginUserObj = req.session.login;
  
  // ユーザー情報取得プロセス
  let userGetProcess = async function(){
    await new User().where('id','=',loginUserObj.id).fetch().then((collection)=>{
      users = collection;
    })
    .catch((err) => {
      res.status(500).json({error:true,data:{message:err.message}});
    });
  }

  // いいね情報取得プロセス
  let goodGetProcess = async function(){
    await new Good().where('user_id','=',loginUserObj.id).fetchAll().then((collection)=>{
      goods = collection.toArray();
    })
    .catch((err) => {
      res.status(500).json({error:true,data:{message:err.message}});
    });
  }

  // 製作物情報取得プロセス
  let productGetProcess = async function(){
    await new Product().where('publish','=','Public').orderBy('created_at','DESC').fetchPage({pageSize:12,page:page,withRelated:['user']}).then((collection) => {
      products = collection.toArray();
      paginationObj = collection.pagination;
    })
    .catch((err) => {
      res.status(500).json({error:true,data:{message:err.message}});
    });
  }

  // 最終実行プロセス
  let finalProcess = function(){
    var data = {
      title:'・全制作物一覧(新規順)',
      pass:'lists',
      content:products,
      pagination:paginationObj,
      users:users,
      goods:goods
    };
    // [DEBUG]
    // console.log(users);
    // console.log(collection.pagination);
    res.render('lists',data);
  }

  let processAll = async function(){
    await userGetProcess();
    await goodGetProcess();
    await productGetProcess();
    // 上の3つの処理が終われば実行される
    finalProcess();
  }

  processAll();
});

// マイページ
router.get('/mypage',function(req,res,next){
  if(req.session.login == null){
    res.redirect('/users');
    return;
  }
  var users;
  var goods;
  var product;
  let loginUserObj = req.session.login;
  // ユーザー情報情報取得プロセス
  let usersGetProcess = async function(){
    await new User().where('id','=',loginUserObj.id).fetch().then((collection)=>{
      console.log(collection);
      users = collection;
    })
    .catch((err) => {
      res.status(500).json({error:true,data:{message:err.message}});
    });
  } 
  // いいね情報情報取得プロセス
  let goodGetProcess = async function(){
    await new Good().where('user_id','=',loginUserObj.id).fetchAll().then((collection)=>{
      console.log(collection.toArray());
      goods = collection.toArray();
    })
    .catch((err) => {
      res.status(500).json({error:true,data:{message:err.message}});
    });
  }
  // 製作物情報取得プロセス
  let productGetProcess = async function(){
    await new Product().where('user_id','=',loginUserObj.id).orderBy('created_at','DESC').fetchAll({withRelated:['user']}).then((collection) => {
      console.log(collection.toArray());
      product = collection.toArray();
    })
    .catch((err) => {
      res.status(500).json({error:true,data:{message:err.message}});
    });
  }
  // 最終実行プロセス
  let finalProcess = function(){
    var data = {
      content:product,
      users:users,
      goods:goods
    };
    // [DEBUG]
    // console.log('loginUserObj_id:'+loginUserObj.id);
    // console.log('users:'+users);
    // console.log('goods:'+goods);
    // console.log('products:'+product);
    // console.log('loginObj:'+loginUserObj);

    res.render('mypage',data);
  }
  let processAll = async function(){
    await usersGetProcess();
    await goodGetProcess();
    await productGetProcess();
    // 上のプロセスが全て終了したらこれが実行される
    finalProcess();
  }

  processAll();
  
});


///////////////////
// プロフ変更機能
///////////////////
router.post('/change_profile',upload.single('thumbnail'),function(req,res,next){
  try{
    if(req.file.filename.endsWith('gif') || req.file.filename.endsWith('jpg') || req.file.filename.endsWith('png') || req.file.filename.endsWith('jpeg')){
      req.body.profile = 'succsess';
    }
  }catch(e){
    console.log('image not found');
    res.send('画像の拡張子はgif,jpg,png,jpegのどれかで登録してください。');
  }
  let changeProfileImage = req.file.filename;
  let loginUserObj = req.session.login;
  new User().where('id','=',loginUserObj.id).fetch().then((result)=>{
    try{
      cloudinary.uploader.destroy(result.attributes.user_cloud,function(error,result){
        if(error){
          console.log(error.message);
        }else{
          console.log('プロフ変更に伴い、前回登録の画像を削除しました。');
        }
      });
      fs.statSync('./public/uploads/'+result.attributes.filename);
      fs.unlink('./public/uploads/'+result.attributes.filename,function(err){
        if(err){
          console.log(err.message);
          res.send('fsのエラーが出てます。');
        }else{
          console.log('画像の削除をしました。');
        }
      });
    }catch(error){
      console.log('削除対象のファイルがありませんでした。削除せずプロフ更新へ進みます。');
    }finally{
      cloudinary.uploader.upload(req.file.path,function(error,result){
        new User().where('id','=',loginUserObj.id).save({'user_cloud':result.public_id,'filename':changeProfileImage},{patch:true}).then((result)=>{
          console.log('ユーザーのプロフィール画像の更新が完了しました。');
          res.redirect('/lists/mypage');
        });
      });
    }
  });
});

// 公開/非公開の切り替え機能
router.get('/change_publish/:flg/:productid',function(req,res,next){
  let flg = req.params.flg;
  let productId = req.params.productid;
  if(flg == 1){
    new Product().where('id','=',productId).save({'publish':'Private'},{patch:true}).then((result)=>{
      res.redirect('/lists/mypage');
    });
  }else if(flg == 2){
    new Product().where('id','=',productId).save({'publish':'Public'},{patch:true}).then((result)=>{
      res.redirect('/lists/mypage');
    });
  }
});

// 削除機能
router.get('/delete/:productid',function(req,res,next){
  let productId = req.params.productid;
  let loginUserObj = req.session.login;
  console.log('productID：'+productId);//確認
  console.log('loginUserObj.id：'+loginUserObj.id);//確認
  new Product().where({'id':productId,'user_id':loginUserObj.id}).fetch().then((result)=>{
    try{
      cloudinary.uploader.destroy(result.attributes.product_cloud,function(error,result){
        if(error){
          console.log(error.message);
        }else{
          console.log('cloudinary内の対象画像の削除が完了しました。');
        }
      })
      fs.statSync('./public/uploads/'+result.attributes.images);
      fs.unlink('./public/uploads/'+result.attributes.images,function(err){
        if(err){
          console.log(err.message);
          res.send('fsのエラーが出てます。');
        }else{
          console.log('画像の削除をしました。');
        }
      });
    }catch(error){
      console.log('削除対象画像が見つかりませんでした。このままオブジェクトの削除へ進みます。');
    }finally{
      result.destroy();
      console.log('制作物と画像の削除が完了しました。次に関連するGoodオブジェクトの削除をしていきます。');
      new Good().where('product_id','=',productId).fetchAll().then((result)=>{
        result.destroy();
        res.redirect('/lists/mypage');
      })
      .catch((err)=>{
        console.log('Goodオブジェクト削除時にオブジェクト不登録or何かしらのエラーを受け取りました。');
        console.log('productId：'+productId);
        res.redirect('/lists/mypage');
      });
    }
  })
  .catch((err)=>{
    console.log(err.message);
    res.send('削除の時に何かしらのエラーが起きました。再度やり直してください。');
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
  res.send('Title not found error:タイトルが見つかりませんでした。戻って確認してください。');
});

module.exports = router;
