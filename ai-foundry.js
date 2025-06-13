import ModelClient from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import dotenv from "dotenv";

dotenv.config();

const client = new ModelClient(
  process.env.AZURE_INFERENCE_SDK_ENDPOINT,
  new AzureKeyCredential(process.env.AZURE_INFERENCE_SDK_KEY)
);

var messages = [
  { role: "system", content: "You are a helpful assistant." },
  { role: "user", content: "What are 3 things to see in seattle?" },
];

async function main() {
  const response = await client.path("/chat/completions").post({
    body: {
      messages: messages,
      max_tokens: 4096,
      temperature: 1,
      top_p: 1,
      model: "gpt-4o",
    },
  });

  if (
    response.body &&
    response.body.choices &&
    response.body.choices.length > 0 &&
    response.body.choices[0].message &&
    response.body.choices[0].message.content
  ) {
    console.log(response.body.choices[0].message.content);
  } else {
    console.error(
      "No choices returned from the model. Full response:",
      response.body
    );
  }
}

main().catch((err) => {
  console.error("The sample encountered an error:", err);
});
