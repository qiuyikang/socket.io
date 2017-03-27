$(function() {
	console.log('connecting');
	var socket = io();
	
	socket.on('news', function (data) {      
        alert(data.hello);  
  //      socket.emit('my other event', { my: 'data' });  
  });	
});
