# Leetcode Tracker

Leetcode Tracker is Discord Bot that assists users with keeping track of their leetcode problem completion progress. 

## 🎈 Overview

The main focus is allowing the users to input the link of the completed problem and the bot will store that information in a database which can be viewed at a later time. With this, users will to see their current progress - whether a statistical overview or a full view list of all the problems he/she has completed separated by category & chronological order. Lastly to "game-ify" their experience, there is a ranking system that compares against the Total/Easy/Medium/Hard problem count completed amongst all users. 

On the technical side, the discord bot uses JavaScript on the front end to interact with the user and the code is hosted on [Oracle Cloud Infrastructure Compute Service](https://docs.oracle.com/en-us/iaas/Content/Compute/Concepts/computeoverview.htm) through a Virtual Machine. The process of the bot is kept alive using a daemon process manager: [pm2](https://pm2.keymetrics.io). The backend is entirely made up of [Amazon Web Services](https://aws.amazon.com), more specifically [API Gateway](https://aws.amazon.com/api-gateway/?nc2=type_a), [Lambda](https://aws.amazon.com/lambda/?nc2=type_a), & [DynamoDB](https://aws.amazon.com/dynamodb/?nc2=type_a). The bot makes API calls to either create, update, or retrieve data stored in the NoSQL database. 

### Current Requirements
- [x] `/create` to only create an account (once)
- [x] `/complete` to input the link of the newly completed problem which will add to their problems completed
- [x] `/progress` to retrieve their data in a statistical overview or problem list layout
- [x] `/ranking` to view the rankings (problem count) based on a difficulty chosen: Easy, Medium, Hard, Total
- [x] `/help` to see what the Leetcode Tracker bot is along with its functionalities
- [x] Responses are in an [embed](https://discordjs.guide/popular-topics/embeds.html#embed-preview) format

### Future TODO List
- [ ] User can start/end a session that other users can join, which will also have it's own ranking while the session is active
    - Problems completed here will also contribute to the user's overall progress
- [ ] `/progress list` response message will have a multi-page embed
    - Once users complete many problems, the response message will eventually become too long. This will combat that problem by maintaining a certain embed size
    - An example can be seen [here on a stackoverflow question](https://stackoverflow.com/questions/60691780/how-do-you-make-embed-pages-in-discord-js)

----------

# 🎯 Usage

## /create
- This is to only be ran once before a user starts using the other commands

<img width="643" alt="image" src="https://user-images.githubusercontent.com/12592121/212460433-d15a3cec-f651-4cf0-9bf7-9d1ed4bccae7.png">

- If the command is ran a second time from the same user, they will be told that their account already exists

![/create user already exists](https://user-images.githubusercontent.com/12592121/221260268-a15b1b22-ba1c-4a9e-bb8d-692f13c76c81.png)

- Upon successful create, DynamoDB creates a new row with blank user data 

## /complete
- Takes in an argument of a link to the problem

<img width="247" alt="image" src="https://user-images.githubusercontent.com/12592121/212460491-49b93e1d-135f-499a-bb01-1479df9ed5b9.png">

- The user can input any part of the problem they wish: Description, Discussion, Solutions, Submissions. The "default" link (no extra path) will be updated to the database and reflected on the bot's response message

![/complete response message](https://user-images.githubusercontent.com/12592121/221260410-6d0f7493-4eeb-407a-8986-e1133ab05080.png)

## /progress
![progress command selection](https://user-images.githubusercontent.com/12592121/212461783-d41f80e6-3324-4be3-81a1-dbe9e84c0893.png)

- An empty nest emoji indicates that there is no data available for that given attribute (🪹)
### Stats
- The user will be returned their overall statistics while using the Leetcode Tracker bot. The data showcase is:
    - Total Count of Problems Completed
    - Easy/Medium/Hard Count of Problems Completed
    - The latest problem completed --> Link, Difficulty, Date, Days since completion

![/progress stats response](https://user-images.githubusercontent.com/12592121/221269563-a36d8c81-9e1c-49df-9cb0-efe67992698a.png)

### List
- The user will be returned a list of their completed problems separated by difficulty

![/prorgress list response](https://user-images.githubusercontent.com/12592121/221260581-51be5001-f865-4aa6-a8e6-d182c928fafe.png)


## /ranking
- The user can select which difficulty to see the rankings: Total, Easy, Medium, or Hard
- Based on each user's difficulty count, the bot will showcase the top 3 completed problems count for the difficulty selected

![ranking command selection](https://user-images.githubusercontent.com/12592121/221268511-77dcb824-443e-4bab-8f64-82d9d5ce9ebb.png)
![bot response for rankings](https://user-images.githubusercontent.com/12592121/221268651-bcb99992-0394-43ac-8b7d-3bfd2a1266dd.png)



## /help
- If a user wants to learn more information about the Leetcode Tracker bot or about the available commands, this command is for them

![/help command response](https://user-images.githubusercontent.com/12592121/221268730-899dc9e9-dbbf-4d97-bace-e230d1039a1c.png)


----------

## 🖥️ Technical Architecture 

![Discord Bot Architecture](https://user-images.githubusercontent.com/12592121/221297569-e8a2c583-639b-41a3-aa14-766476ec3084.png)



## Installation

Installation is currently unavailable.

## Support

If there are any quesetions about this bot, please email me at: cameron1998@gmail.com!
