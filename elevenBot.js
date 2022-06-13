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

function userFix(str) {
    const fix1 = str.replace('<', '');
    const fix2 = fix1.replace('>', '');
    const fix3 = fix2.replace('@', '');
    return fix3;
}

function getCommand(str) {
    const command = str.split(' ').shift();
    return command;
}

function playerID(json) {
    const id = json.data[0].id;
    return id;
}

function playerELO(json) {
    const ELO = json.data[0].elo;
    return ELO;
}

function playerRank(json) {
    const rank = JSON.stringify(json.data[0].attributes.rank);
    return rank;
}

function playerWins(json) {
    const wins = json.data[0].attributes.wins;
    return wins;
}

function playerLoss(json) {
    const loss = json.data[0].attributes.losses;
    return loss;
}

function playerPercent(wins, loss) {
    const percent = ((wins / (wins + loss)) * 100).toFixed(2);
    return percent;
}

function rawUser(json) {
    const raw = JSON.stringify(json['data'][0]['attributes']['user-name']);
    return raw;
}

function playerUserName(raw) {
    const userName = raw.toLowerCase();
    return userName
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
                
                if (command == 'link') {
                    client.db('elevenBot').collection('Users').find({ discordID: message.author.id }).toArray(function(err, res) {
                        if (!res.length) {
                            // Checks if the user has a record within the database.
                            client.db('elevenBot').collection('Users').find({ elevenID: playerID(playerJSON) }).toArray(function(err, result) {
                                if (!result.length) {
                                    // If user has no records within the database, it will start the verification process.
                                    var num = Math.floor(Math.random()*(999-100+1)+100);
                                    var word = randomWords();
                                    // Verification is a combination of a random word with a random number
                                    word += num;
                                    var input = { discordID: message.author.id, elevenID: playerID(playerJSON), verifyStatus: 'false', verifyNum: word };
                                    // User data storage includes their discord user id number, ETT user id number, verification status, and verification code.
                                    if (stringFix(playerUserName(rawUser(playerJSON))).includes(search.toLowerCase()) ) {
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

                if (command == 'search') {
                    if (search.includes('@')) {
                        client.db('elevenBot').collection('Users').find({ discordID: userFix(search) }).toArray(async function(err, res) {
                            if (!res.length) {
                                message.channel.send({ embeds: [userNoLink] });
                            } else {
                                const json = await idSearch(res[0].elevenID);
                                const searchName = JSON.stringify(json['data']['attributes']['user-name']);
                                const atLookup = new MessageEmbed()
                                    .setColor('#ff0000')
                                    .setTitle(`${stringFix(searchName)}'s Profile`)
                                    .setURL(`https://elevenvr.net/eleven/${stringFix(json.data.id)}`)
                                    .setDescription('Player Details:')
                                    .addFields(
                                        { name: 'ELO', value: `${json.data.attributes.elo}`, inline: true },
                                        { name: 'Rank', value: `${json.data.attributes.rank}`, inline: true },
                                        { name: 'Win %', value: `${playerPercent(json.data.attributes.wins, json.data.attributes.losses)}%` },
                                        { name: 'Wins', value: `${json.data.attributes.wins}`, inline: true },
                                        { name: 'Losses', value: `${json.data.attributes.losses}`, inline: true },
                                    )
                                    .setFooter({ text: 'Eleven Table Tennis' });

                                message.channel.send({ embeds: [atLookup] });
                            }
                        });
                        
                    } else if (typeof checkStatus == 'undefined') {
                        message.channel.send({ embeds: [embedFalse] });
                    } else {
                        const embedTrue = new MessageEmbed()
                            .setColor('#ff0000')
                            .setTitle(`${stringFix(rawUser(playerJSON))}'s Profile`)
                            .setURL(`https://elevenvr.net/eleven/${stringFix(playerID(playerJSON))}`)
                            .setDescription('Player Details:')
                            .addFields(
                                { name: 'ELO', value: `${playerELO(playerJSON)}`, inline: true },
                                { name: 'Rank', value: `${playerRank(playerJSON)}`, inline: true },
                                { name: 'Win %', value: `${playerPercent(playerWins(playerJSON), playerLoss(playerJSON))}%` },
                                { name: 'Wins', value: `${playerWins(playerJSON)}`, inline: true },
                                { name: 'Losses', value: `${playerLoss(playerJSON)}`, inline: true },
                            )
                            .setFooter({ text: 'Eleven Table Tennis' });

                        message.channel.send({ embeds: [embedTrue] });
                    }

                }

                
                const userNoLink = new MessageEmbed()
                    .setColor('#ff0000')
                    .setTitle('User has not linked their ETT account to Discord')
                    .setFooter({ text: 'Eleven Table Tennis' });

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
                    .setDescription('You can now change your username back. Type "!e stats" to view your stats.')
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