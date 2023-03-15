# genesys-cloud-messaging-survey

**`!!! MAJOR UPDATED VERSION !!!`**

```
The older version of this repo used the "Agentless Message" API to send in the data after the conversation had ended. This is NOT supported on WebMessaging only currently sms, WhatsApp & OpenMessaging. Due to this and new features coming to WebMessaging the ability to use this via the "open" media type on the WebMessage mediaType will be closed.
```
New Design:

![](/docs/images/screenShot2.png?raw=true)

An example of how to use the native web surveys as well as getting a download link of the transcript but in the WebMessaging channel. This is designed as an example only on whats possible with some creative configuration. Experience using the Genesys Cloud tool set is required before trying this example.

The concept behind this is more indepth then the previous version but also more powerful and flexiable. Use the existing [Web Surveys](https://help.mypurecloud.com/articles/about-web-surveys/) that come with Genesys Cloud 3 license but use the dataActions [dataAction](https://help.mypurecloud.com/articles/about-the-data-actions-integrations/) to update a dataTable as well as create the transcript URL after the agent has disconnected. This way all the existing reporting features and NPS results are reflected as normal as well as the scores being visible in the interaction view for QA.

![](/docs/images/screenShot1.png?raw=true)

# Step 1 - Survey Form

Create a [Survey form](https://help.mypurecloud.com/articles/create-a-web-survey-form/). In this case it will contain 2 questions to gather a NPS score as well as a free text input section. You can use this same method to create more questions as you see fit.

![](/docs/images/surveyForm.png?raw=true)

Ensure you save and publish the form to make it active.

# Step 2 - Create DataActions

So for this you will need dataAcitons to do the below:

* Get RecordingId
* Get Media URL
* Convert Long URL into TinyURL (External Service)
* GET Customer Key
* Check DataTable for KEY
* Update DataTable RowId
* Create DataTable RowId

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

You will also need to ```update the 2x DataActions``` that require the "DataTableId" taht you created in the previous step and update the value.

![](/docs/images/screenShot4.png?raw=true)

This Flow will also need to have a valid email address at the end to send the survey to. Even though the email is going to never be used or read if you send it to a non valid email address after x amount of failed attempts the AWS email service will block the address so I recommend using a company one and just setting a auto delete rule on the inbox. It is also handy to see them while testing as well.

![](/docs/images/updateEmail.png?raw=true)

Publish the flow.

# Step 6 - Create Policy

Build up a policy with the required filters you need for example based on queue and wrapup codes etc. Then target the Survey flow and form that you have already created.

# Step 7 - Create Cloud Function or Lambda

As the client side needs to do a GET request into the Genesys Cloud DataTable personally I find it best to front end this API call with either a GCP Cloud Function (which i used) or a AWS Lambda. This way the client side can use the client credentials OAuth to process this GET request as well as then you can add additional security controls on this request. Depending on the service that is being used this will also give a public https URL for the APi request. My example below is based on a GCP Cloud function you dont have to use the same solution this is just an example.

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
```All these design options need to be considered as well as security of this API request so be careful here.```

![](/docs/images/screenShot6.png?raw=true)

# Step 8 - Add code to website

Finally you will need to add some code to the customer website that is running the WebMessenger widget. There are 2x components that you will need to add first is the [BootStrap](https://getbootstrap.com/docs/5.3/getting-started/introduction/) This is due to the fact I built the "popup" UI usign BootStrap for the CSS. So If you want you can suild your own UI with CSS styling. To use the BootStrap CSS I have used you will need to add teh below to the header of the pages.

```
    <link
      href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css"
      rel="stylesheet"
      integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC"
      crossorigin="anonymous"
    />
```

The second part is the [customplugin.js](/customplugin.js) that needs to be hosted somewhere that is accessable by the website. In my example I'm using a GCP Bucket but this is up to the hosting of the website.

In this customplugin.js file you will need to update 2x let in the file which are located at the top of the file these are:

```
const datatableId = 'ENTER_YOUR_DATATABLE'
const apiUrl = 'ENTER_YOUR_URL'
```

This needs to be added to the website and as it uses the "Genesys" SDK in the WebMessenger Wdiget this needs to be loaded into the header of the page with the "defer" set to ensure it loads after the WebMessenger snippet.

```
<script src="customplugin.js" defer></script>
```

# Reporting

Now you will see interactions getting survey data stored against them as well as in the interaction view the actual survey form filled out.

# NOTES

It is worth noting that the agent needs to of "wrapped up" the interaction before the survey policy will run and update the data table with the required information that the client popup needs.

The customplugin.js will get the "disconnected" event then have a setTimeOut() of 15sec before doing a GET request for the data table information if it gets a 404 or 500 error back it will retry again in another 15sec. If these timers dont suit you can change them in the js file as well as if you dont have wrap up at all on the interaction queue you can make this timer somthing like 5sec to allow for the backend servers to run only.

Finally currently an agent needs to be a participant on the conversationId for the Policy to trigger a survey.

<details><summary><h3>👨‍💻 Old Version for context..... dont use the below this will be removed</h3></summary>

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

4 - First create the "Web Services Data Action" Integration with a UserDefined Auth and add the "authorization" for the field name with the "Bearer " followed by the API Key you get given from the website setup. In this example im using this external service to give back a shortened URL as if not you go over the max number of characters the message will not be able to be sent. Details as well as how to create an account to get your own key can be found here: ["https://tinyurl.com/app/"](https://tinyurl.com/app/)

![](/docs/images/createIntegration.png?raw=true)

Import the fifth one ["Tiny-URL"](/docs/dataAction/Tiny-URL.json) as a "Web Services Data Actions" type as this is an external API call. This will require its own Integration as you will need to setup a API Bearer Token to be passed.

    Then save and publish

5 - Import the sixth one ["Send-Agentless-Message"](/docs/dataAction/Send-Agentless-Message.json) as a "Genesys Cloud Data Action" type as this is an internal API call.

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

