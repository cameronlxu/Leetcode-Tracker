# Leetcode Tracker

Leetcode Tracker is Discord Bot that assists users with keeping track of their leetcode problem completion progress. 

## 🎈 Overview

The main focus is allowing the users to input the link of the completed problem and the bot will store that information in a database which can be viewed at a later time. With this, users will to see their current progress - whether a statistical overview or a full view list of all the problems he/she has completed separated by category & chronological order. Lastly to "game-ify" their experience, there is a ranking system that compares against the Total/Easy/Medium/Hard problem count completed amongst all users. 

On the technical side, the discord bot uses JavaScript on the front end to interact with the user and the code is hosted on [glitch](https://glitch.com). The backend is entirely made up of [Amazon Web Services](https://aws.amazon.com), more specifically [API Gateway](https://aws.amazon.com/api-gateway/?nc2=type_a), [Lambda](https://aws.amazon.com/lambda/?nc2=type_a), & [DynamoDB](https://aws.amazon.com/dynamodb/?nc2=type_a). The bot makes API calls to either create, update, or retrieve data hosted in the NoSQL database. 

### Current Requirements
- [x] User can create an account one time
- [x] User can input the link of the newly completed problem which will add to their problems completed
- [x] User can retrieve their data in a statistical overview or problem list layout
- [x] User can view the rankings (problem count) based on a difficulty: Easy, Medium, Hard, Total

### Future TODO List
- [ ] /help command to show the user what commands are available to them
- [ ] User can start/end a session that other users can join, which will also have it's own ranking while the session is active
    - Problems completed here will also contribute to the user's overall progress
- [ ] Improve the bot response UI 
    - [ ] Instead of replying to user slash commands, respond with an [embed](https://discordjs.guide/popular-topics/embeds.html#embed-preview)
    - [ ] Consolidate the /ranking command to where a user has to pick a difficulty of what ranking to look at

----------

# 🎯 Usage

## /create
- This is to only be ran once before a user starts using the other commands

<img width="643" alt="image" src="https://user-images.githubusercontent.com/12592121/212460433-d15a3cec-f651-4cf0-9bf7-9d1ed4bccae7.png">

- If the command is ran a second time from the same user, they will be told that their account already exists

<img width="422" alt="image" src="https://user-images.githubusercontent.com/12592121/212460461-8cb4ddfc-7340-42a8-8cc7-10b0e431754d.png">

- Upon successful create, DynamoDB creates a new row with blank user data 

## /complete
- Takes in an argument of a link to the problem

<img width="247" alt="image" src="https://user-images.githubusercontent.com/12592121/212460491-49b93e1d-135f-499a-bb01-1479df9ed5b9.png">

- The user can input any part of the problem they wish: Description, Discussion, Solutions, Submissions. The "default" link (no extra path) will be updated to the database and reflected on the bot's response message

<img width="757" alt="image" src="https://user-images.githubusercontent.com/12592121/212460527-c9312b14-1a0f-4cd3-8373-5cac32e11b9a.png">

## /progress
![progress command selection](https://user-images.githubusercontent.com/12592121/212461783-d41f80e6-3324-4be3-81a1-dbe9e84c0893.png)

- An empty nest emoji indicates that there is no data available for that given attribute (🪹)
### Stats
- The user will be returned their overall statistics while using the Leetcode Tracker bot. The data showcase is:
    - Total Count of Problems Completed
    - Easy/Medium/Hard Count of Problems Completed
    - The latest problem completed --> Link, Difficulty, Date, Days since completion

<img width="579" alt="image" src="https://user-images.githubusercontent.com/12592121/212461096-f47027f3-0aba-4325-adb3-ac99d1a43564.png">

### List
- The user will be returned a list of their completed problems separated by difficulty

<img width="679" alt="image" src="https://user-images.githubusercontent.com/12592121/212461124-0b0c38ae-bf11-486f-b512-0f9e733dae19.png">


## /ranking
- The user can select which difficulty to see the rankings: Total, Easy, Medium, or Hard
- Based on each user's difficulty count, the bot will showcase the top 3 completed problems count for the difficulty selected

![ranking command selection](https://user-images.githubusercontent.com/12592121/212461597-a6a837db-6b31-4d80-849a-15f5ade01d97.png)
![bot response for rankings](https://user-images.githubusercontent.com/12592121/212461591-47fcf41d-44e1-4858-83ee-d05388c01347.png)

----------

## 🖥️ High Level Codeflow Architecture 

![Discord Bot](https://user-images.githubusercontent.com/12592121/212503951-d2765288-feed-47e8-85e1-ec5eefc07f4b.png)

## Installation

Installation is currently unavailable. Leetcode Tracker only exists in my own private server as I am using a free service (glitch) to host it. 

## Support

If there are any quesetions about this bot, please email me at: cameron1998@gmail.com!
