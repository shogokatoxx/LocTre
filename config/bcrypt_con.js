var bcrypt = require('bcrypt');

//ストレッチング回数
const saltRounds = 10;

//ハッシュを作成して返すメソッド ==> createHash()
let createHash = function(password){
  let hash = bcrypt.hashSync(password,saltRounds);
  return hash;
}

//入力パスワードとモデルのパスワードのハッシュ値の検証メソッド ==> hashValidation()
let hashValidation = function(inputpassword,setpassword){
  let flg = bcrypt.compareSync(inputpassword,setpassword);
  return flg;
}

module.exports = {
  createHash:createHash,
  hashValidation:hashValidation
};
