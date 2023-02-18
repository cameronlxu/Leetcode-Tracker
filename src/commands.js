import 'dotenv/config';
import { REST, Routes } from 'discord.js';

// Command Type #s: https://discord-api-types.dev/api/discord-api-types-v10/enum/ApplicationCommandOptionType
const commands = [
  // CREATE
  {
    name: 'create',
    description: 'Create an account for Leetcode Tracker',
  },
  // COMPLETE
  {
    name: 'complete',
    description: 'Completed a leetcode problem? Insert the problem link to submit your completion',
    options: [
      {
        name: 'link',
        description: 'Link to Leetcode Problem',
        type: 3,
        required: true
      },
    ],
  },
  // PROGRESS
  {
    name: 'progress',
    description: 'Get your leetcode progress so far',
    options: [
      {
        name: 'stats',
        description: 'View your overall leetcode-tracker stats',
        type: 1
      },
      {
        name: 'list',
        description: 'Show the list of problems you have completed in chronological order',
        type: 1
      }
    ]
  },
  // RANKING
  {
    name: 'ranking',
    description: 'Rankings amongst leetcode tracker users based on a certain difficulty category',
    options: [
      {
        name: 'total',
        description: 'Total problems completed ranking',
        type: 1
      },
      {
        name: 'easy',
        description: 'Easy problems completed ranking',
        type: 1
      },
      {
        name: 'medium',
        description: 'Medium problems completed ranking',
        type: 1
      },
      {
        name: 'hard',
        description: 'Hard problems completed ranking',
        type: 1
      }
    ]
  }
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(Routes.applicationCommands(process.env.APP_ID), { body: commands });

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();