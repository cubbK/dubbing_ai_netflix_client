# Netflix Swedish Dub

<img src="https://github.com/user-attachments/assets/05a19d37-b0c8-4a4f-8bdd-b999558e3a21" width="100">


## Watch Any Netflix Movie with Swedish Dubbing

Netflix Swedish Dub is a Chrome extension that dubs with AI in realtime any movie on netflix that has Swedish subtitles. For those who want to learn swedish but can't find anything interesting to watch.

Example video: [link](https://netflix-swedish-dub.fly.dev/)


## Why
- Regular Netflix: ~30 dubs
- With this extension: 3500+ dubs, every movie that has swedish subtitles
- Practice your hearing skills
- Consume swedish content that you actually enjoy

## Run yourself

- `npm ci`
- Follow this guide and activate all the google cloud things and get your token https://cloud.google.com/text-to-speech/docs/create-audio-text-command-line
- change the `const TOKEN=""` in content.ts to yours
- `npm run dev`
- in chrome, activate developer extensions and `load unpacked` the build/extension folder
- go to any netflix movie, activate swedish subtitles, put volume to 25% and reload(IMPORTANT) the page

## Run easier
For convenience it's possible to install it directly from chrome web store, no google cloud account required https://netflix-swedish-dub.fly.dev/

<img src="https://github.com/user-attachments/assets/090ef4c8-9222-459b-ad98-19b000fa9241">

