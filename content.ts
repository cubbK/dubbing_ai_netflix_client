// @ts-nocheck
import type { PlasmoCSConfig } from "plasmo"

import { sendToBackground } from "@plasmohq/messaging"

// https://cloud.google.com/text-to-speech/docs/create-audio-text-command-line - how to get token
// EDIT THIS
// ************
const TOKEN = ""
// ************
//  END EDIT THIS

export const config: PlasmoCSConfig = {
  matches: ["https://www.netflix.com/watch/*"],
  run_at: "document_start"
}
console.log("Started 'Voice Over AI Netflix' extension!")

const movieId = window.location.pathname.replace("/watch/", "")
// Add to current page.
window.onload = function () {
  console.log(document.body)
  const notification = document.createElement("p")
  notification.innerHTML = "Voice Over AI Netflix is enabled!"
  notification.style.position = "fixed"
  notification.style.color = "red"
  notification.style.fontSize = "18px"
  document.body.appendChild(notification)
  setTimeout(() => {
    notification.style.display = "none"
  }, 2000)
}

let subtitles = []
let audios = []

function waitForElm(selector) {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector))
    }

    const observer = new MutationObserver((mutations) => {
      if (document.querySelector(selector)) {
        resolve(document.querySelector(selector))
        observer.disconnect()
      }
    })
    observer.observe(document, {
      childList: true,
      subtree: true
    })
  })
}

async function start() {
  const video = await waitForElm("video")
  console.log({ subtitles })
  startPlayAudio(video)

  startPrefetchingAudios(video)
}

start()

const s = document.createElement("script")
s.src = chrome.runtime.getURL("inject.js")
s.onload = function () {
  this.remove()
}
;(document.head || document.documentElement).appendChild(s)

// this should happen before video is loaded
document.addEventListener("InterceptedSubtitles", function (e) {
  const data = e.detail

  const xmlStr = data
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlStr, "application/xml")
  // print the name of the root element or error message
  const errorNode = doc.querySelector("parsererror")
  if (errorNode) {
    console.log("error while parsing xml")
  } else {
    const listDom = Array.from(doc.querySelectorAll("p"))
    subtitles = listDom.map((itemDom) => {
      return {
        id: itemDom.getAttribute("xml:id"),
        begin: convertNetflixTime(itemDom.getAttribute("begin")),
        end: convertNetflixTime(itemDom.getAttribute("end")),
        text: itemDom.textContent,
        played: false
      }
    })
    console.log("Subtitles parsed")
  }
})

function convertNetflixTime(netflixTime) {
  const wholePart = netflixTime.split("").reverse().slice(8).reverse().join("")
  const decimalPart = netflixTime
    .split("")
    .reverse()
    .slice(1, 8)
    .reverse()
    .join("")
  return Number(wholePart + "." + decimalPart)
}

function startPlayAudio(video) {
  video.addEventListener("timeupdate", function () {
    var currentTime = video.currentTime

    // Find the matching subtitle
    const matchingSubtitleIndex = subtitles.findIndex(function (subtitle) {
      return (
        currentTime >= subtitle.begin &&
        currentTime < subtitle.end &&
        !subtitle.played
      )
    })

    // Log the subtitle if found
    if (subtitles[matchingSubtitleIndex]) {
      subtitles[matchingSubtitleIndex].played = true

      const timeLimit = subtitles[matchingSubtitleIndex + 1]
        ? subtitles[matchingSubtitleIndex + 1].begin -
          subtitles[matchingSubtitleIndex].begin
        : subtitles[matchingSubtitleIndex].end -
          subtitles[matchingSubtitleIndex].begin

      console.log({
        matchingSubtitleIndex,
        currentTime,
        subtitleText: subtitles[matchingSubtitleIndex].text,
        subtitle: subtitles[matchingSubtitleIndex],
        subtitleIndexByText: subtitles.findIndex(
          (subtitle) => subtitle.text === subtitles[matchingSubtitleIndex].text
        ),
        subtitles
      })
      try {
        playAudio(matchingSubtitleIndex + 1, timeLimit)
      } catch (e) {
        console.log(`Failed to play subtitle ${matchingSubtitleIndex}`, e)
      }
    }
  })
}

async function fetchAudio(text, subtitleIndex, originalText) {
  const url = "https://texttospeech.googleapis.com/v1beta1/text:synthesize"
  const requestBody = {
    audioConfig: {
      audioEncoding: "OGG_OPUS",
      pitch: 0,
      speakingRate: 1
    },
    input: {
      text: text
    },
    voice: {
      languageCode: "sv-SE",
      name: "sv-SE-Wavenet-B"
    }
  }

  const options = {
    method: "POST",
    url: url,
    headers: {
      Authorization: "Bearer " + TOKEN
    },
    body: JSON.stringify(requestBody)
  }

  return fetch(url, options)
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Network response was not ok")
      }
      return response.json()
    })
    .then(function (data) {
      return {
        subtitleIndex,
        audioContent: data.audioContent
      }
    })
    .catch(function (error) {
      console.error("Error:", error)
    })
}

/**
 *
 * @param {number} subtitleIndex
 * @param {number} timeLimit
 */
function playAudio(subtitleIndex, timeLimit) {
  console.log("trying to play..", subtitleIndex)
  let audio = audios.find(
    (audio) => audio?.subtitleIndex === `subtitle${subtitleIndex.toString()}`
  )

  console.log({ audios, audio })

  // Assuming you have the audio data as a string
  const audioData = `data:audio/ogg;base64,${audio.audioContent}`
  // Create an audio element
  const audioElement = new Audio()

  // Set the source of the audio element
  audioElement.src = audioData
  audioElement.volume = 1
  // Append the audio element to the document body or any desired location
  document.body.appendChild(audioElement)

  // Play the audio

  audioElement.addEventListener("loadedmetadata", function () {
    // Access the duration property of the audio element
    const duration = audioElement.duration

    if (duration > timeLimit) {
      audioElement.playbackRate = duration / timeLimit + 0.05
    }
    audioElement.play()
  })
}

function findClosestSubtitle(target, arr) {
  let closestNum = arr[0] // Assume the first element is the closest initially

  arr.forEach(function (num) {
    if (Math.abs(target - num.begin) < Math.abs(target - closestNum.begin)) {
      if (target - num.begin < 0) {
        closestNum = num // Update closestNum if a closer number is found
      }
    }
  })

  return closestNum
}

async function startPrefetchingAudios(video) {
  video.addEventListener("timeupdate", async function () {
    const currentTime = video.currentTime
    const closestSubtitle = findClosestSubtitle(currentTime, subtitles)
    if (
      closestSubtitle &&
      audios.findIndex(
        (audio) => audio?.subtitleIndex === closestSubtitle.id
      ) === -1
    ) {
      try {
        audios.push({ subtitleIndex: closestSubtitle.id, status: "loading" })

        const formattedSubtitleText = formatSubtitleText(closestSubtitle.text)
        const originalText = closestSubtitle.text
        const audio = await fetchAudio(
          formattedSubtitleText,
          closestSubtitle.id,
          originalText
        )
        audios[audios.length - 1] = audio
      } catch (err) {
        console.log(err)
      }
    }
  })
}

function formatSubtitleText(text) {
  const formated = text
    .toLowerCase()
    .replaceAll(".", `,`)
    .replaceAll("'", "&apos;")
  return `${formated}`
}
