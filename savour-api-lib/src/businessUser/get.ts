import businessUserDao from 'src/dao/businessUserDao';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { success, failure } from "../common/response-lib";

export default async function main(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const id: string = event.pathParameters.id;
  
  return businessUserDao.get(id).then((businessUser) => {
    if (businessUser) {
      return success(businessUser);
    } else {
      return failure({ error: "Business user not found." });
    }
  }).catch((e) => {
    console.log(e);
    return failure({ error: "An error occured getting the user account"});
  });
}