import * as dynamoDb from "../common/dynamodb-lib";
import { success, failure } from "../common/response-lib";

export default async function main(event, context) {
  const data = JSON.parse(event.body);
	if (Object.keys(data).length > 0){
		var updateExp = 'SET ';
		var expAttVals = {};

		//grab data to update
		Object.entries(data).forEach(([key, value]) => {
			if (key === "businesses") {
				// updateExp  = updateExp + ' ' + key + ' = list_append(' + key + ', :i),';
				updateExp = `${updateExp} ${key} = list_append(${key}, :${key}),`;
				expAttVals[`:${key}`] = [value];
			} else {
				updateExp  = updateExp + ' ' + key + ' = :' + key + ',';
				expAttVals[':' +key] = value;
			}
			console.log(updateExp);
			console.log(expAttVals);
		});
		//Remove trailing ,
		updateExp = updateExp.substring(0, updateExp.length - 1);
		const params = {
			TableName: process.env.businessUserTable,
			// 'Key' defines the partition key and sort key of the item to be retrieved
			// - 'uid': User ID to identify a user by Cognito
			Key: {
				uid: event.pathParameters.uid,
			},
			// 'UpdateExpression' defines the attributes to be updated
			// 'ExpressionAttributeValues' defines the value in the update expression
			UpdateExpression: updateExp,
			ExpressionAttributeValues: expAttVals,
			// 'ReturnValues' specifies if and how to return the item's attributes,
			// where ALL_NEW returns all attributes of the item after the update; you
			// can inspect 'result' below to see how it works with different settings
			ReturnValues: "ALL_NEW"
		};

		try {
			await dynamoDb.call("update", params);
			return success({ status: true });
		} catch (e) {
			console.log(e);
			return failure({ status: false });
		}
	}else{
		//nothing to update. return false
		return success({ status: false });
	}
}