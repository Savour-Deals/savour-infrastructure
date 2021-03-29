import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { success, failure } from "../common/response-lib";
import subscriberUserDao from 'src/dao/subscriberUserDao';

export default async function main(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const id: string = event.pathParameters.mobileNumber;
  return subscriberUserDao.get(id)
  .then((user) => {
    if (user) {
      return success(user);
    } else {
      return failure({ error: "User not found" });
    }
  }).catch((e) => {
    console.log(e);
    return failure({ error: "An error occured getting the user" });
  });
}