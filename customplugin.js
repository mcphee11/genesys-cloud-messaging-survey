const datatableId = 'ENTER_YOUR_DATATABLE'
const apiUrl = 'ENTER_YOUR_URL'
const deploymentId = 'WEBMESSAGING_DEPLOYMENTID'
let conversationEnd
conversationEnd ? sessionStorage.getItem('conversationEnd') : true
let retry = true

Genesys('subscribe', 'Launcher.ready', function (o) {
  //set the data on start
  Genesys('subscribe', 'MessagingService.started', function () {
    Genesys('command', 'Database.set', {
      messaging: { customAttributes: { token: JSON.parse(localStorage.getItem(`_${deploymentId}:actmu`)).value } },
    })
  })
  //recieve disconnected event
  Genesys('subscribe', 'MessagingService.conversationDisconnected', function () {
    if (!conversationEnd) {
      conversationEnd = true
      sessionStorage.setItem('conversationEnd', true)
      console.log('end of conversation')
      setTimeout(async function () {
        let urls = getUrls()
        console.log(urls)
      }, 15000)
    }
  })
  //recieve connected event
  Genesys('subscribe', 'Conversations.started', function () {
    console.log('new conversation')
    conversationEnd = false
    sessionStorage.setItem('conversationEnd', false)
  })
})

async function getUrls() {
  let token = JSON.parse(localStorage.getItem(`_${deploymentId}:actmu`)).value
  let data = {
    check: 'lego',
    rowid: token,
    datatableid: datatableId,
  }
  let post = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  console.log('getting results...')
  let results = await post.json()
  console.log(results)
  if (results?.key) {
    openCustomPopUp(results.survey, results.transcript)
  }
  if (results?.error?.status === 404 && retry) {
    console.log('no results... retry in 15sec')
    retry = false
    setTimeout(function () {
      getUrls()
    }, 15000)
  }
}

let div = document.createElement('div')
let popup = document.createElement('div')
let header = document.createElement('div')
let strong = document.createElement('strong')
let closeButton = document.createElement('button')
let body = document.createElement('div')
let p = document.createElement('p')
let transcriptButton = document.createElement('a')
let surveyButton = document.createElement('a')

div.id = 'CustomPopUpDiv'
div.className = 'position-fixed bottom-0 end-0 p-5'
div.style = 'z-index: 0'
popup.id = 'CustomPopUp'
popup.className = 'toast hide'
popup.role = 'alert'
header.className = 'toaster-header'
header.style = 'background-color: grey; text-align: right;'
strong.className = 'me-auto'
strong.style = 'color: white;'
closeButton.className = 'btn-close btn-close-white'
closeButton.ariaLabel = 'Close'
closeButton.onclick = function () {
  closeCustomPopUp()
}
body.id = 'CustomPopUpBody'
body.className = 'toast-body'
body.style = 'text-align: center'
p.innerHTML = 'Please select below if you want to download the content of this session'
transcriptButton.id = 'transcriptbutton'
transcriptButton.href = ''
transcriptButton.target = '_blank'
transcriptButton.innerHTML = 'Transcript'
transcriptButton.className = 'btn btn-secondary m-1'
surveyButton.id = 'surveybutton'
surveyButton.href = ''
surveyButton.target = '_blank'
surveyButton.innerHTML = 'Survey'
surveyButton.className = 'btn btn-secondary m-1'

body.appendChild(p)
body.appendChild(surveyButton)
body.appendChild(transcriptButton)
header.appendChild(closeButton)

popup.appendChild(header)
popup.appendChild(body)
div.appendChild(popup)
document.body.appendChild(div)

//Bootstrap iFrame Invite
function openCustomPopUp(survey, transcript) {
  document.getElementById('transcriptbutton').href = transcript
  document.getElementById('surveybutton').href = survey
  document.getElementById('CustomPopUpDiv').style = 'z-index: 999999999'
  document.getElementById('CustomPopUp').className = 'toast show'
}

//Bootstrap iFrame Invite
function closeCustomPopUp() {
  document.getElementById('CustomPopUp').className = 'toast hide'
  document.getElementById('CustomPopUpDiv').style = 'z-index: 0'
}
