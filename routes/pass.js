const express = require('express');
const router = express.Router();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User1 = {
  name:'mahiru',
  password:'mahiru0327'
};
passport.use(new LocalStrategy((user,pass,done)=>{
  if(user !== User1.name){
    return done(null,false);
  }else if(pass !== User1.password){
    return done(null,false);
  }else{
    return done(null,{username:user,password:pass});
  }
}));

passport.serializeUser((user,done)=>{
  console.log('Serialize...');
  done(null,user);
});

passport.deserializeUser((user,done)=>{
  console.log('Deserialize...');
  done(null,user);
});

router.use(passport.initialize());
router.use(passport.session());

router.get('/',(req,res)=>{
  console.log(req.session);
  res.render('pass',{user:req.user});
});
router.get('/failure',(req,res)=>{
  console.log(req.session);
  res.send('Failure');
});
router.get('/success',(req,res)=>{
  console.log(req.session);
  res.redirect('/');
});

router.post('/',passport.authenticate('local',{
  failureRedirect:'/pass/failure',
  successRedirect:'/pass/success'
}));
router.post('/logout',(req,res)=>{
  req.session.passport.user = undefined;
  res.redirect('/');
});

// router.post('/',(req,res,next)=>{
//   console.log(req);
//   next();
// },
// passport.authenticate('local',{
//   session:false,
//   failureRedirect:'/failure'
// }),
// (req,res)=>{
//   console.log(req.user);
//   res.send('success');
// });

module.exports = router;
