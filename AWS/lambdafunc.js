const AWS = require("aws-sdk");
var XMLHttpRequest = require('xhr2');
AWS.config.update({ 
    region: "us-west-1"
});

const DYANMODB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = "leetcode_tracker";
const CREATE_PATH = '/create';
const COMPLETE_PATH = '/complete';
const PROGRESS_PATH = '/progress';
const RANKING_PATH = '/ranking';
const DELETE_PATH = '/delete';
const HEALTH_PATH = '/health';

exports.handler = async function(event) {
    console.log('Request event: ', event);
    let response;

    switch(true) {
        case event.httpMethod === 'GET' && event.path === HEALTH_PATH:
            response = buildResponse(200);
            break;
        case event.httpMethod === 'POST' && event.path === CREATE_PATH:
            response = await createUser(event.queryStringParameters.userId, event.queryStringParameters.username);
            break;
        case event.httpMethod === 'PATCH' && event.path === COMPLETE_PATH:
            response = await updateUser(JSON.parse(event.body));
            break;
        case event.httpMethod === 'GET' && event.path === PROGRESS_PATH:
            response = await getProgress(event.queryStringParameters.userId);
            break;
        case event.httpMethod === 'GET' && event.path === RANKING_PATH:
            response = await getRanking(event.queryStringParameters.difficulty);
            break;
        case event.httpMethod === 'DELETE' && event.path === DELETE_PATH:
            response = await deleteUserData(event.queryStringParameters.userId);
            break;
    }

    return response;
}

async function createUser(userId, username) {
    let newUser = {
        userId: userId,
        username: username,
        problems: [],
        EasyCount: 0,
        MediumCount: 0,
        HardCount: 0,
        TotalCount: 0
    }

    // Add to DynamoDB
    const params = {
        TableName: TABLE_NAME,
        Item: newUser,
        Key: {
            'userId': userId,
        },
        ConditionExpression: `attribute_not_exists(userId)`
    }
    return await DYANMODB.put(params).promise().then(() => {
        const body = {
            Operation: 'SAVE',
            Message: 'SUCCESS',
            Item: newUser
        }
        return buildResponse(200, body);
    }, (error) => {
        // If the user already exists return the 400 Bad Request error
        if (error.name === 'ConditionalCheckFailedException') {
            return buildResponse(400, { error: 'User Already Exists' });
        } else {
            console.error("CREATEUSER: Could not create user! : \n", error);
        }
    });
}

async function updateUser(requestBody) {
    const userId = requestBody['userId'];
    const URL = getDefaultProblem(requestBody['link']);

    /**
     * Setup problemObj with userId, URL, & difficulty
     */
    let problemObj = {
        link: URL,
        date: new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" }),
        difficulty: await getDifficulty(URL)
    }
    
    /**
     * Prepare what to update in DynamoDB & send the update
     */
    const difficultyCount = `${problemObj.difficulty}Count`;
    let params = {
        TableName: TABLE_NAME,
        Key: {
            'userId': userId,
        },
        UpdateExpression: `SET #problems = list_append(#problems, :val),
            #${difficultyCount} = ${difficultyCount} + :inc,
            #TotalCount = TotalCount + :inc
        `,
        ExpressionAttributeNames: {
            "#problems": "problems",
            "#TotalCount": "TotalCount",
        },
        ExpressionAttributeValues: {
            ':val': [problemObj],    // list_append() concatenates two lists
            ':inc': 1
        },
        ReturnValues: 'UPDATED_NEW'
    }

    // Dynamically create the ExpressionAttributeName for the difficulty count
    //      Note: Unused expressions are not allowed
    params.ExpressionAttributeNames[`#${difficultyCount}`] = `${difficultyCount}`;
    
    return await DYANMODB.update(params).promise().then((response) => {
        console.log("Update Information: ", response);
        const body = {
            Operation: 'UPDATE',
            Message: 'SUCCESS',
            UpdatedAttributes: response
        }
        return buildResponse(200, body);
    }, (error) => {
        console.error("PATCHERROR: Could not patch user! : ", error);
    });
}

async function getProgress(userId) {
    const params = {
        ExpressionAttributeNames: {
            "#theUser": "userId"
        },
        ExpressionAttributeValues: {
            ":userId": userId
        }, 
        KeyConditionExpression: "#theUser = :userId", 
        TableName: TABLE_NAME
    }; 

    return await DYANMODB.query(params).promise().then((response) => {
        console.log(`getProgress successful for userId: ${userId}`, JSON.stringify(response, null, 2));

        /**
         * Example Success Response
         * 
         * {
                "userId": "12345",
                "username": "cameronlxu"
                "problems": [
                    {
                        "link": "https://leetcode.com/problems/two-sum/",
                        "date": "1/6/2023",
                        "difficulty": "Easy"
                    },
                    {
                        "link": "https://leetcode.com/problems/add-two-numbers/",
                        "date": "1/6/2023",
                        "difficulty": "Medium"
                    }
                ],
                "EasyCount": 1,
                "MediumCount": 1,
                "HardCount": 0,
                "TotalCount": 2
            }
         */
        const userData = response.Items[0];     // index 0 to return the JSON format, not the array
        const problems = userData.problems;

        const progress = {
            "total": userData.TotalCount,
            "easy": userData.EasyCount,
            "medium": userData.MediumCount,
            "hard": userData.HardCount,
            "latestProblem": getLatestProblem(problems),
            "problems": problems    // Send all problems in the event the user requests for it (/progress list)
        }

        return buildResponse(200, progress);
    }, (error) => {
        console.error("QUERYERROR: Could not query user progress! : ", error);
    });
}

async function getRanking(difficulty) {
    const category = `${difficulty}Count`; // EasyCount, MediumCount, HardCount, TotalCount
    const params = {
        TableName: TABLE_NAME
    }
    
    const top3 = await scanDynamo(params, []).then((allUsers) => {
        return allUsers.sort((a, b) => b[category] - a[category]);  // Sort in Descending Order
    });

    const ranking = {
        "1": top3[0],
        "2": top3[1] || null,
        "3": top3[2] || null
    }
  
    return buildResponse(200, ranking);
}

function buildResponse(statusCode, body) {
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

async function scanDynamo(scanParams, itemArray) {
    try {
      const dynamoData = await DYANMODB.scan(scanParams).promise();
      itemArray = itemArray.concat(dynamoData.Items);
      if (dynamoData.LastEvaluatedKey) {
        scanParams.ExclusiveStartkey = dynamoData.LastEvaluatedKey;
        return await scanDynamo(scanParams, itemArray);
      }
      return itemArray;
    } catch(error) {
      console.error('Scan Error, could not scan! : ', error);
    }
}

/**
 * Functions to get the difficulty of a problem given the link
 */

// Source: https://stackoverflow.com/questions/247483/http-get-request-in-javascript 
function httpGetAsync(URL) {
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

async function getDifficulty(URL) {
    const text = await httpGetAsync(URL);

    // Isolate the value for Difficulty: Easy/Medium/Hard
    const findDifficulty = text.split('"difficulty"')[1];

    // Remove the rest of the json data
    const isolateDifficulty = findDifficulty.split(',')[0];
    
    // Remove the double quotations & semicolon with regex
    const difficulty = isolateDifficulty.replace(/['":]+/g, '');

    // Return the difficulty
    return difficulty;
}

function getLatestProblem(problems) {
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

function getDefaultProblem(url) {
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
    const splitBySlash = url.split('/');

    // Combined together: https: + "//" + leetcode.com + "/" + problems + "/" + two-sum + "/"
    let defaultUrl = splitBySlash[0] + "//" + splitBySlash[2] + "/" + splitBySlash[3] + "/" + splitBySlash[4] + "/";

    return defaultUrl;
}