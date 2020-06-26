const cdk = require('@aws-cdk/core');
const todo_service = require('../lib/todo_service');
class TodoStack extends cdk.Stack {
  /**
   *
   * @param {cdk.Construct} scope
   * @param {string} id
   * @param {cdk.StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    new todo_service.TodoService(this, 'Todos');
  }
}

module.exports = { TodoStack }
