const core = require("@aws-cdk/core");
const apigateway = require("@aws-cdk/aws-apigateway");
const lambda = require("@aws-cdk/aws-lambda");
const s3 = require("@aws-cdk/aws-s3");

class TodoService extends core.Construct {
  constructor(scope, id) {
    super(scope, id);

    const bucket = new s3.Bucket(this, "TodoStore");

    const handler = new lambda.Function(this, "TodoHandler", {
      runtime: lambda.Runtime.NODEJS_10_X, // So we can use async in todo.js
      code: lambda.Code.asset("resources"),
      handler: "todos.main",
      environment: {
        BUCKET: bucket.bucketName
      }
    });

    bucket.grantReadWrite(handler); // was: handler.role);

    const api = new apigateway.RestApi(this, "todos-api", {
      restApiName: "Todo Service",
      description: "This service serves todos."
    });

    // const getTodosIntegration = new apigateway.LambdaIntegration(handler, {
    //   requestTemplates: { "application/json": '{ "statusCode": "200" }' }
    // });

    // api.root.addMethod("GET", getTodosIntegration); // GET /

    const todos = api.root.addResource("todos");

    const todo = api.root.addResource("todo");

    const todoWithId = todo.addResource("{id}");

    const addTodo = todo.addResource("new");

    // Add new widget to bucket with: POST /{id}
    const postTodoIntegration = new apigateway.LambdaIntegration(handler);

    // Get a specific widget from bucket with: GET /{id}
    const getTodoIntegration = new apigateway.LambdaIntegration(handler);

    const getTodosIntegration = new apigateway.LambdaIntegration(handler);

    // Remove a specific widget from the bucket with: DELETE /{id}
    const deleteTodoIntegration = new apigateway.LambdaIntegration(handler);

    todos.addMethod("GET", getTodosIntegration); // GET /{id}
    addTodo.addMethod("PUT", postTodoIntegration); // POST /{id}
    todoWithId.addMethod("GET", getTodoIntegration); // GET /{id}
    todoWithId.addMethod("DELETE", deleteTodoIntegration); // DELETE /{id}
  }
}

module.exports = { TodoService }