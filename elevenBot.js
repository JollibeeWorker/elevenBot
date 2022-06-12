const Discord = require('discord.js');
const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES"] });
const fetch = require('node-fetch');
const MongoClient = require('mongodb').MongoClient;
const { MessageEmbed } = require('discord.js');
require("dotenv").config();

var TOKEN = process.env.TOKEN;
var URI = process.env.URI;

async function connectToCluster(URI) {
    let mongoClient;
    try {
        mongoClient = new MongoClient(URI);
        console.log('connectiong to MongoDB cluster... ');
        await mongoClient.connect();
        console.log('Successfully connected to MongoDB!');
        return mongoClient;
    } catch (error) {
        console.error('Connection to MongoDB failed!', error);
        process.exit();
    }
}

connectToCluster(URI);

async function playerSearch(username) {
    const response = await fetch(`https://www.elevenvr.club/accounts/search/${username}`);
    const json = await response.json();
    return json;
}

function stringFix(str) {
    const strFix = str.replaceAll('"', '');
    return strFix;
}

client.on('messageCreate', message => {

    var prefix = '!e ';

    async function callMe() {
        if (message.content.startsWith(prefix)) {

            const array = message.content;
            const alter = array.slice(3);
            const playerJSON = await playerSearch(alter);
            const playerID = JSON.stringify(playerJSON.data[0].id);
            const playerELO = JSON.stringify(playerJSON.data[0].attributes.elo);
            const playerRank = JSON.stringify(playerJSON.data[0].attributes.rank);
            const playerWins = playerJSON.data[0].attributes.wins;
            const playerLoss = playerJSON.data[0].attributes.losses;
            const playerPercent = ((playerWins / (playerWins + playerLoss)) * 100).toFixed(2);
            const userTemp = JSON.stringify(playerJSON['data'][0]['attributes']['user-name']);
            const playerUserName = userTemp.toLowerCase();

            const embedTrue = new MessageEmbed()
                .setColor('#ff0000')
                .setTitle(`${stringFix(userTemp)}'s Profile`)
                .setURL(`https://elevenvr.net/eleven/${stringFix(playerID)}`)
                .setDescription('Player Details:')
                .addFields(
                    { name: 'ELO', value: `${playerELO}`, inline: true },
                    { name: 'Rank', value: `${playerRank}`, inline: true },
                    { name: 'Win %', value: `${playerPercent}%` },
                    { name: 'Wins', value: `${playerWins}`, inline: true },
                    { name: 'Losses', value: `${playerLoss}`, inline: true },
                )
                .setFooter({ text: 'Eleven Table Tennis' });


            const embedFalse = new MessageEmbed()
                .setColor('#ff0000')
                .setTitle('User not found')
                .setFooter({ text: 'Eleven Table Tennis' });

            if (stringFix(playerUserName).includes(alter.toLowerCase())) {
                message.channel.send({ embeds: [embedTrue] });
            } else {
                message.channel.send({ embeds: [embedFalse] });
            }

            

        }
    }
    callMe();
    

})

client.once('ready', () => {
    console.log('Ready!');
})

client.login(TOKEN);