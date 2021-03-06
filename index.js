//requiring needed modules
const Discord = require('discord.js');
const fs = require("fs")
const request = require('request');
const config = require("./config.json");
const ytdl = require('ytdl-core');
const DBL = require("dblapi.js");




var youtube = require('./youtube.js');

var ytAudioQueue = [];
var dispatcher = null;


//make Discord bot client
const client = new Discord.Client();
const prefix = "!"
const dbl = new DBL('', client);

const hook = new Discord.WebhookClient('', '');
hook.send('⚡ ⛅ | Skywarn v2.2.0 is online. Be sure to #StayWeatherAware.');


client.on('message', function(message) {
    var messageParts = message.content.split(' ');
    var command = messageParts[0].toLowerCase();
    var parameters = messageParts.splice(1, messageParts.length);

    switch (command) {

        case "!join" : 
		if(message.author.id !== config.ownerID) return;
        message.reply("Attempting to join channel " + parameters[0]);
        JoinCommand(parameters[0], message);
        break;
    
        case "!play" :
		if(message.author.id !== config.ownerID) return;
        PlayCommand(parameters.join(" "), message);
        break;

        case "!playqueue":
        PlayQueueCommand(message);
        break;
    }
});


    function PlayCommand(searchTerm) {
        if(client.voiceConnections.array().length == 0) {
            var defaultVoiceChannel = client.channels.find(val => val.type === 'voice').name;
            JoinCommand(defaultVoiceChannel);
        }
        youtube.search(searchTerm, QueueYtAudioStream);
    }

    function PlayQueueCommand(message) {
        var queueString = "";

        for(var x = 0; x < ytAudioQueue.length; x++) {
            queueString += ytAudioQueue[x].videoName + ", ";
        }
        queueString = queueString.substring(0, queueString.length - 2);
        message.reply(queueString);
    }

    function JoinCommand(ChannelName) {
        var voiceChannel = GetChannelByName(ChannelName);

        if (voiceChannel) {
            voiceChannel.join();
            console.log("Joined " + voiceChannel.name);
        }
        
        return voiceChannel;
		
		
        
    }

    /* Helper Methods */

    function GetChannelByName(name) {
        var channel = client.channels.find(val => val.name === name);
        return channel;
    }

  

    function QueueYtAudioStream(videoId, videoName) {
        var streamUrl = youtube.watchVideoUrl + videoId;

        if (!ytAudioQueue.length) {
            ytAudioQueue.push(
                {
                    'streamUrl' : streamUrl,
                    'videoName' : videoName
                }
            );
            console.log('Queued audio ' + videoName);
            PlayStream(ytAudioQueue[0].streamUrl);
        }
        else {
            ytAudioQueue.push(
                {
                    'streamUrl' : streamUrl,
                    'videoName' : videoName
                }
            );
        }
        console.log("Queued audio " + videoName);
    }

    function PlayStream(streamUrl) {
        const streamOptions = {seek: 0, volume: 1};

        if (streamUrl) {
            const stream = ytdl(streamUrl, {filter: 'audioonly'});

            if (dispatcher == null) {
                var voiceConnection = client.voiceConnections.first();

                if(voiceConnection) {
                    console.log("Now Playing " + ytAudioQueue[0].videoname);
                    dispatcher = client.voiceConnections.first().playStream(stream, streamOptions);

                    dispatcher.on('end', () => {
                        dispatcher = null;
                        PlayNextStreamInQueue();
                    });

                    dispatcher.on('error', (err) => {
                        console.log(err);
                    });
                }
            } else {
                dispatcher = client.voiceConnections.first().playStream(stream, streamOptions);
            }
            
        }
    }

    function PlayNextStreamInQueue() {
        ytAudioQueue.splice(0, 1);

        if (ytAudioQueue.length != 0) {
            console.log("now Playing " + ytAudioQueue[0].videoName);
            PlayStream(ytAudioQueue[0].streamUrl);
        }
    }



client.on("guildCreate", guild => {

	console.log("Some one added the test bot to a server created by: " + guild.owner.user.username)

});


//Math functions
function kelToFar(kel){
  kel = parseFloat(kel);
  return ((kel * (9/5)) - 459.67).toString();
}

//Emoji weather resolver
function emoj(owi){
  if(owi == "01d" || owi == "01n"){ return ":sunny:"; }
  if(owi == "02d" || owi == "02n"){ return ":white_sun_small_cloud:"; }
  if(owi == "03d" || owi == "03n"){ return ":white_sun_cloud:"; }
  if(owi == "04d" || owi == "04n"){ return ":cloud:"; }
  if(owi == "09d" || owi == "09n"){ return ":cloud_rain:"; }
  if(owi == "10d" || owi == "10n"){ return ":white_sun_rain_cloud:"; }
  if(owi == "11d" || owi == "11n"){ return ":thunder_cloud_rain:"; }
  if(owi == "13d" || owi == "13n"){ return ":cloud_snow:"; }
  if(owi == "50d" || owi == "50n"){ return ":fog:"; } //This is a custom emoji, you would have to add your own
}

//Unix time to normal
function realTime(unx){
  var mer = "AM";
  var date = new Date(unx*1000);
  var hours = date.getHours();
  if(hours > 12){
    hours = hours - 12;
    var mer = "PM";
  }
  var min = 0 + date.getMinutes();
  var sec = 0 + date.getSeconds();
  return hours+":"+min+":"+sec+" "+mer;
}

//Unix date to normal
function realDate(unx){
  var mer = "AM";
  var date = new Date(unx*1000);
  var year = date.getFullYear();
  var mont = date.getMonth();
  var dow = date.getDay();
  var day = date.getDate();
  var hour = date.getHours();
  if(hour > 12){
    hour = hour - 12;
    var mer = "PM";
  }
  var min = 0 + date.getMinutes();
  var sec = 0 + date.getSeconds();
  function dowRes(num){
    if(num == 0){ return "Sunday" }
    if(num == 1){ return "Monday" }
    if(num == 2){ return "Tuesday" }
    if(num == 3){ return "Wendsday" }
    if(num == 4){ return "Thursday" }
    if(num == 5){ return "Friday" }
    if(num == 6){ return "Saturday" }
  }
  return hour+":"+min+":"+sec+" "+mer+" on "+dowRes(dow)+" the "+mont+" "+day+", "+year
}

//Commands Array
var commands = [];

//on bot ready
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setActivity('!weather <zip code> | #StayWeatherAware', { type: 'Playing' });
  client.user.setStatus('online')
});


//on bot message
client.on('message', (message) => {
	


  //Command handler
  function mainIn(string, array){
    var spli = string.split(" ");
    var x = array.findIndex(i => i.trigger === spli[0]+" ");
    if(array[x]){
      var obj = array[x];
      if(spli.length == obj.args){
        var regex = new RegExp("^"+obj.trigger+"", "gm");
        if(regex.test(string)){
          return obj.exec(spli[1], message);
        } else {
          return "Command trigger error";
        }
      } else {
        return "Wrong number of args in statment: given "+spli.length+", needed "+obj.args;
      }
    } else {
      comStrArray = [];
      commands.forEach(function(i){
        var nn = i.trigger;
        var nnn = nn.replace("!", "");
        var nnn = nnn.replace(" ", "");
        comStrArray.push(nnn);
      });
      return "Command not in command array: commands = ["+comStrArray.toString()+"]";
    }
  }

  //Commands
 
  var weather = {
	trigger: "!weather ",
    exec: function(q, message){
      var url = "http://api.openweathermap.org/data/2.5/weather?q="+q+"&APPID=5f7a3ebdd7c249e2afbbb8cec4368b1d"; //To Get AppID, go to https://openweathermap.org/appid
      request(url, function(e,r,b){
        var p = JSON.parse(b);
        console.log(p);
        if(p.main != undefined){
          console.log(message.author.username+" from "+message.author.channel+" requested the weather ("+Date.now()+")");
		  
        const embed = new Discord.RichEmbed()
		
		.setColor(0x954D23)
		
		.setDescription("__**"+p.name+" Weather | "+Math.round(kelToFar(p.main.temp))+"°F "+emoj(p.weather[0].icon)+"**__ \n"+p.weather[0].main+" with a high of **"+Math.round(kelToFar(p.main.temp_max))+"°F** and a low of **"+Math.round(kelToFar(p.main.temp_min))+"°F** \nHumidity at **"+p.main.humidity+"%** and Atmospheric Pressure at **"+p.main.pressure+" hPa** \nWind speed **"+Math.round(p.wind.speed * 2.997446 * 100) / 100+" mph** from bearing **"+p.wind.deg+"°** \nSunrise **"+realTime(p.sys.sunrise)+"**, Sunset **"+realTime(p.sys.sunset)+"** \nMeasured at Longitude **"+p.coord.lon+"**, Latitude **"+p.coord.lat+"** \n*Data was updated at "+realDate(p.dt)+"*");

          message.channel.send({embed})
          
        }
		
      });
    },
    args: 2
  }
  commands.push(weather);

  //Command Handle Listner
  mainIn(message.content, commands);
  
});

client.on("message", async (message) => {

	if (message.author.bot) return;

	if (!message.content.startsWith(prefix)) return;

	

	let command = message.content.split(" ")[0];

	command = command.slice(prefix.length);

	

	let args = message.content.split(" ").slice(1);

	

	if (command === "ping") {

		message.channel.send(`Pong! Time took: ${Date.now() - message.createdTimestamp} ms`);

	} else
	
    if (command === "about") {
		
		message.channel.send(
`Bot Name: Skywarn
Author: <@252084047264743428>
Version: v1.3.2`);
		
	} else
		
	if (command === "eas") {
		
		message.channel.send(
		
`The Emergency Alert System (EAS) is a national warning system in the United States put into place on January 1, 1997 (approved by Federal Communications Commission (FCC) in November 1994),[1] when it replaced the Emergency Broadcast System (EBS), which in turn replaced the CONELRAD System. The official EAS is designed to enable the President of the United States to speak to the United States within 10 minutes.[2] In addition to this requirement, EAS is also designed to alert the public of local weather emergencies such as tornadoes and flash floods (and in some cases severe thunderstorms depending on the severity of the storm). The most recent National EAS Test was performed on September 27, 2017 at 2:20 pm EDT (11:20 am PDT).[3]
EAS is jointly coordinated by the Federal Emergency Management Agency (FEMA), the Federal Communications Commission (FCC) and the National Weather Service (NOAA/NWS). The EAS regulations and standards are governed by the Public Safety and Homeland Security Bureau of the FCC. EAS has become part of Integrated Public Alert and Warning System (IPAWS), a program of FEMA.

Source: <https://en.wikipedia.org/wiki/Emergency_Alert_System>

http://4.bp.blogspot.com/-bt6H9Gace5w/TW_f0_7PC0I/AAAAAAAAAp0/FQpLzY9Nw88/s1600/EAS.jpg`);

    
	} else
		
	if (command === "invite") {
		
		message.channel.send(`Here you go: https://discordapp.com/api/oauth2/authorize?client_id=434112673072807936&permissions=536947712&scope=bot`);
		
		
	} else



	if (command === "say") {
		
		if(message.author.id !== config.ownerID) return;


		message.delete()

        const embed = new Discord.RichEmbed()

		.setColor(0x954D23)

		.setDescription(message.author.username + " says: " + args.join(" "));

		message.channel.send({embed})

	} else



	if (command == "help") {

		const embed = new Discord.RichEmbed()

		.setColor(0x954D23)

		.setTitle("Command List:")

		.addField("!help", "Will give the current command list")

		.addField("!ping", "WIll show the ping time for the bot")

		.addField("!say [text]", "Will make the bot say something")

	     .addField("!weather <zip code>", "To do a city name you must do it the way i have it typed out or it will not work. <!weather baltimore,md,us> and cities with two words you must do this <!weather severna+park,md,us>")
		 
		 .addField("!eas", "Displays information about The Emergency Alert System.")
		 
		 .addField("!invite", "Displays invite link to invite the bot to a discord server.");

		message.channel.send({embed})

	}
	



});


//login bot
client.login(config.token);
