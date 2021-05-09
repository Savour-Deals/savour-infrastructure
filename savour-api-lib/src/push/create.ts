import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { success, failure } from "../common/response-lib";
import PushItem from 'src/model/push';
import pushDao from "src/dao/pushDao";

export default async function main(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log(event);
  const item: PushItem = JSON.parse(event.body);

  return pushDao.create(item)
  .then((result) => success(result))
  .catch((e) => {
    console.log(e);
    return failure({ error: "An error occured creating the record"});
  });
}