'use strict'
let conversationEnd = localStorage.getItem('conversationEnd')
let surveyDone = localStorage.getItem('surveyDone')
let loaded = false

if (conversationEnd == null || conversationEnd == undefined) {
  conversationEnd = 'false'
}
if (surveyDone == null || surveyDone == undefined) {
  surveyDone = 'false'
}

//receive disconnected event
Genesys('subscribe', 'MessagingService.conversationDisconnected', function () {
  if (!loaded) {
    loaded = true
    conversationEnd = 'true'
    localStorage.setItem('conversationEnd', 'true')
    console.log('end of conversation')
    console.log(conversationEnd)
    console.log(surveyDone)
    if (surveyDone == 'false') {
      openSurveyToaster()
    }
  }
})
//receive connected event
Genesys('subscribe', 'Conversations.started', function () {
  console.log('new conversation')
  conversationEnd = 'false'
  surveyDone = 'false'
  loaded = false
  localStorage.setItem('conversationEnd', 'false')
  localStorage.setItem('surveyDone', 'false')
})

Genesys('subscribe', 'Toaster.ready', function (e) {
  Genesys('subscribe', 'Toaster.accepted', function (e) {
    localStorage.setItem('surveyDone', 'true')
    console.log('Toaster was accepted', e)
    Genesys('command', 'MessagingService.sendMessage', {
      message: 'lets do a survey',
    })
    Genesys('command', 'Messenger.open')
  })
  Genesys('subscribe', 'Toaster.declined', function (e) {
    console.log('Toaster was declined', e)
    localStorage.setItem('surveyDone', 'true')
  })
  Genesys('subscribe', 'Toaster.closed', function (e) {
    console.log('Toaster was closed', e)
    localStorage.setItem('surveyDone', 'true')
  })
})

function openSurveyToaster() {
  Genesys(
    'command',
    'Toaster.open',
    {
      title: 'We would love your feedback',
      body: 'Please take some time to fill out our short survey',
      buttons: {
        type: 'binary', // required when 'buttons' is present. Values: "unary" for one action button, "binary" for two action buttons
        primary: 'Accept', // optional, default value is "Accept"
        secondary: 'Decline', // optional, default value is "Decline"
      },
    },
    function () {
      /*fulfilled callback*/
    },
    function (error) {
      /*rejected callback*/
      console.error('There was an error running the Toaster.open command:', error)
    }
  )
}
