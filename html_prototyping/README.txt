Using this process to integrate webview: https://developers.facebook.com/docs/messenger-platform/webview/extensions


Curl command to whitelist our domain:
--------------------------------------------------------------------------------

curl -X POST -H "Content-Type: application/json" -d '{
  "whitelisted_domains":[
    "https://www.inphood.com"
  ]
}' "https://graph.facebook.com/v2.6/me/messenger_profile?access_token=EAAJhTtF5K30BABsLODz0w5Af5hvd1SN9TZCU0E9OapZCKuZAOMugO2bNDao8JDe8E3cPQrJGLWWfL0sMxsq4MSTcZBbgGEjqa68ggSZCmZAFhGsFPFkWGUlYwAZB2ZCOrPPgdxS612ck5Rv8SrHydJihKQGsPLQSc1yYtBkncIpbOgZDZD"

