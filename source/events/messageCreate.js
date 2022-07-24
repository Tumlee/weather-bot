const { handleCommand } = require('../command-handler.js');

module.exports = {
	name: 'messageCreate',
	execute(client, message) {
		console.log('test');
		let content = message.content;
		let user = message.author;
		let channel = message.channel;

		if(client.user.id === user.id)
			return;

		console.log('Message detected.');

		if(message.guild) {
			message.guild.members.fetch(user).then(guildMember => {
				try {
					let displayName = guildMember ? guildMember.nickname : user.username;

					if(displayName == null)
						displayName = user.username;
	
					console.log({content, displayName});

					if(!content.startsWith('!'))
						return;

					respond(message, content, user.id, channel, displayName, false);
				} catch(error) {
					console.log({username: user.username, content, error});
				}
			});
		} else {
			if(!content.startsWith('!'))
				return;

			respond(message, content, user.id, channel, user.username, true);
		}
	}
};

function respond(message, content, userId, channel, displayName, isPM) {
	let cResult = handleCommand(content, userId, displayName, isPM);

	if(cResult == null)
		return;

	Promise.resolve(cResult).then(commandResult => {
		if(commandResult.error) {
			channel.send('**ERROR:** ' + commandResult.error);
			return;
		}
	
		if(commandResult.embeds) {
			trySend(channel, {embeds: commandResult.embeds});
		} else {
			let messages = commandResult.messages ?? [commandResult.message];
			messages.forEach(message => trySend(channel, message));	
		}
		
		if(commandResult.deleteOrigin && !isPM && !commandResult.error)
			tryDelete(message);
	});
}

function trySend(channel, data) {
	channel.send(data).catch(error => {
		console.log({sendFailure: error});
	});
}

function tryDelete(message) {
	message.delete().catch(error => {
		console.log({deleteFailure: error});
	});
}