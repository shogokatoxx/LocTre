var express = require('express');
var router = express.Router();

//bcryptのお試し
var bcrypt = require('bcrypt');

var models = require('../config/models');
var Product = models.Product;
var Good = models.Good;


router.post('/',function(req,res,next){
  let productId = req.body.productId;
  let goodUser = req.body.goodUser;
  let goodCount = req.body.goodCount;
  let loginUserObj = req.session.login;
  var dt = new Date();
  var formatted = dt.toFormat("YYYY-MM-DD HH24:MI:SS");
  console.log('取得したデータ:'+'productId:'+productId+','+'goodUser:'+goodUser+','+'goodCount:'+goodCount+','+'loginUserObj:'+loginUserObj.id);
  // res.send('1');
  new Good().where({'user_id':loginUserObj.id,'product_id':productId,'good_user':goodUser}).fetch().then((result)=>{
    result.destroy();
    new Product().where('id','=',productId).save({'good_count':Number(goodCount)-1,'updated_at':formatted},{patch:true}).then((result)=>{
      console.log('Goodオブジェクトが見つかりました。これから削除してカウントを減らします。');
      res.send(String(Number(goodCount)-1));
    });
  })
  .catch((error)=>{
    new Good({'user_id':loginUserObj.id,'product_id':productId,'good_user':goodUser}).save().then((result)=>{
      new Product().where('id','=',productId).save({'good_count':Number(goodCount)+1,'updated_at':formatted},{patch:true}).then((result)=>{
        console.log('Goodオブジェクトが見つかりませんでした。これから作成してカウントを増やします。');
        res.send(String(Number(goodCount)+1));
      });
    });
  });
});

//bcryptの試しルート
router.get('/test',function(req,res,next){
  var target = 'syogo0327';
  var hash = bcrypt.hashSync(target,10);
  console.log(hash);
  var flg = bcrypt.compareSync('syogo0327',hash);
  console.log('検証結果:',flg);
  res.send(hash);
});

module.exports = router;
