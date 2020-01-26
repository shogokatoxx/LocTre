var knex = require('knex')({
  client:'pg',
  connection:{
    host:'ec2-54-174-221-35.compute-1.amazonaws.com',
    user:'jjwyxwczfbnais',
    password:'68e6718552f1584a52e1e2f42b6fd12cd4a2a75a42870982f607fe87d8cb9b38',
    database:'d2bmdmcurtu01j',
    charset:'utf8'
  }
});

var Bookshelf = require('bookshelf')(knex);

module.exports.DB = Bookshelf;
