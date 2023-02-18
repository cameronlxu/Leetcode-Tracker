import 'dotenv/config';
import fetch from 'node-fetch';
import { Client, GatewayIntentBits } from 'discord.js';
import { capitalize, getProgressStats, getProgressList, getRanking } from './utils.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { user, commandName } = interaction;
  const userId = user.id;
  const username = user.username;

  if (commandName === 'create') {
    fetch(`${process.env.API_LINK}/create?userId=${userId}&username=${username}`, { method: 'POST' })
      .then((response) => response.json())
      .then((createRes) => {
        const successMsg = `✅ Account Successfuly Created for <@${userId}>. Time to leetcode! 👨‍💻👩‍💻`;
        const userExistsMsg = `❌ You already have an account <@${userId}>!`;

        // If user already exists send the user exists msg, else show success msg
        const content = createRes.error === 'User Already Exists'
          ? userExistsMsg
          : successMsg
        ;

        return interaction.reply({
          content: content,
          ephemeral: content === userExistsMsg ? true : false // If user exists, make reply ephemeral
        })
      }
    );
  }

  if (commandName === 'complete') {
    const problem_url = interaction.options.get('link').value;

    const problemObj = {
      userId: userId,
      link: problem_url
    }

    fetch(`${process.env.API_LINK}/complete`, {
      method: 'PATCH',
      body: JSON.stringify(problemObj)
    })
      .then(() => {
        const content = `✅  Problem Link Submitted. Great job <@${userId}>!\n\n` + 
                        `❓  Problem Completed: <${problem_url}>\n\n` + 
                        `📅  Date: ${new Date().toLocaleString()}`
        ;

        return interaction.reply({
          content: content
        })
      })
      .catch((err) => {
        console.log('/COMPLETE error: ', err);
      });
  }

  if (commandName === 'progress') {
    const option = interaction.options.getSubcommand();
    
    fetch(`${process.env.API_LINK}/progress?userId=${userId}`)
      .then((response) => response.json())
      .then((userData) => {          
        /**
         * Depending on the subcommand selection provide different content
         * - /progress stats
         * - /progress list 
         */ 
        let content;
        if (option === 'stats') {
          content = getProgressStats(userId, userData);
        } else if (option === 'list') {
          content = getProgressList(userId, userData.problems);
        }

        return interaction.reply({
          content: content
        });
      });
  }

  if (commandName === 'ranking') {
    const option = interaction.options.getSubcommand();

    // Capitlize the first letter
    const capitalizedOption = capitalize(option);
    
    fetch(`${process.env.API_LINK}/ranking?difficulty=${capitalizedOption}`)
    .then((response) => response.json())
    .then((rankData) => {
      return interaction.reply({
        embeds: [
          {
            title: `__***${option.toUpperCase()}* Leaderboard (${new Date().toLocaleString()})**__`,
            description: getRanking(capitalizedOption, rankData),
            color: 0x2ac331
          }
        ]
      });
    });
  }
});

client.login(process.env.DISCORD_TOKEN);