/*  _______           __ _______               __         __   
   |   |   |.-----.--|  |   _   |.-----.-----.|__|.-----.|  |_ 
   |       ||  _  |  _  |       ||__ --|__ --||  ||__ --||   _|
   |__|_|__||_____|_____|___|___||_____|_____||__||_____||____|
   (c) 2022-present FSG Modding.  MIT License. */

// Main Window UI

/* global l10n, fsgUtil, bootstrap */

let loadingModal = null

/*  __ ____   ______        
   |  |_   | |      |.-----.
   |  |_|  |_|  --  ||     |
   |__|______|______||__|__| */

function processL10N()          { clientGetL10NEntries(); l10n.langList_send() }
function clientChangeL10N()     { l10n.langList_change(fsgUtil.byId('language_select').value) }
function clientGetL10NEntries() {
	const l10nSendItems = new Set()

	fsgUtil.query('l10n').forEach((thisL10nItem) => {
		l10nSendItems.add(fsgUtil.getAttribNullError(thisL10nItem, 'name'))
	})

	l10n.getText_send(l10nSendItems)
}

window.l10n.receive('fromMain_langList_return', (listData, selected) => {
	fsgUtil.byId('language_select').innerHTML = listData.map((x) => {
		return fsgUtil.buildSelectOpt(x[0], x[1], selected)
	}).join('')
})
window.l10n.receive('fromMain_getText_return', (data) => {
	fsgUtil.query(`l10n[name="${data[0]}"]`).forEach((item) => { item.innerHTML = data[1] })
})
window.l10n.receive('fromMain_l10n_refresh', () => { processL10N() })

window.mods.receive('fromMain_loadingTotal', (count) => { fsgUtil.byId('count_total').innerHTML = count })
window.mods.receive('fromMain_loadingDone',  (count) => { fsgUtil.byId('count_done').innerHTML  = count })
window.mods.receive('fromMain_showLoading',  () => { loadingModal.show() })
window.mods.receive('fromMain_hideLoading',  () => { loadingModal.hide() })

window.mods.receive('fromMain_modList', (modList) => {
	const modTable = []
	const optList  = []
	Object.keys(modList).forEach((collection) => {
		const modRows = []
		modList[collection].mods.forEach((thisMod) => {
			modRows.push(makeModRow(
				`${collection}--${thisMod.uuid}`,
				thisMod.fileDetail.shortName,
				thisMod.modDesc.version,
				thisMod.badges,
				thisMod.canNotUse
			))
		})
		modTable.push(makeModCollection(
			collection,
			`${modList[collection].name} (${modList[collection].mods.length})`,
			modRows
		))
		optList.push(fsgUtil.buildSelectOpt(`collection--${collection}`, modList[collection].name, false))

	})
	fsgUtil.byId('collectionSelect').innerHTML = optList.join('')
	fsgUtil.byId('mod-collections').innerHTML  = modTable.join('')
	lastModSelect   = null
	lastTableSelect = null
	processL10N()
})


let lastModSelect   = null
let lastTableSelect = null


function updateModFilesColor() {
	const allModRows = document.querySelectorAll('.mod-row')

	allModRows.forEach((thisRow) => {
		const thisColor = thisRow.childNodes[0].childNodes[0].checked
		thisRow.querySelectorAll('td').forEach((thisTD) => {
			thisTD.classList[( thisColor===true ? 'add' : 'remove' )]('table-success')
		})
	})
}


function fileListClick(event) {
	if (event.target.tagName === 'INPUT' && event.target.className === 'form-check-input mod-folder-checkbox folder_master_check') {
		const thisModTable = document.getElementById(event.target.getAttribute('data-bs-target').substring(1)).querySelectorAll('input[type="checkbox"]')
		thisModTable.forEach((thisCheckBox) => {
			if ( ! thisCheckBox.parentElement.parentElement.classList.contains('disabled') ) {
				thisCheckBox.checked = event.target.checked
			}
		})

		const moveButtons = fsgUtil.byId('moveButtons').querySelectorAll('button')

		moveButtons.forEach((button) =>{
			button.classList[(event.target.checked)?'remove':'add']('disabled')
		})

		lastModSelect   = null
		lastTableSelect = null
		updateModFilesColor()
	}

	if (event.target.tagName === 'TD' && event.target.parentElement.className === 'mod-row') {
		const thisTable = event.target.closest('table').closest('tr').id
		const checkBox  = event.target.parentElement.querySelectorAll('input')[0]

		if ( lastTableSelect !== null && lastTableSelect !== thisTable ) {
			lastModSelect   = null
			lastTableSelect = thisTable
		}

		if ( !event.shiftKey || lastModSelect === null || event.target.parentElement.id === lastModSelect ) {
			checkBox.checked = !checkBox.checked
			lastModSelect    = event.target.parentElement.id
		} else {
			const thisModSelection = event.target.parentElement.parentElement.querySelectorAll('tr')
			let thisPosition = null
			let lastPosition = null

			for ( let i=0; i<thisModSelection.length; i++ ) {
				if (thisModSelection[i].id === event.target.parentElement.id ) {
					thisPosition = i
				}
				if (thisModSelection[i].id === lastModSelect ) {
					lastPosition = i
				}
			}

			const positionTestStart = Math.min(thisPosition, lastPosition)
			const positionTestEnd   = Math.max(thisPosition, lastPosition)
			const checkValue        = thisModSelection[lastPosition].querySelectorAll('input')[0].checked

			for ( let i=positionTestStart; i<=positionTestEnd; i++) {
				thisModSelection[i].querySelectorAll('input')[0].checked = checkValue
			}
			lastModSelect = null
		}

		let allChecked = true
		let noneChecked = true

		const thisModTable = event.target.closest('table').querySelectorAll('input[type="checkbox"]')

		thisModTable.forEach((thisCheckBox) => {
			if ( ! thisCheckBox.parentElement.parentElement.classList.contains('disabled') ) {
				if ( thisCheckBox.checked ) {
					noneChecked = false
				} else {
					allChecked = false
				}
			}
		})

		const tableCheck = event.target.closest('table').parentElement.closest('table').querySelectorAll(`input[data-bs-target="#${thisTable}"]`)[0]

		tableCheck.indeterminate = ! ( allChecked || noneChecked )

		if ( allChecked ) {
			tableCheck.checked = true
		} else if ( noneChecked ) {
			tableCheck.checked = false
		}

		const moveButtons = fsgUtil.byId('moveButtons').querySelectorAll('button')

		
		moveButtons.forEach((button) =>{
			button.classList[(!noneChecked)?'remove':'add']('disabled')
		})
		
		updateModFilesColor()
	}
}

function makeModCollection(id, name, modsRows) {
	let tableHTML = ''
	
	tableHTML += fsgUtil.buildTR('mod-table-folder')
	tableHTML += fsgUtil.buildTD('folder-icon collapsed', [['toggle', 'collapse'], ['target', `#${id}_mods`]])
	tableHTML += `${fsgUtil.getIconSVG('folder')}</td>`
	tableHTML += fsgUtil.buildTD('folder-name collapsed', [['toggle', 'collapse'], ['target', `#${id}_mods`]])
	tableHTML += `${name}</td>`
	tableHTML += `<td class="text-end"><input type="checkbox" data-bs-target="#${id}_mods" class="form-check-input mod-folder-checkbox folder_master_check"></td></tr>`

	tableHTML += fsgUtil.buildTR('mod-table-folder-detail collapse accordion-collapse', `${id}_mods`, 'data-bs-parent=".table"')
	tableHTML += '<td class="mod-table-folder-details-indent"></td>'
	tableHTML += '<td class="mod-table-folder-details px-0" colspan="2">'
	tableHTML += `<table class="w-100 py-0 my-0 table table-sm table-hover table-striped">${modsRows.join('')}</table>`
	tableHTML += '</td></tr>'
	return tableHTML
}

function makeModRow(id, name, version, badges, disabled = false) {
	return `<tr oncontextmenu="window.mods.openMod('${id}')" onDblClick="window.mods.openMod('${id}')" class="mod-row${(disabled===true)?' disabled bg-opacity-25 bg-danger':''}" id="${id}"><td><input type="checkbox" class="form-check-input"></td><td>${name} ${badges}</td><td>${version}</td></tr>`
}

function clientMakeListActive() {
	window.mods.makeActive(fsgUtil.byId('collectionSelect').value)
}

function clientBatchOperation(mode) {
	const selectedMods = []
	const allModRows   = document.querySelectorAll('.mod-row')

	allModRows.forEach((thisRow) => {
		if ( thisRow.childNodes[0].childNodes[0].checked ) {
			selectedMods.push(thisRow.id)
		}
	})

	switch (mode) {
		case 'copy':
			window.mods.copyMods(selectedMods)
			break
		case 'move':
			window.mods.moveMods(selectedMods)
			break
		case 'delete':
			window.mods.deleteMods(selectedMods)
			break
		default:
			console.log('inconceivable!')
			break
	}
}

function deSelectAll() {
	const moveButtons = fsgUtil.byId('moveButtons').querySelectorAll('button')
	const allModRows  = document.querySelectorAll('.mod-row')
	const tableChecks = document.querySelectorAll('.folder_master_check')

	tableChecks.forEach((thisCheck) => { thisCheck.checked = false; thisCheck.indeterminate = false })

	allModRows.forEach((thisRow) => { thisRow.childNodes[0].childNodes[0].checked = false })

	moveButtons.forEach((button) => { button.classList.add('disabled') })

	updateModFilesColor()
}

window.addEventListener('hide.bs.collapse', () => { deSelectAll() })
window.addEventListener('show.bs.collapse', () => { deSelectAll() })

window.addEventListener('DOMContentLoaded', () => {
	loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'))
	processL10N()
})

window.addEventListener('click', (event) => {
	fileListClick(event)
})

window.addEventListener('scroll', () => {
	const scrollValue = this.scrollY +  140
	const moveButtons = fsgUtil.byId('moveButtons')
	try {
		moveButtons.style.top = `${scrollValue}px`
	} catch { return }
})
