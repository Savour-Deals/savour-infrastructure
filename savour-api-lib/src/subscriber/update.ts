import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import SubscriberUser from "src/model/subscriberUser";
import subscriberUserDao from 'src/dao/subscriberUserDao';
import { success, failure } from "../common/response-lib";

export default async function main(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
	const user: SubscriberUser = JSON.parse(event.body);
	const id = event.pathParameters.mobileNumber;
	return subscriberUserDao.update(id, user).then(() => {
			return success(user);
	}).catch((e) => {
		console.log(e);
		return failure({ error: "An error occured while updating the user." });
	});
}