# genesys-cloud-messaging-survey

An example of how to use the native web surveys as well as getting a download link of the transcript but in the WebMessaging channel. This is designed as an example only on whats possible with some creative configuration. Experience using the Genesys Cloud tool set is required before trying this example.

The concept behind this is quite simple at a high level. Use the existing [Web Surveys](https://help.mypurecloud.com/articles/about-web-surveys/) that come with Genesys Cloud 3 license but use the dataActions [dataAction](https://help.mypurecloud.com/articles/about-the-data-actions-integrations/) to update the conversation thread with both the survey url as well as the transcription download URL after the agent has disconnected via the agentless message API endpoint. This way all the existing reporting features and NPS results are reflected as normal as well as the scores being visible in the interaction view for QA.

![](/docs/images/widgetExperience.png?raw=true)


# Step 1 - Survey Form

Create a [Survey form](https://help.mypurecloud.com/articles/create-a-web-survey-form/). In this case it will contain 2 questions to gather a NPS score as well as a free text input section. You can use this same method to create more questions as you see fit.

![](/docs/images/surveyForm.png?raw=true)

Ensure you save and publish the form to make it active.

# Step 2 - Create DataActions

So for this you will need dataAcitons to do the below:

* Get Conversation Details - agentId, fromAddress, toAddress
* Get RecordingId
* Get Media URL
* Convert Long URL into TinyURL (External Service)
* Send Agentless Messages

1 - Import the first one ["Get-Conversation-Details-Messaging"](/docs/dataAction/Get-Conversation-Details-Messaging.json) as a "Genesys Cloud Data Action" type as this is an internal API call.

    Then save and publish

2 - Import the second one ["Get-RecordingID"](/docs/dataAction/Get-RecordingID.json) as a "Genesys Cloud Data Action" type as this is an internal API call.

    Then save and publish

3 - Import the third one ["Get-MediaURL"](/docs/dataAction/Get-MediaURL.json) as a "Genesys Cloud Data Action" type as this is an internal API call.

    Then save and publish

4 - Import the forth one ["Get-Survey"](/docs/dataAction/Get-Survey.json) as a "Genesys Cloud Data Action" type as this is an internal API call.

    Then save and publish

5 - First create the "Web Services Data Action" Integration with a UserDefined Auth and add the "authorization" for the field name with the "Bearer " followed by the API Key you get given from the website setup. In this example im using this external service to give back a shortened URL as if not you go over the max number of characters the message will not be able to be sent. Details as well as how to create an account to get your own key can be found here: ["https://tinyurl.com/app/"](https://tinyurl.com/app/)

![](/docs/images/createIntegration.png?raw=true)

Import the fifth one ["Tiny-URL"](/docs/dataAction/Tiny-URL.json) as a "Web Services Data Actions" type as this is an external API call. This will require its own Integration as you will need to setup a API Bearer Token to be passed.

    Then save and publish

6 - Import the sixth one ["Send-Agentless-Message"](/docs/dataAction/Send-Agentless-Message.json) as a "Genesys Cloud Data Action" type as this is an internal API call.

    Then save and publish

# Step 4 - Create Survey Invite Flow

Create a new "Survey Invite Flow" then import the [message_survey_invite](/docs/flow/message_survey_invite_v1-0.i3SurveyInviteFlow) this is based on the above use case of sending a link to the survey in the thread as well as offering the transcript. You will need to update the DataActions to the new ones that you just imported and published above. All the variable names will stay in place.

![](/docs/images/updateDataActions.png?raw=true)

This Flow will also need to have a valid email address at the end to send the survey to. Even though the email is going to never be used or read if you send it to a non valid email address after x amount of failed attempts the AWS email service will block the address so I recommend using a company one and just setting a auto delete rule on the inbox. It is also handy to see them while testing as well.

![](/docs/images/updateEmail.png?raw=true)

Publish the flow.

# Step 5 - Create Policy

Build up a policy with the required filters you need for example based on queue and wrapup codes etc. Then target the Survey flow and form that you have already created.

 # Reporting

Now you will see interactions getting survey data stored against them as well as in the interaction view the actual survey form filled out.

