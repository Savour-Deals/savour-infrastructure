import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { success, failure } from "../common/response-lib";
import subscriberUserDao from 'src/dao/subscriberUserDao';

export default async function main(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const id: string = event.pathParameters.mobileNumber;
  
  return subscriberUserDao.delete(id).then((result) => success(result)).catch((e) => {
    console.log(e);
    return failure({ error: "An error occured while deleting the subscriberUser." });
  });
}