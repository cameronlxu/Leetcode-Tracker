exports.buildResponse = (statusCode, body) => {
    return {
        statusCode: statusCode,
        headers: {
            'Content-Type': 'application/json',
            "Access-Control-Allow-Headers" : "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
            "Access-Control-Allow-Methods" : "OPTIONS,POST,PUT,GET,DELETE,PATCH",
            "Access-Control-Allow-Credentials" : true,
            "Access-Control-Allow-Origin" : "*",
            "X-Requested-With" : "*"
        },
        body: JSON.stringify(body)
    }
}

exports.scanDynamo = async (dynamodb, scanParams, itemArray) => {
    try {
      const dynamoData = await dynamodb.scan(scanParams).promise();
      itemArray = itemArray.concat(dynamoData.Items);
      if (dynamoData.LastEvaluatedKey) {
        scanParams.ExclusiveStartkey = dynamoData.LastEvaluatedKey;
        return await exports.scanDynamo(scanParams, itemArray);
      }
      return itemArray;
    } catch(error) {
      console.error('Scan Error, could not scan! : ', error);
    }
}

/**
 * httpsGetAsync() & getDifficulty() to get the difficulty of a problem given the link
 */
// Source: https://stackoverflow.com/questions/247483/http-get-request-in-javascript 
function httpGetAsync(URL) {
    var XMLHttpRequest = require('xhr2');
    return new Promise((resolve, reject) => {
        let xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function() { 
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
                resolve(xmlHttp.responseText);
            }
        }
        xmlHttp.open("GET", URL, true); // true for asynchronous 
        xmlHttp.send(null); 
    });
}

exports.getDifficulty = async (URL) => {
    const api_link = 'https://leetcode.com/api/problems/all/';
    
    // Get text from link
    const text = await httpGetAsync(api_link);
    
    // Convert string into a JSON object
    const leetcodeInfo = JSON.parse(text);
    
    // Look at all problems (held within the stat_status_pairs subobject)
    const problems = leetcodeInfo.stat_status_pairs;
    
    // Filter for the problem inputted
    const result = problems.filter(problem => {
        // question__title_slug is the end of the leetcode link 
        //      e.g. "two-sum"
        return problem.stat.question__title_slug === URL.split('/')[4]; // End of Link
    })[0];
    
    // Determine the difficulty in words and return
    const difficultyLevel = result.difficulty.level;
    let difficulty;
    
    switch(difficultyLevel) {
        case 1:
            difficulty = "Easy";
            break;
        case 2:
            difficulty = "Medium";
            break;
        case 3:
            difficulty = "Hard";
            break;
    }
    
    return difficulty;
}

exports.getLatestProblem = (problems) => {
    // If no problems completed yet return problem with empty nest emojis
    if (problems.length === 0) {
        return {
            'link': '🪹',
            'date': '🪹',
            'difficulty': '🪹',
        }
    }

    // Start comparing from the zero-th index. Dates can only compare to other dates
    let latestDate = problems[0].date;
    problems.map((problem) => {
        if (problem.date > latestDate) {
            latestDate = problem.date;
        }
    });

    // Since we know the latest date in the problems array, find the problem matching the time
    const latestProblem = problems.find(problem => {
        return problem.date === latestDate.toLocaleString()
    });

    return latestProblem;
}

exports.getDefaultLink = (URL) => {
    /**
     * The purpose of this function is to get the "default link". I didn't want to find the regex for it. Ex:
     * 
     * Default:     https://leetcode.com/problems/two-sum/
     * Not Default: https://leetcode.com/problems/two-sum/discussion/
     */

    /**
     * splitBySlash looks like:
     * 
     * [
        'https:',
        '',
        'leetcode.com',
        'problems',
        'two-sum',
        'discussion',   // Assuming there is an extra tag
        ''
     * ]
     */
    const splitBySlash = URL.split('/');

    // Combined together: https: + "//" + leetcode.com + "/" + problems + "/" + two-sum + "/"
    let defaultUrl = splitBySlash[0] + "//" + splitBySlash[2] + "/" + splitBySlash[3] + "/" + splitBySlash[4] + "/";

    return defaultUrl;
}

exports.privateKey = "nottherealprivatekey";