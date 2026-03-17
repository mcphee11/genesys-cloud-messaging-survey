# genesys-cloud-messaging-survey

## `HUGE CHANGE`

For anyone that has referenced this repo in the past the previous methods were quite complex and custom this was due to limited abilities in the messaging flow to have a post flow route. This has now been updated and the [Set Post-Flow](https://help.genesys.cloud/articles/set-post-flow-action/) is now supported in messaging flow. There was also a new API enabled for generating the Survey URL without requiring the survey flow to run which removes the need for a workflow and other custom items that were needed in the past.

I have also moved of the `Transcript` part of the previous version of this example and will put it in its own repo to split them up. This example for transcript can be found [here](https://github.com/mcphee11/webmessenger-transcript-download)

This is an example only and experience with Genesys Cloud tool set is required before trying this example. This uses the existing [Customer Surveys](https://help.genesys.cloud/articles/about-customer-surveys/) to save the survey response into so that they survey can leverage the OOTB analytics that comes with Genesys Cloud for customer surveys.

### NOTE

In this example I'm only asking one question

```
Please rate your experience with us today from 0-10 with 0 being the lowest and 10 being the highest or best experience.
```

If you wanted to have a more complex survey this can still be done be expanding on the customer survey form that you build and the answers that you PUT back into the survey form.

![](/docs/images/widget.png?raw=true)

## Step 1 - Build a Customer Survey

Build out a [customer survey](https://help.genesys.cloud/articles/about-customer-surveys/) in my case I'm simply asking for the NPS in a single question group. Once you have published the form get the `formId` from the URL so we can then get the formId data.

![](/docs/images/surveyFormId.png?raw=true)

## Step 2 - GET SurveyForm IDs

Go to the Genesys Cloud [API Explorer](https://developer.genesys.cloud/devapps/api-explorer) then GET the survey formId details from the `/api/v2/quality/publishedforms/surveys/{formId}` endpoint. Below is an example of what the response looks like, I have removed my IDs.

```
{
  "id": "YOUR_FORM_ID",
  "name": "webMessaging",
  "modifiedDate": "2026-03-16T22:11:05.998Z",
  "published": true,
  "disabled": false,
  "contextId": "YOUR_FORM_CONTEXT_ID",
  "language": "en-US",
  "questionGroups": [
    {
      "id": "YOUR_QUESTION_GROUP_ID",
      "contextId": "YOUR_QUESTION_GROUP_CONTEXT_ID",
      "name": "Customer feedback",
      "type": "questionGroup",
      "naEnabled": false,
      "questions": [
        {
          "id": "YOUR_QUESTION_ID",
          "contextId": "YOUR_QUESTION_CONTEXT_ID",
          "text": "How likely are you to recommend use based on your experience today? ",
          "helpText": "",
          "type": "npsQuestion",
          "naEnabled": false,
          "maxResponseCharacters": 250
        }
      ]
    }
  ],
  "selfUri": "/api/v2/quality/publishedforms/surveys/YOUR_FORM_ID"
}
```

Ensure that you copy out the:

- YOUR_FORM_CONTEXT_ID
- YOUR_QUESTION_GROUP_ID
- YOUR_QUESTION_ID

## Step 3 - Deploy the Data Actions

For this you need to have both `Genesys Cloud Data Actions` to call the Genesys Cloud Platform API as well as the `Web Services Data Action` to call the external API to score the survey on behalf of the customer from the messaging flow.

- 1
  The first data action is to generate the survey URL based on the conversationId and survey form contextId. This can be found here: [Create-Customer-Survey-URL](/docs/dataAction/Create-Customer-Survey-URL.custom.json). This will return the `surveyURL` and needs to be imported to the Genesys Cloud Data Actions.

- 2
  The second data action is to GET the survey on behalf of the customer this then also marks the survey as `read` and can now be scored. This can be found here: [Get-Customer-Survey](/docs/dataAction/Get-Customer-Survey.custom.json). This has no return item as we are just marking it as read at this stage, this needs to be imported to the Web Services Data Actions.

#### NOTE: I have the region set to 'mypurecloud.com.au' if your in another region you will need to update the URL in the action under the configuration.

- 3
  The third data action is to score the actual survey on behalf of the customer. Depending on the customer survey form you will have to adjust this data action based on the questions you are asking and the question types. This can be found here: [Score-Customer-survey](/docs/dataAction/Score-Customer-Survey.custom.json). This needs to be imported to the Web Services Data Actions.

#### NOTE: I have the region set to 'mypurecloud.com.au' if your in another region you will need to update the URL in the action under the configuration.

## Step 4 - Build the Messaging Flows

The main messaging flow is the one that is managing your current inbound interactions and this is where you leverage the new `Set Post-Flow` action to allow the conversation to get sent to your new flow that is setup to ask the survey questions and send the results into the survey form.

- 1
  Create a new `Inbound Messaging Flow` that is going to be the survey `NOTE: this is NOT a survey flow type` you can call it something logical like 'Messaging-Survey' and in this flow you will leverage a BOT to capture the inputs for your questions and save them as slots that the BOT flow can pass back to the messaging flow. In my case this is a simple NPS score from 0-10.

![](/docs/images/messagingSurveyFlow.png?raw=true)

This calls the BOT Flow that collects the answers through `slots` then uses the data actions that we created in step 3 to first Create the survey URL and then Get the survey to mark it as read and then finally score the survey with the customers answers that come from the BOT flow.

- 2
  The second part is to simply reference this new 'Messaging-Survey' flow that was created in the normal incoming messaging flow that is use by leveraging the `Set Post-Flow` action. This allows for the conversation to be connected to the 'Messaging-Survey' flow once the main flow has completed and the customer is ready to take the survey.

![](/docs/images/setPostFlow.png?raw=true)

## Step 5 - Review the results

Now that its all setup you can see the NPS results in the interactions view under the `Promoter Score` you will also see the survey results under the interaction quality details as well.

![](/docs/images/score.png?raw=true)

## NOTE:

You can only generate one survey per conversationId. So if your testing this make sure you "Clear Conversation" each time when testing via the `Trash can` icon in the Genesys Cloud UI to clear the conversation and allow for a new survey to be generated for each test.
