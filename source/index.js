// Require the necessary discord.js classes
const { Client, Collection, Intents, GatewayIntentBits } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');

const config = {
	token: process.env.discordApiToken,
    applicationId: process.env.discordClientId,
    clientId: process.env.discordClientId,
};

function main() {
	// Create a new client instance
    console.log({Client, GatewayIntentBits});

	const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.DirectMessages,
            GatewayIntentBits.MessageContent
        ],
		partials: ['MESSAGE', 'CHANNEL']
	});

	registerEvents(client);
	client.login(config.token);
}

function getJsFiles(path) {
	return fs.readdirSync(path).filter(file => file.endsWith('.js'));
}

function registerEvents(client) {
	const eventFiles = getJsFiles('./source/events');
	
	for (const file of eventFiles) {
		console.log('Registering event type: ' + file);
		const event = require(`./events/${file}`);

		let runFunc = (...args) => {
			try {
				event.execute(client, ...args);
			} catch(error) {
				console.log(error);
			}
		};

		if (event.once) {
			client.once(event.name, runFunc);
		} else {
			client.on(event.name, runFunc);
		}
	}
}

main();