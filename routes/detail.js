var express = require('express');
var router = express.Router();

var models = require('../config/models');
var User = models.User;
var Product = models.Product;
var Good = models.Good;

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
    res.render('detail',data)
  })
  .catch((err) => {
    res.status(500).json({error:true,data:{message:err.message}});
  });
});

module.exports = router;
