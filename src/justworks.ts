import icalGen from "ical-generator";
import nodeIcal, {type CalendarResponse} from "node-ical";
import type {Express} from "express";

// Find the calendar ID
const CAL_ID = process.env.CAL_ID;

// Set up the path
const BASE_JW_CAL_URL = "https://secure.justworks.com/calendar/ical/";
const CAL_URL = BASE_JW_CAL_URL + CAL_ID;

// Read the group config from the env or default to no special groups
let groupConfig = JSON.parse(process.env.GROUP_CONFIG ?? "{}")

// Set up calendar caching
let calendarCache: CalendarResponse = {}

await fetchAndCacheCalendar()
setInterval(fetchAndCacheCalendar, 15 * 60 * 1000)

async function fetchAndCacheCalendar() {
  calendarCache = await nodeIcal.async.fromURL(CAL_URL)
}

// Endpoint handling
export const calendarEndpoint = (app: Express) =>
  app.get("/cal/:id", async (req, res) => {
    console.log(`Calendar request for ${req.params.id}, group = ${req.query.group}, type = ${req.query.type}`)

    const calId = req.params.id
    if (!calId || calId !== CAL_ID) {
      res.sendStatus(404)
      return
    }

    res.type("text/calendar; charset=utf-8");
    const {type, group} = req.query
    switch (type) {
      case "payday":
        res.send(getPaydayCal().toString())
        return
      case "pto":
        res.send(getPtoCal(group as string).toString());
        return
      case "birthdays":
        res.send(getBirthdayCal(group as string).toString());
        return
      default:
        res.send(defaultCal().toString())
    }
  })

// Default "all" calendar
function defaultCal() {
  const cal = icalGen({name: "All Events"})

  Object.keys(calendarCache).forEach((key) => {
    const entry = calendarCache[key]
    if (entry && entry.type === 'VEVENT') {
      cal.createEvent({
        id: entry.uid,
        start: entry.start,
        end: entry.end,
        allDay: entry.datetype === 'date',
        summary: entry.summary,
        description: entry.description,
      })
    }
  })
  return cal
}

// Logic for providing the actual calendar types
function getPaydayCal() {
  const cal = icalGen({name: "Payday"})

  Object.keys(calendarCache).forEach((key) => {
    const entry = calendarCache[key]
    if (entry && entry.type === 'VEVENT' && entry.summary.includes("Payday")
    ) {
      cal.createEvent({
        id: entry.uid,
        start: entry.start,
        end: entry.end,
        allDay: entry.datetype === 'date',
        summary: entry.summary,
        description: entry.description,
      })
    }
  })
  return cal
}

export function getPtoCal(group: string | undefined) {
  const cal = icalGen({name: "PTO"})
  const g = group ? groupConfig[group] as string[] : undefined

  Object.keys(calendarCache).forEach((key) => {
    const entry = calendarCache[key]
    if (entry && entry.type === 'VEVENT' && entry.summary.includes("PTO") && (g === undefined || g.some((v) => entry.summary.startsWith(v)))
    ) {
      cal.createEvent({
        id: entry.uid,
        start: entry.start,
        end: entry.end,
        allDay: entry.datetype === 'date',
        summary: entry.summary,
        description: entry.description,
      })
    }
  })
  return cal
}

export function getBirthdayCal(group: string | undefined) {
  const cal = icalGen({name: "Birthdays"})
  const g = group ? groupConfig[group] as string[] : undefined

  Object.keys(calendarCache).forEach((key) => {
    const entry = calendarCache[key]
    if (entry && entry.type === 'VEVENT' && entry.summary.includes("birthday") && (g === undefined || g.some((v) => entry.summary.startsWith(v)))
    ) {
      cal.createEvent({
        id: entry.uid,
        start: entry.start,
        end: entry.end,
        allDay: entry.datetype === 'date',
        summary: entry.summary,
        description: entry.description,
      })
    }
  })
  return cal
}
