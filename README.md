# genesys-cloud-messaging-survey

## `HUGE CHANGE`

For anyone that has referenced this repo in the past the previous method is listed at the bottom of this readMe inside a collapsed `Details` section. For new people to this repo while the previous method did work it was quite complex and people were struggling with how to implement it. As well as since then the Messenger Widget has released the [Toaster Plugin](https://developer.genesys.cloud/commdigital/digital/webmessaging/messengersdk/SDKCommandsEvents/toasterPlugin) which makes building the "popup" a LOT nicer and more native to the UI experience. As well as it supports multiply locations in the widget as as they move around it will follow them in the UI. I have also moved of the `Transcript` part of the previous version of this example and will put it in its own repo to split them up. This example for transcript can be found [here](https://github.com/mcphee11/webmessenger-transcript-download)

![](/docs/images/popup_in_message.png?raw=true)

![](/docs/images/popup_launcher.png?raw=true)

This is an example only and experience with Genesys Cloud tool set is required before trying this example. In this case im NOT going to be using the existing [Web Surveys](https://help.mypurecloud.com/articles/about-web-surveys/) as while that does have some reporting advantages currently you HAVE to have an agent involved for that to trigger the Survey URL and with a massive move towards digital self service this method enables you to also survey 100% BOT interactions as well. To then see the results you can report on this using the native reports under the `External Tag` metric in the reports.

### NOTE

In this example im only asking one question

```
Please rate your experience with us today from 0-9 with 0 being the lowest and 9 being the highest or best experience.
```

If you require more questions you can still do this but just `|` then together in the same string so you can use the External Tag. Otherwise you could also use `Flow Outcomes` and `Milestones` for the reporting requirements.

## Step 1 - Digital Bot Flow

Ensure that the start of the "Initial Greeting" has either a `Wait for Input` or `Digital Menu` at the start of the flow as when its triggered for the survey we will be passing in text straight away.

Create a Data `STRING` type called

    Flow.NPS_Score

That has both `INPUT` and `OUTPUT` selected as this data will need to be passed out and in.

Create a new `Intent` called `Survey` and put the blow utterance in there

```
lets do a survey
```

In my example I added a few more to help the intent health checker but this text above is what is going to be sent in to trigger this intent unless you change the code. For example if your doing this in another language. Let this also create a new "Task" as we will add some items in there soon.

Create a new `Slot` called

    NPS_Slot

With slot type of `builtin:number` now if you are doing more then one question that accepts a number then you would need to change this part as well as add more slots. But in this example its a simple 0-9 answer.

![](/docs/images/slots.png?raw=true)

Now open the new Task that was created called `Survey` The first block we are going to put in is a `Ask for Slot` which is going to be to ask for the `NPS_Slot` that we just created. Update the "Question" to be what you need in my example im using:

```
Please rate your experience with us today from 0-9 with 0 being the lowest and 9 being the highest or best experience.
```

Ensure that the "Slot Result" is going to the default `Slot.NPS_Slot` you can also update the validation as well as the No Match response if you like as well as good practice.

Next Add a `Communicate` block to thank them for their feedback, in my case im using:

```
Thanks for submitting your feedback
```

Then we need to update the variable we are going to pass back to the Message Flow by adding in a `Update Data` block with the below data in it:

![](/docs/images/update_data.png?raw=true)

Then pass in a `Exit Bot Flow` block to pass it back to the message flow. So the end full Task will look like this:

![](/docs/images/task.png?raw=true)

Publish the Flow.

## Step 2 - Message Flow

In your Inbound Message flow where the Deployment is pointing to create a Flow data `STRING` item called

    Flow.NPS_Score

![](/docs/images/flow_data.png?raw=true)

Ensure that you have your `Digital Bot Flow` at the very top of the flow (Step 1) and the:

    Output: Flow.NPS_Score

set to the variable you created before called `FLOW.NPS_Score`. Keeping the same naming between the Digital Bot Flow and your Message flow makes it easier to follow in my view especially when you end up with more complex environments.

Directly below the `Call Digital BOT Flow` block ensure you have a `Decision` if they survey was just completed or not. This is to ensure that the conversation gets disconnected after the survey and not routed back to an agent again. Inside the decision you will need:

```
if(Flow.NPS_Score!=NOT_SET, true, false)
```

Then if this is `Yes` go to the `Set External Tag` block and then `Disconnect` if the decision is `No` Then do your normal routing that you would use, eg transfer to ACD.

The External Tag data can be something like this:

    "NPS: " + Flow.NPS_Score

Ensure that the type of input is set to "Expression" so you can include the String + variable.

![](/docs/images/external_tag.png?raw=true)

So the end state should look something like this:

![](/docs/images/message_flow.png?raw=true)

## Step 3 - Deploy code

Now that all the hard work is done all you need to do is to deploy the additional code to teh website. To do this I would recommend using the tag manager that you used to deploy the default WebMessenger deployment code snippet. Download the [genesysSurvey.min.js](./genesysSurvey.min.js) and then host it somewhere, this can be with the rest of your website or a public AWS S3 or GCP Bucket for example. Once you have the URL add it to your website like the below.

```
<script src=./genesysSurvey.min.js></script>
```

Ensure that this is `BELOW` the default Genesys Cloud WebMessenger deployment snippet as the `Genesys` SDK that is used int his file needs to be loaded first. If you do run into load issues you can always add a `defer` to this so its forced to load later.

file that is in the repo, while you can use the .js version I have created a .min.js version to compress and mangle the code for prod deployment. I use [terser](https://terser.org/) to do this there are many other packages out there but if you do your own edits you can then use terser to create your own .min version of your own file if you did change the code. Or you can just use your raw .js version of the file.

## Step 4 - Test and Reporting

Now that you are all done test out the survey. NOTE that if you "continue" an existing interaction it will not popup again so you might want to allow users to `Clear` there conversations to enable new sessions.

![](/docs/images/clear_conversation.png?raw=true)

If you open up a Performance Workspace view with "Interactions" you can add the "metric" `External Tag` this will then show the columns with the "NPS: X" answers in them and if you want to "filter" you can search for `External Tag` and then type in the score you want for example to see all the ones that gave you a score of 0 you would type "NPS: 0"

![](/docs/images/report.png?raw=true)

## Final thoughts

If you do require more then one question and want to use the native Web Survey solution for analytics etc. This can be done and I recommend using the [voice survey](https://github.com/mcphee11/genesys-cloud-voice-survey) solution as an example of how you could take the answers given to this BOT in the above and then use a `WorkFlow` to cache the answers and POST scores to the web survey URL. This would require a survey URL to be generated so only work for agent involved interactions but is completely achievable as well. I did NOT add this to this documentation as I have already documented that process in the voice example as well as it was to complex for a LOT of users so for those that want to do it reference the voice for the required DataActions etc.

<summary><h3>👨‍💻 Previous Method</h3></summary>
<details>

![](/docs/images/screenShot2.png?raw=true)

An example of how to use the native web surveys as well as getting a download link of the transcript but in the WebMessaging channel. This is designed as an example only on whats possible with some creative configuration. Experience using the Genesys Cloud tool set is required before trying this example.

The concept behind this is more in depth then the previous version but also more powerful and flexible. Use the existing [Web Surveys](https://help.mypurecloud.com/articles/about-web-surveys/) that come with Genesys Cloud 3 license but use the dataActions [dataAction](https://help.mypurecloud.com/articles/about-the-data-actions-integrations/) to update a dataTable as well as create the transcript URL after the agent has disconnected. This way all the existing reporting features and NPS results are reflected as normal as well as the scores being visible in the interaction view for QA.

![](/docs/images/screenShot1.png?raw=true)

# Step 1 - Survey Form

Create a [Survey form](https://help.mypurecloud.com/articles/create-a-web-survey-form/). In this case it will contain 2 questions to gather a NPS score as well as a free text input section. You can use this same method to create more questions as you see fit.

![](/docs/images/surveyForm.png?raw=true)

Ensure you save and publish the form to make it active.

# Step 2 - Create DataActions

So for this you will need dataActions to do the below:

- Get RecordingId
- Get Media URL
- Convert Long URL into TinyURL (External Service)
- GET Customer Key
- Check DataTable for KEY
- Update DataTable RowId
- Create DataTable RowId

1 - Import the ["Get-RecordingID"](/docs/dataAction/Get-RecordingID.json) as a "Genesys Cloud Data Action" type as this is an internal API call.

    Then save and publish

2 - Import the ["Get-MediaURL"](/docs/dataAction/Get-MediaURL.json) as a "Genesys Cloud Data Action" type as this is an internal API call.

    Then save and publish

3 - First create the "Web Services Data Action" Integration with a UserDefined Auth and add the "authorization" for the field name with the "Bearer " followed by the API Key you get given from the website setup. In this example im using this external service to give back a shortened URL as if not you go over the max number of characters the message will not be able to be sent. Details as well as how to create an account to get your own key can be found here: ["https://tinyurl.com/app/"](https://tinyurl.com/app/)

![](/docs/images/createIntegration.png?raw=true)

Import the ["Tiny-URL"](/docs/dataAction/Tiny-URL.json) as a "Web Services Data Actions" type as this is an external API call. This will require its own Integration as you will need to setup a API Bearer Token to be passed.

    Then save and publish

4 - Import the ["Get-Customer-Key"](/docs/dataAction/Get-Custoemr-Key.json) as a "Genesys Cloud Data Action" type as this is an internal API call.

    Then save and publish

5 - Import the ["Check-DataTable"](/docs/dataAction/Check-DataTable.json) as a "Genesys Cloud Data Action" type as this is an internal API call.

    Then save and publish

6 - Import the ["Create-DataTable-Row"](/docs/dataAction/Create-DataTable-Row.json) as a "Genesys Cloud Data Action" type as this is an internal API call.

    Then save and publish

7 - Import the ["Update-DataTable-Row"](/docs/dataAction/Update-DataTable-Row.json) as a "Genesys Cloud Data Action" type as this is an internal API call.

    Then save and publish

# Step 4 - Create DataTable

You will need to create a [DataTable](https://help.mypurecloud.com/articles/work-with-data-tables/) to store the information so that the client side can access this information. In this DataTable you will need to create 3 columns the "KEY", "transcript" & "survey" will all being of type "string".

Once created you will need to copy the "DataTableId" from the URL when the table is open. Ensure you write this down somewhere as you will need it later on.

![](/docs/images/screenShot5.png?raw=true)

# Step 5 - Create Survey Invite Flow

Create a new "Survey Invite Flow" then import the [message_survey_invite](/docs/flow/message_survey_invite_v2-0.i3SurveyInviteFlow) this is based on the above use case of sending a link to the survey in the thread as well as offering the transcript. You will need to update the DataActions to the new ones that you just imported and published above. All the variable names will stay in place.

![](/docs/images/screenShot3.png?raw=true)

You will also need to `update the 2x DataActions` that require the "DataTableId" that you created in the previous step and update the value.

![](/docs/images/screenShot4.png?raw=true)

This Flow will also need to have a valid email address at the end to send the survey to. Even though the email is going to never be used or read if you send it to a non valid email address after x amount of failed attempts the AWS email service will block the address so I recommend using a company one and just setting a auto delete rule on the inbox. It is also handy to see them while testing as well.

![](/docs/images/updateEmail.png?raw=true)

Publish the flow.

# Step 6 - Create Policy

Build up a policy with the required filters you need for example based on queue and wrapup codes etc. Then target the Survey flow and form that you have already created.

# Step 7 - Create Cloud Function or Lambda

As the client side needs to do a GET request into the Genesys Cloud DataTable personally I find it best to front end this API call with either a GCP Cloud Function (which i used) or a AWS Lambda. This way the client side can use the client credentials OAuth to process this GET request as well as then you can add additional security controls on this request. Depending on the service that is being used this will also give a public https URL for the APi request. My example below is based on a GCP Cloud function you don't have to use the same solution this is just an example.

```
/**
* Created as a example only
*
* @param {!express:Request} req HTTP request context.
* @param {!express:Response} res HTTP response context.
*/

const clientId = process.env.CLIENTID           //OAuth2
const clientSecret = process.env.CLIENTSECRET   //OAuth2
const region = process.env.REGION               //eg: mypurecloud.com.au

const platformClient = require('purecloud-platform-client-v2')
const client = platformClient.ApiClient.instance
const aapi = new platformClient.ArchitectApi()

client.setEnvironment(region)

console.log('Logging in to Genesys Cloud')
if (!clientId) { console.log('Missing CLIENTID'); process.exit() }
if (!clientSecret) { console.log('Missing CLIENTSECRET'); process.exit() }
if (!region) { console.log('Missing REGION'); process.exit() }

exports.start = async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    // Send response to OPTIONS requests
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Max-Age', '3600');
    res.status(204).send('');
  } else {
    // Do actual function
    if (req.body.check == 'lego') {
      client.loginClientCredentialsGrant(clientId, clientSecret)
        .then(() => {
          console.log('Getting Dat')
          aapi.getFlowsDatatableRow(req.body.datatableid, req.body.rowid, {
            showbrief: false
          })
            .then((data) => {
              res.status(200).send(data)
            })
            .catch((err) => {
              console.error("There was an Error...")
              console.log(`${JSON.stringify(err, null, 2)}`)
              if(err.status === 404){
                res.status(404).send({ error: err })
              } else{
                res.status(500).send({ error: err })
              }
            })
        })
    } else {
      console.log('No Auth')
      res.status(401).send({ Auth: false })
    }
  }
};
```

Once you have created this service ensure you copy down the URL for the API request. Im my example im passign in the DataTableId as a dynamic field this could be static.
`All these design options need to be considered as well as security of this API request so be careful here.`

![](/docs/images/screenShot6.png?raw=true)

# Step 8 - Add code to website

Finally you will need to add some code to the customer website that is running the WebMessenger widget. There are 2x components that you will need to add first is the [BootStrap](https://getbootstrap.com/docs/5.3/getting-started/introduction/) This is due to the fact I built the "popup" UI using BootStrap for the CSS. So If you want you can build your own UI with CSS styling. To use the BootStrap CSS I have used you will need to add teh below to the header of the pages.

```
    <link
      href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css"
      rel="stylesheet"
      integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC"
      crossorigin="anonymous"
    />
```

The second part is the [customplugin.js](/customplugin.js) that needs to be hosted somewhere that is accessible by the website. In my example I'm using a GCP Bucket but this is up to the hosting of the website.

In this customplugin.js file you will need to update 2x let in the file which are located at the top of the file these are:

```
const datatableId = 'ENTER_YOUR_DATATABLE'
const apiUrl = 'ENTER_YOUR_URL'
```

This needs to be added to the website and as it uses the "Genesys" SDK in the WebMessenger Widget this needs to be loaded into the header of the page with the "defer" set to ensure it loads after the WebMessenger snippet.

```
<script src="customplugin.js" defer></script>
```

# Reporting

Now you will see interactions getting survey data stored against them as well as in the interaction view the actual survey form filled out.

# NOTES

It is worth noting that the agent needs to of "wrapped up" the interaction before the survey policy will run and update the data table with the required information that the client popup needs.

The customplugin.js will get the "disconnected" event then have a setTimeOut() of 15sec before doing a GET request for the data table information if it gets a 404 or 500 error back it will retry again in another 15sec. If these timers don't suit you can change them in the js file as well as if you don't have wrap up at all on the interaction queue you can make this timer something like 5sec to allow for the backend servers to run only.

Finally currently an agent needs to be a participant on the conversationId for the Policy to trigger a survey.
