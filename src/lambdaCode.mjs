// ES6+ example
import {
  ApiGatewayManagementApiClient,
  GetConnectionCommand,
  PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";

const ENDPOINT =
  "https://d7c4vq4n4m.execute-api.us-east-1.amazonaws.com/production/";
const client = new ApiGatewayManagementApiClient({ endpoint: ENDPOINT });
const names = {};

const sendToOne = async (id, body) => {
  try {
    const input = {
      ConnectionId: id,
      Data: Buffer.from(JSON.stringify(body)),
    };
    const command = new PostToConnectionCommand(input);
    await client.send(command);
  } catch (err) {
    console.error(err);
  }
};

const sendToAll = async (ids, body) => {
  const all = ids.map((i) => sendToOne(i, body));
  return Promise.all(all);
};

export const handler = async (event, context) => {
  console.log("event", event);
  console.log("context", context);
  if (event.connectionId) {
    const connectionId = event.connectionId;
    const routeKey = event.routeKey;
    let body = {};
    if (event.body) {
      body = event.body;
    }

    switch (routeKey) {
      case "$connect":
        break;
      case "$disconnect":
        console.log("---- DISCONNECT ----");
        await sendToAll(Object.keys(names), {
          systemMessage: `${names[connectionId]} has left the chat`,
        });
        delete names[connectionId];
        await sendToAll(Object.keys(names), { members: Object.values(names) });
        break;
      case "$default":
        break;
      case "setName":
        console.log("---SETTING NAME----");
        names[connectionId] = body.name;
        await sendToAll(Object.keys(names), { members: Object.values(names) });
        await sendToAll(Object.keys(names), {
          systemMessage: `${names[connectionId]} has joined the chat`,
        });
        break;
      case "sendPublic":
        console.log("entered sendPublic");
        await sendToAll(Object.keys(names), {
          publicMessage: `${names[connectionId]}: ${body.message}`,
        });
        break;
      case "sendPrivate":
        console.log("entered sendPrivate");
        const to = Object.keys(names).find((key) => names[key] === body.to);
        await sendToOne(to, {
          privateMessage: `${names[connectionId]}: ${body.message}`,
        });
        break;

      default:
      //code
    }
  }

  // TODO implement
  const response = {
    statusCode: 200,
    body: JSON.stringify("Hello from Lambda!"),
  };
  return response;
};
