/** Imports */
import { credentials, settings } from './Settings';
import { readdirSync } from 'fs';
import { join } from 'path';
import {
	Client,
	Message,
	Collection,
	GuildMember,
	User,
} from 'discord.js-light';
/** defining stuff */
const commands = new Collection();
let command: string;
let usr: User;
let memb: GuildMember;
/** Making the client */
const client = new Client({
	cacheGuilds: true,
	cacheChannels: false,
	cacheOverwrites: false,
	cacheRoles: false,
	cacheEmojis: false,
	cachePresences: false,
});
/** Loading Commands */
const commandFiles = readdirSync(join(__dirname, 'commands')).filter((file) =>
	file.endsWith('.js')
);

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	commands.set(command?.catagory, command);
}
/** Loading Listeners */
const listeners = require('./events');
listeners.execute(client);
/** Command Handler */
client.on('message', async (message: Message) => {
	/** Checking Prefix */
	if (
		!message.content.startsWith(`<@${client.user.id}>`) &&
		!settings.prefix &&
		!'pixelbot'
	)
		return;
	if (message.guild.me.hasPermission('SEND_MESSAGES')) return;
	/** Command defining */
	command = message.content;
	if (command.startsWith(settings.prefix)) {
		command = command.replace(settings.prefix, '');
	} else if (command.startsWith(`<@${client.user.id}>`)) {
		command = command.replace(`<@${client.user.id}>`, '');
	}
	/** Args */
	let args = message.content.replace(command, '');

	/** Removing Prefix */
	if (args.startsWith(settings.prefix)) {
		args = args.replace(settings.prefix, '');
	} else if (args.startsWith(`<@${client.user.id}>`)) {
		args = args.replace(`<@${client.user.id}>`, '');
	}
	/** Trying to get members */
	try {
		usr = await GetUser(args, message);
		memb = await Member(args, message);
	} catch (e) {}

	try {
		const cmd = (await commands.get('config')) || null;
		console.log(command);

		(cmd as CommandInterface).execute(
			message,
			client,
			args,
			command,
			usr || null,
			memb || null
		);
	} catch (e) {
		console.error;
	}
});
/** Logging in */
client.login(credentials.token);

/* --------------------------------
User Code
-------------------------------- */
async function GetUser(args: string, msg: Message) {
	let user: User;
	try {
		const stuff = args.split(' ')[0];
		user = await client.users.fetch(stuff);
		if (!user) {
			user = msg.guild.members.cache.find((member) => {
				return (
					member.displayName.toLowerCase().includes(stuff) ||
					member.user.tag.toLowerCase().includes(stuff)
				);
			}).user;
			if (!user) {
				user = msg.guild.members.cache.get(stuff).user;
			}
			if (!user) {
				if (stuff == '^' && msg.channel.messages.cache.size >= 4) {
					user = (msg.channel.messages.cache
						.filter((m) => m.id < msg.id && m.author.id != msg.author.id)
						.last().member as GuildMember).user;
				}
			}
		}
		return user || null;
	} catch (err) {
		return null;
	}
}
/* --------------------------------
Member Code
-------------------------------- */
async function Member(args: string, msg: Message) {
	let member: GuildMember;
	try {
		const stuff = args.split(' ')[0];
		if (!member) {
			member = msg.guild.members.cache.find((member) => {
				return (
					member.displayName.toLowerCase().includes(stuff) ||
					member.user.tag.toLowerCase().includes(stuff)
				);
			});
			if (!member) {
				member = msg.guild.members.cache.get(stuff);
			}
			if (!member) {
				if (stuff == '^' && msg.channel.messages.cache.size >= 4) {
					member = msg.channel.messages.cache
						.filter((m) => m.id < msg.id && m.author.id != msg.author.id)
						.last().member as GuildMember;
				}
			}
		}
		if (member && member.id) member = await msg.guild.members.fetch(member.id);
		return member || null;
	} catch (e) {
		return null;
	}
}
/* --------------------------------
Command Interface
-------------------------------- */
interface CommandInterface {
	execute(
		message: Message,
		client: Client,
		args: string,
		command: string,
		usr: User,
		memb: GuildMember
	);
}
