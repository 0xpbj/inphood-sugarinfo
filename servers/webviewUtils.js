
exports.getReportWebView = function(userId, firstName, date, link) {
  return {
    uri: 'https://graph.facebook.com/v2.6/me/messages?access_token=EAAJhTtF5K30BABsLODz0w5Af5hvd1SN9TZCU0E9OapZCKuZAOMugO2bNDao8JDe8E3cPQrJGLWWfL0sMxsq4MSTcZBbgGEjqa68ggSZCmZAFhGsFPFkWGUlYwAZB2ZCOrPPgdxS612ck5Rv8SrHydJihKQGsPLQSc1yYtBkncIpbOgZDZD',
    json: true,
    method: 'POST',
    body: {
      'recipient':{
        'id':userId
      },
      'message':{
        'attachment':{
          'type':'template',
          "payload":{
            "template_type":"generic",
            "elements":[
               {
                "title":"sugarinfoAI Daily Report",
                "image_url":"https://d1q0ddz2y0icfw.cloudfront.net/chatbotimages/arrows.jpg",
                "subtitle":firstName + "'s sugar consumption through " + date,
                "default_action": {
                  "url": link,
                  "type": "web_url",
                  "messenger_extensions": true,
                  "webview_height_ratio": "tall",
                  "fallback_url": "https://www.inphood.com/"
                },
                "buttons":[
                  {
                    "url":link,
                    "type":"web_url",
                    "title":"View Report",
                    "webview_height_ratio": "tall"
                  },
                  {
                    "type":"element_share"
                  }
                ]
              }
            ]
          }
        }
      }
    },
    resolveWithFullResponse: true,
    headers: {
      'Content-Type': "application/json"
    }
  }
}
