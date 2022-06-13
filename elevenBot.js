const Discord = require('discord.js');
const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES"] });
const fetch = require('node-fetch');
const randomWords = require('random-words');
const MongoClient = require('mongodb').MongoClient;
const { MessageEmbed } = require('discord.js');
require("dotenv").config();

var TOKEN = process.env.TOKEN;
var URI = process.env.URI;


async function playerSearch(username) {
    const response = await fetch(`https://www.elevenvr.club/accounts/search/${username}`);
    const json = await response.json();
    return json;
}

async function idSearch(id) {
    const response = await fetch(`https://www.elevenvr.club/accounts/${id}`);
    const json = await response.json();
    return json;
}

function stringFix(str) {
    const strFix = str.replaceAll('"', '');
    return strFix;
}

function getCommand(str) {
    const command = str.split(' ').shift();
    return command;
}

client.on('messageCreate', message => {

    var prefix = '!e ';

    async function callMe() {
        const client = new MongoClient(URI);
        client.connect(async function err() {
            if (message.content.startsWith(prefix)) {
                const embedFalse = new MessageEmbed()
                    .setColor('#ff0000')
                    .setTitle('User not found')
                    .setFooter({ text: 'Eleven Table Tennis' });
                const array = message.content;
                const alter = array.slice(3);
                const command = getCommand(alter);
                const search = alter.replace(`${command} `, '');
                const playerJSON = await playerSearch(search);
                const checkStatus = playerJSON.data[0];
                if (typeof checkStatus == 'undefined') {
                    message.channel.send({ embeds: [embedFalse] });
                }
                const playerID = playerJSON.data[0].id;
                const playerELO = playerJSON.data[0].attributes.elo;
                const playerRank = JSON.stringify(playerJSON.data[0].attributes.rank);
                const playerWins = playerJSON.data[0].attributes.wins;
                const playerLoss = playerJSON.data[0].attributes.losses;
                const playerPercent = ((playerWins / (playerWins + playerLoss)) * 100).toFixed(2);
                const userTemp = JSON.stringify(playerJSON['data'][0]['attributes']['user-name']);
                const playerUserName = userTemp.toLowerCase();

                if (command == 'link') {
                    client.db('elevenBot').collection('Users').find({ discordID: message.author.id }).toArray(function(err, res) {
                        if (!res.length) {
                            // Checks if the user has a record within the database.
                            client.db('elevenBot').collection('Users').find({ elevenID: playerID }).toArray(function(err, result) {
                                if (!result.length) {
                                    // If user has no records within the database, it will start the verification process.
                                    var num = Math.floor(Math.random()*(999-100+1)+100);
                                    var word = randomWords();
                                    // Verification is a combination of a random word with a random number
                                    word += num;
                                    var input = { discordID: message.author.id, elevenID: playerID, verifyStatus: 'false', verifyNum: word };
                                    // User data storage includes their discord user id number, ETT user id number, verification status, and verification code.
                                    if (stringFix(playerUserName).includes(search.toLowerCase()) ) {
                                        client.db('elevenBot').collection('Users').insertOne(input, function(err, res) {
                                            const embedLink = new MessageEmbed()
                                                .setColor('#ff0000')
                                                .setTitle('Account found, follow instructions below.')
                                                .setDescription(`Change your ETT username to "${word}", then type "!e verify" in the Discord.`)
                                                .setFooter({ text: 'Eleven Table Tennis' });
                                            message.author.send({ embeds: [embedLink] });
                                            message.channel.send({ embeds: [checkDM] });
                                        });
                                    } else {
                                        // Triggers if ETT user is not found.
                                        message.channel.send({ embeds: [embedFalse] });
                                    }
                                } else if (res[0].verifyStatus == 'true'){
                                    // Triggers if discord user has already linked their ETT account.
                                    message.channel.send({ embeds: [userExists] });
                                }
                            });


                        } else if (res[0].verifyStatus == 'false') {
                            // If user tries to link but has already requested their verification code, this will appear. 
                            const linkInProgress = new MessageEmbed()
                                .setColor('#ff0000')
                                .setTitle(`You have already requested a link to this account.`)
                                .setDescription(`Change your ETT username to "${res[0].verifyNum}", then type "!e verify" in the Discord.`)
                                .setFooter({ text: 'Eleven Table Tennis' });
                            message.author.send({ embeds: [linkInProgress]});
                            message.channel.send({ embeds: [checkDM] });
                        } else {
                            message.channel.send({ embeds: [alreadyLinked] });
                        }
                    });
                    
                }

                if (command == 'verify') {
                    client.db('elevenBot').collection('Users').find({ discordID: message.author.id }).toArray( async function(err, res) {
                        if(!res.length) {
                            message.channel.send({ embeds: [linkRemind] });
                        } else if (res[0].verifyStatus == 'true') {
                            message.channel.send({ embed: [alreadyLinked] });
                        } else {
                            const checkJSON = await idSearch(res[0].elevenID);
                            const checkUser = JSON.stringify(checkJSON['data']['attributes']['user-name'])
                            const str = stringFix(checkUser);
                            const id = { discordID: message.author.id };
                            const update = { $set: { verifyStatus: 'true' }};
                            if (res[0].verifyNum == str) {
                                client.db('elevenBot').collection('Users').updateOne( id,  update, function(err, result){
                                    message.channel.send({ embeds: [verifySuccess] });
                                });
                            } else {
                                message.channel.send({ embeds: [verifyFail] });
                            }
                        }
                    });
                }

                if (command == 'stats') {
                    client.db('elevenBot').collection('Users').find({ discordID: message.author.id }).toArray(async function(err, res) {
                        if (!res.length) {
                            message.channel.send({ embeds: [embedStatError] });
                        } else {
                            const statJSON = await idSearch(res[0].elevenID);
                            const statELO = statJSON.data.attributes.elo;
                            const statUserName = JSON.stringify(statJSON['data']['attributes']['user-name']);
                            const statWins = statJSON.data.attributes.wins;
                            const statLoss = statJSON.data.attributes.losses;
                            const statPercent = ((statWins / (statWins + statLoss)) * 100).toFixed(2);
                            const statRank = statJSON.data.attributes.rank;
                            const embedStats = new MessageEmbed()
                            .setColor('#ff0000')
                            .setTitle(`${stringFix(statUserName)}'s Profile`)
                            .setURL(`https://elevenvr.net/eleven/${stringFix(res[0].elevenID)}`)
                            .setDescription('Player Details:')
                            .addFields(
                                { name: 'ELO', value: `${statELO}`, inline: true },
                                { name: 'Rank', value: `${statRank}`, inline: true },
                                { name: 'Win %', value: `${statPercent}%` },
                                { name: 'Wins', value: `${statWins}`, inline: true },
                                { name: 'Losses', value: `${statLoss}`, inline: true },
                            )
                            .setFooter({ text: 'Eleven Table Tennis' });

                            message.channel.send({ embeds: [embedStats] });

        
                        }
                    });
                    
                }

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

                if (command == 'search') {
                    if (stringFix(playerUserName).includes(search.toLowerCase())) {
                        message.channel.send({ embeds: [embedTrue] });
                    } else {
                        message.channel.send({ embeds: [embedFalse] });
                    }
                }

                const userExists = new MessageEmbed()
                    .setColor('#ff0000')
                    .setTitle('User has already been linked to a Discord')
                    .setFooter({ text: 'Eleven Table Tennis' });

                const checkDM = new MessageEmbed()
                    .setColor('#ff0000')
                    .setTitle('Check your DM')
                    .setFooter({ text: 'Eleven Table Tennis' });
                    
                const verifySuccess = new MessageEmbed()
                    .setColor('#ff0000')
                    .setTitle('Successfully verified!')
                    .setDescription('Type "!e stats" to view your stats.')
                    .setFooter({ text: 'Eleven Table Tennis' });

                const verifyFail = new MessageEmbed()
                    .setColor('#ff0000')
                    .setTitle('Verification Unsuccessful')
                    .setDescription('Either the verification number did not match or you have not yet changed your usename.')
                    .setFooter({ text: 'Eleven Table Tennis' });

                const linkRemind = new MessageEmbed()
                    .setColor('#ff0000')
                    .setTitle('You have not yet linked your ETT account. Type "!e link <username>" to link.')
                    .setFooter({ text: 'Eleven Table Tennis' });

                const alreadyLinked = new MessageEmbed()
                    .setColor('#ff0000')
                    .setTitle('You have already linked an ETT account with your Discord!')
                    .setDescription('Type "!e stats" to view your stats.')
                    .setFooter({ text: 'Eleven Table Tennis' });

                const embedStatError = new MessageEmbed()
                    .setColor('#ff0000')
                    .setTitle('You have not yet linked an ETT account!')
                    .setDescription('Type "!e link <username>" to link your ETT account to Discord.')
                    .setFooter({ text: 'Eleven Table Tennis' });
    
                
    
            }
            client.close;
        });

    }
    callMe();
    

})

client.once('ready', () => {
    console.log('Ready!');
})

client.login(TOKEN);