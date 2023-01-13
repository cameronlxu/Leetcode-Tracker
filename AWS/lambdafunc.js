const AWS = require("aws-sdk");
AWS.config.update({ 
    region: "us-west-1"
});
const { buildResponse, scanDynamo, getDifficulty, getLatestProblem, getDefaultLink } = require('./utils.js');

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
    const URL = getDefaultLink(requestBody['link']);

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
    
    const top3 = await scanDynamo(DYANMODB, params, []).then((allUsers) => {
        return allUsers.sort((a, b) => b[category] - a[category]);  // Sort in Descending Order
    });

    const ranking = {
        "1": top3[0],
        "2": top3[1] || null,
        "3": top3[2] || null
    }
  
    return buildResponse(200, ranking);
}