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
        name: 'difficulty',
        description: 'categorized by difficulty or the total count',
        choices: [
          {
            name: 'Total',
            value: 'Total'
          },
          {
            name: 'Easy',
            value: 'Easy'
          },
          {
            name: 'Medium',
            value: 'Medium'
          },
          {
            name: 'Hard',
            value: 'Hard'
          },
        ],
        required: true,
        type: 3
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