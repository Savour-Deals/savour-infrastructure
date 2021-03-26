import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import SubscriberUser from "src/model/subscriberUser";
import * as dynamoDb from "../common/dynamodb-lib";
import { success, failure } from "../common/response-lib";

export default async function main(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
	const user: SubscriberUser = JSON.parse(event.body);
	const id = event.pathParameters.mobileNumber;
	const update: dynamoDb.UpdateExpression = dynamoDb.getUpdateExpression(user);
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
		return dynamoDb.call("update", params).then(() => {
				return success(user);
		}).catch((e) => {
			console.log(e);
			return failure({ error: "An error occured while updating the user." });
		})
	} else {
		return failure({ error: "User update was empty."});
	}
}