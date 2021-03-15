const { Client } = require('discord.js');
const client = global.Client = new Client({ fetchAllMembers: true, partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });
const mongoose = require('mongoose');
const { token, prefix, url } = require('./config.json');
const data = require('./database/reaction.js');

mongoose.connect(url, {
useNewUrlParser: true,
useUnifiedTopology: true
}).catch(err => {
console.error(err);
process.exit(1);
});

client.on('ready', async () => {
console.log('Ready!')
})

client.on('message', async message => {
    if (message.author.bot || !message.guild || !message.content.toLowerCase().startsWith(prefix)) return;
    let args = message.content.split(' ').slice(1);
    let command = message.content.split(' ')[0].slice(prefix.length);

    if(command === 'reaction-role') {
    if(args[0] !== 'add' && args[0] !== 'delete') return message.channel.send('');
    if(args[0] === 'add') {
    let channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
    let id = args[2];
    let rol = message.mentions.roles.first() || message.guild.roles.cache.get(args[3]);
    let emoji = args[4];
    if(!channel) return message.channel.send('You must specify the reaction message channel.');
    if(!id) return message.channel.send('You must specify a reaction message id.');
    if(!rol) return message.channel.send('You must specify the role to be assigned.');
    if(!emoji) return message.channel.send('You must specify the reaction emoji.');
    channel.messages.fetch(id).then(msgid => {
    msgid.react(emoji);
    new data({
    guild: message.guild.id,
    message: id,
    role: rol.id,
    emoji: emoji
    }).save();
    message.channel.send('reaction occurred successfully.');
    })
    }
    if(args[0] === 'delete') {
        let id = args[1];
        if(!id) return message.channel.send('You must specify a reaction message id.');;
        let x = await data.findOne({ message: id });
        if(!x) return message.channel.send('I could not find such a reaction.');
      await data.findOneAndDelete({ guild: message.guild.id, message: id });
        message.channel.send('The reaction was successfully deleted.');
        }
}
})

client.on('messageReactionAdd', async (reaction, user) => {
if(!reaction.message.guild) return;
if(client.user.id === user.id) return;
data.findOne({ guild: reaction.message.guild.id, message: reaction.message.id}, async function (err, docs) {
let member = reaction.message.guild.members.cache.get(user.id)
if(reaction.message.guild.roles.cache.get(docs.role)) {
if(!member.roles.cache.has(docs.role)) member.roles.add(docs.role)
}
})
})

client.on('messageReactionRemove', async (reaction, user) => {
    if(!reaction.message.guild) return;
    if(client.user.id === user.id) return;
    data.findOne({ guild: reaction.message.guild.id, message: reaction.message.id}, async function (err, docs) {
    let member = reaction.message.guild.members.cache.get(user.id)
    if(reaction.message.guild.roles.cache.get(docs.role)) {
    if(member.roles.cache.has(docs.role)) member.roles.remove(docs.role)
    }
    })
    })

client.login(token)