import 'dotenv/config';
import express from 'express';
import { InteractionType, InteractionResponseType } from 'discord-interactions';
import { 
  VerifyDiscordRequest, 
  capitalize, 
  getProgressStats, 
  getProgressList, 
  getRanking 
} from './utils.js';
import {
  CREATE_COMMAND,
  COMPLETE_COMMAND,
  PROGRESS_COMMAND,
  RANKING_COMMAND,
  HasGuildCommands,
} from './commands.js';

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
// Parse request body and verifies incoming requests using discord-interactions package
app.use(express.json({ verify: VerifyDiscordRequest(process.env.PUBLIC_KEY) }));

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 */
app.post('/interactions', async function (req, res) {
  // Interaction type and data
  const { type, id, data } = req.body;

  /**
   * Handle slash command requests
   * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
   */
  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;

    if (name === 'create' && id) {
      const userId = req.body.member.user.id;
      const username = req.body.member.user.username;

      fetch(`https://uaf0v7vjt8.execute-api.us-west-1.amazonaws.com/prod/create?userId=${userId}&username=${username}`, { method: 'POST' })
        .then((response) => response.json())
        .then((createRes) => {
          const successMsg = `✅ Account Successfuly Created for <@${userId}>. Time to leetcode! 👨‍💻👩‍💻`;
          const userExistsMsg = `❌ You already have an account <@${userId}>!`;

          // If user already exists send the user exists msg, else show success msg
          const content = createRes.error === 'User Already Exists'
            ? userExistsMsg
            : successMsg
          ;

          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: content
            },
          })
        });
    }

    if (name === 'complete' && id) {
      const userId = req.body.member.user.id;
      const username = req.body.member.user.username;
      const problem_url = req.body.data.options[0].value;

      const problemObj = {
        userId: userId,
        link: problem_url
      }

      fetch(`https://uaf0v7vjt8.execute-api.us-west-1.amazonaws.com/prod/complete`, {
        method: 'PATCH',
        body: JSON.stringify(problemObj)
      })
        .then(() => {
          const content = `✅  Problem Link Submitted. Great job <@${userId}>!\n\n` + 
                          `❓  Problem Completed: <${problem_url}>\n\n` + 
                          `📅  Date: ${new Date().toLocaleString()}`
          ;

          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: content    
            },
          })
        })
        .catch((err) => {
          console.log('/COMPLETE error: ', err);
        });
    }

    if (name === 'progress') {
      const userId = req.body.member.user.id;
      const option = data.options[0].name;
      
      fetch(`https://uaf0v7vjt8.execute-api.us-west-1.amazonaws.com/prod/progress?userId=${userId}`)
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

          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: content
            },
          });
        })
    }

    if (name === 'ranking') {
      const option = data.options[0].name;

      // Capitlize the first letter
      const capitalizedOption = capitalize(option);
      
      fetch(`https://uaf0v7vjt8.execute-api.us-west-1.amazonaws.com/prod/ranking?difficulty=${capitalizedOption}`)
      .then((response) => response.json())
      .then((rankData) => {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: getRanking(capitalizedOption, rankData)
          },
        });
      });
    }
  }
});

app.listen(PORT, () => {
  console.log('Listening on port', PORT);

  // Check if guild commands from commands.js are installed (if not, install them)
  HasGuildCommands(process.env.APP_ID, process.env.GUILD_ID, [
    CREATE_COMMAND,
    COMPLETE_COMMAND,
    PROGRESS_COMMAND,
    RANKING_COMMAND
  ]);
});
