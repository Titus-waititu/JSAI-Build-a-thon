import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import { createSseStream } from "@azure/core-sse";
import 'dotenv/config';
import fs from "fs";
import path from "path";

const token = process.env["GITHUB_TOKEN"];
const endpoint = "https://models.github.ai/inference";
const modelName = "microsoft/Phi-4-multimodal-instruct";

const imagePath = path.join(process.cwd(), "contoso_layout_sketch.jpg");
const imageBuffer = fs.readFileSync(imagePath);
const imageBase64 = imageBuffer.toString("base64");

export async function main() {

  const client = ModelClient(
    endpoint,
    new AzureKeyCredential(token),
  );

  const response = await client.path("/chat/completions").post({
    body: {
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "write html and css code for a web page based on the following hand-drawn sketch. output html and css from model"
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      model: modelName,
      stream: true,
      model_extras: { stream_options: { include_usage: true } }
    }
  }).asNodeStream();

  if (!response.body) {
    throw new Error("The response is undefined");
  }

  const sseStream = createSseStream(response.body);

  var usage = null;
  for await (const event of sseStream) {
    if (event.data === "[DONE]") {
      break;
    }
    var parsedData = JSON.parse(event.data);
    for (const choice of parsedData.choices) {
      process.stdout.write(choice.delta?.content ?? ``);
    }
    if (parsedData.usage) {
      usage = parsedData.usage
    }
  }
  process.stdout.write("\n");
  if (usage) {
    for (var k in usage) {
      process.stdout.write(`${k} = ${usage[k]}\n`);
    }
  }
}

main().catch((err) => {
  console.error("The sample encountered an error:", err);
});