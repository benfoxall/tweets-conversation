var tweets = require('tweets'),
    express = require('express'),
    faye = require('faye'),
    http = require('http'),
    nano = require('nano'),
    config = require('./config.js');


var stream = tweets(config.tweets);

var db = nano(config.couch);

var follows, followCount;

function reset(){
  // bieber test
  follows = {};
  follows[config.root_id] = true;

  // ignore a user when they have added more than 20 users
  followCount = {};
}
reset();


// last id
var last_id_str;
var resetting;

stream.on('tweet', function(tweet){

  if(resetting) return;
  
  // don't count retweets, it makes things mental
  if(tweet.retweeted_status)
    return;

  try{


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
    if(followCount[user] > 20){ 
      skip = true;
    }
  })

  mentions.concat(tweet.user.id_str)
    .forEach(function(user){
      // always allow adds from benjaminbenben
      // so that people can get on the vis
      if(user === '14321903') skip = false;
    })

  if(!skip){
    // update the follows
    mentions.concat(tweet.user.id_str)
    .forEach(function(user){
      if(!follows[user]) console.log("following - ", user)
      
      follows[user] = true;
    })
  }

  } catch (e){
    console.log("ERROR-", e)
  }

});


stream.on('reconnect', function(r){
  console.log('>>reconnect', r);
})






function connect(){
  stream.filter({follow:Object.keys(follows).join(',')});
  var doc = {
    follows: Object.keys(follows)
  }

  if(last_id_str){
    last_id_str += '-f';
    db.insert(doc, last_id_str); 
  }
}


var priorLength = Object.keys(follows).length;

setInterval(function(){
  // 500 beiber fans are very noisy
  if( Object.keys(follows).length > 500){
    console.log("---> RESETTING");
    resetting = true
    reset();
    if(last_id_str){
      last_id_str += '-r';
      db.insert({reset: true}, last_id_str); 
    }
    // connect();
    // wait a while for the tweets to start again
    // setTimeout(function(){
    //   resetting = false;
    // }, 10000)
  } else if(priorLength !== Object.keys(follows).length){
    resetting = false;
    console.log("---> reconnecting, " +Object.keys(follows).length + ' follows');
    priorLength = Object.keys(follows).length;
    connect();
  } else {
    console.log('---> no change in follows - ', Object.keys(follows).length)
  }
}, 30*1000)

connect();



