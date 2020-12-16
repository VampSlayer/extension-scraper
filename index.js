const puppeteer = require("puppeteer")
const express = require("express")
const NodeCache = require("node-cache")

const versionCache = new NodeCache()
const app = express()
const PORT = process.env.PORT || 3000;

app.get("/", async function (req, res) {
	const versionCacheKey = "momo-ext-versions"
	let versions = versionCache.get(versionCacheKey)
	if (versions === undefined) {
		versions = await getExtensionVersions()
		const succces = versionCache.set(versionCacheKey, versions, 1800) // 30 minutes
		versions.cached = succces
	}
	res.send(versions)
})

app.listen(PORT)
console.log(`running @ localhost:${PORT}`)

async function getExtensionVersions() {
	const browser = await puppeteer.launch({ args: ['--no-sandbox'] }) // heroku build pack fix
	let chrome
	let firefox
	let edge

	try {
		chrome = await getCurrentChromeVersion(browser)
	} catch (error) {
		console.error(error)
		chrome = 'error'
	}

	try {
		firefox = await getCurrentFirefoxVersion(browser)
	} catch (error) {
		console.error(error)
		firefox = 'error'
	}

	try {
		edge = await getCurrentEdgeVersion(browser)
	} catch (error) {
		console.error(error)
		edge = 'error'
	}
	
	const versions = {
		date: new Date().toISOString(),
		chrome: chrome,
		firefox: firefox,
		edge: edge,
	}
	await browser.close()
	return versions
}

async function getCurrentChromeVersion(browser) {
	const page = await browser.newPage()
	await page.goto(
		"https://chrome.google.com/webstore/detail/momentum/laookkfknpbbblfpciffpaejjkokdgca"
	)

	await page.waitFor(".h-C-b-p-D-md")
	const version = await page.evaluate(() => {
		const version_span = document.getElementsByClassName("h-C-b-p-D-md")[0]
		return version_span.innerHTML
	})

	await page.waitFor(".h-C-b-p-D-xh-hh")
	const lastUpdated = await page.evaluate(() => {
		const last_update_span = document.getElementsByClassName("h-C-b-p-D-xh-hh")[0]
		return last_update_span.innerHTML
	})

	return { version, lastUpdated }
}

async function getCurrentFirefoxVersion(browser) {
	const page = await browser.newPage()
	await page.goto(
		"https://addons.mozilla.org/en-CA/firefox/addon/momentumdash/"
	)

	await page.waitFor(".AddonMoreInfo-version")
	const version = await page.evaluate(() => {
		const version_span = document.getElementsByClassName(
			"AddonMoreInfo-version"
		)[0]
		return version_span.innerHTML
	})

	await page.waitFor(".AddonMoreInfo-last-updated")
	const lastUpdated = await page.evaluate(() => {
		const last_updated = document.getElementsByClassName(
			"AddonMoreInfo-last-updated"
		)[0]
		const inner_html = last_updated.innerHTML
		return inner_html.substring(inner_html.lastIndexOf("(") + 1, inner_html.lastIndexOf(")"))
	})

	return { version, lastUpdated }
}

async function getCurrentEdgeVersion(browser) {
	const page = await browser.newPage()
	await page.goto(
		"https://microsoftedge.microsoft.com/addons/detail/momentum/jdoanlopeanabgejgmdncljhkdplcfed"
	)

	await page.waitForSelector("#versionLabel")
	const version = await page.evaluate(() => {
		const version_span = document.getElementById("versionLabel")
		return version_span.innerHTML.split(' ')[1]
	})

	await page.waitForSelector("#lastUpdatedOnHeader")
	const lastUpdated = await page.evaluate(() => {
		const last_updated = document.getElementById("lastUpdatedOnHeader")
		const last_updated_split = last_updated.innerHTML.split(' ')
		return `${last_updated_split[1]} ${last_updated_split[2]} ${last_updated_split[3]}`
	})

	return { version, lastUpdated }
}
