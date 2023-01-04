const AWS = require("aws-sdk");
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

exports.handler = async function(event) {
    console.log('Request event: ', event);
    let response;

    switch(true) {
        case event.httpMethod === 'GET' && event.path === HEALTH_PATH:
            response = buildResponse(200);
            break;
        // TODO: Complete these functions
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
    const params = {
        TableName: TABLE_NAME,
        Item: requestBody
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