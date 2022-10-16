/*  _______           __ _______               __         __   
   |   |   |.-----.--|  |   _   |.-----.-----.|__|.-----.|  |_ 
   |       ||  _  |  _  |       ||__ --|__ --||  ||__ --||   _|
   |__|_|__||_____|_____|___|___||_____|_____||__||_____||____|
   (c) 2022-present FSG Modding.  MIT License. */

// Version window UI

/* global l10n, fsgUtil, bootstrap */


/*  __ ____   ______        
   |  |_   | |      |.-----.
   |  |_|  |_|  --  ||     |
   |__|______|______||__|__| */

function processL10N()          { clientGetL10NEntries() }
function clientGetL10NEntries() {
	const l10nSendItems = new Set()

	fsgUtil.query('l10n').forEach((thisL10nItem) => {
		l10nSendItems.add(fsgUtil.getAttribNullError(thisL10nItem, 'name'))
	})

	l10n.getText_send(l10nSendItems)
}

window.l10n.receive('fromMain_getText_return', (data) => {
	fsgUtil.query(`l10n[name="${data[0]}"]`).forEach((item) => { item.innerHTML = data[1] })
})
window.l10n.receive('fromMain_getText_return_title', (data) => {
	fsgUtil.query(`l10n[name="${data[0]}"]`).forEach((item) => {
		item.closest('span').title = data[1]
		new bootstrap.Tooltip(item.closest('span'))
	})
})
window.l10n.receive('fromMain_l10n_refresh', () => { processL10N() })


window.mods.receive('fromMain_modList', (modList) => {
	const collectionMap      = {}
	const nameTitleMap       = {}
	const versionList        = {}
	const versionListNoMatch = {}

	Object.keys(modList).forEach((collection) => {
		collectionMap[collection] = modList[collection].name
		modList[collection].mods.forEach((mod) => {
			const modName = mod.fileDetail.shortName
			const modVer  = mod.modDesc.version

			nameTitleMap[modName] ??= mod.l10n.title
			versionList[modName]  ??= []
			versionList[modName].push([collection, modVer])
		})
	})
	Object.keys(versionList).forEach((key) => {
		if ( versionList[key].length < 2 ) { delete versionList[key] }
	})

	Object.keys(versionList).forEach((key) => {
		const firstVer = versionList[key][0][1]
		let   deleteMe = false
		for ( let i = 1; i < versionList[key].length; i++ ) {
			if ( firstVer !== versionList[key][i][1] ) {
				deleteMe = true
				versionListNoMatch[key] = versionList[key]
			}
		}
		if ( deleteMe ) { delete versionList[key] }
	})

	const listHTML = []
	Object.keys(versionListNoMatch).forEach((key) => {
		const theseCollections = []
		versionListNoMatch[key].forEach((versionArray) => {
			theseCollections.push(`${collectionMap[versionArray[0]]}: ${versionArray[1]}`)
		})
		listHTML.push(makeLine('diff', nameTitleMap[key], key, theseCollections))
	})

	Object.keys(versionList).forEach((key) => {
		const theseCollections = []
		versionList[key].forEach((versionArray) => { theseCollections.push(collectionMap[versionArray[0]]) })
		listHTML.push(makeLine('same', nameTitleMap[key], key, theseCollections))
	})

	fsgUtil.byId('modList').innerHTML = listHTML.join('')
	processL10N()
})


function makeLine(type, realName, shortName, collections) {
	const color = ( type === 'same' ) ? 'list-group-item-secondary' : 'list-group-item-danger'
	const l10n  = ( type === 'same' ) ? 'version_same' : 'version_diff'
	const thisHTML = []
	
	thisHTML.push(`<li class="list-group-item d-flex justify-content-between align-items-start ${color}">`)
	thisHTML.push('<div class="ms-2 me-auto">')
	thisHTML.push(`<div class="fw-bold">${shortName}</div>`)
	thisHTML.push(`<div class="small">${realName}</div>`)
	thisHTML.push(`<div class="text-black small ps-3"><l10n name="version_collections"></l10n>: ${collections.join(', ')}</div>`)
	thisHTML.push('</div>')
	thisHTML.push(`<span class="badge bg-dark bg-gradient rounded-1 ms-1"><l10n name="${l10n}"></l10n></span>`)
	thisHTML.push('</li>')

	return thisHTML.join('')
}

