let express = require("express");
let router = express.Router();

//モデル呼び出し
let models = require("../config/models");
let dbConfig = require("../config/db_con");

//モデル設置
let User = models.User;
let Product = models.Product;


//管理者ページのトップ
router.get('/',(req,res,next)=>{
    //ログインセッションないのは
    if(req.session.login == null){
        res.redirect('/users');
        return;
    }

    let loginUserObj = req.session.login;

    //とりあえず権限なしでmahirusan以外は省く
    if(loginUserObj.username != "mahirusan"){
        res.render('admin_error',{});
    }else{
        res.render('admin/admin_top',{'user':loginUserObj});
    }
});

//制作物タイトル一覧ページ
router.get('/product',(req,res,next)=>{
    //ログインセッションないのは
    if(req.session.login == null){
        res.redirect('/users');
        return;
    }
    let obj;
    new Product().fetchAll().then((collection)=>{
        obj = collection.toArray();
        res.render('admin/admin_product_list',{products:obj,user:req.session.login});
    });
});

//ユーザー一覧ページの作成
router.get('/user',(req,res,next)=>{
    //ログインセッションの確認
    if(req.session.login == null){
        res.redirect('/users');
        return;
    }

    let obj;
    new User().fetchAll().then((collection)=>{
        obj = collection.toArray();
        res.render('admin/admin_user_list',{usrs:obj,user:req.session.login});
    });
});

//制作物詳細+更新ビュー
router.get('/product/:productId',(req,res,next)=>{
    //セッションの確認
    if(sessionAndLoginUserCheck(req.session.login)){
        res.redirect('/users');
        return;
    }

    let productId = req.params.productId;
    new Product().where('id','=',productId).fetch().then((collection)=>{
        let data = {
            form:{title:collection.attributes.title,description:collection.attributes.description},
            user:req.session.login
        }
        res.render('admin/admin_product_input',data);
    });
});

router.post('/product/:productId',(req,res,next)=>{
    let title = req.body.title;
    let description = req.body.description;
    let productId = req.params.productId;
    new Product().where('id','=',productId).save({title:title,description:description},{patch:true}).then((result)=>{
        res.redirect('/loctre_admin/product');
    });
});

router.get('/product/:productId/delete',(req,res,next)=>{
    let productId = req.params.productId;
    new Product().where('id','=',productId).fetch().then((result)=>{
        result.destroy();
    }).then((result)=>{
        res.redirect('/loctre_admin/product');
    })
});


//セッションの存在チェックと特定ユーザー名かのチェック
function sessionAndLoginUserCheck(sessionLoginValue){
    let flg = false;
    if(sessionLoginValue == null){
        flg = true;
    }else if(sessionLoginValue.username != "mahirusan"){
        flg = true;
    }
    return flg;
}

module.exports = router;