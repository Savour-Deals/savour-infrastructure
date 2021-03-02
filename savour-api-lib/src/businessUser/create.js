import * as dynamoDb from "../common/dynamodb-lib";
import { success, failure } from "../common/response-lib";

export default async function main(event, context) {
  console.log(event);
  console.log(context);
  const data = JSON.parse(event.body);
  const params = {
    TableName: process.env.businessUserTable,
    Item: data
  };
  console.log(params);
  try {
    await dynamoDb.call("put", params);
    return success(params.Item);
  } catch (e) {
    console.log(e);
    return failure({ status: false });
  }
}