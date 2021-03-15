import { DynamoDB } from 'aws-sdk';
const dynamoDb = new DynamoDB.DocumentClient();

export function call(action, params) {
  return dynamoDb[action](params).promise();
}

export function getUpdateExpression(item, appendAttributes = []) {
  if (Object.keys(item).length > 0) {
    let updateExp = 'SET ';
		const expAttVals = {};

		//grab data to update
		Object.entries(item).forEach(([key, value]) => {
      if (appendAttributes.includes(key)) {
				updateExp = `${updateExp} ${key} = list_append(${key}, :${key}),`;
				expAttVals[`:${key}`] = [value];
			} else {
				updateExp  = updateExp + ' ' + key + ' = :' + key + ',';
				expAttVals[':' +key] = value;
			}
		});
		//Remove trailing ,
		updateExp = updateExp.substring(0, updateExp.length - 1);

    return {
      expression: updateExp, 
      values: expAttVals
    }
  }
  return undefined;
}