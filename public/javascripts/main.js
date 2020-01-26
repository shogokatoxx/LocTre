document.addEventListener('DOMContentLoaded',function(){
  let clickMenu = document.querySelector('.click-menu');
  let menuBtn = document.querySelector('.menu-btn');
  let container = document.querySelectorAll('.container');
  menuBtn.addEventListener('click',()=>{
    if(clickMenu.classList.contains('open')){
      clickMenu.classList.remove('open');
      container.forEach(function(value){
        value.classList.remove('open');
      });
    }else if(clickMenu.classList.contains('open')===false){
      clickMenu.classList.add('open');
      container.forEach(function(value){
        value.classList.add('open');
      });
    }
  });
  let goodCount = document.querySelectorAll('.good-count');
  console.log(goodCount);
  goodCount.forEach(function(result){
    console.log(result.childNodes.length);
    if(result.childNodes.length == 5){
      result.childNodes[3].remove();
    }
  });
},false);

$(function(){
  let $good = $('.good-btn');
  $good.on('click',function(e){
    e.preventDefault();
    let $this = $(this);
    let $productId = $this.data('productid');
    let $goodUser = $this.data('gooduser');
    let $goodbox = $this.children('.good-box');
    let $goodCount = $goodbox.children('i').html();
    console.dir('送信データ:'+'productId:'+$productId+','+'goodUser:'+$goodUser+','+'goodCount:'+$goodCount);
    $.ajax({
      type:'POST',
      url:'/good/',
      data:{productId:$productId,goodUser:$goodUser,goodCount:$goodCount},
      success:function(){
        console.log('Ajaxでサーバーへのリクエストは成功しました。');
      }
    }).done(function(data){
      console.log('Ajaxでサーバーから返信を受け取りました。');
      console.log(data);
      $goodbox.children('i').html(data);
      $this.toggleClass('fass');
      $this.toggleClass('farr');
    }).fail(function(msg){
      console.log('listsのいいね機能でAjaxエラーです。再度確認してください。');
    });
  });
});
