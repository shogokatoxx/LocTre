var DB = require('./db_con').DB;

var User = DB.Model.extend({
  tableName:'User'
});

var Product = DB.Model.extend({
  tableName:'Product',
  // hasTimestamps:true,
  user:function(){
    return this.belongsTo(User,'user_id');
  }
});

var Good = DB.Model.extend({
  tableName:'Good'
});

module.exports = {
  User:User,
  Product:Product,
  Good:Good
};
