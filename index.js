const { Client, Discord } = require("discord.js");
const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const chalk = require("chalk");
const client = new Client({intents: 32767,});

let webhookEnabled = true; // Global variable to control webhook status

client.on("messageCreate", async (messageCreate) => {
  if (messageCreate.author.bot) return;
  if (!webhookEnabled) return; // Exit if webhook is disabled
  let msg = messageCreate.content;

  let emojis = msg.match(/(?<=:)([^:\s]+)(?=:)/g)
  if (!emojis) return;
  emojis.forEach(m => {
    let emoji = client.emojis.cache.find(x => x.name === m)
    if (!emoji) return;
    let temp = emoji.toString()
    if (new RegExp(temp, "g").test(msg)) msg = msg.replace(new RegExp(temp, "g"), emoji.toString())
    else msg = msg.replace(new RegExp(":" + m + ":", "g"), emoji.toString());
  })

  if (msg === messageCreate.content) return;

  let webhook = await messageCreate.channel.fetchWebhooks();
  let number = randomNumber(1, 2);
  webhook = webhook.find(x => x.name === "clone" + number);

  if (!webhook) {
    webhook = await messageCreate.channel.createWebhook(`clone` + number, {
      avatar: client.user.displayAvatarURL({ dynamic: true })
    });
  }

  await webhook.edit({
    name: messageCreate.member.nickname ? messageCreate.member.nickname : messageCreate.author.username,
    avatar: messageCreate.author.displayAvatarURL({ dynamic: true })
  })

  messageCreate.delete().catch(err => { })
  webhook.send(msg).catch(err => { })

  await webhook.edit({
    name: `clone` + number,
    avatar: client.user.displayAvatarURL({ dynamic: true })
  })


})
function randomNumber(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
} 
// Slash command definition
const commands = [
  new SlashCommandBuilder()
    .setName('webhook')
    .setDescription('Control webhook status')
    .addStringOption(option =>
      option.setName('status')
        .setDescription('Turn webhook on or off')
        .setRequired(true)
        .addChoices(
          { name: 'on', value: 'on' },
          { name: 'off', value: 'off' }
        )
    )
].map(command => command.toJSON());

// Handle slash commands
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === 'webhook') {
    // Check if user has Administrator permissions or is a bot
    const member = interaction.member;
    const isBot = interaction.user.bot;
    const hasAdminPerms = member && member.permissions.has('ADMINISTRATOR');
    
    if (!hasAdminPerms && !isBot) {
      await interaction.reply({
        content: '❌ **Access Denied** - You need Administrator permissions or be a bot to use this command',
        ephemeral: true
      });
      return;
    }

    const status = interaction.options.getString('status');
    
    if (status === 'on') {
      webhookEnabled = true;
      await interaction.reply({
        content: '✅ Webhook is now **ON** - Messages will be processed',
        ephemeral: true
      });
    } else if (status === 'off') {
      webhookEnabled = false;
      await interaction.reply({
        content: '❌ Webhook is now **OFF** - Messages will not be processed',
        ephemeral: true
      });
    }
  }
});

client.on("ready", async () => {
  console.log(
    chalk.blue("Hey brah ") + chalk.cyan(`Your Bot Started`)
  );
  client.user.setActivity("With Sestro");
  
  // Register slash commands
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  
  try {
    console.log(chalk.yellow('Started refreshing application (/) commands.'));
    
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands },
    );
    
    console.log(chalk.green('Successfully reloaded application (/) commands.'));
  } catch (error) {
    console.error(chalk.red('Error registering slash commands:'), error);
  }
});
const TOKEN = ""Here;

client.login(TOKEN);
