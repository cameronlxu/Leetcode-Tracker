import 'dotenv/config';
import fetch from 'node-fetch';
import { Client, GatewayIntentBits } from 'discord.js';
import { getProgressStats, getProgressList, getRanking } from './utils.js';

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

    let completeEmbed = {
      "title": `✅  Problem Link Submitted. Great job ${username}!`,
      "description": '',
      "color": 0x239d38
    }

    interaction.deferReply();

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

        completeEmbed.description = `❓  **Problem Completed**: <${problem_url}>\n\n` + 
                                    `📚  **Difficulty**: ${difficulty}\n\n` +
                                    `📅  **Date**: ${new Date().toLocaleString()} PST`;

        const message = await interaction.editReply({ embeds: [completeEmbed], fetchReply: true });
        message.react('✅')
          .then(() => message.react('🔥'))
          .then(() => message.react('💯'));
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

  if (commandName === 'help') {
    const githubLink = 'https://github.com/cameronlxu/Leetcode-Tracker';
    const description = "WTF is this? 🫣\n\n" + 
                        `Leetcode Tracker is Discord Bot that assists users with keeping track of their leetcode problem completion progress. The github repository can be found here: <${githubLink}>\n\n` + 
                        "That being said, let us take a look at the available commands:";

    const createDesc = "Used once to create your account in the database. If somehow used again it will not recreate your account so don't worry. 🫡";
    const completeDesc =  "Submit a completed problem. Accepts a leetcode link as an argument. The link must at least have the name in it. For example:\n" +
                          "- https://leetcode.com/problems/two-sum/solutions/\n" + 
                          "- https://leetcode.com/problems/two-sum/submissions/768104833/\n\n" +
                          'Having the "/solutions" or "/submissions/..." does not matter as the bot will parse through the given link argument.';

    const progressDesc =  "Take a look at your progress so far! There are two subcommands:\n" +
                          "- Stats\n" +
                          "- List\n\n" + 
                          "Stats displays the counts of problems done categorized by difficulty along with the total count. It will also show you the latest problem you've done and how many days it's been since then.\n\nList displays the problems you have completed separated by difficulty. The links of the problems will be shown along with the date completed (using the /complete command).";

    const rankingDesc = "Take a look where you stand in comparison to other users using this bot.\n\n" + 
                        "When using this you will be presented with a choice of which difficulty leaderboard to view.";

    return interaction.reply({
      embeds: [
        {
          "title": 'Leetcode Tracker - Help',
          "description": description,
          "color": 0xffffff,
          "fields": [
            // Line break
            {
              name: '\u200B',
              value: '',
            },
            {
              "name": `➡️ __**/create**__`,
              "value": createDesc
            },
            {
              "name": `➡️ __**/complete**__`,
              "value": completeDesc
            },
            {
              "name": `➡️ __**/progress**__`,
              "value": progressDesc
            },
            {
              "name": `➡️ __**/ranking**__`,
              "value": rankingDesc
            }
          ]
        }
      ],
      ephemeral: true
    })
  }
});

client.login(process.env.DISCORD_TOKEN);