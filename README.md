# SolatTime

SolatTime is a desktop app built with Electron that shows today's official prayer times for any town in Malaysia. It was made for the CSC2923 Object Oriented Programming final project.

## Features

- Search for a town or city in Malaysia to get its prayer times
- Official JAKIM prayer times for Subuh, Syuruk, Zohor, Asar, Maghrib and Isyak
- Live clock, Hijri date and Gregorian date
- Suggested activities based on the current time of day
- Countdown to the next prayer (hours and minutes)
- Activity reminders that you can add, view, edit and delete, saved in Local Storage

## How to run

1. Install [Node.js](https://nodejs.org).
2. Download or clone this repository.
3. Open a terminal in the project folder and run:

```
npm install
npm start
```

## APIs used

- [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api): finds the location of the town you type
- [Waktu Solat API](https://api.waktusolat.app): finds the JAKIM prayer zone for that location
- [JAKIM e-Solat](https://www.e-solat.gov.my): gives the official prayer times for that zone

## Pages

- `renderer/index.html`: Prayer Times page
- `renderer/reminder.html`: My Reminders page
