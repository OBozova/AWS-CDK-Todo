const AWS = require('aws-sdk');
const S3 = new AWS.S3();
const randomBytes = require('crypto').randomBytes;

const ddb = new AWS.DynamoDB.DocumentClient();
const bucketName = process.env.BUCKET;

/* 
This code uses callbacks to handle asynchronous function responses.
It currently demonstrates using an async-await pattern. 
AWS supports both the async-await and promises patterns.
For more information, see the following: 
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises
https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/calling-services-asynchronously.html
https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-handler.html 
*/
exports.main = async function(event, context, callback) {
  try {
    var method = event.httpMethod;
    // Get name, if present
    var todoName = event.path.startsWith('/') ? event.path.substring(1) : event.path;

    if (method === "GET") {
      
      // GET / to get the names of all todos
      if (event.path === "/todos/") {
        const dbResponse = await ddb.scan({
          TableName: 'Todos',
          Select: "ALL_ATTRIBUTES"
        }).promise();
  
        return {
          statusCode: 200,
          headers: {},
          body: JSON.stringify(dbResponse.Items)
        };
      }

      if (todoName) {
        const todoId = todoName.substring(5);
        const todos = await ddb.scan({
            TableName: 'Todos',
            FilterExpression: "#id = :reqId",
            ExpressionAttributeNames: {
                "#id": "TodoId",
            },
            ExpressionAttributeValues: {
                ":reqId": todoId,
            }
        }).promise();

        if(todos.Count === 0){
          return {
            statusCode: 200,
            headers: {},
            body: "There is no todo with id : "+todoId
          };
        }

        return {
          statusCode: 200,
          headers: {},
          body: JSON.stringify(todos.Items[0])
        };
      }
    }

    if (method === "PUT") {
      // POST /name
      // Return error if we do not have a name
      
      const todoId = toUrlString(randomBytes(16));

      const todoString = JSON.parse(event.body).todoString;
      
      await addTodo(todoId, todoString).then(() => {
          callback(null, {
              statusCode: 201,
              body: JSON.stringify({
                  TodoId: todoId,
                  TodoString: todoString,
              }),
              headers: {
                  'Access-Control-Allow-Origin': '*',
              },
          });
      }).catch((err) => {
          console.error(err);

          errorResponse(err.message, context.awsRequestId, callback)
      });
    

      return {
        statusCode: 201,
        headers: {},
        body: JSON.stringify({
          TodoId: todoId,
          TodoString: todoString,
        })
      };
    }

    if (method === "DELETE") {
      // DELETE /name
      // Return an error if we do not have a name
      const todoId = todoName.substring(5);
      const todos = await ddb.scan({
          TableName: 'Todos',
          FilterExpression: "#id = :reqId",
          ExpressionAttributeNames: {
              "#id": "TodoId",
          },
          ExpressionAttributeValues: {
               ":reqId": todoId,
          }
      }).promise();
      
      if(todos.Count === 0){
        return {
          statusCode: 200,
          headers: {},
          body: "There is no todo with id : "+todoId
        };
      }
      
      await ddb.delete({
          TableName: 'Todos',
          Key:{"TodoId":todoId}
      }).promise();

      return {
        statusCode: 200,
        headers: {},
        body: "Successfully deleted todo " + todoName
      };
    }

    // We got something besides a GET, POST, or DELETE
    return {
      statusCode: 400,
      headers: {},
      body: "We only accept GET, POST, and DELETE, not " + method
    };
  } catch(error) {
    var body = error.stack || JSON.stringify(error, null, 2);
    return {
      statusCode: 400,
      headers: {},
      body: body
    }
  }
}


function addTodo(todoId, todoString) {
  return ddb.put({
      TableName: 'Todos',
      Item: {
          TodoId: todoId,
          TodoString: todoString,
      },
  }).promise();
}

function toUrlString(buffer) {
  return buffer.toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
}

function errorResponse(errorMessage, awsRequestId, callback) {
callback(null, {
  statusCode: 500,
  body: JSON.stringify({
    Error: errorMessage,
    Reference: awsRequestId,
  }),
  headers: {
    'Access-Control-Allow-Origin': '*',
  },
});
}