import { getRPSChoices } from './game.js';
import { capitalize, DiscordRequest } from './utils.js';

export async function HasGuildCommands(appId, guildId, commands) {
  if (guildId === '' || appId === '') return;

  commands.forEach((c) => HasGuildCommand(appId, guildId, c));
}

// Checks for a command
async function HasGuildCommand(appId, guildId, command) {
  // API endpoint to get and post guild commands
  const endpoint = `applications/${appId}/guilds/${guildId}/commands`;

  try {
    const res = await DiscordRequest(endpoint, { method: 'GET' });
    const data = await res.json();

    if (data) {
      const installedNames = data.map((c) => c['name']);
      // This is just matching on the name, so it's not good for updates
      if (!installedNames.includes(command['name'])) {
        console.log(`Installing "${command['name']}"`);
        InstallGuildCommand(appId, guildId, command);
      } else {
        console.log(`"${command['name']}" command already installed`);
      }
    }
  } catch (err) {
    console.error(err);
  }
}

// Installs a command
export async function InstallGuildCommand(appId, guildId, command) {
  // API endpoint to get and post guild commands
  const endpoint = `applications/${appId}/guilds/${guildId}/commands`;
  // install command
  try {
    await DiscordRequest(endpoint, { method: 'POST', body: command });
  } catch (err) {
    console.error(err);
  }
}

// Get the game choices from game.js
function createCommandChoices() {
  const choices = getRPSChoices();
  const commandChoices = [];

  for (let choice of choices) {
    commandChoices.push({
      name: capitalize(choice),
      value: choice.toLowerCase(),
    });
  }

  return commandChoices;
}

// Simple test command
export const TEST_COMMAND = {
  name: 'test',
  description: 'Basic guild command',
  type: 1,
};

// Command containing options
export const CHALLENGE_COMMAND = {
  name: 'challenge',
  description: 'Challenge to a match of rock paper scissors',
  options: [
    {
      type: 3,
      name: 'object',
      description: 'Pick your object',
      required: true,
      choices: createCommandChoices(),
    },
  ],
  type: 1,
};

export const CREATE_COMMAND = {
  name: 'create',
  description: 'Create an account for Leetcode Tracker',
  type: 1
}

export const COMPLETE_COMMAND = {
  name: 'complete',
  description: 'Completed a leetcode problem? Insert the problem link to submit your completion',
  options: [
    {
      type: 3,
      name: 'link',
      description: 'Link to Leetcode Problem',
      required: true
    },
  ],
  type: 1
}

export const PROGRESS_COMMAND = {
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
}

export const RANKING_COMMAND = {
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