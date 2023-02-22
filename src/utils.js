import 'dotenv/config';

export function getProgressStats(user, data) {
  /**
   * Find the difference in days from the latest problem to today
   * 
   * Source: https://www.geeksforgeeks.org/how-to-calculate-the-number-of-days-between-two-dates-in-javascript/
   */
  // The date looks like 1/12/23, 12:00:01PM
  let diff_in_days = 0;

  // No need to find the latest problem if no problems have been completed. Else find latest problem
  if (data.problems.length !== 0) {
    const latestDate = new Date(data.latestProblem.date.split(',')[0]);

    // This is pretty ugly but it works to be able to use getTime(). It looks like --> new Date("1/12/23")
    const currentDate = new Date(new Date().toLocaleDateString());

    // Get differences in time/days
    const diff_in_time = currentDate.getTime() - latestDate.getTime();
    diff_in_days = diff_in_time / (1000 * 3600 * 24);
  }

  //Compile data to produce the content to show the user
  const title = `Progress Stats for: ${user.username}`; 

  const problemsCompletedField = {
    "name": "__**Problems Completed**__",
    "value":  `📚 Total:  ${data.total}\n`
            + `📗 Easy:   ${data.easy}\n`
            + `📒 Medium: ${data.medium}\n`
            + `📕 Hard:   ${data.hard}`,
    "inline": true
  };

  const latestProblemField = {
    "name": "__**Latest Problem**__",
    "value":  `🔗 Link: <${data.latestProblem.link}>\n`
            + `⭐ Difficulty: ${data.latestProblem.difficulty}\n`
            + `🗓️ Date: ${data.latestProblem.date}\n`
            + `🚀 Days since completion: ${diff_in_days} days`,
    "inline": true
  };

  const statsEmbed = [
    {
      "color": 0x2a79c3,
      "fields": [problemsCompletedField, latestProblemField],
      "thumbnail": {
        "url": user.avatarURL(),
        "height": 0,
        "width": 0
      },
      "timestamp": new Date().toISOString(),
      "title": title,
    }
  ];

  return statsEmbed;
}

export function getProgressList(user, problems) {
  let easyProblems = [];
  let mediumProblems = [];
  let hardProblems = [];

  // Separate Completed Problems by Difficulty
  problems.map((problem) => {
    switch (problem.difficulty) {
      case 'Easy':
        easyProblems.push(problem);
        break;
      case 'Medium':
        mediumProblems.push(problem);
        break;
      case 'Hard':
        hardProblems.push(problem);
        break;
    }
  });

  // Reusable function for the Easy/Medium/Hard problem lists
  const printProblems = (problems) => {
    if (problems.length === 0) {
      return '🪹';  // Empty Nest, I thought it looked pretty cool
    }

    // Wrapping links in <{link}> removes the embed for the link (aka the preview)
      // problem.date --> "1/21/23, 4:06:51 PM"
    return `${problems.map((problem) => `✔️ ${problem.date.split(',')[0]} - <${problem.link}>\n`).join('')}` // Ex. 1/21/23 - {link}
  }

  const description = `__**List of Problems Completed**__\n`
                + "📗 ***Easy***:\n"
                + printProblems(easyProblems)
                + "\n📒 ***Medium***:\n"
                + printProblems(mediumProblems)
                + "\n📕 ***Hard***:\n"
                + printProblems(hardProblems);

  const listEmbed = [
    {
      "color": 0x2a79c3,
      "description": description,
      "thumbnail": {
        "url": user.avatarURL(),
        "height": 0,
        "width": 0
      },
      "timestamp": new Date().toISOString(),
      "title": `Progress List for: ${user.username}`,
    }
  ];
 
  return listEmbed;
}

export function getRanking(option, rankData) {
  const printRank = (rank) => {
    if (rankData[rank] == null) {
      return '🪹 : 🪹';
    }

    return `**${rankData[rank].username}** : ${rankData[rank][option + "Count"]}\n`
  }

  const content = `🥇 ${printRank('1')}`
                + `🥈 ${printRank('2')}`
                + `🥉 ${printRank('3')}`
  ;
  
  return content;
}