const Discord = require('discord.js');
const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES"] })
require("dotenv").config();

var TOKEN = process.env.TOKEN;

client.on('messageCreate', message => {
    if (message.content === '!e') {
        message.channel.send('Testing');
    }
})

client.once('ready', () => {
    console.log('Ready!');
})

client.login(TOKEN);