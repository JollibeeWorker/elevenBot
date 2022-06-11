const Discord = require('discord.js');
const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES"] });
const fetch = require('node-fetch');
const { MessageEmbed } = require('discord.js');
require("dotenv").config();

var TOKEN = process.env.TOKEN;

//function playerMatch() {
    //fetch('https://www.elevenvr.club/api/v1/accounts/710080/matches/latest')
    //        .then(response => response.json())
    //        .then(data => console.log(data.data))
    //        .then(data => message.channel.send(data.data));
//}

async function playerMatch(playerID) {
    const response = await fetch(`https://www.elevenvr.club/api/v1/accounts/${playerID}/matches/latest`, {});
    const json = await response.json();
    const string = JSON.stringify(json.data.id);
    const stringFix = string.replaceAll('"', '');
    console.log(stringFix);
    return stringFix;
}

async function playerSearch(username) {
    const response = await fetch(`https://www.elevenvr.club/accounts/search/${username}`);
    const json = await response.json();
    const string = JSON.stringify(json.data[0].id);
    const stringFix = string.replaceAll('"','');
    console.log(stringFix);
    return stringFix;
}

client.on('messageCreate', message => {

    var prefix = '!e ';

    async function callMe() {
        if (message.content.startsWith(prefix)) {
            const array = message.content;
            const alter = array.slice(3);
            message.channel.send(alter);
            const playerID = await playerSearch(alter);
            const test = await playerMatch(playerID);
            message.channel.send(playerID);
            message.channel.send(test);

            const embed = new MessageEmbed()
                .setColor('#ff0000')
                .setTitle(`${alter}'s Profile`)
                .setURL(`https://elevenvr.net/eleven/${playerID}`)
                .setDescription('Player Details')
                .setFooter({ text: 'Eleven Table Tennis' });

            message.channel.send({ embeds: [embed] });
        }
    }
    callMe();
    

})

client.once('ready', () => {
    console.log('Ready!');
})

client.login(TOKEN);