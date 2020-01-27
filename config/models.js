var DB = require('./db_con').DB;

var User = DB.Model.extend({
  tableName:'users'
});

var Product = DB.Model.extend({
  tableName:'products',
  // hasTimestamps:true,
  user:function(){
    return this.belongsTo(User,'user_id');
  }
});

var Good = DB.Model.extend({
  tableName:'goods'
});

module.exports = {
  User:User,
  Product:Product,
  Good:Good
};
