import express from 'express';
import ModelClient from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import { createTextEvent, createDoneEvent, verifyAndParseRequest } from "@copilot-extensions/preview-sdk";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json()); 

app.post('/agent', async (req, res) => {
    console.log(`Received [${req.method}] to [${req.url}]`);
    // gets the github token to authenticate with the model
    const token = req.headers["x-github-token"];

    const { messages } = req.body;

    const ingredients = messages[messages.length - 1].content;

    console.log(`Ingredients: ${ingredients}`);

    // pasted below code from github models azure gpt40 chat code
    const client = new ModelClient(
        "https://models.github.ai/inference",
        new AzureKeyCredential(token)
    );

    // give it specific chef instructions
    const response = await client.path("/chat/completions").post({
        body: {
            messages: [
                { role: "system", content: "As a chef, you will collect a list of ingredients and recommend some recipes" },
                { role: "user", content: "My ingredients are" + ingredients }
            ],
            model: "gpt-4o",
            temperature: 1,
            max_tokens: 4096,
            top_p: 1
        }
    });

    if (response.status !== "200") {
        throw response.body.error;
    }
    console.log(response.body.choices[0].message.content);

    //  from the SDK send a response through the response object to chat
    res.send(createTextEvent(response.body.choices[0].message.content) + createDoneEvent());
});

app.get('/callback', (req, res) => {
  console.log(`Received [${req.method}] to [${req.url}]`);
  res.send('You may close this tab and return to GitHub.com (where you should refresh the page ' +
    'and start a fresh chat). If you are using VS Code or Visual Studio, return there.');
});

app.get('/', (req, res) => {
  console.log(`Received [${req.method}] to [${req.url}]`);
  res.send('This is a GitHub Copilot Extension, please use Copilot to interact with the agent.');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
