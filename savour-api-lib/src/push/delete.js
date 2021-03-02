import * as dynamoDb from "../common/dynamodb-lib";
import { success, failure } from "../common/response-lib";

export default async function main(event, context) {
  const params = {
    TableName: process.env.pushMessageTable,
		// 'Key' defines the partition key and sort key of the item to be retrieved
    // - 'unique_id': identifying one message
    Key: {
      unique_id: event.pathParameters.uid,
    }
  };

  try {
    await dynamoDb.call("delete", params);
    return success({ status: true });
  } catch (e) {
    console.log(e);
    return failure({ status: false });
  }
}