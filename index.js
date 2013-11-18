var tweets = require('tweets'),
    express = require('express'),
    faye = require('faye'),
    http = require('http'),
    nano = require('nano'),
    config = require('./config.js');


var stream = tweets(config.tweets);

var db = nano('http://localhost:5984/tweets');

var follows, followCount;

function reset(){
  // bieber test
  follows = {'27260086':true};

  // ignore a user when they have added more than 20 users
  followCount = {};
}
reset();


// last id
var last_id_str;

stream.on('tweet', function(tweet){

  // don't count retweets, it makes things mental
  if(tweet.retweeted_status)
    return;

  last_id_str = tweet.id_str;

  // pull out the id strings of any users mentioned
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
    if(followCount[user] > 50){
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




function connect(){
  stream.filter({follow:Object.keys(follows).join(',')});
  var doc = {
    follows: Object.keys(follows)
  }

  if(last_id_str){
    var id = last_id_str += '-f';
    db.insert(doc, last_id_str); 
  }
}


var priorLength = Object.keys(follows).length;

setInterval(function(){
  if( Object.keys(follows).length > 300){
    reset();
  } else if(priorLength !== Object.keys(follows).length){
    console.log("---> reconnecting, " +Object.keys(follows).length + ' follows');
    connect();
  }
}, 30*1000)

connect();



