const Discord = require('discord.js');
const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES"] })
require("dotenv").config();

var TOKEN = process.env.TOKEN;

client.on('message', message => {
    if (message.content === '!hello') {
        message.channel.send('Hello World!');
    }
})

client.once('ready', () => {
    console.log('Ready!');
})

client.login(TOKEN);