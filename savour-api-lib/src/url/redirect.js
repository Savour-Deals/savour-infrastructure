import * as dynamoDb from "../common/dynamodb-lib";

export default async function main(event) {
	const params = {
    TableName: process.env.redirectTable,
    // 'Key' defines the partition key and sort key of the item to be retrieved
    // - 'unique_id': id identifying short -> long url mapping
    Key: {
      unique_id: event.token,
    }
  };

  try {
    const result = await dynamoDb.call("get", params);
    if (result.Item) {
      const url = result.Item.destination_url;
      const content = "<html><body>Moved: <a href=\"" + url + "\">" + url + "</a></body></html>"
      return {"destination_url": url, "content": content}
    } else {
      const content = "<html><body><h1>404: Not Found</h1></body></html>"
      return {"content": content}
    }
  } catch (e) {
    console.log(e);
    const content = "<html><body><h1>404: Not Found!</h1></body></html>"
    return {"content": content}
  }
}