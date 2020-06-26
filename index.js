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
	const chrome = await getCurrentChromeVersion(browser)
	const firefox = await getCurrentFirefoxVersion(browser)
	const edge = await getCurrentEdgeVersion(browser)
	const versions = {
		date: Date.now(),
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

	return version
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

	return version
}

async function getCurrentEdgeVersion(browser) {
	const page = await browser.newPage()
	await page.goto(
		"https://microsoftedge.microsoft.com/addons/detail/momentum/jdoanlopeanabgejgmdncljhkdplcfed"
	)

	await page.waitForSelector("#versionText")

	const version = await page.evaluate(() => {
		const version_span = document.getElementById("versionText")
		return version_span.innerHTML
	})

	return version
}
