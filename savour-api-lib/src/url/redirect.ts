import redirectDao from "src/dao/redirectDao";

interface RedirectInput {
  token: string,
}

interface RedirectResponse {
  content: string,
  destination_url?: string,
}

export default async function main(event: RedirectInput): Promise<RedirectResponse>  {
  return redirectDao.get(event.token)
  .then((result) => {
    if (result) {
      const url = result.destinationUrl;
      const content = "<html><body>Moved: <a href=\"" + url + "\">" + url + "</a></body></html>"
      return { 
        content: content,
        destination_url: url
      };
    } else {
      const content = "<html><body><h1>404: Not Found</h1></body></html>"
      return { 
        content: content
      }
    }
  }).catch((e) => {
    console.log(e);
    const content = "<html><body><h1>404: Not Found!</h1></body></html>"
    return { 
      content: content
    }
  });
}