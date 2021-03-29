import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { success, failure } from "../common/response-lib";
import pushDao from "src/dao/pushDao";

export default async function main(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const id: string = event.pathParameters.id;
  
  return pushDao.get(id)
  .then((result) => {
    if (result) {
      return success(result);
    } else {
      return failure({ error: "Record not found" });
    }
  }).catch((e) => {
    console.log(e);
    return failure({ error: "An error occured getting the record" });
  });
}