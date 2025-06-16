import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import "dotenv/config";
import fs from "fs";
import sharp from "sharp";

const token = process.env["GITHUB_TOKEN"];
const endpoint = "https://models.github.ai/inference";
const modelName = "openai/gpt-4o";

export async function main() {
  // Resize the image to a smaller size and lower quality to fit token limit
  const imagePath = "contoso_layout_sketch (1).jpg";
  const resizedBuffer = await sharp(imagePath)
    .resize({ width: 256 }) // smaller width
    .jpeg({ quality: 50 }) // lower quality
    .toBuffer();
  const imageBase64 = resizedBuffer.toString("base64");

  const client = ModelClient(endpoint, new AzureKeyCredential(token));

  const response = await client.path("/chat/completions").post({
    body: {
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        {
          role: "user",
          content:
            "write html and css code for a web page based on the following hand-drawn sketch",
          images: [
            {
              type: "image/jpeg",
              data: imageBase64,
            },
          ],
        },
      ],
      temperature: 1.0,
      top_p: 1.0,
      max_tokens: 1000,
      model: modelName,
    },
  });

  if (isUnexpected(response)) {
    throw response.body.error;
  }

  console.log(response.body.choices[0].message.content);
}

main().catch((err) => {
  console.error("The sample encountered an error:", err);
});
