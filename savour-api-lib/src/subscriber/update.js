import * as dynamoDb from "../common/dynamodb-lib";
import { success, failure } from "../common/response-lib";

export default async function main(event, context) {
  const data = JSON.parse(event.body);
	if (Object.keys(data).length > 0){
		var updateExp = 'SET ';
		var expAttVals = {};

		//grab data to update
		Object.entries(data).forEach(([key, value]) => {
			updateExp  = updateExp + ' '+ key + ' = :' + key + ',';
			expAttVals[':' +key] = value;
		});
		//Remove trailing ,
		updateExp = updateExp.substring(0, updateExp.length - 1);
		const params = {
			TableName: process.env.subscriberUserTable,
			// 'Key' defines the partition key and sort key of the item to be retrieved
    // - 'mobile_number': Mobile number identifying user
			Key: {
				mobile_number: event.pathParameters.mobile_number,
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
			return failure({ status: false });
		}
	}else {
		console.log(e);
		//nothing to update. return false
		return success({ status: false });
	}
}