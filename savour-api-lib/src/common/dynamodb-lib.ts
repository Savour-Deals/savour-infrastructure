import { AWSError, DynamoDB } from 'aws-sdk';
import { DeleteItemInput, GetItemInput, PutItemInput, QueryInput, UpdateItemInput } from 'aws-sdk/clients/dynamodb';
import { PromiseResult } from 'aws-sdk/lib/request';
const dynamoDb = new DynamoDB.DocumentClient();

function put(params: PutItemInput): Promise<PromiseResult<DynamoDB.DocumentClient.PutItemOutput, AWSError>> {
	return dynamoDb.put(params).promise();
}

function del(params: DeleteItemInput): Promise<PromiseResult<DynamoDB.DocumentClient.DeleteItemOutput, AWSError>> {
	return dynamoDb.delete(params).promise();
}

function update(params: UpdateItemInput): Promise<PromiseResult<DynamoDB.DocumentClient.UpdateItemOutput, AWSError>> {
	return dynamoDb.update(params).promise();
}

function get(params: GetItemInput): Promise<PromiseResult<DynamoDB.DocumentClient.GetItemOutput, AWSError>> {
	return dynamoDb.get(params).promise();
}

function query(params: QueryInput): Promise<PromiseResult<DynamoDB.DocumentClient.QueryOutput, AWSError>> {
	return dynamoDb.query(params).promise();
}

export function getUpdateExpression(key: string, item) {
	delete item[key]; //remove key property. This should not be included in update attributes
  if (Object.keys(item).length > 0) {
    let updateExp = 'SET ';
		const expAttVals = {};

		//grab data to update
		Object.entries(item).forEach(([key, value]) => {
			updateExp  = updateExp + ' ' + key + ' = :' + key + ',';
			expAttVals[':' +key] = value;
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

export default {
	put: put,
	delete: del,
	update: update,
	get: get,
	query: query
}