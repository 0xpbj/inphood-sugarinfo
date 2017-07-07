// Basic time utilities to convert from a given UTC time stamp in milliseconds
// to the time zone provided (the javascript date function seems to lack this
// notion converting to local machine time or UTC which makes it hard to think
// about things like the time on a User's phone elsewhere).

function getDayStr(numDay) {
  switch (numDay) {
    case 0:
      return 'Sun'
    case 1:
      return 'Mon'
    case 2:
      return 'Tue'
    case 3:
      return 'Wed'
    case 4:
      return 'Thu'
    case 5:
      return 'Fri'
    default:
      return 'Sat'
  }
}

function getMonthStr(numMonth) {
  switch (numMonth) {
    case 0:
      return 'Jan'
    case 1:
      return 'Feb'
    case 2:
      return 'Mar'
    case 3:
      return 'Apr'
    case 4:
      return 'May'
    case 5:
      return 'Jun'
    case 6:
      return 'Jul'
    case 7:
      return 'Aug'
    case 8:
      return 'Sep'
    case 9:
      return 'Oct'
    case 8:
      return 'Nov'
	default:
      return 'Dec'
  }
}

function getHourStr(numHour) {
  switch (numHour) {
    case 0:
      return '12'
    default:
      if (numHour < 13) {
        return numHour.toString()
      } else {
        let non24Hour = numHour - 12
        return non24Hour.toString()
      }
  }
}

function getAmPmStr(numHour) {
  if (numHour >= 12)
    return 'PM'

  return 'AM'
}

function getDoubleDigit(num) {
  return (num < 10) ?
    '0' + num.toString() :
    num.toString()
}

function getDateTimeInTZ(timeStampMs, timeZone) {
  const timeZoneShiftMs = timeZone * 60 * 60 * 1000
  let dateObjInTZ = new Date(timeStampMs + timeZoneShiftMs)

  return dateObjInTZ
}

exports.getUserTimeObj = function(timeStampMs, userTimeZone) {
  let userTime = getDateTimeInTZ(timeStampMs, userTimeZone)
  
  return {
    hour: userTime.getUTCHours(),
    minute: userTime.getUTCMinutes(),
    seconds: userTime.getUTCSeconds()
  }
}

exports.getUserTimeString = function(timeStampMs, userTimeZone) {
  let userTime = getDateTimeInTZ(timeStampMs, userTimeZone)
  let userTimeStr = getHourStr(userTime.getUTCHours()) + ':' +
                    getDoubleDigit(userTime.getUTCMinutes()) + ':' +
                    getDoubleDigit(userTime.getUTCSeconds()) + ' ' +
                    getAmPmStr(userTime.getUTCHours())
  return userTimeStr
}

exports.getUserDateString = function(timeStampMs, userTimeZone) {
  let userDate = getDateTimeInTZ(timeStampMs, userTimeZone)
  let userDateStr = getDayStr(userDate.getUTCDay()) + ' ' +
                    getMonthStr(userDate.getUTCMonth()) + ' ' +
                    userDate.getUTCDate() + ' ' +
                    userDate.getUTCFullYear()
  return userDateStr
}
