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
      .then((response) => response.json())
      .then(async (res) => {
        /**
         * Response will show all of the users problems, get the last index of the problems array
         * to retrieve the difficulty
         * 
         * Something to keep track of: I've seen this fail on a "cold start". Which technically
         * shouldn't exist because I've been locally starting it up/closing it & it works then.
         * Could it be from the parsing of the response? Worst case I can follow getDifficulty()
         * from AWS/utils
         * 
         * Visual of /complete response:
         * -----------------------------
         *  "UpdatedAttributes": {
              "Attributes": {
                "MediumCount": 10,
                "TotalCount": 11,
                "problems": [
                    {
                        "date": "1/17/2023, 10:35:37 AM",
                        "difficulty": "Easy",
                        "link": "https://leetcode.com/problems/length-of-last-word/"
                    },
                    ...
                ]
              }
            }
         */
        const problemCompleted = res.UpdatedAttributes.Attributes.problems.at(-1); 
        const difficulty = problemCompleted.difficulty;
        
        const title = `✅  Problem Link Submitted. Great job ${username}!`;
        const description = `❓  **Problem Completed**: <${problem_url}>\n\n` + 
                            `📚  **Difficulty**: ${difficulty}\n\n` + 
                            `📅  **Date**: ${new Date().toLocaleString()} PST`; 

        const completeEmbed = {
          "title": title,
          "description": description,
          "color": 0x239d38
        }

        const message = await interaction.reply({
          embeds: [completeEmbed],
          fetchReply: true
        });

        message.react('🔥');
        message.react('💯');
        message.react('✅');
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
        let progressEmbed;
        if (option === 'stats') {
          progressEmbed = getProgressStats(user, userData);
        } else if (option === 'list') {
          progressEmbed = getProgressList(user, userData.problems);
        }

        return interaction.reply({
          embeds: progressEmbed
        });
      });
  }

  if (commandName === 'ranking') {
    const option = interaction.options.getString('difficulty');
    
    fetch(`${process.env.API_LINK}/ranking?difficulty=${option}`)
    .then((response) => response.json())
    .then((rankData) => {
      return interaction.reply({
        embeds: [
          {
            title: `__***${option.toUpperCase()}* Leaderboard**__`,
            description: getRanking(option, rankData),
            color: 0xd96363,
            timestamp: new Date().toISOString()
          }
        ]
      });
    });
  }
});

client.login(process.env.DISCORD_TOKEN);