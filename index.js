const puppeteer = require("puppeteer")
const format = require("timeago.js").format
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
		const succces = versionCache.set(versionCacheKey, versions, 30 * 60) // 30 minutes
		versions.cached = succces
	}
	res.send(versions)
})

app.listen(PORT)
console.log(`running @ localhost:${PORT}`)

async function getExtensionVersions() {
	const browser = await puppeteer.launch({ args: ['--no-sandbox'] }) // heroku build pack fix

	let chrome = getCurrentChromeVersion(browser)
	let firefox = getCurrentFirefoxVersion(browser)
	let edge = getCurrentEdgeVersion(browser)
	let safari = getCurrentSafariVersion(browser)

	let scraped_versions = await Promise.all([chrome, firefox, edge, safari]);

	const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	const today = new Date()
	
	const versions = {
		date: `${months[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}`,
		chrome: scraped_versions[0],
		firefox: scraped_versions[1],
		edge: scraped_versions[2],
		safari: scraped_versions[3],
	}

	await browser.close()

	return versions
}

async function getCurrentChromeVersion(browser) {
	try {
		const page = await browser.newPage()
		await page.goto(
			"https://chrome.google.com/webstore/detail/momentum/laookkfknpbbblfpciffpaejjkokdgca"
		)

		try {
			await page.waitFor(".h-C-b-p-D-md")
		} catch {
			await page.waitFor(".DuMIQc")
			await page.evaluate(() => {
				const agreeButton = document.getElementsByClassName("DuMIQc")[3]
				agreeButton.click()
			})
			await page.waitFor(".h-C-b-p-D-md")
		}

		const version = await page.evaluate(() => {
			const version_span = document.getElementsByClassName("h-C-b-p-D-md")[0]
			return version_span.innerHTML
		})

		await page.waitFor(".h-C-b-p-D-xh-hh")
		const lastUpdated = await page.evaluate(() => {
			const last_update_span = document.getElementsByClassName("h-C-b-p-D-xh-hh")[0]
			return last_update_span.innerHTML
		})

		const timeAgo = format(lastUpdated)

		return { version, lastUpdated, timeAgo }
	} catch (error) {
		console.log(error)
		return "error"
	}
}

async function getCurrentFirefoxVersion(browser) {
	try {
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

		const timeAgo = format(lastUpdated)

		return { version, lastUpdated, timeAgo }
	} catch (error) {
		console.log(error)
		return "error"
	}
}

async function getCurrentEdgeVersion(browser) {
	try {
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
			return `${last_updated_split[1].substring(0, 3)} ${last_updated_split[2]} ${last_updated_split[3]}`
		})

		const timeAgo = format(lastUpdated)

		return { version, lastUpdated, timeAgo }
	} catch (error) {
		console.log(error)
		return "error"
	}
}

async function getCurrentSafariVersion(browser) {
	try {
		const page = await browser.newPage()
		await page.goto(
			"https://apps.apple.com/ca/app/momentum/id1564329434"
		)

		const version = await page.evaluate(() => {
			const version_p = document.getElementsByClassName("whats-new__latest__version")[0]
			return version_p && version_p.innerHTML.split(" ")[1]
		})

		const lastUpdated = await page.evaluate(() => {
			return document.querySelectorAll("[data-test-we-datetime]")[0].innerText.replace('.', '')
		})

		const timeAgo = format(lastUpdated)

		return { version, lastUpdated, timeAgo }
	} catch (error) {
		console.log(error)
		return "error"
	}
}