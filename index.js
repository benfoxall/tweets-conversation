var tweets = require('tweets'),
    express = require('express'),
    faye = require('faye'),
    http = require('http'),
    nano = require('nano'),
    config = require('./config.js');


var stream = tweets(config.tweets);

var db = nano('http://localhost:5984/tweets2');

// as an object for easier existence checks
var follows = {};
// ignore a user when they have added more than 20 users
var followCount = {};


stream.on('tweet', function(tweet){

  var mentions = tweet.entities.user_mentions.map(function(m){
    return m.id_str
  });

  var doc = {
    source: tweet.user.id_str,
    handle: tweet.user.screen_name,
    mentions: mentions,
    created_at: tweet.created_at
  }

  // console.log(doc)

  db.insert(doc, tweet.id_str);


  // possible, check if user mentions them
  var follow_count = Object.keys(follows).length;

  // check if they are ignored
  var skip = false;

  mentions.concat(tweet.user.id_str)
  .forEach(function(user){
    followCount[user] = (followCount[user] || 0)+1;
    if(followCount[user] > 20){
      skip = true;
    }
  })

  if(!skip){
    // update the follows
    mentions.concat(tweet.user.id_str)
    .forEach(function(user){
      follows[user] = true;
    })
  }

});


stream.on('reconnect', function(r){
  console.log('>>reconnect', r)
})

// bieber test
follows = {'27260086':true};


function connect(){
  stream.filter({follow:Object.keys(follows).join(',')});  
}


setInterval(function(){
  console.log("---> reconnecting, " +Object.keys(follows).length + ' follows');
  connect();
}, 30*1000)

connect();







/*
var users = [];

stream.on('tweet', function(t){
  'id':{
    users:[123,345,567]
  }



  var mentions = t.entities.user_mentions.map(function(m){
    return m.id_str
  });

  mentions.forEach(function(m){
    if(users.indexOf(m) === -1){
      users.push(m);
    }
  })
  // console.log("--> ", t.text)
  var obj = [t.id_str, {user:t.user.id_str, mentions: mentions } ]; 

  db.insert({
    user:t.user.id_str,
    mentions:mentions
  }, t.id_str)

  // console.log(obj)
  // // console.log(t)

  // bayeux.getClient()
  //   .publish('/tweet',obj);
});



// alice.insert({ crazy: true }, 'rabbit', function(err, body) {
//   if (!err)
//     console.log(body);
// });

var app = express();
app.use(express.static(__dirname + '/public'));

var bayeux = new faye.NodeAdapter({
  mount: '/faye', 
  timeout: 45
});

var server = http.createServer(app);
bayeux.attach(server);
server.listen(3000);


// 
// var pizzaUsers = [];

// stream.on('tweet', function(t){
//   console.log("--> ", t.id_str)
//   pizzaUsers.push(t.id_str)
// })


var users = ['1876429920', '2188061234', '1153456249', '1873572792', '947013642', '204604798', '610039960', '601035101', '544587396', '276357208', '177636165', '488571200', '1890412147', '636018413', '545800490', '1094420300', '1606460738', '422842358', '7153532', '281404326', '429136571', '583483567', '1683186776', '2163125503', '1089259693', '220671173', '206948473', '1109528222', '1891037875', '1664998562', '295195276', '295687045', '1850419194', '1459173139', '1059857066', '48782971', '1957888555', '192148071', '337447537', '317082238', '398937303', '1226039407', '946251409', '142044554', '46983292', '1968328122', '393237693', '1148835421', '14979046', '1427323219', '597509854', '461061071', '99671707', '298495017', '132753981', '133572518', '1968328122', '61646001', '794803339', '910008756', '246582527', '1026368617', '286975499', '1042393874', '381688697', '1659681800', '1905532224', '430254209', '27839797', '16071303', '16071246', '176648118', '1681751467', '706472190', '39638501', '516496335', '584579148', '1573109473', '196744956', '382554176', '309358992', '151036239', '615862043', '78057014', '1364235264', '404705405', '537670031', '27839797', '1850765737', '404705405', '255877972', '105747330', '144796786', '45680736', '142853614', '814416342', '1382533699', '479197407', '1947629810', '556073563', '245221004', '359116248', '1661849438', '1626268146', '459074696', '223806407', '913729747', '1524732758', '427364431', '238842242', '38280664', '1677692300', '19955789', '2154192707', '541156816', '2150320806', '459913339', '30411433', '1533061381', '359116248', '913729747', '478695553', '1562799674', '430418015', '1397090696', '435898097', '595829096', '1608562388', '37622532', '1076106912', '40203252', '364079011', '20377739', '276027409', '362034837', '404705405', '493002519', '1854362418', '540922286', '134688684', '226787596', '388752693', '542572841', '379966779', '566269109', '475421640', '258616517', '535992355', '552098022', '15165314', '1381257925', '611568196', '1922972718', '1224551478', '584579148', '432281861', '156677241', '819170401', '86549301', '1348370875', '819170401', '1862597882', '878715678', '256166912', '875890982', '1597652426', '404705405', '1345117418', '404705405', '574155835', '321043883', '2158721413', '110202157', '983531264', '179694836', '957441206', '626171197', '391189898', '267551337', '834550890', '522075801', '366772710', '435788955', '551604958']

// benjaminfakeben - 1557995095
// justin beiber - 27260086

users = ['27260086'];

stream.on('tweet', function(t){
  var mentions = t.entities.user_mentions.map(function(m){
    return m.id_str
  });

  mentions.forEach(function(m){
    if(users.indexOf(m) === -1){
      users.push(m);
    }
  })
  // console.log("--> ", t.text)
  var obj = [t.id_str, {user:t.user.id_str, mentions: mentions } ]; 

  console.log(obj)
  // console.log(t)

  bayeux.getClient()
    .publish('/tweet',obj);
});


stream.on('reconnect', function(r){
  console.log('>>reconnect', r)
})

stream.filter({follow:users.join(',')})

// stream.filter({track:'pizza'});


/*

outptting -> 

[tweet.id_str, {
  user: tweet.user.id_str,
  mentions: [...other_ids]
}]

// users << mentions 

*/