import * as dynamoDb from "../common/dynamodb-lib";
import { success, failure } from "../common/response-lib";

export default async function main(event) {
  const data = JSON.parse(event.body);
	const id = event.pathParameters.mobileNumber;
	const update = dynamoDb.getUpdateExpression(data);
	if (update) {
		const params = {
			TableName: process.env.subscriberUserTable,
			Key: {
				mobileNumber: id,
			},
			UpdateExpression: update.expression,
			ExpressionAttributeValues: update.values,
			ReturnValues: "ALL_NEW"
		};
		return dynamoDb.call("update", params).then((response) => success(response.Item))
		.catch((e) => {
			console.log(e);
			return failure({ error: "An error occured updating the subscriber account"});
		});
	} else {
		//nothing to update. return false
		return failure({ error: "Subscriber account update was empty"});
	}
}