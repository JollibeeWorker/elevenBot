const Discord = require('discord.js');
const client = new Discord.Client();

client.on('message', message => {
    if (message.content === '!hello') {
        message.channel.send('Hello World!');
    }
})

client.once('ready', () => {
    console.log('Ready!');
})

client.login('YOUR-TOKEN-HERE')