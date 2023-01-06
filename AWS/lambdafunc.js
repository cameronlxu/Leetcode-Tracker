const AWS = require("aws-sdk");
var XMLHttpRequest = require('xhr2');
AWS.config.update({ 
    region: "us-west-1"
});

const DYANMODB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = "leetcode_tracker";
const COMPLETE_PATH = '/complete';
const PROGRESS_PATH = '/progress';
const RANKING_PATH = '/ranking';
const DELETE_PATH = '/delete';
const HEALTH_PATH = '/health';

let problemObj = {
    userId: '',
    problem: {
        link: '',
        date: new Date().toLocaleDateString(),
        difficulty: ''
    }
}

exports.handler = async function(event) {
    console.log('Request event: ', event);
    let response;

    switch(true) {
        case event.httpMethod === 'GET' && event.path === HEALTH_PATH:
            response = buildResponse(200);
            break;
        case event.httpMethod === 'POST' && event.path === COMPLETE_PATH:
            resposne = await createUser(JSON.parse(event.body));
            break;
        case event.httpMethod === 'PATCH' && event.path === COMPLETE_PATH:
            resposne = await updateUser(JSON.parse(event.body));
            break;
        case event.httpMethod === 'GET' && event.path === PROGRESS_PATH:
            resposne = await getProgress(JSON.parse(event.body));
            break;
        case event.httpMethod === 'GET' && event.path === RANKING_PATH:
            resposne = await getRanking(JSON.parse(event.body));
            break;
        case event.httpMethod === 'DELETE' && event.path === DELETE_PATH:
            resposne = await deleteUserData(JSON.parse(event.body)['userId']);
            break;
    }

    return response;
}

async function createUser(requestBody) {
    const userId = requestBody['userId'];
    const URL = requestBody['link'];

    /**
     * Setup the new user object with the completed problem inside the 'problems' array
     */
    // 1. Create the newUser object to add to DyanmoDB
    let newUser = {
        userId: userId,
        problems: []
    }

    // 2. Create the problemObj to append to 'problems'
    problemObj = {
        link: URL,
        date: new Date().toLocaleTimeString(),
        difficulty: ''
    }

    getDifficulty(URL).then((difficulty) => {
        problemObj.difficulty = difficulty;
        newUser.problems.push(problemObj);
    });

    /**
     * Add to DynamoDB
     */
    const params = {
        TableName: TABLE_NAME,
        Item: newUser
    }
    return await DYANMODB.put(params).promise().then(() => {
        const body = {
            Operation: 'SAVE',
            Message: 'SUCCESS',
            Item: requestBody
        }
        return buildResponse(200, body);
    }, (error) => {
        console.error("CREATEUSER: Could not create user! : \n", error);
    });
}

async function updateUser(requestBody) {
    const userId = requestBody['userId'];
    const URL = requestBody['link'];

    /**
     * Setup problemObj with userId, URL, & difficulty
     */
    problemObj.userId = userId;
    problemObj.problem.link = URL;

    getDifficulty(URL).then((difficulty) => {
        problemObj.problem.difficulty = difficulty;
    });
    
    /**
     * Prepare what to update in DynamoDB & send the update
     */
    params = {
        TableName: TABLE_NAME,
        Key: {
            'userId': userId,
        },
        UpdateExpression: "SET #problems = list_append(#problems, :val)",
        ExpressionAttributeNames: {
            "#problems": "problems"
        },
        ExpressionAttributeValues: {
            ':val': problemObj['problem']
        },
        ReturnValues: 'UPDATED_NEW'
    }
    
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