import icon from "data-base64:~assets/icon.png"
import { useEffect, useState } from "react"

import "./popup.css"

export default function IndexPopup() {
  const [isLoading, setIsLoading] = useState(true)
  const [isPremium, setIsPremium] = useState(false)
  const [cookie, setCookie] = useState<string | undefined>()
  const [isEnabled, setIsEnabled] = useState<boolean>(true)

  console.log({ cookie })

  async function handleIsEnabled() {
    setIsEnabled(!isEnabled)
    await chrome.cookies.set({
      url: process.env.PLASMO_PUBLIC_API_URL,
      name: "isEnabled",
      value: isEnabled ? "false" : "true"
    })
  }

  useEffect(() => {
    async function extractJWTFromCookie() {
      const cookieGet = await chrome.cookies.get({
        url: process.env.PLASMO_PUBLIC_API_URL,
        name: "netflixAiDubbingToken"
      })

      const isEnabledCookie = await chrome.cookies.get({
        url: process.env.PLASMO_PUBLIC_API_URL,
        name: "isEnabled"
      })
      if (isEnabledCookie?.value === "false") {
        setIsEnabled(false)
      }

      try {
        const response = await fetch(
          `${process.env.PLASMO_PUBLIC_API_URL}/account`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${cookieGet?.value}`
            }
          }
        )
        const responseJson = await response.json()
        setIsLoading(false)
        setIsPremium(responseJson.isPremium)
        setCookie(cookieGet?.value)
      } catch (err) {
        console.log(err)
        setIsLoading(false)
        setIsPremium(false)
        setCookie(cookieGet?.value)
      }
    }
    extractJWTFromCookie()
  }, [])

  return isLoading ? (
    "Loading..."
  ) : (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: 16,
        width: "300px",
        backgroundColor: "#beee62"
      }}>
      <div style={{ display: "flex", alignContent: "center" }}>
        <input
          id="isEnabled"
          type="checkbox"
          value={"isEnabled"}
          checked={isEnabled}
          onChange={handleIsEnabled}
        />
        <label htmlFor="isEnabled">Enabled</label>
      </div>
      <h1 style={{ textAlign: "center" }}>
        Netflix Swedish Dub
        <div>
          <img style={{ width: "80px" }} src={icon} alt="Main icon" />
        </div>
      </h1>
      <div>
        {!cookie ? (
          <a
            href={process.env.PLASMO_PUBLIC_API_URL}
            target="_blank"
            className="btn btn-dark btn-lg svg-icon btn-block"
            id="upgrade-btn"
            style={{ width: "100%" }}>
            Login
          </a>
        ) : (
          <a
            href={`${process.env.PLASMO_PUBLIC_API_URL}/account.html`}
            target="_blank"
            className="btn btn-dark btn-lg svg-icon btn-block"
            id="upgrade-btn"
            style={{ width: "100%" }}>
            Manage Account
          </a>
        )}
      </div>

      <h2>Account: {isPremium ? "Premium" : "Free"}</h2>

      <div className="card">
        <div className="card-header">Get Started</div>
        <div className="card-body">
          <ul className="list-group">
            <li className="list-group-item">Go to a netflix movie.</li>
            <li className="list-group-item">Turn on Swedish subtitles</li>
            <li className="list-group-item">turn netflix volume to 50%</li>
            <li className="list-group-item">
              <b>Refresh</b> the page
            </li>
            <li className="list-group-item">
              If your account is free only movieX works, if premium all movies
              work.
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
