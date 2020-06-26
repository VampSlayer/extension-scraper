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
console.log("running @ localhost:3000")

async function getExtensionVersions() {
	const chrome = await getCurrentChromeVersion()
	const firefox = await getCurrentFirefoxVersion()
	const edge = await getCurrentEdgeVersion()
	const versions = {
		date: Date.now(),
		chrome: chrome,
		firefox: firefox,
		edge: edge,
	}
	return versions
}

async function getCurrentChromeVersion() {
	const browser = await puppeteer.launch()
	const page = await browser.newPage()
	await page.goto(
		"https://chrome.google.com/webstore/detail/momentum/laookkfknpbbblfpciffpaejjkokdgca"
	)

	await page.waitFor(".h-C-b-p-D-md")
	const version = await page.evaluate(() => {
		const version_span = document.getElementsByClassName("h-C-b-p-D-md")[0]
		return version_span.innerHTML
	})

	await browser.close()
	return version
}

async function getCurrentFirefoxVersion() {
	const browser = await puppeteer.launch()
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

	await browser.close()
	return version
}

async function getCurrentEdgeVersion() {
	const browser = await puppeteer.launch()
	const page = await browser.newPage()
	await page.goto(
		"https://microsoftedge.microsoft.com/addons/detail/momentum/jdoanlopeanabgejgmdncljhkdplcfed"
	)

	await page.waitForSelector("#versionText")

	const version = await page.evaluate(() => {
		const version_span = document.getElementById("versionText")
		return version_span.innerHTML
	})

	await browser.close()
	return version
}
