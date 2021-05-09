import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import businessDao from 'src/dao/businessDao';
import { success, failure } from "../common/response-lib";

export default async function main(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const id: string = event.pathParameters.id;
  
  return businessDao.get(id).then((business) => {
    if (business) {
      return success(business);
    } else {
      return failure({ error: "Business not found." });
    }
  }).catch((e) => {
    console.log(e);
    return failure({ error: "An error occured while getting the business." });
  });
}